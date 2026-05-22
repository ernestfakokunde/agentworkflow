function formatDateTime(value) {
  if (!value) {
    return 'n/a'
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'n/a' : date.toLocaleString()
}

export function WithdrawalPanel({ withdraw, unlocks, onWithdraw }) {
  const hasUnlocks = unlocks && unlocks.length > 0

  return (
    <section className="panel withdrawals-panel" aria-label="Withdraw forecast">
      <div className="panel-heading">
        <span className="section-kicker">Unlock Forecast</span>
        <h2>Withdraw Prediction</h2>
      </div>

      <div className="withdraw-meta">
        <div>
          <span>Estimated available now</span>
          <strong>{withdraw?.availableNow || '0.00 USDC'}</strong>
        </div>
        <div>
          <span>Next unlock</span>
          <strong>{formatDateTime(withdraw?.nextUnlockAt)}</strong>
        </div>
        <div>
          <span>Penalty</span>
          <strong>{withdraw?.penalty || '0%'}</strong>
        </div>
      </div>

      <p className="withdraw-recommendation">{withdraw?.recommendation || 'No withdraw guidance yet.'}</p>

      {hasUnlocks ? (
        <div className="unlock-list">
          {unlocks.map((unlock) => (
            <div className="unlock-row" key={unlock.label}>
              <div>
                <strong>{unlock.label}</strong>
                <small>{formatDateTime(unlock.availableAt)}</small>
              </div>
              <div className="unlock-actions">
                <span>{unlock.amount}</span>
                {onWithdraw && unlock.label === 'Available now' && (
                  <button
                    className="withdraw-btn"
                    onClick={() => onWithdraw(unlock.amount)}
                    type="button"
                  >
                    Withdraw
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="panel-empty">Unlock windows will appear once the vault is funded.</p>
      )}
    </section>
  )
}
