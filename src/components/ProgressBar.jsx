import { useFormatters } from '../utils/useFormatters';
import { useI18n } from '../i18n/I18nContext';

/**
 * Umbrales de cumplimiento. El color acompaña, pero el porcentaje va escrito
 * siempre: un color de estado nunca es el único canal de significado.
 */
function severityOf(cumplimiento) {
  if (cumplimiento === null) return 'none';
  if (cumplimiento >= 1) return 'good';
  if (cumplimiento >= 0.85) return 'warning';
  return 'critical';
}

/**
 * Barra de cumplimiento real vs objetivo.
 *
 * El relleno lleva la severidad y la pista sin rellenar es un paso más claro
 * de la misma rampa, de modo que el estado se lee a lo largo de toda la barra.
 * El relleno se recorta al 100% para no desbordar, pero el porcentaje real se
 * sigue mostrando en texto cuando se supera el objetivo.
 *
 * @param {{label: string, real: number, objetivo: number, cumplimiento: number|null}} props
 */
export default function ProgressBar({ label, real, objetivo, cumplimiento }) {
  const { t } = useI18n();
  const { formatEUR, formatPercent } = useFormatters();
  const severity = severityOf(cumplimiento);
  const width = cumplimiento === null ? 0 : Math.min(cumplimiento, 1) * 100;
  const valueText =
    cumplimiento === null
      ? 'Sin objetivo definido'
      : `${formatPercent(cumplimiento)} — ${formatEUR(real)} de ${formatEUR(objetivo)}`;

  return (
    <div className="progress">
      <div className="progress__header">
        <span className="progress__label">{label}</span>
        <span className="progress__value" data-severity={severity}>
          {cumplimiento === null ? 'Sin objetivo' : formatPercent(cumplimiento)}
        </span>
      </div>

      <div
        className="progress__track"
        role="progressbar"
        aria-label={t('dim.cumplimientoDe', { label })}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={cumplimiento === null ? undefined : Math.round(cumplimiento * 100)}
        aria-valuetext={valueText}
      >
        <div
          className="progress__fill"
          data-severity={severity}
          style={{ width: `${width}%` }}
        />
      </div>

      <p className="progress__detail">
        {formatEUR(real)} <span className="progress__detail-sep">de</span> {formatEUR(objetivo)}
      </p>
    </div>
  );
}
