# TrollBet Smart Contracts 🎲

Solidity smart contracts for TrollBox prediction markets on Base network.

## Overview

TrollBet implements a **Pari-mutuel betting system** for prediction markets using $DEGEN token. The contract allows:

- **Market Creation** (Admin only)
- **Placing Bets** (YES/NO with $DEGEN)
- **Market Resolution** (Admin declares winner)
- **Claiming Winnings** (Winners get proportional share of total pool)
- **Protocol Fee** (1% on all payouts)

## Architecture

```
contracts/
├── src/
│   └── TrollBet.sol        # Main contract
├── script/
│   └── DeployTrollBet.s.sol # Deployment scripts
├── test/
│   └── TrollBet.t.sol      # Foundry tests
├── lib/                     # Dependencies (OpenZeppelin)
└── foundry.toml            # Foundry config
```

## Contract Details

### TrollBet.sol

**Inheritance:**
- `Ownable` - Admin functions restricted to owner
- `ReentrancyGuard` - Protection against reentrancy attacks

**Key Functions:**

| Function | Access | Description |
|----------|--------|-------------|
| `createMarket(question, endTime)` | Owner | Create new prediction market |
| `placeBet(marketId, side, amount)` | Public | Bet $DEGEN on YES or NO |
| `resolveMarket(marketId, winningSide)` | Owner | Declare winning side |
| `claimWinnings(marketId)` | Public | Winners claim their payout |
| `withdrawFees()` | Owner | Withdraw accumulated fees |

**View Functions:**

| Function | Description |
|----------|-------------|
| `getMarket(marketId)` | Get market details |
| `getUserBet(marketId, user)` | Get user's bet on market |
| `calculateOdds(marketId, side)` | Current odds (in basis points) |
| `calculatePayout(marketId, side, amount)` | Potential payout |
| `getTotalPool(marketId)` | Total pool size |

### Pari-Mutuel Math

```
Odds = Total Pool / Side Pool

Example:
- YES Pool: 60,000 $DEGEN
- NO Pool: 40,000 $DEGEN
- Total: 100,000 $DEGEN

YES Odds = 100,000 / 60,000 = 1.67x
NO Odds = 100,000 / 40,000 = 2.50x

If you bet 1,000 on YES and YES wins:
Your Share = 1,000 / 60,000 = 1.67%
Gross Payout = 1.67% × 100,000 = 1,670 $DEGEN
Protocol Fee = 1,670 × 1% = 16.7 $DEGEN
Net Payout = 1,653.3 $DEGEN
```

## Setup

### Prerequisites

1. Install Foundry:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

2. Clone and setup:
```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts
```

### Environment Variables

Create `.env` file:
```env
PRIVATE_KEY=your_private_key_here
BASESCAN_API_KEY=your_basescan_api_key
```

## Testing

Run all tests:
```bash
forge test
```

Run with verbosity:
```bash
forge test -vvv
```

Run specific test:
```bash
forge test --match-test test_PlaceBet_Yes -vvv
```

Gas report:
```bash
forge test --gas-report
```

## Deployment

### 1. Deploy Mock DEGEN (Testnet Only)

```bash
source .env
forge script script/DeployTrollBet.s.sol:DeployMockDEGEN \
  --rpc-url base_sepolia \
  --broadcast
```

Save the MockDEGEN address and update `DEGEN_TOKEN_SEPOLIA` in the deploy script.

### 2. Deploy TrollBet

**Base Sepolia (Testnet):**
```bash
forge script script/DeployTrollBet.s.sol:DeployTrollBet \
  --rpc-url base_sepolia \
  --broadcast \
  --verify
```

**Base Mainnet (Production):**
```bash
forge script script/DeployTrollBet.s.sol:DeployTrollBet \
  --rpc-url base \
  --broadcast \
  --verify
```

### 3. Verify Contract (if not auto-verified)

```bash
forge verify-contract \
  --chain-id 84532 \
  --compiler-version v0.8.20 \
  <CONTRACT_ADDRESS> \
  src/TrollBet.sol:TrollBet \
  --constructor-args $(cast abi-encode "constructor(address,address)" <DEGEN_TOKEN> <OWNER>)
```

## Network Addresses

### Base Mainnet (Chain ID: 8453)
| Contract | Address |
|----------|---------|
| $DEGEN Token | `0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed` |
| TrollBet | `TBD` |

### Base Sepolia (Chain ID: 84532)
| Contract | Address |
|----------|---------|
| MockDEGEN | `TBD` |
| TrollBet | `TBD` |

## Integration with Frontend

### 1. Install Dependencies

```bash
npm install viem wagmi
```

### 2. Contract ABI

After compilation, find ABI at:
```
contracts/out/TrollBet.sol/TrollBet.json
```

### 3. Example Usage (wagmi)

```typescript
import { useWriteContract, useReadContract } from 'wagmi';
import { parseEther } from 'viem';

// Place a bet
const { writeContract } = useWriteContract();

const placeBet = async (marketId: number, side: boolean, amount: string) => {
  // First approve DEGEN spending
  await writeContract({
    address: DEGEN_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [TROLLBET_ADDRESS, parseEther(amount)]
  });
  
  // Then place bet
  await writeContract({
    address: TROLLBET_ADDRESS,
    abi: TROLLBET_ABI,
    functionName: 'placeBet',
    args: [marketId, side, parseEther(amount)]
  });
};

// Read market data
const { data: market } = useReadContract({
  address: TROLLBET_ADDRESS,
  abi: TROLLBET_ABI,
  functionName: 'getMarket',
  args: [marketId]
});
```

## Security Considerations

1. **ReentrancyGuard** - All state-changing functions protected
2. **SafeERC20** - Safe token transfers
3. **Access Control** - Admin functions restricted to owner
4. **Input Validation** - All inputs validated
5. **Integer Overflow** - Solidity 0.8.x built-in protection

### Audit Status

⚠️ **NOT AUDITED** - This contract has not been professionally audited. Use at your own risk on testnet only until audited.

## Testing Checklist

- [x] Market creation
- [x] Betting (YES/NO)
- [x] Multiple bets per user
- [x] Market resolution
- [x] Claiming winnings (single winner)
- [x] Claiming winnings (multiple winners)
- [x] Fee calculation (1%)
- [x] Fee withdrawal
- [x] Access control
- [x] Edge cases (betting after deadline, double claim, etc.)

## Gas Optimization

| Function | Estimated Gas |
|----------|---------------|
| `createMarket` | ~100,000 |
| `placeBet` | ~80,000 |
| `resolveMarket` | ~50,000 |
| `claimWinnings` | ~70,000 |

## License

MIT

## Support

For issues or questions, open a GitHub issue or reach out on Farcaster.
