import { createWalletClient, http } from 'viem';
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

// Contract ABI
const ABI = [
  {
    type: 'function',
    name: 'resolveMarket',
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'winningSide', type: 'bool' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'getMarket',
    inputs: [{ name: 'marketId', type: 'uint256' }],
    outputs: [
      { name: 'question', type: 'string' },
      { name: 'endTime', type: 'uint256' },
      { name: 'yesPool', type: 'uint256' },
      { name: 'noPool', type: 'uint256' },
      { name: 'resolved', type: 'bool' },
      { name: 'winningSide', type: 'bool' },
      { name: 'exists', type: 'bool' }
    ],
    stateMutability: 'view'
  }
];

async function resolveMarket(marketId, winningSide) {
  console.log('🎯 TrollBet Market Resolution Tool\n');
  console.log('═══════════════════════════════════════════════════════\n');

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

  console.log(`📍 Resolver Address: ${account.address}`);
  console.log(`📍 Contract Address: ${TROLLBET_ADDRESS}`);
  console.log(`📍 Network: Base Sepolia\n`);

  // Get market info first
  try {
    const marketData = await client.readContract({
      address: TROLLBET_ADDRESS,
      abi: ABI,
      functionName: 'getMarket',
      args: [BigInt(marketId)]
    });

    const [question, endTime, yesPool, noPool, resolved, existingWinningSide, exists] = marketData;

    if (!exists) {
      throw new Error(`Market ${marketId} does not exist`);
    }

    if (resolved) {
      console.log(`⚠️  Market ${marketId} is already resolved!`);
      console.log(`   Winning side: ${existingWinningSide ? 'YES' : 'NO'}\n`);
      return;
    }

    console.log(`📊 Market ${marketId}:`);
    console.log(`   Question: ${question}`);
    console.log(`   End Time: ${new Date(Number(endTime) * 1000).toISOString()}`);
    console.log(`   YES Pool: ${(Number(yesPool) / 1e18).toFixed(4)} ETH`);
    console.log(`   NO Pool: ${(Number(noPool) / 1e18).toFixed(4)} ETH`);
    console.log(`   Total Pool: ${((Number(yesPool) + Number(noPool)) / 1e18).toFixed(4)} ETH`);
    console.log(`   Resolved: ${resolved ? 'Yes' : 'No'}\n`);

    // Check if market has ended
    const now = Math.floor(Date.now() / 1000);
    if (now < Number(endTime)) {
      const remaining = Number(endTime) - now;
      const minutes = Math.floor(remaining / 60);
      console.log(`⚠️  Market has not ended yet!`);
      console.log(`   Time remaining: ${minutes} minutes\n`);
      throw new Error('Cannot resolve market before endTime');
    }

    console.log(`🎲 Resolving with: ${winningSide ? '✅ YES' : '❌ NO'}\n`);

    // Resolve the market
    const hash = await client.writeContract({
      address: TROLLBET_ADDRESS,
      abi: ABI,
      functionName: 'resolveMarket',
      args: [BigInt(marketId), winningSide]
    });

    console.log(`✅ Transaction sent: ${hash}`);
    console.log(`🔗 View: https://sepolia.basescan.org/tx/${hash}\n`);
    console.log(`⏳ Waiting for confirmation...`);
    console.log(`   Winners can now claim their payouts! 💰\n`);

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    throw error;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: node scripts/resolve-market.mjs <marketId> <winningSide>');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/resolve-market.mjs 19 true   # Resolve market 19 as YES');
  console.log('  node scripts/resolve-market.mjs 20 false  # Resolve market 20 as NO');
  console.log('');
  process.exit(1);
}

const marketId = parseInt(args[0]);
const winningSide = args[1] === 'true';

if (isNaN(marketId)) {
  console.error('❌ Invalid market ID');
  process.exit(1);
}

resolveMarket(marketId, winningSide)
  .then(() => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Resolution complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('═══════════════════════════════════════════════════════');
    console.error('❌ Resolution failed!\n');
    process.exit(1);
  });
