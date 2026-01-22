# Testing Guide - TrollBet Contract Integration

## Overview

This guide walks you through testing the smart contract integration locally and in Warpcast.

## 🧪 Local Testing (Without Warpcast)

### Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open http://localhost:3000

### What You Can Test Locally

✅ **UI/UX**
- Hub page loads with market cards
- Navigation to market details works
- Back button returns to Hub
- Market stats display correctly
- Chat messages animate
- Leaderboard displays

✅ **Layout & Styling**
- Responsive design
- Colors and branding
- Buttons and cards
- Safe area insets (simulated)

❌ **What Won't Work**
- Wallet connection (needs Warpcast)
- Farcaster user context
- Actual betting transactions
- Token approval

### Expected Behavior

1. **Hub Page**: Shows all markets with mock data
2. **Market Detail**: Shows betting interface
3. **Connect Wallet**: Button appears but won't work in browser
4. **Bet Buttons**: Will be disabled (no wallet)

## 🔧 Testing with Foundry Anvil (Local Blockchain)

### 1. Start Local Node

```bash
cd contracts
anvil
```

Leave this running in a terminal. It gives you:
- 10 test accounts with 10,000 ETH each
- Instant block times
- Local RPC at http://localhost:8545

### 2. Deploy Contract to Anvil

In a new terminal:

```bash
cd contracts

# Deploy TrollBet
forge script script/DeployTrollBet.s.sol \
  --rpc-url http://localhost:8545 \
  --broadcast

# Note the deployed contract address from output
```

### 3. Update Frontend for Local Testing

Edit `src/hooks/useTrollBet.ts`:

```typescript
// Use your Anvil deployed address
export const TROLLBET_CONTRACT_ADDRESS: Address = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

// For Anvil, you need a mock DEGEN token - deploy one or use any address
export const DEGEN_TOKEN_ADDRESS: Address = '0x...'; // Deploy mock ERC20
```

Also update `src/components/providers/WagmiProvider.tsx` to include localhost:

```typescript
import { localhost } from 'wagmi/chains';

const chains = [base, localhost] as const;
```

### 4. Connect via Browser Wallet

Now you can test with MetaMask:
1. Add Anvil network to MetaMask:
   - Network Name: Anvil
   - RPC URL: http://localhost:8545
   - Chain ID: 31337
   - Currency: ETH

2. Import one of Anvil's test accounts using the private key shown in terminal

3. Connect wallet in the app

4. Test transactions!

### 5. Create Test Markets

```bash
cast send $CONTRACT_ADDRESS \
  "createMarket(string,uint256)" \
  "Test Market 1" \
  $(date -d "+1 day" +%s) \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

## 📱 Testing in Warpcast (Production-like)

### Prerequisites

1. **Deploy to Netlify** (or use ngrok for localhost)
2. **Deploy contract to Base**
3. **Have $DEGEN tokens** in your Warpcast wallet

### Using ngrok for Local Testing

```bash
# Install ngrok: https://ngrok.com/download

# Start your dev server
npm run dev

# In another terminal, expose it
ngrok http 3000
```

ngrok gives you a public URL like: `https://abc123.ngrok.io`

Update `src/app/page.tsx` and `public/.well-known/farcaster.json` to use this URL.

### Test in Warpcast Playground

1. Go to https://warpcast.com/~/developers/frames
2. Enter your ngrok URL (or Netlify URL)
3. Click "Preview"

### What to Test

#### 1. Initial Load
- [ ] Hub displays correctly
- [ ] All market cards visible
- [ ] Thumbnail images load
- [ ] Stats show correct values

#### 2. Navigation
- [ ] Click "Bet Now" opens market detail
- [ ] Back button returns to Hub
- [ ] App doesn't crash or reload

#### 3. Wallet Connection
- [ ] "Connect Wallet" button visible if not connected
- [ ] Click triggers Warpcast wallet connection
- [ ] User profile appears after connection
- [ ] Wallet address shown

#### 4. Token Approval (First Time)
- [ ] "Approve $DEGEN Token" button appears
- [ ] Click triggers approval transaction
- [ ] Warpcast prompts for signature
- [ ] Loading state shows: "Waiting for signature..."
- [ ] Then shows: "Approving tokens..."
- [ ] Success toast appears: "Token approval successful!"
- [ ] Button disappears after approval

#### 5. Placing Bets
- [ ] Select amount (100, 500, 1000, 5000)
- [ ] Selected amount highlights
- [ ] YES/NO odds display correctly
- [ ] Click YES or NO button
- [ ] Warpcast prompts for signature
- [ ] Loading state: "Waiting for signature in Warpcast..."
- [ ] Then: "Confirming transaction on chain..."
- [ ] Success toast: "Bet placed successfully! 🎉"
- [ ] Chat message appears with your bet
- [ ] User balance section updates
- [ ] Market pools update

#### 6. Error Handling
- [ ] Insufficient balance shows error
- [ ] Rejected signature shows error
- [ ] Network errors display properly
- [ ] Error toasts auto-dismiss after 3 seconds

#### 7. Market Resolution
- [ ] Resolved markets show "Claim Winnings" button (if winner)
- [ ] Click triggers claim transaction
- [ ] Loading states during claim
- [ ] Success toast on claim
- [ ] Tokens received in wallet

