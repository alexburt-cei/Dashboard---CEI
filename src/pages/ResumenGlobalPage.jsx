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
import {
  formatEURCompact,
  formatInteger,
  formatPercent,
  formatSignedEUR,
} from '../utils/format';

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
        <h1 className="panel__title">Resumen Global</h1>
        <p className="panel__empty">
          Sube el Excel de ingresos para ver la comparativa histórica, el ritmo y el cumplimiento.
        </p>
        <FileUpload />
      </section>
    );
  }

  const cards = resumen
    ? [
        {
          id: 'crecimiento',
          label: 'Crecimiento vs año anterior',
          value: resumen.crecimiento?.hayBase
            ? formatPercent(resumen.crecimiento.variacion)
            : '—',
          hint: resumen.crecimiento?.hayBase
            ? `${temporadaLabel(resumen.crecimiento.temporadaAnterior)} al mismo avance`
            : 'sin datos del año anterior',
          delta:
            resumen.crecimiento?.variacion == null
              ? undefined
              : {
                  text: `${formatSignedEUR(
                    resumen.crecimiento.actual - resumen.crecimiento.anterior,
                  )} vs año anterior`,
                  direction: resumen.crecimiento.variacion >= 0 ? 'up' : 'down',
                },
        },
        {
          id: 'runrate',
          label: 'Run rate',
          value: resumen.runRate ? formatEURCompact(resumen.runRate.proyeccion) : '—',
          hint: resumen.runRate
            ? `cierre estimado · ${formatPercent(resumen.runRate.fraccion)} de la convocatoria`
            : 'convocatoria demasiado reciente para proyectar',
        },
        {
          id: 'stand',
          label: 'Where we stand',
          value: resumen.whereWeStand ? formatPercent(resumen.whereWeStand.cumplimiento) : '—',
          hint: resumen.whereWeStand
            ? `objetivo de ${temporadaLabel(resumen.whereWeStand.temporada)}`
            : '',
          delta:
            resumen.whereWeStand?.ahead == null
              ? undefined
              : {
                  text: `${resumen.whereWeStand.ahead ? 'Ahead' : 'Behind'} · ${formatSignedEUR(
                    resumen.whereWeStand.gapProrrateado,
                  )} vs ritmo`,
                  direction: resumen.whereWeStand.ahead ? 'up' : 'down',
                },
        },
        {
          id: 'ytd',
          label: 'Year-to-date vs Budget',
          value: resumen.yearToDate ? formatPercent(resumen.yearToDate.cumplimiento) : '—',
          hint: resumen.yearToDate ? `año ${resumen.yearToDate.anio}` : '',
          delta:
            resumen.yearToDate?.ahead == null
              ? undefined
              : {
                  text: `${formatSignedEUR(resumen.yearToDate.diferencia)} vs budget`,
                  direction: resumen.yearToDate.ahead ? 'up' : 'down',
                },
        },
      ]
    : [];

  return (
    <>
      <div className="resumen__head">
        <h1 className="resumen__title">Resumen Global</h1>
        {resumen ? (
          <p className="resumen__meta">
            {temporadaLabel(resumen.temporada)} · datos hasta{' '}
            {resumen.corte?.toISOString().slice(0, 10)} · {formatInteger(filtradas.length)} filas
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
          <p className="panel__empty">
            Los filtros no dejan ninguna fila. Amplía el rango o limpia la selección.
          </p>
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
