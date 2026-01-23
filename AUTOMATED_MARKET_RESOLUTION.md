# Automated Market Resolution Guide

## 🤖 Auto-Resolve System

Your TrollBox app now has **fully automated market resolution** using Vercel Cron Jobs!

---

## 🎯 How It Works

### The Bot Workflow

```
Every 10 minutes:
  ↓
1. Vercel Cron triggers /api/cron/resolve-markets
  ↓
2. Bot checks all markets in contract
  ↓
3. For each ENDED + UNRESOLVED market:
   ├─ Analyzes question pattern
   ├─ Fetches data from oracles (CoinGecko, Etherscan, etc.)
   ├─ Determines result (YES/NO)
   └─ Sends resolveMarket() transaction
  ↓
4. Returns summary: resolved, skipped, failed
```

---

## 📊 Supported Market Types

### ✅ **Fully Automated** (No manual intervention needed)

| Type | Example | Oracle |
|------|---------|--------|
| **Crypto Price Digit** | "Will BTC price end with digit 7?" | CoinGecko API |
| **ETH Gas Price** | "Will ETH gas be above 20 gwei?" | Etherscan API |

### ⚠️ **Partially Automated** (Defaults to safe answer)

| Type | Example | Current Logic | Future |
|------|---------|---------------|--------|
| **Whale Movements** | "Will any whale move >500 ETH?" | Defaults to NO | Etherscan Whale Tracker |
| **BTC/ETH Ratio** | "Will BTC/ETH ratio increase?" | Defaults to NO | Historical price comparison |
| **Base Activity** | "Will Base have >100 txs?" | Defaults to YES | BaseScan API |

### ❌ **Manual Only** (Needs human judgment)

| Type | Example | Why |
|------|---------|-----|
| **Subjective** | "Is this meme funny?" | No objective data |
| **Complex Events** | "Will Trump mention crypto?" | Requires NLP/AI |
| **Social Media** | "Will Elon tweet about X?" | Twitter API + context |

---

## 🔧 Setup Instructions

### 1. **Environment Variables**

Add these to your Vercel project:

```bash
# Required
DEPLOYER_PRIVATE_KEY=0xyour_bot_wallet_private_key

# Optional (for security)
CRON_SECRET=your_random_secret_string
```

**How to add:**
1. Go to Vercel Dashboard
2. Select your project
3. Settings → Environment Variables
4. Add both variables
5. Redeploy

### 2. **Vercel Cron Configuration**

Already configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/resolve-markets",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

**Schedule Format** (Cron syntax):
- `*/10 * * * *` = Every 10 minutes
- `*/5 * * * *` = Every 5 minutes
- `0 * * * *` = Every hour (at :00)
- `0 */6 * * *` = Every 6 hours

### 3. **Deploy**

```bash
git add -A
git commit -m "Add automated market resolution"
git push
```

Vercel will automatically:
- Deploy the new API route
- Register the Cron Job
- Start running it every 10 minutes

---

## 🧪 Testing

### Manual Test (Before Cron Runs)

```bash
# Local test
curl http://localhost:3000/api/cron/resolve-markets

# Production test (with secret)
curl -H "Authorization: Bearer your_cron_secret" \
  https://your-app.vercel.app/api/cron/resolve-markets
```

**Expected Response:**
```json
{
  "success": true,
  "duration": 2341,
  "stats": {
    "checked": 24,
    "resolved": 2,
    "skipped": 20,
    "failed": 0
  },
  "details": [
    {
      "marketId": 19,
      "question": "🎲 Will BTC price end with digit 7 in next 10min?",
      "result": "NO",
      "txHash": "0x...",
      "status": "resolved"
    }
  ]
}
```

### View Cron Logs

1. Go to Vercel Dashboard
2. Select your project
3. **Deployments** → Click latest deployment
4. **Functions** → Find `/api/cron/resolve-markets`
5. View logs in real-time

---

## 📈 Monitoring

### Vercel Dashboard

**Cron Job Stats:**
- Last run time
- Success/failure rate
- Execution duration
- Error logs

**How to access:**
1. Vercel Dashboard
2. Your project
3. **Settings** → **Cron Jobs**

### Custom Alerts (Optional)

Add to `route.ts`:

```typescript
// Send alert to Telegram/Discord/Email
if (results.failed > 0) {
  await fetch('https://api.telegram.org/bot<TOKEN>/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: 'YOUR_CHAT_ID',
      text: `⚠️ Market resolution failed for ${results.failed} markets!`
    })
  });
}
```

---

## 🔐 Security

### Bot Wallet

**Best Practices:**
1. ✅ Use a **separate wallet** for the bot (not your main wallet)
2. ✅ Fund it with **minimal ETH** (just for gas)
3. ✅ Set bot wallet as contract **owner** (or use `onlyOwner` modifier)
4. ✅ **Never commit** private key to git

**Recommended Setup:**
```
Main Wallet (Your personal):
  ├─ Holds your funds
  └─ Can transfer ownership if needed

Bot Wallet (Automated):
  ├─ Is contract owner
  ├─ Has ~0.01 ETH for gas
  └─ Private key in Vercel env vars
```

### Cron Secret

**Why?**
- Prevents unauthorized calls to your cron endpoint
- Anyone could trigger `/api/cron/resolve-markets` without it

**How to use:**
```typescript
// In route.ts
const authHeader = req.headers.get('authorization');
if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

Vercel automatically adds the secret to cron requests.

---

## 💰 Cost Analysis

### Vercel Cron Jobs

| Plan | Cron Jobs | Cost |
|------|-----------|------|
| **Hobby** | 2 cron jobs | **FREE** |
| **Pro** | Unlimited | $20/month |

### Gas Costs (Base Sepolia)

```
Assumptions:
- 10 markets/day need resolution
- Gas: ~50,000 per resolveMarket()
- Base Sepolia gas price: ~0.001 gwei

