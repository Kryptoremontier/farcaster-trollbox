#!/usr/bin/env node

/**
 * Script to check accumulated fees in TrollBetETH contract
 */

import { createPublicClient, http, formatEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import dotenv from 'dotenv';

dotenv.config();

const TROLLBET_ETH_ADDRESS = '0xc629e67E221db99CF2A6e0468907bBcFb7D5f5A3';

// Minimal ABI for reading accumulatedFees
const ABI = [
  {
    "inputs": [],
    "name": "accumulatedFees",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const client = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

async function checkFees() {
  try {
    console.log('🔍 Checking TrollBetETH Contract Fees...\n');
    console.log(`📍 Contract: ${TROLLBET_ETH_ADDRESS}\n`);

    // Get accumulated fees
    const fees = await client.readContract({
      address: TROLLBET_ETH_ADDRESS,
      abi: ABI,
      functionName: 'accumulatedFees'
    });

    // Get owner
    const owner = await client.readContract({
      address: TROLLBET_ETH_ADDRESS,
      abi: ABI,
      functionName: 'owner'
    });

    // Get contract balance
    const contractBalance = await client.getBalance({
      address: TROLLBET_ETH_ADDRESS
    });

    console.log('💰 Fee Information:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Accumulated Fees:    ${formatEther(fees)} ETH`);
    console.log(`Contract Balance:    ${formatEther(contractBalance)} ETH`);
    console.log(`Owner Address:       ${owner}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (fees > 0n) {
      console.log('✅ There are fees available to withdraw!');
      console.log(`💡 To withdraw, run: node scripts/withdraw-fees.mjs\n`);
    } else {
      console.log('ℹ️  No fees accumulated yet.\n');
    }

    // Calculate fee breakdown
    const feesInWei = Number(fees);
    const balanceInWei = Number(contractBalance);
    const lockedInBets = balanceInWei - feesInWei;

    console.log('📊 Breakdown:');
    console.log(`   Fees (withdrawable):  ${formatEther(BigInt(feesInWei))} ETH`);
    console.log(`   Locked in bets:       ${formatEther(BigInt(lockedInBets))} ETH`);
    console.log(`   Total:                ${formatEther(contractBalance)} ETH\n`);

  } catch (error) {
    console.error('❌ Error checking fees:', error.message);
    process.exit(1);
  }
}

checkFees();
