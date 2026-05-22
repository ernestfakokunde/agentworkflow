import { AgentGrid } from '../components/AgentGrid'
import { SettlementPanel } from '../components/SettlementPanel'

export function AgentsPage({ workflow }) {
  return (
    <section className="page-grid" aria-label="AetherFi Yield Agents">
      <div className="page-heading">
        <span className="section-kicker" style={{ color: 'var(--amber)', fontFamily: 'var(--pixel)', fontSize: '1.2rem'}}>Vault Operator Swarm</span>
        <h1 style={{ fontFamily: 'var(--pixel)', color: 'var(--cyan)' }}>Yield Agents</h1>
        <p>Specialized DeFi workers for yield scouting, risk pricing, slippage simulation, and PTB execution.</p>
      </div>
      <AgentGrid agents={workflow.agents} />
      <SettlementPanel settlement={workflow.settlement} />
    </section>
  )
}
