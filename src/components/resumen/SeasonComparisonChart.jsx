import ChartTable from '../charts/ChartTable';
import { buildScale } from '../../utils/scale';
import { formatAxisValue, formatEUR, formatPercent } from '../../utils/format';
import { temporadaLabel } from '../../utils/temporada';

/**
 * Comparativa por convocatoria: año anterior, temporada en curso y proyección.
 *
 * Barras y no línea: son tres periodos discretos y comparables, no una serie
 * continua — una línea entre ellos insinuaría una evolución que no existe.
 *
 * El color aquí **sí** carga significado, y es el que pediste: verde si la
 * temporada en curso mejora respecto al año anterior al mismo punto de avance,
 * rojo si empeora, azul para la proyección. Como el color no puede ser el único
 * portador, cada barra lleva además su etiqueta y la proyección va rayada y
 * rotulada «estimación».
 *
 * @param {{serie: Array<{key: string, temporada: string, valor: number, tipo: string, estimado: boolean, referencia?: number}>}} props
 */
export default function SeasonComparisonChart({ serie }) {
  if (!serie || serie.length === 0) {
    return (
      <section className="panel">
        <h2 className="panel__title">Comparativa por convocatoria</h2>
        <p className="panel__empty">No hay datos suficientes para comparar.</p>
      </section>
    );
  }

  const scale = buildScale(0, Math.max(...serie.map((p) => p.valor)));

  const COLORES = {
    anterior: 'var(--text-muted)',
    mejor: 'var(--comp-better)',
    peor: 'var(--comp-worse)',
    neutro: 'var(--series-1)',
    proyeccion: 'var(--comp-projection)',
  };

  const LEYENDA = {
    anterior: 'Año anterior, al mismo punto de avance',
    mejor: 'En curso · mejor que el año anterior',
    peor: 'En curso · peor que el año anterior',
    neutro: 'En curso',
    proyeccion: 'Proyección de cierre',
  };

  return (
    <section className="panel">
      <h2 className="panel__title">Comparativa por convocatoria</h2>
      {/* Que las tres barras sean comparables es la razón de ser del panel, así
          que se dice en el subtítulo y no sólo en la tabla: el año anterior sale
          recortado al mismo avance que la temporada en curso. */}
      <p className="panel__subtitle">
        Todas las barras al mismo punto de avance de su convocatoria, más el cierre proyectado
      </p>

      {/* Leyenda: con más de una categoría la identidad nunca es sólo el color. */}
      <ul className="chart-legend">
        {serie.map((punto) => (
          <li key={punto.key} className="chart-legend__item">
            <span
              className="chart-legend__swatch"
              style={{ background: COLORES[punto.tipo] }}
              data-estimado={punto.estimado || undefined}
              aria-hidden="true"
            />
            {LEYENDA[punto.tipo]}
          </li>
        ))}
      </ul>

      <div className="season-chart">
        {serie.map((punto) => {
          const alto = scale.position(punto.valor);
          return (
            <div className="season-chart__col" key={punto.key}>
              <span className="season-chart__value">{formatEUR(punto.valor)}</span>

              <div className="season-chart__track">
                <div
                  className="season-chart__bar"
                  data-estimado={punto.estimado || undefined}
                  style={{ height: `${Math.max(alto * 100, 0.5)}%`, background: COLORES[punto.tipo] }}
                  title={`${temporadaLabel(punto.temporada)}: ${formatEUR(punto.valor)}`}
                />
              </div>

              <span className="season-chart__label">
                {temporadaLabel(punto.temporada)}
                {punto.estimado ? <em className="season-chart__tag">estimación</em> : null}
              </span>
            </div>
          );
        })}

        <div className="season-chart__axis" aria-hidden="true">
          {scale.ticks.map((tick) => (
            <span key={tick} className="season-chart__tick">
              {formatAxisValue(tick)}
            </span>
          ))}
        </div>
      </div>

      <ChartTable
        caption="Comparativa por convocatoria, con la naturaleza de cada cifra"
        columns={[
          { key: 'convocatoria', label: 'Convocatoria' },
          { key: 'importe', label: 'Importe comparable', numeric: true },
          { key: 'completa', label: 'Temporada completa', numeric: true },
          { key: 'naturaleza', label: 'Naturaleza' },
          { key: 'versus', label: 'vs año anterior', numeric: true },
        ]}
        rows={serie.map((punto) => ({
          key: punto.key,
          convocatoria: temporadaLabel(punto.temporada),
          importe: formatEUR(punto.valor),
          // Sólo el año anterior tiene temporada cerrada con la que contrastar
          // el recorte; en la actual y en la proyección no aplica.
          completa:
            punto.valorCompleto === undefined || punto.valorCompleto === null
              ? '—'
              : formatEUR(punto.valorCompleto),
          naturaleza: punto.estimado ? 'Estimación' : 'Dato real',
          versus: punto.referencia
            ? `${formatEUR(punto.referencia)} · ${formatPercent(
                (punto.valor - punto.referencia) / punto.referencia,
              )}`
            : '—',
        }))}
      />
    </section>
  );
}
