# Farcaster Wallet Transaction Troubleshooting Guide

## Current Issue Summary

Users are experiencing transaction rejections in the Farcaster wallet when trying to:
1. Mint test $DEGEN tokens
2. Approve token spending
3. Place bets

## Error Symptoms

### Console Errors:
1. **`UserRejectedRequestError: User rejected the request`**
   - This is the primary error
   - Indicates the transaction was explicitly rejected or cancelled

2. **`TypeError: Cannot redefine property: ethereum`**
   - Multiple wallet extensions (MetaMask, Rabby, etc.) are conflicting
   - This is a browser-level issue

3. **CSP (Content Security Policy) Violations**
   - `Connecting to 'https://explorer-api.walletconnect.com/v3/wallets?projectId=...' violates the following Content Security Policy directive`
   - This is a Farcaster client environment restriction

## Root Causes

### 1. **Farcaster Wallet Modal Not Appearing**
The transaction approval modal may not be showing up properly in the Farcaster client, causing users to unknowingly reject transactions.

### 2. **Multiple Wallet Extensions Conflict**
If testing in a browser (not in Warpcast), multiple wallet extensions can interfere with each other.

### 3. **Network Configuration Issues**
The wallet may not recognize Base Sepolia (chain ID 84532) properly.

### 4. **Transaction Parameters**
Large numbers (like unlimited approval `MAX_UINT256`) might look suspicious in the wallet UI.

## Solutions Implemented

### ✅ 1. Better User Feedback
- Added clear messages: "⚠️ CONFIRM in your Farcaster wallet (check notification)"
- Extended error message display time to 5 seconds
- Added specific rejection error handling

### ✅ 2. Simplified Transaction Calls
- Removed explicit `account` and `chain` parameters
- Let Wagmi handle connector configuration automatically
- Using synchronous `writeContract` calls

### ✅ 3. Unlimited Approval (One-Time)
- Changed approval to `MAX_UINT256` so users only approve once
- Reduces the number of transactions needed

### ✅ 4. Auto-Connect on Load
- Automatically connects Farcaster wallet when app loads
- Reduces connection-related issues

## Recommended User Actions

### For Testing in Warpcast (Recommended):
1. **Open the app in Warpcast mobile app** (not browser)
2. **Check for notification badges** when clicking YES/NO or FAUCET
3. **Look for the transaction approval modal** - it might be minimized or in a notification
4. **Tap "Approve" or "Confirm"** in the wallet modal
5. **Wait for confirmation** - don't close the app during the transaction

### For Testing in Browser:
1. **Disable other wallet extensions** (MetaMask, Rabby, Coinbase Wallet, etc.)
   - Go to `chrome://extensions/`
   - Disable all except the one you're using
2. **Clear browser cache and reload**
3. **Try in incognito mode** with only one wallet extension enabled

### General Troubleshooting:
1. **Check your wallet balance**
   - You need Base Sepolia ETH for gas fees
   - Get testnet ETH from: https://www.alchemy.com/faucets/base-sepolia

2. **Verify network**
   - Make sure your wallet is on Base Sepolia (Chain ID: 84532)
   - Not Base Mainnet (Chain ID: 8453)

3. **Transaction stuck?**
   - Close and reopen the app
   - Try disconnecting and reconnecting wallet

4. **Still not working?**
   - Try a different wallet/device
   - Check Farcaster/Warpcast for any known issues

## Technical Details

### Contract Addresses (Base Sepolia):
- **MockDEGEN Token**: `0xdDB5C1a86762068485baA1B481FeBeB17d30e002`
- **TrollBet Contract**: `0x26dEe56f85fAa471eFF9210326734389186ac625`

### Transaction Flow:
1. **First Time Betting:**
   - Transaction 1: Approve TrollBet to spend your $DEGEN (unlimited)
   - Transaction 2: Place bet with specified amount

2. **Subsequent Bets:**
   - Only 1 transaction needed (approval already granted)

### Wagmi Configuration:
```typescript
// We're using Wagmi v2 with simplified calls
writeContract({
  address: CONTRACT_ADDRESS,
  abi: ABI,
  functionName: 'functionName',
  args: [arg1, arg2],
});
// No explicit account/chain - Wagmi handles it via connector
```

## Known Limitations

### Farcaster Client Environment:
1. **CSP Restrictions**: The Farcaster client has strict Content Security Policy that blocks some external connections (like WalletConnect explorer API)
2. **Wallet Provider**: Farcaster uses a custom wallet provider that may behave differently than standard browser wallets
3. **Mobile vs Desktop**: Behavior may differ between Warpcast mobile app and web client

### Workarounds:
- These CSP errors don't prevent transactions from working
- They're just warnings about blocked external resources
- The core transaction functionality still works

## Next Steps for Debugging

If the issue persists, we need to:

1. **Test in actual Warpcast mobile app** (not browser)
   - This is the primary environment for Farcaster Mini Apps

2. **Add more detailed transaction logging**
   - Log the exact transaction data being sent
   - Log wallet provider state

3. **Simplify the transaction even further**
   - Try with smaller amounts
   - Try with explicit gas limits

4. **Contact Farcaster Support**
   - Report the issue to Farcaster/Warpcast team
   - Check if there are known issues with wallet transactions in Mini Apps

## Success Indicators

You'll know it's working when:
1. ✅ Clicking "Get Test Tokens" shows a transaction modal in your wallet
2. ✅ After confirming, you see "Transaction confirmed" message
3. ✅ Your $DEGEN balance updates to 10,000
4. ✅ Clicking YES/NO shows approval modal (first time only)
5. ✅ After approval, bet is placed automatically
6. ✅ Your bet appears in "Your Bets" tab

## Alternative: Deploy to Mainnet

If testnet continues to have issues, consider:
1. Deploy contracts to **Base Mainnet**
2. Use real $DEGEN token: `0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed`
3. Start with small amounts for testing
4. Mainnet wallets tend to be more reliable and well-tested

---

**Last Updated**: 2026-01-23
**Status**: Investigating transaction rejection issues in Farcaster wallet
