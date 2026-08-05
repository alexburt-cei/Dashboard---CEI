import { formatEUR, formatPercent, formatSignedEUR } from '../../utils/format';

/**
 * Objetivo / Actual / Diferencia, repetido por grupo: Year-to-date, mes en
 * curso, temporada y proyección.
 *
 * La diferencia va con signo escrito además de color, porque el color no puede
 * ser el único portador del significado — y en una tabla de importes es donde
 * más fácil se confunde.
 *
 * La fila de proyección se marca como estimación de forma explícita: es la única
 * cifra de la tabla que no se ha facturado, y confundirla con un dato real sería
 * el peor error que puede cometer este panel.
 *
 * @param {{tabla: Array<{id: string, label: string, hint: string, objetivo: number, actual: number|null, diferencia: number|null, cumplimiento: number|null, estimado: boolean}>}} props
 */
export default function ComparativeTable({ tabla }) {
  if (!tabla || tabla.length === 0) {
    return (
      <section className="panel">
        <h2 className="panel__title">Objetivo vs actual</h2>
        <p className="panel__empty">No hay datos para comparar.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2 className="panel__title">Objetivo vs actual</h2>
      <p className="panel__subtitle">Por periodo, con la diferencia frente al objetivo</p>

      <div className="chart-table__scroll">
        <table className="data-table">
          <caption className="sr-only">
            Objetivo, actual y diferencia por Year-to-date, mes en curso, temporada y proyección
          </caption>
          <thead>
            <tr>
              <th scope="col">Periodo</th>
              <th scope="col" className="data-table__num">
                Objetivo
              </th>
              <th scope="col" className="data-table__num">
                Actual
              </th>
              <th scope="col" className="data-table__num">
                Diferencia
              </th>
              <th scope="col" className="data-table__num">
                Cumplimiento
              </th>
            </tr>
          </thead>
          <tbody>
            {tabla.map((grupo) => (
              <tr key={grupo.id} data-estimado={grupo.estimado || undefined}>
                <th scope="row">
                  {grupo.label}
                  {grupo.estimado ? <em className="data-table__tag">estimación</em> : null}
                  <small className="data-table__hint">
                    {grupo.hint}
                    {/* Un guión sin explicación se lee como un fallo de la app.
                        Diciendo por qué falta, se lee como lo que es: el Excel
                        no trae objetivo para toda la temporada. */}
                    {grupo.objetivoParcial ? (
                      <>
                        <br />
                        sin % — el objetivo cargado no cubre la temporada completa
                      </>
                    ) : null}
                  </small>
                </th>
                <td className="data-table__num">{formatEUR(grupo.objetivo)}</td>
                <td className="data-table__num">
                  {grupo.actual === null ? '—' : formatEUR(grupo.actual)}
                </td>
                <td
                  className="data-table__num"
                  data-direction={
                    grupo.diferencia === null
                      ? undefined
                      : grupo.diferencia >= 0
                        ? 'up'
                        : 'down'
                  }
                >
                  {grupo.diferencia === null ? '—' : formatSignedEUR(grupo.diferencia)}
                </td>
                <td className="data-table__num">{formatPercent(grupo.cumplimiento)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
