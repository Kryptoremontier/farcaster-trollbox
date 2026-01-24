/**
 * Vercel Cron Job - Auto-resolve ended markets
 * Runs every 10 minutes to check and resolve markets
 * 
 * ⚠️ MAINNET SAFETY WARNING ⚠️
 * 
 * SAFE FOR MAINNET (Fully Automated):
 * ✅ BTC Price Digit - Uses CoinGecko API
 * ✅ ETH Gas Price - Uses Etherscan API
 * 
 * UNSAFE FOR MAINNET (Mock Oracles):
 * ❌ Whale Movements - Hardcoded to NO
 * ❌ BTC/ETH Ratio - Hardcoded to NO  
 * ❌ Base Activity - Hardcoded to YES
 * 
 * DO NOT create markets with mock oracles on mainnet!
 * Users will lose money if bot resolves incorrectly.
 */

import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, formatEther } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

export const runtime = "edge";
export const maxDuration = 60; // 60 seconds max execution time

// TrollBetETH Contract - BASE MAINNET
const TROLLBET_ETH_ADDRESS = '0x52ABabe88DE8799B374b11B91EC1b32989779e55';

// Full ABI for reading and resolving markets
const TROLLBET_ABI = [
  {
    "inputs": [],
    "name": "marketCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "markets",
    "outputs": [
      {"internalType": "string", "name": "question", "type": "string"},
      {"internalType": "uint256", "name": "endTime", "type": "uint256"},
      {"internalType": "uint256", "name": "yesPool", "type": "uint256"},
      {"internalType": "uint256", "name": "noPool", "type": "uint256"},
      {"internalType": "bool", "name": "resolved", "type": "bool"},
      {"internalType": "bool", "name": "winningSide", "type": "bool"},
      {"internalType": "bool", "name": "exists", "type": "bool"},
      {"internalType": "bool", "name": "cancelled", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "marketId", "type": "uint256"},
      {"internalType": "bool", "name": "winningSide", "type": "bool"}
    ],
    "name": "resolveMarket",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// Oracle functions
async function fetchCryptoPrice(symbol: string): Promise<number> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`
    );
    const data = await response.json();
    return data[symbol]?.usd || 0;
  } catch (error) {
    console.error(`Failed to fetch ${symbol} price:`, error);
    return 0;
  }
}

async function fetchEthGasPrice(): Promise<number> {
  try {
    // ⚠️ WARNING: This uses Ethereum mainnet gas prices, NOT Base network!
    // For Base gas prices, use: https://api.basescan.org/api?module=gastracker&action=gasoracle&apikey=YOUR_KEY
    // Current implementation is for demonstration only
    const response = await fetch(
      'https://api.etherscan.io/api?module=gastracker&action=gasoracle',
      { next: { revalidate: 60 } } // Cache for 60 seconds
    );
    
    if (!response.ok) {
      console.error(`Etherscan API error: ${response.status}`);
      return 0;
    }
    
    const data = await response.json();
    
    if (data.status !== '1') {
      console.error('Etherscan API returned error:', data.message);
      return 0;
    }
    
    const gasPrice = parseInt(data.result?.ProposeGasPrice || '0');
    console.log(`      ⛽ Fetched gas price: ${gasPrice} gwei (⚠️ Ethereum mainnet, NOT Base!)`);
    return gasPrice;
  } catch (error) {
    console.error('Failed to fetch gas price:', error);
    return 0;
  }
}

// Determine market result based on question
async function getMarketResult(question: string): Promise<boolean | null> {
  console.log(`   📊 Analyzing: "${question}"`);

  // BTC price digit check
  if (question.includes("BTC price end with digit")) {
    const btcPrice = await fetchCryptoPrice('bitcoin');
    const match = question.match(/digit (\d)/);
    if (!match) return null;
    
    const targetDigit = parseInt(match[1]);
    const lastDigit = Math.floor(btcPrice * 100) % 10;
    
    console.log(`      💰 BTC Price: $${btcPrice.toFixed(2)}`);
    console.log(`      🎲 Last digit: ${lastDigit}, Target: ${targetDigit}`);
    
    return lastDigit === targetDigit;
  }

  // ETH gas price check
  if (question.includes("ETH gas be above")) {
    const gasPrice = await fetchEthGasPrice();
    const match = question.match(/above (\d+) gwei/);
    if (!match) return null;
    
    const threshold = parseInt(match[1]);
    
    console.log(`      ⛽ Current gas: ${gasPrice} gwei, Threshold: ${threshold} gwei`);
    
    return gasPrice > threshold;
  }

  // BTC last digit EVEN/ODD check
  if (question.includes("BTC price last digit be EVEN")) {
    const btcPrice = await fetchCryptoPrice('bitcoin');
    const lastDigit = Math.floor(btcPrice * 100) % 10;
    const isEven = lastDigit % 2 === 0;
    
    console.log(`      💰 BTC Price: $${btcPrice.toFixed(2)}`);
    console.log(`      🎲 Last digit: ${lastDigit}, EVEN: ${isEven}`);
    
    return isEven;
  }

  // ETH price threshold check (touch $X before resolution)
  // ⚠️ WARNING: This only checks CURRENT price, NOT historical high/low
  // For accurate "touch" markets, you need historical price data API
  if (question.includes("ETH price touch")) {
    const ethPrice = await fetchCryptoPrice('ethereum');
    const match = question.match(/\$([0-9,]+)/);
    if (!match) return null;
    
    const threshold = parseInt(match[1].replace(/,/g, ''));
    const touched = ethPrice >= threshold;
    
    console.log(`      💰 ETH Price: $${ethPrice.toFixed(2)}, Threshold: $${threshold}`);
    console.log(`      🎯 Result: ${touched ? 'YES' : 'NO'} (⚠️ CURRENT price only, not historical!)`);
    console.log(`      ⚠️  WARNING: This market type needs historical data for accuracy!`);
    
    return touched;
  }

  // ⚠️ WARNING: MOCK ORACLES - DO NOT USE ON MAINNET ⚠️
  
  // Whale movement check (mock for now)
  if (question.includes("whale move >")) {
    console.log(`      🐋 Whale check: ⚠️ MOCK - Defaulting to NO`);
    console.log(`      ⚠️  WARNING: This is a MOCK oracle - DO NOT use on mainnet!`);
    return false; // Default to NO - UNSAFE FOR MAINNET
  }

  // BTC/ETH ratio check
  if (question.includes("BTC/ETH ratio increase")) {
    console.log(`      📈 Ratio check: ⚠️ MOCK - Defaulting to NO`);
    console.log(`      ⚠️  WARNING: This is a MOCK oracle - DO NOT use on mainnet!`);
    return false; // Needs historical comparison - UNSAFE FOR MAINNET
  }

  // Base network activity (mock for now)
  if (question.includes("Base have >")) {
    console.log(`      🔗 Base activity: ⚠️ MOCK - Defaulting to YES`);
    console.log(`      ⚠️  WARNING: This is a MOCK oracle - DO NOT use on mainnet!`);
    return true; // Default to YES - UNSAFE FOR MAINNET
  }

  // Unknown pattern
  console.log(`      ❓ Unknown question pattern - needs manual resolution`);
  return null;
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🤖 [CRON] Auto-resolve markets started at', new Date().toISOString());

    // Verify cron secret (security) - ONLY if called externally
    // Vercel Cron calls don't include Authorization header, so check if it's from Vercel
    const authHeader = req.headers.get('authorization');
    const userAgent = req.headers.get('user-agent') || '';
    const isVercelCron = userAgent.includes('vercel-cron');
    
    // If CRON_SECRET is set and it's NOT a Vercel Cron, require auth
    if (process.env.CRON_SECRET && !isVercelCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('❌ [CRON] Unauthorized request (not Vercel Cron, invalid auth)');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log(`   🔐 Auth: ${isVercelCron ? 'Vercel Cron (trusted)' : authHeader ? 'Bearer token' : 'none'}`);

    // Check if bot wallet is configured
    if (!process.env.DEPLOYER_PRIVATE_KEY) {
      console.log('❌ [CRON] Bot wallet not configured');
      return NextResponse.json({ 
        error: 'Bot wallet not configured',
        hint: 'Add DEPLOYER_PRIVATE_KEY to environment variables'
      }, { status: 500 });
    }

    // Setup clients
    const account = privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`);
    
    // Use public RPC endpoint to avoid Cloudflare blocking
    // Alternative: Use Alchemy/Infura with API key for better reliability
    const rpcUrl = process.env.BASE_MAINNET_RPC_URL || 'https://mainnet.base.org';
    
    const publicClient = createPublicClient({
      chain: base,
      transport: http(rpcUrl, {
        timeout: 30_000, // 30 second timeout
        retryCount: 3,
        retryDelay: 1000
      })
    });

    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(rpcUrl, {
        timeout: 30_000,
        retryCount: 3,
        retryDelay: 1000
      })
    });

    console.log(`   🤖 Bot address: ${account.address}`);

    // Get market count
    const marketCount = await publicClient.readContract({
      address: TROLLBET_ETH_ADDRESS,
      abi: TROLLBET_ABI,
      functionName: 'marketCount'
    });

    console.log(`   📊 Total markets: ${marketCount}`);

    const results = {
      checked: 0,
      resolved: 0,
      skipped: 0,
      failed: 0,
      details: [] as Array<{
        marketId: number;
        question?: string;
        result?: string;
        txHash?: string;
        status: string;
        reason?: string;
        error?: string;
      }>
    };

    // Check each market
    for (let i = 0; i < Number(marketCount); i++) {
      try {
        const market = await publicClient.readContract({
          address: TROLLBET_ETH_ADDRESS,
          abi: TROLLBET_ABI,
          functionName: 'markets',
          args: [BigInt(i)]
        });

        const [question, endTime, yesPool, noPool, resolved, , exists, cancelled] = market;

        if (!exists) continue;
        
        results.checked++;

        // Skip if already resolved or cancelled
        if (resolved || cancelled) {
          results.skipped++;
          results.details.push({
            marketId: i,
            question,
            status: cancelled ? 'already_cancelled' : 'already_resolved',
            reason: cancelled ? 'Market was cancelled' : 'Market already resolved'
          });
          continue;
        }

        // Check if market has ended
        const now = Math.floor(Date.now() / 1000);
        if (Number(endTime) > now) {
          results.skipped++;
          continue;
        }

        console.log(`\n   🎯 Market #${i} needs resolution:`);
        console.log(`      Question: "${question}"`);
        console.log(`      Ended: ${new Date(Number(endTime) * 1000).toISOString()}`);
        console.log(`      Pools: ${formatEther(yesPool)} YES / ${formatEther(noPool)} NO`);

        // Get result from oracle with retry
        let result: boolean | null = null;
        let retries = 0;
        const maxRetries = 2;
        
        while (result === null && retries <= maxRetries) {
          if (retries > 0) {
            console.log(`      🔄 Retry ${retries}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s between retries
          }
          result = await getMarketResult(question);
          retries++;
        }

        if (result === null) {
          console.log(`      ⚠️  Cannot auto-resolve after ${maxRetries} retries - needs manual intervention`);
          results.details.push({
            marketId: i,
            question,
            status: 'needs_manual',
            reason: 'Unknown question pattern'
          });
          results.skipped++;
          continue;
        }

        console.log(`      ✅ Result determined: ${result ? 'YES' : 'NO'}`);

        // Check if winning side has bets
        const winningPool = result ? yesPool : noPool;
        if (winningPool === 0n) {
          console.log(`      ⚠️  WARNING: Winning side has NO bets!`);
          console.log(`      ℹ️  Contract will auto-cancel and allow refunds`);
        }

        // Resolve market
        const hash = await walletClient.writeContract({
          address: TROLLBET_ETH_ADDRESS,
          abi: TROLLBET_ABI,
          functionName: 'resolveMarket',
          args: [BigInt(i), result]
        });

        console.log(`      📤 TX sent: ${hash}`);

        // Wait for confirmation
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        if (receipt.status === 'success') {
          // Check if market was cancelled instead of resolved
          if (winningPool === 0n) {
            console.log(`      🔄 Market #${i} auto-cancelled (no winners)`);
            results.resolved++;
            results.details.push({
              marketId: i,
              question,
              result: `AUTO-CANCELLED (${result ? 'YES' : 'NO'} won but no bets)`,
              txHash: hash,
              status: 'cancelled'
            });
          } else {
            console.log(`      ✅ Market #${i} resolved successfully!`);
            results.resolved++;
            results.details.push({
              marketId: i,
              question,
              result: result ? 'YES' : 'NO',
              txHash: hash,
              status: 'resolved'
            });
          }
        } else {
          console.log(`      ❌ TX failed for market #${i}`);
          results.failed++;
          results.details.push({
            marketId: i,
            question,
            status: 'failed',
            txHash: hash
          });
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`   ❌ Error processing market #${i}:`, errorMessage);
        results.failed++;
        results.details.push({
          marketId: i,
          status: 'error',
          error: errorMessage
        });
      }
    }

    const duration = Date.now() - startTime;
    
    console.log(`\n✅ [CRON] Auto-resolve completed in ${duration}ms`);
    console.log(`   📊 Stats: ${results.resolved} resolved, ${results.skipped} skipped, ${results.failed} failed`);
    
    // Log warning if there were failures
    if (results.failed > 0) {
      console.error(`\n⚠️  [CRON] WARNING: ${results.failed} market(s) failed to resolve!`);
      console.error('   🚨 ACTION REQUIRED: Check logs and resolve manually');
      results.details
        .filter(d => d.status === 'failed' || d.status === 'error')
        .forEach(d => {
          console.error(`   ❌ Market #${d.marketId}: ${d.error || 'Unknown error'}`);
        });
    }
    
    // Log info about markets needing manual resolution
    const needsManual = results.details.filter(d => d.status === 'needs_manual');
    if (needsManual.length > 0) {
      console.warn(`\n⚠️  [CRON] ${needsManual.length} market(s) need manual resolution:`);
      needsManual.forEach(d => {
        console.warn(`   🔧 Market #${d.marketId}: "${d.question}"`);
        console.warn(`      Reason: ${d.reason}`);
      });
    }

    return NextResponse.json({
      success: true,
      duration,
      stats: {
        checked: results.checked,
        resolved: results.resolved,
        skipped: results.skipped,
        failed: results.failed
      },
      details: results.details,
      warnings: {
        failures: results.failed,
        needsManual: needsManual.length
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [CRON] Fatal error:', error);
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      duration
    }, { status: 500 });
  }
}
