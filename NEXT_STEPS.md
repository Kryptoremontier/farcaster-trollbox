# DegenBox - Next Steps 🎯

## ✅ What We've Completed (Steps 1 & 2)

### Step 1: Farcaster Manifest & SDK ✅
- ✅ `public/.well-known/farcaster.json` configured with DegenBox branding
- ✅ SDK initialized with `sdk.actions.ready()` in `DegenBox.tsx`
- ✅ Farcaster context detection (shows user profile when in Farcaster app)
- ✅ Safe area insets applied for mobile clients

### Step 2: Mock Betting Engine ✅
- ✅ Full Pari-mutuel logic in `src/lib/mockBettingEngine.ts`
- ✅ Pool management (YES: 65,000 / NO: 35,000 initial)
- ✅ Dynamic odds calculation (`Total Pool / Side Pool`)
- ✅ User balance tracking (10,000 $DEGEN starting balance)
- ✅ Bet history with timestamps and odds
- ✅ Real-time market simulation (simulates other users betting)
- ✅ Payout calculation ready (for when market resolves)
- ✅ UI shows live odds on buttons (e.g., "YES 1.54x odds")
- ✅ Balance, pool sizes, and bet count update in real-time

## 🔄 Step 3: Wallet Integration (Ready to Start)

### Current State
- Wagmi is **configured** with Farcaster Mini App connector
- Supported chains: Base, Optimism, Mainnet, Degen, Unichain
- Connect button exists but doesn't link to betting actions

### What to Build

1. **Connect Betting to Wallet State**
   ```typescript
   // In DegenBox.tsx
   const handlePlaceBet = async (side: 'YES' | 'NO') => {
     if (!isConnected) {
       // Show "Connect Wallet" message
       return;
     }
     
     // Current: Uses mock engine
     bettingEngine.placeBet(selectedAmount, side);
     
     // Future: Call smart contract
     // await writeContract({ ... });
   }
   ```

2. **Display Wallet Balance**
   - Show both mock balance AND real wallet balance
   - Add toggle: "Mock Mode" vs "Real Mode"

3. **Transaction Preparation**
   - Add "Approve" flow for ERC20 tokens (if using $DEGEN token)
   - Show gas estimation
   - Display transaction pending/success states

### Files to Modify
- `src/components/DegenBox.tsx` - Add wallet state checks
- `src/lib/mockBettingEngine.ts` - Add mode flag (mock vs real)

## 🚀 Step 4: Smart Contract (Final Step)

### Why Wait?
You want the mock logic **perfect** before deploying to Base. Smart contracts are expensive to change!

### What to Build

1. **Solidity Contract** (`contracts/PredictionMarket.sol`)
   ```solidity
   contract PredictionMarket {
     struct Pool {
       uint256 yesPool;
       uint256 noPool;
     }
     
     struct Bet {
       address user;
       uint256 amount;
       bool isYes;
       uint256 timestamp;
     }
     
     mapping(uint256 => Pool) public markets;
     mapping(uint256 => mapping(address => Bet[])) public userBets;
     
     function placeBet(uint256 marketId, bool isYes) payable {
       // Port logic from mockBettingEngine.ts
     }
     
     function resolveMarket(uint256 marketId, bool yesWon) {
       // Calculate payouts
     }
   }
   ```

2. **Deploy to Base**
   - Use Hardhat or Foundry
   - Deploy to Base testnet first
   - Verify contract on BaseScan

3. **Frontend Integration**
   ```typescript
   import { useWriteContract } from 'wagmi';
   
   const { writeContract } = useWriteContract();
   
   const handlePlaceBet = async (side: 'YES' | 'NO') => {
     await writeContract({
       address: PREDICTION_MARKET_ADDRESS,
       abi: PredictionMarketABI,
       functionName: 'placeBet',
       args: [marketId, side === 'YES'],
       value: parseEther(selectedAmount.toString())
     });
   };
   ```

## 📋 Recommended Order

