export function VaultStatsPanel({ task }) {
  const deposit = task?.escrowAmount || '0.00 SUI'
  const isRunning = task?.status === 'running' || task?.status === 'created'

  // Simulated DeFi metrics
  const activeApy = isRunning ? 'Calculating...' : '14.2% APY'
  const earnings = isRunning ? '+0.00' : '+$1.42'
  const statusLabel = isRunning ? 'Rebalancing' : 'Yielding'

  return (
    <section className="panel vault-stats-panel" aria-label="Vault performance">
      <div className="vault-stats-header">
        <div>
          <p className="vault-stats-kicker">Active Vault State</p>
          <h2>Vault Performance</h2>
        </div>
        <div className={`vault-status ${isRunning ? 'is-running' : 'is-active'}`}>
          Status: {statusLabel}
        </div>
      </div>

      <div className="vault-stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Value Locked (TVL)</span>
          <span className="stat-value">{deposit}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Optimized APY</span>
          <span className="stat-value stat-cyan">{activeApy}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">24h Earnings (Est)</span>
          <span className="stat-value stat-amber">{earnings}</span>
        </div>
      </div>

      <div className="vault-allocation">
        <div className="vault-allocation-header">
          <h3>Current Allocation</h3>
          <span className="allocation-hint">Adaptive routing</span>
        </div>
        {isRunning ? (
          <p className="allocation-muted">Agents are scanning for the best yields...</p>
        ) : (
          <div className="allocation-list">
            <div className="allocation-row">
              <span className="allocation-name">NAVI Protocol</span>
              <div className="allocation-bar">
                <div className="allocation-fill fill-cyan" style={{ width: '45%' }} />
              </div>
              <span className="allocation-value">45%</span>
            </div>
            <div className="allocation-row">
              <span className="allocation-name">Scallop</span>
              <div className="allocation-bar">
                <div className="allocation-fill fill-amber" style={{ width: '35%' }} />
              </div>
              <span className="allocation-value">35%</span>
            </div>
            <div className="allocation-row">
              <span className="allocation-name">Cetus LP</span>
              <div className="allocation-bar">
                <div className="allocation-fill fill-violet" style={{ width: '20%' }} />
              </div>
              <span className="allocation-value">20%</span>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}