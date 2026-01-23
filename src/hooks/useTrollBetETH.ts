import { useReadContract, useWaitForTransactionReceipt, useWriteContract, useAccount, useBalance } from 'wagmi';
import { type Address, parseEther, formatEther } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { fromSolidityTimestamp } from '~/lib/utils';

// TrollBetETH ABI (Native ETH version - no token approval needed!)
const TrollBetETH_ABI = [
  // placeBet - now payable, no amount parameter
  {
    type: 'function',
    name: 'placeBet',
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'side', type: 'bool' }
    ],
    outputs: [],
    stateMutability: 'payable'
  },
  // claimWinnings
  {
    type: 'function',
    name: 'claimWinnings',
    inputs: [{ name: 'marketId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  // getMarket
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
  // getUserBet
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
  },
  // calculatePayout
  {
    type: 'function',
    name: 'calculatePayout',
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'side', type: 'bool' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [
      { name: 'grossPayout', type: 'uint256' },
      { name: 'netPayout', type: 'uint256' }
    ],
    stateMutability: 'view'
  },
  // getTotalPool
  {
    type: 'function',
    name: 'getTotalPool',
    inputs: [{ name: 'marketId', type: 'uint256' }],
    outputs: [{ name: 'totalPool', type: 'uint256' }],
    stateMutability: 'view'
  }
] as const;

// Contract address - UPDATE THIS after deploying TrollBetETH!
// TODO: Deploy TrollBetETH via Remix and paste address here
export const TROLLBET_ETH_ADDRESS: Address = '0xc629e67E221db99CF2A6e0468907bBcFb7D5f5A3';

// ⚠️ IMPORTANT: After deploying TrollBetETH via Remix, update the address above!
// Example: export const TROLLBET_ETH_ADDRESS: Address = '0x1234...5678';

/**
 * Hook to place a bet using Native ETH
 * NO APPROVAL NEEDED! Just send ETH directly.
 */
export function usePlaceBetETH() {
  const { address } = useAccount();
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const placeBet = (marketId: number, side: boolean, amountETH: string) => {
    console.log('[TrollBetETH] placeBet called', { marketId, side, amountETH, address });
    
    if (!address) {
      throw new Error('No wallet connected');
    }
    
    // Convert ETH string to wei
    const valueWei = parseEther(amountETH);

    console.log('[TrollBetETH] calling writeContract for placeBet...', {
      address: TROLLBET_ETH_ADDRESS,
      marketId,
      side,
      value: valueWei.toString(),
    });

    // Call with value (ETH amount) - NO token approval needed!
    writeContract({
      address: TROLLBET_ETH_ADDRESS,
      abi: TrollBetETH_ABI,
      functionName: 'placeBet',
      args: [BigInt(marketId), side],
      value: valueWei, // ETH sent with transaction
      chainId: baseSepolia.id,
    });
    
    console.log('[TrollBetETH] placeBet writeContract called');
  };

  if (error) {
    console.error('[TrollBetETH] placeBet hook error:', error);
  }

  return {
    placeBet,
    hash,
    isPending,
    error,
  };
}

/**
 * Hook to claim winnings from a resolved market
 */
export function useClaimWinningsETH() {
  const { address } = useAccount();
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const claimWinnings = (marketId: number) => {
    console.log('[TrollBetETH] claimWinnings called', { marketId, address });
    
    if (!address) {
      throw new Error('No wallet connected');
    }

    writeContract({
      address: TROLLBET_ETH_ADDRESS,
      abi: TrollBetETH_ABI,
      functionName: 'claimWinnings',
      args: [BigInt(marketId)],
      chainId: baseSepolia.id,
    });
  };

  return {
    claimWinnings,
    hash,
    isPending,
    error,
  };
}

/**
 * Hook to get user's native ETH balance
 */
export function useETHBalance(userAddress?: Address) {
  const { data, isLoading, error, refetch } = useBalance({
    address: userAddress,
    chainId: baseSepolia.id,
  });

  const balance = data ? formatEther(data.value) : '0';

  return {
    balance,
    balanceWei: data?.value ?? BigInt(0),
    symbol: data?.symbol ?? 'ETH',
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get market data
 */
export function useMarketDataETH(marketId: number) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: TROLLBET_ETH_ADDRESS,
    abi: TrollBetETH_ABI,
    functionName: 'getMarket',
    args: [BigInt(marketId)],
    chainId: baseSepolia.id,
  });

  const marketData = data ? {
    question: data[0],
    endTime: Number(data[1]), // Solidity timestamp in seconds
    endTimeDate: fromSolidityTimestamp(data[1]), // Converted to JS Date
    yesPool: formatEther(data[2]),
    noPool: formatEther(data[3]),
    resolved: data[4],
    winningSide: data[5],
  } : null;

  return {
    marketData,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get user's bet on a market
 */
export function useUserBetETH(marketId: number, userAddress?: Address) {
  const { data, isLoading, error, refetch, isFetching } = useReadContract({
    address: TROLLBET_ETH_ADDRESS,
    abi: TrollBetETH_ABI,
    functionName: 'getUserBet',
    args: userAddress ? [BigInt(marketId), userAddress] : undefined,
    chainId: baseSepolia.id,
    query: {
      enabled: !!userAddress && marketId !== undefined,
      refetchInterval: 5000, // Every 5 seconds
      staleTime: 0, // Always consider data stale
      gcTime: 60000, // Keep in cache for 60 seconds (longer)
      refetchOnMount: true, // Refetch when component mounts
      refetchOnWindowFocus: true, // Refetch when window regains focus
    },
  });

  const userBet = data ? {
    yesAmount: formatEther(data[0]),
    noAmount: formatEther(data[1]),
    claimed: data[2],
  } : null;

  // Debug logging
  if (data && (Number(data[0]) > 0 || Number(data[1]) > 0)) {
    console.log('[useUserBetETH] Found bet for market', marketId, {
      yesAmount: formatEther(data[0]),
      noAmount: formatEther(data[1]),
      claimed: data[2],
    });
  }

  return {
    userBet,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to calculate potential payout for a bet
 */
export function useCalculatePayoutETH(marketId: number, side: boolean, amountETH: string) {
  const amountWei = amountETH ? parseEther(amountETH) : BigInt(0);

  const { data, isLoading, error } = useReadContract({
    address: TROLLBET_ETH_ADDRESS,
    abi: TrollBetETH_ABI,
    functionName: 'calculatePayout',
    args: [BigInt(marketId), side, amountWei],
    chainId: baseSepolia.id,
  });

  const payout = data ? {
    grossPayout: formatEther(data[0]),
    netPayout: formatEther(data[1]),
  } : null;

  return {
    payout,
    isLoading,
    error,
  };
}

/**
 * Hook to get total pool for a market
 */
export function useTotalPoolETH(marketId: number) {
  const { data, isLoading, error } = useReadContract({
    address: TROLLBET_ETH_ADDRESS,
    abi: TrollBetETH_ABI,
    functionName: 'getTotalPool',
    args: [BigInt(marketId)],
    chainId: baseSepolia.id,
  });

  const totalPool = data ? formatEther(data) : '0';

  return {
    totalPool,
    isLoading,
    error,
  };
}

/**
 * Hook to wait for transaction confirmation
 */
export function useTransactionStatusETH(hash?: `0x${string}`) {
  const { data, isLoading, isSuccess, isError } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    receipt: data,
    isConfirming: isLoading,
    isConfirmed: isSuccess,
    isError,
  };
}
