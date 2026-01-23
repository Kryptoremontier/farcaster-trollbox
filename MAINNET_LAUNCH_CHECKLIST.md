# 🚀 Mainnet Launch Checklist

## ⚠️ CRITICAL: Read Before Mainnet Deployment

This is your final checklist before going live with real money on Base Mainnet.

---

## 🚨 STEP 1: Vercel Environment Variables (CRITICAL)

### Why This Matters
Vercel **DOES NOT** pull variables from `.env.local` in production. You **MUST** add them manually in the dashboard.

### Required Variables

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

#### 1. `DEPLOYER_PRIVATE_KEY` (REQUIRED)

```
Value: 0xyour_bot_wallet_private_key
```

**⚠️ SECURITY CRITICAL:**
- ✅ Use a **SEPARATE wallet** (not your main wallet!)
- ✅ Fund it with **minimal ETH** (~$20-50 worth for gas)
- ✅ This wallet should be the **contract owner**
- ❌ **NEVER** use your personal wallet with life savings
- ❌ **NEVER** commit this to git

**Recommended Setup:**
```
Main Wallet (Your personal):
  └─ Holds your funds, stays offline

Bot Wallet (Automated):
  ├─ Is contract owner
  ├─ Has ~0.05 ETH for gas (~$175 at $3,500/ETH)
  └─ Private key ONLY in Vercel env vars
```

#### 2. `CRON_SECRET` (RECOMMENDED)

```
Value: your_random_long_string_here_abc123xyz789
```

**Why?**
- Prevents unauthorized calls to your cron endpoint
- Without it, anyone could trigger `/api/cron/resolve-markets`

**How to generate:**
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use: https://www.random.org/strings/
```

#### 3. After Adding Variables

1. Click **"Redeploy"** in Vercel
2. Wait for deployment to complete
3. Verify in **Deployments** → **Latest** → **Environment Variables**

---

## 🕵️ STEP 2: Live Verification

### Monitor First Cron Run

1. **Go to Vercel Dashboard** → Your Project
2. **Deployments** → Click latest deployment
3. **Functions** → Find `/api/cron/resolve-markets`
4. Wait for next 10-minute mark (e.g., 14:10, 14:20, 14:30)

### Expected Logs

**✅ SUCCESS:**
```
🤖 [CRON] Auto-resolve markets started
   🤖 Bot address: 0xd04DF7710dB3B6448F89752784DA3caC839596a1
   📊 Total markets: 24
   
   🎯 Market #19 needs resolution:
      Question: "🎲 Will BTC price end with digit 7?"
      ✅ Result: NO
      📤 TX sent: 0x1234...
      ✅ Resolved successfully!

✅ [CRON] Completed in 2341ms
   📊 Stats: 2 resolved, 20 skipped, 0 failed
```

**❌ ERRORS TO WATCH FOR:**

| Error | Cause | Fix |
|-------|-------|-----|
| "Bot wallet not configured" | Missing `DEPLOYER_PRIVATE_KEY` | Add to Vercel env vars |
| "Unauthorized" | Missing/wrong `CRON_SECRET` | Check env var value |
| "Insufficient funds" | Bot wallet has no ETH | Send ETH to bot wallet |
| "OwnableUnauthorizedAccount" | Bot wallet is not owner | Transfer ownership or use correct wallet |

---

## 🚦 STEP 3: Market Types - Mainnet Safety

### ⚠️ CRITICAL WARNING: Mock Oracles

Your current bot has these market types:

| Type | Status | Oracle | Mainnet Safe? |
|------|--------|--------|---------------|
| **BTC Price Digit** | ✅ **Auto** | CoinGecko API | ✅ **YES - Use on Mainnet** |
| **ETH Gas Price** | ✅ **Auto** | Etherscan API | ✅ **YES - Use on Mainnet** |
| **Whale Movements** | ⚠️ **Mock (NO)** | Hardcoded `false` | ❌ **NO - DO NOT USE** |
| **BTC/ETH Ratio** | ⚠️ **Mock (NO)** | Hardcoded `false` | ❌ **NO - DO NOT USE** |
| **Base Activity** | ⚠️ **Mock (YES)** | Hardcoded `true` | ❌ **NO - DO NOT USE** |

### 🚨 DANGER: Using Mock Markets on Mainnet

**Example Scenario:**
```
You create: "Will any whale move >500 ETH in next hour?"

