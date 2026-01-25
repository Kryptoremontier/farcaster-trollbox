#!/usr/bin/env node

/**
 * Semi-automatic political/event market resolver
 * Uses Tavily AI to check current events, but requires manual confirmation
 *
 * Usage: node scripts/check-political-market.mjs --id 9
 */

import { createPublicClient, createWalletClient, http, formatEther } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.mainnet
config({ path: join(__dirname, '..', '.env.mainnet') });

// Contract config
const TROLLBET_ETH_ADDRESS = '0x52ABabe88DE8799B374b11B91EC1b32989779e55';

const TROLLBET_ABI = [
  {
    inputs: [{ name: '', type: 'uint256' }],
    name: 'markets',
    outputs: [
      { name: 'question', type: 'string' },
      { name: 'endTime', type: 'uint256' },
      { name: 'yesPool', type: 'uint256' },
      { name: 'noPool', type: 'uint256' },
      { name: 'resolved', type: 'bool' },
      { name: 'winningSide', type: 'bool' },
      { name: 'exists', type: 'bool' },
      { name: 'cancelled', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'winningSide', type: 'bool' }
    ],
    name: 'resolveMarket',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

// Parse command line args
function parseArgs() {
  const args = process.argv.slice(2);
  const result = { id: null };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--id' && args[i + 1]) {
      result.id = parseInt(args[i + 1]);
    }
  }

  return result;
}

