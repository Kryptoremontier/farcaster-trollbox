#!/usr/bin/env node

/**
 * Cancel a market on BASE MAINNET (allows 100% refunds)
 * Usage: node scripts/cancel-market.mjs <marketId>
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
    inputs: [{ name: 'marketId', type: 'uint256' }],
    name: 'cancelMarket',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('\n📋 Usage: node scripts/cancel-market.mjs <marketId>');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/cancel-market.mjs 16   # Cancel market 16');
    console.log('');
    process.exit(1);
  }

  const marketId = parseInt(args[0]);

  if (isNaN(marketId)) {
    console.error('❌ Invalid market ID');
    process.exit(1);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('🔄 CANCEL MAINNET MARKET (100% REFUNDS)');
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
  console.log(`👤 Owner: ${account.address}\n`);

  // Get market info
  const marketData = await publicClient.readContract({
    address: TROLLBET_ETH_ADDRESS,
    abi: TROLLBET_ABI,
    functionName: 'markets',
    args: [BigInt(marketId)]
  });

  const [question, endTime, yesPool, noPool, resolved, winningSide, exists, cancelled] = marketData;

  if (!exists) {
    console.error(`❌ Market #${marketId} does not exist`);
    process.exit(1);
  }

  console.log(`📊 Market #${marketId}:`);
  console.log(`  ❓ ${question}`);
  console.log(`  ⏰ End Time: ${new Date(Number(endTime) * 1000).toISOString()}`);
  console.log(`  💰 YES: ${formatEther(yesPool)} ETH | NO: ${formatEther(noPool)} ETH`);
  console.log(`  🎯 Resolved: ${resolved ? '✅' : '❌'} | Cancelled: ${cancelled ? '⚠️ Yes' : '❌ No'}\n`);

  if (resolved) {
    console.log(`⚠️  Market already resolved!`);
    process.exit(0);
  }

  if (cancelled) {
    console.log(`⚠️  Market already cancelled!`);
    process.exit(0);
  }

  const totalPool = yesPool + noPool;
  console.log(`🔄 Cancelling market - users can claim 100% refund`);
  console.log(`   Total to refund: ${formatEther(totalPool)} ETH\n`);
  console.log('─'.repeat(60) + '\n');

  try {
    const hash = await walletClient.writeContract({
      address: TROLLBET_ETH_ADDRESS,
      abi: TROLLBET_ABI,
      functionName: 'cancelMarket',
      args: [BigInt(marketId)]
    });

    console.log(`📤 Transaction sent: ${hash}`);
    console.log(`🔗 View: https://basescan.org/tx/${hash}\n`);
    console.log(`⏳ Waiting for confirmation...`);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      console.log(`\n✅ Market #${marketId} cancelled successfully!`);
      console.log(`   Users can now claim refunds via claimRefund(${marketId})\n`);
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
