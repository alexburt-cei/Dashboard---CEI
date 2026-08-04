import { formatEUR, formatInteger, formatPercent } from '../../utils/format';

/**
 * Ingresos por categoría.
 *
 * PROVISIONAL: por ahora se pinta con barras CSS + tabla de datos. La versión
 * con Recharts entra en el siguiente paso y se monta encima de esta tabla, que
 * se queda como vista de datos accesible (requisito de accesibilidad: toda
 * gráfica tiene que tener su equivalente en tabla).
 *
 * Todas las barras comparten color a propósito: aquí el trabajo del gráfico es
 * comparar magnitudes, no identificar series. El color sólo debe seguir a la
 * entidad cuando la identidad es lo que hay que leer.
 *
 * @param {{
 *   data: Array<{key: string, total: number, count: number, share: number}>,
 *   dimensionLabel: string,
 * }} props
 */
export default function RevenueByCategory({ data, dimensionLabel }) {
  if (!data || data.length === 0) {
    return (
      <section className="panel">
        <h2 className="panel__title">Ingresos por {dimensionLabel}</h2>
        <p className="panel__empty">No hay datos para esta vista.</p>
      </section>
    );
  }

  const max = Math.max(...data.map((item) => Math.abs(item.total)), 0);

  return (
    <section className="panel">
      <h2 className="panel__title">Ingresos por {dimensionLabel}</h2>

      <table className="data-table">
        <caption className="sr-only">
          Ingresos totales por {dimensionLabel}, de mayor a menor
        </caption>
        <thead>
          <tr>
            <th scope="col">{dimensionLabel}</th>
            <th scope="col" className="data-table__num">
              Ingreso
            </th>
            <th scope="col" className="data-table__num">
              % del total
            </th>
            <th scope="col" className="data-table__num">
              Registros
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.key}>
              <th scope="row">
                <span className="bar-row">
                  <span className="bar-row__name">{item.key}</span>
                  <span className="bar-row__track" aria-hidden="true">
                    <span
                      className="bar-row__fill"
                      style={{ width: max === 0 ? '0%' : `${(Math.abs(item.total) / max) * 100}%` }}
                    />
                  </span>
                </span>
              </th>
              <td className="data-table__num">{formatEUR(item.total)}</td>
              <td className="data-table__num">{formatPercent(item.share)}</td>
              <td className="data-table__num">{formatInteger(item.count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
