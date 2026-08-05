import ChartTable from '../charts/ChartTable';
import { buildScale } from '../../utils/scale';
import { useFormatters } from '../../utils/useFormatters';
import { useI18n } from '../../i18n/I18nContext';
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
  const { t, locale } = useI18n();
  const { formatAxisValue, formatEUR, formatPercent } = useFormatters();

  if (!serie || serie.length === 0) {
    return (
      <section className="panel">
        <h2 className="panel__title">{t('comp.titulo')}</h2>
        <p className="panel__empty">{t('vacio.vista')}</p>
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
    anterior: t('comp.anterior'),
    mejor: t('comp.mejor'),
    peor: t('comp.peor'),
    neutro: t('comp.neutro'),
    proyeccion: t('comp.proyeccion'),
  };

  return (
    <section className="panel">
      <h2 className="panel__title">{t('comp.titulo')}</h2>
      {/* Que las tres barras sean comparables es la razón de ser del panel, así
          que se dice en el subtítulo y no sólo en la tabla: el año anterior sale
          recortado al mismo avance que la temporada en curso. */}
      <p className="panel__subtitle">{t('comp.subtitulo')}</p>

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
                  title={`${temporadaLabel(punto.temporada, locale)}: ${formatEUR(punto.valor)}`}
                />
              </div>

              <span className="season-chart__label">
                {temporadaLabel(punto.temporada, locale)}
                {punto.estimado ? <em className="season-chart__tag">{t('comp.estimacion')}</em> : null}
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
        caption={t('comp.titulo')}
        columns={[
          { key: 'convocatoria', label: t('comp.convocatoria') },
          { key: 'importe', label: t('comp.importeComparable'), numeric: true },
          { key: 'completa', label: t('comp.temporadaCompleta'), numeric: true },
          { key: 'naturaleza', label: t('comp.naturaleza') },
          { key: 'versus', label: t('comp.vsAnioAnterior'), numeric: true },
        ]}
        rows={serie.map((punto) => ({
          key: punto.key,
          convocatoria: temporadaLabel(punto.temporada, locale),
          importe: formatEUR(punto.valor),
          // Sólo el año anterior tiene temporada cerrada con la que contrastar
          // el recorte; en la actual y en la proyección no aplica.
          completa:
            punto.valorCompleto === undefined || punto.valorCompleto === null
              ? '—'
              : formatEUR(punto.valorCompleto),
          naturaleza: punto.estimado ? t('comp.estimacion') : t('comp.datoReal'),
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
