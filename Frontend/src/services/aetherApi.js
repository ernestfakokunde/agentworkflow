const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export async function createWorkflowTask(taskData) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || 'Failed to create task')
    return payload.task || payload
  } catch (error) {
    console.error('Task creation error:', error)
    throw error
  }
}

export async function fetchPortfolioSnapshot() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/portfolio`)
    if (!response.ok) throw new Error('Failed to fetch portfolio')
    return await response.json()
  } catch (error) {
    console.error('Portfolio fetch error:', error)
    throw error
  }
}

export async function fetchTaskStatus(taskId) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/tasks/${taskId}`)
    if (!response.ok) throw new Error('Failed to fetch task')
    const payload = await response.json()
    return payload.task || payload
  } catch (error) {
    console.error('Task status fetch error:', error)
    throw error
  }
}

export async function fetchAllTasks() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/tasks`)
    if (!response.ok) throw new Error('Failed to fetch tasks')
    return await response.json()
  } catch (error) {
    console.error('Tasks fetch error:', error)
    throw error
  }
}
