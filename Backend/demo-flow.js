#!/usr/bin/env node

// Simple demo - no env vars needed
import { createTaskStore } from './src/services/taskStore.js'
import { workflowEngine } from './src/orchestrator/workflowEngine.js'

async function runDemo() {
  console.log('=====================================')
  console.log('🎯 AETHER DEMO - END-TO-END FLOW')
  console.log('=====================================\n')

  const taskStore = createTaskStore()

  const demoTask = {
    id: 'demo_task_001',
    amount: 1000,
    riskProfile: 'conservative',
    objectives: 'Maximize stable yield on USDC',
    walletAddress: '0x123...demo',
    status: 'pending',
    createdAt: new Date().toISOString(),
    workflowEvents: [],
    deployment: null
  }

  console.log('📋 Demo Task Created:')
  console.log(`  ID: ${demoTask.id}`)
  console.log(`  Amount: $${demoTask.amount}`)
  console.log(`  Risk Profile: ${demoTask.riskProfile}`)
  console.log(`  Objectives: ${demoTask.objectives}\n`)

  taskStore.addTask(demoTask)

  try {
    console.log('🚀 Executing workflow...\n')
    const deployment = await workflowEngine.executeWorkflow(demoTask, taskStore)

    console.log('\n✅ DEMO COMPLETE\n')
    console.log('📊 Deployment Summary:')
    console.log(`  Status: ${deployment.status}`)
    console.log(`  Allocations: ${JSON.stringify(deployment.allocations)}`)
    console.log(`  Amounts: ${JSON.stringify(deployment.amounts)}`)
    console.log('\n✋ READY FOR WALLET SIGNATURE')
    console.log('=====================================\n')
  } catch (error) {
    console.error('\n❌ DEMO FAILED:')
    console.error(error.message)
    process.exit(1)
  }
}

runDemo()
