import { parseAIOutput, buildDeploymentPTB } from '../blockchain/suiService.js'

export async function deployPortfolioAllocation(
  taskId,
  amount,
  aiStrategyOutput,
  escrowCoinId,
  packageId
) {
  try {
    // Parse AI output to get allocations
    const allocations = parseAIOutput(aiStrategyOutput)

    // Validate allocations sum to ~100%
    const total =
      allocations.NAVI +
      allocations.Scallop +
      allocations.Cetus +
      allocations.Aftermath
    if (total === 0) {
      throw new Error('Invalid allocations: total is zero')
    }

    // Normalize to 100%
    const normalized = {
      NAVI: (allocations.NAVI / total) * 100,
      Scallop: (allocations.Scallop / total) * 100,
      Cetus: (allocations.Cetus / total) * 100,
      Aftermath: (allocations.Aftermath / total) * 100
    }

    // Calculate amounts per protocol
    const amounts = {
      NAVI: Math.round((amount * normalized.NAVI) / 100),
      Scallop: Math.round((amount * normalized.Scallop) / 100),
      Cetus: Math.round((amount * normalized.Cetus) / 100),
      Aftermath: Math.round((amount * normalized.Aftermath) / 100)
    }

    // Build PTB
    const ptb = buildDeploymentPTB(
      taskId,
      normalized,
      escrowCoinId,
      packageId
    )

    return {
      taskId,
      amount,
      allocations: normalized,
      amounts,
      ptb,
      status: 'ready_for_signature',
      createdAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('Portfolio deployment error:', error)
    throw error
  }
}
