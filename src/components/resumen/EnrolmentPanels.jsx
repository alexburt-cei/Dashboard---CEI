import ChartTable from '../charts/ChartTable';
import { periodoLabel } from '../../utils/dataTransform';
import { formatEUR, formatInteger, formatPercent } from '../../utils/format';

/**
 * Paneles de matriculación: online vs offline, y nuevas vs renovaciones.
 *
 * Los dos dependen de columnas opcionales del Excel, así que cada uno se apaga
 * por su cuenta con un aviso que dice **qué columna falta**. Un panel vacío sin
 * explicación se lee como un error de la app; diciendo qué falta, se lee como
 * una instrucción.
 */

/** Ahead / behind / plano. Plano no es ahead: con la misma cifra no se adelanta. */
const ESTADO_LABEL = { ahead: 'Ahead', behind: 'Behind', plano: 'Igual' };
const ESTADO_DIRECTION = { ahead: 'up', behind: 'down', plano: undefined };

/** Aviso de panel apagado por falta de datos, no por fallo. */
function PanelSinDatos({ title, columna, ejemplos }) {
  return (
    <section className="panel panel--muted">
      <h2 className="panel__title">{title}</h2>
      <p className="panel__empty">
        Este panel necesita la columna <code>{columna}</code> en el Excel, que no está en el
        archivo importado. Valores que acepta: {ejemplos}.
      </p>
    </section>
  );
}

/**
 * Matriculaciones por canal, con su cuota y el ahead/behind frente al año
 * anterior.
 */
export function CanalPanel({ canales }) {
  if (!canales) {
    return (
      <PanelSinDatos
        title="Matriculaciones online vs offline"
        columna="Canal"
        ejemplos="Online, Web, Digital · Offline, Presencial, Teléfono"
      />
    );
  }

  return (
    <section className="panel">
      <h2 className="panel__title">Matriculaciones online vs offline</h2>
      <p className="panel__subtitle">Convocatoria en curso, frente al mismo punto del año anterior</p>

      <div className="canal-grid">
        {canales.canales.map((canal) => (
          <article className="canal-card" key={canal.canal}>
            <p className="canal-card__label">{canal.label}</p>
            <p className="canal-card__value">{formatInteger(canal.matriculas ?? 0)}</p>
            <p className="canal-card__share">{formatPercent(canal.share)} del total</p>

            {/* ahead/behind con la palabra escrita, no sólo el color. */}
            {canal.estado === null ? (
              <p className="canal-card__delta">Sin dato del año anterior</p>
            ) : (
              <p
                className="canal-card__delta"
                data-direction={ESTADO_DIRECTION[canal.estado]}
              >
                {ESTADO_LABEL[canal.estado]} · {formatPercent(canal.variacion ?? 0)} vs año
                anterior
              </p>
            )}

            <p className="canal-card__hint">{formatEUR(canal.ingreso)}</p>
          </article>
        ))}
      </div>

      <ChartTable
        caption="Matriculaciones por canal, con comparación anual"
        columns={[
          { key: 'canal', label: 'Canal' },
          { key: 'matriculas', label: 'Matrículas', numeric: true },
          { key: 'share', label: '% del total', numeric: true },
          { key: 'anterior', label: 'Año anterior', numeric: true },
          { key: 'estado', label: 'Estado' },
        ]}
        rows={canales.canales.map((canal) => ({
          key: canal.canal,
          canal: canal.label,
          matriculas: formatInteger(canal.matriculas ?? 0),
          share: formatPercent(canal.share),
          anterior: canal.anterior === null ? '—' : formatInteger(canal.anterior),
          estado: canal.estado === null ? '—' : ESTADO_LABEL[canal.estado],
        }))}
      />
    </section>
  );
}

/** Reporte mensual de matrículas nuevas vs renovaciones. */
export function MatriculasPanel({ matriculas }) {
  if (!matriculas) {
    return (
      <PanelSinDatos
        title="Reporte mensual de matriculación"
        columna="Tipo Matrícula"
        ejemplos="Nueva, Alta, New Enrolment · Renovación, Re-matrícula, Renewal"
      />
    );
  }

  const maximo = Math.max(...matriculas.map((m) => m.total), 1);

  return (
    <section className="panel">
      <h2 className="panel__title">Reporte mensual de matriculación</h2>
      <p className="panel__subtitle">Nuevas vs renovaciones, por mes</p>

      <ul className="chart-legend">
        <li className="chart-legend__item">
          <span
            className="chart-legend__swatch"
            style={{ background: 'var(--series-1)' }}
            aria-hidden="true"
          />
          Nuevas
        </li>
        <li className="chart-legend__item">
          <span
            className="chart-legend__swatch"
            style={{ background: 'var(--series-3)' }}
            aria-hidden="true"
          />
          Renovaciones
        </li>
      </ul>

      <div className="stack-chart">
        {matriculas.map((mes) => (
          <div className="stack-chart__row" key={mes.periodo}>
            <span className="stack-chart__label">{periodoLabel(mes.periodo)}</span>
            <span className="stack-chart__track">
              {/* Hueco de 2px entre segmentos: sin él, dos colores contiguos se
                  leen como una sola barra de un tono intermedio. */}
              <span
                className="stack-chart__seg"
                style={{
                  width: `${(mes.nueva / maximo) * 100}%`,
                  background: 'var(--series-1)',
                }}
                title={`${periodoLabel(mes.periodo)} · nuevas: ${mes.nueva}`}
              />
              <span
                className="stack-chart__seg"
                style={{
                  width: `${(mes.renovacion / maximo) * 100}%`,
                  background: 'var(--series-3)',
                }}
                title={`${periodoLabel(mes.periodo)} · renovaciones: ${mes.renovacion}`}
              />
            </span>
            <span className="stack-chart__value">{formatInteger(mes.total)}</span>
          </div>
        ))}
      </div>

      <ChartTable
        caption="Matrículas nuevas y renovaciones por mes"
        columns={[
          { key: 'mes', label: 'Mes' },
          { key: 'nueva', label: 'Nuevas', numeric: true },
          { key: 'renovacion', label: 'Renovaciones', numeric: true },
          { key: 'total', label: 'Total', numeric: true },
          { key: 'share', label: '% nuevas', numeric: true },
        ]}
        rows={matriculas.map((mes) => ({
          key: mes.periodo,
          mes: periodoLabel(mes.periodo),
          nueva: formatInteger(mes.nueva),
          renovacion: formatInteger(mes.renovacion),
          total: formatInteger(mes.total),
          share: formatPercent(mes.shareNuevas),
        }))}
      />
    </section>
  );
}
