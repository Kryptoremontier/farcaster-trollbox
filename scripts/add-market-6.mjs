#!/usr/bin/env node

/**
 * Add Market #6: ETH touch $3,000
 */

import { createPublicClient, createWalletClient, http } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.mainnet') });

const TROLLBET_ETH_ADDRESS = '0x52ABabe88DE8799B374b11B91EC1b32989779e55';

const TROLLBET_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "question", "type": "string"},
      {"internalType": "uint256", "name": "endTime", "type": "uint256"}
    ],
    "name": "createMarket",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "marketCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

if (!process.env.DEPLOYER_PRIVATE_KEY) {
  console.error('❌ Error: DEPLOYER_PRIVATE_KEY not found in .env.mainnet');
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

// Helper: Get timestamp N hours from now
function hoursFromNow(hours) {
  return Math.floor(Date.now() / 1000) + (hours * 60 * 60);
}

const MARKET = {
  question: "🚀 Will ETH price touch $3,000 before resolution?",
  endTime: hoursFromNow(12),
  note: "✅ CoinGecko Oracle - Psychological Barrier",
  category: "crypto",
  thumbnail: "🚀"
};

async function addMarket() {
  try {
    console.log('\n🚀 Adding Market #6 on BASE MAINNET...\n');
    console.log(`📍 Contract: ${TROLLBET_ETH_ADDRESS}`);
    console.log(`👤 Your address: ${account.address}\n`);

    // Get current market count
    const currentCount = await publicClient.readContract({
      address: TROLLBET_ETH_ADDRESS,
      abi: TROLLBET_ABI,
      functionName: 'marketCount'
    });

    const marketId = Number(currentCount);

    console.log(`📊 Current market count: ${currentCount}`);
    console.log(`📝 Creating market #${marketId}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`📝 Market #${marketId}: "${MARKET.question}"`);
    console.log(`   ${MARKET.note}`);
    console.log(`   ⏰ Ends: ${new Date(MARKET.endTime * 1000).toLocaleString()}`);

    // Create market
    const hash = await walletClient.writeContract({
      address: TROLLBET_ETH_ADDRESS,
      abi: TROLLBET_ABI,
      functionName: 'createMarket',
      args: [MARKET.question, BigInt(MARKET.endTime)]
    });

    console.log(`   📤 TX sent: ${hash}`);

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      console.log(`   ✅ Market #${marketId} created successfully!`);
      console.log(`   🔗 https://basescan.org/tx/${hash}\n`);
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('📝 Add this to mockMarkets.ts:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      const endTimeISO = new Date(MARKET.endTime * 1000).toISOString();
      
      console.log(`  {
    id: 'market-${marketId}',
    contractMarketId: ${marketId},
    question: '${MARKET.question}',
    description: '${MARKET.note}',
    thumbnail: '${MARKET.thumbnail}',
    category: '${MARKET.category}',
    endTime: new Date('${endTimeISO}'), // FIXED timestamp
    yesPool: 0, 
    noPool: 0, 
    totalBettors: 0, 
    status: 'active',
  },`);
      
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } else {
      console.log(`   ❌ Transaction failed!\n`);
    }

  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

addMarket();
