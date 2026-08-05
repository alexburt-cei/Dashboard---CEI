import ChartTable from '../charts/ChartTable';
import { periodoLabel } from '../../utils/dataTransform';
import { useFormatters } from '../../utils/useFormatters';
import { useI18n } from '../../i18n/I18nContext';

/**
 * Paneles de matriculación: online vs offline, y nuevas vs renovaciones.
 *
 * Los dos dependen de columnas opcionales del Excel, así que cada uno se apaga
 * por su cuenta con un aviso que dice **qué columna falta**. Un panel vacío sin
 * explicación se lee como un error de la app; diciendo qué falta, se lee como
 * una instrucción.
 */

/** Ahead / behind / plano. Plano no es ahead: con la misma cifra no se adelanta. */
const ESTADO_KEY = { ahead: 'canal.ahead', behind: 'canal.behind', plano: 'canal.plano' };
const ESTADO_DIRECTION = { ahead: 'up', behind: 'down', plano: undefined };

/** Aviso de panel apagado por falta de datos, no por fallo. */
function PanelSinDatos({ titulo, columna, ejemplos }) {
  const { t, locale } = useI18n();
  return (
    <section className="panel panel--muted">
      <h2 className="panel__title">{titulo}</h2>
      <p className="panel__empty">
        {t('panelApagado.detalle', { columna, ejemplos })}
      </p>
    </section>
  );
}

/**
 * Matriculaciones por canal, con su cuota y el ahead/behind frente al año
 * anterior.
 */
export function CanalPanel({ canales }) {
  const { t, locale } = useI18n();
  const { formatEUR, formatInteger, formatPercent } = useFormatters();

  if (!canales) {
    return (
      <PanelSinDatos
        titulo={t('canal.titulo')}
        columna="Canal"
        ejemplos="Online, Web, Digital · Offline, Presencial, Teléfono"
      />
    );
  }

  return (
    <section className="panel">
      <h2 className="panel__title">{t('canal.titulo')}</h2>
      <p className="panel__subtitle">{t('canal.subtitulo')}</p>

      <div className="canal-grid">
        {canales.canales.map((canal) => (
          <article className="canal-card" key={canal.canal}>
            <p className="canal-card__label">{t(`canal.${canal.canal}`)}</p>
            <p className="canal-card__value">{formatInteger(canal.matriculas ?? 0)}</p>
            <p className="canal-card__share">
              {t('canal.delTotal', { porcentaje: formatPercent(canal.share) })}
            </p>

            {/* ahead/behind con la palabra escrita, no sólo el color. */}
            {canal.estado === null ? (
              <p className="canal-card__delta">{t('canal.sinAnterior')}</p>
            ) : (
              <p
                className="canal-card__delta"
                data-direction={ESTADO_DIRECTION[canal.estado]}
              >
                {t(ESTADO_KEY[canal.estado])} ·{' '}
                {t('resumen.vsAnterior', { valor: formatPercent(canal.variacion ?? 0) })}
              </p>
            )}

            <p className="canal-card__hint">{formatEUR(canal.ingreso)}</p>
          </article>
        ))}
      </div>

      <ChartTable
        caption={t('canal.titulo')}
        columns={[
          { key: 'canal', label: t('idioma.etiqueta') === 'Language' ? 'Channel' : 'Canal' },
          { key: 'matriculas', label: t('canal.matriculas'), numeric: true },
          { key: 'share', label: t('canal.porcentajeTotal'), numeric: true },
          { key: 'anterior', label: t('canal.anioAnterior'), numeric: true },
          { key: 'estado', label: t('canal.estado') },
        ]}
        rows={canales.canales.map((canal) => ({
          key: canal.canal,
          canal: t(`canal.${canal.canal}`),
          matriculas: formatInteger(canal.matriculas ?? 0),
          share: formatPercent(canal.share),
          anterior: canal.anterior === null ? '—' : formatInteger(canal.anterior),
          estado: canal.estado === null ? '—' : t(ESTADO_KEY[canal.estado]),
        }))}
      />
    </section>
  );
}

/** Reporte mensual de matrículas nuevas vs renovaciones. */
export function MatriculasPanel({ matriculas }) {
  const { t, locale } = useI18n();
  const { formatInteger, formatPercent } = useFormatters();

  if (!matriculas) {
    return (
      <PanelSinDatos
        titulo={t('matriculas.titulo')}
        columna="Tipo Matrícula"
        ejemplos="Nueva, Alta, New Enrolment · Renovación, Re-matrícula, Renewal"
      />
    );
  }

  const maximo = Math.max(...matriculas.map((m) => m.total), 1);

  return (
    <section className="panel">
      <h2 className="panel__title">{t('matriculas.titulo')}</h2>
      <p className="panel__subtitle">{t('matriculas.subtitulo')}</p>

      <ul className="chart-legend">
        <li className="chart-legend__item">
          <span
            className="chart-legend__swatch"
            style={{ background: 'var(--series-1)' }}
            aria-hidden="true"
          />
          {t('matriculas.nuevas')}
        </li>
        <li className="chart-legend__item">
          <span
            className="chart-legend__swatch"
            style={{ background: 'var(--series-3)' }}
            aria-hidden="true"
          />
          {t('matriculas.renovaciones')}
        </li>
      </ul>

      <div className="stack-chart">
        {matriculas.map((mes) => (
          <div className="stack-chart__row" key={mes.periodo}>
            <span className="stack-chart__label">{periodoLabel(mes.periodo, locale)}</span>
            <span className="stack-chart__track">
              {/* Hueco de 2px entre segmentos: sin él, dos colores contiguos se
                  leen como una sola barra de un tono intermedio. */}
              <span
                className="stack-chart__seg"
                style={{
                  width: `${(mes.nueva / maximo) * 100}%`,
                  background: 'var(--series-1)',
                }}
                title={`${periodoLabel(mes.periodo, locale)} · nuevas: ${mes.nueva}`}
              />
              <span
                className="stack-chart__seg"
                style={{
                  width: `${(mes.renovacion / maximo) * 100}%`,
                  background: 'var(--series-3)',
                }}
                title={`${periodoLabel(mes.periodo, locale)} · renovaciones: ${mes.renovacion}`}
              />
            </span>
            <span className="stack-chart__value">{formatInteger(mes.total)}</span>
          </div>
        ))}
      </div>

      <ChartTable
        caption={t('matriculas.titulo')}
        columns={[
          { key: 'mes', label: t('matriculas.mes') },
          { key: 'nueva', label: t('matriculas.nuevas'), numeric: true },
          { key: 'renovacion', label: t('matriculas.renovaciones'), numeric: true },
          { key: 'total', label: t('matriculas.total'), numeric: true },
          { key: 'share', label: t('matriculas.porcentajeNuevas'), numeric: true },
        ]}
        rows={matriculas.map((mes) => ({
          key: mes.periodo,
          mes: periodoLabel(mes.periodo, locale),
          nueva: formatInteger(mes.nueva),
          renovacion: formatInteger(mes.renovacion),
          total: formatInteger(mes.total),
          share: formatPercent(mes.shareNuevas),
        }))}
      />
    </section>
  );
}
