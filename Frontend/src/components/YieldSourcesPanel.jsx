function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'n/a'
  }

  return `${Number(value).toFixed(2)}%`
}

export function YieldSourcesPanel({ protocols, onAction, onDeposit }) {
  const hasProtocols = protocols && protocols.length > 0

  return (
    <section className="panel protocols-panel" aria-label="Yield sources">
      <div className="panel-heading inline-heading">
        <div>
          <span className="section-kicker">Protocol Matrix</span>
          <h2>Live Yield Sources</h2>
        </div>
          <span className="status-pill">{hasProtocols ? `${protocols.length} protocols` : 'No protocols'}</span>
      </div>

      {hasProtocols ? (
        <div className="protocol-table">
          <div className="protocol-row protocol-header">
            <span>Protocol</span>
            <span>Allocation</span>
            <span>APY</span>
            <span>Risk</span>
            <span>Liquidity</span>
            <span>Action</span>
          </div>
          {protocols.map((protocol) => (
            <div className="protocol-row" key={protocol.id}>
              <div>
                <strong>{protocol.name}</strong>
                <small>{protocol.category}</small>
              </div>
              <span>{protocol.allocationPct}%</span>
              <span className="protocol-apy">{formatPercent(protocol.apy)}</span>
              <span>{protocol.risk}</span>
              <span>{protocol.liquidity}</span>
              <span className={`action-pill action-${protocol.action}`}>
                <div className="protocol-action-group">
                  {onAction ? (
                    <button
                      className={`protocol-action-btn action-${protocol.action}`}
                      onClick={() => onAction(protocol)}
                      type="button"
                      title={`${protocol.action === 'increase' ? 'Increase' : protocol.action === 'reduce' ? 'Reduce' : 'Hold'} allocation`}
                    >
                      {protocol.action === 'increase' ? '↑' : protocol.action === 'reduce' ? '↓' : '→'}
                    </button>
                  ) : null}
                  {onDeposit ? (
                    <button
                      className="protocol-deposit-btn"
                      onClick={() => onDeposit(protocol)}
                      type="button"
                      title="Deposit to protocol"
                    >
                      +
                    </button>
                  ) : null}
                </div>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="panel-empty">No protocol data yet. Deploy a vault to load live yields. Button actions here currently build previews unless wallet execution is wired.</p>
      )}
    </section>
  )
}
