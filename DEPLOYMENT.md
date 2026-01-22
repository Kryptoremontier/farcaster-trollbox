# Complete Deployment Guide

## Prerequisites

- Node.js 18+ and npm/pnpm
- Foundry (for smart contract deployment)
- Base RPC URL (Alchemy, Infura, or public)
- Private key with ETH on Base for gas
- GitHub account
- Netlify account

## Step 1: Deploy Smart Contract

### 1.1 Set Up Environment

```bash
cd contracts
cp env.example .env
```

Edit `.env`:
```bash
PRIVATE_KEY=your_private_key_here
BASE_RPC_URL=https://mainnet.base.org  # or Alchemy URL
BASESCAN_API_KEY=your_basescan_api_key
DEGEN_TOKEN_ADDRESS=0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed
OWNER_ADDRESS=your_address_here
```

### 1.2 Compile Contract

```bash
forge build
```

### 1.3 Test Contract

```bash
forge test -vvv
```

### 1.4 Deploy to Base

```bash
forge script script/DeployTrollBet.s.sol \
  --rpc-url $BASE_RPC_URL \
  --broadcast \
  --verify \
  -vvvv
```

**Save the deployed contract address!** You'll see output like:
```
TrollBet deployed at: 0x1234567890abcdef...
```

### 1.5 Verify on BaseScan (if auto-verify failed)

```bash
forge verify-contract \
  --chain-id 8453 \
  --compiler-version v0.8.20 \
  --constructor-args $(cast abi-encode "constructor(address,address)" $DEGEN_TOKEN_ADDRESS $OWNER_ADDRESS) \
  0xYOUR_CONTRACT_ADDRESS \
  src/TrollBet.sol:TrollBet \
  --etherscan-api-key $BASESCAN_API_KEY
```

## Step 2: Update Frontend Configuration

### 2.1 Update Contract Address

Edit `src/hooks/useTrollBet.ts`:

```typescript
export const TROLLBET_CONTRACT_ADDRESS: Address = '0xYOUR_DEPLOYED_CONTRACT_ADDRESS';
```

### 2.2 Create Markets on Contract

You need to create markets that match your UI. Use cast or a script:

```bash
# Using cast (Foundry tool)
cast send $CONTRACT_ADDRESS \
  "createMarket(string,uint256)" \
  "Will Peter Schiff tweet about Bitcoin today?" \
  $(date -d "+24 hours" +%s) \
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY
```

Or create a deployment script in `contracts/script/CreateMarkets.s.sol`.

### 2.3 Map Market IDs

After creating markets, update `src/lib/mockMarkets.ts` to include the contract market IDs:

```typescript
export const MARKETS: Market[] = [
  {
    id: "market-1",
    contractMarketId: 0,  // ← Add this field
    question: "Will Peter Schiff tweet about Bitcoin today?",
    // ...
  },
  // ...
];
```

Then update `src/components/DegenBox.tsx` to use the correct market ID:

```typescript
const market = getMarketById(marketId);
const marketIdNum = market?.contractMarketId || 0;
```

## Step 3: Test Locally

### 3.1 Install Dependencies

```bash
npm install
```

### 3.2 Run Development Server

```bash
npm run dev
```

### 3.3 Test in Browser

1. Open http://localhost:3000
2. Test navigation between Hub and Market views
3. Note: Wallet connection won't work in browser (needs Warpcast)

### 3.4 Test Contract Calls

You can test contract integration by:
- Checking market data loads correctly
- Verifying odds calculations
- Ensuring error messages display properly

## Step 4: Deploy to GitHub

### 4.1 Initialize Git (if not already)

```bash
git init
git add .
git commit -m "Initial commit with TrollBet contract integration"
```

### 4.2 Create GitHub Repository

1. Go to https://github.com/new
2. Name: `farcaster-trollbox` (or your choice)
3. Make it public or private
4. **Don't** initialize with README (you already have one)

### 4.3 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/farcaster-trollbox.git
git branch -M main
git push -u origin main
```

## Step 5: Deploy to Netlify

### 5.1 Connect to Netlify

1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose GitHub
4. Authorize Netlify to access your repos
5. Select `farcaster-trollbox` repository

### 5.2 Configure Build Settings

Netlify should auto-detect Next.js. Verify:

- **Build command**: `npm run build` (or `pnpm build`)
- **Publish directory**: `.next`
- **Node version**: 18.x or higher

### 5.3 Set Environment Variables

In Netlify settings, add:

```
NEXT_PUBLIC_URL=https://farcaster-trollbox.netlify.app
```

(Replace with your actual Netlify URL after first deploy)

### 5.4 Deploy

Click "Deploy site"

Wait 2-3 minutes for build to complete.

### 5.5 Update Domain in Code

After first deploy, update `public/.well-known/farcaster.json`:

```json
{
  "accountAssociation": { /* your existing data */ },
  "frame": {
    "homeUrl": "https://YOUR-ACTUAL-NETLIFY-URL.netlify.app",
    "imageUrl": "https://YOUR-ACTUAL-NETLIFY-URL.netlify.app/troll-banner.png",
    // ...
  }
}
```

And update `src/app/page.tsx`:

```typescript
const appUrl = process.env.NEXT_PUBLIC_URL || "https://YOUR-ACTUAL-NETLIFY-URL.netlify.app";
```

Commit and push:

```bash
git add .
git commit -m "Update URLs with production Netlify domain"
git push
```

Netlify will auto-deploy the update.

## Step 6: Register on Warpcast

### 6.1 Verify Manifest

Visit: `https://YOUR-NETLIFY-URL.netlify.app/.well-known/farcaster.json`

