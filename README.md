# TrollBox - Farcaster Prediction Market Hub 🎲

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/farcaster-trollbox)

A complete Farcaster Mini App (Frame v2) featuring a prediction market with real-time betting, live chat (TrollBox), and leaderboards.

## 🎯 What is TrollBox?

TrollBox is a **multi-market prediction platform** built specifically for Farcaster. Browse through 12+ troll-themed prediction markets (from "Will Peter Schiff tweet about Bitcoin?" to "Will Elon post a Pepe?") and bet using a **Pari-mutuel betting system** where odds dynamically adjust based on pool sizes.

### Architecture

- **Hub (Market Grid)**: Browse all available prediction markets
- **Detail View**: Deep-dive into specific market with live betting, chat, and leaderboard

### Features

#### Hub (TrollBoxHub)
- ✅ **Market Grid** - Responsive grid of 12+ prediction markets
- ✅ **Search & Filter** - Real-time search by question/description
- ✅ **Category Filters** - Filter by crypto, tech, memes, politics, sports
- ✅ **Market Cards** - Live stats (time, pool size, YES/NO %, bettors)
- ✅ **Troll Thumbnails** - Emoji-based market icons (ready for images)

#### Market Detail (DegenBox)
- ✅ **Smart Contract Integration** - Real TrollBet.sol contract on Base
- ✅ **Token Approval Flow** - Approve $DEGEN before betting
- ✅ **On-Chain Betting** - Place bets via Wagmi hooks
- ✅ **Real-time Odds** - Dynamically calculated from blockchain pools
- ✅ **Transaction Status** - Loading states and success/error toasts
- ✅ **Claim Winnings** - Withdraw payouts after market resolution
- ✅ **Live TrollBox Chat** - Real-time messaging with bet indicators
- ✅ **Leaderboard** - Top performers by wins, accuracy, and earnings
- ✅ **Back Navigation** - Return to Hub to explore other markets

