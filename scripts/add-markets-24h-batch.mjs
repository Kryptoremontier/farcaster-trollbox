#!/usr/bin/env node

/**
 * Add 8 new 24h markets - January 26, 2026
 * All auto-resolve via CoinGecko oracle
 */

import { createPublicClient, createWalletClient, http } from 'viem';
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

// 24 hours from now
const endTime24h = Math.floor(Date.now() / 1000) + (24 * 60 * 60);

// All 8 markets
const MARKETS = [
  {
    question: "Will BTC price last digit be EVEN (0,2,4,6,8) at resolution?",
    endTime: endTime24h,
    emoji: '🎲',
    category: 'crypto'
  },
  {
    question: "Will BTC price be above $88,000 at resolution time?",
    endTime: endTime24h,
    emoji: '₿',
    category: 'crypto'
  },
  {
    question: "Will ETH price be above $2,900 at resolution time?",
    endTime: endTime24h,
    emoji: 'Ξ',
    category: 'crypto'
  },
  {
    question: "Will BTC price be above $85,000 at resolution time?",
    endTime: endTime24h,
    emoji: '₿',
    category: 'crypto'
  },
  {
    question: "Will BTC price be above $90,000 at resolution time?",
    endTime: endTime24h,
    emoji: '🚀',
    category: 'crypto'
  },
  {
    question: "Will ETH price be above $3,000 at resolution time?",
    endTime: endTime24h,
    emoji: '🚀',
    category: 'crypto'
  },
  {
    question: "Will SOL price be above $125 at resolution time?",
    endTime: endTime24h,
    emoji: '◎',
    category: 'crypto'
  },
  {
    question: "Will SOL price be above $115 at resolution time?",
    endTime: endTime24h,
    emoji: '◎',
    category: 'crypto'
  }
];

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('🚀 ADDING 8 NEW 24H MARKETS TO BASE MAINNET');
  console.log('═'.repeat(60) + '\n');

  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    console.error('❌ DEPLOYER_PRIVATE_KEY not found');
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
  console.log(`👤 Deployer: ${account.address}`);
  console.log(`⏰ End Time: ${new Date(endTime24h * 1000).toISOString()} (24h)\n`);

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

    console.log(`${market.emoji} Market #${marketId}: "${market.question}"`);

    try {
      const hash = await walletClient.writeContract({
        address: TROLLBET_ETH_ADDRESS,
        abi: TROLLBET_ABI,
        functionName: 'createMarket',
        args: [market.question, BigInt(market.endTime)]
      });

      console.log(`   📤 TX: ${hash}`);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === 'success') {
        console.log(`   ✅ Created!\n`);
        results.push({
          id: marketId,
          question: market.question,
          emoji: market.emoji,
          success: true
        });
      } else {
        console.log(`   ❌ Failed!\n`);
        results.push({ id: marketId, success: false });
      }

      // Wait between transactions
      if (i < MARKETS.length - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
      results.push({ id: marketId, success: false });
    }
  }

  // Summary
  console.log('═'.repeat(60));
  console.log('📝 SUMMARY');
  console.log('═'.repeat(60) + '\n');

  const successful = results.filter(r => r.success);
  console.log(`✅ Created: ${successful.length}/${MARKETS.length} markets\n`);

  const endTimeISO = new Date(endTime24h * 1000).toISOString();

  if (successful.length > 0) {
    console.log('📋 Copy this to mockMarkets.ts:\n');
    console.log('─'.repeat(60) + '\n');

    for (const r of successful) {
      console.log(`  {
    id: 'market-${r.id}',
    contractMarketId: ${r.id},
    question: '${r.emoji} ${r.question}',
    description: '✅ CoinGecko Oracle - Auto resolve',
    thumbnail: '${r.emoji}',
    category: 'crypto',
    endTime: new Date('${endTimeISO}'),
    yesPool: 0,
    noPool: 0,
    status: 'active',
  },`);
    }

    console.log('\n' + '─'.repeat(60));
  }
}

main().catch(console.error);
