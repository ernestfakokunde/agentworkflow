#!/bin/bash

# DEPLOYMENT VERIFICATION SCRIPT
# Checks that all contracts are deployed and configured correctly on testnet

set -e

echo "🔍 AETHER DEPLOYMENT VERIFICATION"
echo "════════════════════════════════════════"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function check_pass() {
    echo -e "${GREEN}✅ $1${NC}"
}

function check_fail() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

function check_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Load .env
if [ -f "Backend/.env" ]; then
    source Backend/.env
    check_pass "Loaded Backend/.env"
else
    check_fail "Backend/.env not found"
fi

echo ""
echo "1️⃣  Checking Prerequisites"
echo "───────────────────────────────────────"

# Check Sui CLI
if command -v sui &> /dev/null; then
    check_pass "Sui CLI installed ($(sui --version))"
else
    check_fail "Sui CLI not found"
fi

# Check Node.js
if command -v node &> /dev/null; then
    check_pass "Node.js installed ($(node --version))"
else
    check_fail "Node.js not found"
fi

echo ""
echo "2️⃣  Checking Network Configuration"
echo "───────────────────────────────────────"

# Check network
network=$(sui client active-env)
if [[ "$network" == *"testnet"* ]]; then
    check_pass "Connected to testnet"
else
    check_warn "Connected to $network (not testnet)"
fi

# Check address
if [ -n "$SUI_ADDRESS" ]; then
    check_pass "Wallet configured: $SUI_ADDRESS"
else
    check_warn "SUI_ADDRESS not set in .env"
fi

echo ""
echo "3️⃣  Checking Configuration"
echo "───────────────────────────────────────"

# Check package IDs
if [ -n "$VAULT_PACKAGE_ID" ] && [[ "$VAULT_PACKAGE_ID" == "0x"* ]]; then
    check_pass "VAULT_PACKAGE_ID configured"
else
    check_fail "VAULT_PACKAGE_ID missing or invalid"
fi

if [ -n "$PROTOCOL_ADAPTERS_PACKAGE_ID" ] && [[ "$PROTOCOL_ADAPTERS_PACKAGE_ID" == "0x"* ]]; then
    check_pass "PROTOCOL_ADAPTERS_PACKAGE_ID configured"
else
    check_fail "PROTOCOL_ADAPTERS_PACKAGE_ID missing or invalid"
fi

if [ -n "$ESCROW_PACKAGE_ID" ] && [[ "$ESCROW_PACKAGE_ID" == "0x"* ]]; then
    check_pass "ESCROW_PACKAGE_ID configured"
else
    check_fail "ESCROW_PACKAGE_ID missing or invalid"
fi

# Check API keys
if [ -n "$GEMINI_API_KEY" ]; then
    check_pass "GEMINI_API_KEY configured"
else
    check_warn "GEMINI_API_KEY not set (AI agents may not work)"
fi

# Check protocol APIs
if [ -n "$NAVI_API_URL" ]; then
    check_pass "NAVI_API_URL configured"
else
    check_fail "NAVI_API_URL missing"
fi

echo ""
echo "4️⃣  Checking Sui Network"
echo "───────────────────────────────────────"

# Check balance
balance=$(sui client balance --address $SUI_ADDRESS 2>/dev/null | grep -oP '\d+' | head -1)
if [ -z "$balance" ]; then
    check_warn "Could not retrieve balance (check address)"
else
    # Convert to SUI (1 SUI = 10^9 MIST)
    sui_balance=$((balance / 1000000000))
    if [ "$sui_balance" -gt 0 ]; then
        check_pass "Account balance: $sui_balance SUI"
    else
        check_fail "Account has no balance"
    fi
fi

echo ""
echo "5️⃣  Checking Contract Deployments"
echo "───────────────────────────────────────"

# Function to check if package exists
check_package() {
    local pkg_id=$1
    local pkg_name=$2
    
    # Try to fetch package info from Sui RPC
    result=$(sui client object $pkg_id 2>/dev/null || echo "")
    
    if [ -n "$result" ]; then
        check_pass "$pkg_name deployed: $pkg_id"
        return 0
    else
        check_warn "$pkg_name may not be deployed (manual verification needed)"
        return 1
    fi
}

check_package $VAULT_PACKAGE_ID "Vault"
check_package $PROTOCOL_ADAPTERS_PACKAGE_ID "Protocol Adapters"
check_package $ESCROW_PACKAGE_ID "Escrow"

echo ""
echo "6️⃣  Checking Backend Setup"
echo "───────────────────────────────────────"

# Check if node_modules exists
if [ -d "Backend/node_modules" ]; then
    check_pass "Backend dependencies installed"
else
    check_warn "Backend dependencies not installed (run: cd Backend && npm install)"
fi

# Check if files exist
if [ -f "Backend/src/index.js" ]; then
    check_pass "Backend entry point exists"
else
    check_fail "Backend entry point missing"
fi

if [ -f "Backend/src/blockchain/suiService.js" ]; then
    check_pass "Sui service module exists"
else
    check_fail "Sui service module missing"
fi

if [ -f "Backend/demo-flow.js" ]; then
    check_pass "Demo script exists"
else
    check_fail "Demo script missing"
fi

echo ""
echo "7️⃣  Checking Frontend Setup"
echo "───────────────────────────────────────"

# Check if node_modules exists
if [ -d "Frontend/node_modules" ]; then
    check_pass "Frontend dependencies installed"
else
    check_warn "Frontend dependencies not installed (run: cd Frontend && npm install)"
fi

if [ -f "Frontend/src/main.jsx" ]; then
    check_pass "Frontend entry point exists"
else
    check_fail "Frontend entry point missing"
fi

if [ -f "Frontend/src/wallet/suiTransactions.js" ]; then
    check_pass "Sui transactions module exists"
else
    check_fail "Sui transactions module missing"
fi

echo ""
echo "════════════════════════════════════════"
echo "✨ VERIFICATION COMPLETE"
echo ""

# Summary
echo "Next steps:"
echo "  1. Install dependencies: cd Backend && npm install"
echo "  2. Start backend: npm run dev"
echo "  3. Test demo: npm run demo:flow"
echo "  4. Start frontend: cd ../Frontend && npm install && npm run dev"
echo "  5. Open http://localhost:5173"
echo ""
