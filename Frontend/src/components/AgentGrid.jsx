export function AgentGrid({ agents }) {
  const activeCount = agents.filter((agent) => agent.state === 'Active').length
  const statusLabel = agents.length ? `${activeCount} active` : 'No agents yet'

  return (
    <section className="panel agents-panel" id="agents" aria-labelledby="agents-title">
      <div className="panel-heading inline-heading">
        <div>
          <span className="section-kicker">Autonomous Agents</span>
          <h2 id="agents-title">Coordination swarm</h2>
        </div>
        <span className="status-pill">{statusLabel}</span>
      </div>

      {agents.length ? (
        <div className="agent-grid">
          {agents.map((agent) => (
            <article className="agent-card" key={agent.name}>
              <div className="agent-card-top">
                <span className="agent-avatar">{agent.initials}</span>
                <span className={`agent-state ${agent.state.toLowerCase()}`}>{agent.state}</span>
              </div>
              <h3>{agent.name}</h3>
              <p>{agent.role}</p>
              <div className="meter" aria-label={`${agent.name} completion ${agent.progress}%`}>
                <span style={{ width: `${agent.progress}%` }} />
              </div>
              <small>{agent.output || 'Awaiting output.'}</small>
            </article>
          ))}
        </div>
      ) : (
        <p className="panel-empty">No agents have been coordinated yet.</p>
      )}
    </section>
  )
}
