function formatConfidence(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'n/a'
  }

  return `${Math.round(Number(value))}%`
}

export function AgentOutputsPanel({ outputs }) {
  const hasOutputs = outputs.length > 0

  return (
    <section className="panel outputs-panel" id="outputs" aria-labelledby="outputs-title">
      <div className="panel-heading inline-heading">
        <div>
          <span className="section-kicker">Agent Evidence</span>
          <h2 id="outputs-title">Agent outputs</h2>
        </div>
        <span className="status-pill">{outputs.length} artifacts</span>
      </div>

      {hasOutputs ? (
        <div className="outputs-list">
          {outputs.map((item) => (
            <article className="output-card" key={item.id}>
              <div className="output-header">
                <div>
                  <strong>{item.agent}</strong>
                  <small>{item.statusLabel || item.status}</small>
                </div>
                <span className="output-chip">{formatConfidence(item.confidence)}</span>
              </div>
              <p className="output-summary">{item.summary}</p>
              <pre className="output-body">{item.output || 'No output recorded.'}</pre>
              <div className="output-meta">
                <span>{item.artifactId}</span>
                {item.outputTruncated ? <span>Truncated</span> : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="panel-empty">No agent outputs yet.</p>
      )}
    </section>
  )
}
