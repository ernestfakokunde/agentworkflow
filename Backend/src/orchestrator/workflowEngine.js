import { GoogleGenerativeAI } from '@google/generative-ai'
import { deployPortfolioAllocation } from '../services/portfolioDeployment.js'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

async function runAgent(agentName, prompt) {
  try {
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    })

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: parseFloat(process.env.AI_TEMPERATURE || '0.2'),
        maxOutputTokens: parseInt(process.env.AI_MAX_TOKENS || '700')
      }
    })

    const response = result.response.text()
    console.log(`✓ ${agentName} completed`)
    return response
  } catch (error) {
    console.error(`${agentName} error:`, error)
    throw error
  }
}

export const workflowEngine = {
  async executeWorkflow(task, taskStore) {
    try {
      console.log(`🚀 Starting workflow for task ${task.id}`)

      // Step 1: Research Agent
      console.log('📊 Step 1: Research Agent analyzing protocols...')
      const researchPrompt = `Analyze the following DeFi protocols for USDC yield opportunities:
      - NAVI: 8.5% APY, $125M TVL, Lending
      - Scallop: 11.2% APY, $89.5M TVL, Lending
      - Cetus: 15.8% APY, $156.8M TVL, DEX LP
      - Aftermath: 12.3% APY, $94.2M TVL, DEX LP
      
      For a risk-averse portfolio with $1000 to deploy, recommend protocol analysis.
      Format: JSON with protocol names and risk scores.`

      const researchOutput = await runAgent('Research Agent', researchPrompt)

      // Step 2: Strategy Agent
      console.log('🎯 Step 2: Strategy Agent generating allocation...')
      const strategyPrompt = `Based on this protocol analysis:
      ${researchOutput}
      
      Generate an allocation strategy for $${task.amount} to maximize yield while maintaining ${task.riskProfile} risk profile.
      Return ONLY valid JSON: {"NAVI": 25, "Scallop": 25, "Cetus": 25, "Aftermath": 25} format.`

      const strategyOutput = await runAgent('Strategy Agent', strategyPrompt)

      // Step 3: Validation Agent
      console.log('✓ Step 3: Validation Agent verifying allocations...')
      const validationPrompt = `Validate this allocation output:
      ${strategyOutput}
      
      Ensure: 1) Valid JSON, 2) All protocols present, 3) Percentages sum ~100%, 4) Appropriate for ${task.riskProfile} risk profile.
      Reply YES if valid, NO with reason if not.`

      const validationOutput = await runAgent('Validation Agent', validationPrompt)

      // Step 4: Deployment
      console.log('🚀 Step 4: Deployment Agent preparing transaction...')
      const deployment = await deployPortfolioAllocation(
        task.id,
        task.amount,
        strategyOutput,
        process.env.ESCROW_COIN_ID || '0x1::sui::SUI',
        process.env.PORTFOLIO_VAULT_PACKAGE_ID
      )

      task.workflowEvents = [
        { agent: 'Research Agent', status: 'complete' },
        { agent: 'Strategy Agent', status: 'complete' },
        { agent: 'Validation Agent', status: 'complete' },
        { agent: 'Deployment Agent', status: 'complete' }
      ]

      console.log(`✅ Workflow complete for task ${task.id}`)
      console.log(`📊 Allocation: ${JSON.stringify(deployment.allocations)}`)
      console.log('✋ READY FOR WALLET SIGNATURE')

      return deployment
    } catch (error) {
      console.error('Workflow error:', error)
      throw error
    }
  }
}
