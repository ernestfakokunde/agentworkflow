# Sui Overflow 2026 - AI Portfolio Manager Implementation Guide

## Executive Summary

This project implements **Programmable Money** on Sui: an autonomous AI-powered portfolio manager that deploys user USDC across 4 DeFi protocols (NAVI, Scallop, Cetus, Aftermath) via atomic Programmable Transaction Blocks.

**Key Innovation**: AI agents determine optimal allocation → backend builds PTB → user signs → Sui executes atomically → on-chain proof via events

---

## Architecture

### 1. Frontend (React)
**File**: `Frontend/src/`

- **Wallet Integration** (`wallet/WalletConnect.jsx`, `wallet/suiTransactions.js`)
  - Connects to Sui wallets via `@mysten/dapp-kit`
  - Signs and executes transactions
  - Creates tasks on-chain

- **Task Creation** (`components/TaskComposer.jsx`)
  - User enters objective and USDC amount
  - Sends to backend for AI analysis

- **Portfolio Display** (`components/PortfolioOverviewPanel.jsx`, etc.)
  - Shows allocations, APY, yield earned
  - Displays on-chain transaction status

### 2. Backend (Node.js)
**File**: `Backend/src/`

#### Task Management
- **`controllers/taskController.js`** - REST API for task CRUD
  - POST `/api/tasks` → Create task with objective + USDC amount
  - Chains proof: `{ mode, digest, packageId, status }`

- **`orchestrator/workflowEngine.js`** - Multi-agent orchestration
  - Runs 4-step workflow: Research → Strategy → Validation → Execution
  - Parses AI allocation output
  - Triggers portfolio deployment after strategy step

#### Portfolio & Deployment
- **`services/portfolioService.js`** - Portfolio analytics
  - Fetches live APY/TVL from protocol APIs (NAVI, Scallop, Cetus, Aftermath)
  - Calculates optimal allocations
  - Builds portfolio snapshot

- **`services/portfolioDeployment.js`** - Deployment orchestration
  - `deployPortfolioAllocation()` - Takes AI allocation, prepares PTB
  - `rebalancePortfolio()` - Calculates rebalancing moves
  - `trackPortfolioYield()` - Monitors earnings

#### Sui Integration
- **`blockchain/suiService.js`** - Sui contract interface
  - `buildDeploymentPTB()` - Constructs PTB for USDC deployment
  - `buildRebalancingPTB()` - Constructs rebalancing PTB
  - `logWorkflowEvent()` - Updates task status on-chain
  - `updateReputation()` - Records agent performance

### 3. Smart Contracts (Sui Move)

#### Core Contracts

**`contracts/escrow/sources/escrow.move`** - USDC Escrow
```move
public struct Escrow {
  usdc_balance: Balance<USDC>,  // Actual USDC coin
  status: u8,                    // LOCKED or RELEASED
  owner: address,
  task_id: address,
}
```
- `create_escrow()` - Owner deposits USDC, locked
- `release()` - Marks escrow available for withdrawal
- `withdraw()` - Owner retrieves USDC after completion

**`contracts/portfolio_vault/sources/portfolio_vault.move`** - Main orchestrator
```move
public struct PortfolioAllocation {
  total_balance: Balance<USDC>,
  allocations: vector<AllocationEntry>,  // Per-protocol config
  version: u64,
}

public struct VaultPosition {
  protocol: vector<u8>,    // "navi", "scallop", "cetus", "aftermath"
  amount: Balance<USDC>,
  yield_earned: u64,
}
```
- `create_portfolio()` - Initialize with USDC coin
- `set_allocations()` - Configure protocol percentages (basis points)
- `create_position()` - Deploy USDC to protocol
- `record_yield()` - Track accrued yield
- `withdraw_position()` - Redeem position + earnings

#### Protocol Adapters
Each protocol has an adapter module:

**`contracts/protocol_adapters/sources/{navi,scallop,cetus,aftermath}_adapter.move`**
```move
public fun deposit_to_protocol(usdc_coin: Coin<USDC>): ProtocolPosition
public fun withdraw_from_protocol(position: ProtocolPosition): Coin<USDC>
public fun get_protocol_apy(): u64
```

**Real Implementation**: These should call actual protocol contracts (e.g., `scallop::lending::deposit()`)
**Current Status**: Mocks with simulated yields

