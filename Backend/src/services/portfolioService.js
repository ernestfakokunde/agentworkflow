export async function getPortfolioData() {
  try {
    const protocols = [
      {
        name: 'NAVI',
        apy: 8.5,
        tvl: 125000000,
        type: 'Lending',
        url: 'https://naviprotocol.io'
      },
      {
        name: 'Scallop',
        apy: 11.2,
        tvl: 89500000,
        type: 'Lending',
        url: 'https://scallop.io'
      },
      {
        name: 'Cetus',
        apy: 15.8,
        tvl: 156800000,
        type: 'DEX LP',
        url: 'https://cetus.zone'
      },
      {
        name: 'Aftermath',
        apy: 12.3,
        tvl: 94200000,
        type: 'DEX LP',
        url: 'https://aftermath.finance'
      }
    ]

    return {
      protocols,
      timestamp: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }
  } catch (error) {
    console.error('Portfolio data fetch error:', error)
    throw error
  }
}
