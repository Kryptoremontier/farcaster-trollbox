import { useReadContract, useWaitForTransactionReceipt, useWriteContract, useAccount } from 'wagmi';
import { type Address, parseUnits, formatUnits } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import TrollBetABI from '~/lib/abi/TrollBet.json';

// ERC20 ABI for approve
const ERC20_ABI = [
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'mint',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  }
] as const;

// Contract address - TODO: Update this after deployment
export const TROLLBET_CONTRACT_ADDRESS: Address = '0x26dEe56f85fAa471eFF9210326734389186ac625';

// $DEGEN token address on Base (chain ID 8453)
export const DEGEN_TOKEN_ADDRESS: Address = '0xdDB5C1a86762068485baA1B481FeBeB17d30e002';

/**
 * Hook to place a bet on a market - using writeContract with explicit account
 */
export function usePlaceBet() {
  const { address } = useAccount();
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const placeBet = (marketId: number, side: boolean, amount: string) => {
    console.log('[useTrollBet] placeBet called', { marketId, side, amount, address });
    
    if (!address) {
      throw new Error('No wallet connected');
    }
    
    const amountWei = parseUnits(amount, 18);

    console.log('[useTrollBet] calling writeContract for placeBet...', {
      address: TROLLBET_CONTRACT_ADDRESS,
      marketId,
      side,
      amountWei: amountWei.toString(),
    });

    // Call with explicit chainId for Farcaster wallet
    writeContract({
      address: TROLLBET_CONTRACT_ADDRESS,
      abi: TrollBetABI,
      functionName: 'placeBet',
      args: [BigInt(marketId), side, amountWei],
      chainId: baseSepolia.id,
    });
    
    console.log('[useTrollBet] placeBet writeContract called');
  };

  if (error) {
    console.error('[useTrollBet] placeBet hook error:', error);
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
export function useClaimWinnings() {
  const { address } = useAccount();
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const claimWinnings = (marketId: number) => {
    console.log('[useTrollBet] claimWinnings called', { marketId, address });
    
    if (!address) {
      throw new Error('No wallet connected');
    }

    writeContract({
      address: TROLLBET_CONTRACT_ADDRESS,
      abi: TrollBetABI,
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
 * Hook to approve $DEGEN token spending (unlimited approval)
 */
export function useApproveToken() {
  const { address } = useAccount();
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  // Max uint256 for unlimited approval
  const MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

  const approve = (_amount?: string) => {
    console.log('[useTrollBet] approve called', { address });
    
    if (!address) {
      throw new Error('No wallet connected');
    }

    console.log('[useTrollBet] calling writeContract for approve...', {
      token: DEGEN_TOKEN_ADDRESS,
      spender: TROLLBET_CONTRACT_ADDRESS,
    });

    // Call with explicit chainId for Farcaster wallet
    writeContract({
      address: DEGEN_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [TROLLBET_CONTRACT_ADDRESS, MAX_UINT256],
      chainId: baseSepolia.id,
    });
    
    console.log('[useTrollBet] approve writeContract called');
  };

  if (error) {
    console.error('[useTrollBet] approve hook error:', error);
  }

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
      refetchInterval: 3000, // Refetch every 3 seconds
      staleTime: 0, // Always consider data stale
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

/**
 * Hook to mint test tokens (only works on testnet with MockDEGEN)
 */
export function useMintTestTokens() {
  const { address } = useAccount();
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const mintTokens = (toAddress: Address, amount: string = "10000") => {
    console.log('[useTrollBet] mintTokens called', { toAddress, amount, address });
    
    if (!address) {
      throw new Error('No wallet connected');
    }
    
    const amountWei = parseUnits(amount, 18);

    console.log('[useTrollBet] calling writeContract for mint...', {
      token: DEGEN_TOKEN_ADDRESS,
      toAddress,
      amountWei: amountWei.toString(),
    });

    // Call with explicit chainId for Farcaster wallet
    writeContract({
      address: DEGEN_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'mint',
      args: [toAddress, amountWei],
      chainId: baseSepolia.id,
    });
    
    console.log('[useTrollBet] mint writeContract called');
  };

  if (error) {
    console.error('[useTrollBet] mint hook error:', error);
  }

  return {
    mintTokens,
    hash,
    isPending,
    error,
  };
}
