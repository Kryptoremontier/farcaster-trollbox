# 🚀 TrollBet Deployment via Remix IDE (No Foundry Needed!)

## Why Remix?
- ✅ No installation needed (browser-based)
- ✅ Works with MetaMask
- ✅ Easy contract verification
- ✅ Perfect for Base Sepolia testing

---

## Step 1: Deploy MockDEGEN Token (5 minutes)

### 1.1 Open Remix
Go to: **https://remix.ethereum.org/**

### 1.2 Create MockDEGEN.sol
1. Click "+" icon to create new file
2. Name it: `MockDEGEN.sol`
3. Paste this code:

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
1. Click "Solidity Compiler" tab (left sidebar)
2. Select compiler: **0.8.20**
3. Click "Compile MockDEGEN.sol"
4. Wait for green checkmark ✅

### 1.4 Deploy
1. Click "Deploy & Run" tab
2. Environment: Select **"Injected Provider - MetaMask"**
3. MetaMask will popup - **Connect** your wallet
4. In MetaMask, select **Base Sepolia** network
5. Make sure you have Sepolia ETH (get from faucet if needed)
6. Click **"Deploy"** button
7. Confirm transaction in MetaMask
8. Wait ~5 seconds for confirmation

### 1.5 Get Contract Address
1. Look at "Deployed Contracts" section (bottom)
2. You'll see: `MOCKDEGEN AT 0x...`
3. **Copy this address!** Example: `0x1234567890abcdef1234567890abcdef12345678`

### 1.6 Mint Test Tokens
1. In deployed contract, find `mint` function
2. Parameters:
   - `to`: Your wallet address
   - `amount`: `1000000000000000000000000` (1 million tokens with 18 decimals)
3. Click "transact"
4. Confirm in MetaMask

✅ **MockDEGEN deployed!** Save the address.

---

## Step 2: Deploy TrollBet Contract (10 minutes)

### 2.1 Create TrollBet.sol in Remix
1. Create new file: `TrollBet.sol`
2. Go to your local file: `contracts/src/TrollBet.sol`
3. Copy ENTIRE contents
4. Paste into Remix

### 2.2 Install OpenZeppelin
TrollBet uses OpenZeppelin. Remix can auto-import:

1. The imports in TrollBet.sol will show errors initially
2. Remix will auto-download OpenZeppelin from GitHub
3. Wait ~30 seconds for imports to resolve
4. Errors should disappear

### 2.3 Compile TrollBet
1. Go to "Solidity Compiler" tab
2. Compiler: **0.8.20**
3. Enable Optimization: **200 runs**
4. Click "Compile TrollBet.sol"
5. Wait for green checkmark ✅

### 2.4 Deploy TrollBet
1. Go to "Deploy & Run" tab
2. Contract dropdown: Select **"TrollBet"**
3. Constructor parameters:
   - `_degenToken`: **Paste MockDEGEN address from Step 1.5**
   - `_owner`: **Your wallet address**
4. Click **"Deploy"**
5. Confirm in MetaMask
6. Wait for confirmation

### 2.5 Get TrollBet Address
1. Look at "Deployed Contracts"
2. You'll see: `TROLLBET AT 0x...`
3. **Copy this address!** Example: `0xabcdef1234567890abcdef1234567890abcdef12`

✅ **TrollBet deployed!** Save the address.

---

## Step 3: Create Markets (5 minutes)

### 3.1 Call createMarket function
In Remix, with TrollBet deployed:

