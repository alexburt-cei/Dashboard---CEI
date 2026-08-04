/** Nº de incidencias que se listan antes de resumir el resto. */
const MAX_VISIBLE = 20;

/**
 * Incidencias de la importación, plegadas por defecto.
 *
 * Un import silencioso es peor que uno ruidoso: si se han descartado filas, el
 * usuario tiene que poder ver cuáles y por qué, con el número de fila del Excel
 * para poder corregirlo en origen.
 *
 * @param {{issues: import('../utils/excelParser').Issue[]}} props
 */
export default function IssuesPanel({ issues }) {
  if (!issues || issues.length === 0) return null;

  const errors = issues.filter((issue) => issue.severity === 'error');
  const warnings = issues.filter((issue) => issue.severity === 'warning');
  const visible = issues.slice(0, MAX_VISIBLE);
  const hidden = issues.length - visible.length;

  const parts = [];
  if (errors.length > 0) {
    parts.push(`${errors.length} ${errors.length === 1 ? 'fila descartada' : 'filas descartadas'}`);
  }
  if (warnings.length > 0) {
    parts.push(`${warnings.length} ${warnings.length === 1 ? 'aviso' : 'avisos'}`);
  }

  return (
    <details className="issues">
      <summary className="issues__summary">
        <span className="issues__icon" aria-hidden="true">
          !
        </span>
        Incidencias de la importación: {parts.join(' · ')}
      </summary>

      <ul className="issues__list">
        {visible.map((issue, index) => (
          <li key={`${issue.row ?? 'global'}-${issue.column ?? ''}-${index}`}>
            <span className="issues__severity" data-severity={issue.severity}>
              {issue.severity === 'error' ? 'Error' : 'Aviso'}
            </span>
            {issue.row !== null ? <span className="issues__row">Fila {issue.row}</span> : null}
            {issue.column ? <span className="issues__column">{issue.column}</span> : null}
            <span className="issues__message">{issue.message}</span>
          </li>
        ))}
      </ul>

      {hidden > 0 ? <p className="issues__more">…y {hidden} incidencias más.</p> : null}
    </details>
  );
}