#### 8. Real-time Updates
- [ ] Market data refreshes every 10 seconds
- [ ] Odds recalculate when pools change
- [ ] Other users' bets appear (if any)

#### 9. Edge Cases
- [ ] App works offline (shows cached data)
- [ ] App recovers from RPC errors
- [ ] Handles very large numbers (100k+ DEGEN)
- [ ] Works with expired markets
- [ ] Multiple rapid transactions

## 🐛 Common Issues & Fixes

### "Cannot read properties of undefined"

**Issue**: Market data not loading

**Fix**: 
1. Check contract address is correct
2. Verify market exists on contract
3. Check Base RPC is working

```typescript
// Add logging to see what's happening
useEffect(() => {
  console.log('Market data:', marketData);
  console.log('User bet:', userBet);
}, [marketData, userBet]);
```

### "User rejected the request"

**Issue**: User cancelled transaction in Warpcast

**Fix**: This is expected behavior. Your error handling should catch this:

```typescript
} catch (error: any) {
  if (error.code === 4001) {
    setBetStatus({ type: 'error', message: 'Transaction cancelled' });
  }
}
```

### "Insufficient allowance"

**Issue**: User hasn't approved tokens

**Fix**: Show approve button first:

```typescript
{needsApproval && (
  <Button onClick={handleApprove}>
    Approve $DEGEN Token
  </Button>
)}
```

### "Transaction underpriced"

**Issue**: Gas too low on Base

**Fix**: Add gas buffer in wagmi config:

```typescript
writeContract({
  // ...
  gas: BigInt(300000), // Add explicit gas limit
});
```

### Loading States Stuck

**Issue**: Transaction pending forever

**Fix**: Check transaction on BaseScan:
```
https://basescan.org/tx/YOUR_TX_HASH
```

If failed, show error. If pending, wait longer.

## 📊 Testing Checklist

Use this checklist for each test session:

### Pre-Launch
- [ ] Contract deployed to Base
- [ ] Contract address updated in code
- [ ] Markets created on contract
- [ ] Market IDs mapped correctly
- [ ] Frontend deployed to Netlify
- [ ] Manifest verified
- [ ] App registered on Warpcast

### Functional Tests
- [ ] Hub loads in < 3 seconds
- [ ] Navigation works smoothly
- [ ] Wallet connects successfully
- [ ] Approval transaction succeeds
- [ ] Bet transaction succeeds
- [ ] Loading states display correctly
- [ ] Success toasts appear
- [ ] Error toasts appear for errors
- [ ] User balance updates
- [ ] Market pools update
- [ ] Odds recalculate
- [ ] Chat messages appear
- [ ] Claim winnings works

### Cross-Platform
- [ ] iOS Warpcast app
- [ ] Android Warpcast app
- [ ] Desktop browser (limited)

### Performance
- [ ] No lag when scrolling
- [ ] Animations smooth (60fps)
- [ ] No memory leaks
- [ ] Transactions confirm < 10s
- [ ] Real-time updates work

### Security
- [ ] Can't bet more than balance
- [ ] Can't bet on closed markets
- [ ] Can't claim without winning
- [ ] Transactions require signature
- [ ] No private keys in code

## 🔬 Advanced Testing

### Automated Tests

Create `src/__tests__/DegenBox.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { DegenBox } from '~/components/DegenBox';

describe('DegenBox', () => {
  it('renders market info', () => {
    render(<DegenBox marketId="market-1" onBack={() => {}} />);
    expect(screen.getByText('TrollBox')).toBeInTheDocument();
  });
});
```

Run tests:
```bash
npm test
```

### Load Testing

Test with multiple concurrent users:

```bash
# Install k6: https://k6.io/docs/getting-started/installation/

# Create test script: load-test.js
import http from 'k6/http';

export default function () {
  http.get('https://farcaster-trollbox.netlify.app');
}

# Run test
k6 run --vus 10 --duration 30s load-test.js
```

### Contract Testing

Test contract directly:

```bash
cd contracts

# Run all tests
forge test

# Run specific test
forge test --match-test testPlaceBet

# Run with gas report
forge test --gas-report

# Run with coverage
forge coverage
```

## 📝 Test Reports

After testing, document your findings:

```markdown
## Test Report - [Date]

### Environment
- Frontend: Netlify / ngrok / localhost
- Contract: Base / Anvil
- Device: iOS / Android / Desktop

### Results
- ✅ All core features working
- ⚠️ Minor UI glitch on iOS
- ❌ Claim not working (fixed)

### Issues Found
1. **Issue**: Toast not dismissing
   **Fix**: Added setTimeout with correct duration
   **Status**: Fixed

2. **Issue**: Odds showing NaN
   **Fix**: Added null checks for pool values
   **Status**: Fixed

### Performance
- Load time: 2.1s
- Transaction time: 6.3s avg
- Memory usage: 45MB

### Next Steps
- [ ] Fix iOS UI glitch
- [ ] Add more error messages
- [ ] Optimize image loading
```

---

**Ready to test?** Start with local testing, then Anvil, then Warpcast!

**Questions?** Check CONTRACT_INTEGRATION.md for technical details.
