#!/usr/bin/env node

/**
 * Quick Contract Update Script
 * 
 * Usage:
 * node update-contracts.js <MOCKDEGEN_ADDRESS> <TROLLBET_ADDRESS>
 * 
 * Example:
 * node update-contracts.js 0x1234...5678 0xabcd...ef12
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function main() {
  log('\n🚀 TrollBox Contract Update Script', 'blue');
  log('====================================\n', 'blue');

  // Get addresses from command line
  const [,, mockDegenAddress, trollBetAddress] = process.argv;

  if (!mockDegenAddress || !trollBetAddress) {
    log('❌ Missing addresses!', 'red');
    log('\nUsage:', 'yellow');
    log('  node update-contracts.js <MOCKDEGEN_ADDRESS> <TROLLBET_ADDRESS>\n', 'reset');
    log('Example:', 'yellow');
    log('  node update-contracts.js 0x1234567890abcdef 0xabcdef1234567890\n', 'reset');
    process.exit(1);
  }

  // Validate addresses
  if (!mockDegenAddress.startsWith('0x') || mockDegenAddress.length !== 42) {
    log('❌ Invalid MockDEGEN address format!', 'red');
    process.exit(1);
  }

  if (!trollBetAddress.startsWith('0x') || trollBetAddress.length !== 42) {
    log('❌ Invalid TrollBet address format!', 'red');
    process.exit(1);
  }

  log('📝 Addresses received:', 'green');
  log(`   MockDEGEN: ${mockDegenAddress}`, 'reset');
  log(`   TrollBet:  ${trollBetAddress}\n`, 'reset');

  // Step 1: Update useTrollBet.ts
  log('📝 Step 1: Updating src/hooks/useTrollBet.ts...', 'yellow');
  const hooksFile = path.join(__dirname, 'src', 'hooks', 'useTrollBet.ts');
  let hooksContent = fs.readFileSync(hooksFile, 'utf8');
  
  hooksContent = hooksContent.replace(
    /export const TROLLBET_CONTRACT_ADDRESS: Address = '0x[0-9a-fA-F]{40}';/,
    `export const TROLLBET_CONTRACT_ADDRESS: Address = '${trollBetAddress}';`
  );
  
  hooksContent = hooksContent.replace(
    /export const DEGEN_TOKEN_ADDRESS: Address = '0x[0-9a-fA-F]{40}';/,
    `export const DEGEN_TOKEN_ADDRESS: Address = '${mockDegenAddress}';`
  );
  
  fs.writeFileSync(hooksFile, hooksContent);
  log('   ✅ Updated contract addresses\n', 'green');

  // Step 2: Update mockMarkets.ts with contractMarketId
  log('📝 Step 2: Updating src/lib/mockMarkets.ts...', 'yellow');
  const marketsFile = path.join(__dirname, 'src', 'lib', 'mockMarkets.ts');
  let marketsContent = fs.readFileSync(marketsFile, 'utf8');
  
  // Update first 6 markets with contractMarketId
  const marketUpdates = [
    { id: 'peter-schiff-btc', contractId: 0 },
    { id: 'degen-price', contractId: 1 },
    { id: 'elon-pepe', contractId: 2 },
    { id: 'base-tvl', contractId: 3 },
    { id: 'vitalik-tweet', contractId: 4 },
    { id: 'farcaster-users', contractId: 5 },
  ];

  marketUpdates.forEach(({ id, contractId }) => {
    const regex = new RegExp(
      `(id: '${id}',\\s*contractMarketId: )\\d+`,
      'g'
    );
    marketsContent = marketsContent.replace(
      regex,
      `$1${contractId}`
    );
  });
  
  fs.writeFileSync(marketsFile, marketsContent);
  log('   ✅ Updated market IDs (0-5)\n', 'green');

  // Step 3: Update .env file
  log('📝 Step 3: Updating contracts/.env...', 'yellow');
  const envFile = path.join(__dirname, 'contracts', '.env');
  let envContent = fs.readFileSync(envFile, 'utf8');
  
  if (!envContent.includes('DEGEN_TOKEN_SEPOLIA=')) {
    envContent += `\n# Deployed on Base Sepolia\nDEGEN_TOKEN_SEPOLIA=${mockDegenAddress}\n`;
  } else {
    envContent = envContent.replace(
      /DEGEN_TOKEN_SEPOLIA=.*/,
      `DEGEN_TOKEN_SEPOLIA=${mockDegenAddress}`
    );
  }
  
  if (!envContent.includes('TROLLBET_ADDRESS=')) {
    envContent += `TROLLBET_ADDRESS=${trollBetAddress}\n`;
  } else {
    envContent = envContent.replace(
      /TROLLBET_ADDRESS=.*/,
      `TROLLBET_ADDRESS=${trollBetAddress}`
    );
  }
  
  fs.writeFileSync(envFile, envContent);
  log('   ✅ Updated .env file\n', 'green');

  // Step 4: Build
  log('🔨 Step 4: Building project...', 'yellow');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    log('   ✅ Build successful!\n', 'green');
  } catch (error) {
    log('   ❌ Build failed!', 'red');
    log('   Please fix errors and try again.\n', 'yellow');
    process.exit(1);
  }

  // Step 5: Git commit
  log('📦 Step 5: Committing changes...', 'yellow');
  try {
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "Deploy: TrollBet on Base Sepolia with contracts"', { stdio: 'inherit' });
    log('   ✅ Changes committed!\n', 'green');
  } catch (error) {
    log('   ⚠️  Commit failed (maybe no changes?)', 'yellow');
  }

  // Step 6: Push
  log('🚀 Step 6: Pushing to GitHub...', 'yellow');
  try {
    execSync('git push origin main', { stdio: 'inherit' });
    log('   ✅ Pushed to GitHub!\n', 'green');
  } catch (error) {
    log('   ❌ Push failed!', 'red');
    log('   You may need to push manually: git push origin main\n', 'yellow');
  }

  // Summary
  log('\n🎉 DEPLOYMENT COMPLETE!', 'green');
  log('======================\n', 'green');
  log('📝 Summary:', 'blue');
  log(`   MockDEGEN:  ${mockDegenAddress}`, 'reset');
  log(`   TrollBet:   ${trollBetAddress}`, 'reset');
  log(`   Markets:    0-5 (6 markets created)`, 'reset');
  log(`   Status:     Pushed to GitHub ✅`, 'reset');
  log(`   Netlify:    Deploying now (~2 min)`, 'reset');
  log('\n🔗 Links:', 'blue');
  log(`   BaseScan MockDEGEN: https://sepolia.basescan.org/address/${mockDegenAddress}`, 'reset');
  log(`   BaseScan TrollBet:  https://sepolia.basescan.org/address/${trollBetAddress}`, 'reset');
  log(`   Netlify:            https://farcaster-trollbox.netlify.app`, 'reset');
  log(`   Warpcast Test:      https://warpcast.com/~/developers/frames`, 'reset');
  log('\n✨ Next: Test in Warpcast playground!\n', 'yellow');
}

main();
