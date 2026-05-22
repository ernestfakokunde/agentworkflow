#!/bin/bash

# DEPLOYMENT SETUP SCRIPT
# Prepares the project for Sui testnet deployment
# 
# Usage: bash scripts/setup-testnet.sh

set -e

echo "🚀 AETHER TESTNET DEPLOYMENT SETUP"
echo "════════════════════════════════════════"

# Step 1: Check Sui CLI
echo ""
echo "1️⃣  Checking Sui CLI installation..."
if ! command -v sui &> /dev/null; then
    echo "❌ Sui CLI not found. Install it with:"
    echo "   curl -L https://github.com/MystenLabs/sui/releases/download/devnet-v0.xx.x/sui-<os-binary> -o sui && chmod +x sui"
    exit 1
fi
echo "✅ Sui CLI found: $(sui --version)"

# Step 2: Configure Testnet Network
echo ""
echo "2️⃣  Configuring Sui testnet..."
sui client switch --env testnet
echo "✅ Switched to testnet"

# Step 3: Create/Verify Wallet
echo ""
echo "3️⃣  Checking wallet..."
sui client addresses
echo ""
read -p "Use existing address? Enter address or press Enter to create new: " sui_address

if [ -z "$sui_address" ]; then
    sui_address=$(sui client new-address secp256k1 | grep -oP '0x[0-9a-f]+')
    echo "✅ New wallet created: $sui_address"
else
    echo "✅ Using wallet: $sui_address"
fi

# Step 4: Request Testnet Faucet USDC
echo ""
echo "4️⃣  Requesting testnet USDC from faucet..."
echo ""
echo "⚠️  MANUAL STEP: Get testnet USDC"
echo "   - Discord: Join Sui Discord and use #faucet channel"
echo "   - Command: sui client call --function=mint --package=<usdc-package>"
echo "   - Web: Visit https://faucet.testnet.sui.io/"
echo ""
read -p "Press Enter after getting testnet USDC..."

# Step 5: Deploy Contracts
echo ""
echo "5️⃣  Deploying Move contracts..."
echo ""

contracts=(
    "contracts/escrow"
    "contracts/portfolio_vault"
    "contracts/protocol_adapters"
)

for contract_dir in "${contracts[@]}"; do
    echo "  Deploying $(basename $contract_dir)..."
    
    cd "$contract_dir"
    
    # Get deployment output
    output=$(sui client publish --gas-budget 100000000 2>&1)
    echo "$output"
    
    # Extract package ID
    package_id=$(echo "$output" | grep -oP "Package ID: 0x[0-9a-f]+" | head -1 | cut -d' ' -f3)
    
    if [ -z "$package_id" ]; then
        echo "❌ Failed to deploy $(basename $contract_dir)"
        exit 1
    fi
    
    echo "  ✅ Package ID: $package_id"
    
    cd - > /dev/null
done

# Step 6: Create .env file
echo ""
echo "6️⃣  Creating .env configuration..."

cat > Backend/.env.deployment << EOF
# Deployment Configuration
SUI_NETWORK=testnet
SUI_ADDRESS=$sui_address

# Contract Package IDs (update with actual deployment results)
TASK_MANAGER_PACKAGE_ID=0x<from-deployment>
VAULT_PACKAGE_ID=0x<from-deployment>
PROTOCOL_ADAPTERS_PACKAGE_ID=0x<from-deployment>
REPUTATION_PACKAGE_ID=0x<existing-or-new>
ESCROW_PACKAGE_ID=0x<from-deployment>

# USDC Coin Type on testnet
USDC_COIN_TYPE=0x2::usdc::USDC

# API Configuration
PORT=4000
FRONTEND_ORIGIN=http://localhost:5173,http://localhost:5174

# AI Providers
AI_PROVIDER=gemini
GEMINI_API_KEY=<your-key>

# Protocol APIs
PROTOCOL_API_MODE=live
NAVI_API_URL=https://open-api.naviprotocol.io
SCALLOP_API_URL=https://api.scallop.io
CETUS_API_URL=https://api-sui.cetus.zone
AFTERMATH_API_URL=https://api.aftermath.finance
EOF

echo "✅ Configuration saved to Backend/.env.deployment"
echo ""
echo "⚠️  MANUAL STEPS REMAINING:"
echo "   1. Update package IDs in Backend/.env.deployment"
echo "   2. Copy to Backend/.env"
echo "   3. Update USDC coin type if different"
echo "   4. Add your AI provider API keys"
echo ""

# Step 7: Verify Setup
echo ""
echo "7️⃣  Verifying setup..."
sui client balance --address "$sui_address"
echo "✅ Wallet balance confirmed"

echo ""
echo "════════════════════════════════════════"
echo "✅ SETUP COMPLETE!"
echo ""
echo "Next steps:"
echo "  1. npm install (if needed)"
echo "  2. npm run dev (start backend)"
echo "  3. npm run demo:flow (test flow)"
echo "  4. Open frontend at http://localhost:5173"
echo ""
