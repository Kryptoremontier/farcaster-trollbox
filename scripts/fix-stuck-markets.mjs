#!/usr/bin/env node

/**
 * Fix stuck markets that weren't resolved by cron
 * These markets ended but weren't resolved - now manually resolve them
 */

import { createPublicClient, createWalletClient, http, formatEther } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.mainnet') });

const TROLLBET_ETH_ADDRESS = '0x52ABabe88DE8799B374b11B91EC1b32989779e55';

const TROLLBET_ABI = [
  {
    inputs: [{ name: '', type: 'uint256' }],
    name: 'markets',
    outputs: [
      { name: 'question', type: 'string' },
      { name: 'endTime', type: 'uint256' },
      { name: 'yesPool', type: 'uint256' },
      { name: 'noPool', type: 'uint256' },
      { name: 'resolved', type: 'bool' },
      { name: 'winningSide', type: 'bool' },
      { name: 'exists', type: 'bool' },
      { name: 'cancelled', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'winningSide', type: 'bool' }
    ],
    name: 'resolveMarket',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

// Fetch current crypto prices with fallback to Binance
async function fetchPrice(coinId) {
  const binanceSymbolMap = {
    'bitcoin': 'BTCUSDT',
    'ethereum': 'ETHUSDT',
    'solana': 'SOLUSDT',
  };

  // Try CoinGecko first
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
    );
    const data = await response.json();

    // Check for rate limit
    if (data.status?.error_code === 429) {
      throw new Error('Rate limited');
    }

    const price = data[coinId]?.usd;
    if (price && price > 0) {
      return price;
    }
    throw new Error('Invalid price');
  } catch (error) {
    console.log(`   ⚠️ CoinGecko failed for ${coinId}, trying Binance...`);
  }

  // Fallback to Binance
  const binanceSymbol = binanceSymbolMap[coinId];
  if (binanceSymbol) {
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`
      );
      const data = await response.json();
      return parseFloat(data.price) || 0;
    } catch (error) {
      console.error(`   ❌ Binance also failed for ${binanceSymbol}`);
    }
  }

  return 0;
}

// Stuck markets that need to be resolved
const STUCK_MARKETS = [
  { id: 16, question: "Will BTC price be above $90,000", threshold: 90000, coin: 'bitcoin' },
  { id: 17, question: "Will ETH price be above $3,000", threshold: 3000, coin: 'ethereum' },
  { id: 18, question: "Will SOL price be above $125", threshold: 125, coin: 'solana' },
  { id: 19, question: "Will SOL price be above $115", threshold: 115, coin: 'solana' },
];

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('🔧 FIX STUCK MARKETS - MANUAL RESOLUTION');
  console.log('═'.repeat(60) + '\n');

  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    console.error('❌ DEPLOYER_PRIVATE_KEY not found in .env.mainnet');
    process.exit(1);
  }

  const account = privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY);
  const rpcUrl = process.env.BASE_MAINNET_RPC_URL || 'https://mainnet.base.org';

  const publicClient = createPublicClient({
    chain: base,
    transport: http(rpcUrl)
  });

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(rpcUrl)
  });

  console.log(`📍 Contract: ${TROLLBET_ETH_ADDRESS}`);
  console.log(`👤 Resolver: ${account.address}\n`);

  // Fetch current prices
  console.log('📊 Fetching current prices...\n');
  const btcPrice = await fetchPrice('bitcoin');
  const ethPrice = await fetchPrice('ethereum');
  const solPrice = await fetchPrice('solana');

  console.log(`   BTC: $${btcPrice.toLocaleString()}`);
  console.log(`   ETH: $${ethPrice.toLocaleString()}`);
  console.log(`   SOL: $${solPrice.toLocaleString()}\n`);

  console.log('─'.repeat(60) + '\n');

  // Note: These markets ended on Jan 27, 2026 at ~20:00 UTC
  // We need to use the price at THAT time, not current price
  // For now, we'll note that these need manual investigation

  console.log('⚠️  IMPORTANT: These markets ended on Jan 27, 2026');
  console.log('   We need to verify the HISTORICAL prices at resolution time!\n');

  // Check each stuck market
  for (const market of STUCK_MARKETS) {
    try {
      const marketData = await publicClient.readContract({
        address: TROLLBET_ETH_ADDRESS,
        abi: TROLLBET_ABI,
        functionName: 'markets',
        args: [BigInt(market.id)]
      });

      const [question, endTime, yesPool, noPool, resolved, winningSide, exists, cancelled] = marketData;

      console.log(`Market #${market.id}:`);
      console.log(`  ❓ ${question}`);
      console.log(`  ⏰ Ended: ${new Date(Number(endTime) * 1000).toISOString()}`);
      console.log(`  💰 YES: ${formatEther(yesPool)} ETH | NO: ${formatEther(noPool)} ETH`);
      console.log(`  🎯 Resolved: ${resolved ? '✅' : '❌'} | Cancelled: ${cancelled ? '⚠️ Yes' : '✅ No'}`);

      if (resolved) {
        console.log(`  ✅ Already resolved - Winner: ${winningSide ? 'YES' : 'NO'}\n`);
        continue;
      }

      if (cancelled) {
        console.log(`  ⚠️ Already cancelled\n`);
        continue;
      }

      const totalPool = yesPool + noPool;
      if (totalPool === 0n) {
        console.log(`  ⚠️ No bets - will be auto-cancelled when resolved\n`);
      }

      // Determine outcome based on coin
      let currentPrice;
      if (market.coin === 'bitcoin') currentPrice = btcPrice;
      else if (market.coin === 'ethereum') currentPrice = ethPrice;
      else if (market.coin === 'solana') currentPrice = solPrice;

      const isAbove = currentPrice > market.threshold;
      console.log(`  📈 Current ${market.coin}: $${currentPrice.toLocaleString()} vs $${market.threshold.toLocaleString()}`);
      console.log(`  🎲 Result (based on CURRENT price): ${isAbove ? '✅ YES' : '❌ NO'}\n`);

    } catch (error) {
      console.error(`  ❌ Error: ${error.message}\n`);
    }
  }

  console.log('─'.repeat(60) + '\n');
  console.log('⚠️  TO ACTUALLY RESOLVE THESE MARKETS:');
  console.log('   1. Verify historical prices at market end time');
  console.log('   2. Run: node scripts/resolve-mainnet-market.mjs <marketId> <true|false>');
  console.log('   3. Or uncomment the resolution code below and run again\n');

  // UNCOMMENT BELOW TO ACTUALLY RESOLVE
  /*
  console.log('\n🚀 RESOLVING MARKETS...\n');

  for (const market of STUCK_MARKETS) {
    const marketData = await publicClient.readContract({
      address: TROLLBET_ETH_ADDRESS,
      abi: TROLLBET_ABI,
      functionName: 'markets',
      args: [BigInt(market.id)]
    });

    const [, , , , resolved, , ,] = marketData;
    if (resolved) continue;

    // Get price for this coin
    let price;
    if (market.coin === 'bitcoin') price = btcPrice;
    else if (market.coin === 'ethereum') price = ethPrice;
    else if (market.coin === 'solana') price = solPrice;

    const winningSide = price > market.threshold;

    console.log(`Resolving Market #${market.id} as ${winningSide ? 'YES' : 'NO'}...`);

    try {
      const hash = await walletClient.writeContract({
        address: TROLLBET_ETH_ADDRESS,
        abi: TROLLBET_ABI,
        functionName: 'resolveMarket',
        args: [BigInt(market.id), winningSide]
      });

      console.log(`   📤 TX: ${hash}`);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log(`   ✅ ${receipt.status === 'success' ? 'Success!' : 'Failed!'}\n`);

      await new Promise(r => setTimeout(r, 2000)); // Wait between txs
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
    }
  }
  */
}

main().catch(console.error);