#### Supporting Contracts
- **`contracts/task_manager/sources/task_manager.move`** - Track on-chain tasks
- **`contracts/reputation/sources/reputation.move`** - Track agent performance

---

## Data Flow: End-to-End

### Step 1: User Creates Task
```
Frontend TaskComposer
  ├─ User enters: "Maximize stablecoin yield on Sui"
  ├─ User sets: "5000 USDC"
  └─ Calls: POST /api/tasks
```

### Step 2: Backend AI Analysis
```
workflowEngine.runWorkflow()
  ├─ Research Agent
  │   └─ Fetches live APY/TVL/liquidity from 4 protocols
  │   └─ Artifact stored on Walrus
  │
  ├─ Strategy Agent
  │   ├─ Analyzes risk/return tradeoffs
  │   ├─ Determines: 30% NAVI, 30% Scallop, 20% Cetus, 20% Aftermath
  │   └─ Returns: structured allocation percentages
  │
  ├─ [DEPLOYMENT TRIGGER]
  │   ├─ parseAllocationsFromStrategy() → extract percentages
  │   ├─ deployPortfolioAllocation()
  │   │   ├─ Calculate amounts: 1500 NAVI, 1500 Scallop, 1000 Cetus, 1000 Aftermath
  │   │   ├─ buildDeploymentPTB()
  │   │   │   ├─ Create Transaction
  │   │   │   ├─ Split USDC coin into 4 parts
  │   │   │   ├─ Call portfolio_vault::create_position() for each
  │   │   │   └─ Return unsigned PTB
  │   │   └─ Store in task.deployment
  │   │
  │   └─ Frontend receives PTB for wallet signing
  │
  ├─ Validation Agent
  │   ├─ Reviews allocation logic
  │   └─ Validates risk constraints
  │
  └─ Execution Agent
      └─ Finalizes decision report
```

### Step 3: User Signs PTB
```
Frontend suiTransactions.js
  ├─ Wallet connected
  ├─ User approves PTB
  ├─ dAppKit.signAndExecuteTransaction(ptb)
  └─ Returns: transaction digest
```

### Step 4: Sui Blockchain Execution
```
Programmable Transaction Block executes atomically:
  ├─ Split escrow USDC coin
  ├─ Call portfolio_vault::create_position() → NAVI position (1500 USDC)
  ├─ Call portfolio_vault::create_position() → Scallop position (1500 USDC)
  ├─ Call portfolio_vault::create_position() → Cetus position (1000 USDC)
  ├─ Call portfolio_vault::create_position() → Aftermath position (1000 USDC)
  │
  └─ Events emitted:
      ├─ PortfolioCreated
      ├─ AllocationUpdated
      ├─ PositionDeposited (4x)
      └─ All logged on-chain
```

### Step 5: Portfolio Earns Yield
```
Over time, DeFi protocols accrue yield:
  ├─ NAVI: 1500 → 1515 (1%)
  ├─ Scallop: 1500 → 1515 (1%)
  ├─ Cetus: 1000 → 1020 (2%)
  └─ Aftermath: 1000 → 1015 (1.5%)
  
Total portfolio: 5000 → 5065 (+$65 yield)
```

### Step 6: Portfolio Display
```
Frontend PortfolioOverviewPanel
  ├─ TVL: 5065 USDC
  ├─ Daily Yield: +$0.13
  ├─ APY: ~9.5%
  └─ Breakdown:
      ├─ NAVI: 1515 (30%)
      ├─ Scallop: 1515 (30%)
      ├─ Cetus: 1020 (20%)
      └─ Aftermath: 1015 (20%)
```

### Step 7: Rebalancing (Optional)
```
If yield ratios shift significantly:
  ├─ Strategy Agent detects opportunity
  ├─ buildRebalancingPTB()
  │   ├─ Withdraw from over-performing protocol
  │   ├─ Swap if needed
  │   └─ Deposit to under-performing protocol
  └─ User approves new rebalancing PTB
```

### Step 8: Withdrawal
```
When user wants to cash out:
  ├─ Call portfolio_vault::withdraw_position() for each protocol
  ├─ Each returns USDC + yield accrued
  ├─ Aggregate: 5065 USDC sent back to escrow
  ├─ escrow::release()
  └─ User withdraws final balance (original + $65 profit)
```

---

## Environment Configuration

### Required `.env` Variables

