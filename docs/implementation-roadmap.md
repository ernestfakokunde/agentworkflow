# Implementation Roadmap - Ready for Hackathon

## Current Status: 90% Complete
All architecture, contracts, and workflows are designed. Now requires concrete implementation of Sui integration.

---

## Priority 1: Get First Transaction Working (Day 1-2)

### 1.1 Identify Actual Sui Testnet USDC Coin Type
```bash
# Check testnet for USDC
sui client call --function=<lookup> --package=<config>

# You need this value (example):
# 0x2::usdc::USDC  OR  0x5d4b302506645c37ff133b98c4b50864d503d656::coin::COIN

# Then update in ALL Move files:
# escrow.move
# portfolio_vault.move
# All adapters
```

### 1.2 Create Testnet Wallet & Get USDC
```bash
# Generate testnet wallet
sui client new-address secp256k1

# Get testnet faucet USDC
# Visit: https://discord.gg/sui (request from faucet)
# or
sui client call --function=mint --package=<usdc> --args=<amount>
```

### 1.3 Deploy Move Contracts
```bash
cd contracts/escrow
sui client publish --gas-budget 100000000 --network testnet

# Record package ID (e.g., 0xabc123...)
# Repeat for:
# - contracts/portfolio_vault
# - contracts/protocol_adapters
# - contracts/task_manager (already deployed?)
# - contracts/reputation (already deployed?)

# Update .env:
SUI_PACKAGE_ID=0x<escrow-package-id>
VAULT_PACKAGE_ID=0x<vault-package-id>
PROTOCOL_ADAPTERS_PACKAGE_ID=0x<adapters-package-id>
```

### 1.4 Implement Real PTB Execution in Backend

**File**: `Backend/src/blockchain/suiService.js` → `buildDeploymentPTB()`

```javascript
export async function buildDeploymentPTB({ ownerAddress, taskId, allocations, escrowCoinId }) {
  const VAULT_PKG = process.env.VAULT_PACKAGE_ID
  const PROTOCOL_PKG = process.env.PROTOCOL_ADAPTERS_PACKAGE_ID
  
  const tx = new Transaction()
  
  // 1. Split coin for each allocation
  const coins = []
  let remaining = escrowCoinId
  
  for (let i = 0; i < allocations.length; i++) {
    const amount = allocations[i].amount
    
    if (i === allocations.length - 1) {
      // Last coin gets everything left
      coins.push(remaining)
    } else {
      // Split off amount for this protocol
      const [coin, rest] = tx.splitCoins(remaining, [tx.pure.u64(amount)])
      coins.push(coin)
      remaining = rest
    }
  }
  
  // 2. Create portfolio
  const portfolio = tx.moveCall({
    target: `${VAULT_PKG}::portfolio_vault::create_portfolio`,
    arguments: [
      tx.pure.address(taskId),
      coins[0], // Start with first allocation coin
      tx.object('0x6'),
    ],
  })
  
  // 3. Set allocations
  const protocols = allocations.map(a => 
    tx.pure.vector('u8', Array.from(new TextEncoder().encode(a.protocolId)))
  )
  const percentages = allocations.map(a => tx.pure.u64(a.percentage * 100)) // Convert to basis points
  
  tx.moveCall({
    target: `${VAULT_PKG}::portfolio_vault::set_allocations`,
    arguments: [portfolio, tx.pure.vector('vector<u8>', protocols), percentages],
  })
  
  // 4. Create positions for each protocol
  allocations.forEach((alloc, idx) => {
    tx.moveCall({
      target: `${VAULT_PKG}::portfolio_vault::create_position`,
      arguments: [portfolio, tx.pure.u64(idx), tx.object('0x6')],
    })
  })
  
  return tx
}
```

### 1.5 Test First PTB Locally
```bash
# In Backend directory
npm test -- suiService.test.js

# Should build PTB without errors
# Verify: PTB contains correct number of calls
```

