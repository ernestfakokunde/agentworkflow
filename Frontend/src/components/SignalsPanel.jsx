export function SignalsPanel({ signals, rebalance, onRebalance }) {
  const signalEntries = signals ? Object.entries(signals) : []

  return (
    <section className="panel signals-panel" aria-label="Risk and signal health">
      <div className="panel-heading">
        <span className="section-kicker">Vault Signals</span>
        <h2>Risk + Liquidity Health</h2>
      </div>

      <div className="signal-grid">
        {signalEntries.length ? (
          signalEntries.map(([label, value]) => (
            <div className="signal-card" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))
        ) : (
          <p className="panel-empty">Signal readings will appear after the first rebalance.</p>
        )}
      </div>

      <div className="rebalance-meta">
        <div>
          <span>Last rebalance</span>
          <strong>{rebalance?.lastRebalanceAt ? new Date(rebalance.lastRebalanceAt).toLocaleString() : 'n/a'}</strong>
        </div>
        <div>
          <span>Next rebalance</span>
          <strong>{rebalance?.nextRebalanceAt ? new Date(rebalance.nextRebalanceAt).toLocaleString() : 'n/a'}</strong>
        </div>
        <div>
          <span>Cadence</span>
          <strong>{rebalance?.cadence || 'n/a'}</strong>
        </div>
      </div>

      {onRebalance && (
        <button className="rebalance-btn" onClick={onRebalance} type="button">
          Rebalance Now
        </button>
      )}
    </section>
  )
}