Ensure it returns valid JSON.

### 6.2 Register Frame

1. Open Warpcast mobile app
2. Go to Settings → Developer Settings
3. Add Frame:
   - **URL**: `https://YOUR-NETLIFY-URL.netlify.app`
   - **Domain**: Your Netlify URL
4. Submit for verification

### 6.3 Test in Warpcast

1. Open Warpcast Playground: https://warpcast.com/~/developers/frames
2. Enter your app URL
3. Click "Preview"
4. Test all flows:
   - Hub loads correctly
   - Can navigate to markets
   - Wallet connection works
   - Token approval works
   - Betting works
   - Loading states display correctly

## Step 7: Production Testing

### 7.1 Functional Tests

- [ ] Hub loads with all market cards
- [ ] Click "Bet Now" navigates to market detail
- [ ] Back button returns to Hub
- [ ] Wallet connects in Warpcast
- [ ] "Approve $DEGEN Token" appears first time
- [ ] Approval transaction completes successfully
- [ ] Bet buttons become enabled after approval
- [ ] Can place YES bet with signature
- [ ] Can place NO bet with signature
- [ ] Loading states show during transactions
- [ ] Success toast appears after confirmation
- [ ] User balance updates after bet
- [ ] Market pools update in real-time
- [ ] Odds recalculate correctly

### 7.2 Edge Cases

- [ ] Betting with insufficient balance
- [ ] Betting after market closes
- [ ] Claiming without winning
- [ ] Network errors display properly
- [ ] Rejected signatures handled gracefully

### 7.3 Performance

- [ ] App loads in < 3 seconds
- [ ] Transactions confirm in < 10 seconds
- [ ] No memory leaks during extended use
- [ ] Smooth animations on mobile

## Troubleshooting

### Contract Deployment Issues

**Error: "Insufficient funds"**
→ Add more ETH to deployer wallet

**Error: "Contract verification failed"**
→ Manually verify on BaseScan using command in Step 1.5

### Frontend Build Errors

**Error: "Module not found"**
→ Run `npm install` again, delete `node_modules` and `.next`

**Error: "pnpm outdated lockfile"**
→ Run `pnpm install` and commit updated `pnpm-lock.yaml`

### Netlify Deployment Issues

**Error: "Build failed"**
→ Check build logs, ensure all dependencies in `package.json`

**Error: "Page not found"**
→ Verify `netlify.toml` has correct publish directory

### Warpcast Issues

**Error: "Invalid manifest"**
→ Validate JSON at `/.well-known/farcaster.json`

**Error: "Account association failed"**
→ Regenerate signature using Warpcast Developer Settings

**Error: "Wallet not connecting"**
→ Ensure using latest Warpcast version

### Transaction Issues

**Error: "Insufficient allowance"**
→ User needs to approve tokens first, show approve button

**Error: "Market does not exist"**
→ Check market ID mapping, ensure market created on contract

**Error: "Betting closed"**
→ Market has ended, update UI to show "Closed" state

## Monitoring

### Check Contract Health

```bash
# Get market count
cast call $CONTRACT_ADDRESS "marketCount()" --rpc-url $BASE_RPC_URL

# Get market info
cast call $CONTRACT_ADDRESS "getMarket(uint256)" 0 --rpc-url $BASE_RPC_URL

# Get total fees
cast call $CONTRACT_ADDRESS "accumulatedFees()" --rpc-url $BASE_RPC_URL
```

### Check Frontend Health

- Monitor Netlify deploy logs
- Check browser console for errors
- Use Warpcast analytics (if available)

### User Monitoring

- Track number of bets placed
- Monitor total volume
- Watch for error reports

## Maintenance

### Regular Updates

```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm update

# Rebuild and test
npm run build
npm run dev

# Push updates
git add .
git commit -m "Update dependencies"
git push
```

### Contract Updates

If you need to update the contract:
1. Deploy new version
2. Update address in `src/hooks/useTrollBet.ts`
3. Update ABI if functions changed
4. Test thoroughly before pushing

### Scaling

As you grow:
- Consider moving to custom domain
- Set up analytics (PostHog, Mixpanel)
- Add error tracking (Sentry)
- Implement caching for market data
- Use GraphQL/subgraph for historical data

---

**Status**: Ready for production deployment

**Next**: Follow this guide step-by-step to deploy TrollBox

**Support**: Check CONTRACT_INTEGRATION.md for technical details
