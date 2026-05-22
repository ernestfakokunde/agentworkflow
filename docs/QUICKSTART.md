# QUICK START GUIDE - AI Portfolio Manager on Sui

## Overview

This guide gets you from zero to a working AI portfolio manager on Sui testnet in 30 minutes.

---

## PREREQUISITES

### Install Sui CLI
```bash
# macOS
brew install sui

# Linux / Ubuntu
curl -L https://github.com/MystenLabs/sui/releases/download/devnet-v1.0.0/sui-linux-amd64 -o sui
chmod +x sui && sudo mv sui /usr/local/bin/

# Verify
sui --version
```

### Install Node.js
```bash
node --version  # Requires v18+
npm --version
```

### Get Testnet USDC
1. Join [Sui Discord](https://discord.gg/sui)
2. Go to #faucet channel
3. Request: `$faucet <your-sui-address>`

---

## QUICK START (4 Steps)

### 1. Configure Sui for Testnet (2 min)

```bash
# Switch network
sui client switch --env testnet

# Create wallet (or use existing)
sui client new-address secp256k1

# Save your address
export SUI_ADDRESS=$(sui client active-address)
echo $SUI_ADDRESS
```

### 2. Deploy Contracts (10 min)

```bash
cd contracts/escrow
sui client publish --gas-budget 100000000
# Copy: Package ID = 0x...

cd ../portfolio_vault
sui client publish --gas-budget 100000000
# Copy: Package ID = 0x...

cd ../protocol_adapters
sui client publish --gas-budget 100000000
# Copy: Package ID = 0x...
```

### 3. Setup Backend (5 min)

```bash
cd Backend

# Create .env
cat > .env << 'EOF'
PORT=4000
SUI_NETWORK=testnet
SUI_ADDRESS=$SUI_ADDRESS

# Paste your package IDs from deployment
VAULT_PACKAGE_ID=0x<paste-here>
PROTOCOL_ADAPTERS_PACKAGE_ID=0x<paste-here>
ESCROW_PACKAGE_ID=0x<paste-here>

# AI (get from console.cloud.google.com)
GEMINI_API_KEY=<your-key>
AI_PROVIDER=gemini

# DeFi APIs
NAVI_API_URL=https://open-api.naviprotocol.io
SCALLOP_API_URL=https://api.scallop.io
CETUS_API_URL=https://api-sui.cetus.zone
AFTERMATH_API_URL=https://api.aftermath.finance
EOF

# Install & start
npm install
npm run dev
```

### 4. Test the Flow (3 min)

```bash
# In another terminal, from Backend directory
npm run demo:flow
```

You should see:
- ✅ Task created
- ✅ AI agents running
- ✅ Allocation decision: 30% NAVI, 30% Scallop, 20% Cetus, 20% Aftermath
- ✅ PTB ready for wallet signature

---

## VERIFY DEPLOYMENT

### Check Task Manager API
```bash
curl http://localhost:4000/health
# Expected: {"ok":true,"service":"aether-backend"}
```

### Check Portfolio Data
```bash
curl http://localhost:4000/api/portfolio | jq
# Expected: 4 protocols with APY, TVL, allocations
```

### Check Sui Contracts
```bash
# View on Sui Testnet Explorer
https://suiscan.xyz/testnet/
# Search your address or package ID
```

---

## FRONTEND INTEGRATION

### Setup Frontend
```bash
cd Frontend

# Environment file
echo "VITE_AETHER_TASK_MANAGER_PACKAGE_ID=0x<your-package-id>" > .env.local

# Install & start
npm install
npm run dev
# Opens http://localhost:5173
```

### Full E2E Flow
1. Open Frontend at http://localhost:5173
2. Connect wallet (use browser extension)
3. Create task with objective
4. Wait for AI analysis
5. Approve PTB in wallet
6. Transaction appears in Sui Explorer

---

## TROUBLESHOOTING

### "VAULT_PACKAGE_ID not set"
```bash
# Add to Backend/.env
VAULT_PACKAGE_ID=0x<your-deployed-package-id>
```

### "Connection refused" on localhost:4000
```bash
# Backend not running, start it:
cd Backend && npm run dev
```

### "Wallet not connected"
```bash
# Install Sui Wallet extension:
https://chrome.google.com/webstore/detail/sui-wallet/
# Or use dappkit in app
```

### Testnet out of faucet
```bash
# Wait 24 hours or use another address
sui client new-address secp256k1
```

---

## NEXT STEPS

### Add Real Yield Tracking
- Connect to actual protocol smart contracts
- Replace mock yields with real on-chain values
- Implement rebalancing automation

### Enhance AI Analysis
- Add risk analysis module
- Historical data integration
- Predictive yield modeling

### Deploy to Mainnet
- Run contracts through security audit
- Update .env to mainnet
- Deploy with larger gas budgets

---

## KEY COMMANDS

```bash
# View balance
sui client balance

# View transactions
sui client gas

# Check contract state
sui client object 0x<object-id>

# View events
sui client event

# Monitor logs
tail -f backend.log
```

---

## ARCHITECTURE OVERVIEW

```
User Wallet (Frontend)
        ↓
  [Task Composer]
        ↓
Backend API
├── AI Agents (4-step workflow)
├── Portfolio Service (fetch live APY)
├── Sui Service (build PTB)
└── Walrus (store artifacts)
        ↓
  [Build PTB]
        ↓
User Signs with Wallet
        ↓
Sui Blockchain Executes
├── Escrow releases USDC
├── Deploy to 4 protocols
├── Emit events
└── Track positions
        ↓
Portfolio Earns Yield
        ↓
[Dashboard shows gains]
```

---

## SUPPORT

- **Issues**: Check Backend/logs/ and Frontend console
- **Errors**: Run `npm test` to validate setup
- **Questions**: See docs/sui-implementation-guide.md

---

## SUCCESS CRITERIA

You've successfully completed setup when:
- ✅ `npm run demo:flow` shows full AI workflow
- ✅ `/api/portfolio` returns 4 protocols with real data
- ✅ Frontend connects to wallet
- ✅ Task creation completes without errors
- ✅ PTB builds and is ready for signature

**Estimated Time: 30 minutes**
