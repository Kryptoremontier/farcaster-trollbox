#!/usr/bin/env node

/**
 * Add SINGLE market for Mainnet launch
 * 30-minute duration to save on gas
 */

import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';

dotenv.config();

const TROLLBET_ETH_ADDRESS = '0x52ABabe88DE8799B374b11B91EC1b32989779e55';

// Full ABI
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

// Check for private key
if (!process.env.DEPLOYER_PRIVATE_KEY) {
  console.error('❌ Error: DEPLOYER_PRIVATE_KEY not found in .env');
  process.exit(1);
}

const account = privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY);

const publicClient = createPublicClient({
  chain: base,
  transport: http()
});

const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http()
});

// Helper: Get timestamp N minutes from now
function minutesFromNow(minutes) {
  return Math.floor(Date.now() / 1000) + (minutes * 60);
}

// SINGLE 30-MINUTE MARKET
const MARKET = {
  question: "🎲 Will BTC price end with digit 5 in next 30min?",
  endTime: minutesFromNow(30),
  note: "✅ MAINNET LAUNCH - CoinGecko Oracle"
};

async function addMarket() {
  try {
    console.log('🚀 Adding SINGLE market for Mainnet launch...\n');
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
      console.log('📝 Copy this to mockMarkets.ts:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      const endTimeISO = new Date(MARKET.endTime * 1000).toISOString();
      
      console.log(`  {
    id: 'market-${marketId}',
    contractMarketId: ${marketId},
    question: '${MARKET.question}',
    description: '${MARKET.note}',
    thumbnail: '🎲',
    category: 'crypto',
    endTime: new Date('${endTimeISO}'), // FIXED timestamp
    yesPool: 0, 
    noPool: 0, 
    totalBettors: 0, 
    status: 'active',
  },`);
      
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('🎯 Next Steps:');
      console.log('   1. Update mockMarkets.ts with the code above');
      console.log('   2. Refresh the app to see the new market');
      console.log('   3. Place test bets');
      console.log('   4. Wait 30 minutes for market to end');
      console.log('   5. Cron bot will auto-resolve\n');
      
    } else {
      console.log(`   ❌ Transaction failed!\n`);
    }

  } catch (error) {
    console.error(`   ❌ Error:`, error.message);
    
    if (error.message.includes('Invalid end time')) {
      console.log(`   💡 Tip: End time must be in the future\n`);
    } else if (error.message.includes('Not owner')) {
      console.log(`   💡 Tip: Only contract owner can create markets\n`);
    }
  }
}

addMarket();