Daily cost: 10 * 50,000 * 0.001 gwei = ~0.0005 ETH
Monthly: ~0.015 ETH (~$50 at $3,500/ETH)
```

**Mainnet will be similar** (Base has low fees).

---

## 🚀 Scaling

### Phase 1: Current (Crypto Markets)
- ✅ BTC/ETH price checks
- ✅ Gas price checks
- ✅ Runs every 10 minutes

### Phase 2: Advanced Oracles
Add more data sources:
```typescript
// Chainlink Price Feeds
const btcPrice = await chainlinkPriceFeed.latestAnswer();

// BaseScan API
const txCount = await basescan.getBlockTransactionCount();

// Twitter API (with GPT-4 analysis)
const tweetMentionsCrypto = await analyzeTweet(tweetId);
```

### Phase 3: AI Judge (GPT-4)
For subjective markets:
```typescript
const result = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{
    role: "system",
    content: "You are a prediction market oracle. Analyze if this statement is true."
  }, {
    role: "user",
    content: market.question
  }]
});
```

---

## 🐛 Troubleshooting

### "Bot wallet not configured"
**Cause**: `DEPLOYER_PRIVATE_KEY` missing in Vercel env vars  
**Fix**: Add it in Vercel Dashboard → Settings → Environment Variables

### "Unauthorized"
**Cause**: `CRON_SECRET` mismatch  
**Fix**: Ensure secret matches in Vercel settings and code

### "Insufficient funds"
**Cause**: Bot wallet has no ETH for gas  
**Fix**: Send 0.01 ETH to bot wallet address

### "Market already resolved"
**Cause**: Market was resolved manually or by previous cron run  
**Fix**: This is normal! Bot skips already-resolved markets

### Cron not running
**Cause**: Vercel Hobby plan has 2 cron limit (you might have others)  
**Fix**: 
1. Check Vercel Dashboard → Settings → Cron Jobs
2. Remove unused crons
3. Or upgrade to Pro plan

---

## 📝 Market Creation Best Practices

### For Auto-Resolvable Markets

**✅ Good:**
```
"Will BTC price end with digit 7 in next 10min?"
"Will ETH gas be above 20 gwei in 10min?"
"Will Base have >100 txs in next hour?"
```

**❌ Bad (needs manual):**
```
"Will this meme go viral?"
"Is Elon bullish on crypto?"
"Will the community like this feature?"
```

### Market Metadata (Future Enhancement)

Add `category` field to markets:
```solidity
struct Market {
  string question;
  uint256 endTime;
  string category; // "CRYPTO_PRICE", "GAS", "SOCIAL", "SUBJECTIVE"
  // ...
}
```

Bot can then:
- Auto-resolve `CRYPTO_PRICE` and `GAS`
- Skip `SUBJECTIVE` (send alert to admin)

---

## 🎯 Roadmap

### ✅ Phase 1: Basic Automation (DONE)
- Vercel Cron setup
- CoinGecko + Etherscan oracles
- Auto-resolve crypto markets

### 🔄 Phase 2: Advanced Oracles (Next)
- [ ] Chainlink Price Feeds
- [ ] BaseScan API integration
- [ ] Historical price comparison
- [ ] Whale tracker

### 🚀 Phase 3: AI Integration (Future)
- [ ] GPT-4 for subjective markets
- [ ] Twitter API + NLP
- [ ] Community voting fallback
- [ ] UMA Optimistic Oracle

---

## 📊 Example Cron Run

```
🤖 [CRON] Auto-resolve markets started
   🤖 Bot address: 0xd04DF7710dB3B6448F89752784DA3caC839596a1
   📊 Total markets: 24

   🎯 Market #19 needs resolution:
      Question: "🎲 Will BTC price end with digit 7 in next 10min?"
      Ended: 2026-01-23T14:30:00.000Z
      Pools: 0.0002 YES / 0.0001 NO
      📊 Analyzing: "🎲 Will BTC price end with digit 7 in next 10min?"
      💰 BTC Price: $103,847.23
      🎲 Last digit: 4, Target: 7
      ✅ Result determined: NO
      📤 TX sent: 0x1234...5678
      ✅ Market #19 resolved successfully!

   🎯 Market #20 needs resolution:
      Question: "⚡ Will ETH gas be above 20 gwei in 10min?"
      Ended: 2026-01-23T14:30:00.000Z
      Pools: 0.0001 YES / 0.0002 NO
      📊 Analyzing: "⚡ Will ETH gas be above 20 gwei in 10min?"
      ⛽ Current gas: 15 gwei, Threshold: 20 gwei
      ✅ Result determined: NO
      📤 TX sent: 0xabcd...ef01
      ✅ Market #20 resolved successfully!

✅ [CRON] Auto-resolve completed in 2341ms
   📊 Stats: 2 resolved, 20 skipped, 0 failed
```

---

## ✅ Summary

**What You Get:**
- ✅ **Fully automated** crypto market resolution
- ✅ **Runs every 10 minutes** (configurable)
- ✅ **Zero manual work** for supported markets
- ✅ **Free** on Vercel Hobby plan
- ✅ **Secure** with bot wallet + cron secret
- ✅ **Scalable** - easy to add more oracles

**Next Steps:**
1. Add `DEPLOYER_PRIVATE_KEY` to Vercel
2. Add `CRON_SECRET` (optional but recommended)
3. Deploy and monitor first cron run
4. Expand to more market types as needed

**You're now running a fully automated prediction market! 🚀**

---

**Last Updated**: January 23, 2026  
**Status**: Production Ready ✅
