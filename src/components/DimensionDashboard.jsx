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
import { formatEURCompact, formatInteger, formatPercent, formatSignedEUR } from '../utils/format';

/**
 * Cuerpo de una pestaña. Sirve a las seis combinaciones de sección x dimensión:
 * la sección llega por contexto del Outlet y la dimensión por parámetro de
 * ruta, y de ahí sale el campo por el que se agrupa.
 */
export default function DimensionDashboard() {
  const { section } = useOutletContext();
  const { dimension: dimensionSlug } = useParams();
  const { rows, issues, hasData } = useData();

  const dimension = getDimensionBySlug(dimensionSlug);
  const field = dimension?.field ?? null;

  // El memo se declara antes de cualquier return: los hooks no pueden quedar
  // detrás de una condición.
  const view = useMemo(() => {
    if (!field) return null;

    const sectionRows = filterByTipoDato(rows, section.tipoDato);

    return {
      summary: summarize(sectionRows, field),
      byCategory: groupByField(sectionRows, field, { limit: MAX_CATEGORIAS_COLOREADAS }),
      byPeriodo: groupByPeriodo(sectionRows),
      comparison: buildComparison(rows, field),
      totalReal: totalIngreso(filterByTipoDato(rows, 'real')),
      totalObjetivo: totalIngreso(filterByTipoDato(rows, 'objetivo')),
    };
  }, [rows, section.tipoDato, field]);

  if (!dimension) return <NotFoundPage />;

  if (!hasData) {
    return (
      <div className="empty-state">
        <p className="empty-state__title">Todavía no hay datos</p>
        <p className="empty-state__body">
          Sube el Excel de ingresos para ver el detalle por {dimension.label.toLowerCase()}.
        </p>
        <FileUpload />
      </div>
    );
  }

  const { summary, byCategory, byPeriodo, comparison, totalReal, totalObjetivo } = view;
  const isObjetivos = section.tipoDato === 'objetivo';

  if (summary.registros === 0) {
    return (
      <>
        <IssuesPanel issues={issues} />
        <div className="empty-state">
          <p className="empty-state__title">Sin datos de {section.label.toLowerCase()}</p>
          <p className="empty-state__body">
            El archivo se ha importado, pero no contiene filas con Tipo Dato «
            {isObjetivos ? 'Objetivo' : 'Real'}».
          </p>
        </div>
      </>
    );
  }

  const cumplimientoGlobal = totalObjetivo === 0 ? null : totalReal / totalObjetivo;

  const cards = [
    {
      id: 'total',
      label: isObjetivos ? 'Objetivo total' : 'Ingresos totales',
      value: formatEURCompact(summary.total),
      hint: `${formatInteger(summary.registros)} registros`,
    },
    {
      id: 'media',
      label: 'Media mensual',
      value: formatEURCompact(summary.mediaMensual),
      hint: `${formatInteger(summary.periodos)} ${summary.periodos === 1 ? 'mes' : 'meses'} con datos`,
    },
    {
      id: 'categorias',
      label: dimension.label,
      value: formatInteger(summary.categorias),
      hint: summary.top ? `Mayor: ${summary.top.key}` : undefined,
    },
  ];

  if (isObjetivos) {
    cards.push({
      id: 'cumplimiento',
      label: 'Cumplimiento global',
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
      label: `Mayor ${dimension.label.toLowerCase()}`,
      value: formatEURCompact(summary.top.total),
      hint: `${summary.top.key} · ${formatPercent(summary.top.share)} del total`,
    });
  }

  return (
    <>
      <IssuesPanel issues={issues} />

      <SummaryCards cards={cards} />

      <div className="panel-grid">
        <RevenueByCategory
          data={byCategory}
          dimensionLabel={dimension.label}
          // Sólo la dimensión Sede tiene color por entidad; en Formación y Área
          // el color no significa nada y las barras comparten el suyo.
          colorFor={isSedeDimension(dimensionSlug) ? getSedeColor : undefined}
        />
        <RevenueTrendChart data={byPeriodo} />
      </div>

      {isObjetivos ? (
        <section className="panel">
          <h2 className="panel__title">Cumplimiento por {dimension.label.toLowerCase()}</h2>
          <p className="panel__subtitle">Ingreso real sobre objetivo</p>
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
