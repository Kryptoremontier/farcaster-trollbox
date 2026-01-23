import { createPublicClient, http, formatEther } from 'viem';
import { baseSepolia } from 'viem/chains';

const TROLLBET_ADDRESS = '0xc629e67E221db99CF2A6e0468907bBcFb7D5f5A3';

const ABI = [
  {
    type: 'function',
    name: 'getMarket',
    inputs: [{ name: 'marketId', type: 'uint256' }],
    outputs: [
      { name: 'question', type: 'string' },
      { name: 'endTime', type: 'uint256' },
      { name: 'yesPool', type: 'uint256' },
      { name: 'noPool', type: 'uint256' },
      { name: 'resolved', type: 'bool' },
      { name: 'winningSide', type: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getUserBet',
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'user', type: 'address' }
    ],
    outputs: [
      { name: 'yesAmount', type: 'uint256' },
      { name: 'noAmount', type: 'uint256' },
      { name: 'claimed', type: 'bool' }
    ],
    stateMutability: 'view'
  }
];

const client = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

async function checkMarket(marketId, userAddress) {
  console.log(`\n📊 Checking Market #${marketId}...\n`);

  const marketData = await client.readContract({
    address: TROLLBET_ADDRESS,
    abi: ABI,
    functionName: 'getMarket',
    args: [BigInt(marketId)]
  });

  const [question, endTime, yesPool, noPool, resolved, winningSide] = marketData;

  console.log(`Question: ${question}`);
  console.log(`Resolved: ${resolved ? 'Yes' : 'No'}`);
  console.log(`Winning Side: ${winningSide ? 'YES' : 'NO'}`);
  console.log(`YES Pool: ${formatEther(yesPool)} ETH`);
  console.log(`NO Pool: ${formatEther(noPool)} ETH`);
  console.log(`Total Pool: ${formatEther(yesPool + noPool)} ETH\n`);

  if (userAddress) {
    const userBet = await client.readContract({
      address: TROLLBET_ADDRESS,
      abi: ABI,
      functionName: 'getUserBet',
      args: [BigInt(marketId), userAddress]
    });

    const [yesAmount, noAmount, claimed] = userBet;

    console.log(`Your Bet:`);
    console.log(`  YES: ${formatEther(yesAmount)} ETH`);
    console.log(`  NO: ${formatEther(noAmount)} ETH`);
    console.log(`  Claimed: ${claimed ? 'Yes' : 'No'}\n`);

    // Calculate payout
    const totalPool = yesPool + noPool;
    const winningPool = winningSide ? yesPool : noPool;
    const userWinningBet = winningSide ? yesAmount : noAmount;

    if (userWinningBet > 0n && totalPool > 0n) {
      const grossPayout = (userWinningBet * totalPool) / winningPool;
      const fee = (grossPayout * 100n) / 10000n; // 1% fee
      const netPayout = grossPayout - fee;

      console.log(`Payout Calculation:`);
      console.log(`  Gross: ${formatEther(grossPayout)} ETH`);
      console.log(`  Fee (1%): ${formatEther(fee)} ETH`);
      console.log(`  Net: ${formatEther(netPayout)} ETH`);
    } else {
      console.log(`❌ You didn't win this market`);
    }
  }
}

// Check multiple markets
async function checkAll() {
  await checkMarket(19, '0xfb7Ed318EA0E4ea699d7FB8Ae5AB8F9f3FEca76C');
  await checkMarket(20, '0xfb7Ed318EA0E4ea699d7FB8Ae5AB8F9f3FEca76C');
  await checkMarket(21, '0xfb7Ed318EA0E4ea699d7FB8Ae5AB8F9f3FEca76C');
}

checkAll()
  .then(() => process.exit(0))
  .catch(console.error);
