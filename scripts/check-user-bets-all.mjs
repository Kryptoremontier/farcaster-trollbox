#!/usr/bin/env node
/**
 * Check user bets across all markets
 */

import { config } from 'dotenv';
import { createPublicClient, http, formatEther } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env.mainnet
config({ path: '.env.mainnet' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TrollBetABI = JSON.parse(readFileSync(join(__dirname, '../src/lib/abi/TrollBet.json'), 'utf8'));

const TROLLBET_ETH_ADDRESS = process.env.MAINNET_CONTRACT_ADDRESS;
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

const account = privateKeyToAccount(`0x${DEPLOYER_PRIVATE_KEY.replace(/^0x/, '')}`);

const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_MAINNET_RPC_URL || 'https://mainnet.base.org')
});

console.log(`\n🚀 CHECK USER BETS - ALL MARKETS`);
console.log(`📍 Contract: ${TROLLBET_ETH_ADDRESS}`);
console.log(`👤 User: ${account.address}\n`);

async function main() {
  try {
    const marketCount = await publicClient.readContract({
      address: TROLLBET_ETH_ADDRESS,
      abi: TrollBetABI,
      functionName: 'marketCount'
    });

    console.log(`📊 Total Markets: ${marketCount}\n`);

    let totalLocked = 0n;
    let marketsWithBets = [];

    for (let i = 0; i < Number(marketCount); i++) {
      const userBet = await publicClient.readContract({
        address: TROLLBET_ETH_ADDRESS,
        abi: TrollBetABI,
        functionName: 'getUserBet',
        args: [BigInt(i), account.address]
      });

      const [yesAmount, noAmount, claimed] = userBet;
      const totalBet = yesAmount + noAmount;

      if (totalBet > 0n) {
        const market = await publicClient.readContract({
          address: TROLLBET_ETH_ADDRESS,
          abi: TrollBetABI,
          functionName: 'markets',
          args: [BigInt(i)]
        });

        const [question, , , , resolved, winningSide, exists, cancelled] = market;

        console.log(`Market #${i}:`);
        console.log(`  ❓ ${question}`);
        console.log(`  💰 YES: ${formatEther(yesAmount)} ETH | NO: ${formatEther(noAmount)} ETH`);
        console.log(`  📊 Total Bet: ${formatEther(totalBet)} ETH`);
        console.log(`  🎯 Resolved: ${resolved ? '✅' : '❌'} | Cancelled: ${cancelled ? '✅' : '❌'}`);
        console.log(`  💸 Claimed: ${claimed ? '✅' : '❌'}\n`);

        if (!claimed) {
          totalLocked += totalBet;
          marketsWithBets.push({
            id: i,
            question,
            totalBet,
            resolved,
            cancelled,
            winningSide
          });
        }
      }
    }

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    console.log(`💰 TOTAL LOCKED (UNCLAIMED): ${formatEther(totalLocked)} ETH`);
    
    if (marketsWithBets.length > 0) {
      console.log(`\n🔔 ACTION REQUIRED:`);
      console.log(`   You have unclaimed funds in ${marketsWithBets.length} market(s)!\n`);
      
      for (const market of marketsWithBets) {
        if (market.cancelled) {
          console.log(`   Market #${market.id}: CLAIM REFUND`);
          console.log(`   → node scripts/claim-refund.mjs ${market.id}\n`);
        } else if (market.resolved) {
          console.log(`   Market #${market.id}: CLAIM WINNINGS`);
          console.log(`   → Check if you won and claim via UI\n`);
        }
      }
    } else {
      console.log(`\n✅ No unclaimed funds!`);
    }

  } catch (error) {
    console.error(`❌ Error:`, error.message);
    process.exit(1);
  }
}

main();
