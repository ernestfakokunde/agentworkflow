export function SettlementPanel({ settlement }) {
  if (!settlement) {
    return (
      <section className="panel settlement-panel" aria-labelledby="settlement-title">
        <div className="panel-heading">
          <span className="section-kicker">Economic Coordination</span>
          <h2 id="settlement-title">Autonomous settlement</h2>
        </div>
        <p className="panel-empty">Settlement details will appear after validation completes.</p>
      </section>
    )
  }

  return (
    <section className="panel settlement-panel" aria-labelledby="settlement-title">
      <div className="panel-heading">
        <span className="section-kicker">Economic Coordination</span>
        <h2 id="settlement-title">Autonomous settlement</h2>
      </div>

      <div className="settlement-amount">
        <span>Escrow locked</span>
        <strong>{settlement.amount}</strong>
      </div>

      <p className="settlement-note">
        Escrow is locked value reserved for the agents and released only after validation completes.
      </p>

      <div className="settlement-grid">
        {settlement.splits.map((split) => (
          <div key={split.agent}>
            <span>{split.agent}</span>
            <strong>{split.amount}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}
