# REFERENCE GUIDE - System Architecture & Components

## 📚 Table of Contents

1. [System Overview](#system-overview)
2. [Core Components](#core-components)
3. [Data Flow](#data-flow)
4. [API Reference](#api-reference)
5. [PTB Flow](#ptb-flow)
6. [Smart Contracts](#smart-contracts)
7. [Configuration](#configuration)

---

## System Overview

**AETHER** is an AI-driven portfolio manager on Sui that:
1. Receives USDC deposits from users
2. Uses multi-agent AI to analyze DeFi yields
3. Generates allocation decisions across 4 protocols
4. Builds atomic PTBs to deploy funds
5. Tracks on-chain positions and yields
6. Earns real yield for users

**Key Innovation**: Programmable Transaction Blocks enable atomic multi-step execution without smart contract middleware.

---

## Core Components

### 1. Backend Server (`Backend/src/index.js`)

**Responsibility**: Orchestrate entire workflow

**Key Endpoints**:
```javascript
GET  /health                        // Service health check
GET  /api/portfolio                 // Get portfolio state
POST /api/tasks                     // Create new task
GET  /api/tasks/:taskId             // Get task status
POST /api/tasks/:taskId/workflow    // Run AI workflow
```

**Architecture**:
```
Express Server (Port 4000)
├── Task Routes (/api/tasks)
├── Portfolio Routes (/api/portfolio)
├── Workflow Routes (/api/workflow)
└── Health Check (/health)
```

### 2. Sui Service (`Backend/src/blockchain/suiService.js`)

**Responsibility**: Build and manage Programmable Transaction Blocks

**Key Functions**:

#### `buildDeploymentPTB(taskId, allocations, escrowCoinId)`
Creates a PTB that deploys USDC from escrow to 4 protocols.

**Steps**:
1. Get USDC coins from escrow
2. Create portfolio in vault contract
3. Set allocations with basis points (10000 = 100%)
4. Create position for each protocol
5. Return unsigned Transaction

**Arguments**:
- `taskId`: Portfolio identifier
- `allocations`: Array of {protocol, percentage}
  ```javascript
  [
    {protocol: "NAVI", percentage: 30},
    {protocol: "Scallop", percentage: 30},
    {protocol: "Cetus", percentage: 20},
    {protocol: "Aftermath", percentage: 20}
  ]
  ```
- `escrowCoinId`: Sui object ID of USDC coin

**Returns**: Unsigned `Transaction` object ready for wallet signature

---

#### `buildRebalancingPTB(portfolioId, currentPositions, targetAllocations)`
Creates a PTB that rebalances portfolio based on new yields.

**Steps**:
1. Calculate delta moves (current vs target)
2. Withdraw from protocols with excess
3. Deposit to protocols with deficit
4. Update allocations on-chain
5. Return unsigned Transaction

**Arguments**:
- `portfolioId`: Portfolio identifier
- `currentPositions`: Current state {protocol: amount}
- `targetAllocations`: New allocation percentages

**Returns**: Unsigned `Transaction` object

---

### 3. Portfolio Service (`Backend/src/services/portfolioService.js`)

**Responsibility**: Fetch live yield data and generate portfolio snapshots

**Key Functions**:

#### `getProtocolData()`
Fetches current APY, TVL, and liquidity from 4 protocols.

**Protocols**:
- **NAVI**: Lending protocol, APY range 6.8-13.4%
- **Scallop**: Lending protocol, APY range 7.4-15.6%
- **Cetus**: DEX LP, APY range 11.2-22.6%
- **Aftermath**: DEX LP, APY range 8.5-17.2%

**Returns**:
```javascript
{
  NAVI: {apy: 9.5, tvl: 500000000, liquidity: 450000000},
  Scallop: {apy: 10.2, tvl: 600000000, liquidity: 550000000},
  Cetus: {apy: 15.8, tvl: 200000000, liquidity: 180000000},
  Aftermath: {apy: 12.1, tvl: 150000000, liquidity: 140000000}
}
```

---

#### `getPortfolioSnapshot(allocations, amount)`
Calculates expected yield for given allocations.

**Returns**:
```javascript
{
  totalAmount: 100000000,
  allocation: [
    {protocol: "NAVI", percentage: 30, amount: 30000000, expectedAPY: 9.5},
    {protocol: "Scallop", percentage: 30, amount: 30000000, expectedAPY: 10.2},
    {protocol: "Cetus", percentage: 20, amount: 20000000, expectedAPY: 15.8},
    {protocol: "Aftermath", percentage: 20, amount: 20000000, expectedAPY: 12.1}
  ],
  portfolioAPY: 11.4
}
```

---

### 4. Workflow Engine (`Backend/src/orchestrator/workflowEngine.js`)

**Responsibility**: Orchestrate multi-agent AI workflow

**Process**:
```
Step 1: Research Agent
  ├─ Fetch protocol data
  ├─ Analyze yields
  └─ Generate research report

Step 2: Strategy Agent
  ├─ Receive research
  ├─ Generate allocation strategy
  └─ Output: "NAVI: 30%, Scallop: 30%, Cetus: 20%, Aftermath: 20%"

Step 3: Validation Agent
  ├─ Verify allocation sums to 100%
  ├─ Check constraints
  └─ Confirm valid

Step 4: Execution Agent
  ├─ Build PTB
  ├─ Get ready for signature
  └─ Store deployment info
```

**Key Function**: `runWorkflow(task, amount)`
- Executes 4-step workflow
- Calls `deployPortfolioAllocation()` after strategy step
- Stores PTB in task.deployment
- Returns task with updated status

---

### 5. Portfolio Deployment (`Backend/src/services/portfolioDeployment.js`)

**Responsibility**: High-level deployment orchestration

**Key Functions**:

#### `deployPortfolioAllocation(taskId, amount, allocations, escrowCoinId)`
**Steps**:
1. Validate allocations sum to 100%
2. Parse allocations from AI output (supports JSON and regex)
3. Calculate amounts per protocol
4. Call buildDeploymentPTB()
5. Return PTB and deployment info

**Example**:
```javascript
const deployment = await deployPortfolioAllocation(
  taskId: "portfolio-123",
  amount: 100000000,
  allocations: "NAVI: 30%, Scallop: 30%, Cetus: 20%, Aftermath: 20%",
  escrowCoinId: "0xabcd..."
)
// Returns: {ptb: Transaction, status: "ready_for_signature", allocations: [...]}
```

---

### 6. Frontend Wallet Integration (`Frontend/src/wallet/suiTransactions.js`)

**Responsibility**: Sign and execute PTBs with user wallet

**Key Function**: `executePortfolioDeploymentPTB(dAppKit, ptb)`

**Steps**:
1. Sign PTB with user's wallet (via dAppKit)
2. Execute on Sui
3. Wait for transaction confirmation
4. Return digest and status

**Returns**:
```javascript
{
  success: true,
  digest: "0x123abc...",
  status: "executed",
  message: "Portfolio deployed successfully"
}
```

**Error Handling**:
- User rejection: Returns demoFallback result
- Network error: Throws error with message
- Invalid PTB: Validation error

---

## Data Flow

### Complete User Journey

```
1. USER INITIATES
   └─ Frontend: Create task with USDC amount

2. TASK CREATED
   └─ Backend: Task stored with status "pending"

3. AI WORKFLOW RUNS
   └─ Research Agent: Fetch protocol data
   └─ Strategy Agent: Generate allocations
   └─ Validation Agent: Verify allocations
   └─ Execution Agent: Build PTB

4. PTB READY
   └─ Backend returns: {ptb, allocations, status: "ready_for_signature"}

5. WALLET SIGNATURE
   └─ User approves in wallet extension
   └─ Frontend: executePortfolioDeploymentPTB()

6. TRANSACTION EXECUTED
   └─ Sui: PTB runs atomically
   └─ Events emitted for tracking
   └─ Portfolio positions created

7. SETTLEMENT
   └─ Backend: Verify on-chain positions
   └─ Dashboard: Show portfolio state

8. YIELD TRACKING
   └─ Backend: Poll protocol APIs
   └─ Update APY and gains
```

---

## API Reference

### Task Management

#### POST /api/tasks
Create new portfolio task.

**Request**:
```javascript
{
  objective: "Generate yield on USDC",
  amount: 100000000,  // In MIST (0x2::usdc::USDC)
  riskPreference: "medium"
}
```

**Response**:
```javascript
{
  id: "portfolio-123",
  status: "pending",
  amount: 100000000,
  createdAt: "2024-01-15T10:30:00Z",
  deployment: null
}
```

---

#### GET /api/tasks/:taskId
Get task status and deployment info.

**Response**:
```javascript
{
  id: "portfolio-123",
  status: "deployed",
  amount: 100000000,
  deployment: {
    ptb: {...},
    allocations: [...],
    portfolioId: "0xabc...",
    digest: "0x123...",
    createdAt: "2024-01-15T10:35:00Z"
  }
}
```

---

#### POST /api/tasks/:taskId/workflow
Run AI workflow and generate deployment.

**Request**:
```javascript
{
  "action": "execute_workflow"
}
```

**Response**:
```javascript
{
  status: "deployment_ready",
  workflow: {
    research: {...},
    strategy: {...},
    validation: {...},
    execution: {...}
  },
  deployment: {
    ptb: {...},
    allocations: [
      {protocol: "NAVI", percentage: 30, amount: 30000000}
    ]
  }
}
```

---

### Portfolio Management

#### GET /api/portfolio
Get portfolio snapshot with all 4 protocols.

**Response**:
```javascript
{
  protocols: [
    {
      name: "NAVI",
      apy: 9.5,
      tvl: 500000000,
      allocation: 30,
      allocatedAmount: 30000000,
      expectedYield: 2850000
    },
    {
      name: "Scallop",
      apy: 10.2,
      tvl: 600000000,
      allocation: 30,
      allocatedAmount: 30000000,
      expectedYield: 3060000
    },
    // ... Cetus, Aftermath
  ],
  summary: {
    totalAllocated: 100000000,
    portfolioAPY: 11.4,
    expectedMonthlyYield: 950000,
    riskLevel: "medium"
  }
}
```

---

#### GET /api/portfolio/history
Get portfolio performance over time.

**Response**:
```javascript
[
  {
    timestamp: "2024-01-15T10:00:00Z",
    apy: 11.2,
    positions: [...],
    gains: 50000
  },
  // ... more snapshots
]
```

---

## PTB Flow

### Deployment PTB Structure

```
Transaction buildDeploymentPTB(taskId, allocations, escrowCoinId)
├─ MoveCall: portfolio_vault::create_portfolio
│  ├─ Input: taskId, escrowCoinId, clock
│  └─ Output: Portfolio object
│
├─ MoveCall: portfolio_vault::set_allocations
│  ├─ Input: Portfolio, protocols, percentages_basis_points
│  └─ Output: Updated Portfolio
│
├─ Loop: For each protocol
│  └─ MoveCall: protocol_adapter::create_position
│     ├─ Input: Portfolio, coins, protocol_name
│     └─ Output: Position object
│
└─ Return: Portfolio object
```

**Execution on Sui**:
1. User signs transaction with wallet
2. Sui executes all move calls atomically
3. If any step fails, entire PTB reverts
4. Emit events for task completion
5. Record portfolio_id in task manager

---

## Smart Contracts

### 1. Escrow (`contracts/escrow/sources/escrow.move`)

**Purpose**: Secure USDC coin holding

**Key Structures**:
```move
struct Escrow has key {
  id: UID,
  balance: Balance<USDC>,  // 0x2::usdc::USDC
  owner: address,
  locked: bool
}
```

**Functions**:
- `create(coin, owner)`: Create escrow
- `deposit(escrow, coin)`: Add funds
- `lock(escrow)`: Prevent withdrawals
- `release(escrow, amount)`: Release to recipient

---

### 2. Portfolio Vault (`contracts/portfolio_vault/sources/portfolio_vault.move`)

**Purpose**: Main orchestrator for portfolio positions

**Key Structures**:
```move
struct Portfolio has key {
  id: UID,
  allocations: vector<Allocation>,
  positions: vector<VaultPosition>,
  totalValue: u64,
  createdAt: u64
}

struct Allocation {
  protocol: String,
  percentageBasisPoints: u64,  // 10000 = 100%
  targetAmount: u64
}

struct VaultPosition has key {
  id: UID,
  protocol: String,
  investedAmount: u64,
  currentValue: u64,
  createdAt: u64
}
```

**Functions**:
- `create_portfolio(taskId, coin, clock)`: Create portfolio
- `set_allocations(portfolio, protocols, percentages, clock)`: Set allocations
- `create_position(portfolio, coins, protocol, clock)`: Create position
- `rebalance(portfolio, oldAllocations, newAllocations, clock)`: Rebalance

---

### 3. Protocol Adapters

**Purpose**: Standardized interface to each protocol

Each adapter (NAVI, Scallop, Cetus, Aftermath) implements:

```move
struct ProtocolAdapter has key {
  id: UID,
  protocolName: String,
  supportedCoins: vector<String>
}

public fun deposit(coins: Coin, amount: u64, clock: &Clock): Receipt
public fun withdraw(receipt: Receipt, amount: u64, clock: &Clock): Coin
public fun get_apy(clock: &Clock): u64
```

---

## Configuration

### Environment Variables

```bash
# Network
SUI_NETWORK=testnet
SUI_ADDRESS=0x123...

# Contract Package IDs (deployed on testnet)
VAULT_PACKAGE_ID=0xabc...
PROTOCOL_ADAPTERS_PACKAGE_ID=0xdef...
ESCROW_PACKAGE_ID=0x789...
TASK_MANAGER_PACKAGE_ID=0x456...

# Coin Type
USDC_COIN_TYPE=0x2::usdc::USDC

# API Configuration
PORT=4000
FRONTEND_ORIGIN=http://localhost:5173

# AI Provider
AI_PROVIDER=gemini
GEMINI_API_KEY=xxx

# Protocol APIs
NAVI_API_URL=https://open-api.naviprotocol.io
SCALLOP_API_URL=https://api.scallop.io
CETUS_API_URL=https://api-sui.cetus.zone
AFTERMATH_API_URL=https://api.aftermath.finance
```

---

## Error Handling

### Common Issues & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| VAULT_PACKAGE_ID not set | Missing env var | Add to .env |
| Connection refused | Backend not running | Run `npm run dev` |
| Wallet not connected | Extension missing | Install Sui Wallet extension |
| Invalid USDC coin type | Wrong coin on testnet | Check current coin type |
| Allocation doesn't sum | Bad AI output | Verify parseAllocationsFromStrategy() |
| PTB execution failed | Insufficient coins | Get more testnet USDC |

---

## Performance Metrics

| Operation | Target | Typical |
|-----------|--------|---------|
| Portfolio snapshot | <100ms | 50ms |
| AI workflow | <30s | 20s |
| PTB building | <500ms | 200ms |
| Wallet signature | <5s | 3s |
| Transaction confirmation | <5s | 2-3s |

---

## Security Considerations

1. **Escrow Security**: Only authorized addresses can withdraw
2. **Allocation Validation**: All allocations must sum to 100%
3. **Coin Type**: All coins must be USDC (0x2::usdc::USDC)
4. **Transaction Atomicity**: PTB ensures all-or-nothing execution
5. **Event Proofs**: All operations emit events for verification

---

## Deployment Checklist

- [ ] Sui CLI installed and configured
- [ ] Network set to testnet
- [ ] USDC coins available in wallet
- [ ] All 5 contracts deployed
- [ ] Package IDs in .env
- [ ] Backend .env configured
- [ ] npm dependencies installed
- [ ] Backend health check passes
- [ ] Demo flow executes successfully
- [ ] Frontend connects to wallet
- [ ] E2E test completes

---

**Ready to deploy! Let's build programmable money on Sui!** 🚀
