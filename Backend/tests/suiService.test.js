import { describe, it, expect } from 'vitest'
import { createTaskStore } from '../src/services/taskStore.js'
import { parseAIOutput } from '../src/blockchain/suiService.js'

describe('Task Store', () => {
  it('should create and retrieve tasks', () => {
    const store = createTaskStore()
    const task = {
      id: 'test_1',
      amount: 1000,
      status: 'pending'
    }

    store.addTask(task)
    const retrieved = store.getTask('test_1')

    expect(retrieved).toBeDefined()
    expect(retrieved.id).toBe('test_1')
  })

  it('should update task status', () => {
    const store = createTaskStore()
    const task = {
      id: 'test_2',
      amount: 1000,
      status: 'pending'
    }

    store.addTask(task)
    task.status = 'deployed'
    store.updateTask(task)

    const updated = store.getTask('test_2')
    expect(updated.status).toBe('deployed')
  })
})

describe('AI Output Parsing', () => {
  it('should parse JSON allocation format', () => {
    const jsonOutput = '{"NAVI": 30, "Scallop": 20, "Cetus": 25, "Aftermath": 25}'
    const result = parseAIOutput(jsonOutput)

    expect(result.NAVI).toBe(30)
    expect(result.Scallop).toBe(20)
  })

  it('should parse text allocation format', () => {
    const textOutput = 'NAVI: 30%, Scallop: 20%, Cetus: 25%, Aftermath: 25%'
    const result = parseAIOutput(textOutput)

    expect(result.NAVI).toBe(30)
    expect(result.Scallop).toBe(20)
  })

  it('should return default equal distribution on parse failure', () => {
    const invalidOutput = 'some random text'
    const result = parseAIOutput(invalidOutput)

    expect(result.NAVI).toBe(25)
    expect(result.Scallop).toBe(25)
  })
})
