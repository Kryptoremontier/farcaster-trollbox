import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { type Address, parseUnits, formatUnits } from 'viem';
import TrollBetABI from '~/lib/abi/TrollBet.json';

// Contract address - TODO: Update this after deployment
export const TROLLBET_CONTRACT_ADDRESS: Address = '0x26dEe56f85fAa471eFF9210326734389186ac625';

// $DEGEN token address on Base (chain ID 8453)
export const DEGEN_TOKEN_ADDRESS: Address = '0xdDB5C1a86762068485baA1B481FeBeB17d30e002';

/**
 * Hook to place a bet on a market
 */
export function usePlaceBet() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const placeBet = async (marketId: number, side: boolean, amount: string) => {
    // Convert amount to wei (18 decimals for $DEGEN)
    const amountWei = parseUnits(amount, 18);

    return writeContract({
      address: TROLLBET_CONTRACT_ADDRESS,
      abi: TrollBetABI,
      functionName: 'placeBet',
      args: [BigInt(marketId), side, amountWei],
    });
  };

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
export function useClaimWinnings() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const claimWinnings = async (marketId: number) => {
    return writeContract({
      address: TROLLBET_CONTRACT_ADDRESS,
      abi: TrollBetABI,
      functionName: 'claimWinnings',
      args: [BigInt(marketId)],
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
 * Hook to approve $DEGEN token spending
 */
export function useApproveToken() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const approve = async (amount: string) => {
    const amountWei = parseUnits(amount, 18);

    // ERC20 approve ABI
    const erc20ABI = [
      {
        type: 'function',
        name: 'approve',
        inputs: [
          { name: 'spender', type: 'address' },
          { name: 'amount', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable'
      }
    ] as const;

    return writeContract({
      address: DEGEN_TOKEN_ADDRESS,
      abi: erc20ABI,
      functionName: 'approve',
      args: [TROLLBET_CONTRACT_ADDRESS, amountWei],
    });
  };

  return {
    approve,
    hash,
    isPending,
    error,
  };
}

/**
 * Hook to get market data
 */
export function useMarketData(marketId: number) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: TROLLBET_CONTRACT_ADDRESS,
    abi: TrollBetABI,
    functionName: 'getMarket',
    args: [BigInt(marketId)],
  });

  // Parse the return data
  const marketData = data ? {
    question: (data as readonly [string, bigint, bigint, bigint, boolean, boolean])[0],
    endTime: Number((data as readonly [string, bigint, bigint, bigint, boolean, boolean])[1]),
    yesPool: formatUnits((data as readonly [string, bigint, bigint, bigint, boolean, boolean])[2], 18),
    noPool: formatUnits((data as readonly [string, bigint, bigint, bigint, boolean, boolean])[3], 18),
    resolved: (data as readonly [string, bigint, bigint, bigint, boolean, boolean])[4],
    winningSide: (data as readonly [string, bigint, bigint, bigint, boolean, boolean])[5],
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
export function useUserBet(marketId: number, userAddress?: Address) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: TROLLBET_CONTRACT_ADDRESS,
    abi: TrollBetABI,
    functionName: 'getUserBet',
    args: userAddress ? [BigInt(marketId), userAddress] : undefined,
    query: {
      enabled: !!userAddress && marketId !== undefined,
    },
  });

  const userBet = data ? {
    yesAmount: formatUnits((data as readonly [bigint, bigint, boolean])[0], 18),
    noAmount: formatUnits((data as readonly [bigint, bigint, boolean])[1], 18),
    claimed: (data as readonly [bigint, bigint, boolean])[2],
  } : null;

  return {
    userBet,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get total pool for a market
 */
export function useTotalPool(marketId: number) {
  const { data, isLoading, error } = useReadContract({
    address: TROLLBET_CONTRACT_ADDRESS,
    abi: TrollBetABI,
    functionName: 'getTotalPool',
    args: [BigInt(marketId)],
  });

  const totalPool = data ? formatUnits(data as bigint, 18) : '0';

  return {
    totalPool,
    isLoading,
    error,
  };
}

/**
 * Hook to calculate payout for a potential bet
 */
export function useCalculatePayout(marketId: number, side: boolean, amount: string) {
  const amountWei = amount ? parseUnits(amount, 18) : BigInt(0);

  const { data, isLoading, error } = useReadContract({
    address: TROLLBET_CONTRACT_ADDRESS,
    abi: TrollBetABI,
    functionName: 'calculatePayout',
    args: [BigInt(marketId), side, amountWei],
  });

  const payout = data ? {
    grossPayout: formatUnits((data as readonly [bigint, bigint])[0], 18),
    netPayout: formatUnits((data as readonly [bigint, bigint])[1], 18),
  } : null;

  return {
    payout,
    isLoading,
    error,
  };
}

/**
 * Hook to get user's $DEGEN balance
 */
export function useDegenBalance(userAddress?: Address) {
  // ERC20 balanceOf ABI
  const erc20BalanceABI = [
    {
      type: 'function',
      name: 'balanceOf',
      inputs: [{ name: 'account', type: 'address' }],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view'
    }
  ] as const;

  const { data, isLoading, error, refetch } = useReadContract({
    address: DEGEN_TOKEN_ADDRESS,
    abi: erc20BalanceABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
  });

  const balance = data ? formatUnits(data as bigint, 18) : '0';

  return {
    balance,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to check $DEGEN allowance for TrollBet contract
 */
export function useDegenAllowance(userAddress?: Address) {
  // ERC20 allowance ABI
  const erc20AllowanceABI = [
    {
      type: 'function',
      name: 'allowance',
      inputs: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' }
      ],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view'
    }
  ] as const;

  const { data, isLoading, error, refetch } = useReadContract({
    address: DEGEN_TOKEN_ADDRESS,
    abi: erc20AllowanceABI,
    functionName: 'allowance',
    args: userAddress ? [userAddress, TROLLBET_CONTRACT_ADDRESS] : undefined,
  });

  const allowance = data ? formatUnits(data as bigint, 18) : '0';

  return {
    allowance,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to wait for transaction confirmation with toast-friendly status
 */
export function useTransactionStatus(hash?: `0x${string}`) {
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
