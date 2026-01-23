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

// TEST MARKETS - wszystkie na 10 minut
const TEST_MARKETS = [
  {
    question: "🎲 Will BTC price end with digit 7 in next 10min?",
    endTime: minutesFromNow(10),
    note: "TEST - Quick payout test"
  },
  {
    question: "⚡ Will ETH gas be above 20 gwei in 10min?",
    endTime: minutesFromNow(10),
    note: "TEST - Quick payout test"
  },
  {
    question: "🐋 Will any whale move >500 ETH in next 10min?",
    endTime: minutesFromNow(10),
    note: "TEST - Quick payout test"
  },
  {
    question: "📈 Will BTC/ETH ratio increase in next 10min?",
    endTime: minutesFromNow(10),
    note: "TEST - Quick payout test"
  },
  {
    question: "🎯 Will Base have >100 txs in next 10min?",
    endTime: minutesFromNow(10),
    note: "TEST - Quick payout test"
  }
];

async function main() {
  console.log('🚀 Starting TEST market creation (10 minutes)...\n');

  // Check for private key
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('❌ DEPLOYER_PRIVATE_KEY not found in .env');
  }

  // Create account and wallet client
  const account = privateKeyToAccount(privateKey);
  const client = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http()
  });

  console.log(`📍 Deployer Address: ${account.address}`);
  console.log(`📍 Contract Address: ${TROLLBET_ADDRESS}`);
  console.log(`📍 Network: Base Sepolia\n`);
  console.log(`⏰ All markets will end in 10 minutes\n`);
  console.log('═══════════════════════════════════════════════════════\n');

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < TEST_MARKETS.length; i++) {
    const market = TEST_MARKETS[i];
    
    console.log(`\n[${i + 1}/${TEST_MARKETS.length}] Creating market:`);
    console.log(`   Question: ${market.question}`);
    console.log(`   End Time: ${new Date(market.endTime * 1000).toISOString()}`);
    console.log(`   Note: ${market.note}`);

    try {
      const hash = await client.writeContract({
        address: TROLLBET_ADDRESS,
        abi: ABI,
        functionName: 'createMarket',
        args: [market.question, BigInt(market.endTime)]
      });

      console.log(`   ✅ Transaction sent: ${hash}`);
      console.log(`   🔗 View: https://sepolia.basescan.org/tx/${hash}`);
      successCount++;

      // Wait 2 seconds between transactions
      if (i < TEST_MARKETS.length - 1) {
        console.log('   ⏳ Waiting 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      failCount++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('\n📊 Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📝 Total: ${TEST_MARKETS.length}`);
  console.log('\n⏰ All markets will end in 10 minutes!');
  console.log('🎯 Perfect for testing payouts and leaderboard!\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
