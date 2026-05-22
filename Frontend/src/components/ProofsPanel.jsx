function formatValue(value) {
  return value || 'n/a'
}

export function ProofsPanel({ proofs }) {
  const chain = proofs?.chain
  const artifacts = proofs?.artifacts || []
  const hasArtifacts = artifacts.length > 0
  const hasChain = Boolean(chain)

  return (
    <section className="panel proofs-panel" id="proofs" aria-labelledby="proofs-title">
      <div className="panel-heading inline-heading">
        <div>
          <span className="section-kicker">Proof Layer</span>
          <h2 id="proofs-title">Proof references</h2>
        </div>
        <span className="status-pill">{hasArtifacts ? `${artifacts.length} blobs` : 'No blobs yet'}</span>
      </div>

      {hasChain ? (
        <div className="proofs-chain">
          <div>
            <span>Owner</span>
            <strong>{formatValue(chain.owner)}</strong>
          </div>
          <div>
            <span>Chain mode</span>
            <strong>{formatValue(chain.mode)}</strong>
          </div>
          <div>
            <span>Sui digest</span>
            <strong>{formatValue(chain.digest)}</strong>
          </div>
          <div>
            <span>Package</span>
            <strong>{formatValue(chain.packageId)}</strong>
          </div>
        </div>
      ) : null}

      {hasArtifacts ? (
        <ul className="proofs-list">
          {artifacts.map((artifact) => (
            <li key={artifact.id}>
              <div>
                <strong>{artifact.type}</strong>
                <small>{artifact.agent}</small>
              </div>
              <span>{artifact.id}</span>
              <small>{artifact.contentHash}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="panel-empty">No Walrus blobs recorded yet.</p>
      )}
    </section>
  )
}
