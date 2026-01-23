# Vercel Environment Variables Setup

## 🚨 CRITICAL: Required for Automated Market Resolution

For the Cron Job to automatically resolve markets every 10 minutes, you **MUST** add the following environment variable to Vercel.

---

## 📋 Step-by-Step Instructions

### 1. Go to Vercel Dashboard
- Navigate to: https://vercel.com/dashboard
- Select your project: `farcaster-trollbox`

### 2. Open Environment Variables Settings
- Click on **Settings** (top menu)
- Click on **Environment Variables** (left sidebar)

### 3. Add DEPLOYER_PRIVATE_KEY

Click **Add New** and enter:

**Name:**
```
DEPLOYER_PRIVATE_KEY
```

**Value:**
```
0x... (your private key from .env file)
```

**Environments:**
- ✅ Production
- ✅ Preview
- ✅ Development

**Important:**
- This should be the SAME private key you use in your local `.env` file
- This is the wallet that deployed the TrollBetETH contract
- This wallet needs a small amount of ETH on Base Sepolia for gas fees (~$5-10 worth)

### 4. Redeploy the Application

After adding the environment variable:
- Go to **Deployments** tab
- Click on the latest deployment
- Click **Redeploy** button
- Wait for the build to complete (~2-3 minutes)

---

## 🔍 How to Verify It's Working

### Check Cron Job Logs

1. Go to Vercel Dashboard → Your Project
2. Click on **Logs** tab
3. Filter by: `/api/cron/resolve-markets`
4. You should see entries every 10 minutes like:

```
[CRON] Checking 30 markets...
[CRON] Found 2 markets to resolve
[CRON] Market #27 resolved: NO wins
[CRON] Market #28 resolved: NO wins
[CRON] Completed: 2 resolved, 0 errors
```

### Manual Test

You can manually trigger the cron job by visiting:
```
https://your-app.vercel.app/api/cron/resolve-markets
```

If it works, you'll see a JSON response like:
```json
{
  "success": true,
  "resolved": 2,
  "errors": 0
}
```

---

## 🔐 Security Best Practices

### Wallet Security

1. **Use a Dedicated Bot Wallet**
   - Don't use your main wallet with large funds
   - Create a new wallet specifically for the bot
   - Transfer only ~$10-20 worth of ETH for gas

2. **Monitor the Wallet**
   - Check balance regularly
   - Set up alerts if balance drops too low
   - Refill gas when needed

3. **Rotate Keys Periodically**
   - Consider rotating the private key every few months
   - Update both `.env` and Vercel when you do

### Vercel Environment Variable Security

- Environment variables in Vercel are encrypted at rest
- They are only accessible to your deployments
- Never commit `.env` files to Git
- Never share your private key in chat, Discord, or public forums

---

## 🐛 Troubleshooting

### Cron Job Not Running

**Symptom:** Markets don't resolve automatically after 10 minutes

**Solutions:**
1. Check if `DEPLOYER_PRIVATE_KEY` is set in Vercel
2. Check if the wallet has enough ETH for gas
3. Check Vercel logs for errors
4. Verify `vercel.json` has the cron configuration:
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

### "Invalid Private Key" Error

**Symptom:** Cron job fails with "Invalid private key" error

**Solutions:**
1. Make sure the private key starts with `0x`
2. Make sure there are no spaces or newlines
3. Make sure you copied the entire key (64 hex characters after `0x`)

### "Insufficient Funds" Error

**Symptom:** Cron job fails with "insufficient funds for gas" error

**Solutions:**
1. Check wallet balance: https://sepolia.basescan.org/address/YOUR_WALLET_ADDRESS
2. Get testnet ETH from: https://www.alchemy.com/faucets/base-sepolia
3. For mainnet, ensure wallet has enough ETH

### Markets Resolve with Wrong Results

**Symptom:** Markets are resolved but the results don't match reality

**Solutions:**
1. Check the oracle logic in `src/app/api/cron/resolve-markets/route.ts`
2. Verify external API calls (CoinGecko, Etherscan) are working
3. Check if you're using mock oracles (⚠️ NOT safe for mainnet!)

---

## 📊 Monitoring

### Set Up Alerts

Consider setting up alerts for:
- Low gas balance (< 0.01 ETH)
- Cron job failures
- Unusual number of resolutions

You can use:
- Vercel Monitoring (built-in)
- Sentry for error tracking
- Custom webhooks to Discord/Telegram

### Check Resolution History

You can view all resolved markets on BaseScan:
```
https://sepolia.basescan.org/address/0xc629e67E221db99CF2A6e0468907bBcFb7D5f5A3
```

Filter by "resolveMarket" function calls to see the history.

---

## 🚀 Mainnet Deployment

When deploying to mainnet:

1. **Update Contract Address**
   - Change `TROLLBET_ETH_ADDRESS` in `route.ts`
   - Update `baseSepolia` to `base` (mainnet chain)

2. **Use Production Wallet**
   - Create a new production wallet
   - Fund it with real ETH (not testnet)
   - Update `DEPLOYER_PRIVATE_KEY` in Vercel

3. **Verify Oracle Logic**
   - ⚠️ Remove ALL mock oracles
   - Only use markets with real data sources:
     - ✅ BTC Price (CoinGecko)
     - ✅ ETH Gas (Etherscan)
     - ❌ Whale Movements (mock)
     - ❌ BTC/ETH Ratio (mock)
     - ❌ Base Activity (mock)

4. **Test Thoroughly**
   - Deploy to Preview environment first
   - Test with small amounts
   - Verify resolutions are correct
   - Monitor for 24-48 hours before full launch

---

## 📞 Support

If you encounter issues:
1. Check Vercel logs first
2. Check BaseScan for transaction details
3. Review this guide
4. Check the codebase documentation

---

**Last Updated:** 2026-01-23
**Version:** 1.0
