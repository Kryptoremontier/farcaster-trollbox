# Upstash Redis Setup (Optional)

## ⚠️ Current Status

**Redis is OPTIONAL** - the app works without it!

- ✅ **Without Redis**: Leaderboard shows mock data
- ✅ **With Redis**: Leaderboard shows real user points and rankings

---

## 🐛 Bug Fixed

### Problem
When clicking "Leaderboard" tab, the app crashed with:
```
Application error: a client-side exception has occurred
(see the browser console for more information)
```

### Root Cause
- `src/lib/kv.ts` tried to initialize Upstash Redis client
- No `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN` in `.env`
- Redis client threw error on first API call
- Leaderboard component crashed

### Solution
Added fallback logic:
```typescript
// Check if Redis is configured
const isRedisConfigured = !!(
  (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
  (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)
);

const redis = isRedisConfigured ? new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
}) : null;
```

All Redis functions now check `if (!redis) return null/[]/void;`

---

## 🎯 What Redis Does

### Features Enabled with Redis:
1. **Real-time Leaderboard**
   - User rankings by points
   - Total volume traded
   - Bets placed count

2. **Points System**
   - Track user activity
   - Calculate rewards
   - Airdrop eligibility

3. **User Profiles**
   - Bet history
   - Win/loss records
   - Streaks and milestones

4. **Notifications**
   - Store Farcaster notification tokens
   - Send push notifications

### Features WITHOUT Redis:
- ✅ All betting functionality works
- ✅ Leaderboard shows mock data
- ✅ No crashes or errors
- ❌ No real user rankings
- ❌ No points tracking
- ❌ No notifications

---

## 🚀 How to Enable Redis

### 1. Create Upstash Account
1. Go to [upstash.com](https://upstash.com)
2. Sign up (free tier available)
3. Create a new Redis database
4. Choose region closest to your users (e.g., `us-east-1`)

### 2. Get Credentials
In Upstash dashboard:
1. Click on your database
2. Scroll to "REST API" section
3. Copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### 3. Add to Environment Variables

#### Local Development (`.env.local`)
```bash
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

#### Vercel Deployment
1. Go to Vercel Dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add:
   ```
   UPSTASH_REDIS_REST_URL = https://your-database.upstash.io
   UPSTASH_REDIS_REST_TOKEN = your_token_here
   ```
5. Redeploy

### 4. Verify
```bash
# Check if Redis is working
curl https://your-app.vercel.app/api/leaderboard

# Should return real data (or empty array if no users yet)
{
  "success": true,
  "leaderboard": []
}
```

---

## 📊 Data Structure

### User Points
```typescript
interface UserPoints {
  address: string;
  fid?: number;
  username?: string;
  totalPoints: number;
  betsPlaced: number;
  volumeTraded: number; // in ETH
  winsCount: number;
  lossesCount: number;
  currentStreak: number;
  maxStreak: number;
  firstBetTimestamp: number;
  lastBetTimestamp: number;
  referrals: number;
  activeDays: Set<string>; // YYYY-MM-DD format
}
```

### Leaderboard Entry
```typescript
{
  address: string;
  points: number;
  username?: string;
  fid?: number;
  betsPlaced: number;
  volumeTraded: number;
}
```

---

## 🔧 Testing Redis

### Test Points System
```bash
# Place a bet in the app
# Then check if points were recorded:

curl https://your-app.vercel.app/api/user-points?address=0xYourAddress
```

Expected response:
```json
{
  "success": true,
  "points": {
    "address": "0xyouraddress",
    "totalPoints": 150,
    "betsPlaced": 1,
    "volumeTraded": 0.001,
    "winsCount": 0,
    "lossesCount": 0
  }
}
```

### Test Leaderboard
```bash
curl https://your-app.vercel.app/api/leaderboard?limit=10
```

Expected response:
```json
{
  "success": true,
  "leaderboard": [
    {
      "address": "0x...",
      "points": 1500,
      "username": "DegenKing",
      "betsPlaced": 10,
      "volumeTraded": 1.5
    }
  ]
}
```

---

## 💰 Upstash Pricing

### Free Tier
- ✅ 10,000 commands/day
- ✅ 256 MB storage
- ✅ Perfect for testing and small apps

### Paid Tier ($0.2/100k commands)
- For production with high traffic
- Unlimited storage
- Global replication

### Estimate for TrollBox
```
Assumptions:
- 1,000 active users/month
- 10 bets per user
- 3 leaderboard views per user

Commands:
- Bet recording: 1,000 * 10 * 3 = 30,000 (write bet, update points, update leaderboard)
- Leaderboard views: 1,000 * 3 * 1 = 3,000
- Total: ~33,000 commands/month

Cost: FREE (under 10k/day limit)
```

---

## 🔐 Security

### Environment Variables
- ✅ Never commit `.env` files
- ✅ Use Vercel's encrypted environment variables
- ✅ Rotate tokens if exposed

### Redis Security
- ✅ Upstash uses TLS encryption
- ✅ REST API tokens are scoped to your database
- ✅ No public access without token

---

## 🐛 Troubleshooting

### "Failed to fetch leaderboard"
**Cause**: Redis credentials are wrong or expired
**Solution**: 
1. Check Upstash dashboard
2. Regenerate token if needed
3. Update `.env` and redeploy

### Leaderboard shows mock data
**Cause**: Redis is not configured (this is OK!)
**Solution**: 
- If you want real data, follow setup steps above
- If you're just testing, mock data is fine

### "Error getting user points"
**Cause**: Redis connection issue
**Solution**:
1. Check Upstash dashboard - is database running?
2. Verify environment variables are set
3. Check Vercel logs for detailed error

---

## 📝 Migration Plan

### Phase 1: Development (Current)
- ✅ Redis optional
- ✅ Mock data for testing
- ✅ No crashes if Redis unavailable

### Phase 2: Beta Launch
- Set up Upstash Redis (free tier)
- Enable real leaderboard
- Test with real users

### Phase 3: Production
- Upgrade to paid tier if needed
- Enable global replication
- Set up monitoring

---

## 🎯 Recommendation

### For Testing (Now)
**Don't set up Redis yet**
- App works fine without it
- Mock data is sufficient
- One less thing to configure

### For Beta Launch
**Set up Redis before public launch**
- Real leaderboard is more engaging
- Points system drives retention
- Airdrop eligibility tracking

### For Production
**Monitor and scale**
- Watch Upstash usage
- Upgrade if hitting limits
- Consider caching strategies

---

## ✅ Current Status

- ✅ **App works without Redis**
- ✅ **No crashes on Leaderboard tab**
- ✅ **Mock data displayed**
- ✅ **Ready for Redis when needed**

**Next Steps:**
1. Test app without Redis (current state)
2. When ready for beta, follow setup guide above
3. Monitor usage and upgrade as needed

---

**Last Updated**: January 23, 2026
**Status**: Redis is optional, app fully functional without it
