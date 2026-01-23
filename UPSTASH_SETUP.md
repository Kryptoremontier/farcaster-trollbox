# 🔧 Upstash Redis Setup

## 🎯 Why Redis?

Redis is used for:
- ✅ **Leaderboard** - Real-time player rankings
- ✅ **Points System** - 🤫 Secret $TROLL airdrop points
- ✅ **Chat History** - Persistent chat messages
- ✅ **User Stats** - Player statistics & achievements

---

## 🚀 Setup (5 minutes)

### Step 1: Create Upstash Account

1. Go to: https://upstash.com/
2. Click **"Sign Up"** (use GitHub for quick login)
3. Verify your email

### Step 2: Create Redis Database

1. Click **"Create Database"**
2. Configure:
   - **Name:** `trollbox-redis`
   - **Type:** `Regional` (Free tier!)
   - **Region:** `us-east-1` (closest to Netlify)
   - **Eviction:** `No Eviction`
3. Click **"Create"**

### Step 3: Get Credentials

After creation, you'll see:

```
UPSTASH_REDIS_REST_URL: https://xxxxx-xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN: AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
```

**Copy both values!**

---

## 🌐 Add to Netlify

### Option A: Netlify UI (Recommended)

1. Go to: https://app.netlify.com/sites/farcaster-trollbox/settings/env
2. Click **"Add a variable"**
3. Add first variable:
   - **Key:** `UPSTASH_REDIS_REST_URL`
   - **Value:** `https://xxxxx-xxxxx.upstash.io`
   - Click **"Create variable"**
4. Add second variable:
   - **Key:** `UPSTASH_REDIS_REST_TOKEN`
   - **Value:** `AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ`
   - Click **"Create variable"**
5. Netlify will **auto-redeploy** with new env vars!

### Option B: Netlify CLI

```bash
netlify env:set UPSTASH_REDIS_REST_URL "https://xxxxx-xxxxx.upstash.io"
netlify env:set UPSTASH_REDIS_REST_TOKEN "AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ"
```

---

## 💻 Local Development

### Step 1: Create `.env.local`

Create a file named `.env.local` in the project root:

```bash
# .env.local (DO NOT COMMIT!)
UPSTASH_REDIS_REST_URL=https://xxxxx-xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
NODE_ENV=development
```

### Step 2: Add to `.gitignore`

Make sure `.env.local` is in `.gitignore`:

```
# .gitignore
.env.local
.env*.local
```

### Step 3: Restart Dev Server

```bash
npm run dev
```

---

## ✅ Verify Setup

### Check Netlify Logs

After redeploy, you should **NOT** see:

```
❌ [Upstash Redis] The 'url' property is missing...
```

You should see:

```
✅ Build completed successfully
```

### Test in App

1. Open app: https://farcaster-trollbox.netlify.app
2. Check browser console (F12)
3. Look for Redis errors - should be none!

---

## 🔒 Security

### Best Practices

- ✅ **Never commit** `.env.local` to Git
- ✅ **Use environment variables** for all secrets
- ✅ **Rotate tokens** if exposed
- ✅ **Use separate databases** for dev/prod

### If Token Leaked

1. Go to Upstash Console
2. Click on your database
3. Go to **"Settings"** → **"Danger Zone"**
4. Click **"Reset Token"**
5. Update Netlify env vars with new token

---

## 📊 Redis Usage

### Free Tier Limits

- **Max Commands:** 10,000/day
- **Max Data Size:** 256 MB
- **Max Connections:** 1,000

### Estimated Usage (TrollBox)

| Feature | Commands/Day | Notes |
|---------|--------------|-------|
| Leaderboard | ~1,000 | Updated on bets |
| Points System | ~2,000 | Tracked per user |
| Chat Messages | ~5,000 | High activity |
| User Stats | ~1,000 | Cached |
| **Total** | **~9,000** | Within free tier ✅ |

---

## 🎯 What Redis Stores

### 1. User Points (Secret Airdrop)

```typescript
Key: `points:${address}`
Value: {
  totalPoints: 12500,
  breakdown: { betsPlaced: 5000, volumeTraded: 4000, ... },
  tier: 'gold',
  lastUpdated: 1706000000
}
```

### 2. Leaderboard

```typescript
Key: `leaderboard:global`
Type: Sorted Set
Members: user addresses
Scores: total points
```

### 3. Chat Messages

```typescript
Key: `chat:${marketId}`
Type: List
Values: { user, message, timestamp }
Max: 100 messages per market
```

### 4. User Stats

```typescript
Key: `stats:${address}`
Value: {
  totalBets: 42,
  totalWagered: 50000,
  winRate: 65.5,
  pnl: 12500
}
```

---

## 🐛 Troubleshooting

### Error: "url property is missing"

**Solution:** Add `UPSTASH_REDIS_REST_URL` to Netlify env vars

### Error: "token property is missing"

**Solution:** Add `UPSTASH_REDIS_REST_TOKEN` to Netlify env vars

### Error: "Connection timeout"

**Solution:** Check Upstash dashboard - database might be paused (free tier)

### Error: "Too many requests"

**Solution:** You hit the 10k/day limit - upgrade to paid tier or optimize queries

---

## 🚀 Upgrade to Paid (Optional)

If you exceed free tier:

1. Go to Upstash Console
2. Click **"Upgrade"**
3. Choose **"Pay as you go"**
4. Pricing: $0.20 per 100k commands

**Estimated cost:**
- 100k users: ~$10/month
- 1M users: ~$100/month

---

## 📝 Next Steps

After setup:

1. ✅ Verify no Redis warnings in build logs
2. ✅ Test leaderboard updates
3. ✅ Test chat persistence
4. ✅ Monitor usage in Upstash dashboard
5. ✅ Set up alerts for 80% usage

---

## 🔗 Useful Links

- **Upstash Console:** https://console.upstash.com/
- **Upstash Docs:** https://docs.upstash.com/redis
- **Netlify Env Vars:** https://app.netlify.com/sites/farcaster-trollbox/settings/env
- **Redis Commands:** https://redis.io/commands

---

## 💡 Pro Tips

1. **Use Redis for hot data only** - Store frequently accessed data
2. **Set TTL on temporary data** - Auto-expire old chat messages
3. **Batch operations** - Reduce command count
4. **Monitor usage** - Check Upstash dashboard weekly
5. **Cache aggressively** - Reduce blockchain reads

---

*Last updated: January 2026*
