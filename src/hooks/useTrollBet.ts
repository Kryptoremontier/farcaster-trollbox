import { useReadContract, useWaitForTransactionReceipt, useSendTransaction } from 'wagmi';
import { type Address, parseUnits, formatUnits, encodeFunctionData } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import TrollBetABI from '~/lib/abi/TrollBet.json';

// Chain ID for all transactions (Base Sepolia for testnet)
const CHAIN_ID = baseSepolia.id;

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
 * Hook to place a bet on a market - using useSendTransaction for better Farcaster compatibility
 */
export function usePlaceBet() {
  const { data: hash, sendTransaction, isPending, error } = useSendTransaction();

  const placeBet = async (marketId: number, side: boolean, amount: string) => {
    console.log('[useTrollBet] placeBet called', { marketId, side, amount });
    const amountWei = parseUnits(amount, 18);

    // Encode the function call data
    const data = encodeFunctionData({
      abi: TrollBetABI,
      functionName: 'placeBet',
      args: [BigInt(marketId), side, amountWei],
    });

    console.log('[useTrollBet] calling sendTransaction for placeBet...', {
      to: TROLLBET_CONTRACT_ADDRESS,
      marketId,
      side,
      amountWei: amountWei.toString(),
    });

    try {
      const result = sendTransaction({
        to: TROLLBET_CONTRACT_ADDRESS,
        data,
        chainId: CHAIN_ID,
      });
      console.log('[useTrollBet] placeBet sendTransaction result:', result);
      return result;
    } catch (err) {
      console.error('[useTrollBet] placeBet sendTransaction error:', err);
      throw err;
    }
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
 * Hook to claim winnings from a resolved market - using useSendTransaction
 */
export function useClaimWinnings() {
  const { data: hash, sendTransaction, isPending, error } = useSendTransaction();

  const claimWinnings = async (marketId: number) => {
    const data = encodeFunctionData({
      abi: TrollBetABI,
      functionName: 'claimWinnings',
      args: [BigInt(marketId)],
    });

    return sendTransaction({
      to: TROLLBET_CONTRACT_ADDRESS,
      data,
      chainId: CHAIN_ID,
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
 * Hook to approve $DEGEN token spending (unlimited approval) - using useSendTransaction
 */
export function useApproveToken() {
  const { data: hash, sendTransaction, isPending, error } = useSendTransaction();

  // Max uint256 for unlimited approval
  const MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

  const approve = async (_amount?: string) => {
    console.log('[useTrollBet] approve called');

    // Encode the approve call
    const data = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [TROLLBET_CONTRACT_ADDRESS, MAX_UINT256],
    });

    console.log('[useTrollBet] calling sendTransaction for approve...', {
      to: DEGEN_TOKEN_ADDRESS,
      spender: TROLLBET_CONTRACT_ADDRESS,
    });

    try {
      const result = sendTransaction({
        to: DEGEN_TOKEN_ADDRESS,
        data,
        chainId: CHAIN_ID,
      });
      console.log('[useTrollBet] sendTransaction result:', result);
      return result;
    } catch (err) {
      console.error('[useTrollBet] sendTransaction error:', err);
      throw err;
    }
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
 * Hook to mint test tokens (only works on testnet with MockDEGEN) - using useSendTransaction
 */
export function useMintTestTokens() {
  const { data: hash, sendTransaction, isPending, error } = useSendTransaction();

  const mintTokens = async (toAddress: Address, amount: string = "10000") => {
    console.log('[useTrollBet] mintTokens called', { toAddress, amount });
    const amountWei = parseUnits(amount, 18);

    const data = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'mint',
      args: [toAddress, amountWei],
    });

    console.log('[useTrollBet] calling sendTransaction for mint...', {
      to: DEGEN_TOKEN_ADDRESS,
      toAddress,
      amountWei: amountWei.toString(),
    });

    try {
      const result = sendTransaction({
        to: DEGEN_TOKEN_ADDRESS,
        data,
        chainId: CHAIN_ID,
      });
      console.log('[useTrollBet] mint sendTransaction result:', result);
      return result;
    } catch (err) {
      console.error('[useTrollBet] mint sendTransaction error:', err);
      throw err;
    }
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
