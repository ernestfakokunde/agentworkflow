import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { getPortfolioData } from './services/portfolioService.js'
import { createTaskStore } from './services/taskStore.js'
import { workflowEngine } from './orchestrator/workflowEngine.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 4000
const taskStore = createTaskStore()

// Middleware
app.use(
  cors({
    origin: (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').split(','),
    credentials: true
  })
)
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Get portfolio data
app.get('/api/portfolio', async (req, res) => {
  try {
    const portfolio = await getPortfolioData()
    res.json(portfolio)
  } catch (error) {
    console.error('Portfolio fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch portfolio' })
  }
})

// Create new task
app.post('/api/tasks', async (req, res) => {
  try {
    const { amount, riskProfile, objectives, walletAddress } = req.body

    if (!amount || !riskProfile || !walletAddress) {
      return res.status(400).json({
        error: 'Missing required fields: amount, riskProfile, walletAddress'
      })
    }

    const taskId = `task_${Date.now()}`
    const task = {
      id: taskId,
      amount,
      riskProfile,
      objectives,
      walletAddress,
      status: 'pending',
      createdAt: new Date().toISOString(),
      workflowEvents: [],
      deployment: null
    }

    taskStore.addTask(task)

    // Start workflow asynchronously
    workflowEngine
      .executeWorkflow(task, taskStore)
      .then((result) => {
        task.status = 'deployed'
        task.deployment = result
        taskStore.updateTask(task)
      })
      .catch((error) => {
        console.error('Workflow error:', error)
        task.status = 'failed'
        task.error = error.message
        taskStore.updateTask(task)
      })

    res.json(task)
  } catch (error) {
    console.error('Task creation error:', error)
    res.status(500).json({ error: 'Failed to create task' })
  }
})

// Get task status
app.get('/api/tasks/:taskId', (req, res) => {
  try {
    const task = taskStore.getTask(req.params.taskId)
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }
    res.json(task)
  } catch (error) {
    console.error('Task fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch task' })
  }
})

// List all tasks
app.get('/api/tasks', (req, res) => {
  try {
    const tasks = taskStore.getAllTasks()
    res.json(tasks)
  } catch (error) {
    console.error('Tasks list error:', error)
    res.status(500).json({ error: 'Failed to fetch tasks' })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`✓ Aether Backend running on http://localhost:${PORT}`)
  console.log(`✓ API endpoints ready`)
  console.log(`✓ CORS enabled for: ${process.env.FRONTEND_ORIGIN || 'http://localhost:5173'}`)
})

export default app