User A bets 1 ETH on YES
User B bets 1 ETH on NO

Reality: A whale moves 1000 ETH (YES should win)
Bot logic: Returns false (NO wins)

Result: User A loses money unfairly! 💸
        You get accused of scam! 😱
```

### ✅ SAFE MAINNET STRATEGY

**Phase 1: Launch (First Week)**
```
ONLY create these markets:
✅ "Will BTC price end with digit X?"
✅ "Will ETH gas be above X gwei?"

DO NOT create:
❌ Whale movements
❌ BTC/ETH ratio
❌ Base activity
❌ ANY subjective markets
```

**Phase 2: After Testing (Week 2+)**
- Implement real oracles for whale tracking
- Add historical price comparison for ratios
- Test thoroughly on testnet first
- Then gradually add to mainnet

---

## 📋 Pre-Mainnet Checklist

### Smart Contract

- [ ] ✅ Contract deployed on **Base Mainnet**
- [ ] ✅ Contract **verified** on BaseScan
- [ ] ✅ Owner is **bot wallet address**
- [ ] ✅ Test transaction sent (create market, place bet, resolve)
- [ ] ✅ Fee withdrawal tested

### Bot Configuration

- [ ] ✅ `DEPLOYER_PRIVATE_KEY` added to Vercel
- [ ] ✅ `CRON_SECRET` added to Vercel (optional but recommended)
- [ ] ✅ Bot wallet funded with ~0.05 ETH
- [ ] ✅ Bot wallet is contract owner
- [ ] ✅ Cron job tested on testnet
- [ ] ✅ First mainnet cron run verified in logs

### Market Creation

- [ ] ✅ Only create **BTC Price Digit** markets
- [ ] ✅ Only create **ETH Gas Price** markets
- [ ] ❌ **NO** whale movement markets
- [ ] ❌ **NO** ratio comparison markets
- [ ] ❌ **NO** subjective markets
- [ ] ✅ All markets have clear, objective outcomes
- [ ] ✅ All markets have reasonable time frames (10min - 24h)

### Frontend

- [ ] ✅ Update contract address to mainnet
- [ ] ✅ Update chain to `base` (not `baseSepolia`)
- [ ] ✅ Test wallet connection
- [ ] ✅ Test bet placement
- [ ] ✅ Test winnings claim
- [ ] ✅ Verify all amounts display correctly

### Security

- [ ] ✅ Private keys **NEVER** committed to git
- [ ] ✅ `.env` file in `.gitignore`
- [ ] ✅ Bot wallet separate from personal wallet
- [ ] ✅ Contract ownership can be transferred if needed
- [ ] ✅ Emergency pause mechanism (if implemented)

### Legal & Compliance

- [ ] ⚠️ Check local gambling laws
- [ ] ⚠️ Add Terms of Service
- [ ] ⚠️ Add disclaimer about risks
- [ ] ⚠️ Consider age restrictions
- [ ] ⚠️ Tax implications for users

---

## 🎯 Launch Day Procedure

### 1. Final Testnet Check (Morning)
```bash
# Run manual resolve
node scripts/auto-resolve-markets.mjs

# Verify all markets resolve correctly
# Check BaseScan for transactions
```

### 2. Deploy to Mainnet (Afternoon)

```bash
# 1. Update contract address in code
# 2. Update chain to base mainnet
# 3. Commit and push
git add -A
git commit -m "Switch to Base Mainnet"
git push

