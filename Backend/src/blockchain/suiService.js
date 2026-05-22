// Sui deployment plan helpers. Wallet-signed vault funding happens in the frontend
// so the user's USDC is debited by Sui before the agents run.

export function buildDeploymentPTB(taskId, allocations, vaultDepositDigest, packageId) {
  try {
    if (!packageId) {
      throw new Error('Portfolio vault package ID is required')
    }

    const plan = {
      id: taskId,
      type: 'funded-vault-strategy',
      vaultDepositDigest,
      packageId,
      allocations,
      timestamp: new Date().toISOString()
    }

    return plan
  } catch (error) {
    console.error('Deployment plan build error:', error)
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
