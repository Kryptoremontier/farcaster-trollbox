#!/usr/bin/env node
import 'dotenv/config';
import { createPublicClient, http, formatEther, getAddress } from 'viem';
import { baseSepolia } from 'viem/chains';

const TROLLBET_ETH_ADDRESS = '0xc629e67E221db99CF2A6e0468907bBcFb7D5f5A3';

const TrollBetETH_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "marketId", "type": "uint256"}],
    "name": "getMarket",
    "outputs": [
      {
        "components": [
          {"internalType": "string", "name": "question", "type": "string"},
          {"internalType": "uint256", "name": "endTime", "type": "uint256"},
          {"internalType": "uint256", "name": "yesPool", "type": "uint256"},
          {"internalType": "uint256", "name": "noPool", "type": "uint256"},
          {"internalType": "bool", "name": "resolved", "type": "bool"},
          {"internalType": "bool", "name": "winningSide", "type": "bool"}
        ],
        "internalType": "struct TrollBetETH.Market",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "marketId", "type": "uint256"},
      {"internalType": "address", "name": "user", "type": "address"}
    ],
    "name": "getUserBet",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "yesAmount", "type": "uint256"},
          {"internalType": "uint256", "name": "noAmount", "type": "uint256"},
          {"internalType": "bool", "name": "claimed", "type": "bool"}
        ],
        "internalType": "struct TrollBetETH.UserBet",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const client = createPublicClient({
  chain: baseSepolia,
  transport: http('https://base-sepolia-rpc.publicnode.com'),
});

async function checkUserBets(userAddress) {
  try {
    const checksumAddress = getAddress(userAddress);
    console.log(`\n🔍 Checking bets for: ${checksumAddress}\n`);

    for (let marketId = 30; marketId <= 32; marketId++) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📊 Market #${marketId}`);
      
      // Get market data
      const market = await client.readContract({
        address: TROLLBET_ETH_ADDRESS,
        abi: TrollBetETH_ABI,
        functionName: 'getMarket',
        args: [BigInt(marketId)],
      });

      console.log(`Question: ${market.question}`);
      console.log(`Resolved: ${market.resolved ? 'Yes' : 'No'}`);
      if (market.resolved) {
        console.log(`Winning Side: ${market.winningSide ? 'YES' : 'NO'}`);
      }
      console.log(`YES Pool: ${formatEther(market.yesPool)} ETH`);
      console.log(`NO Pool: ${formatEther(market.noPool)} ETH`);
      console.log(`Total Pool: ${formatEther(market.yesPool + market.noPool)} ETH`);

      // Get user bet
      const userBet = await client.readContract({
        address: TROLLBET_ETH_ADDRESS,
        abi: TrollBetETH_ABI,
        functionName: 'getUserBet',
        args: [BigInt(marketId), checksumAddress],
      });

      const yesAmount = parseFloat(formatEther(userBet.yesAmount));
      const noAmount = parseFloat(formatEther(userBet.noAmount));
      const totalBet = yesAmount + noAmount;

      console.log(`\nYour Bet:`);
      console.log(`  YES: ${yesAmount} ETH`);
      console.log(`  NO: ${noAmount} ETH`);
      console.log(`  Total: ${totalBet} ETH`);
      console.log(`  Claimed: ${userBet.claimed ? 'Yes' : 'No'}`);

      if (totalBet > 0 && market.resolved) {
        const userWon = (market.winningSide && yesAmount > 0) || (!market.winningSide && noAmount > 0);
        
        if (userWon) {
          const yesPool = parseFloat(formatEther(market.yesPool));
          const noPool = parseFloat(formatEther(market.noPool));
          const totalPool = yesPool + noPool;
          
          const winnings = market.winningSide 
            ? (yesAmount / yesPool) * totalPool * 0.975
            : (noAmount / noPool) * totalPool * 0.975;
          
          const fee = market.winningSide 
            ? (yesAmount / yesPool) * totalPool * 0.025
            : (noAmount / noPool) * totalPool * 0.025;

          console.log(`\n✅ YOU WON!`);
          console.log(`  Gross Winnings: ${winnings.toFixed(6)} ETH`);
          console.log(`  Protocol Fee (1%): ${fee.toFixed(6)} ETH`);
          console.log(`  Net Payout: ${(winnings).toFixed(6)} ETH`);
          
          if (userBet.claimed) {
            console.log(`  ✅ Already claimed!`);
          } else {
            console.log(`  ⚠️  NOT YET CLAIMED - Go claim your winnings!`);
          }
        } else {
          console.log(`\n❌ You lost this market`);
        }
      } else if (totalBet === 0) {
        console.log(`\n⚪ No bet placed`);
      } else if (!market.resolved) {
        console.log(`\n⏳ Market not yet resolved`);
      }

      console.log('');
    }

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get user address from command line
const userAddress = process.argv[2];

if (!userAddress) {
  console.error('❌ Usage: node scripts/check-user-bets.mjs <USER_ADDRESS>');
  console.error('Example: node scripts/check-user-bets.mjs 0x1234...');
  process.exit(1);
}

checkUserBets(userAddress);