# 4. Verify Vercel deployment
# 5. Check environment variables
# 6. Wait for first cron run
```

### 3. Create First Markets (Evening)

**Start Small:**
```
Market 1: "Will BTC price end with digit 7 in next hour?"
Market 2: "Will ETH gas be above 15 gwei in next hour?"
Market 3: "Will BTC price end with digit 3 in next 2 hours?"
```

**Why these?**
- ✅ Short time frames (1-2 hours)
- ✅ Easy to verify manually if bot fails
- ✅ Low risk for testing
- ✅ Clear, objective outcomes

### 4. Monitor Closely (First 24h)

- [ ] Check every market resolution
- [ ] Verify bot logs in Vercel
- [ ] Monitor BaseScan for transactions
- [ ] Watch for user complaints
- [ ] Be ready to pause if issues arise

---

## 🚨 Emergency Procedures

### If Bot Fails to Resolve

**Symptoms:**
- Market ended but not resolved after 20+ minutes
- Cron logs show errors
- Users complaining

**Action:**
1. Check Vercel logs for errors
2. Verify bot wallet has ETH
3. Manually resolve using Remix or script:
   ```bash
   node scripts/resolve-market.mjs <marketId> <true/false>
   ```
4. Investigate root cause
5. Fix and redeploy

### If Wrong Resolution

**Symptoms:**
- Bot resolved market incorrectly
- Users complaining about unfair outcome

**Action:**
1. **STOP** creating new markets immediately
2. Check oracle data (was API down?)
3. If bot error: Pause cron job in Vercel
4. Communicate with affected users
5. Consider manual refunds if necessary
6. Fix bot logic before resuming

### If Security Breach

**Symptoms:**
- Unauthorized transactions from bot wallet
- Private key compromised

**Action:**
1. **IMMEDIATELY** transfer contract ownership to new wallet
2. Drain bot wallet of remaining ETH
3. Generate new bot wallet
4. Update `DEPLOYER_PRIVATE_KEY` in Vercel
5. Investigate how breach occurred
6. Implement additional security measures

---

## 📊 Success Metrics (First Week)

### Technical Metrics
- [ ] ✅ 100% uptime for cron job
- [ ] ✅ 100% correct resolutions
- [ ] ✅ <5 second average resolution time
- [ ] ✅ Zero manual interventions needed

### Business Metrics
- [ ] 🎯 10+ unique users
- [ ] 🎯 50+ total bets placed
- [ ] 🎯 1+ ETH total volume
- [ ] 🎯 Zero complaints about fairness

### User Experience
- [ ] ✅ All winnings claimed successfully
- [ ] ✅ No stuck transactions
- [ ] ✅ Fast load times
- [ ] ✅ Positive user feedback

---

## 🔮 Future Enhancements

### Week 2-4: Advanced Oracles

**Whale Tracker:**
```typescript
async function checkWhaleMovement(threshold: number): Promise<boolean> {
  const response = await fetch(
    `https://api.etherscan.io/api?module=account&action=txlist&address=${WHALE_ADDRESS}&sort=desc`
  );
  const data = await response.json();
  // Check recent large transfers
  return data.result.some(tx => parseFloat(tx.value) > threshold);
}
```

**BTC/ETH Ratio:**
```typescript
async function checkRatioIncrease(): Promise<boolean> {
  const btcNow = await fetchCryptoPrice('bitcoin');
  const ethNow = await fetchCryptoPrice('ethereum');
  const ratioNow = btcNow / ethNow;
  
  // Compare with ratio at market creation time (store in contract)
  const ratioStart = await contract.getMarketStartRatio(marketId);
  
  return ratioNow > ratioStart;
}
```

### Month 2+: AI Integration

**GPT-4 Oracle:**
```typescript
async function analyzeSubjectiveMarket(question: string): Promise<boolean> {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "system",
      content: "You are a prediction market oracle. Analyze objectively."
    }, {
      role: "user",
      content: `Question: ${question}\nProvide YES or NO with reasoning.`
    }]
  });
  
  return response.choices[0].message.content.includes("YES");
}
```

---

## ✅ Final Checklist Before Launch

Print this and check off each item:

### Pre-Launch (Do Today)
- [ ] Vercel env vars configured
- [ ] Bot wallet funded
- [ ] Cron job tested on testnet
- [ ] All mock markets removed from code
- [ ] Documentation reviewed

### Launch Day (Do Tomorrow)
- [ ] Switch to mainnet contract
- [ ] Deploy to Vercel
- [ ] Create 3 test markets
- [ ] Monitor first resolutions
- [ ] Verify user experience

### Post-Launch (First Week)
- [ ] Daily monitoring of cron logs
- [ ] Daily check of BaseScan transactions
- [ ] Respond to user feedback
- [ ] Collect metrics
- [ ] Plan next features

---

## 🎉 You're Ready!

**When you've checked all boxes above, you're ready to launch!**

Remember:
- ✅ Start small (3-5 markets)
- ✅ Use only auto-resolvable types
- ✅ Monitor closely first 24h
- ✅ Be ready to pause if issues
- ✅ Communicate with users

**Good luck with your launch! 🚀**

---

**Last Updated**: January 23, 2026  
**Status**: Ready for Mainnet Launch  
**Risk Level**: Low (with proper precautions)
