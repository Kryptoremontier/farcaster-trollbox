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
import { createPublicClient, createWalletClient, http, formatEther, fallback } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

export const runtime = "edge";
export const maxDuration = 300; // 5 minutes max execution time (Vercel Pro limit)

// TrollBetETH Contract - BASE MAINNET
const TROLLBET_ETH_ADDRESS = '0x52ABabe88DE8799B374b11B91EC1b32989779e55';

// Multiple RPC endpoints for reliability (fallback chain)
const RPC_ENDPOINTS = [
  process.env.BASE_MAINNET_RPC_URL, // Primary (Alchemy/QuickNode if configured)
  'https://base.llamarpc.com',      // LlamaRPC (free, generous limits)
  'https://base.drpc.org',          // dRPC (free tier)
  'https://mainnet.base.org',       // Official Base RPC (rate limited)
].filter(Boolean) as string[];

// Helper: delay between operations to avoid rate limits
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
  },
  {
    "inputs": [{"internalType": "uint256", "name": "marketId", "type": "uint256"}],
    "name": "cancelMarket",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// Oracle functions - with fallback APIs for reliability
async function fetchCryptoPrice(symbol: string): Promise<number> {
  // Map CoinGecko IDs to Binance symbols
  const binanceSymbolMap: Record<string, string> = {
    'bitcoin': 'BTCUSDT',
    'ethereum': 'ETHUSDT',
    'solana': 'SOLUSDT',
  };

  // Try CoinGecko first
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`,
      { signal: AbortSignal.timeout(10000) } // 10 second timeout
    );

    if (!response.ok) {
      console.warn(`      ⚠️ CoinGecko API error (${response.status}) for ${symbol}, trying fallback...`);
      throw new Error(`CoinGecko error: ${response.status}`);
    }

    const data = await response.json();

    // Check for rate limit error in response body
    if (data.status?.error_code === 429) {
      console.warn(`      ⚠️ CoinGecko rate limited for ${symbol}, trying fallback...`);
      throw new Error('CoinGecko rate limited');
    }

    const price = data[symbol]?.usd;
    if (price && price > 0) {
      console.log(`      ✅ CoinGecko: ${symbol} = $${price.toLocaleString()}`);
      return price;
    }

    throw new Error('Invalid price from CoinGecko');
  } catch (cgError) {
    console.warn(`      ⚠️ CoinGecko failed: ${cgError instanceof Error ? cgError.message : 'Unknown error'}`);
  }

  // Fallback to Binance API (free, no auth required for public endpoints)
  const binanceSymbol = binanceSymbolMap[symbol];
  if (binanceSymbol) {
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`,
        { signal: AbortSignal.timeout(10000) }
      );

      if (!response.ok) {
        console.error(`      ❌ Binance API error (${response.status}) for ${binanceSymbol}`);
        return 0;
      }

      const data = await response.json();
      const price = parseFloat(data.price);

      if (price && price > 0) {
        console.log(`      ✅ Binance fallback: ${binanceSymbol} = $${price.toLocaleString()}`);
        return price;
      }
    } catch (binanceError) {
      console.error(`      ❌ Binance fallback failed: ${binanceError instanceof Error ? binanceError.message : 'Unknown error'}`);
    }
  }

  console.error(`      ❌ All price sources failed for ${symbol}`);
  return 0;
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
    if (btcPrice === 0) {
      console.error(`      ❌ Failed to fetch BTC price - skipping resolution`);
      return null;
    }
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
    if (btcPrice === 0) {
      console.error(`      ❌ Failed to fetch BTC price - skipping resolution`);
      return null;
    }
    const lastDigit = Math.floor(btcPrice * 100) % 10;
    const isEven = lastDigit % 2 === 0;

    console.log(`      💰 BTC Price: $${btcPrice.toFixed(2)}`);
    console.log(`      🎲 Last digit: ${lastDigit}, EVEN: ${isEven}`);

    return isEven;
  }

  if (question.includes("BTC price last digit be ODD")) {
    const btcPrice = await fetchCryptoPrice('bitcoin');
    if (btcPrice === 0) {
      console.error(`      ❌ Failed to fetch BTC price - skipping resolution`);
      return null;
    }
    const lastDigit = Math.floor(btcPrice * 100) % 10;
    const isOdd = lastDigit % 2 === 1;

    console.log(`      💰 BTC Price: $${btcPrice.toFixed(2)}`);
    console.log(`      🎲 Last digit: ${lastDigit}, ODD: ${isOdd}`);

    return isOdd;
  }

  // ETH price threshold check - "above $X"
  if (question.includes("ETH price be above")) {
    const ethPrice = await fetchCryptoPrice('ethereum');
    if (ethPrice === 0) {
      console.error(`      ❌ Failed to fetch ETH price - skipping resolution`);
      return null;
    }
    const match = question.match(/\$([0-9,]+)/);
    if (!match) return null;

    const threshold = parseInt(match[1].replace(/,/g, ''));
    const isAbove = ethPrice > threshold;

    console.log(`      💰 ETH Price: $${ethPrice.toFixed(2)}, Threshold: $${threshold}`);
    console.log(`      📊 Result: ${isAbove ? 'YES (above)' : 'NO (below or equal)'}`);

    return isAbove;
  }

  // BTC price threshold check - "above $X"
  if (question.includes("BTC price be above")) {
    const btcPrice = await fetchCryptoPrice('bitcoin');
    if (btcPrice === 0) {
      console.error(`      ❌ Failed to fetch BTC price - skipping resolution`);
      return null;
    }
    const match = question.match(/\$([0-9,]+)/);
    if (!match) return null;

    const threshold = parseInt(match[1].replace(/,/g, ''));
    const isAbove = btcPrice > threshold;

    console.log(`      💰 BTC Price: $${btcPrice.toFixed(2)}, Threshold: $${threshold}`);
    console.log(`      📊 Result: ${isAbove ? 'YES (above)' : 'NO (below or equal)'}`);

    return isAbove;
  }

  // SOL price threshold check - "above $X"
  if (question.includes("SOL price be above")) {
    const solPrice = await fetchCryptoPrice('solana');
    if (solPrice === 0) {
      console.error(`      ❌ Failed to fetch SOL price - skipping resolution`);
      return null;
    }
    const match = question.match(/\$([0-9,]+)/);
    if (!match) return null;

    const threshold = parseInt(match[1].replace(/,/g, ''));
    const isAbove = solPrice > threshold;

    console.log(`      💰 SOL Price: $${solPrice.toFixed(2)}, Threshold: $${threshold}`);
    console.log(`      📊 Result: ${isAbove ? 'YES (above)' : 'NO (below or equal)'}`);

    return isAbove;
  }

  // ETH price threshold check (touch $X before resolution)
  // ⚠️ WARNING: This only checks CURRENT price, NOT historical high/low
  // For accurate "touch" markets, you need historical price data API
  if (question.includes("ETH price touch")) {
    const ethPrice = await fetchCryptoPrice('ethereum');
    if (ethPrice === 0) {
      console.error(`      ❌ Failed to fetch ETH price - skipping resolution`);
      return null;
    }
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

    // Setup clients with fallback RPC endpoints
    const account = privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`);

    // Create fallback transport with multiple RPC endpoints
    const transports = RPC_ENDPOINTS.map(url =>
      http(url, {
        timeout: 30_000,
        retryCount: 2,
        retryDelay: 1000
      })
    );

    console.log(`   🌐 Using ${RPC_ENDPOINTS.length} RPC endpoints with fallback`);

    const publicClient = createPublicClient({
      chain: base,
      transport: fallback(transports, { rank: true })
    });

    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: fallback(transports, { rank: true })
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

    // Check each market with rate limit protection
    for (let i = 0; i < Number(marketCount); i++) {
      try {
        // Add delay between RPC calls to avoid rate limiting (500ms)
        if (i > 0) await delay(500);

        const market = await publicClient.readContract({
          address: TROLLBET_ETH_ADDRESS,
          abi: TROLLBET_ABI,
          functionName: 'markets',
          args: [BigInt(i)]
        });

        const [question, endTime, yesPool, noPool, resolved, , exists, cancelled] = market;

        if (!exists) continue;

        results.checked++;

        // Skip if already resolved or cancelled (don't log to reduce noise)
        if (resolved || cancelled) {
          results.skipped++;
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
        const maxRetries = 3;

        while (result === null && retries <= maxRetries) {
          if (retries > 0) {
            console.log(`      🔄 Retry ${retries}/${maxRetries}...`);
            await delay(3000); // Wait 3s between retries
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

        // Add delay before transaction to avoid RPC rate limits
        await delay(1000);

        let hash: `0x${string}`;
        let isCancellation = false;

        if (winningPool === 0n) {
          // Winning side has no bets - use cancelMarket for refunds
          console.log(`      ⚠️  Winning side has NO bets - cancelling for refunds`);
          isCancellation = true;

          hash = await walletClient.writeContract({
            address: TROLLBET_ETH_ADDRESS,
            abi: TROLLBET_ABI,
            functionName: 'cancelMarket',
            args: [BigInt(i)]
          });
        } else {
          // Normal resolution - winning side has bets
          hash = await walletClient.writeContract({
            address: TROLLBET_ETH_ADDRESS,
            abi: TROLLBET_ABI,
            functionName: 'resolveMarket',
            args: [BigInt(i), result]
          });
        }

        console.log(`      📤 TX sent: ${hash}`);

        // Wait for confirmation with timeout
        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          timeout: 60_000 // 60 second timeout for confirmation
        });

        // Add delay after transaction before processing next market
        await delay(1000);

        if (receipt.status === 'success') {
          if (isCancellation) {
            console.log(`      🔄 Market #${i} cancelled - users can claim refunds`);
            results.resolved++;
            results.details.push({
              marketId: i,
              question,
              result: `CANCELLED (${result ? 'YES' : 'NO'} won but no bets)`,
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
        const isRateLimit = errorMessage.includes('429') || errorMessage.includes('rate limit');

        console.error(`   ❌ Error processing market #${i}:`, errorMessage);
        results.failed++;
        results.details.push({
          marketId: i,
          status: 'error',
          error: errorMessage.substring(0, 200) // Truncate long error messages
        });

        // If rate limited, wait longer before continuing
        if (isRateLimit) {
          console.log(`   ⏳ Rate limited - waiting 5 seconds before continuing...`);
          await delay(5000);
        }
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
