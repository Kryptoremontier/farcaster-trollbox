#!/usr/bin/env node

/**
 * Check Market State on BASE MAINNET
 * Usage: node scripts/check-mainnet-market.mjs [marketId] [userAddress]
 */

import { createPublicClient, http, formatEther, getAddress } from 'viem';
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
    name: 'getUserBet',
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'user', type: 'address' }
    ],
    outputs: [
      { name: 'yesAmount', type: 'uint256' },
      { name: 'noAmount', type: 'uint256' },
      { name: 'claimed', type: 'bool' }
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

async function checkMarket(marketId, userAddress) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 MARKET #${marketId}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  try {
    const marketData = await client.readContract({
      address: TROLLBET_ETH_ADDRESS,
      abi: ABI,
      functionName: 'markets',
      args: [BigInt(marketId)]
    });

    const [question, endTime, yesPool, noPool, resolved, winningSide, exists, cancelled] = marketData;
    
    if (!exists) {
      console.log(`❌ Market #${marketId} does not exist!\n`);
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const timeLeft = Number(endTime) - now;
    const endDate = new Date(Number(endTime) * 1000);

    console.log(`❓ Question: ${question}`);
    console.log(`⏰ End Time: ${endDate.toLocaleString()}`);
    
    if (timeLeft > 0) {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      console.log(`⏳ Time Left: ${minutes}m ${seconds}s`);
    } else {
      console.log(`⏳ Time Left: ENDED`);
    }
    
    console.log(`\n💰 POOLS:`);
    console.log(`   YES: ${formatEther(yesPool)} ETH`);
    console.log(`   NO:  ${formatEther(noPool)} ETH`);
    console.log(`   TOTAL: ${formatEther(yesPool + noPool)} ETH`);
    
    console.log(`\n🎯 STATUS:`);
    console.log(`   Resolved: ${resolved ? '✅ YES' : '❌ NO'}`);
    if (resolved) {
      console.log(`   Winner: ${winningSide ? '🟢 YES' : '🔴 NO'}`);
    }
    console.log(`   Cancelled: ${cancelled ? '⚠️ YES' : '✅ NO'}`);

    if (userAddress) {
      console.log(`\n👤 USER BET (${userAddress}):`);
      
      const userBet = await client.readContract({
        address: TROLLBET_ETH_ADDRESS,
        abi: ABI,
        functionName: 'getUserBet',
        args: [BigInt(marketId), userAddress]
      });

      const [yesAmount, noAmount, claimed] = userBet;

      console.log(`   YES: ${formatEther(yesAmount)} ETH`);
      console.log(`   NO:  ${formatEther(noAmount)} ETH`);
      console.log(`   Claimed: ${claimed ? '✅ YES' : '❌ NO'}`);

      // Calculate payout if resolved
      if (resolved && !cancelled) {
        const totalPool = yesPool + noPool;
        const winningPool = winningSide ? yesPool : noPool;
        const userWinningBet = winningSide ? yesAmount : noAmount;

        if (userWinningBet > 0n && totalPool > 0n && winningPool > 0n) {
          const grossPayout = (userWinningBet * totalPool) / winningPool;
          const fee = (grossPayout * 250n) / 10000n; // 2.5% fee
          const netPayout = grossPayout - fee;

          console.log(`\n💸 PAYOUT CALCULATION:`);
          console.log(`   Gross:     ${formatEther(grossPayout)} ETH`);
          console.log(`   Fee (2.5%): ${formatEther(fee)} ETH`);
          console.log(`   Net:       ${formatEther(netPayout)} ETH`);
          
          if (!claimed) {
            console.log(`\n   🎉 YOU WON! Claim your ${formatEther(netPayout)} ETH!`);
          } else {
            console.log(`\n   ✅ Already claimed!`);
          }
        } else {
          console.log(`\n   ❌ You didn't win this market`);
        }
      }
    }

  } catch (error) {
    console.error(`❌ Error checking market #${marketId}:`, error.message);
  }
}

async function checkFees() {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`💰 ACCUMULATED FEES`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  try {
    const fees = await client.readContract({
      address: TROLLBET_ETH_ADDRESS,
      abi: ABI,
      functionName: 'accumulatedFees'
    });

    console.log(`💵 Total Fees: ${formatEther(fees)} ETH`);
    console.log(`💲 USD Value (@ $3,500/ETH): $${(parseFloat(formatEther(fees)) * 3500).toFixed(2)}`);
    
  } catch (error) {
    console.error(`❌ Error checking fees:`, error.message);
  }
}

async function checkAll() {
  console.log(`\n🚀 BASE MAINNET - TROLLBET CONTRACT CHECK`);
  console.log(`📍 Contract: ${TROLLBET_ETH_ADDRESS}`);
  console.log(`🌐 RPC: ${rpcUrl}\n`);

  // Get market count
  const marketCount = await client.readContract({
    address: TROLLBET_ETH_ADDRESS,
    abi: ABI,
    functionName: 'marketCount'
  });

  console.log(`📊 Total Markets: ${marketCount}\n`);

  // Get user addresses from command line or use defaults
  const args = process.argv.slice(2);
  const marketId = args[0] ? parseInt(args[0]) : 4; // Default to Market #4
  const userAddress = args[1] || '0xeE47a707A1d91Fd634285043EB8ae082429745FD'; // Default to your address

  // Check specific market
  await checkMarket(marketId, userAddress);

  // Check accumulated fees
  await checkFees();

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

checkAll()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
