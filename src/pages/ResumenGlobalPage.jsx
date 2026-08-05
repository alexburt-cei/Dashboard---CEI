import { useMemo, useState } from 'react';

import ComparativeTable from '../components/resumen/ComparativeTable';
import FilterRow from '../components/resumen/FilterRow';
import SeasonComparisonChart from '../components/resumen/SeasonComparisonChart';
import SummaryCards from '../components/SummaryCards';
import { CanalPanel, MatriculasPanel } from '../components/resumen/EnrolmentPanels';
import FileUpload from '../components/FileUpload';
import { useData } from '../context/DataContext';
import { getUniqueValues } from '../utils/dataTransform';
import { aplicarFiltros, buildResumenGlobal } from '../utils/resumenGlobal';
import { temporadaLabel } from '../utils/temporada';
import { useFormatters } from '../utils/useFormatters';
import { useI18n } from '../i18n/I18nContext';

const FILTROS_VACIOS = { desde: '', hasta: '', sedes: [], formaciones: [], areas: [] };

/** 'YYYY-MM-DD' -> Date en UTC. Sin esto un filtro se desplaza un día por zona. */
function parseInputDate(value) {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Resumen Global: la vista de dirección.
 *
 * A diferencia de las pestañas de Reales y Objetivos, que describen *qué* se ha
 * facturado, esta página responde a *cómo vamos* — y para eso todo es
 * comparativo: contra el año anterior, contra el objetivo y contra el ritmo
 * necesario. Cada cifra que no es un dato observado va marcada como estimación.
 */
export default function ResumenGlobalPage() {
  const { rows, hasData } = useData();
  const { t, locale } = useI18n();
  const { formatEURCompact, formatInteger, formatPercent, formatSignedEUR } = useFormatters();
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);

  const opciones = useMemo(
    () => ({
      sedes: getUniqueValues(rows, 'sede'),
      formaciones: getUniqueValues(rows, 'tipoFormacion'),
      areas: getUniqueValues(rows, 'area'),
    }),
    [rows],
  );

  const filtradas = useMemo(
    () =>
      aplicarFiltros(rows, {
        ...filtros,
        desde: parseInputDate(filtros.desde),
        hasta: parseInputDate(filtros.hasta),
      }),
    [rows, filtros],
  );

  const resumen = useMemo(() => buildResumenGlobal(filtradas), [filtradas]);

  const activos =
    (filtros.desde ? 1 : 0) +
    (filtros.hasta ? 1 : 0) +
    filtros.sedes.length +
    filtros.formaciones.length +
    filtros.areas.length;

  if (!hasData) {
    return (
      <section className="panel panel--empty">
        <h1 className="panel__title">{t('resumen.titulo')}</h1>
        <p className="panel__empty">{t('vacio.resumen')}</p>
        <FileUpload />
      </section>
    );
  }

  const cards = resumen
    ? [
        {
          id: 'crecimiento',
          label: t('resumen.crecimiento'),
          value: resumen.crecimiento?.hayBase
            ? formatPercent(resumen.crecimiento.variacion)
            : '—',
          hint: resumen.crecimiento?.hayBase
            ? t('resumen.crecimientoHint', {
                temporada: temporadaLabel(resumen.crecimiento.temporadaAnterior, locale),
              })
            : t('resumen.sinBase'),
          delta:
            resumen.crecimiento?.variacion == null
              ? undefined
              : {
                  text: t('resumen.vsAnterior', {
                    valor: formatSignedEUR(
                      resumen.crecimiento.actual - resumen.crecimiento.anterior,
                    ),
                  }),
                  direction: resumen.crecimiento.variacion >= 0 ? 'up' : 'down',
                },
        },
        {
          id: 'runrate',
          label: t('resumen.runRate'),
          value: resumen.runRate ? formatEURCompact(resumen.runRate.proyeccion) : '—',
          hint: resumen.runRate
            ? t('resumen.runRateHint', { porcentaje: formatPercent(resumen.runRate.fraccion) })
            : t('resumen.runRateCorto'),
        },
        {
          id: 'stand',
          label: t('resumen.whereWeStand'),
          value: resumen.whereWeStand ? formatPercent(resumen.whereWeStand.cumplimiento) : '—',
          hint: resumen.whereWeStand
            ? t('resumen.objetivoDe', { temporada: temporadaLabel(resumen.whereWeStand.temporada, locale) })
            : '',
          delta:
            resumen.whereWeStand?.ahead == null
              ? undefined
              : {
                  text: `${
                    resumen.whereWeStand.ahead ? t('canal.ahead') : t('canal.behind')
                  } · ${t('resumen.vsRitmo', {
                    valor: formatSignedEUR(resumen.whereWeStand.gapProrrateado),
                  })}`,
                  direction: resumen.whereWeStand.ahead ? 'up' : 'down',
                },
        },
        {
          id: 'ytd',
          label: t('resumen.ytd'),
          value: resumen.yearToDate ? formatPercent(resumen.yearToDate.cumplimiento) : '—',
          hint: resumen.yearToDate ? t('resumen.anio', { anio: resumen.yearToDate.anio }) : '',
          delta:
            resumen.yearToDate?.ahead == null
              ? undefined
              : {
                  text: t('resumen.vsBudget', {
                    valor: formatSignedEUR(resumen.yearToDate.diferencia),
                  }),
                  direction: resumen.yearToDate.ahead ? 'up' : 'down',
                },
        },
      ]
    : [];

  return (
    <>
      <div className="resumen__head">
        <h1 className="resumen__title">{t('resumen.titulo')}</h1>
        {resumen ? (
          <p className="resumen__meta">
            {t('resumen.meta', {
              temporada: temporadaLabel(resumen.temporada, locale),
              fecha: resumen.corte?.toISOString().slice(0, 10),
              filas: formatInteger(filtradas.length),
            })}
          </p>
        ) : null}
      </div>

      <FilterRow
        valores={filtros}
        opciones={opciones}
        activos={activos}
        onChange={(parcial) => setFiltros((prev) => ({ ...prev, ...parcial }))}
        onReset={() => setFiltros(FILTROS_VACIOS)}
      />

      {!resumen ? (
        <section className="panel">
          <p className="panel__empty">{t('vacio.filtros')}</p>
        </section>
      ) : (
        <>
          <SummaryCards cards={cards} />

          <div className="panel-grid">
            <SeasonComparisonChart serie={resumen.serie} />
            <ComparativeTable tabla={resumen.tabla} />
          </div>

          <div className="panel-grid">
            <CanalPanel canales={resumen.canales} />
            <MatriculasPanel matriculas={resumen.matriculas} />
          </div>
        </>
      )}
    </>
  );
}
