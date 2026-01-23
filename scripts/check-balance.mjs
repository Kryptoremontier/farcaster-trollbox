import { createPublicClient, http, formatEther } from 'viem';
import { baseSepolia } from 'viem/chains';

const client = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

const address = '0xfb7Ed318EA0E4ea699d7FB8Ae5AB8F9f3FEca76C';

async function checkBalance() {
  const balance = await client.getBalance({ address });
  console.log(`\n💰 Balance for ${address}:`);
  console.log(`   ${formatEther(balance)} ETH\n`);
  
  // Get recent transactions
  const txCount = await client.getTransactionCount({ address });
  console.log(`📊 Total transactions: ${txCount}\n`);
}

checkBalance();
