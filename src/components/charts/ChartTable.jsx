import { useI18n } from '../../i18n/I18nContext';

/**
 * Vista de datos de una gráfica, plegada bajo ella.
 *
 * No es un extra: el tooltip nunca puede ser la única forma de leer un valor.
 * Con la tabla, todo lo que muestra la gráfica es alcanzable sin ratón, sin
 * hover y con lector de pantalla.
 *
 * @param {{
 *   caption: string,
 *   columns: Array<{key: string, label: string, numeric?: boolean}>,
 *   rows: Array<Record<string, string> & {key: string}>,
 *   summaryLabel?: string,
 * }} props
 */
export default function ChartTable({ caption, columns, rows, summaryLabel }) {
  const { t } = useI18n();
  if (!rows || rows.length === 0) return null;

  return (
    <details className="chart-table">
      <summary className="chart-table__summary">{summaryLabel ?? t('chart.verDatos')}</summary>
      <div className="chart-table__scroll">
        <table className="data-table">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={column.numeric ? 'data-table__num' : undefined}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                {columns.map((column, index) =>
                  index === 0 ? (
                    <th key={column.key} scope="row">
                      {row[column.key]}
                    </th>
                  ) : (
                    <td
                      key={column.key}
                      className={column.numeric ? 'data-table__num' : undefined}
                    >
                      {row[column.key]}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
