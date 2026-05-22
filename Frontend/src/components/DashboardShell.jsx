import { WalletConnect } from '../wallet/WalletConnect'

const navItems = [
  { id: 'home', label: 'Overview' },
  { id: 'create', label: 'New Vault' },
  { id: 'dashboard', label: 'Portfolio' },
  { id: 'agents', label: 'Yield Agents' },
  { id: 'logs', label: 'Audit Logs' },
]

export function DashboardShell({ activePage, children, onNavigate }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand brand-button" type="button" onClick={() => onNavigate('home')}>
          <span className="brand-mark" style={{ fontFamily: 'var(--pixel)', fontSize: '1.4rem' }}>Ae</span>
          <span>
            <strong style={{ fontFamily: 'var(--pixel)', fontSize: '1.25rem', letterSpacing: '1px' }}>AetherFi</strong>
            <small>Autonomous DeFi Portfolio</small>
          </span>
        </button>

        <nav className="main-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <button
              className={activePage === item.id ? 'active' : ''}
              key={item.id}
              onClick={() => onNavigate(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <WalletConnect />
      </header>
      <main id="top">{children}</main>
    </div>
  )
}
