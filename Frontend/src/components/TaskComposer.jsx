import { useCurrentAccount, useDAppKit } from '@mysten/dapp-kit-react'
import { useState } from 'react'
import { executeVaultDepositPTB, hasVaultDepositConfig } from '../wallet/suiTransactions'

export function TaskComposer({ error, isRunning, latestTask, onCompleted, onLaunch }) {
  const account = useCurrentAccount()
  const dAppKit = useDAppKit()
  const [objective, setObjective] = useState(
    'Maximize yield across Sui DeFi (NAVI, Scallop, Cetus) for a stablecoin portfolio.',
  )
  const [escrowAmount, setEscrowAmount] = useState('5000.00 USDC')
  const [riskProfile, setRiskProfile] = useState('balanced')
  const [chainStatus, setChainStatus] = useState('')
  const [localError, setLocalError] = useState('')
  const [isSigning, setIsSigning] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    setLocalError('')
    setIsSigning(true)
    setChainStatus('Requesting Sui vault deposit signature...')

    try {
      if (!hasVaultDepositConfig()) {
        throw new Error('Configure the vault package ID and testnet USDC coin type before depositing.')
      }

      const depositAmount = parseAmount(escrowAmount)
      const vaultDeposit = await executeVaultDepositPTB({
        dAppKit,
        ownerAddress: account?.address,
        amount: depositAmount,
        taskAnchorAddress: account?.address,
      })

      setChainStatus(
        `Vault funded on Sui: ${vaultDeposit.digest.slice(0, 12)}... running agents.`,
      )

      await onLaunch({
        amount: depositAmount,
        riskProfile,
        objectives: objective,
        objective,
        escrowAmount,
        walletAddress: account?.address,
        ownerAddress: account?.address,
        chainProof: vaultDeposit,
        vaultDeposit,
      })

      setChainStatus('Workflow complete. Dashboard updated.')
      onCompleted?.()
    } catch (launchError) {
      setLocalError(launchError.message || 'Workflow launch failed.')
      setChainStatus('')
    } finally {
      setIsSigning(false)
    }
  }

  return (
    <section className="panel task-panel" id="create-task" aria-labelledby="task-title">
      <div className="panel-heading">
        <span className="section-kicker" style={{ fontFamily: 'var(--pixel)', color: 'var(--amber)' }}>Vault Strategy Intent</span>
        <h2 id="task-title" style={{ fontFamily: 'var(--pixel)', fontSize: '2rem' }}>Define Target Yield Profile</h2>
      </div>

      <form className="task-form" onSubmit={handleSubmit}>
        <label htmlFor="objective" style={{ fontFamily: 'var(--sans)' }}>Risk & Strategy Directives</label>
        <textarea
          id="objective"
          value={objective}
          onChange={(event) => setObjective(event.target.value)}
          rows="5"
        />

        <div className="task-controls">
          <label style={{ fontFamily: 'var(--sans)' }}>
            Deposit Amount
            <input
              type="text"
              value={escrowAmount}
              onChange={(event) => setEscrowAmount(event.target.value)}
              aria-label="Deposit Amount"
            />
            <small className="field-hint">Funds injected into the Vault PTB protocol.</small>
          </label>
          <label style={{ fontFamily: 'var(--sans)' }}>
            Risk Profile
            <select
              aria-label="Risk Profile"
              value={riskProfile}
              onChange={(event) => setRiskProfile(event.target.value)}
            >
              <option value="conservative">Conservative</option>
              <option value="balanced">Balanced</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </label>
        </div>

        <button type="submit" className="launch-button" disabled={isRunning || isSigning} style={{ fontFamily: 'var(--pixel)', fontSize: '1.4rem' }}>
          {isSigning ? 'AWAITING WALLET...' : isRunning ? 'CALCULATING ROUTES...' : 'DEPOSIT TO VAULT'}
        </button>

        <div className="task-feedback" aria-live="polite">
          {localError || error ? <p className="form-error">{localError || error}</p> : null}
          {chainStatus ? <p>{chainStatus}</p> : null}
          {latestTask ? (
            <p className="form-success">
              Portfolio synced {latestTask.id} across {latestTask.workflowEvents?.length || 0} agent
              verifications.
            </p>
          ) : (
            <p>Wallet connection and testnet USDC are required to fund the vault.</p>
          )}
        </div>
      </form>
    </section>
  )
}

function parseAmount(value) {
  const amount = Number.parseFloat(String(value).replace(/[^0-9.]/g, ''))
  return Number.isFinite(amount) && amount > 0 ? amount : 0
}
