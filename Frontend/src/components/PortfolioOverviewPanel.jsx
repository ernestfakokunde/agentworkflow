function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'n/a'
  }

  return `${Number(value).toFixed(2)}%`
}

function formatDateTime(value) {
  if (!value) {
    return 'n/a'
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'n/a' : date.toLocaleString()
}

function formatStatus(status) {
  if (!status) {
    return 'Idle'
  }

  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function PortfolioOverviewPanel({ portfolio }) {
  const tvl = portfolio?.tvl?.display || '0.00 USDC'
  const netApy = formatPercent(portfolio?.netApy)
  const dailyYield = portfolio?.yield?.daily?.display || '0.00 USDC'
  const monthlyYield = portfolio?.yield?.monthly?.display || '0.00 USDC'
  const status = formatStatus(portfolio?.status)
  const snapshotAt = formatDateTime(portfolio?.snapshotAt)
  const nextRebalanceAt = formatDateTime(portfolio?.rebalance?.nextRebalanceAt)

  return (
    <section className="panel portfolio-overview" aria-label="Vault overview">
      <div className="portfolio-header">
        <div>
          <p className="section-kicker">Live Vault Overview</p>
          <h2>Active Balance</h2>
          <p className="portfolio-subtitle">Yield routing, vault health, and estimated on-chain positions. Deposits and withdrawals require confirmed wallet execution.</p>
        </div>
        <div className={`portfolio-status status-${status.toLowerCase()}`}>
          {status}
        </div>
      </div>

      <div className="portfolio-metrics">
        <div className="metric-card">
          <span className="metric-label">Total Value Locked</span>
          <strong className="metric-value">{tvl}</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">Net APY</span>
          <strong className="metric-value metric-cyan">{netApy}</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">24h Yield</span>
          <strong className="metric-value">{dailyYield}</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">30d Projection</span>
          <strong className="metric-value metric-amber">{monthlyYield}</strong>
        </div>
      </div>

      <div className="portfolio-meta">
        <div>
          <span>Last refreshed</span>
          <strong>{snapshotAt}</strong>
        </div>
        <div>
          <span>Next rebalance</span>
          <strong>{nextRebalanceAt}</strong>
        </div>
      </div>
    </section>
  )
}
