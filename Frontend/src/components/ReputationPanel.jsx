export function ReputationPanel({ events }) {
  const hasEvents = events.length > 0

  return (
    <section className="panel reputation-panel" id="reputation" aria-labelledby="reputation-title">
      <div className="panel-heading">
        <span className="section-kicker">Trust Infrastructure</span>
        <h2 id="reputation-title">Reputation updates</h2>
      </div>
      <div className="trust-score">
        <span>Network trust</span>
        <strong>94.6</strong>
      </div>
      {hasEvents ? (
        <ul className="compact-list">
          {events.map((event) => (
            <li key={event.label}>
              <span>{event.label}</span>
              <strong>{event.value}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className="panel-empty">Reputation updates will appear after a task completes.</p>
      )}
    </section>
  )
}