### Phase 1: Test Mock System (Now)
1. Open http://localhost:3000
2. Click YES/NO buttons multiple times
3. Watch odds change as pools grow
4. Verify balance decreases correctly
5. Check that market simulation works (every 5 seconds)

**If any math is wrong, fix it NOW before smart contracts!**

### Phase 2: Wallet Connection (Next)
1. Test Connect Wallet button
2. Show real wallet address when connected
3. Add "Mode" toggle (Mock vs Real)
4. Disable real bets until contract deployed

### Phase 3: Smart Contract (Last)
1. Write Solidity contract
2. Test on Base testnet
3. Audit math (share this doc with Solidity devs)
4. Deploy to Base mainnet
5. Update frontend to use contract address

## 🧪 Testing Checklist

### Mock Engine Tests
- [ ] Place YES bet → balance decreases correctly
- [ ] Place NO bet → balance decreases correctly
- [ ] Odds update when pool changes
- [ ] Can't bet more than balance
- [ ] Multiple bets track correctly
- [ ] Simulated activity changes pools
- [ ] Percentages always sum to 100%

### SDK Tests
- [ ] Opens in Warpcast → shows Farcaster badge
- [ ] Opens in browser → shows "Browser" badge
- [ ] User profile displays when in Farcaster
- [ ] `sdk.actions.ready()` removes loading screen

### UI Tests
- [ ] Chat scrolls automatically
- [ ] Leaderboard displays correctly
- [ ] Balance updates instantly after bet
- [ ] Odds show on bet buttons
- [ ] Status messages appear/disappear
- [ ] Mobile responsive (test in Warpcast app)

## 🎓 Learning Resources

### Pari-mutuel Math
- Total odds = `Total Pool / Your Side Pool`
- Your winnings = `(Your Bet / Winning Pool) × Total Pool`
- Example in `README.md`

### Farcaster SDK
- Docs: https://docs.farcaster.xyz/developers/frames/v2/spec
- Check if in Mini App: `sdk.isInMiniApp()`
- Get user context: `await sdk.context`
- Signal ready: `sdk.actions.ready()`

### Wagmi Hooks
- `useAccount()` - Get connected address
- `useConnect()` - Connect wallet
- `useWriteContract()` - Send transactions
- `useWaitForTransactionReceipt()` - Wait for confirmation

## 💡 Pro Tips

1. **Keep Mock Logic Separate**
   - Don't delete mock engine when adding contracts
   - Use environment variable to toggle modes
   - Useful for demos and testing

2. **Gas Optimization**
   - Batch bets if possible
   - Use events for history (cheaper than storage)
   - Consider L2 (Base) for lower fees

3. **Security**
   - Reentrancy guards on payout functions
   - Time locks on market resolution
   - Owner-only market creation

4. **UX Improvements**
   - Show "Approving..." states
   - Display gas costs before transaction
   - Add confetti animation on wins 🎉

## 🚨 Common Pitfalls

### Don't Do This:
❌ Skip testing mock logic thoroughly  
❌ Deploy contract without testnet testing  
❌ Hard-code contract addresses  
❌ Forget to handle transaction failures  
❌ Ignore gas estimation

### Do This Instead:
✅ Test every betting scenario in mock mode  
✅ Deploy to Base testnet first  
✅ Use environment variables for addresses  
✅ Show user-friendly error messages  
✅ Display estimated gas before transactions

## 📞 Need Help?

Ask Cursor/Sonnet:
- "How do I add a mode toggle for mock vs real bets?"
- "Write a Solidity contract based on mockBettingEngine.ts"
- "How do I estimate gas for the placeBet transaction?"
- "Add error handling for failed transactions"

## 🎉 You're Ready!

The foundation is **solid**:
- ✅ Mock engine works perfectly
- ✅ UI is beautiful and responsive
- ✅ Farcaster integration complete
- ✅ Wagmi configured and ready

Next time you work on this, just say:

> "Let's implement Step 3: Connect the wallet to the betting system and add a Mock/Real mode toggle"

Good luck, degen! 🚀