---

## Priority 2: Wire Frontend to PTB (Day 2)

### 2.1 Add PTB Execution to Frontend

**File**: `Frontend/src/wallet/suiTransactions.js`

```javascript
export async function executePortfolioDeployment({ dAppKit, ptb }) {
  try {
    const result = await dAppKit.signAndExecuteTransaction({ 
      transaction: ptb,
      chain: 'sui:testnet',
    })
    
    if (result.FailedTransaction) {
      throw new Error(result.FailedTransaction.status.error?.message)
    }
    
    return {
      digest: result.Transaction.digest,
      status: result.Transaction.status,
      effects: result.Transaction.effects,
    }
  } catch (error) {
    console.error('PTB execution failed:', error)
    throw error
  }
}
```

### 2.2 Update Task Creation Flow

**File**: `Frontend/src/components/TaskComposer.jsx`

```javascript
// After task created, fetch PTB
const taskResponse = await fetch('/api/tasks', {
  method: 'POST',
  body: JSON.stringify({ objective, escrowAmount }),
})

const { task } = await taskResponse.json()

if (task.deployment?.ptb) {
  // Show sign button
  showSignButton()
  
  // When user clicks:
  const { digest } = await executePortfolioDeployment({
    dAppKit,
    ptb: task.deployment.ptb,
  })
  
  // Store digest for tracking
  setTransactionDigest(digest)
}
```

### 2.3 Add Explorer Link

```javascript
// Display transaction on Sui Explorer
const explorerUrl = `https://suiscan.xyz/testnet/tx/${digest}`
```

---

## Priority 3: Connect Real Protocol APIs (Day 3)

### 3.1 Test NAVI API Integration

**File**: `Backend/src/services/portfolioService.js`

```javascript
// Verify APY endpoint works
async function testNaviAPI() {
  const response = await fetch('https://open-api.naviprotocol.io/api/navi/pools')
  const data = await response.json()
  console.log('NAVI pools:', data)
  // Extract APY from response structure
}
```

### 3.2 Update Portfolio Snapshots

Test that live API data flows through:
```bash
curl http://localhost:4000/api/portfolio

# Should show real APY values instead of mocks
```

### 3.3 Implement Real Yield Tracking

Replace mock yields in adapters with actual protocol calls:
```move
// navi_adapter.move - call real NAVI contract
let supply_state = sui::table::borrow(markets, market_id);
let current_apy = supply_state.borrow_rate * 31536000;
```

---

## Priority 4: End-to-End Demo (Day 3-4)

### 4.1 Create Demo Scenario Script

**File**: `Backend/demo-flow.js`

```javascript
import { createTask } from './routes/tasks.js'
import { deployPortfolioAllocation } from './services/portfolioDeployment.js'

async function demoFlow() {
  console.log('1. Creating task...')
  const task = await createTask({
    objective: 'Maximize USDC yield on Sui with 50% lending, 50% LP',
    escrowAmount: '100 USDC', // Use testnet amount
    ownerAddress: '<your-testnet-address>',
  })
  
  console.log('2. Running workflow...')
  const completedTask = await runWorkflow(task)
  
  console.log('3. Portfolio allocation:', completedTask.portfolio.protocols)
  
  console.log('4. Deployment result:', completedTask.deployment)
  
  console.log('✅ Ready for wallet signature!')
  return completedTask.deployment.ptb
}

demoFlow()
```

### 4.2 Manual Testnet Flow
```bash
# Terminal 1: Start backend
cd Backend && npm run dev

# Terminal 2: Create task
curl -X POST http://localhost:4000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "objective": "Yield optimize with 30% NAVI, 30% Scallop, 20% Cetus, 20% Aftermath",
    "escrowAmount": "100 USDC",
    "ownerAddress": "0x<your-address>"
  }'

# Copy PTB from response
# In frontend: Sign PTB with wallet
# In Sui explorer: Verify transaction effects

