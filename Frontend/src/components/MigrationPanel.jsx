export function MigrationPanel({ migrations }) {
  const hasMigrations = migrations && migrations.length > 0

  return (
    <section className="panel migrations-panel" aria-label="Migration suggestions">
      <div className="panel-heading">
        <span className="section-kicker">Protocol Switches</span>
        <h2>Recommended Migrations</h2>
      </div>
      {hasMigrations ? (
        <ul className="migration-list">
          {migrations.map((migration) => (
            <li key={migration.id}>
              <div>
                <strong>{migration.from} {' → '} {migration.to}</strong>
                <small>{migration.reason}</small>
              </div>
              <div className="migration-meta">
                <span>{migration.amount}</span>
                <span>{migration.expectedApy}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="panel-empty">No migrations suggested yet.</p>
      )}
    </section>
  )
}
