/**
 * Fila de tarjetas resumen.
 *
 * Contrato de cada tarjeta: `label` en minúscula de frase y sin dos puntos,
 * `value` como cifra destacada, `hint` opcional como contexto secundario y
 * `delta` opcional con signo. El color nunca es el único portador de
 * significado: el delta lleva siempre su signo escrito.
 *
 * @param {{cards: Array<{id: string, label: string, value: string, hint?: string, delta?: {text: string, direction: 'up'|'down'|'flat'}}>}} props
 */
export default function SummaryCards({ cards }) {
  if (!cards || cards.length === 0) return null;

  return (
    <div className="summary-cards">
      {cards.map((card) => (
        <article key={card.id} className="stat-tile">
          <p className="stat-tile__label">{card.label}</p>
          <p className="stat-tile__value">{card.value}</p>
          {card.delta ? (
            <p className="stat-tile__delta" data-direction={card.delta.direction}>
              {card.delta.text}
            </p>
          ) : null}
          {card.hint ? <p className="stat-tile__hint">{card.hint}</p> : null}
        </article>
      ))}
    </div>
  );
}
