#!/usr/bin/env node
/**
 * Manual Market Resolution Script
 *
 * Use this script to resolve markets that failed auto-resolution.
 * Run with: node scripts/resolve-pending-markets.js
 *
 * Requirements:
 * - .env.mainnet file with DEPLOYER_PRIVATE_KEY and BASE_MAINNET_RPC_URL
 */

const { createPublicClient, createWalletClient, http, formatEther, fallback } = require('viem');
const { base } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.mainnet
const envPath = path.join(__dirname, '..', '.env.mainnet');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  });
}

const TROLLBET_ETH_ADDRESS = '0x52ABabe88DE8799B374b11B91EC1b32989779e55';

const TROLLBET_ABI = [
  {
    inputs: [],
    name: 'marketCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'markets',
    outputs: [
      { internalType: 'string', name: 'question', type: 'string' },
      { internalType: 'uint256', name: 'endTime', type: 'uint256' },
      { internalType: 'uint256', name: 'yesPool', type: 'uint256' },
      { internalType: 'uint256', name: 'noPool', type: 'uint256' },
      { internalType: 'bool', name: 'resolved', type: 'bool' },
      { internalType: 'bool', name: 'winningSide', type: 'bool' },
      { internalType: 'bool', name: 'exists', type: 'bool' },
      { internalType: 'bool', name: 'cancelled', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'marketId', type: 'uint256' },
      { internalType: 'bool', name: 'winningSide', type: 'bool' }
    ],
    name: 'resolveMarket',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'marketId', type: 'uint256' }],
    name: 'cancelMarket',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

const RPC_ENDPOINTS = [
  process.env.BASE_MAINNET_RPC_URL,
  'https://base.llamarpc.com',
  'https://base.drpc.org',
  'https://mainnet.base.org',
].filter(Boolean);

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchPrice(symbol) {
  // Try Binance first (more reliable)
  const binanceSymbols = { bitcoin: 'BTCUSDT', ethereum: 'ETHUSDT', solana: 'SOLUSDT' };
  const binanceSymbol = binanceSymbols[symbol];

  if (binanceSymbol) {
    try {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`);
      if (res.ok) {
        const data = await res.json();
        return parseFloat(data.price);
      }
    } catch (e) {
      console.log(`  Binance failed: ${e.message}`);
    }
  }

  // Fallback to CoinGecko
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`);
    if (res.ok) {
      const data = await res.json();
      return data[symbol]?.usd || 0;
    }
  } catch (e) {
    console.log(`  CoinGecko failed: ${e.message}`);
  }

  return 0;
}

function determineResult(question, btcPrice, ethPrice, solPrice) {
  // BTC digit EVEN
  if (question.includes('BTC price last digit be EVEN')) {
    const lastDigit = Math.floor(btcPrice * 100) % 10;
    return { result: lastDigit % 2 === 0, reason: `BTC=$${btcPrice.toFixed(2)}, last digit=${lastDigit} (${lastDigit % 2 === 0 ? 'EVEN' : 'ODD'})` };
  }

  // BTC digit ODD
  if (question.includes('BTC price last digit be ODD')) {
    const lastDigit = Math.floor(btcPrice * 100) % 10;
    return { result: lastDigit % 2 === 1, reason: `BTC=$${btcPrice.toFixed(2)}, last digit=${lastDigit} (${lastDigit % 2 === 1 ? 'ODD' : 'EVEN'})` };
  }

  // BTC above threshold
  if (question.includes('BTC price be above')) {
    const match = question.match(/\$([0-9,]+)/);
    if (match) {
      const threshold = parseInt(match[1].replace(/,/g, ''));
      return { result: btcPrice > threshold, reason: `BTC=$${btcPrice.toFixed(2)} ${btcPrice > threshold ? '>' : '<='} $${threshold}` };
    }
  }

  // ETH above threshold
  if (question.includes('ETH price be above')) {
    const match = question.match(/\$([0-9,]+)/);
    if (match) {
      const threshold = parseInt(match[1].replace(/,/g, ''));
      return { result: ethPrice > threshold, reason: `ETH=$${ethPrice.toFixed(2)} ${ethPrice > threshold ? '>' : '<='} $${threshold}` };
    }
  }

  // SOL above threshold
  if (question.includes('SOL price be above')) {
    const match = question.match(/\$([0-9,]+)/);
    if (match) {
      const threshold = parseInt(match[1].replace(/,/g, ''));
      return { result: solPrice > threshold, reason: `SOL=$${solPrice.toFixed(2)} ${solPrice > threshold ? '>' : '<='} $${threshold}` };
    }
  }

  return { result: null, reason: 'Unknown question pattern' };
}

