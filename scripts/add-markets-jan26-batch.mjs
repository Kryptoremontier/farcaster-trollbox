#!/usr/bin/env node

/**
 * Add 3 new markets - January 26, 2026
 * Market #9:  US strikes Iran by March 31 (political - semi-auto)
 * Market #10: BTC above $95,000 by January 31 (crypto - auto)
 * Market #11: ETH above $3,300 by January 31 (crypto - auto)
 */

import { createPublicClient, createWalletClient, http } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.mainnet
config({ path: join(__dirname, '..', '.env.mainnet') });

const TROLLBET_ETH_ADDRESS = '0x52ABabe88DE8799B374b11B91EC1b32989779e55';

const TROLLBET_ABI = [
  {
    inputs: [
      { name: 'question', type: 'string' },
      { name: 'endTime', type: 'uint256' }
    ],
    name: 'createMarket',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'marketCount',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

// Market definitions
const MARKETS = [
  {
    question: "Will the US strike Iran by March 31, 2026?",
    // March 31, 2026 23:59:59 UTC
    endTime: Math.floor(new Date('2026-03-31T23:59:59Z').getTime() / 1000),
    type: 'political',
    emoji: '🇺🇸'
  },
  {
    question: "Will BTC price be above $95,000 at resolution time?",
    // January 31, 2026 23:59:59 UTC
    endTime: Math.floor(new Date('2026-01-31T23:59:59Z').getTime() / 1000),
    type: 'crypto',
    emoji: '₿'
  },
  {
    question: "Will ETH price be above $3,300 at resolution time?",
    // January 31, 2026 23:59:59 UTC
    endTime: Math.floor(new Date('2026-01-31T23:59:59Z').getTime() / 1000),
    type: 'crypto',
    emoji: 'Ξ'
  }
];

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('🚀 ADDING 3 NEW MARKETS TO BASE MAINNET');
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
  console.log(`👤 Deployer: ${account.address}\n`);

  // Get current market count
  const startCount = await publicClient.readContract({
    address: TROLLBET_ETH_ADDRESS,
    abi: TROLLBET_ABI,
    functionName: 'marketCount'
  });

  console.log(`📊 Current market count: ${startCount}\n`);
  console.log('─'.repeat(60) + '\n');

  const results = [];

  for (let i = 0; i < MARKETS.length; i++) {
    const market = MARKETS[i];
    const marketId = Number(startCount) + i;
    const endDate = new Date(market.endTime * 1000);

    console.log(`${market.emoji} Market #${marketId}`);
    console.log(`   Question: "${market.question}"`);
    console.log(`   Type: ${market.type}`);
    console.log(`   End Time: ${endDate.toISOString()}`);
    console.log(`            ${endDate.toLocaleString()}\n`);

    try {
      const hash = await walletClient.writeContract({
        address: TROLLBET_ETH_ADDRESS,
        abi: TROLLBET_ABI,
        functionName: 'createMarket',
        args: [market.question, BigInt(market.endTime)]
      });

      console.log(`   📤 TX: ${hash}`);

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === 'success') {
        console.log(`   ✅ Market #${marketId} created!`);
        console.log(`   🔗 https://basescan.org/tx/${hash}\n`);

        results.push({
          id: marketId,
          question: market.question,
          endTime: market.endTime,
          endTimeISO: endDate.toISOString(),
          type: market.type,
          emoji: market.emoji,
          success: true
        });
      } else {
        console.log(`   ❌ Transaction failed!\n`);
        results.push({ id: marketId, success: false });
      }

      // Wait between transactions
      if (i < MARKETS.length - 1) {
        console.log('   ⏳ Waiting 3s...\n');
        await new Promise(r => setTimeout(r, 3000));
      }

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
      results.push({ id: marketId, success: false, error: error.message });
    }
  }

  // Summary
  console.log('═'.repeat(60));
  console.log('📝 SUMMARY');
  console.log('═'.repeat(60) + '\n');

  const successful = results.filter(r => r.success);
  console.log(`✅ Created: ${successful.length}/${MARKETS.length} markets\n`);

  if (successful.length > 0) {
    console.log('📋 Copy this to mockMarkets.ts:\n');
    console.log('─'.repeat(60) + '\n');

    for (const r of successful) {
      console.log(`  {
    id: 'market-${r.id}',
    contractMarketId: ${r.id},
    question: '${r.emoji} ${r.question}',
    description: '${r.type === 'political' ? '🏛️ Political - Semi-auto resolve with Tavily' : '✅ CoinGecko Oracle - Auto resolve'}',
    thumbnail: '${r.emoji}',
    category: '${r.type === 'political' ? 'politics' : 'crypto'}',
    endTime: new Date('${r.endTimeISO}'),
    yesPool: 0,
    noPool: 0,
    status: 'active',
  },`);
      console.log('');
    }

    console.log('─'.repeat(60) + '\n');
    console.log('🎯 Next steps:');
    console.log('   1. Copy the above to src/lib/mockMarkets.ts');
    console.log('   2. git add . && git commit -m "Add markets #9-11" && git push');
    console.log('   3. Vercel will auto-deploy\n');
  }
}

main().catch(console.error);
