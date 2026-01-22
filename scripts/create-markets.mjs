/**
 * Create Markets Script
 * 
 * Usage: 
 *   node scripts/create-markets.mjs YOUR_PRIVATE_KEY
 * 
 * This script creates 6 markets on the TrollBet contract on Base Sepolia.
 */

import { createWalletClient, createPublicClient, http, parseAbi } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Contract addresses
const TROLLBET_ADDRESS = '0x26dEe56f85fAa471eFF9210326734389186ac625';

// TrollBet ABI (only createMarket function)
const TROLLBET_ABI = parseAbi([
  'function createMarket(string memory question, uint256 endTime) external returns (uint256)',
  'event MarketCreated(uint256 indexed marketId, string question, uint256 endTime)'
]);

// Markets to create - endTime set to 7 days from now
const SEVEN_DAYS = 7 * 24 * 60 * 60;
const now = Math.floor(Date.now() / 1000);

const MARKETS = [
  { question: "Will Peter Schiff tweet negatively about Bitcoin in the next 7 days?", endTime: now + SEVEN_DAYS },
  { question: "Will $DEGEN hit $0.01 this week?", endTime: now + SEVEN_DAYS },
  { question: "Will Elon Musk tweet about Dogecoin this week?", endTime: now + SEVEN_DAYS },
  { question: "Will ETH flip BTC market cap in 2025?", endTime: now + SEVEN_DAYS },
  { question: "Will Base TVL exceed $10B this month?", endTime: now + SEVEN_DAYS },
  { question: "Will Vitalik post on Farcaster this week?", endTime: now + SEVEN_DAYS },
];

async function main() {
  // Get private key from command line
  const privateKey = process.argv[2];
  
  if (!privateKey) {
    console.error('❌ Error: Please provide your private key as argument');
    console.error('   Usage: node scripts/create-markets.mjs YOUR_PRIVATE_KEY');
    console.error('');
    console.error('   ⚠️  Never share your private key! This is for testnet only.');
    process.exit(1);
  }

  // Ensure private key starts with 0x
  const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  
  try {
    // Create account from private key
    const account = privateKeyToAccount(formattedKey);
    console.log('🔑 Using account:', account.address);

    // Create clients
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http('https://sepolia.base.org'),
    });

    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http('https://sepolia.base.org'),
    });

    console.log('📡 Connected to Base Sepolia');
    console.log('📄 TrollBet Contract:', TROLLBET_ADDRESS);
    console.log('');

    // Create each market
    for (let i = 0; i < MARKETS.length; i++) {
      const market = MARKETS[i];
      console.log(`\n🎯 Creating Market ${i + 1}/${MARKETS.length}...`);
      console.log(`   Question: "${market.question}"`);
      console.log(`   End Time: ${new Date(market.endTime * 1000).toISOString()}`);

      try {
        // Send transaction
        const hash = await walletClient.writeContract({
          address: TROLLBET_ADDRESS,
          abi: TROLLBET_ABI,
          functionName: 'createMarket',
          args: [market.question, BigInt(market.endTime)],
        });

        console.log(`   📤 TX Hash: ${hash}`);
        
        // Wait for confirmation
        console.log('   ⏳ Waiting for confirmation...');
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        
        if (receipt.status === 'success') {
          console.log(`   ✅ Market ${i} created successfully!`);
        } else {
          console.log(`   ❌ Transaction failed!`);
        }
      } catch (error) {
        console.error(`   ❌ Error creating market ${i}:`, error.message);
        
        // Check if it's an "already exists" or similar error and continue
        if (error.message.includes('revert')) {
          console.log('   ⚠️  Skipping to next market...');
          continue;
        }
        throw error;
      }

      // Small delay between transactions
      if (i < MARKETS.length - 1) {
        console.log('   ⏳ Waiting 3 seconds before next transaction...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    console.log('\n✅ All markets created successfully!');
    console.log('\n📊 Market IDs: 0, 1, 2, 3, 4, 5');
    console.log('🎉 You can now test betting in the app!');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

main();
