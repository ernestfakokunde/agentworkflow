import { Transaction, coinWithBalance } from '@mysten/sui/transactions'

const TASK_MANAGER_PACKAGE_ID = import.meta.env.VITE_AETHER_TASK_MANAGER_PACKAGE_ID
const PORTFOLIO_VAULT_PACKAGE_ID = import.meta.env.VITE_PORTFOLIO_VAULT_PACKAGE_ID
const USDC_COIN_TYPE = import.meta.env.VITE_USDC_COIN_TYPE
const USDC_DECIMALS = Number.parseInt(import.meta.env.VITE_USDC_DECIMALS || '6', 10)

export function hasTaskManagerPackage() {
  return Boolean(TASK_MANAGER_PACKAGE_ID)
}

export function hasVaultDepositConfig() {
  return Boolean(PORTFOLIO_VAULT_PACKAGE_ID && USDC_COIN_TYPE)
}

export async function createTaskOnchain({ allowDemoFallback, dAppKit, objective, ownerAddress }) {
  if (!TASK_MANAGER_PACKAGE_ID) {
    return createDemoProof('Task manager package is not configured.')
  }

  if (!ownerAddress) {
    if (allowDemoFallback) {
      return createDemoProof('Wallet not connected. Demo fallback enabled.')
    }

    throw new Error('Connect a Sui wallet before creating an onchain task.')
  }

  const tx = new Transaction()
  const objectiveHash = await createDigestBytes(objective)
  const memorySeed = Array.from(new TextEncoder().encode('pending-walrus-artifact'))

  const task = tx.moveCall({
    target: `${TASK_MANAGER_PACKAGE_ID}::task_manager::create_task`,
    arguments: [
      tx.pure.vector('u8', objectiveHash),
      tx.pure.vector('u8', memorySeed),
      tx.pure.vector('address', []),
    ],
  })

  tx.transferObjects([task], tx.pure.address(ownerAddress))

  const result = await dAppKit.signAndExecuteTransaction({ transaction: tx })

  if (result.FailedTransaction) {
    throw new Error(formatSuiError(result.FailedTransaction.status.error, 'Sui transaction failed.'))
  }

  return {
    mode: 'sui',
    digest: result.Transaction.digest,
    packageId: TASK_MANAGER_PACKAGE_ID,
    status: result.Transaction.status,
  }
}

export async function executeVaultDepositPTB({ dAppKit, ownerAddress, amount, taskAnchorAddress }) {
  if (!ownerAddress) {
    throw new Error('Connect a wallet before depositing.')
  }

  if (!PORTFOLIO_VAULT_PACKAGE_ID) {
    throw new Error('Portfolio vault package ID is not configured.')
  }

  if (!USDC_COIN_TYPE) {
    throw new Error('USDC coin type is not configured.')
  }

  if (!dAppKit) {
    throw new Error('Wallet signer is not available.')
  }

  const atomicAmount = toAtomicAmount(amount, USDC_DECIMALS)
  if (atomicAmount <= 0n) {
    throw new Error('Enter a deposit amount greater than zero.')
  }

  const tx = new Transaction()
  tx.setSender(ownerAddress)

  const depositCoin = coinWithBalance({
    type: USDC_COIN_TYPE,
    balance: atomicAmount,
  })(tx)

  const portfolio = tx.moveCall({
    target: `${PORTFOLIO_VAULT_PACKAGE_ID}::portfolio_vault::create_portfolio`,
    typeArguments: [USDC_COIN_TYPE],
    arguments: [
      tx.pure.address(taskAnchorAddress || ownerAddress),
      depositCoin,
    ],
  })

  tx.transferObjects([portfolio], tx.pure.address(ownerAddress))

  const result = await dAppKit.signAndExecuteTransaction({ transaction: tx })

  if (result.FailedTransaction) {
    throw new Error(formatSuiError(result.FailedTransaction.status.error, 'Sui vault deposit failed.'))
  }

  return {
    mode: 'sui',
    digest: result.Transaction.digest,
    packageId: PORTFOLIO_VAULT_PACKAGE_ID,
    coinType: USDC_COIN_TYPE,
    amount,
    atomicAmount: atomicAmount.toString(),
    status: result.Transaction.status,
  }
}

export async function executeVaultWithdrawPTB({ allowDemoFallback, ownerAddress, positionId, amount }) {
  if (!ownerAddress) {
    if (allowDemoFallback) return createDemoProof('Wallet not connected. Demo withdrawal simulated.')
    throw new Error('Connect a wallet before withdrawing.')
  }

  return {
    mode: 'demo',
    digest: null,
    note: `Withdraw PTB placeholder prepared for ${positionId} with ${amount}.`,
  }
}

function createDemoProof(note) {
  return {
    mode: 'demo',
    digest: null,
    packageId: TASK_MANAGER_PACKAGE_ID || null,
    note,
  }
}

async function createDigestBytes(value) {
  const encoded = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(digest))
}

function toAtomicAmount(amount, decimals) {
  const normalized = String(amount)
    .trim()
    .replace(/,/g, '')
    .replace(/[^0-9.]/g, '')

  if (!normalized) return 0n

  const [wholePart, rawFraction = ''] = normalized.split('.')
  const whole = BigInt(wholePart || '0')
  const fraction = rawFraction.slice(0, decimals).padEnd(decimals, '0')
  const unit = 10n ** BigInt(decimals)

  return whole * unit + BigInt(fraction || '0')
}

function formatSuiError(error, fallback) {
  if (!error) return fallback
  if (typeof error === 'string') return error
  return error.message || fallback
}
