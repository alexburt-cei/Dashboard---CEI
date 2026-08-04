import { formatEUR, formatInteger } from '../../utils/format';

/**
 * Evolución temporal de los ingresos (mensual).
 *
 * PROVISIONAL: igual que RevenueByCategory, ahora mismo es tabla + barras CSS
 * y en el siguiente paso se le monta encima la gráfica de líneas de Recharts
 * con crosshair y tooltip.
 *
 * La serie llega con los meses sin ingresos rellenos a 0 desde
 * groupByPeriodo(): saltarse los meses vacíos deforma la tendencia.
 *
 * @param {{
 *   data: Array<{periodo: string, label: string, total: number, count: number}>,
 * }} props
 */
export default function RevenueTrendChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <section className="panel">
        <h2 className="panel__title">Evolución temporal</h2>
        <p className="panel__empty">No hay datos para esta vista.</p>
      </section>
    );
  }

  const max = Math.max(...data.map((item) => Math.abs(item.total)), 0);

  return (
    <section className="panel">
      <h2 className="panel__title">Evolución temporal</h2>
      <p className="panel__subtitle">Ingresos por mes</p>

      <table className="data-table">
        <caption className="sr-only">Ingresos totales por mes, en orden cronológico</caption>
        <thead>
          <tr>
            <th scope="col">Mes</th>
            <th scope="col" className="data-table__num">
              Ingreso
            </th>
            <th scope="col" className="data-table__num">
              Registros
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.periodo}>
              <th scope="row">
                <span className="bar-row">
                  <span className="bar-row__name">{item.label}</span>
                  <span className="bar-row__track" aria-hidden="true">
                    <span
                      className="bar-row__fill"
                      style={{ width: max === 0 ? '0%' : `${(Math.abs(item.total) / max) * 100}%` }}
                    />
                  </span>
                </span>
              </th>
              <td className="data-table__num">{formatEUR(item.total)}</td>
              <td className="data-table__num">{formatInteger(item.count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
