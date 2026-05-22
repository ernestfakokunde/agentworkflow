import { useEffect, useMemo, useState } from 'react'
import { createWorkflowTask, fetchPortfolioSnapshot, fetchTaskStatus } from '../services/aetherApi'

const agentDefaults = [
  {
    initials: 'RA',
    name: 'Research Agent',
    role: 'Collects market, protocol, and opportunity context.',
  },
  {
    initials: 'SA',
    name: 'Strategy Agent',
    role: 'Converts evidence into an execution strategy.',
  },
  {
    initials: 'VA',
    name: 'Validation Agent',
    role: 'Checks quality, risk, and coherence before settlement.',
  },
  {
    initials: 'EA',
    name: 'Execution Agent',
    role: 'Packages final output and completion proof.',
  },
]

export function useTaskWorkflow() {
  const [task, setTask] = useState(null)
  const [portfolio, setPortfolio] = useState(null)
  const [error, setError] = useState('')
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    let mounted = true

    fetchPortfolioSnapshot()
      .then((snapshot) => {
        if (mounted) setPortfolio(snapshot)
      })
      .catch((portfolioError) => {
        if (mounted) setError(portfolioError.message || 'Failed to load portfolio.')
      })

    return () => {
      mounted = false
    }
  }, [])

  async function launchWorkflow(input) {
    setError('')
    setIsRunning(true)

    try {
      const nextTask = await createWorkflowTask(input)
      setTask(nextTask)
      if (nextTask.status === 'pending') {
        pollTask(nextTask.id)
      } else {
        setIsRunning(false)
      }
      return nextTask
    } catch (workflowError) {
      setError(workflowError.message || 'Workflow failed.')
      setIsRunning(false)
      throw workflowError
    }
  }

  const mapped = useMemo(
    () => ({
      workflowEvents: mapWorkflowEvents(task),
      agents: mapAgents(task),
      memoryRecords: mapMemoryRecords(task),
      reputationEvents: mapReputationEvents(task),
      settlement: mapSettlement(task),
    }),
    [task],
  )

  return {
    portfolio,
    task,
    error,
    isRunning,
    launchWorkflow,
    ...mapped,
  }

  async function pollTask(taskId) {
    const maxAttempts = 12

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      await wait(1800)
      let updatedTask

      try {
        updatedTask = await fetchTaskStatus(taskId)
        setTask(updatedTask)
      } catch (pollError) {
        setError(pollError.message || 'Failed to refresh task status.')
        setIsRunning(false)
        return
      }

      if (['deployed', 'settled', 'failed'].includes(updatedTask.status)) {
        setIsRunning(false)
        return
      }
    }

    setIsRunning(false)
  }
}

function mapWorkflowEvents(task) {
  if (!task) return []

  const events = [
    {
      id: '01',
      title: 'Vault task created',
      description: task.objectives || task.objective || 'Portfolio allocation objective received.',
      meta: createAnchorMeta(task),
      status: task.status === 'failed' ? 'queued' : 'complete',
    },
  ]

  task.workflowEvents?.forEach((step, index) => {
    events.push({
      id: String(index + 2).padStart(2, '0'),
      title: `${step.agent} ${step.status}`,
      description: `${step.agent} processed the vault allocation workflow.`,
      meta: step.timestamp || task.updatedAt || task.createdAt,
      status: step.status === 'complete' ? 'complete' : 'active',
    })
  })

  if (task.deployment) {
    events.push({
      id: String(events.length + 1).padStart(2, '0'),
      title: 'Vault strategy generated',
      description: 'Agents generated allocations after the wallet-funded vault deposit settled.',
      meta: task.deployment.status,
      status: task.status === 'failed' ? 'queued' : 'complete',
    })
  }

  return events
}

function mapAgents(task) {
  return agentDefaults.map((agent) => {
    const step = task?.workflowEvents?.find((item) => item.agent === agent.name)

    return {
      ...agent,
      state: step ? 'Complete' : task ? 'Queued' : 'Idle',
      progress: step ? 100 : task ? 25 : 0,
      output: step ? step.status : '',
    }
  })
}

function mapMemoryRecords(task) {
  if (!task?.deployment) return []

  return [
    {
      id: task.deployment.taskId || task.id,
      type: 'deployment-ptb',
      description: `${task.deployment.status} / ${JSON.stringify(task.deployment.allocations)}`,
    },
  ]
}

function mapReputationEvents(task) {
  return (
    task?.workflowEvents?.map((event) => ({
      label: event.agent,
      value: event.status,
    })) || []
  )
}

function mapSettlement(task) {
  if (!task?.deployment) return null

  return {
    amount: `${task.deployment.amount || task.amount} USDC`,
    digest: task.vaultDeposit?.digest || task.chainProof?.digest,
    splits: [
      { agent: 'Research', amount: '25%' },
      { agent: 'Strategy', amount: '35%' },
      { agent: 'Validation', amount: '20%' },
      { agent: 'Execution', amount: '20%' },
    ],
  }
}

function createAnchorMeta(task) {
  const owner = task.walletAddress || task.ownerAddress || 'demo-wallet'
  const digest = task.chainProof?.digest

  if (digest) {
    return `Owner: ${shorten(owner)} / Vault deposit: ${shorten(digest)}`
  }

  return `Owner: ${shorten(owner)} / Waiting for vault deposit`
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function shorten(value) {
  if (!value || value.length < 14) return value || ''
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}
