import { useCallback, useState } from 'react';

import ChartTable from './ChartTable';
import { useElementWidth } from '../../hooks/useElementWidth';
import { areaPath, buildScale, labelInterval, linePath, nearestIndex } from '../../utils/scale';
import { formatAxisValue, formatEUR, formatInteger } from '../../utils/format';

/** Geometría del trazado. La altura del contenedor incluye la banda del eje X. */
const PLOT_HEIGHT = 200;
const MARGIN = { top: 16, right: 16, bottom: 26, left: 56 };
const SVG_HEIGHT = PLOT_HEIGHT + MARGIN.top + MARGIN.bottom;

/** Ancho mínimo por etiqueta del eje X, para decidir cuántas caben. */
const X_LABEL_WIDTH = 60;

/**
 * Evolución temporal de los ingresos (mensual), en línea con relleno de área.
 *
 * Aquí sí es SVG: una línea necesita geometría de trazado y una retícula de
 * puntas, y las etiquetas del eje X son cortas ("ene 2026"), así que el
 * problema de desbordar texto que hace inviable el SVG en la gráfica de
 * categorías no se da.
 *
 * Una sola serie, así que no lleva leyenda: el título ya dice qué se pinta, y
 * una caja con un único color repetiría el título gastando espacio.
 *
 * La serie llega con los meses sin ingresos rellenos a 0 desde groupByPeriodo():
 * saltarse los meses vacíos deforma la pendiente.
 *
 * @param {{
 *   data: Array<{periodo: string, label: string, total: number, count: number}>,
 * }} props
 */
