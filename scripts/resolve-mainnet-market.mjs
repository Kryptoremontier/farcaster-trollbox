#!/usr/bin/env node

/**
 * Manually resolve a single market on BASE MAINNET
 * Usage: node scripts/resolve-mainnet-market.mjs <marketId> <true|false>
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

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('\n📋 Usage: node scripts/resolve-mainnet-market.mjs <marketId> <winningSide>');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/resolve-mainnet-market.mjs 16 true   # Market 16 → YES wins');
    console.log('  node scripts/resolve-mainnet-market.mjs 17 false  # Market 17 → NO wins');
    console.log('');
    process.exit(1);
  }

  const marketId = parseInt(args[0]);
  const winningSide = args[1].toLowerCase() === 'true';

  if (isNaN(marketId)) {
    console.error('❌ Invalid market ID');
    process.exit(1);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('🎯 RESOLVE MAINNET MARKET');
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

  // Get market info
  const marketData = await publicClient.readContract({
    address: TROLLBET_ETH_ADDRESS,
    abi: TROLLBET_ABI,
    functionName: 'markets',
    args: [BigInt(marketId)]
  });

  const [question, endTime, yesPool, noPool, resolved, existingWinningSide, exists, cancelled] = marketData;

  if (!exists) {
    console.error(`❌ Market #${marketId} does not exist`);
    process.exit(1);
  }

  console.log(`📊 Market #${marketId}:`);
  console.log(`  ❓ ${question}`);
  console.log(`  ⏰ End Time: ${new Date(Number(endTime) * 1000).toISOString()}`);
  console.log(`  💰 YES: ${formatEther(yesPool)} ETH | NO: ${formatEther(noPool)} ETH`);
  console.log(`  🎯 Resolved: ${resolved ? '✅' : '❌'} | Cancelled: ${cancelled ? '⚠️' : '✅'}\n`);

  if (resolved) {
    console.log(`⚠️  Market already resolved! Winner: ${existingWinningSide ? 'YES' : 'NO'}`);
    process.exit(0);
  }

  if (cancelled) {
    console.log(`⚠️  Market is cancelled!`);
    process.exit(0);
  }

  // Check if ended
  const now = Math.floor(Date.now() / 1000);
  if (Number(endTime) > now) {
    console.error(`❌ Market has not ended yet! Time remaining: ${Math.floor((Number(endTime) - now) / 60)} minutes`);
    process.exit(1);
  }

  console.log(`🎲 Resolving as: ${winningSide ? '✅ YES WINS' : '❌ NO WINS'}\n`);
  console.log('─'.repeat(60) + '\n');

  try {
    const hash = await walletClient.writeContract({
      address: TROLLBET_ETH_ADDRESS,
      abi: TROLLBET_ABI,
      functionName: 'resolveMarket',
      args: [BigInt(marketId), winningSide]
    });

    console.log(`📤 Transaction sent: ${hash}`);
    console.log(`🔗 View: https://basescan.org/tx/${hash}\n`);
    console.log(`⏳ Waiting for confirmation...`);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      console.log(`\n✅ Market #${marketId} resolved successfully!`);
      console.log(`   Winner: ${winningSide ? '🟢 YES' : '🔴 NO'}`);
      console.log(`   Winners can now claim their payouts! 💰\n`);
    } else {
      console.log(`\n❌ Transaction failed!`);
    }

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }

  console.log('═'.repeat(60) + '\n');
}

main().catch(console.error);
