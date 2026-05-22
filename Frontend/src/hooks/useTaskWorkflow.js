import { useState, useCallback, useEffect } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit'

const BACKEND_URL = 'http://localhost:4000'

export function useTaskWorkflow() {
  const account = useCurrentAccount()
  const [portfolio, setPortfolio] = useState(null)
  const [error, setError] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [task, setTask] = useState(null)
  const [workflowEvents, setWorkflowEvents] = useState([])
  const [memoryRecords, setMemoryRecords] = useState([])
  const [proofs, setProofs] = useState([])
  const [reputationEvents, setReputationEvents] = useState([])
  const [agents, setAgents] = useState([])
  const [settlement, setSettlement] = useState(null)

  // Fetch portfolio data
  const fetchPortfolio = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/portfolio`)
      if (!response.ok) throw new Error('Failed to fetch portfolio')
      const data = await response.json()
      setPortfolio(data)
    } catch (err) {
      setError(err.message)
    }
  }, [])

  // Launch workflow
  const launchWorkflow = useCallback(
    async (taskData) => {
      if (!account) {
        setError('Wallet connection required')
        return
      }

      setIsRunning(true)
      setError(null)
      setWorkflowEvents([])

      try {
        const response = await fetch(`${BACKEND_URL}/api/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...taskData,
            walletAddress: account.address
          })
        })

        if (!response.ok) throw new Error('Failed to create task')
        const newTask = await response.json()
        setTask(newTask)

        // Add workflow event
        setWorkflowEvents((prev) => [
          ...prev,
          {
            id: Date.now(),
            step: 'Portfolio Created',
            status: 'success',
            timestamp: new Date().toISOString()
          }
        ])

        // Poll for task status
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(
              `${BACKEND_URL}/api/tasks/${newTask.id}`
            )
            if (statusResponse.ok) {
              const updatedTask = await statusResponse.json()
              setTask(updatedTask)

              if (
                updatedTask.status === 'deployed' ||
                updatedTask.status === 'settled'
              ) {
                clearInterval(pollInterval)
                setIsRunning(false)
                setWorkflowEvents((prev) => [
                  ...prev,
                  {
                    id: Date.now(),
                    step: 'Workflow Complete',
                    status: 'success',
                    timestamp: new Date().toISOString()
                  }
                ])
              }
            }
          } catch (err) {
            console.error('Status poll error:', err)
          }
        }, 2000)
      } catch (err) {
        setError(err.message)
        setIsRunning(false)
      }
    },
    [account]
  )

  // Fetch portfolio on mount
  useEffect(() => {
    fetchPortfolio()
  }, [fetchPortfolio])

  return {
    portfolio,
    error,
    isRunning,
    task,
    workflowEvents,
    memoryRecords,
    proofs,
    reputationEvents,
    agents,
    settlement,
    launchWorkflow
  }
}
