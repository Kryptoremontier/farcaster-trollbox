#!/usr/bin/env node

/**
 * Script to withdraw accumulated fees from TrollBetETH contract
 * ONLY the contract owner can call this function
 */

import { createWalletClient, createPublicClient, http, formatEther, parseEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';

dotenv.config();

const TROLLBET_ETH_ADDRESS = '0xc629e67E221db99CF2A6e0468907bBcFb7D5f5A3';

// Full ABI for withdrawFees
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
  },
  {
    "inputs": [],
    "name": "withdrawFees",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Check for private key
if (!process.env.DEPLOYER_PRIVATE_KEY) {
  console.error('❌ Error: DEPLOYER_PRIVATE_KEY not found in .env');
  console.log('💡 Add your private key to .env file:');
  console.log('   DEPLOYER_PRIVATE_KEY=0xyour_private_key_here\n');
  process.exit(1);
}

const account = privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY);

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http()
});

async function withdrawFees() {
  try {
    console.log('💰 Withdrawing Fees from TrollBetETH Contract...\n');
    console.log(`📍 Contract: ${TROLLBET_ETH_ADDRESS}`);
    console.log(`👤 Your address: ${account.address}\n`);

    // Check if caller is owner
    const owner = await publicClient.readContract({
      address: TROLLBET_ETH_ADDRESS,
      abi: ABI,
      functionName: 'owner'
    });

    if (owner.toLowerCase() !== account.address.toLowerCase()) {
      console.error('❌ Error: You are not the contract owner!');
      console.log(`   Contract owner: ${owner}`);
      console.log(`   Your address:   ${account.address}\n`);
      process.exit(1);
    }

    // Get accumulated fees
    const fees = await publicClient.readContract({
      address: TROLLBET_ETH_ADDRESS,
      abi: ABI,
      functionName: 'accumulatedFees'
    });

    if (fees === 0n) {
      console.log('ℹ️  No fees to withdraw. Accumulated fees: 0 ETH\n');
      process.exit(0);
    }

    console.log(`💵 Accumulated fees: ${formatEther(fees)} ETH\n`);

    // Get balance before
    const balanceBefore = await publicClient.getBalance({
      address: account.address
    });

    console.log('📤 Sending withdrawFees transaction...');

    // Call withdrawFees
    const hash = await walletClient.writeContract({
      address: TROLLBET_ETH_ADDRESS,
      abi: ABI,
      functionName: 'withdrawFees'
    });

    console.log(`   Transaction hash: ${hash}`);
    console.log(`   🔗 https://sepolia.basescan.org/tx/${hash}\n`);

    // Wait for confirmation
    console.log('⏳ Waiting for confirmation...');
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      console.log('✅ Fees withdrawn successfully!\n');

      // Get balance after
      const balanceAfter = await publicClient.getBalance({
        address: account.address
      });

      const received = balanceAfter - balanceBefore;
      const gasUsed = receipt.gasUsed * receipt.effectiveGasPrice;

      console.log('💰 Results:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`   Fees withdrawn:      ${formatEther(fees)} ETH`);
      console.log(`   Gas used:            ${formatEther(gasUsed)} ETH`);
      console.log(`   Net received:        ${formatEther(received)} ETH`);
      console.log(`   Balance before:      ${formatEther(balanceBefore)} ETH`);
      console.log(`   Balance after:       ${formatEther(balanceAfter)} ETH`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      console.log('🎉 Withdrawal complete!\n');
    } else {
      console.error('❌ Transaction failed!');
      console.log(`   Status: ${receipt.status}`);
      console.log(`   Block: ${receipt.blockNumber}\n`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error withdrawing fees:', error.message);
    
    if (error.message.includes('NoFeesToWithdraw')) {
      console.log('💡 The contract has no fees to withdraw.\n');
    } else if (error.message.includes('OwnableUnauthorizedAccount')) {
      console.log('💡 Only the contract owner can withdraw fees.\n');
    }
    
    process.exit(1);
  }
}

withdrawFees();
