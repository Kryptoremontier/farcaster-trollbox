# TrollBet Smart Contract Integration Guide

## Overview

The TrollBox frontend has been successfully integrated with the TrollBet.sol smart contract. This guide explains the integration and how to deploy and test it.

## 🎯 What's Been Done

### 1. Contract ABI Generated
- **File**: `src/lib/abi/TrollBet.json`
- Contains the complete ABI for all contract functions including:
  - `placeBet(marketId, side, amount)`
  - `claimWinnings(marketId)`
  - `getMarket(marketId)`
  - `getUserBet(marketId, user)`
  - And more...

### 2. Wagmi Hooks Created
- **File**: `src/hooks/useTrollBet.ts`
- Provides React hooks for contract interactions:

#### Read Hooks (View Functions)
```typescript
useMarketData(marketId)       // Get market info (pools, endTime, etc.)
useUserBet(marketId, address) // Get user's bets on a market
useTotalPool(marketId)        // Get total pool size
useCalculatePayout(...)       // Calculate potential payout
```

#### Write Hooks (Transactions)
```typescript
usePlaceBet()        // Place a bet on YES or NO
useClaimWinnings()   // Claim winnings after market resolves
useApproveToken()    // Approve $DEGEN token spending
```

#### Transaction Status
```typescript
useTransactionStatus(hash)  // Track transaction confirmation
```

### 3. DegenBox.tsx Updated
- **Removed**: Mock betting engine
- **Added**: Real contract interactions
- **Features**:
  - ✅ Token approval flow (required before first bet)
  - ✅ Real-time market data from blockchain
  - ✅ User bet tracking from contract
  - ✅ Transaction status indicators
  - ✅ Loading states during signature & confirmation
  - ✅ Success/error toast notifications
  - ✅ Claim winnings button for resolved markets

## 🔧 Configuration Required

### 1. Deploy the Contract

First, deploy TrollBet.sol to Base (or your target chain):

```bash
cd contracts
forge script script/DeployTrollBet.s.sol --rpc-url $BASE_RPC_URL --broadcast --verify
```

### 2. Update Contract Address

After deployment, update the contract address in `src/hooks/useTrollBet.ts`:

```typescript
export const TROLLBET_CONTRACT_ADDRESS: Address = '0xYOUR_DEPLOYED_CONTRACT_ADDRESS';
```

### 3. Verify Token Address

The $DEGEN token address is pre-configured for Base mainnet:
```typescript
export const DEGEN_TOKEN_ADDRESS: Address = '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed';
```

If deploying to a different network, update this address.

### 4. Create Markets on Contract

You'll need to create markets on the contract that match your UI market IDs. Currently, the UI uses `marketId: 0` for all markets (this needs to be updated based on your market creation strategy).

Use the contract's `createMarket()` function:
```solidity
createMarket("Will Peter Schiff tweet about Bitcoin today?", endTime)
```

## 🎨 UI/UX Features

### Transaction Flow

1. **Connect Wallet** → User connects via Warpcast
2. **Approve Token** → First-time users approve $DEGEN spending
3. **Place Bet** → User selects amount and side (YES/NO)
4. **Sign Transaction** → Warpcast prompts for signature
5. **Wait for Confirmation** → Loading indicator during blockchain confirmation
6. **Success Toast** → Confirmation message when transaction succeeds

### Loading States

- **Pending**: "Waiting for signature in Warpcast..."
- **Confirming**: "Confirming transaction on chain..."
- **Success**: "Bet placed successfully! 🎉"
- **Error**: Displays error message from contract

### Visual Indicators

```typescript
{isBetPending && <Loader2 className="animate-spin" />}
{isBetConfirmed && <CheckCircle2 className="text-green-500" />}
{error && <AlertCircle className="text-red-500" />}
```

## 🧪 Testing Checklist

### Before Going Live

- [ ] **Deploy Contract**
  - Deploy TrollBet.sol to Base
  - Verify on BaseScan
  - Update `TROLLBET_CONTRACT_ADDRESS`

- [ ] **Create Test Markets**
  - Call `createMarket()` for each UI market
  - Note the returned `marketId` values
  - Update UI to use correct market IDs

- [ ] **Test Token Approval**
  - Connect wallet in Warpcast
  - Click "Approve $DEGEN Token"
  - Verify approval transaction succeeds
  - Check that approval button disappears

- [ ] **Test Betting Flow**
  - Select amount (100, 500, 1000, 5000 $DEGEN)
  - Click YES or NO button
  - Sign transaction in Warpcast
  - Wait for confirmation
  - Verify bet appears in "Your Balance" section
  - Check that pools update correctly

- [ ] **Test Market Resolution**
  - Resolve a market (as contract owner)
  - Verify "Claim Winnings" button appears for winners
  - Click claim button
  - Verify tokens are transferred

- [ ] **Test Error Cases**
  - Insufficient balance
  - Betting after market closes
  - Claiming without winning
  - Network errors

### In Warpcast

1. **Open TrollBox** in Warpcast mobile app
2. **Navigate to a market** from the Hub
3. **Connect wallet** if not already connected
4. **Approve tokens** (first time only)
5. **Place a bet** and confirm in Warpcast wallet
6. **Watch loading states** during transaction
7. **Verify success toast** appears
8. **Check your balance** updates

## 📊 Data Flow

```
UI (DegenBox.tsx)
  ↓
Hooks (useTrollBet.ts)
  ↓
Wagmi (useWriteContract, useReadContract)
  ↓
Farcaster Wallet (in Warpcast)
  ↓
Smart Contract (TrollBet.sol on Base)
  ↓
$DEGEN Token (ERC20)
```

## 🔐 Security Notes

- All transactions require user signature in Warpcast
- Token approval is a separate step from betting
- Users can only claim winnings they're entitled to
- Contract enforces betting deadlines and resolution

## 🚀 Next Steps

1. **Deploy the contract** to Base mainnet
2. **Update the contract address** in the code
3. **Create markets** on the contract
4. **Map UI market IDs** to contract market IDs
5. **Test thoroughly** in Warpcast
6. **Push to GitHub** and deploy via Netlify

## 📝 Code Changes Summary

### New Files
- `src/lib/abi/TrollBet.json` - Contract ABI
- `src/hooks/useTrollBet.ts` - Wagmi hooks

### Modified Files
- `src/components/DegenBox.tsx` - Integrated contract interactions
  - Removed mock betting engine
  - Added approve/bet/claim functions
  - Added transaction status tracking
  - Enhanced loading states and toasts

### Environment Variables
No new environment variables needed! The contract address is in the code for now (update after deployment).

## ⚡ Performance

- **Read calls**: Instant (from RPC)
- **Write calls**: 
  - Signature: ~2-5 seconds (user action)
  - Confirmation: ~2-5 seconds (block time on Base)
  - Total: ~5-10 seconds per transaction

## 🐛 Common Issues

### "Insufficient Allowance" Error
→ User needs to approve tokens first

### "Market Does Not Exist" Error
→ Market ID mismatch - check contract market IDs

### Transaction Stuck
→ Check Base network status, may need higher gas

### "Not A Winner" Error
→ User bet on losing side or market not resolved

---

**Status**: ✅ Integration complete - Ready for contract deployment and testing

**Last Updated**: January 2026