#### Platform
- ✅ **Farcaster SDK Integration** - Detects Farcaster context and displays user info
- ✅ **Wagmi Wallet Support** - Ready for Web3 wallet connections (Base, Optimism, Mainnet, Degen, Unichain)
- ✅ **Responsive UI** - Built with Tailwind CSS and shadcn/ui components
- ✅ **Professional Design** - Purple gradient (#9E75FF) branding throughout

## 🚀 Quick Start - Deploy Your Own TrollBox

### **→ [Follow CONTRACT_DEPLOYMENT_STEPS.md](./CONTRACT_DEPLOYMENT_STEPS.md) for step-by-step deployment guide**

Or see detailed documentation:
- 📘 **[CONTRACT_INTEGRATION.md](./CONTRACT_INTEGRATION.md)** - How the smart contract works
- 🧪 **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Test locally and in Warpcast
- 🚀 **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete production deployment guide

## 🎯 Current Implementation Status

### ✅ Completed

#### 1. Smart Contract Integration
- **Contract**: `TrollBet.sol` - Full pari-mutuel betting system
- **ABI**: Extracted and saved in `src/lib/abi/TrollBet.json`
- **Hooks**: Custom Wagmi hooks in `src/hooks/useTrollBet.ts`
- **Transactions**: Place bets, claim winnings, approve tokens
- **Read Operations**: Get market data, user bets, calculate payouts

#### 2. Farcaster Manifest & SDK Integration
- **Manifest**: `public/.well-known/farcaster.json` configured as "TrollBox"
- **SDK**: `@farcaster/frame-sdk` initialized in both Hub and Detail views
- **Context Detection**: App detects if running in Farcaster client
- **User Info**: Displays Farcaster user profile (username, avatar, FID)

#### 2. Hub/Detail Architecture
- **TrollBoxHub** (`src/components/TrollBoxHub.tsx`): Market grid with search/filter
- **DegenBox** (`src/components/DegenBox.tsx`): Market detail with betting
- **State Routing** (`src/app/app.tsx`): Switch between Hub and Detail
- **Back Navigation**: Arrow button to return to Hub

#### 3. Mock Markets Data (`src/lib/mockMarkets.ts`)
- **12 Markets**: Troll-themed predictions (crypto, tech, memes, politics, sports)
- **Helper Functions**: Time remaining, odds calculation, formatting
- **Dynamic Loading**: Markets load data from central array

#### 4. Market Card Component (`src/components/MarketCard.tsx`)
- **Thumbnail Display**: Emoji-based (ready for image replacement)
- **Live Stats**: Time, bettors, pool size, YES/NO percentages
- **Category Badges**: Color-coded by market type
- **Hover Effects**: Purple glow and thumbnail animation

#### 5. Mock Betting Logic (`src/lib/mockBettingEngine.ts`)
Complete Pari-mutuel betting system in TypeScript:

**Core Features:**
- ✅ Pool management (YES/NO pools with initial liquidity)
- ✅ Dynamic odds calculation (Total Pool / Side Pool)
- ✅ Real-time percentage updates
- ✅ User balance tracking (starts with 10,000 $DEGEN)
- ✅ Bet history with timestamps and odds
- ✅ Market simulation (other users betting every 5 seconds)
- ✅ Payout calculation (when market resolves)

**Example Flow:**
```typescript
const engine = getBettingEngine();

// User places bet
const result = engine.placeBet(1000, 'YES');
// Updates pools, deducts balance, stores bet

// Real-time odds
const yesOdds = engine.calculateOdds('YES'); // e.g., 1.54x
const noOdds = engine.calculateOdds('NO');   // e.g., 2.86x

// Market resolves
engine.resolveMarket('YES');
// Calculates winnings based on user's share of winning pool
```

### 🔄 Next Steps (Steps 3 & 4)

#### 3. Wallet Integration (In Progress)
- Wagmi configured with Farcaster Mini App connector
- Supports: Base, Optimism, Mainnet, Degen, Unichain
- **TODO**: Connect wallet state to betting actions

#### 4. Smart Contract (Future)
- Port mock logic to Solidity
- Deploy on Base network
- Replace mock engine with contract calls

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Farcaster**: `@farcaster/frame-sdk` for Mini App integration
- **Wallets**: Wagmi + Viem (Ethereum) + Solana wallet adapters
- **State Management**: React hooks + Mock Betting Engine singleton
- **Icons**: Lucide React
- **Deployment**: Netlify (configured with `netlify.toml`)

## 📦 Installation

```bash
# Install dependencies
npm install --legacy-peer-deps

# Run development server
npm run dev

# Build for production
npm run build
```

## 🧪 Testing TrollBox

### Testing the Hub (http://localhost:3000)

1. **Browse Markets**: See grid of 12 prediction markets
2. **Search**: Type "Bitcoin" to filter markets
3. **Filter by Category**: Click "crypto" pill to see only crypto markets
4. **Market Cards**: Each shows:
   - Thumbnail emoji (e.g., 🧓💬)
   - Question and description
   - Time remaining
   - Total bettors
   - Pool size in $DEGEN
   - YES/NO percentage bars
5. **Click "Bet Now"**: Navigate to market detail

### Testing Market Detail

1. **Click any market card** from Hub
2. **See Market Info**:
   - Back arrow (top left) to return to Hub
   - Market question and description
   - Category badge
   - Live stats

3. **Place Bets**:
   - User starts with 10,000 $DEGEN
   - Select amount (100, 500, 1K, 5K)
   - Click YES or NO
   - See odds on buttons (e.g., "1.54x odds")
   - Balance updates instantly
   - Bet appears in chat

4. **Watch Market Activity**:
   - Other "users" bet every 5 seconds
   - Pools fluctuate
   - Odds recalculate automatically

5. **Return to Hub**:
   - Click back arrow
   - Explore and bet on other markets

## 🎮 How Pari-Mutuel Betting Works

Unlike traditional betting with fixed odds, **pari-mutuel** creates a prize pool where:

1. All bets go into shared pools (YES pool + NO pool)
2. Odds = `Total Pool / Your Side's Pool`
3. When market resolves, winners split the entire pool proportionally

**Example:**
```
YES Pool: 65,000 $DEGEN
NO Pool: 35,000 $DEGEN
Total: 100,000 $DEGEN

YES Odds: 100,000 / 65,000 = 1.54x
NO Odds: 100,000 / 35,000 = 2.86x

If you bet 1,000 on YES and YES wins:
Your share of YES pool: 1,000 / 65,000 = 1.54%
Your winnings: 1.54% × 100,000 = 1,540 $DEGEN
```

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main entry (metadata + dynamic import)
│   ├── app.tsx               # ⭐ Router (Hub ↔ Detail)
│   ├── layout.tsx            # Root layout with Providers
│   ├── providers.tsx         # Wagmi + Solana providers
│   └── api/                  # API routes (webhooks, notifications)
├── components/
│   ├── TrollBoxHub.tsx       # ⭐ Market grid (Hub)
│   ├── MarketCard.tsx        # ⭐ Individual market card
│   ├── DegenBox.tsx          # ⭐ Market detail (betting UI)
│   ├── ui/                   # shadcn/ui components
│   └── providers/            # Wagmi & Solana configs
└── lib/
    ├── mockMarkets.ts        # ⭐ 12 markets + helpers
    ├── mockBettingEngine.ts  # ⭐ Pari-mutuel logic
    ├── utils.ts              # Tailwind cn() helper
    └── truncateAddress.ts    # Address formatting
```

## 🔑 Key Files

### `src/lib/mockBettingEngine.ts`
The heart of the betting system:
- `MockBettingEngine` class with subscribe/notify pattern
- `calculateOdds()` - Real-time odds from pool ratios
- `placeBet()` - Validates and executes bets
- `simulateMarketActivity()` - Adds random bets for realism
- `resolveMarket()` - Calculates payouts

### `src/components/DegenBox.tsx`
Main UI component:
- Subscribes to betting engine updates
- Shows live odds on bet buttons
- Displays user balance and stats
- Integrates Farcaster SDK context

### `public/.well-known/farcaster.json`
Farcaster Mini App manifest:
```json
{
  "frame": {
    "version": "1",
    "name": "DegenBox",
    "iconUrl": "https://your-url/icon.png",
    "splashImageUrl": "https://your-url/splash.png",
    "homeUrl": "https://your-url"
  }
}
```

## 🚢 Deployment

### Netlify (Recommended)

1. Push to GitHub
2. Connect repo to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `.next`
5. Deploy!

The `netlify.toml` is already configured:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[redirects]]
  from = "/.well-known/farcaster.json"
  to = "/.well-known/farcaster.json"
  status = 200
```

### Testing in Farcaster

1. Deploy to production URL
2. Update `farcaster.json` with your domain
3. Open in Warpcast mobile app
4. Share frame link or add to your profile

## 🧠 Understanding the Code

### Betting Flow
```typescript
// 1. User clicks YES button
handlePlaceBet('YES')

// 2. Engine validates and processes
const result = bettingEngine.placeBet(selectedAmount, 'YES')

// 3. State updates trigger UI refresh
setEngineState(newState)

// 4. Odds recalculate automatically
const newOdds = bettingEngine.calculateOdds('YES')

// 5. UI shows updated balance, pools, and odds
```

### Reactive Updates
```typescript
// Subscribe to engine changes
  useEffect(() => {
  const unsubscribe = bettingEngine.subscribe((newState) => {
    setEngineState(newState); // Triggers re-render
  });
  return () => unsubscribe();
}, [bettingEngine]);
```

## 🔐 Environment Variables

Optional (for production features):

```env
# Upstash Redis (for persistent storage)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# App URL (for metadata)
NEXT_PUBLIC_URL=https://your-app.netlify.app
```

## 🐛 Troubleshooting

### "Module not found: button.tsx"
- Windows case-sensitivity issue
- Solution: Use `button-component.tsx` (already configured)

### "SDK not loading"
- Check if `sdk.actions.ready()` is called
- Verify `farcaster.json` is accessible at `/.well-known/farcaster.json`

### "Odds not updating"
- Ensure betting engine subscription is active
- Check browser console for errors

## 📚 Resources

- [Farcaster Frames v2 Docs](https://docs.farcaster.xyz/developers/frames/v2/spec)
- [Farcaster SDK](https://github.com/farcasterxyz/fc-frame-sdk)
- [Wagmi Documentation](https://wagmi.sh/)
- [shadcn/ui Components](https://ui.shadcn.com/)

## 📄 License

MIT

---

**Built with ❤️ for the Farcaster community**

Questions? Open an issue or reach out on Farcaster!
