import { createSuiClient } from '@mysten/sui'

// Initialize the Sui client for testnet
const client = createSuiClient({
  rpcUrl: 'https://fullnode.testnet.sui.io:443'
})

export const dAppKit = {
  client,
  chains: [
    {
      id: 'sui:testnet',
      name: 'Sui Testnet',
      rpcUrl: 'https://fullnode.testnet.sui.io:443'
    }
  ],
  providers: ['Sui Wallet', 'Ethos Wallet']
}

export default dAppKit
