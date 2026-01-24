#!/usr/bin/env node
/**
 * Add 2 new markets for Jan 26, 2026 testing
 * Market #7: BTC last digit ODD
 * Market #8: ETH above $3,000
 */

import { config } from 'dotenv';
import { createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.mainnet
config({ path: join(__dirname, '../.env.mainnet') });

// Load ABI from JSON file
const TROLLBET_ABI = JSON.parse(readFileSync(join(__dirname, '../src/lib/abi/TrollBet.json'), 'utf-8'));

const TROLLBET_ETH_ADDRESS = process.env.MAINNET_CONTRACT_ADDRESS;
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const BASE_MAINNET_RPC_URL = process.env.BASE_MAINNET_RPC_URL;

if (!TROLLBET_ETH_ADDRESS || !DEPLOYER_PRIVATE_KEY || !BASE_MAINNET_RPC_URL) {
    console.error("Missing environment variables. Ensure MAINNET_CONTRACT_ADDRESS, DEPLOYER_PRIVATE_KEY, and BASE_MAINNET_RPC_URL are set in .env.mainnet");
    process.exit(1);
}

const account = privateKeyToAccount(DEPLOYER_PRIVATE_KEY);

const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(BASE_MAINNET_RPC_URL),
});

// Calculate end time: 24 hours from now
const endTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60);
const endDate = new Date(endTime * 1000);

const markets = [
    {
        question: "Will the BTC price last digit be ODD (1, 3, 5, 7, 9) at resolution time?",
        endTime: endTime,
        description: "BTC Last Digit ODD - 50/50 chance, fully automated oracle"
    },
    {
        question: "Will ETH price be above $3,000 at resolution time?",
        endTime: endTime,
        description: "ETH price threshold - current price check at resolution"
    }
];

async function addMarkets() {
    console.log(`\n🚀 ADDING 2 NEW MARKETS TO BASE MAINNET`);
    console.log(`📍 Contract: ${TROLLBET_ETH_ADDRESS}`);
    console.log(`👤 Deployer: ${account.address}`);
    console.log(`⏰ End Time: ${endDate.toISOString()} (24h from now)`);
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    for (let i = 0; i < markets.length; i++) {
        const market = markets[i];
        console.log(`📝 Market #${i + 1}: ${market.question}`);
        console.log(`   Description: ${market.description}`);
        console.log(`   End Time: ${endDate.toLocaleString()}`);

        try {
            const hash = await walletClient.writeContract({
                address: TROLLBET_ETH_ADDRESS,
                abi: TROLLBET_ABI,
                functionName: 'createMarket',
                args: [market.question, BigInt(market.endTime)],
                chain: base,
            });

            console.log(`   ✅ Transaction sent: ${hash}`);
            console.log(`   🔗 View on BaseScan: https://basescan.org/tx/${hash}`);
            console.log(`\n`);

            // Wait 3 seconds between transactions to avoid nonce issues
            if (i < markets.length - 1) {
                console.log(`   ⏳ Waiting 3 seconds before next transaction...\n`);
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        } catch (error) {
            console.error(`   ❌ Error creating market:`, error);
            process.exit(1);
        }
    }

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    console.log(`✅ DONE! 2 markets created successfully!`);
    console.log(`\n📊 Next steps:`);
    console.log(`   1. Check markets: node scripts/check-all-mainnet-markets.mjs`);
    console.log(`   2. Wait for Vercel to pick up changes`);
    console.log(`   3. Markets will auto-resolve in 24h via Cron Job\n`);
}

addMarkets();
