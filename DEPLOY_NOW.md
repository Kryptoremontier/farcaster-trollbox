# 🚀 DEPLOY NOW - Ultra Quick Guide

## ⚡ 3 Steps to Launch (10 minutes)

### STEP 1: Deploy Contracts (8 min)

1. **Open Remix:** https://remix.ethereum.org/
2. **Deploy MockDEGEN:**
   - Create file: `MockDEGEN.sol`
   - Copy from: `contracts/REMIX_MockDEGEN.sol`
   - Compile (0.8.20) → Deploy to Base Sepolia
   - Mint tokens to yourself: `1000000000000000000000000`
   - **Copy address:** `0x...`

3. **Deploy TrollBet:**
   - Create file: `TrollBet.sol`
   - Copy from: `contracts/src/TrollBet.sol`
   - Wait for OpenZeppelin imports (~30s)
   - Compile (0.8.20, optimization ON) → Deploy
   - Constructor: `(MockDEGEN_address, your_wallet_address)`
   - **Copy address:** `0x...`

4. **Create 6 Markets:**
   - Use `createMarket` function 6 times:
   
   ```
   1. "Will Peter Schiff tweet about Bitcoin today?" | 1738540800
   2. "Will $DEGEN hit $0.10 this week?" | 1738972800
   3. "Will Elon Musk post a Pepe meme today?" | 1738540800
   4. "Will Bitcoin hit $110k this week?" | 1738972800
   5. "Will Vitalik call Ethereum ultrasound money?" | 1738713600
   6. "Will Crypto Twitter argue about PoW vs PoS today?" | 1738540800
   ```

---

### STEP 2: Auto-Update Frontend (30 seconds)

Run this command with YOUR addresses:

```bash
node update-contracts.js 0xMOCKDEGEN_ADDRESS 0xTROLLBET_ADDRESS
```

**This automatically:**
- ✅ Updates all contract addresses
- ✅ Sets market IDs (0-5)
- ✅ Builds project
- ✅ Commits to git
- ✅ Pushes to GitHub
- ✅ Triggers Netlify deploy

**Example:**
```bash
node update-contracts.js 0x1234567890abcdef1234567890abcdef12345678 0xabcdef1234567890abcdef1234567890abcdef12
```

---

### STEP 3: Test (2 min)

1. Wait for Netlify (~2 min): https://farcaster-trollbox.netlify.app
2. Test in Warpcast: https://warpcast.com/~/developers/frames
3. **Done!** 🎉

---

## 📝 Need More Details?

- **Full Guide:** `QUICK_REMIX_DEPLOY.md`
- **Detailed Guide:** `REMIX_DEPLOYMENT_GUIDE.md`
- **Troubleshooting:** `DEPLOYMENT_STATUS.md`

---

## 🎯 Total Time: ~10 minutes

**Cost: FREE (testnet)**

🚀 **Let's go!**
