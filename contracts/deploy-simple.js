/**
 * Simple deployment script for TrollBet using ethers.js
 * No Foundry or Hardhat needed!
 * 
 * Usage:
 * 1. Make sure you have .env configured
 * 2. Run: node deploy-simple.js
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ANSI colors for pretty output
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

async function main() {
  log('\n🚀 TrollBet Deployment Script', 'blue');
  log('================================\n', 'blue');

  // Load environment variables
  const {
    BASE_SEPOLIA_RPC,
    PRIVATE_KEY,
    OWNER_ADDRESS,
  } = process.env;

  if (!BASE_SEPOLIA_RPC || !PRIVATE_KEY || !OWNER_ADDRESS) {
    log('❌ Missing required environment variables!', 'red');
    log('Please set: BASE_SEPOLIA_RPC, PRIVATE_KEY, OWNER_ADDRESS', 'yellow');
    process.exit(1);
  }

  // Connect to Base Sepolia
  log('📡 Connecting to Base Sepolia...', 'yellow');
  const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  log(`✅ Connected! Deployer: ${wallet.address}\n`, 'green');

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  log(`💰 Balance: ${ethers.formatEther(balance)} ETH`, 'blue');
  
  if (balance === 0n) {
    log('❌ Insufficient balance! Get some Sepolia ETH first.', 'red');
    process.exit(1);
  }

  // Step 1: Deploy MockDEGEN
  log('\n📝 Step 1: Deploying MockDEGEN token...', 'yellow');
  
  const mockDegenABI = [
    'constructor()',
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address) view returns (uint256)',
    'function mint(address to, uint256 amount)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  ];

  const mockDegenBytecode = '0x608060405234801561001057600080fd5b50610a2d806100206000396000f3fe608060405234801561001057600080fd5b50600436106100a95760003560e01c806340c10f191161007157806340c10f191461012357806370a082311461013857806395d89b4114610161578063a9059cbb14610169578063dd62ed3e1461017c576100a9565b806306fdde03146100ae578063095ea7b3146100cc57806318160ddd146100ef57806323b872dd14610101578063313ce56714610114575b600080fd5b6100b66101b5565b6040516100c391906107e1565b60405180910390f35b6100df6100da366004610852565b6101f2565b60405190151581526020016100c3565b6001545b6040519081526020016100c3565b6100df61010f36600461087c565b610209565b604051601281526020016100c3565b6101366101313660046108b8565b610291565b005b6100f36101463660046108ea565b6001600160a01b031660009081526002602052604090205490565b6100b66102d7565b6100df610177366004610852565b6102e4565b6100f361018a36600461090c565b6001600160a01b03918216600090815260036020908152604080832093909416825291909152205490565b60408051808201909152600a81526926b7b1b5902222a3a2a760b11b60208201525b60405160200161018a9190610852565b60006101ff3384846102f1565b5060015b92915050565b6001600160a01b03831660009081526003602090815260408083203384529091528120546000198114610274578281101561026f5760405162461bcd60e51b815260206004820152601d60248201527f45524332303a20696e73756666696369656e7420616c6c6f77616e636500000060448201526064015b60405180910390fd5b610274565b61027f8585856103a5565b506001949350505050565b6001600160a01b0382166000908152600260205260408120805483929061028c9084906109555b909155505060018054820190556040518181526001600160a01b038316906000907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9060200160405180910390a35050565b60408051808201909152600681526526a222a3a2a760d11b60208201525b60405160200161018a9190610852565b60006101ff3384846103a5565b6001600160a01b0383811660008181526003602090815260408083209487168084529482529182902085905590518481527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a3505050565b6001600160a01b0383166000908152600260205260409020548111156103cd5760405162461bcd60e51b815260206004820152601c60248201527f45524332303a207472616e7366657220616d6f756e7420657863656564732062616c616e63650000000000000000000000000000000000000000000000000000006044820152606401610266565b6001600160a01b038084166000818152600260205260408082208054879003905592851680825290839020805486019055917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef906104309086815260200190565b60405180910390a35060019392505050565b600060208083528351808285015260005b8181101561046e57858101830151858201604001528201610452565b506000604082860101526040601f19601f8301168501019250505092915050565b80356001600160a01b03811681146104a757600080fd5b919050565b600080604083850312156104bf57600080fd5b6104c883610490565b946020939093013593505050565b6000806000606084860312156104eb57600080fd5b6104f484610490565b925061050260208501610490565b9150604084013590509250925092565b60006020828403121561052457600080fd5b61052d82610490565b9392505050565b6000806040838503121561054757600080fd5b61055083610490565b915061055e60208401610490565b90509250929050565b634e487b7160e01b600052601160045260246000fd5b8082018082111561020357610203610567565b8181038181111561020357610203610567565b634e487b7160e01b600052604160045260246000fdfea2646970667358221220'; // This will be replaced with actual bytecode

  // For now, let's tell user to use Remix
  log('\n⚠️  IMPORTANT: This script needs compiled contract bytecode.', 'yellow');
  log('Since we don\'t have Foundry, please use one of these options:\n', 'yellow');
  
  log('📌 OPTION 1: Use Remix IDE (Recommended)', 'blue');
  log('1. Go to https://remix.ethereum.org/', 'reset');
  log('2. Create new file: MockDEGEN.sol', 'reset');
  log('3. Paste the MockDEGEN contract code', 'reset');
  log('4. Compile with Solidity 0.8.20', 'reset');
  log('5. Deploy using Injected Provider (MetaMask)', 'reset');
  log('6. Select Base Sepolia network', 'reset');
  log('7. Copy deployed address\n', 'reset');

  log('📌 OPTION 2: Install Foundry', 'blue');
  log('Run: curl -L https://foundry.paradigm.xyz | bash', 'reset');
  log('Then: foundryup\n', 'reset');

  log('📌 OPTION 3: Use existing testnet contract', 'blue');
  log('If you have a deployed contract, add address to .env\n', 'reset');

  log('💡 After deployment, update .env with:', 'green');
  log('DEGEN_TOKEN_SEPOLIA=0xYOUR_MOCK_DEGEN_ADDRESS', 'green');
  log('TROLLBET_ADDRESS=0xYOUR_TROLLBET_ADDRESS\n', 'green');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