1. Expand TrollBet contract in "Deployed Contracts"
2. Find `createMarket` function
3. Parameters:
   - `question`: `"Will Peter Schiff tweet about Bitcoin today?"`
   - `endTime`: `1738454400` (use: https://www.unixtimestamp.com/ for tomorrow)
4. Click "transact"
5. Confirm in MetaMask

### 3.2 Create More Markets
Repeat for each market:

**Market 2:**
- Question: `"Will $DEGEN hit $0.10 this week?"`
- End time: 7 days from now

**Market 3:**
- Question: `"Will Elon Musk post a Pepe meme today?"`
- End time: Tomorrow

**Market 4:**
- Question: `"Will Bitcoin hit $110k this week?"`
- End time: 7 days from now

**Market 5:**
- Question: `"Will Vitalik call Ethereum ultrasound money?"`
- End time: 3 days from now

**Market 6:**
- Question: `"Will Crypto Twitter argue about PoW vs PoS today?"`
- End time: Tomorrow

✅ **6 Markets created!**

---

## Step 4: Update Frontend (2 minutes)

### 4.1 Update Contract Address
Open: `src/hooks/useTrollBet.ts`

Replace:
```typescript
export const TROLLBET_CONTRACT_ADDRESS: Address = '0x0000000000000000000000000000000000000000';
```

With:
```typescript
export const TROLLBET_CONTRACT_ADDRESS: Address = '0xYOUR_TROLLBET_ADDRESS';
```

### 4.2 Update Token Address
In same file, replace:
```typescript
export const DEGEN_TOKEN_ADDRESS: Address = '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed';
```

With:
```typescript
export const DEGEN_TOKEN_ADDRESS: Address = '0xYOUR_MOCKDEGEN_ADDRESS';
```

### 4.3 Update Market IDs
Open: `src/lib/mockMarkets.ts`

Update first 6 markets with `contractMarketId`:
```typescript
{
  id: 'peter-schiff-btc',
  contractMarketId: 0, // ← First market created
  // ...
},
{
  id: 'degen-price',
  contractMarketId: 1, // ← Second market
  // ...
},
// ... continue for all 6 markets
```

---

## Step 5: Deploy Frontend (3 minutes)

### 5.1 Build
```bash
npm run build
```

Should complete without errors ✅

### 5.2 Commit & Push
```bash
git add .
git commit -m "🚀 Deploy: TrollBet on Base Sepolia with 6 markets"
git push origin main
```

### 5.3 Wait for Netlify
- Netlify auto-deploys from GitHub
- Wait ~2-3 minutes
- Check: https://farcaster-trollbox.netlify.app

---

## Step 6: Test in Warpcast (5 minutes)

### 6.1 Open Warpcast Playground
Go to: https://warpcast.com/~/developers/frames

### 6.2 Enter Your URL
```
https://farcaster-trollbox.netlify.app
```

### 6.3 Test Flow
1. ✅ Hub loads with markets
2. ✅ Click "Bet Now"
3. ✅ Connect wallet
4. ✅ Approve MockDEGEN
5. ✅ Place bet
6. ✅ Transaction confirms
7. ✅ Success toast appears!

---

## 🎉 Done!

Your TrollBox is now live on Base Sepolia with:
- ✅ MockDEGEN token deployed
- ✅ TrollBet contract deployed
- ✅ 6 active markets
- ✅ Frontend connected
- ✅ Ready for testing!

---

## 📝 Save These Addresses

Add to your `contracts/.env`:

```bash
# Deployed Contracts on Base Sepolia
DEGEN_TOKEN_SEPOLIA=0xYOUR_MOCKDEGEN_ADDRESS
TROLLBET_ADDRESS=0xYOUR_TROLLBET_ADDRESS

# BaseScan Links
# MockDEGEN: https://sepolia.basescan.org/address/0xYOUR_MOCKDEGEN_ADDRESS
# TrollBet: https://sepolia.basescan.org/address/0xYOUR_TROLLBET_ADDRESS
```

---

## 🔍 Verify Contracts (Optional)

### On BaseScan:
1. Go to your contract on BaseScan
2. Click "Contract" tab
3. Click "Verify and Publish"
4. Select:
   - Compiler: 0.8.20
   - Optimization: Yes (200 runs)
5. Paste contract code
6. Submit

---

## ⚡ Quick Reference

| Item | Value |
|------|-------|
| Network | Base Sepolia |
| Chain ID | 84532 |
| RPC | https://sepolia.base.org |
| Explorer | https://sepolia.basescan.org |
| Faucet | https://www.alchemy.com/faucets/base-sepolia |

---

## 🆘 Troubleshooting

**"Insufficient funds"**
→ Get Sepolia ETH from faucet

**"Transaction failed"**
→ Check gas limits, try again

**"Contract not found"**
→ Wait 30 seconds, refresh BaseScan

**"Imports not resolving"**
→ Wait for Remix to download OpenZeppelin

---

**Total Time: ~30 minutes**

**Cost: FREE (testnet)**

Good luck! 🚀
