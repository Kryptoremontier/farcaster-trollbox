# ⚡ QUICK REMIX DEPLOYMENT - 15 Minutes

## 🎯 Goal
Deploy TrollBet to Base Sepolia using Remix IDE (no Foundry needed!)

---

## 📋 STEP 1: Deploy MockDEGEN (5 min)

### 1.1 Open Remix
**Go to:** https://remix.ethereum.org/

### 1.2 Create File
1. Click "+" icon (File Explorer, left sidebar)
2. Name: `MockDEGEN.sol`
3. **Copy from:** `contracts/REMIX_MockDEGEN.sol` in your project
4. **Or copy this:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockDEGEN {
    string public name = "Mock DEGEN";
    string public symbol = "mDEGEN";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        return _transfer(msg.sender, to, amount);
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - amount;
        }
        return _transfer(from, to, amount);
    }
    
    function _transfer(address from, address to, uint256 amount) internal returns (bool) {
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
```

### 1.3 Compile
1. Click "Solidity Compiler" tab (left sidebar, 3rd icon)
2. Compiler: **0.8.20**
3. Click **"Compile MockDEGEN.sol"**
4. Wait for green checkmark ✅

### 1.4 Deploy
1. Click "Deploy & Run" tab (left sidebar, 4th icon)
2. Environment: **"Injected Provider - MetaMask"**
3. MetaMask popup → **Connect**
4. In MetaMask: Select **Base Sepolia** network
   - If you don't see it: Add network manually
   - RPC: `https://sepolia.base.org`
   - Chain ID: `84532`
5. Click **"Deploy"** (orange button)
6. Confirm in MetaMask
7. Wait ~10 seconds

### 1.5 Copy Address
1. Look at "Deployed Contracts" (bottom of Deploy tab)
2. You'll see: `MOCKDEGEN AT 0x...`
3. Click copy icon next to address
4. **SAVE THIS!** Example: `0x1234...5678`

### 1.6 Mint Test Tokens
1. Expand MockDEGEN contract (click ▼)
2. Find `mint` function
3. Fill in:
   - `to`: Your wallet address (paste from MetaMask)
   - `amount`: `1000000000000000000000000` (1 million tokens)
4. Click **"transact"**
5. Confirm in MetaMask

✅ **MockDEGEN deployed!**

---

## 📋 STEP 2: Deploy TrollBet (5 min)

### 2.1 Create File
1. In Remix, click "+" again
2. Name: `TrollBet.sol`
3. **Copy from:** `contracts/src/TrollBet.sol` in your project

### 2.2 Wait for Imports
- Remix will auto-download OpenZeppelin
- Wait ~30 seconds
- Errors should disappear

### 2.3 Compile
1. Go to "Solidity Compiler" tab
2. Compiler: **0.8.20**
3. Optimization: **Enabled** (200 runs)
4. Click **"Compile TrollBet.sol"**
5. Wait for green checkmark ✅

### 2.4 Deploy
1. Go to "Deploy & Run" tab
2. Contract dropdown: Select **"TrollBet"**
3. Constructor parameters (expand ▼):
   - `_degenToken`: **Paste MockDEGEN address from Step 1.5**
   - `_owner`: **Your wallet address**
4. Click **"Deploy"**
5. Confirm in MetaMask
6. Wait ~10 seconds

### 2.5 Copy Address
1. Look at "Deployed Contracts"
2. You'll see: `TROLLBET AT 0x...`
3. Click copy icon
4. **SAVE THIS!** Example: `0xabcd...ef12`

✅ **TrollBet deployed!**

---

## 📋 STEP 3: Create Markets (3 min)

In Remix, with TrollBet expanded:

### Create All 6 Markets:

Use `createMarket` function for each:

1. **Peter Schiff**: `Will Peter Schiff tweet about Bitcoin today?` | `1738540800`
2. **Degen Price**: `Will $DEGEN hit $0.10 this week?` | `1738972800`
3. **Elon Pepe**: `Will Elon Musk post a Pepe meme today?` | `1738540800`
4. **Bitcoin 110k**: `Will Bitcoin hit $110k this week?` | `1738972800`
5. **Vitalik**: `Will Vitalik call Ethereum ultrasound money?` | `1738713600`
6. **PoW vs PoS**: `Will Crypto Twitter argue about PoW vs PoS today?` | `1738540800`

Click "transact" → Confirm for each one.

✅ **6 Markets created!**

---

## 📋 STEP 4-6: AUTOMATED UPDATE & DEPLOY (30 seconds!)

### 🚀 Use the Auto-Update Script:

Instead of manually editing files, just run:

```bash
node update-contracts.js 0xYOUR_MOCKDEGEN_ADDRESS 0xYOUR_TROLLBET_ADDRESS
```

**This script automatically:**
- ✅ Updates `src/hooks/useTrollBet.ts` with contract addresses
- ✅ Updates `src/lib/mockMarkets.ts` with market IDs (0-5)
- ✅ Updates `contracts/.env` with deployed addresses
- ✅ Runs `npm run build`
- ✅ Commits changes to git
- ✅ Pushes to GitHub
- ✅ Triggers Netlify deployment

**Example:**
```bash
node update-contracts.js 0x1234567890abcdef1234567890abcdef12345678 0xabcdef1234567890abcdef1234567890abcdef12
```

### 📝 Or Manual Method (2 min):

<details>
<summary>Click to expand manual steps</summary>

#### 4.1 Update Contract Address
Open: `src/hooks/useTrollBet.ts`

**Line 9:** Replace with:
```typescript
export const TROLLBET_CONTRACT_ADDRESS: Address = '0xYOUR_TROLLBET_ADDRESS';
```

#### 4.2 Update Token Address
**Line 12:** Replace with:
```typescript
export const DEGEN_TOKEN_ADDRESS: Address = '0xYOUR_MOCKDEGEN_ADDRESS';
```

#### 4.3 Update Market IDs
Open: `src/lib/mockMarkets.ts`

Update first 6 markets with `contractMarketId: 0` through `5`

#### 4.4 Build & Deploy
```bash
npm run build
git add .
git commit -m "Deploy: TrollBet on Base Sepolia"
git push origin main
```

</details>

### 5.3 Wait for Netlify
- Auto-deploys in ~2 minutes
- Check: https://farcaster-trollbox.netlify.app

---

## 📋 STEP 7: Test in Warpcast

1. Go to: https://warpcast.com/~/developers/frames
2. Enter: `https://farcaster-trollbox.netlify.app`
3. Test:
   - ✅ Hub loads
   - ✅ Click "Bet Now"
   - ✅ Connect wallet
   - ✅ Approve MockDEGEN
   - ✅ Place bet
   - ✅ Success! 🎉

---

## 🎉 DONE!

Your TrollBox is LIVE on Base Sepolia!

### 📝 Save These:

```bash
# Add to contracts/.env
DEGEN_TOKEN_SEPOLIA=0xYOUR_MOCKDEGEN_ADDRESS
TROLLBET_ADDRESS=0xYOUR_TROLLBET_ADDRESS
```

### 🔗 BaseScan Links:
- MockDEGEN: https://sepolia.basescan.org/address/0xYOUR_MOCKDEGEN_ADDRESS
- TrollBet: https://sepolia.basescan.org/address/0xYOUR_TROLLBET_ADDRESS

---

## ⏱️ Total Time: ~10 minutes (with auto-script!)

**Manual:** ~15 minutes  
**With Script:** ~10 minutes

**Cost: FREE (testnet)**

🚀 **You're ready to bet!**
