import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'
import { useState } from 'react'
import { createTaskOnchain, hasTaskManagerPackage } from '../wallet/suiTransactions'

export function TaskComposer({ error, isRunning, latestTask, onCompleted, onLaunch }) {
  const account = useCurrentAccount()
  const suiClient = useSuiClient()
  const [objective, setObjective] = useState(
    'Maximize yield across Sui DeFi (NAVI, Scallop, Cetus) for a stablecoin portfolio.',
  )
  const [escrowAmount, setEscrowAmount] = useState('5000.00 USDC')
  const [chainStatus, setChainStatus] = useState('')
  const [localError, setLocalError] = useState('')
  const [isSigning, setIsSigning] = useState(false)
  const allowDemoFallback = import.meta.env.VITE_ALLOW_DEMO_FALLBACK !== 'false'

  async function handleSubmit(event) {
    event.preventDefault()

    setLocalError('')
    setIsSigning(true)
    if (!hasTaskManagerPackage()) {
      setChainStatus('Running in demo mode.')
    } else if (!account?.address && allowDemoFallback) {
      setChainStatus('Wallet not connected. Demo fallback enabled.')
    } else {
      setChainStatus('Requesting Sui signature...')
    }

    try {
      const chainProof = await createTaskOnchain({
        dAppKit,
        objective,
        ownerAddress: account?.address,
        allowDemoFallback,
      })

      if (chainProof.digest) {
        setChainStatus(
          `Onchain task anchored: ${chainProof.digest.slice(0, 12)}... running agents.`,
        )
      } else {
        setChainStatus(chainProof.note || 'Demo mode: running agents.')
      }

      await onLaunch({
        objective,
        escrowAmount,
        ownerAddress: account?.address || 'demo-wallet',
        chainProof,
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
            Max Slippage
            <input type="text" defaultValue="0.5%" aria-label="Max Slippage" />
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
              Portfolio synced {latestTask.id} across {latestTask.workflow.length} agent verifications.
            </p>
          ) : (
            <p>Wallet connection required to deploy to testnet vaults.</p>
          )}
        </div>
      </form>
    </section>
  )
}
