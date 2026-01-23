# Market Resolution Guide

## 🎯 Overview

Markets need to be **manually resolved** after their `endTime` by calling the `resolveMarket` function on the smart contract. This determines the winning side (YES or NO) and allows winners to claim their payouts.

## 📋 Resolution Process

### Step 1: Wait for Market to End
- Check that `block.timestamp >= market.endTime`
- Contract will revert with `MarketStillActive()` if you try to resolve early

### Step 2: Determine the Winning Side
- Research the market question and determine the correct outcome
- **YES = true**
- **NO = false**

### Step 3: Call `resolveMarket`
```solidity
function resolveMarket(uint256 marketId, bool winningSide) external onlyOwner
```

## 🛠️ Resolution Methods

### Method 1: Remix IDE (Manual, Recommended for Testing)

1. Go to [Remix IDE](https://remix.ethereum.org/)
2. Load `TrollBetETH.sol` contract
3. Connect to **Injected Provider** (MetaMask)
4. Switch to **Base Sepolia** network
5. Load contract at: `0xc629e67E221db99CF2A6e0468907bBcFb7D5f5A3`
6. Call `resolveMarket`:
   - `marketId`: Enter market ID (e.g., `19`)
   - `winningSide`: Enter `true` for YES, `false` for NO
7. Confirm transaction in MetaMask
8. Wait for confirmation

### Method 2: Script (Automated, for Production)

Create `scripts/resolve-market.mjs`:

```javascript
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { config } from 'dotenv';

config();

const TROLLBET_ADDRESS = '0xc629e67E221db99CF2A6e0468907bBcFb7D5f5A3';
const ABI = [
  {
    type: 'function',
    name: 'resolveMarket',
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'winningSide', type: 'bool' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  }
];

async function resolveMarket(marketId, winningSide) {
  const account = privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY);
  const client = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http()
  });

  console.log(`Resolving market ${marketId} with ${winningSide ? 'YES' : 'NO'}...`);

  const hash = await client.writeContract({
    address: TROLLBET_ADDRESS,
    abi: ABI,
    functionName: 'resolveMarket',
    args: [BigInt(marketId), winningSide]
  });

  console.log(`✅ Transaction sent: ${hash}`);
  console.log(`🔗 View: https://sepolia.basescan.org/tx/${hash}`);
}

// Usage: node scripts/resolve-market.mjs 19 true
const marketId = parseInt(process.argv[2]);
const winningSide = process.argv[3] === 'true';

resolveMarket(marketId, winningSide);
```

Run:
```bash
node scripts/resolve-market.mjs 19 true  # Resolve market 19 as YES
node scripts/resolve-market.mjs 20 false # Resolve market 20 as NO
```

## 🤖 Automated Resolution (Future)

For production, you'll need an automated oracle system:

### Option 1: Chainlink Automation
- Use Chainlink Keepers to check `endTime`
- Trigger resolution automatically
- Requires Chainlink integration in contract

### Option 2: Custom Backend Cron Job
```javascript
// Pseudocode
setInterval(async () => {
  const markets = await getActiveMarkets();
  
  for (const market of markets) {
    if (Date.now() > market.endTime && !market.resolved) {
      const result = await fetchOracleData(market.question);
      await resolveMarket(market.id, result);
    }
  }
}, 60000); // Check every minute
```

### Option 3: Decentralized Oracle (UMA Protocol)
- Use UMA's Optimistic Oracle
- Community votes on outcomes
- Dispute resolution mechanism

## 📊 Test Markets (10 minutes)

Current test markets (IDs 19-23) need to be resolved after **13:16 UTC**:

| ID | Question | Suggested Resolution |
|----|----------|---------------------|
| 19 | 🎲 Will BTC price end with digit 7 in next 10min? | Check BTC price at 13:16 UTC |
| 20 | ⚡ Will ETH gas be above 20 gwei in 10min? | Check Etherscan gas tracker |
| 21 | 🐋 Will any whale move >500 ETH in next 10min? | Check Etherscan large transfers |
| 22 | 📈 Will BTC/ETH ratio increase in next 10min? | Compare ratio at start vs 13:16 |
| 23 | 🎯 Will Base have >100 txs in next 10min? | Check BaseScan transaction count |

### Quick Resolution Commands:
```bash
# After checking actual outcomes
node scripts/resolve-market.mjs 19 true   # If BTC ends with 7
node scripts/resolve-market.mjs 20 false  # If gas is below 20 gwei
node scripts/resolve-market.mjs 21 false  # If no whale moves
node scripts/resolve-market.mjs 22 true   # If ratio increased
node scripts/resolve-market.mjs 23 true   # If >100 txs on Base
```

## ⚠️ Important Notes

1. **Only Owner Can Resolve**: The deployer address must call `resolveMarket`
2. **Cannot Resolve Early**: Contract enforces `endTime` check
3. **Cannot Resolve Twice**: Once resolved, cannot change outcome
4. **Verify Outcome**: Double-check the correct answer before resolving
5. **Gas Costs**: Each resolution costs ~50k gas (~$0.01 on Base)

## 🔍 Verification

After resolution, verify in the app:
1. Market shows "ENDED" status
2. Winning side is displayed (YES/NO)
3. Winners see "🎉 You Won!" with amount
4. "Claim Winnings" button appears for winners
5. Losers see "😔 Lost this one"

## 📝 Resolution Checklist

- [ ] Market has ended (`endTime` passed)
- [ ] Verified correct outcome from reliable source
- [ ] Connected to correct network (Base Sepolia/Mainnet)
- [ ] Using owner wallet
- [ ] Called `resolveMarket(marketId, winningSide)`
- [ ] Transaction confirmed
- [ ] Verified in app UI
- [ ] Winners can claim payouts

## 🚀 Next Steps

1. **Test Resolution**: Resolve 10-minute test markets
2. **Test Claims**: Have users claim winnings
3. **Verify Payouts**: Check correct amounts received
4. **Build Automation**: Implement cron job or oracle
5. **Deploy to Mainnet**: Once testing is complete

---

**Last Updated**: 2026-01-23
**Contract**: `0xc629e67E221db99CF2A6e0468907bBcFb7D5f5A3` (Base Sepolia)