export default function RevenueTrendChart({ data }) {
  const [containerRef, width] = useElementWidth();
  const [activeIndex, setActiveIndex] = useState(-1);

  const points = data ?? [];
  const count = points.length;

  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const baseX = MARGIN.left;

  const xAt = useCallback(
    (index) => {
      if (count <= 1) return baseX + innerWidth / 2;
      return baseX + (index / (count - 1)) * innerWidth;
    },
    [count, innerWidth, baseX],
  );

  const handlePointerMove = useCallback(
    (event) => {
      if (count === 0) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const xs = Array.from({ length: count }, (unused, index) => xAt(index));
      setActiveIndex(nearestIndex(xs, x));
    },
    [count, xAt],
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (count === 0) return;

      const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (step === 0) return;

      event.preventDefault();
      setActiveIndex((current) => {
        // Sin punto activo, la flecha entra por el extremo correspondiente.
        if (current === -1) return step > 0 ? 0 : count - 1;
        return Math.min(count - 1, Math.max(0, current + step));
      });
    },
    [count],
  );

  if (count === 0) {
    return (
      <section className="panel">
        <h2 className="panel__title">Evolución temporal</h2>
        <p className="panel__empty">No hay datos para esta vista.</p>
      </section>
    );
  }

  const totals = points.map((point) => point.total);
  const scale = buildScale(Math.min(...totals), Math.max(...totals), 4);

  const yAt = (value) => MARGIN.top + PLOT_HEIGHT * (1 - scale.position(value));
  const baselineY = yAt(Math.max(scale.min, 0));

  const coords = points.map((point, index) => ({ x: xAt(index), y: yAt(point.total) }));
  const last = coords[coords.length - 1];
  const activePoint = activeIndex >= 0 ? points[activeIndex] : null;
  const activeCoord = activeIndex >= 0 ? coords[activeIndex] : null;

  // Se etiqueta una de cada N para que no se solapen, y además el último mes
  // si queda sitio: es la referencia que más se busca.
  const interval = labelInterval(count, Math.floor(innerWidth / X_LABEL_WIDTH));
  const labelledIndices = new Set();
  for (let index = 0; index < count; index += interval) labelledIndices.add(index);
  const lastLabelled = Math.max(...labelledIndices);
  if (count - 1 - lastLabelled >= 1 && xAt(count - 1) - xAt(lastLabelled) >= X_LABEL_WIDTH) {
    labelledIndices.add(count - 1);
  }

  const total = totals.reduce((sum, value) => sum + value, 0);
  const ready = innerWidth > 0;

  return (
    <section className="panel">
      <h2 className="panel__title">Evolución temporal</h2>
      <p className="panel__subtitle">Ingresos por mes</p>

      <div className="line-chart" ref={containerRef}>
        {ready ? (
          <div
            className="line-chart__frame"
            tabIndex={0}
            role="img"
            aria-label={`Evolución de ingresos de ${points[0].label} a ${
              points[count - 1].label
            }. Total ${formatEUR(total)}. Usa las flechas para recorrer los meses.`}
            onKeyDown={handleKeyDown}
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setActiveIndex(-1)}
            onBlur={() => setActiveIndex(-1)}
          >
            <svg
              className="line-chart__svg"
              width={width}
              height={SVG_HEIGHT}
              viewBox={`0 0 ${width} ${SVG_HEIGHT}`}
            >
              {/* Retícula: hairline sólida de 1px, nunca discontinua */}
              {scale.ticks.map((tick) => (
                <line
                  key={tick}
                  className="line-chart__gridline"
                  x1={MARGIN.left}
                  x2={width - MARGIN.right}
                  y1={yAt(tick)}
                  y2={yAt(tick)}
                  data-zero={tick === 0 || undefined}
                />
              ))}

              {scale.ticks.map((tick) => (
                <text
                  key={tick}
                  className="line-chart__tick"
                  x={MARGIN.left - 8}
                  y={yAt(tick)}
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {formatAxisValue(tick)}
                </text>
              ))}

              {/* Relleno de área: la serie al 10%, un lavado, nunca un bloque */}
              <path className="line-chart__area" d={areaPath(coords, baselineY)} />
              <path className="line-chart__line" d={linePath(coords)} />

              {activeCoord ? (
                <>
                  <line
                    className="line-chart__crosshair"
                    x1={activeCoord.x}
                    x2={activeCoord.x}
                    y1={MARGIN.top}
                    y2={baselineY}
                  />
                  <circle
                    className="line-chart__dot"
                    cx={activeCoord.x}
                    cy={activeCoord.y}
                    r={4}
                  />
                </>
              ) : (
                /* Sin punto activo, se marca el último: es el dato más reciente */
                <circle className="line-chart__dot" cx={last.x} cy={last.y} r={4} />
              )}

              {points.map((point, index) =>
                labelledIndices.has(index) ? (
                  <text
                    key={point.periodo}
                    className="line-chart__tick"
                    x={xAt(index)}
                    y={SVG_HEIGHT - 8}
                    // Los extremos se anclan por su borde: el primer y el último
                    // punto caen justo en el límite del trazado, y centrados se
                    // saldrían media etiqueta fuera del SVG (se ve recortada).
                    textAnchor={
                      index === 0 ? 'start' : index === count - 1 ? 'end' : 'middle'
                    }
                  >
                    {point.label}
                  </text>
                ) : null,
              )}

              {/* Etiqueta directa sólo en el extremo, no en cada punto.
                  Anclada al final y hacia dentro para no salirse del SVG.
                  Importe exacto, igual que en las barras: los valores directos
                  van completos y sólo el eje abrevia. */}
              {!activeCoord ? (
                <text
                  className="line-chart__end-label"
                  x={last.x}
                  y={Math.max(last.y - 12, MARGIN.top + 4)}
                  textAnchor="end"
                >
                  {formatEUR(points[count - 1].total)}
                </text>
              ) : null}
            </svg>

            {activePoint && activeCoord ? (
              <div
                className="chart-tooltip chart-tooltip--floating"
                role="status"
                style={{
                  left: `${activeCoord.x}px`,
                  top: `${activeCoord.y}px`,
                }}
                // Pasada la mitad, el tooltip se vuelca a la izquierda
                data-flip={activeCoord.x > MARGIN.left + innerWidth / 2 || undefined}
              >
                <span className="chart-tooltip__value">{formatEUR(activePoint.total)}</span>
                <span className="chart-tooltip__meta">
                  {activePoint.label} · {formatInteger(activePoint.count)} registros
                </span>
              </div>
            ) : null}
          </div>
        ) : (
          // Reserva de alto antes de la primera medida, para que no salte el layout
          <div style={{ height: SVG_HEIGHT }} />
        )}
      </div>

      <ChartTable
        caption="Ingresos totales por mes, en orden cronológico"
        columns={[
          { key: 'mes', label: 'Mes' },
          { key: 'ingreso', label: 'Ingreso', numeric: true },
          { key: 'registros', label: 'Registros', numeric: true },
        ]}
        rows={points.map((point) => ({
          key: point.periodo,
          mes: point.label,
          ingreso: formatEUR(point.total),
          registros: formatInteger(point.count),
        }))}
      />
    </section>
  );
}
