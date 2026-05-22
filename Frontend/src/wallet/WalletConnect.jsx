import { useCurrentAccount, useCurrentNetwork, useCurrentWallet } from '@mysten/dapp-kit-react'
import { ConnectButton } from '@mysten/dapp-kit-react/ui'

function shortenAddress(address) {
  if (!address) {
    return ''
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function WalletConnect() {
  const account = useCurrentAccount()
  const wallet = useCurrentWallet()
  const network = useCurrentNetwork()

  return (
    <div className="wallet-cluster" aria-label="Sui wallet connection">
      {account ? (
        <div className="wallet-status">
          <span className="wallet-dot connected" aria-hidden="true" />
          <span>
            <strong>{shortenAddress(account.address)}</strong>
            <small>
              {wallet?.name || 'Sui wallet'} / {network}
            </small>
          </span>
        </div>
      ) : (
        <div className="wallet-status muted">
          <span className="wallet-dot" aria-hidden="true" />
          <span>
            <strong>Wallet required</strong>
            <small>Connect to sign workflows</small>
          </span>
        </div>
      )}
      <ConnectButton className="sui-connect-button" />
    </div>
  )
}
