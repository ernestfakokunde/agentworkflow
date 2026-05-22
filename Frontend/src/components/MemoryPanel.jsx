export function MemoryPanel({ records }) {
  const hasRecords = records.length > 0

  return (
    <section className="panel memory-panel" id="memory" aria-labelledby="memory-title">
      <div className="panel-heading">
        <span className="section-kicker">Walrus Memory</span>
        <h2 id="memory-title">Persistent execution records</h2>
      </div>
      {hasRecords ? (
        <ul className="memory-list">
          {records.map((record) => (
            <li key={record.id}>
              <span>{record.type}</span>
              <strong>{record.id}</strong>
              <small>{record.description}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="panel-empty">No Walrus artifacts yet.</p>
      )}
    </section>
  )
}
