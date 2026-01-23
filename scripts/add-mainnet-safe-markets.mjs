#!/usr/bin/env node

/**
 * Add MAINNET-SAFE markets for testing
 * Only BTC Price Digit and ETH Gas markets (fully automated oracles)
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

// Helper: timestamp za X minut
function minutesFromNow(minutes) {
  return Math.floor((Date.now() + minutes * 60 * 1000) / 1000);
}

// MAINNET-SAFE MARKETS ONLY
// These use real oracles (CoinGecko, Etherscan)
const MARKETS = [
  {
    question: "🎲 Will BTC price end with digit 5 in next 10min?",
    endTime: minutesFromNow(10),
    note: "✅ SAFE - CoinGecko Oracle"
  },
  {
    question: "⚡ Will ETH gas be above 15 gwei in 10min?",
    endTime: minutesFromNow(10),
    note: "✅ SAFE - Etherscan Oracle"
  },
  {
    question: "🎲 Will BTC price end with digit 3 in next 10min?",
    endTime: minutesFromNow(10),
    note: "✅ SAFE - CoinGecko Oracle"
  }
];

async function addMarkets() {
  try {
    console.log('🚀 Adding MAINNET-SAFE test markets...\n');
    console.log(`📍 Contract: ${TROLLBET_ETH_ADDRESS}`);
    console.log(`👤 Your address: ${account.address}\n`);

    // Get current market count
    const currentCount = await publicClient.readContract({
      address: TROLLBET_ETH_ADDRESS,
      abi: TROLLBET_ABI,
      functionName: 'marketCount'
    });

    console.log(`📊 Current market count: ${currentCount}`);
    console.log(`📝 Will create ${MARKETS.length} new markets\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < MARKETS.length; i++) {
      const market = MARKETS[i];
      const marketId = Number(currentCount) + successCount;

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
          successCount++;
        } else {
          console.log(`   ❌ Transaction failed!\n`);
          failCount++;
        }

      } catch (error) {
        console.error(`   ❌ Error:`, error.message);
        
        if (error.message.includes('Invalid end time')) {
          console.log(`   💡 Tip: End time must be in the future\n`);
        } else if (error.message.includes('Not owner')) {
          console.log(`   💡 Tip: Only contract owner can create markets\n`);
        }
        
        failCount++;
      }

      // Small delay between transactions
      if (i < MARKETS.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 Summary:');
    console.log(`   ✅ Created: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📈 New market count: ${Number(currentCount) + successCount}\n`);

    if (successCount > 0) {
      console.log('🎯 Next Steps:');
      console.log('   1. Update mockMarkets.ts with the code below');
      console.log('   2. Refresh the app to see new markets');
      console.log('   3. Place test bets on each market');
      console.log('   4. Wait 10 minutes for markets to end');
      console.log('   5. Cron bot will auto-resolve (or run manually)');
      console.log('   6. Claim winnings and verify payouts\n');
      
      console.log('📝 Copy this to mockMarkets.ts:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      for (let i = 0; i < successCount; i++) {
        const marketId = Number(currentCount) + i;
        const market = MARKETS[i];
        const endTimeISO = new Date(market.endTime * 1000).toISOString();
        
        console.log(`  {`);
        console.log(`    id: 'market-${marketId}',`);
        console.log(`    contractMarketId: ${marketId},`);
        console.log(`    question: '${market.question}',`);
        console.log(`    description: '${market.note}',`);
        console.log(`    thumbnail: '${market.question.split(' ')[0]}',`);
        console.log(`    category: 'crypto',`);
        console.log(`    endTime: new Date('${endTimeISO}'), // FIXED timestamp`);
        console.log(`    yesPool: 0, noPool: 0, totalBettors: 0, status: 'active',`);
        console.log(`  },`);
      }
      
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

addMarkets();