# Check portfolio:
curl http://localhost:4000/api/portfolio
```

---

## Priority 5: Optimize for Judges (Day 4)

### 5.1 Create Dashboard Screenshots
- Show AI analysis (research logs)
- Show allocation decision (strategy output)
- Show on-chain portfolio state
- Show yield accrual over time

### 5.2 Record Demo Video (2 min)
```
Scene 1: Task creation (15 sec)
  - User enters objective
  - AI agents analyze 4 protocols

Scene 2: Portfolio deployment (30 sec)
  - Show allocation breakdown
  - User signs PTB in wallet
  - Transaction appears in explorer

Scene 3: Portfolio tracking (30 sec)
  - Show real yield earning in real-time
  - Display 4 protocol positions
  - Highlight APY comparison

Scene 4: Summary (15 sec)
  - Highlight: AI-driven, on-chain proof, atomic execution
```

### 5.3 Write Submission Description

```
AETHER: Programmable Money for Sui

An autonomous portfolio manager where AI agents determine 
optimal USDC allocation across 4 DeFi protocols (NAVI, Scallop, 
Cetus, Aftermath), deploy via atomic Programmable Transaction 
Blocks, and track yield on-chain.

Built with:
- Multi-agent AI analysis (research → strategy → validation)
- Sui Move for trust-minimized escrow & portfolio management
- PTBs for atomic multi-step execution
- Live DeFi protocol APIs for real yield optimization
```

---

## Files Modified/Created

### Backend
- ✅ `src/blockchain/suiService.js` - PTB builders
- ✅ `src/services/portfolioDeployment.js` - Deployment orchestration  
- ✅ `src/orchestrator/workflowEngine.js` - Workflow integration
- 🔄 Need: Test & demo scripts

### Contracts
- ✅ `contracts/escrow/sources/escrow.move` - USDC handling
- ✅ `contracts/portfolio_vault/sources/portfolio_vault.move` - Portfolio management
- ✅ `contracts/protocol_adapters/sources/*.move` - Protocol interfaces
- 🔄 Need: Actual protocol contract calls

### Frontend
- ✅ `src/wallet/suiTransactions.js` - Transaction signing
- 🔄 Need: PTB execution endpoint

---

## Testing Commands

```bash
# Test 1: Backend builds PTB correctly
npm test -- blockchain/suiService.test.js

# Test 2: Portfolio allocation parsing
npm test -- orchestrator/workflowEngine.test.js

# Test 3: Full workflow (mock mode)
curl -X POST http://localhost:4000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"objective": "Test", "escrowAmount": "100", "ownerAddress": "0xtest"}'

# Test 4: API connectivity
curl https://open-api.naviprotocol.io/api/navi/pools | jq

# Test 5: Testnet deployment
npm run deploy:testnet
```

---

## Estimated Timeline

- **Day 1**: Deploy contracts, get USDC on testnet, implement PTB builder
- **Day 2**: Wire frontend, execute first real PTB
- **Day 3**: Connect real protocol APIs, complete yield tracking  
- **Day 4**: Polish, demo video, submission

---

## Critical Success Factors

✅ **Working Code**: Full flow from task → PTB → execution → yield tracking  
✅ **Testnet Deployment**: Live contracts with real USDC  
✅ **AI Integration**: Agents actually determine allocations  
✅ **On-Chain Proof**: Events show decision audit trail  
✅ **User Experience**: Minimal friction from deposit to earning  

---

## Questions to Resolve

1. What's the actual USDC coin type on Sui testnet?
2. Does your wallet have testnet USDC for testing?
3. Should backend sign PTBs or only frontend wallets?
4. Do protocol adapters need actual contract integration?
5. Should yield be simulated or tracked from real protocols?

Once answered, implementation is straightforward. Start with Priority 1 → 2 → 3 → 4 → 5.
