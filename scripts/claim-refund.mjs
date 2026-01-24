#!/usr/bin/env node
/**
 * Claim refunds for cancelled markets
 * Usage: node claim-refund.mjs <marketId>
 */

import { config } from 'dotenv';
import { createWalletClient, createPublicClient, http, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env.mainnet
config({ path: '.env.mainnet' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TrollBetABI = JSON.parse(readFileSync(join(__dirname, '../src/lib/abi/TrollBet.json'), 'utf8'));

const TROLLBET_ETH_ADDRESS = process.env.MAINNET_CONTRACT_ADDRESS;
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

if (!TROLLBET_ETH_ADDRESS || !DEPLOYER_PRIVATE_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('Required: MAINNET_CONTRACT_ADDRESS, DEPLOYER_PRIVATE_KEY');
  process.exit(1);
}

const marketId = process.argv[2];
if (!marketId) {
  console.error('❌ Usage: node claim-refund.mjs <marketId>');
  process.exit(1);
}

const account = privateKeyToAccount(`0x${DEPLOYER_PRIVATE_KEY.replace(/^0x/, '')}`);

const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_MAINNET_RPC_URL || 'https://mainnet.base.org')
});

const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(process.env.BASE_MAINNET_RPC_URL || 'https://mainnet.base.org')
});

console.log(`\n🚀 CLAIM REFUND - BASE MAINNET`);
console.log(`📍 Contract: ${TROLLBET_ETH_ADDRESS}`);
console.log(`👤 Claimer: ${account.address}`);
console.log(`🎯 Market ID: ${marketId}\n`);

async function main() {
  try {
    // Get market info
    const market = await publicClient.readContract({
      address: TROLLBET_ETH_ADDRESS,
      abi: TrollBetABI,
      functionName: 'markets',
      args: [BigInt(marketId)]
    });

    const [question, endTime, yesPool, noPool, resolved, winningSide, exists, cancelled] = market;

    console.log(`📊 Market Info:`);
    console.log(`   Question: ${question}`);
    console.log(`   Cancelled: ${cancelled ? '✅' : '❌'}`);
    console.log(`   YES Pool: ${formatEther(yesPool)} ETH`);
    console.log(`   NO Pool: ${formatEther(noPool)} ETH`);
    console.log(`   Total: ${formatEther(yesPool + noPool)} ETH\n`);

    if (!cancelled) {
      console.log(`❌ Market is not cancelled - cannot claim refund!`);
      process.exit(1);
    }

    // Get user bet
    const userBet = await publicClient.readContract({
      address: TROLLBET_ETH_ADDRESS,
      abi: TrollBetABI,
      functionName: 'getUserBet',
      args: [BigInt(marketId), account.address]
    });

    const [yesAmount, noAmount, claimed] = userBet;
    const totalBet = yesAmount + noAmount;

    console.log(`💰 Your Bet:`);
    console.log(`   YES: ${formatEther(yesAmount)} ETH`);
    console.log(`   NO: ${formatEther(noAmount)} ETH`);
    console.log(`   Total: ${formatEther(totalBet)} ETH`);
    console.log(`   Claimed: ${claimed ? '✅' : '❌'}\n`);

    if (totalBet === 0n) {
      console.log(`⚠️  You have no bets on this market!`);
      process.exit(0);
    }

    if (claimed) {
      console.log(`✅ You already claimed your refund!`);
      process.exit(0);
    }

    console.log(`🔄 Claiming refund...`);

    const hash = await walletClient.writeContract({
      address: TROLLBET_ETH_ADDRESS,
      abi: TrollBetABI,
      functionName: 'claimRefund',
      args: [BigInt(marketId)]
    });

    console.log(`   📤 TX sent: ${hash}`);
    console.log(`   🔗 https://basescan.org/tx/${hash}\n`);

    console.log(`⏳ Waiting for confirmation...`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      console.log(`\n✅ REFUND CLAIMED SUCCESSFULLY!`);
      console.log(`💰 Refunded: ${formatEther(totalBet)} ETH`);
    } else {
      console.log(`\n❌ Transaction failed!`);
      process.exit(1);
    }

  } catch (error) {
    console.error(`\n❌ Error:`, error.message);
    process.exit(1);
  }
}

main();
