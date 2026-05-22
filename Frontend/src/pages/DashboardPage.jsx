import { useState, useEffect } from 'react'
import { MigrationPanel } from '../components/MigrationPanel'
import { PortfolioOverviewPanel } from '../components/PortfolioOverviewPanel'
import { SignalsPanel } from '../components/SignalsPanel'
import { WithdrawalPanel } from '../components/WithdrawalPanel'
import { YieldSourcesPanel } from '../components/YieldSourcesPanel'
import { createWorkflowTask } from '../services/aetherApi'
import { useCurrentAccount, useDAppKit } from '@mysten/dapp-kit-react'
import { executeVaultDepositPTB, executeVaultWithdrawPTB } from '../wallet/suiTransactions'

export function DashboardPage({ workflow }) {
  const portfolio = workflow.portfolio
  const account = useCurrentAccount()
  const dAppKit = useDAppKit()
  const [yieldForecast, setYieldForecast] = useState(null)
  const [riskProfile, setRiskProfile] = useState(null)
  const [vaultPositions, setVaultPositions] = useState([])

  useEffect(() => {
    fetchYieldData()
  }, [portfolio])

  useEffect(() => {
    fetchVaultPositions()
  }, [account?.address])

  async function fetchYieldData() {
    try {
      const response = await fetch('http://localhost:4000/api/portfolio/yields/forecast')
      if (response.ok) {
        const data = await response.json()
        setYieldForecast(data.forecast)
      }

      const riskResponse = await fetch('http://localhost:4000/api/portfolio/risk/profile')
      if (riskResponse.ok) {
        const data = await riskResponse.json()
        setRiskProfile(data.risk)
      }
    } catch (err) {
      console.error('Failed to fetch yield/risk data', err)
    }
  }

  async function fetchVaultPositions() {
    try {
      if (!account?.address) {
        setVaultPositions([])
        return
      }

      const response = await fetch(
        `http://localhost:4000/api/portfolio/positions?ownerAddress=${encodeURIComponent(account.address)}`,
      )

      if (response.ok) {
        const data = await response.json()
        setVaultPositions(data.positions || [])
      } else {
        setVaultPositions([])
      }
    } catch (err) {
      console.error('Failed to load vault positions', err)
      setVaultPositions([])
    }
  }

  async function handleProtocolAction(protocol) {
    try {
      if (!account) {
        alert('Connect wallet to deposit before agents run')
        return
      }

      const amount = Math.max(1, Math.round((portfolio?.tvl?.amount || 1000) * 0.01))
      const vaultDeposit = await executeVaultDepositPTB({
        dAppKit,
        ownerAddress: account.address,
        amount,
        taskAnchorAddress: account.address,
      })

      const task = await createWorkflowTask({
        amount,
        riskProfile: riskProfile?.riskLevel?.toLowerCase() || 'balanced',
        objectives: `Quick action: ${protocol.action} allocation for ${protocol.name}`,
        walletAddress: account.address,
        ownerAddress: account.address,
        chainProof: vaultDeposit,
        vaultDeposit,
      })
      console.log('Action task created', task)
      alert(`Action task created: ${task.id}`)
    } catch (err) {
      console.error('Failed to create action task', err)
      alert('Failed to create action task')
    }
  }

  async function handleWithdraw(amount) {
    try {
      if (!account) {
        alert('Connect wallet to withdraw')
        return
      }

      const matchingPosition = vaultPositions[0]
      if (!matchingPosition?.positionId) {
        throw new Error('No on-chain vault position found for this wallet. The dashboard amount is only an estimate until deposit creates a real position.')
      }

      const response = await fetch('http://localhost:4000/api/portfolio/operations/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerAddress: account.address,
          amount,
          positionId: matchingPosition.positionId,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || payload.message || `Withdrawal request failed (${response.status})`)
      }

      const payload = await response.json()
      const { positionId } = payload

      const execution = await executeVaultWithdrawPTB({
        dAppKit,
        positionId,
        ownerAddress: account.address,
        allowDemoFallback: false,
      })

      console.log('Withdraw executed:', execution)
      alert(`Withdrawal submitted. Digest: ${execution.digest || 'pending'}`)
    } catch (err) {
      console.error('Withdraw failed', err)
      alert('Withdrawal failed: ' + err.message)
    }
  }

  async function handleProtocolDeposit(protocol) {
    try {
      if (!account || !portfolio) {
        alert('Connect wallet and ensure portfolio loaded')
        return
      }

      const portfolioAmount = Number(portfolio?.tvl?.amount || 1000)
      const allocationPct = Number(protocol.allocationPct || 1)
      const depositAmount = Math.max(1, Math.round((portfolioAmount * allocationPct) / 100))
      const vaultDeposit = await executeVaultDepositPTB({
        dAppKit,
        ownerAddress: account.address,
        amount: depositAmount,
        taskAnchorAddress: account.address,
      })

      const depositTask = await createWorkflowTask({
        amount: depositAmount,
        riskProfile: riskProfile?.riskLevel?.toLowerCase() || 'balanced',
        objectives: `Deposit ${depositAmount} into ${protocol.name} using the vault strategy.`,
        walletAddress: account.address,
        ownerAddress: account.address,
        chainProof: vaultDeposit,
        vaultDeposit,
      })

      console.log('Deposit executed:', vaultDeposit, depositTask)
      alert(`Deposit workflow created: ${depositTask.id}`)
    } catch (err) {
      console.error('Deposit failed', err)
      alert('Deposit failed: ' + err.message)
    }
  }

  async function handleRebalance() {
    try {
      if (!account || !portfolio?.protocols) {
        alert('Connect wallet and ensure portfolio loaded')
        return
      }

      const allocations = portfolio.protocols.map((p) => ({
        protocolId: p.id,
        amount: (portfolio.tvl.amount * p.allocationPct) / 100,
      }))

      const response = await fetch('http://localhost:4000/api/portfolio/operations/rebalance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allocations,
          ownerAddress: account.address,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to build rebalance PTB')
      }

      const { ptb } = await response.json()
      console.log('Rebalance PTB ready:', ptb)
      alert('Rebalance ready - approve in wallet')
    } catch (err) {
      console.error('Rebalance failed', err)
      alert('Rebalance failed: ' + err.message)
    }
  }

  return (
    <section className="page-grid dashboard-page" aria-label="AetherFi dashboard">
      <div className="page-heading">
        <span className="section-kicker" style={{ color: 'var(--amber)', fontFamily: 'var(--pixel)', fontSize: '1.2rem' }}>
          Vault Analytics
        </span>
        <h1 style={{ fontFamily: 'var(--pixel)', color: 'var(--cyan)' }}>Portfolio Manager</h1>
        <p>Live DeFi yields, smart contract checks, token reallocation logic, and cryptographically verified strategies.</p>
      </div>

      <PortfolioOverviewPanel portfolio={portfolio} />
      <YieldSourcesPanel protocols={portfolio?.protocols} onAction={handleProtocolAction} onDeposit={handleProtocolDeposit} />

      {yieldForecast && (
        <section className="panel yield-panel" aria-label="Yield forecast">
          <div className="panel-heading">
            <span className="section-kicker">Projections</span>
            <h2>Yield Forecast</h2>
          </div>
          <div className="yield-scenarios">
            {yieldForecast.scenarios.map((scenario) => (
              <div key={scenario.name} className="scenario-card">
                <h3>{scenario.name}</h3>
                <div className="scenario-metrics">
                  <div>
                    <strong>{scenario.apy.toFixed(2)}%</strong>
                    <small>APY</small>
                  </div>
                  <div>
                    <strong>${scenario.monthly.toFixed(2)}</strong>
                    <small>Monthly</small>
                  </div>
                  <div>
                    <strong>${scenario.yearly.toFixed(2)}</strong>
                    <small>Yearly</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {riskProfile && (
        <section className="panel risk-panel" aria-label="Risk profile">
          <div className="panel-heading">
            <span className="section-kicker">Risk Assessment</span>
            <h2>Portfolio Risk</h2>
          </div>
          <div className="risk-header">
            <div className={`risk-score risk-${riskProfile.riskLevel.toLowerCase()}`}>
              <strong>{riskProfile.riskScore}</strong>
              <small>{riskProfile.riskLevel}</small>
            </div>
            <div className="risk-signals">
              <div>
                <span>Volatility</span>
                <strong>{riskProfile.volatility}</strong>
              </div>
              <div>
                <span>Slippage</span>
                <strong>{riskProfile.slippage}</strong>
              </div>
              <div>
                <span>Concentration</span>
                <strong>{riskProfile.concentration}</strong>
              </div>
            </div>
          </div>
          {riskProfile.recommendations.length > 0 && (
            <div className="risk-recommendations">
              <h3>Recommendations</h3>
              <ul>
                {riskProfile.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <MigrationPanel migrations={portfolio?.migrations} />
      <WithdrawalPanel
        withdraw={portfolio?.withdraw}
        unlocks={portfolio?.unlocks}
        onWithdraw={handleWithdraw}
      />
      <SignalsPanel signals={portfolio?.signals} rebalance={portfolio?.rebalance} onRebalance={handleRebalance} />
    </section>
  )
}
