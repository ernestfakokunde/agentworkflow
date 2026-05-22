export function WorkflowTimeline({ events }) {
  const hasEvents = events.length > 0

  return (
    <section className="panel timeline-panel" id="workflows" aria-labelledby="timeline-title">
      <div className="panel-heading inline-heading">
        <div>
          <span className="section-kicker">Vault Execution</span>
          <h2 id="timeline-title">Rebalance trace</h2>
        </div>
        <span className="status-pill">Live vault</span>
      </div>

      {hasEvents ? (
        <ol className="timeline">
          {events.map((event) => (
            <li className={`timeline-item ${event.status}`} key={event.id}>
              <span className="timeline-index">{event.id}</span>
              <div>
                <strong>{event.title}</strong>
                <p>{event.description}</p>
                <small>{event.meta}</small>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="panel-empty">No vault run yet. Deposit to generate the rebalance trace.</p>
      )}
    </section>
  )
}
