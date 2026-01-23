import { createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

// TrollBetETH Contract Address
const TROLLBET_ADDRESS = '0xc629e67E221db99CF2A6e0468907bBcFb7D5f5A3';

// Contract ABI (tylko createMarket)
const ABI = [
  {
    type: 'function',
    name: 'createMarket',
    inputs: [
      { name: 'question', type: 'string' },
      { name: 'endTime', type: 'uint256' }
    ],
    outputs: [{ name: 'marketId', type: 'uint256' }],
    stateMutability: 'nonpayable'
  }
];

// Helper: timestamp za X minut
function minutesFromNow(minutes) {
  return Math.floor((Date.now() + minutes * 60 * 1000) / 1000);
}

// Markety do dodania
const MARKETS = [
  // TEST MARKETS (30 minut) - do sprawdzenia wypłat
  {
    question: "Will BTC price end with digit 5 in next 30min?",
    endTime: minutesFromNow(30),
    note: "TEST - 30min"
  },
  {
    question: "Will ETH/BTC ratio be above 0.04 in 30min?",
    endTime: minutesFromNow(30),
    note: "TEST - 30min"
  },
  {
    question: "Will any whale move >1000 ETH in next 30min?",
    endTime: minutesFromNow(30),
    note: "TEST - 30min"
  },
  
  // REAL MARKETS (UPDATED TIMESTAMPS)
  {
    question: "Will $DEGEN hit $0.10 this week?",
    endTime: minutesFromNow(7 * 24 * 60), // 7 days
    note: "7 days"
  },
  {
    question: "Will Elon Musk post a Pepe meme today?",
    endTime: minutesFromNow(18 * 60), // 18 hours
    note: "18 hours"
  },
  {
    question: "Will Base TVL exceed $2B this month?",
    endTime: minutesFromNow(15 * 24 * 60), // 15 days
    note: "15 days"
  },
  {
    question: "Will Vitalik tweet about AI this week?",
    endTime: minutesFromNow(5 * 24 * 60), // 5 days
    note: "5 days"
  },
  {
    question: "Will Farcaster hit 500K users this quarter?",
    endTime: minutesFromNow(60 * 24 * 60), // 60 days
    note: "60 days"
  },
  {
    question: "Will any Pudgy Penguin sell for >100 ETH this month?",
    endTime: minutesFromNow(20 * 24 * 60), // 20 days
    note: "20 days"
  },
  {
    question: "Will ETH be above $3000 on Merge anniversary?",
    endTime: minutesFromNow(30 * 24 * 60), // 30 days
    note: "30 days"
  },
  {
    question: "Will Trump mention crypto in next debate?",
    endTime: minutesFromNow(45 * 24 * 60), // 45 days
    note: "45 days"
  },
  {
    question: "Will SEC approve spot ETH ETF this quarter?",
    endTime: minutesFromNow(74 * 24 * 60), // 74 days
    note: "74 days"
  }
];

async function main() {
  console.log('🚀 TrollBetETH - Batch Market Creator\n');
  
  // Sprawdź czy jest private key
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ Error: DEPLOYER_PRIVATE_KEY not found in .env');
    console.log('\n📝 Create .env file with:');
    console.log('DEPLOYER_PRIVATE_KEY=0xyour_private_key_here\n');
    process.exit(1);
  }

  // Setup account i client
  const account = privateKeyToAccount(privateKey);
  const client = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http()
  });

  console.log(`📍 Contract: ${TROLLBET_ADDRESS}`);
  console.log(`👤 Owner: ${account.address}`);
  console.log(`🌐 Network: Base Sepolia\n`);
  console.log(`📋 Markets to create: ${MARKETS.length}\n`);

  // Dodaj każdy market
  for (let i = 0; i < MARKETS.length; i++) {
    const market = MARKETS[i];
    console.log(`\n[${i + 1}/${MARKETS.length}] Creating market...`);
    console.log(`   Question: ${market.question}`);
    console.log(`   End Time: ${market.endTime} (${market.note})`);

    try {
      const hash = await client.writeContract({
        address: TROLLBET_ADDRESS,
        abi: ABI,
        functionName: 'createMarket',
        args: [market.question, BigInt(market.endTime)]
      });

      console.log(`   ✅ Transaction sent: ${hash}`);
      console.log(`   🔗 https://sepolia.basescan.org/tx/${hash}`);
      
      // Czekaj 2 sekundy między transakcjami
      if (i < MARKETS.length - 1) {
        console.log('   ⏳ Waiting 2s before next...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      console.log('   Continuing with next market...');
    }
  }

  console.log('\n\n✅ All markets created!');
  console.log('\n📊 Summary:');
  console.log(`   - Total markets: ${MARKETS.length}`);
  console.log(`   - Test markets (30min): 3`);
  console.log(`   - Real markets: ${MARKETS.length - 3}`);
  console.log('\n🎯 Next steps:');
  console.log('   1. Wait for transactions to confirm');
  console.log('   2. Refresh your app');
  console.log('   3. Test betting on 30min markets');
  console.log('   4. Resolve test markets after 30min');
  console.log('   5. Check if winnings are distributed correctly\n');
}

main().catch(console.error);
