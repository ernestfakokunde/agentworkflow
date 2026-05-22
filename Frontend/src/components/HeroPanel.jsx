export function HeroPanel({ onNavigate }) {
  return (
    <section className="hero-panel" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow" style={{ color: 'var(--amber)', fontFamily: 'var(--pixel)', fontSize: '1.2rem' }}>Sui Overflow / DeFi & Payments</p>
        <h1 id="hero-title" style={{ fontFamily: 'var(--pixel)', color: 'var(--cyan)' }}>AetherFi</h1>
        <p className="hero-subtitle">Autonomous AI Portfolio Managers. Deposit USDC, let agents hunt for yield across Sui, rebalance securely, and prove every decision on-chain.</p>
        <div className="hero-actions">
          <button className="primary-action" onClick={() => onNavigate('create')} type="button" style={{ fontFamily: 'var(--pixel)', fontSize: '1.2rem', padding: '12px 24px' }}>
            DEPOSIT TO VAULT &gt;
          </button>
          <button className="secondary-action" onClick={() => onNavigate('dashboard')} type="button" style={{ fontFamily: 'var(--pixel)', fontSize: '1.2rem', padding: '12px 24px' }}>
            VIEW PORTFOLIO
          </button>
        </div>
      </div>

      <div className="network-visual" aria-label="DeFi Yield routing map">
        <div className="orbit-ring ring-one" />
        <div className="orbit-ring ring-two" />
        <div className="agent-node node-core">
          <span style={{ fontFamily: 'var(--pixel)' }}>Vault Core</span>
        </div>
        <div className="agent-node node-research">Yield Intel</div>
        <div className="agent-node node-strategy">Scallop</div>
        <div className="agent-node node-verify">NAVI</div>
        <div className="agent-node node-memory">Risk Check</div>
        <div className="agent-node node-sui">Arbitrage</div>
      </div>
    </section>
  )
}