async function main() {
  console.log('🔧 Manual Market Resolution Script\n');

  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    console.error('❌ DEPLOYER_PRIVATE_KEY not set in .env.mainnet');
    process.exit(1);
  }

  // Setup clients
  const account = privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY);
  const transports = RPC_ENDPOINTS.map(url => http(url, { timeout: 30000, retryCount: 2 }));

  const publicClient = createPublicClient({
    chain: base,
    transport: fallback(transports, { rank: true })
  });

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: fallback(transports, { rank: true })
  });

  console.log(`🤖 Bot address: ${account.address}`);
  console.log(`🌐 Using ${RPC_ENDPOINTS.length} RPC endpoints\n`);

  // Fetch current prices
  console.log('📊 Fetching current prices...');
  const btcPrice = await fetchPrice('bitcoin');
  const ethPrice = await fetchPrice('ethereum');
  const solPrice = await fetchPrice('solana');
  console.log(`   BTC: $${btcPrice.toLocaleString()}`);
  console.log(`   ETH: $${ethPrice.toLocaleString()}`);
  console.log(`   SOL: $${solPrice.toLocaleString()}\n`);

  // Get market count
  const marketCount = await publicClient.readContract({
    address: TROLLBET_ETH_ADDRESS,
    abi: TROLLBET_ABI,
    functionName: 'marketCount'
  });

  console.log(`📊 Total markets: ${marketCount}\n`);
  console.log('Scanning for unresolved ended markets...\n');

  const now = Math.floor(Date.now() / 1000);
  const pendingMarkets = [];

  // Find all pending markets
  for (let i = 0; i < Number(marketCount); i++) {
    await delay(300);

    try {
      const market = await publicClient.readContract({
        address: TROLLBET_ETH_ADDRESS,
        abi: TROLLBET_ABI,
        functionName: 'markets',
        args: [BigInt(i)]
      });

      const [question, endTime, yesPool, noPool, resolved, , exists, cancelled] = market;

      if (!exists || resolved || cancelled) continue;
      if (Number(endTime) > now) continue;

      const { result, reason } = determineResult(question, btcPrice, ethPrice, solPrice);

      // Determine if winning side has bets
      const winningPoolWei = result === true ? yesPool : (result === false ? noPool : 0n);
      const hasWinners = winningPoolWei > 0n;

      pendingMarkets.push({
        id: i,
        question,
        endTime: new Date(Number(endTime) * 1000).toISOString(),
        yesPool: formatEther(yesPool),
        noPool: formatEther(noPool),
        yesPoolWei: yesPool,
        noPoolWei: noPool,
        result,
        reason,
        hasWinners,
        action: result === null ? 'skip' : (hasWinners ? 'resolve' : 'cancel')
      });
    } catch (e) {
      console.log(`  Error reading market #${i}: ${e.message}`);
    }
  }

  if (pendingMarkets.length === 0) {
    console.log('✅ No pending markets to resolve!');
    return;
  }

  console.log(`Found ${pendingMarkets.length} markets needing resolution:\n`);

  for (const m of pendingMarkets) {
    console.log(`Market #${m.id}:`);
    console.log(`  Question: ${m.question}`);
    console.log(`  Ended: ${m.endTime}`);
    console.log(`  Pools: ${m.yesPool} YES / ${m.noPool} NO`);
    console.log(`  Result: ${m.result === null ? '❓ UNKNOWN' : m.result ? '✅ YES' : '❌ NO'}`);
    console.log(`  Reason: ${m.reason}`);
    console.log(`  Action: ${m.action === 'skip' ? '⏭️ SKIP' : m.action === 'cancel' ? '🔄 CANCEL (refund)' : '✅ RESOLVE'}`);
    console.log();
  }

  // Ask for confirmation
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const answer = await new Promise(resolve => {
    rl.question('Do you want to resolve these markets? (yes/no): ', resolve);
  });
  rl.close();

  if (answer.toLowerCase() !== 'yes') {
    console.log('Aborted.');
    return;
  }

  // Resolve/Cancel markets
  console.log('\n🚀 Processing markets...\n');

  for (const m of pendingMarkets) {
    if (m.action === 'skip') {
      console.log(`⏭️  Skipping market #${m.id} - unknown result`);
      continue;
    }

    try {
      if (m.action === 'cancel') {
        // Use cancelMarket for markets where winning side has no bets
        console.log(`🔄 Cancelling market #${m.id} (no bets on winning side - refund)...`);

        const hash = await walletClient.writeContract({
          address: TROLLBET_ETH_ADDRESS,
          abi: TROLLBET_ABI,
          functionName: 'cancelMarket',
          args: [BigInt(m.id)]
        });

        console.log(`   TX: ${hash}`);

        const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 60000 });

        if (receipt.status === 'success') {
          console.log(`   ✅ Market #${m.id} cancelled - users can claim refunds!`);
        } else {
          console.log(`   ❌ TX failed for market #${m.id}`);
        }
      } else {
        // Normal resolution - winning side has bets
        console.log(`📤 Resolving market #${m.id} as ${m.result ? 'YES' : 'NO'}...`);

        const hash = await walletClient.writeContract({
          address: TROLLBET_ETH_ADDRESS,
          abi: TROLLBET_ABI,
          functionName: 'resolveMarket',
          args: [BigInt(m.id), m.result]
        });

        console.log(`   TX: ${hash}`);

        const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 60000 });

        if (receipt.status === 'success') {
          console.log(`   ✅ Market #${m.id} resolved successfully!`);
        } else {
          console.log(`   ❌ TX failed for market #${m.id}`);
        }
      }

      await delay(2000);
    } catch (e) {
      console.error(`   ❌ Error processing market #${m.id}: ${e.message}`);
    }
  }

  console.log('\n✅ Done!');
}

main().catch(console.error);
