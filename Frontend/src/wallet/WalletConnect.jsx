import { useCurrentAccount } from '@mysten/dapp-kit'
import { ConnectButton } from '@mysten/dapp-kit'

function shortenAddress(address) {
  if (!address) {
    return ''
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function WalletConnect() {
  const account = useCurrentAccount()

  return (
    <div className="wallet-cluster" aria-label="Sui wallet connection">
      {account ? (
        <div className="wallet-status">
          <span className="wallet-dot connected" aria-hidden="true" />
          <span>
            <strong>{shortenAddress(account.address)}</strong>
            <small>Sui Wallet Connected</small>
          </span>
        </div>
      ) : (
        <div className="wallet-status muted">
          <span className="wallet-dot" aria-hidden="true" />
          <span>
            <strong>Wallet required</strong>
            <small>Connect to create signed workflows</small>
          </span>
        </div>
      )}
      <ConnectButton />
    </div>
  )
}
