import { useMemo } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';

import FileUpload from './FileUpload';
import IssuesPanel from './IssuesPanel';
import ProgressBar from './ProgressBar';
import SummaryCards from './SummaryCards';
import RevenueByCategory from './charts/RevenueByCategory';
import RevenueTrendChart from './charts/RevenueTrendChart';
import NotFoundPage from '../pages/NotFoundPage';
import { getDimensionBySlug } from '../constants/dimensions';
import { getSedeColor, isSedeDimension } from '../constants/sedeColors';
import { DEFAULT_SCOPE_SLUG, filterByScope, getScopeBySlug } from '../constants/scopes';
import { useFormatters } from '../utils/useFormatters';
import { useI18n } from '../i18n/I18nContext';
import { useData } from '../context/DataContext';
import {
  MAX_CATEGORIAS_COLOREADAS,
  buildComparison,
  filterByTipoDato,
  groupByField,
  groupByPeriodo,
  summarize,
  totalIngreso,
} from '../utils/dataTransform';


/**
 * Cuerpo de una pestaña. Sirve a las seis combinaciones de sección x dimensión:
 * la sección llega por contexto del Outlet y la dimensión por parámetro de
 * ruta, y de ahí sale el campo por el que se agrupa.
 */
export default function DimensionDashboard() {
  const { section } = useOutletContext();
  const { dimension: dimensionSlug, scope: scopeSlug } = useParams();
  const { t } = useI18n();
  const { formatEURCompact, formatInteger, formatPercent, formatSignedEUR } = useFormatters();
  const { rows, issues, hasData } = useData();

  const dimension = getDimensionBySlug(dimensionSlug);
  const field = dimension?.field ?? null;

  // El memo se declara antes de cualquier return: los hooks no pueden quedar
  // detrás de una condición.
  const view = useMemo(() => {
    if (!field) return null;

    // El recorte se aplica ANTES de agrupar, y también a los totales de
    // cumplimiento: si el ámbito filtrara sólo las gráficas, el porcentaje de
    // abajo compararía las filas de Madrid contra el objetivo de toda España.
    const scopedRows = filterByScope(rows, scopeSlug);
    const sectionRows = filterByTipoDato(scopedRows, section.tipoDato);

    return {
      summary: summarize(sectionRows, field),
      byCategory: groupByField(sectionRows, field, { limit: MAX_CATEGORIAS_COLOREADAS }),
      byPeriodo: groupByPeriodo(sectionRows),
      comparison: buildComparison(scopedRows, field),
      totalReal: totalIngreso(filterByTipoDato(scopedRows, 'real')),
      totalObjetivo: totalIngreso(filterByTipoDato(scopedRows, 'objetivo')),
    };
  }, [rows, section.tipoDato, field, scopeSlug]);

  // Un ámbito inventado en la URL cae en NotFound, igual que una dimensión
  // inventada: es preferible decirlo a renderizar el total en silencio.
  if (!dimension || !getScopeBySlug(scopeSlug)) return <NotFoundPage />;

  if (!hasData) {
    return (
      <div className="empty-state">
        <p className="empty-state__title">{t('vacio.titulo')}</p>
        <p className="empty-state__body">
          {t('vacio.detalle', { dimension: t(`dim.${dimension.slug}`).toLowerCase() })}
        </p>
        <FileUpload />
      </div>
    );
  }

  const { summary, byCategory, byPeriodo, comparison, totalReal, totalObjetivo } = view;
  const isObjetivos = section.tipoDato === 'objetivo';

  if (summary.registros === 0) {
    // Dos motivos distintos para una pantalla vacía, y conviene no confundirlos:
    // que el archivo no traiga filas de este Tipo Dato, o que el ámbito elegido
    // se las haya llevado todas. Decir lo primero cuando pasa lo segundo manda a
    // revisar el Excel en vez de a cambiar de pestaña.
    const vaciaPorAmbito = scopeSlug !== DEFAULT_SCOPE_SLUG;

    return (
      <>
        <IssuesPanel issues={issues} />
        <div className="empty-state">
          <p className="empty-state__title">
            {vaciaPorAmbito
              ? t('vacio.ambitoTitulo', { ambito: t(`scope.${scopeSlug}`) })
              : t('vacio.tipoDatoTitulo', { seccion: t(`nav.${section.slug}`).toLowerCase() })}
          </p>
          <p className="empty-state__body">
            {vaciaPorAmbito
              ? t('vacio.ambitoDetalle', { ambito: t(`scope.${scopeSlug}`) })
              : t('vacio.tipoDatoDetalle', {
                  tipo: isObjetivos ? t('tabla.objetivo') : t('comp.datoReal'),
                })}
          </p>
        </div>
      </>
    );
  }

  const cumplimientoGlobal = totalObjetivo === 0 ? null : totalReal / totalObjetivo;

  const cards = [
    {
      id: 'total',
      label: isObjetivos ? t('card.objetivoTotal') : t('card.ingresosTotales'),
      value: formatEURCompact(summary.total),
      hint: t('card.registros', { n: formatInteger(summary.registros) }),
    },
    {
      id: 'media',
      label: t('card.mediaMensual'),
      value: formatEURCompact(summary.mediaMensual),
      hint: t('card.mesesConDatos', { n: formatInteger(summary.periodos) }),
    },
    {
      id: 'categorias',
      label: t(`dim.${dimension.slug}`),
      value: formatInteger(summary.categorias),
      hint: summary.top ? t('card.mayor', { valor: summary.top.key }) : undefined,
    },
  ];

  if (isObjetivos) {
    cards.push({
      id: 'cumplimiento',
      label: t('card.cumplimientoGlobal'),
      value: formatPercent(cumplimientoGlobal),
      delta:
        cumplimientoGlobal === null
          ? undefined
          : {
              text: `${formatSignedEUR(totalReal - totalObjetivo)} vs objetivo`,
              direction: totalReal >= totalObjetivo ? 'up' : 'down',
            },
    });
  } else if (summary.top) {
    cards.push({
      id: 'top',
      label: t('card.mayorDe', { dimension: t(`dim.${dimension.slug}`).toLowerCase() }),
      value: formatEURCompact(summary.top.total),
      hint: t('card.delTotal', { valor: summary.top.key, porcentaje: formatPercent(summary.top.share) }),
    });
  }

  return (
    <>
      <IssuesPanel issues={issues} />

      <SummaryCards cards={cards} />

      <div className="panel-grid">
        <RevenueByCategory
          data={byCategory}
          // La etiqueta traducida, no la del registro: `dimension.label` es la
          // constante en castellano y viajaba tal cual al título de la gráfica,
          // dejando un «Revenue by Tipo de Formación» a medio traducir.
          dimensionLabel={t(`dim.${dimension.slug}`)}
          // Sólo la dimensión Sede tiene color por entidad; en Formación y Área
          // el color no significa nada y las barras comparten el suyo.
          colorFor={isSedeDimension(dimensionSlug) ? getSedeColor : undefined}
        />
        <RevenueTrendChart data={byPeriodo} />
      </div>

      {isObjetivos ? (
        <section className="panel">
          <h2 className="panel__title">
            {t('chart.cumplimientoPor', { dimension: t(`dim.${dimension.slug}`).toLowerCase() })}
          </h2>
          <p className="panel__subtitle">{t('chart.ingresoRealSobreObjetivo')}</p>
          <div className="progress-list">
            {comparison.map((item) => (
              <ProgressBar
                key={item.key}
                label={item.key}
                real={item.real}
                objetivo={item.objetivo}
                cumplimiento={item.cumplimiento}
              />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
