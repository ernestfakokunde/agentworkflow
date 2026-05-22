// Sui Transaction builders
// Note: In production, use actual @mysten/sui imports
// For demo, we mock the PTB construction

export function buildDeploymentPTB(taskId, allocations, escrowCoinId, packageId) {
  try {
    if (!packageId) {
      throw new Error('Portfolio vault package ID is required')
    }

    // Mock PTB object for demo
    const ptb = {
      id: taskId,
      type: 'deployment',
      escrowCoinId,
      packageId,
      allocations,
      timestamp: new Date().toISOString()
    }

    return ptb
  } catch (error) {
    console.error('PTB build error:', error)
    throw error
  }
}

export function buildRebalancingPTB(
  portfolioId,
  currentPositions,
  targetAllocations,
  packageId
) {
  try {
    // Mock PTB for rebalancing
    const ptb = {
      id: `rebalance_${Date.now()}`,
      type: 'rebalancing',
      portfolioId,
      packageId,
      currentPositions,
      targetAllocations,
      timestamp: new Date().toISOString()
    }

    return ptb
  } catch (error) {
    console.error('Rebalancing PTB build error:', error)
    throw error
  }
}

export function parseAIOutput(output) {
  try {
    // Try JSON first
    try {
      const json = JSON.parse(output)
      if (json.NAVI && json.Scallop && json.Cetus && json.Aftermath) {
        return {
          NAVI: json.NAVI,
          Scallop: json.Scallop,
          Cetus: json.Cetus,
          Aftermath: json.Aftermath
        }
      }
    } catch (e) {
      // JSON parse failed, try text parsing
    }

    // Try text parsing (e.g., "NAVI: 30%, Scallop: 30%, ...")
    const regex = /([A-Za-z]+):\s*(\d+(?:\.\d+)?)\s*%?/g
    const matches = {}
    let match

    while ((match = regex.exec(output)) !== null) {
      matches[match[1]] = parseFloat(match[2])
    }

    if (Object.keys(matches).length >= 2) {
      return {
        NAVI: matches.NAVI || 25,
        Scallop: matches.Scallop || 25,
        Cetus: matches.Cetus || 25,
        Aftermath: matches.Aftermath || 25
      }
    }

    // Fallback: equal distribution
    return {
      NAVI: 25,
      Scallop: 25,
      Cetus: 25,
      Aftermath: 25
    }
  } catch (error) {
    console.error('AI output parse error:', error)
    return {
      NAVI: 25,
      Scallop: 25,
      Cetus: 25,
      Aftermath: 25
    }
  }
}
