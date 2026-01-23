#!/usr/bin/env node

/**
 * Check ALL Markets on BASE MAINNET
 */

import { createPublicClient, http, formatEther } from 'viem';
import { base } from 'viem/chains';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.mainnet') });

const TROLLBET_ETH_ADDRESS = '0x52ABabe88DE8799B374b11B91EC1b32989779e55';

const ABI = [
  {
    type: 'function',
    name: 'markets',
    inputs: [{ name: 'marketId', type: 'uint256' }],
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
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'marketCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'accumulatedFees',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  }
];

const rpcUrl = process.env.BASE_MAINNET_RPC_URL || 'https://mainnet.base.org';

const client = createPublicClient({
  chain: base,
  transport: http(rpcUrl)
});

async function checkAll() {
  console.log(`\n🚀 BASE MAINNET - ALL MARKETS CHECK`);
  console.log(`📍 Contract: ${TROLLBET_ETH_ADDRESS}\n`);

  // Get market count
  const marketCount = await client.readContract({
    address: TROLLBET_ETH_ADDRESS,
    abi: ABI,
    functionName: 'marketCount'
  });

  console.log(`📊 Total Markets: ${marketCount}\n`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  // Check each market
  for (let i = 0; i < Number(marketCount); i++) {
    try {
      const marketData = await client.readContract({
        address: TROLLBET_ETH_ADDRESS,
        abi: ABI,
        functionName: 'markets',
        args: [BigInt(i)]
      });

      const [question, endTime, yesPool, noPool, resolved, winningSide, exists, cancelled] = marketData;

      if (!exists) {
        console.log(`Market #${i}: ❌ Does not exist\n`);
        continue;
      }

      const totalPool = yesPool + noPool;
      const now = Math.floor(Date.now() / 1000);
      const timeLeft = Number(endTime) - now;

      console.log(`Market #${i}:`);
      console.log(`  ❓ ${question}`);
      console.log(`  ⏰ ${timeLeft > 0 ? `${Math.floor(timeLeft / 60)}m left` : 'ENDED'}`);
      console.log(`  💰 YES: ${formatEther(yesPool)} ETH | NO: ${formatEther(noPool)} ETH | TOTAL: ${formatEther(totalPool)} ETH`);
      console.log(`  🎯 Resolved: ${resolved ? '✅' : '❌'} | Winner: ${resolved ? (winningSide ? '🟢 YES' : '🔴 NO') : 'N/A'} | Cancelled: ${cancelled ? '⚠️' : '✅'}`);
      console.log(``);

    } catch (error) {
      console.log(`Market #${i}: ❌ Error - ${error.message}\n`);
    }
  }

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  // Check accumulated fees
  const fees = await client.readContract({
    address: TROLLBET_ETH_ADDRESS,
    abi: ABI,
    functionName: 'accumulatedFees'
  });

  console.log(`💰 ACCUMULATED FEES: ${formatEther(fees)} ETH ($${(parseFloat(formatEther(fees)) * 3500).toFixed(2)})\n`);
}

checkAll()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
