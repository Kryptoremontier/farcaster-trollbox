# 🤖 CRON JOB TROUBLESHOOTING & BEST PRACTICES

## ⚠️ PROBLEM: Markets Not Auto-Resolving (Jan 24, 2026)

### What Happened?
Markets #5 and #6 ended but were NOT automatically resolved. Users couldn't claim winnings.

### Root Causes Found:

#### 1. **Vercel Cron Authorization Blocked** ❌
**Problem:** Cron endpoint required `Authorization: Bearer CRON_SECRET` header, but Vercel Cron doesn't send custom headers.

**Fix:** Modified `/api/cron/resolve-markets` to detect Vercel Cron via `user-agent` header:
```typescript
const isVercelCron = userAgent.includes('vercel-cron');
if (process.env.CRON_SECRET && !isVercelCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Lesson:** Always test Cron Jobs in production after deployment!

---

#### 2. **ABI Missing `cancelled` Field** ❌
**Problem:** Cron Job couldn't detect cancelled markets, tried to re-resolve them.

**Fix:** Added `cancelled` field to ABI:
```typescript
{"internalType": "bool", "name": "cancelled", "type": "bool"}
```

**Lesson:** Always sync ABI with contract changes immediately!

---

#### 3. **"Touch" Markets Use CURRENT Price, Not Historical** ⚠️
**Problem:** Market #6 "ETH touch $3000" checks ONLY current price at resolution time.

**Example:**
- Market ends: 12:00 UTC
- ETH touches $3005 at 11:50 UTC
- Cron runs at 12:10 UTC, ETH is $2950
- **WRONG RESULT:** Market resolves as NO (should be YES!)

**Fix Options:**
1. **Option A (Simple):** Change market wording to "Will ETH be above $X at resolution time?"
2. **Option B (Complex):** Use historical price API (CoinGecko Pro, requires paid API)
3. **Option C (Manual):** Don't create "touch" markets, use "end price" markets instead

**Current Status:** Added warning logs, but oracle still uses current price only.

**Lesson:** NEVER create "touch" or "high/low" markets without historical data API!

---

#### 4. **No Monitoring/Alerts** ❌
**Problem:** Cron failed silently, no one knew markets weren't resolving.

**Fix:** Added detailed logging:
- ✅ Success: Shows resolved markets with TX hash
- ⚠️ Warnings: Markets needing manual resolution
- 🚨 Errors: Failed resolutions with error details

**Lesson:** Set up monitoring (Vercel logs, Sentry, or Discord webhook) to alert on failures!

---

#### 5. **Wrong Network Gas API** ⚠️
**Problem:** `fetchEthGasPrice()` uses Ethereum mainnet API, NOT Base network.

**Fix:** Added warning comments, but API still returns Ethereum gas.

**Impact:** If you create "Base gas" markets, they'll use wrong data.

**Lesson:** Use correct API for Base: `https://api.basescan.org/api?module=gastracker&action=gasoracle&apikey=YOUR_KEY`

---

## 🛡️ HOW TO PREVENT THIS IN THE FUTURE

### ✅ 1. TEST CRON JOBS AFTER EVERY DEPLOY
```bash
# Manual test (replace YOUR_SECRET with actual CRON_SECRET)
curl -H "Authorization: Bearer YOUR_SECRET" https://trollbox-hub.vercel.app/api/cron/resolve-markets
```

**Expected Output:**
```json
{
  "success": true,
  "stats": {
    "checked": 6,
    "resolved": 2,
    "skipped": 4,
    "failed": 0
  }
}
```

---

### ✅ 2. MONITOR VERCEL LOGS DAILY
1. Go to: https://vercel.com/kryptoremontier/trollbox-hub/logs
2. Filter by: `/api/cron/resolve-markets`
3. Check for:
   - ❌ `401 Unauthorized` (Cron blocked)
   - ❌ `500 Internal Error` (Oracle failed)
   - ⚠️ `needs_manual` (Unknown market type)

---

### ✅ 3. ONLY CREATE SAFE ORACLE TYPES

#### ✅ SAFE (Auto-Resolve Ready):
- BTC last digit EVEN/ODD ✅
- BTC/ETH end price comparison ✅
- Simple "Will X be above Y at end time?" ✅

#### ❌ UNSAFE (Needs Manual Resolution):
- "Touch" markets (needs historical data) ❌
- "High/Low" markets (needs historical data) ❌
- Custom events (whale moves, on-chain activity) ❌
- Gas price for Base (API uses Ethereum) ❌

---

### ✅ 4. CHECK CONTRACT EVENTS AFTER RESOLUTION

After Cron runs, verify on BaseScan:
```
https://basescan.org/address/0x52ABabe88DE8799B374b11B91EC1b32989779e55#events
```

Look for:
- `MarketResolved` events (successful)
- `MarketCancelled` events (no winners)

**If missing:** Cron didn't run or failed!

---

### ✅ 5. MANUAL RESOLUTION BACKUP PLAN

If Cron fails, use script:
```bash
# Resolve market manually
node scripts/resolve-market.mjs <marketId> <true|false>

# Example: Resolve market #5 as YES
node scripts/resolve-market.mjs 5 true
```

---

## 🚀 EMERGENCY CHECKLIST

If users report "Market ended but no winner shown":

1. **Check Vercel Logs** (last 24h)
   - `/api/cron/resolve-markets` should run every 10 min
   
2. **Check BaseScan Events**
   - Look for `MarketResolved` or `MarketCancelled`
   
3. **Test Cron Manually**
   ```bash
   curl https://trollbox-hub.vercel.app/api/cron/resolve-markets
   ```
   
4. **Check Market Status**
   ```bash
   node scripts/check-mainnet-market.mjs <marketId>
   ```
   
5. **Resolve Manually if Needed**
   ```bash
   node scripts/resolve-market.mjs <marketId> <result>
   ```

---

## 📊 MONITORING DASHBOARD (Future TODO)

Set up automated alerts:
- Discord webhook on Cron failure
- Sentry error tracking
- Daily summary of resolved markets
- Alert if no markets resolved in 24h

---

## 🔒 SECURITY NOTES

- ✅ Vercel Cron is trusted (no auth required)
- ✅ External calls require `CRON_SECRET` in Authorization header
- ✅ Bot wallet (`DEPLOYER_PRIVATE_KEY`) only used server-side
- ✅ RPC endpoint uses retry logic (3 attempts, 1s delay)

---

## 📝 LESSONS LEARNED

1. **Test in production** - Staging ≠ Production for Cron Jobs
2. **Monitor actively** - Silent failures are the worst
3. **Keep ABIs in sync** - One missing field breaks everything
4. **Choose oracle types carefully** - Not all market types can auto-resolve
5. **Always have a backup plan** - Manual resolution scripts are essential

---

**Last Updated:** Jan 24, 2026 (after Market #5 & #6 incident)
**Status:** ✅ All issues fixed, monitoring improved