// Ask Tavily about the event
async function askTavily(question) {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    throw new Error('TAVILY_API_KEY not found in .env.mainnet');
  }

  // Convert market question to search query
  const searchQuery = `${question} - Did this happen? Current status as of ${new Date().toISOString().split('T')[0]}`;

  console.log(`\n   🔍 Asking Tavily: "${searchQuery}"\n`);

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: apiKey,
      query: searchQuery,
      search_depth: 'advanced',
      include_answer: true,
      include_raw_content: false,
      max_results: 5
    })
  });

  if (!response.ok) {
    throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

// Analyze Tavily response to suggest YES/NO
function analyzeResponse(tavilyData, question) {
  const answer = tavilyData.answer || '';
  const answerLower = answer.toLowerCase();

  // Keywords that suggest YES
  const yesKeywords = ['yes', 'confirmed', 'happened', 'occurred', 'did happen', 'has happened', 'took place', 'was confirmed', 'struck', 'attacked'];

  // Keywords that suggest NO
  const noKeywords = ['no', 'not', 'hasn\'t', 'hasn\'t happened', 'did not', 'has not', 'never', 'denied', 'no evidence', 'unconfirmed', 'no confirmed'];

  let yesScore = 0;
  let noScore = 0;

  for (const keyword of yesKeywords) {
    if (answerLower.includes(keyword)) yesScore++;
  }

  for (const keyword of noKeywords) {
    if (answerLower.includes(keyword)) noScore++;
  }

  let suggestion = null;
  let confidence = 'low';

  if (yesScore > noScore + 1) {
    suggestion = true;
    confidence = yesScore > 3 ? 'high' : 'medium';
  } else if (noScore > yesScore + 1) {
    suggestion = false;
    confidence = noScore > 3 ? 'high' : 'medium';
  }

  return { suggestion, confidence, yesScore, noScore };
}

// Interactive prompt
function askQuestion(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

async function main() {
  const args = parseArgs();

  if (args.id === null) {
    console.log('\n❌ Usage: node scripts/check-political-market.mjs --id <market_id>\n');
    console.log('Example: node scripts/check-political-market.mjs --id 9\n');
    process.exit(1);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('🏛️  POLITICAL MARKET RESOLVER (Semi-Automatic)');
  console.log('═'.repeat(60) + '\n');

  // Check for required env vars
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    console.error('❌ DEPLOYER_PRIVATE_KEY not found in .env.mainnet');
    process.exit(1);
  }

  if (!process.env.TAVILY_API_KEY) {
    console.error('❌ TAVILY_API_KEY not found in .env.mainnet');
    process.exit(1);
  }

  // Setup clients
  const account = privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY);
  const rpcUrl = process.env.BASE_MAINNET_RPC_URL || 'https://mainnet.base.org';

  const publicClient = createPublicClient({
    chain: base,
    transport: http(rpcUrl)
  });

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(rpcUrl)
  });

  // Get market data
  console.log(`📋 Loading Market #${args.id}...\n`);

  const market = await publicClient.readContract({
    address: TROLLBET_ETH_ADDRESS,
    abi: TROLLBET_ABI,
    functionName: 'markets',
    args: [BigInt(args.id)]
  });

  const [question, endTime, yesPool, noPool, resolved, winningSide, exists, cancelled] = market;

  if (!exists) {
    console.error(`❌ Market #${args.id} does not exist\n`);
    process.exit(1);
  }

  if (resolved) {
    console.log(`⚠️  Market #${args.id} is already resolved (Winner: ${winningSide ? 'YES' : 'NO'})\n`);
    process.exit(0);
  }

  if (cancelled) {
    console.log(`⚠️  Market #${args.id} was cancelled\n`);
    process.exit(0);
  }

  const now = Math.floor(Date.now() / 1000);
  const hasEnded = now >= Number(endTime);

  // Display market info
  console.log('┌' + '─'.repeat(58) + '┐');
  console.log(`│ Market #${args.id}`.padEnd(59) + '│');
  console.log('├' + '─'.repeat(58) + '┤');
  console.log(`│ Question: ${question}`.slice(0, 58).padEnd(59) + '│');
  if (question.length > 47) {
    console.log(`│           ${question.slice(47)}`.slice(0, 58).padEnd(59) + '│');
  }
  console.log('├' + '─'.repeat(58) + '┤');
  console.log(`│ End Time: ${new Date(Number(endTime) * 1000).toLocaleString()}`.padEnd(59) + '│');
  console.log(`│ Status:   ${hasEnded ? '🔴 ENDED' : '🟢 ACTIVE'}`.padEnd(60) + '│');
  console.log('├' + '─'.repeat(58) + '┤');
  console.log(`│ YES Pool: ${formatEther(yesPool)} ETH`.padEnd(59) + '│');
  console.log(`│ NO Pool:  ${formatEther(noPool)} ETH`.padEnd(59) + '│');
  console.log(`│ Total:    ${formatEther(yesPool + noPool)} ETH`.padEnd(59) + '│');
  console.log('└' + '─'.repeat(58) + '┘');

  if (!hasEnded) {
    console.log('\n⚠️  Market has not ended yet. Cannot resolve.\n');
    process.exit(0);
  }

  // Query Tavily
  console.log('\n🤖 Consulting Tavily AI...\n');

  let tavilyData;
  try {
    tavilyData = await askTavily(question);
  } catch (error) {
    console.error(`❌ Tavily error: ${error.message}\n`);
    console.log('💡 You can still resolve manually. Enter your decision below.\n');
    tavilyData = { answer: null, results: [] };
  }

  // Show Tavily's answer
  if (tavilyData.answer) {
    console.log('┌' + '─'.repeat(58) + '┐');
    console.log('│ 🤖 TAVILY AI RESPONSE'.padEnd(59) + '│');
    console.log('├' + '─'.repeat(58) + '┤');

    // Word wrap the answer
    const words = tavilyData.answer.split(' ');
    let line = '│ ';
    for (const word of words) {
      if ((line + word).length > 57) {
        console.log(line.padEnd(59) + '│');
        line = '│ ' + word + ' ';
      } else {
        line += word + ' ';
      }
    }
    if (line.length > 2) {
      console.log(line.padEnd(59) + '│');
    }
    console.log('└' + '─'.repeat(58) + '┘');

    // Show sources
    if (tavilyData.results && tavilyData.results.length > 0) {
      console.log('\n📰 Sources:');
      for (const result of tavilyData.results.slice(0, 3)) {
        console.log(`   • ${result.title?.slice(0, 50)}...`);
        console.log(`     ${result.url}`);
      }
    }
  }

  // Analyze and suggest
  const analysis = analyzeResponse(tavilyData, question);

  console.log('\n' + '─'.repeat(60));
  if (analysis.suggestion !== null) {
    const suggestionText = analysis.suggestion ? '✅ YES' : '❌ NO';
    console.log(`\n🎯 Tavily suggests: ${suggestionText} (confidence: ${analysis.confidence})\n`);
  } else {
    console.log('\n⚠️  Tavily could not determine a clear answer.\n');
  }
  console.log('─'.repeat(60));

  // Ask for confirmation
  console.log('\n📝 YOUR DECISION:\n');
  const decision = await askQuestion('   Resolve as YES (y), NO (n), or cancel (c)? ');

  if (decision === 'c' || decision === 'cancel') {
    console.log('\n🚫 Cancelled. Market not resolved.\n');
    process.exit(0);
  }

  let finalResult;
  if (decision === 'y' || decision === 'yes') {
    finalResult = true;
  } else if (decision === 'n' || decision === 'no') {
    finalResult = false;
  } else {
    console.log('\n❌ Invalid input. Please enter y, n, or c.\n');
    process.exit(1);
  }

  // Confirm again
  const confirm = await askQuestion(`\n   ⚠️  Confirm resolve Market #${args.id} as ${finalResult ? 'YES' : 'NO'}? (y/n) `);

  if (confirm !== 'y' && confirm !== 'yes') {
    console.log('\n🚫 Cancelled. Market not resolved.\n');
    process.exit(0);
  }

  // Resolve market
  console.log('\n📤 Sending transaction...\n');

  try {
    const hash = await walletClient.writeContract({
      address: TROLLBET_ETH_ADDRESS,
      abi: TROLLBET_ABI,
      functionName: 'resolveMarket',
      args: [BigInt(args.id), finalResult]
    });

    console.log(`   TX Hash: ${hash}`);
    console.log(`   🔗 https://basescan.org/tx/${hash}\n`);

    // Wait for confirmation
    console.log('   Waiting for confirmation...');
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      console.log(`\n✅ Market #${args.id} resolved as ${finalResult ? 'YES' : 'NO'}!\n`);
      console.log('   Winners can now claim their payouts. 💰\n');
    } else {
      console.log('\n❌ Transaction failed!\n');
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
  }
}

main().catch(console.error);