**Backend (Backend/.env)**
```
# Server
PORT=4000
FRONTEND_ORIGIN=http://localhost:5173

# AI Providers
AI_PROVIDER=gemini
GEMINI_API_KEY=<your-key>

# Sui
SUI_NETWORK=testnet
SUI_PACKAGE_ID=<deployed-package-id>
SUI_PRIVATE_KEY=<optional-backend-key>

# Protocol APIs
PROTOCOL_API_MODE=live
NAVI_API_URL=https://open-api.naviprotocol.io
NAVI_API_APY_PATH=/api/navi/pools
SCALLOP_API_URL=https://api.scallop.io
SCALLOP_API_APY_PATH=/markets
CETUS_API_URL=https://api-sui.cetus.zone
CETUS_API_APY_PATH=/v2/sui/pools_info
AFTERMATH_API_URL=https://api.aftermath.finance
AFTERMATH_API_APY_PATH=/api/pools
```

**Frontend (Frontend/.env.local)**
```
VITE_AETHER_TASK_MANAGER_PACKAGE_ID=<deployed-package-id>
```

---

## Deployment Checklist

### 1. Deploy Move Packages
```bash
# In each contract directory
cd contracts/escrow
sui client publish --gas-budget 100000000

cd ../portfolio_vault
sui client publish --gas-budget 100000000

cd ../protocol_adapters
sui client publish --gas-budget 100000000

# Copy package IDs to .env
```

### 2. Update USDC Coin Type
```move
// In contract files, replace USDC type with actual Sui testnet coin:
// Current: public struct USDC {}
// Target: use 0x2::usdc::USDC  or actual circle USDC type
```

### 3. Deploy Backend
```bash
cd Backend
npm install
npm run dev
```

### 4. Deploy Frontend
```bash
cd Frontend
npm install
npm run dev
```

### 5. Test Flow
```bash
# 1. Connect wallet in frontend
# 2. Create task with 10 USDC (testnet)
# 3. Observe AI analysis in logs
# 4. Approve PTB when prompted
# 5. Verify on Sui explorer
# 6. Check portfolio display
```

---

## Key Integration Points

### Frontend → Backend
```typescript
// Create task with AI execution
POST /api/tasks {
  objective: "Maximize yield",
  escrowAmount: "5000.00 USDC",
  ownerAddress: "0x123..."
}

// Response includes allocation + unsigned PTB
{
  task: {
    id: "task_...",
    deployment: {
      allocations: [
        { protocolId: "navi", percentage: 30, amount: 1500 },
        ...
      ],
      ptb: <Transaction>, // Ready to sign
    }
  }
}
```

### Backend → Sui
```javascript
// Build PTB
const tx = new Transaction()
tx.moveCall({
  target: `${VAULT_PACKAGE}::portfolio_vault::create_position`,
  arguments: [portfolioRef, coinToDeposit, protocolIndex],
})
```

### Sui → Frontend
```javascript
// Execute signed PTB
const result = await dAppKit.signAndExecuteTransaction({ transaction: tx })
// Returns: { digest, status, effects }
```

---

## Testing Strategy

### Unit Tests
- Portfolio allocation calculation
- Escrow lock/release logic
- APY parsing from protocol APIs

### Integration Tests
- Full workflow (Research → Strategy → Deployment)
- PTB building with correct amounts
- Event emission verification

### End-to-End Tests
- Testnet wallet connection
- Create task → sign PTB → verify on-chain
- Check yield tracking

---

## Hackathon Submission Highlights

✅ **Programmable Money**: Atomic PTBs orchestrate complex financial flows  
✅ **AI Coordination**: Multi-agent reasoning produces allocation decisions  
✅ **Trust-Minimized**: Escrow enforces conditions, Move validates ownership  
✅ **Real DeFi Integration**: Queries live protocol metrics  
✅ **On-Chain Proof**: All decisions emitted as auditable events  
✅ **User-Friendly**: Single-click portfolio diversification  

---

## Next Steps

1. **Update Coin Types**: Replace mock USDC with actual testnet coin
2. **Implement Real Protocol Calls**: Connect adapters to actual protocol contracts
3. **Deploy Contracts**: Publish to Sui testnet
4. **PTB Signing**: Hook up wallet to execute PTBs
5. **Yield Tracking**: Implement real yield calculation
6. **Rebalancing Logic**: Automate based on yield ratios
7. **NFT Receipts**: Mint proof-of-allocation NFTs
