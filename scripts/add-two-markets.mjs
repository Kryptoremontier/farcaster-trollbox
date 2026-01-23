#!/usr/bin/env node

/**
 * Add 2 markets for 12-hour test on BASE MAINNET
 * Market #5: BTC Last Digit EVEN
 * Market #6: ETH touch $3,000
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

// 2 MARKETS FOR 12-HOUR TEST
const MARKETS = [
  {
    question: "🎲 Will BTC price last digit be EVEN (0,2,4,6,8) at resolution?",
    endTime: hoursFromNow(12),
    note: "✅ CoinGecko Oracle - 50/50 Fair Game",
    category: "crypto",
    thumbnail: "🎲"
  },
  {
    question: "🚀 Will ETH price touch $3,000 before resolution?",
    endTime: hoursFromNow(12),
    note: "✅ CoinGecko Oracle - Psychological Barrier",
    category: "crypto",
    thumbnail: "🚀"
  }
];

async function addMarkets() {
  try {
    console.log('\n🚀 Adding 2 markets for 12-hour test on BASE MAINNET...\n');
    console.log(`📍 Contract: ${TROLLBET_ETH_ADDRESS}`);
    console.log(`👤 Your address: ${account.address}\n`);

    // Get current market count
    const currentCount = await publicClient.readContract({
      address: TROLLBET_ETH_ADDRESS,
      abi: TROLLBET_ABI,
      functionName: 'marketCount'
    });

    console.log(`📊 Current market count: ${currentCount}`);
    console.log(`📝 Creating markets #${Number(currentCount)} and #${Number(currentCount) + 1}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const createdMarkets = [];

    for (let i = 0; i < MARKETS.length; i++) {
      const market = MARKETS[i];
      const marketId = Number(currentCount) + i;

      console.log(`📝 Market #${marketId}: "${market.question}"`);
      console.log(`   ${market.note}`);
      console.log(`   ⏰ Ends: ${new Date(market.endTime * 1000).toLocaleString()}`);

      try {
        // Create market
        const hash = await walletClient.writeContract({
          address: TROLLBET_ETH_ADDRESS,
          abi: TROLLBET_ABI,
          functionName: 'createMarket',
          args: [market.question, BigInt(market.endTime)]
        });

        console.log(`   📤 TX sent: ${hash}`);

        // Wait for confirmation
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        if (receipt.status === 'success') {
          console.log(`   ✅ Market #${marketId} created successfully!`);
          console.log(`   🔗 https://basescan.org/tx/${hash}\n`);
          
          createdMarkets.push({
            id: marketId,
            question: market.question,
            note: market.note,
            category: market.category,
            thumbnail: market.thumbnail,
            endTime: market.endTime
          });
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

    if (createdMarkets.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('📝 Copy this to mockMarkets.ts:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      console.log('export const MOCK_MARKETS: Market[] = [');
      
      createdMarkets.forEach(market => {
        const endTimeISO = new Date(market.endTime * 1000).toISOString();
        console.log(`  {
    id: 'market-${market.id}',
    contractMarketId: ${market.id},
    question: '${market.question}',
    description: '${market.note}',
    thumbnail: '${market.thumbnail}',
    category: '${market.category}',
    endTime: new Date('${endTimeISO}'), // FIXED timestamp
    yesPool: 0, 
    noPool: 0, 
    totalBettors: 0, 
    status: 'active',
  },`);
      });
      
      console.log('];');
      
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('🎯 Next Steps:');
      console.log('   1. Update mockMarkets.ts with the code above');
      console.log('   2. Push to Vercel');
      console.log('   3. Place test bets');
      console.log('   4. Wait 12 hours for markets to end');
      console.log('   5. Cron bot will auto-resolve\n');
    }

  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

addMarkets();
