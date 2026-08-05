import { useState } from 'react';

import ChartTable from './ChartTable';
import { buildScale } from '../../utils/scale';
import { formatAxisValue, formatEUR, formatInteger, formatPercent } from '../../utils/format';

/**
 * Ingresos por categoría, en barras horizontales.
 *
 * Por qué CSS y no SVG: los nombres de categoría vienen del Excel del usuario y
 * pueden ser tan largos como quieran. SVG no tiene `text-overflow`, así que una
 * etiqueta larga se saldría del área de trazado — y una etiqueta recortada o
 * desbordada es justo lo que hay que evitar. Con CSS el truncado con elipsis
 * sale gratis y las barras siguen cumpliendo las mismas medidas.
 *
 * Barras horizontales (y no columnas) porque los nombres son largos: en
 * vertical habría que rotar las etiquetas.
 *
 * Por defecto todas las barras comparten color. El trabajo aquí es comparar
 * magnitudes, y la longitud ya lo dice; teñir cada barra más oscura cuanto
 * mayor es duplicaría la misma información en el único canal libre que queda.
 *
 * `colorFor` rompe esa regla sólo cuando el color significa *identidad* y no
 * magnitud — el caso de las sedes, donde Madrid es roja siempre. Recibe la clave
 * de la fila y devuelve un color, o null para dejar el de por defecto.
 *
 * @param {{
 *   data: Array<{key: string, total: number, count: number, share: number}>,
 *   dimensionLabel: string,
 *   colorFor?: (key: string) => string|null,
 * }} props
 */
export default function RevenueByCategory({ data, dimensionLabel, colorFor }) {
  const [activeIndex, setActiveIndex] = useState(-1);

  if (!data || data.length === 0) {
    return (
      <section className="panel">
        <h2 className="panel__title">Ingresos por {dimensionLabel}</h2>
        <p className="panel__empty">No hay datos para esta vista.</p>
      </section>
    );
  }

  const totals = data.map((item) => item.total);
  const scale = buildScale(Math.min(...totals), Math.max(...totals), 5);

  return (
    <section className="panel">
      <h2 className="panel__title">Ingresos por {dimensionLabel}</h2>
      <p className="panel__subtitle">Total del periodo, de mayor a menor</p>

      <div className="bar-chart">
        <div className="bar-chart__plot">
          {/* Rejilla: hairline sólida, un paso por encima de la superficie.
              Va detrás de las barras y no captura el puntero. */}
          <div className="bar-chart__gridlines" aria-hidden="true">
            {scale.ticks.map((tick) => (
              <span
                key={tick}
                className="bar-chart__gridline"
                style={{ left: `${scale.position(tick) * 100}%` }}
                data-zero={tick === 0 || undefined}
              />
            ))}
          </div>

          {data.map((item, index) => {
            // La barra va del cero al valor, no del borde izquierdo al valor:
            // con importes negativos (abonos) el cero no está en el borde y una
            // barra anclada a la izquierda mentiría sobre su longitud.
            const zeroAt = scale.position(0);
            const valueAt = scale.position(item.total);
            const start = Math.min(zeroAt, valueAt);
            const span = Math.abs(valueAt - zeroAt);
            const isActive = index === activeIndex;
            // Con la barra pasada de la mitad, el tooltip se ancla por la
            // izquierda del extremo para no salirse de la tarjeta.
            const flipTooltip = valueAt > 0.5;

            return (
              <div
                key={item.key}
                className="bar-chart__row"
                data-active={isActive || undefined}
                tabIndex={0}
                // El readout completo va en aria-label: con lector de pantalla
                // no hay que reconstruirlo saltando entre celdas.
                aria-label={`${item.key}: ${formatEUR(item.total)}, ${formatPercent(
                  item.share,
                )} del total, ${formatInteger(item.count)} registros`}
                onPointerEnter={() => setActiveIndex(index)}
                onPointerLeave={() => setActiveIndex(-1)}
                onFocus={() => setActiveIndex(index)}
                onBlur={() => setActiveIndex(-1)}
              >
                <span className="bar-chart__name" title={item.key}>
                  {item.key}
                </span>

                <span className="bar-chart__track">
                  <span
                    className="bar-chart__fill"
                    data-negative={item.total < 0 || undefined}
                    style={{
                      left: `${start * 100}%`,
                      width: `${span * 100}%`,
                      // Sin color propio se cae al del CSS, que es el de por
                      // defecto: no se inventa un tono para una clave suelta.
                      ...(colorFor?.(item.key)
                        ? { background: colorFor(item.key) }
                        : null),
                    }}
                  />

                  {isActive ? (
                    <span
                      className="chart-tooltip"
                      role="status"
                      style={{ left: `${valueAt * 100}%` }}
                      data-flip={flipTooltip || undefined}
                    >
                      {/* El valor manda y la etiqueta acompaña: quien mira ya
                          sabe qué categoría es, lo que busca es la cifra. */}
                      <span className="chart-tooltip__value">{formatEUR(item.total)}</span>
                      <span className="chart-tooltip__meta">
                        {formatPercent(item.share)} del total · {formatInteger(item.count)}{' '}
                        registros
                      </span>
                    </span>
                  ) : null}
                </span>

                {/* Etiqueta directa fuera del extremo de la barra, en columna
                    propia: así nunca queda recortada por una barra pequeña.
                    Va el importe exacto y no abreviado, para no mezclar dos
                    notaciones en la misma gráfica: el eje ya abrevia. */}
                <span className="bar-chart__value">{formatEUR(item.total)}</span>
              </div>
            );
          })}
        </div>

        <div className="bar-chart__axis" aria-hidden="true">
          {scale.ticks.map((tick, index) => (
            <span
              key={tick}
              className="bar-chart__tick"
              style={{ left: `${scale.position(tick) * 100}%` }}
              // Los ticks de los extremos se alinean por su borde: centrados se
              // saldrían media etiqueta por fuera del área de trazado.
              data-edge={index === 0 ? 'start' : index === scale.ticks.length - 1 ? 'end' : undefined}
            >
              {formatAxisValue(tick)}
            </span>
          ))}
        </div>
      </div>

      <ChartTable
        caption={`Ingresos totales por ${dimensionLabel}, de mayor a menor`}
        columns={[
          { key: 'categoria', label: dimensionLabel },
          { key: 'ingreso', label: 'Ingreso', numeric: true },
          { key: 'share', label: '% del total', numeric: true },
          { key: 'registros', label: 'Registros', numeric: true },
        ]}
        rows={data.map((item) => ({
          key: item.key,
          categoria: item.key,
          ingreso: formatEUR(item.total),
          share: formatPercent(item.share),
          registros: formatInteger(item.count),
        }))}
      />
    </section>
  );
}
