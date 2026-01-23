# 🚀 Deploy TrollBetETH - Native ETH Version

## 📋 What Changed?

**OLD (Token-based):**
- Required $DEGEN token approval
- Two transactions for each bet (approve + bet)
- Complex token management

**NEW (ETH-based):**
- ✅ NO approval needed!
- ✅ Single transaction for each bet
- ✅ Direct ETH payments
- ✅ Works better with Farcaster wallets

---

## 🛠️ Deploy via Remix IDE

### Step 1: Open Remix
Go to: https://remix.ethereum.org

### Step 2: Create New File
1. In the File Explorer, click "+" to create new file
2. Name it: `TrollBetETH.sol`
3. Copy the entire content from `contracts/REMIX_TrollBetETH.sol`

### Step 3: Compile
1. Go to "Solidity Compiler" (left sidebar)
2. Select compiler version: `0.8.20`
3. Click "Compile TrollBetETH.sol"
4. ✅ Should compile without errors

### Step 4: Deploy
1. Go to "Deploy & Run Transactions" (left sidebar)
2. Environment: **Injected Provider - MetaMask**
3. Make sure MetaMask is on **Base Sepolia**
4. Contract: Select `TrollBetETH`
5. Constructor parameter `_owner`: Enter YOUR wallet address
   - Example: `0x742d35Cc6634C0532925a3b844Bc9e7595f1D456`
6. Click **Deploy**
7. Confirm transaction in MetaMask

### Step 5: Save Contract Address
After deployment, you'll see the new contract address.
**SAVE THIS ADDRESS!**

Example: `0x1234567890abcdef1234567890abcdef12345678`

### Step 6: Update Frontend
Open `src/hooks/useTrollBetETH.ts` and update:

```typescript
export const TROLLBET_ETH_ADDRESS: Address = '0xYOUR_NEW_CONTRACT_ADDRESS';
```

---

## 🔧 Create First Market

After deploying, call `createMarket()` with:
- `question`: "Will Bitcoin hit $100k by end of 2026?"
- `endTime`: Unix timestamp (e.g., `1735689600` for Dec 31, 2024)

---

## ✅ Verification Checklist

- [ ] Contract deployed to Base Sepolia
- [ ] Contract address saved
- [ ] `useTrollBetETH.ts` updated with new address
- [ ] First market created
- [ ] Test bet placed successfully

---

## 🎯 Contract Features

### placeBet(marketId, side)
- `payable` function - send ETH with transaction
- `marketId`: Market number (0, 1, 2, ...)
- `side`: `true` = YES, `false` = NO
- ETH amount = `msg.value`

### claimWinnings(marketId)
- Claim your winnings after market resolves
- ETH sent directly to your wallet

### Admin Functions (Owner only)
- `createMarket(question, endTime)` - Create new market
- `resolveMarket(marketId, winningSide)` - Resolve market
- `withdrawFees()` - Withdraw accumulated 1% fees

---

## 💰 Fee Structure

- **Protocol Fee**: 1% on winning payouts
- **No approval fees**: Save on gas!
- **Estimated gas per bet**: ~100k gas

---

## 🔗 Useful Links

- Base Sepolia Faucet: https://www.alchemy.com/faucets/base-sepolia
- BaseScan Sepolia: https://sepolia.basescan.org
- Remix IDE: https://remix.ethereum.org

---

## ⚠️ Important Notes

1. **ALWAYS test on Base Sepolia first!**
2. Make sure you have enough ETH for gas + bet
3. Contract owner can create/resolve markets
4. Users can bet and claim winnings

---

## 🎲 Ready to Go!

After following these steps, your TrollBox will accept Native ETH bets!

**Benefits:**
- ⚡ Faster transactions (no approval step)
- 💰 Lower gas costs
- 🔄 Better UX in Farcaster
- ✨ Simpler user flow
