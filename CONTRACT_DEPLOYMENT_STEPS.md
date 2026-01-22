# 🚀 Quick Contract Deployment Steps

Follow these steps to deploy your TrollBet contract and integrate it with the frontend.

## Step 1: Prepare Environment

```bash
cd contracts
cp env.example .env
```

Edit `.env` with your details:
```bash
PRIVATE_KEY=0x...                                                    # Your wallet private key
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR-API-KEY    # Base RPC
BASESCAN_API_KEY=...                                                 # For verification
DEGEN_TOKEN_ADDRESS=0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed     # $DEGEN on Base
OWNER_ADDRESS=0x...                                                  # Your address
```

## Step 2: Deploy TrollBet Contract

```bash
# Make sure you're in contracts directory
cd contracts

# Compile
forge build

# Test
forge test

# Deploy to Base
forge script script/DeployTrollBet.s.sol \
  --rpc-url $BASE_RPC_URL \
  --broadcast \
  --verify \
  -vvvv
```

**Save the contract address from the output!**

Example output:
```
TrollBet deployed at: 0x1234567890abcdef1234567890abcdef12345678
```

## Step 3: Create Markets

Set the contract address:
```bash
export TROLLBET_ADDRESS=0xYOUR_CONTRACT_ADDRESS_FROM_STEP_2
```

Run the create markets script:
```bash
forge script script/CreateMarkets.s.sol \
  --rpc-url $BASE_RPC_URL \
  --broadcast \
  -vvvv
```

**Note the market IDs from the output!**

Example output:
```
Created Market 1 (Peter Schiff) with ID: 0
Created Market 2 (Degen Price) with ID: 1
Created Market 3 (Elon Pepe) with ID: 2
...
```

## Step 4: Update Frontend

### 4.1 Update Contract Address

Edit `src/hooks/useTrollBet.ts`:

```typescript
export const TROLLBET_CONTRACT_ADDRESS: Address = '0xYOUR_CONTRACT_ADDRESS';
```

### 4.2 Update Market IDs

Edit `src/lib/mockMarkets.ts` and update the `contractMarketId` for each market:

```typescript
export const MOCK_MARKETS: Market[] = [
  {
    id: 'peter-schiff-btc',
    contractMarketId: 0, // ← Update this
    question: 'Will Peter Schiff tweet negatively about Bitcoin in the next 24 hours?',
    // ...
  },
  {
    id: 'degen-price',
    contractMarketId: 1, // ← Update this
    question: 'Will $DEGEN hit $0.10 this week?',
    // ...
  },
  // ... update all markets you created on the contract
];
```

**Important**: Only update the markets you actually created in Step 3. Leave others as `undefined` or remove them.

## Step 5: Test Locally

```bash
# Install dependencies (if not done)
npm install

# Run dev server
npm run dev
```

Open http://localhost:3000 and verify:
- Hub page loads
- Market cards display
- Can navigate to market details
- No console errors

## Step 6: Deploy to Netlify

### 6.1 Commit Changes

```bash
git add .
git commit -m "Add TrollBet contract integration - deployed to Base"
git push origin main
```

### 6.2 Netlify Auto-Deploy

Netlify will automatically detect the push and start deploying.

Wait 2-3 minutes and check your Netlify URL:
```
https://farcaster-trollbox.netlify.app
```

## Step 7: Test in Warpcast

### 7.1 Open Warpcast Playground

Go to: https://warpcast.com/~/developers/frames

Enter your Netlify URL and click "Preview"

### 7.2 Test Complete Flow

1. **Hub loads** → ✅ See all markets
2. **Click "Bet Now"** → ✅ Opens market detail
3. **Connect Wallet** → ✅ Warpcast wallet connects
4. **Approve Token** → ✅ Click "Approve $DEGEN Token"
5. **Sign in Warpcast** → ✅ Approve signature prompt
6. **Wait for confirmation** → ✅ Loading state, then success toast
7. **Place Bet** → ✅ Click YES or NO
8. **Sign transaction** → ✅ Confirm in Warpcast
9. **Transaction confirms** → ✅ Success toast appears
10. **Check balance** → ✅ Your balance section updates

## Troubleshooting

### Contract not deploying
- Check you have enough ETH for gas (~0.01 ETH)
- Verify RPC URL is correct
- Try adding `--legacy` flag if using older Base RPC

### Markets not creating
- Ensure `TROLLBET_ADDRESS` is set correctly
- Check deployer has ownership of contract
- Verify endTime is in the future

### Frontend not connecting to contract
- Double-check contract address in `useTrollBet.ts`
- Verify network is Base (chain ID 8453)
- Check market IDs match between contract and frontend

### Transactions failing in Warpcast
- Ensure user has $DEGEN tokens
- Check market hasn't ended
- Verify contract isn't paused
- Try smaller bet amount first

## Verification Checklist

After deployment, verify:

- [ ] Contract verified on BaseScan: https://basescan.org/address/YOUR_ADDRESS
- [ ] Markets visible on contract (call `marketCount()`)
- [ ] Frontend loads on Netlify
- [ ] Manifest valid: `https://your-url.netlify.app/.well-known/farcaster.json`
- [ ] Warpcast preview shows correct data
- [ ] Wallet connects in Warpcast
- [ ] Token approval works
- [ ] Betting works
- [ ] Transactions confirm on Base
- [ ] User balance updates

## Next Steps

Once everything works:

1. **Announce on Farcaster** 🎉
   ```
   Just launched TrollBox - prediction markets for crypto degens! 🎲
   
   Bet on whether Peter Schiff will FUD Bitcoin today, if $DEGEN hits $0.10, and more!
   
   Built on @base with $DEGEN
   
   [Your Netlify URL]
   ```

2. **Monitor Markets**
   - Watch for bets coming in
   - Resolve markets when they end
   - Collect fees

3. **Add More Markets**
   - Use CreateMarkets.s.sol script
   - Update frontend with new IDs
   - Push to GitHub

4. **Iterate & Improve**
   - Add user analytics
   - Implement leaderboards (from chain data)
   - Add historical market data
   - Build subgraph for queries

## Support

- **Contract Issues**: Check `contracts/test/TrollBet.t.sol` for examples
- **Frontend Issues**: See `TESTING_GUIDE.md`
- **Integration Issues**: See `CONTRACT_INTEGRATION.md`
- **Deployment Issues**: See `DEPLOYMENT.md`

## Cost Estimate

Deploying to Base:
- Contract deployment: ~$5-10 (depending on gas)
- Creating 6 markets: ~$2-5
- **Total**: ~$7-15

Frontend hosting:
- Netlify: **Free** (unless you go over limits)

**Total launch cost: ~$10-15**

---

**Ready?** Start with Step 1 and go through each step carefully!

**Questions?** All documentation is in the repo - check the relevant .md files.

Good luck! 🚀
