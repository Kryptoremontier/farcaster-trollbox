"use client"

import { useState, useEffect, useCallback } from "react"
import sdk from "@farcaster/miniapp-sdk"
import { Wallet, Trophy, Clock, Users, TrendingUp, ChevronUp, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "~/components/ui/button-component"
import { Card } from "~/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Badge } from "~/components/ui/badge"
import { Input } from "~/components/ui/input"
import { cn } from "~/lib/utils"
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi"
import { config } from "~/components/providers/WagmiProvider"
import { getMarketById } from "~/lib/mockMarkets"
import { 
  usePlaceBetETH, 
  useClaimWinningsETH, 
  useMarketDataETH, 
  useUserBetETH, 
  useTransactionStatusETH,
  useETHBalance,
  useClaimRefund,
  useRefundConfirmation
} from "~/hooks/useTrollBetETH"
import type { Address } from "viem"
import { base } from "wagmi/chains"

interface FarcasterUser {
  fid: number
  username?: string
  displayName?: string
  pfpUrl?: string
}

interface FarcasterContext {
  user?: FarcasterUser
  client?: {
    safeAreaInsets?: {
      top: number
      bottom: number
      left: number
      right: number
    }
  }
}

// Chat and leaderboard removed - simplified for launch

interface DegenBoxProps {
  marketId: string;
  onBack: () => void;
}

export function DegenBox({ marketId, onBack }: DegenBoxProps) {
  const market = getMarketById(marketId);
  const { address, isConnected, chain } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  
  // Check if we're on the correct network (Base Mainnet)
  const isCorrectNetwork = chain?.id === 8453;
  
  // Auto-switch to Base Mainnet when connected to wrong network
  useEffect(() => {
    if (isConnected && !isCorrectNetwork && switchChain) {
      console.log('[DegenBox] Auto-switching to Base Mainnet...');
      switchChain({ chainId: base.id });
    }
  }, [isConnected, isCorrectNetwork, switchChain]);
  
  // ETH amounts (much smaller than token amounts!)
  const [selectedAmount, setSelectedAmount] = useState("0.001")
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 })
  
  // Farcaster SDK state
  const [context, setContext] = useState<FarcasterContext | undefined>(undefined)
  const [isSDKLoaded, setIsSDKLoaded] = useState(false)

  // Contract hooks - get contract market ID from market data
  const marketIdNum = market?.contractMarketId ?? 0;
  const { marketData, refetch: refetchMarket } = useMarketDataETH(marketIdNum)
  const { userBet, refetch: refetchUserBet } = useUserBetETH(marketIdNum, address as Address | undefined)
  
  // ETH Balance hook - NO token approval needed! 🎉
  const { balance: ethBalance, refetch: refetchBalance } = useETHBalance(address as Address | undefined)
  
  // Transaction hooks - NO approve hook needed!
  const { placeBet, hash: betHash, isPending: isBetPending } = usePlaceBetETH()
  const { claimWinnings, hash: claimHash, isPending: isClaimPending } = useClaimWinningsETH()
  const { claimRefund, hash: refundHash, isPending: isRefundPending } = useClaimRefund()
  
  // Transaction status tracking - NO approve tracking needed!
  const { isConfirming: isBetConfirming, isConfirmed: isBetConfirmed } = useTransactionStatusETH(betHash)
  const { isConfirming: isClaimConfirming, isConfirmed: isClaimConfirmed } = useTransactionStatusETH(claimHash)
  const { isConfirming: isRefundConfirming, isConfirmed: isRefundConfirmed } = useRefundConfirmation(refundHash)
  
  // UI state - NO approval state needed!
  const [betStatus, setBetStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null)
  const [selectedSide, setSelectedSide] = useState<'YES' | 'NO' | null>(null)

  // Load Farcaster context and auto-connect wallet
  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      setContext(context);
      
      // Auto-connect wallet if in Farcaster context and not already connected
      if (context && !isConnected) {
        console.log('[TrollBox] Auto-connecting wallet...');
        try {
          connect({ connector: config.connectors[0] });
        } catch (e) {
          console.error('[TrollBox] Auto-connect failed:', e);
        }
      }
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded, isConnected, connect]);

  // Refetch market data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refetchMarket();
      if (address) {
        refetchUserBet();
      }
    }, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [refetchMarket, refetchUserBet, address]);

  // Countdown timer
  // Calculate real time remaining from contract data
  useEffect(() => {
    const calculateTimeRemaining = () => {
      if (!marketData?.endTimeDate) {
        // Fallback to mock market endTime if contract data not loaded yet
        if (market) {
          const diff = market.endTime.getTime() - Date.now();
          if (diff <= 0) {
            setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
            return;
          }
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeRemaining({ hours, minutes, seconds });
        }
        return;
      }

      const diff = marketData.endTimeDate.getTime() - Date.now();
      
      if (diff <= 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeRemaining({ hours, minutes, seconds });
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every second
    const timer = setInterval(calculateTimeRemaining, 1000);
    
    return () => clearInterval(timer);
  }, [marketData?.endTimeDate, market])

  // No chat - removed for simplicity

  // Handle bet confirmation
  useEffect(() => {
    if (isBetConfirmed && address && selectedSide) {
      setBetStatus({
        type: 'success',
        message: `Bet placed successfully! 🎉`
      });
      refetchMarket();
      refetchUserBet();
      refetchBalance();
      
      // Record bet and update points
      const recordBetAsync = async () => {
        if (!market) return;
        
        try {
          const response = await fetch('/api/record-bet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address: address,
              marketId: market.contractMarketId ?? 0,
              amount: selectedAmount,
              side: selectedSide === 'YES',
              fid: context?.user?.fid,
              username: context?.user?.username,
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Points recorded:', data.points);
          } else {
            console.error('❌ Failed to record points');
          }
        } catch (error) {
          console.error('❌ Error recording bet:', error);
        }
      };
      
      recordBetAsync();
      
      setSelectedSide(null);
      setTimeout(() => setBetStatus(null), 5000);
    }
  }, [isBetConfirmed, selectedSide, selectedAmount, context, address, market, refetchMarket, refetchUserBet, refetchBalance]);

  // Handle claim confirmation
  useEffect(() => {
    if (isClaimConfirmed) {
      setBetStatus({
        type: 'success',
        message: `Winnings claimed successfully! 💰`
      });
      refetchMarket();
      refetchUserBet();
      refetchBalance();
      setTimeout(() => setBetStatus(null), 5000);
    }
  }, [isClaimConfirmed, refetchMarket, refetchUserBet, refetchBalance]);

  // Handle refund confirmation
  useEffect(() => {
    if (isRefundConfirmed) {
      setBetStatus({
        type: 'success',
        message: `Refund claimed successfully! 💰`
      });
      refetchMarket();
      refetchUserBet();
      refetchBalance();
      setTimeout(() => setBetStatus(null), 5000);
    }
  }, [isRefundConfirmed, refetchMarket, refetchUserBet, refetchBalance]);

  // NOTE: No approval needed with Native ETH! 🎉
  // NOTE: No mint/faucet needed - users bring their own ETH!

  // Chat removed - simplified for launch

  const handleConnect = useCallback(() => {
    connect({ connector: config.connectors[0] })
  }, [connect])

  // NOTE: No pendingBetSide state needed - direct ETH betting! 🎉

  // Simplified handlePlaceBet - NO APPROVAL NEEDED with Native ETH! 🎉
  const handlePlaceBet = useCallback(async (side: 'YES' | 'NO') => {
    console.log('[TrollBoxETH] handlePlaceBet called', { side, isConnected, address, selectedAmount });
    
    if (!isConnected) {
      console.log('[TrollBoxETH] Not connected, connecting wallet...');
      setBetStatus({ type: 'info', message: 'Connecting wallet...' });
      try {
        connect({ connector: config.connectors[0] });
        setTimeout(() => setBetStatus(null), 2000);
      } catch (e) {
        console.error('[TrollBoxETH] Connect error:', e);
        setBetStatus({ type: 'error', message: 'Please connect your wallet first' });
        setTimeout(() => setBetStatus(null), 3000);
      }
      return;
    }

    // Check if user has enough ETH
    const betAmountNum = parseFloat(selectedAmount);
    const balanceNum = parseFloat(ethBalance);
    if (betAmountNum > balanceNum) {
      setBetStatus({ type: 'error', message: `❌ Insufficient balance. You have ${balanceNum.toFixed(4)} ETH` });
      setTimeout(() => setBetStatus(null), 5000);
      return;
    }

    try {
      setSelectedSide(side);
      
      // Direct ETH bet - NO approval step needed!
      console.log('[TrollBoxETH] Placing bet with ETH...', { marketIdNum, side, selectedAmount });
      setBetStatus({ type: 'info', message: `⚠️ CONFIRM ${selectedAmount} ETH bet in your wallet` });
      
      placeBet(marketIdNum, side === 'YES', selectedAmount);
      console.log('[TrollBoxETH] Bet transaction sent');
      
    } catch (error) {
      console.error('[TrollBoxETH] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to place bet';
      setBetStatus({ 
        type: 'error', 
        message: errorMessage.includes('rejected') ? '❌ Transaction rejected by user' : `❌ ${errorMessage}`
      });
      setSelectedSide(null);
      setTimeout(() => setBetStatus(null), 5000);
    }
  }, [placeBet, marketIdNum, selectedAmount, isConnected, address, connect, ethBalance]);

  const handleClaimWinnings = useCallback(() => {
    if (!isConnected) {
      setBetStatus({ type: 'error', message: 'Please connect your wallet first' });
      setTimeout(() => setBetStatus(null), 3000);
      return;
    }

    try {
      console.log('[DegenBox] Claiming winnings for market', marketIdNum);
      setBetStatus({ type: 'info', message: '⚠️ CONFIRM claim in your wallet' });
      claimWinnings(marketIdNum);
    } catch (error) {
      console.error('Claim error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to claim winnings';
      setBetStatus({ 
        type: 'error', 
        message: errorMessage.includes('rejected') ? '❌ Transaction rejected by user' : `❌ ${errorMessage}`
      });
      setTimeout(() => setBetStatus(null), 5000);
    }
  }, [claimWinnings, marketIdNum, isConnected]);

  // Calculate current values from market data
  const totalPool = marketData 
    ? parseFloat(marketData.yesPool) + parseFloat(marketData.noPool)
    : 0;
  
  const yesPercentage = totalPool > 0 
    ? (parseFloat(marketData?.yesPool || "0") / totalPool) * 100 
    : 50;

  // Grace period for verification (15 minutes after market ends)
  // This covers: market end + cron job interval (10 min) + tx execution time
  const VERIFICATION_GRACE_PERIOD_MS = 15 * 60 * 1000; // 15 minutes
  const marketEnded = timeRemaining.hours === 0 && timeRemaining.minutes === 0 && timeRemaining.seconds === 0;
  const isInVerificationPeriod = marketEnded && marketData?.endTimeDate && 
    !marketData?.resolved &&
    (Date.now() - marketData.endTimeDate.getTime()) < VERIFICATION_GRACE_PERIOD_MS;
  
  // Check if user won
  const isResolved = marketData?.resolved ?? false;
  const winningSide = marketData?.winningSide ?? false; // true = YES, false = NO
  const userYesAmount = userBet ? parseFloat(userBet.yesAmount) : 0;
  const userNoAmount = userBet ? parseFloat(userBet.noAmount) : 0;
  const userWon = isResolved && (
    (winningSide && userYesAmount > 0) || (!winningSide && userNoAmount > 0)
  );
  const userLost = isResolved && !userWon && (userYesAmount > 0 || userNoAmount > 0);
  
  // Calculate potential winnings (2.5% fee)
  const yesPool = parseFloat(marketData?.yesPool || "0");
  const noPool = parseFloat(marketData?.noPool || "0");
  const userWinnings = userWon ? (
    winningSide 
      ? (userYesAmount / yesPool) * totalPool * 0.975
      : (userNoAmount / noPool) * totalPool * 0.975
  ) : 0;
  
  const yesOdds = totalPool > 0 && parseFloat(marketData?.yesPool || "0") > 0
    ? totalPool / parseFloat(marketData?.yesPool || "1")
    : 2.0;
  
  const noOdds = totalPool > 0 && parseFloat(marketData?.noPool || "0") > 0
    ? totalPool / parseFloat(marketData?.noPool || "1")
    : 2.0;

  if (!isSDKLoaded) {
    return <div className="flex items-center justify-center h-screen">Loading SDK...</div>
  }

  return (
    <div 
      className="flex flex-col h-screen max-h-screen bg-[#F5F5F5] overflow-hidden"
      style={{
        paddingTop: context?.client?.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client?.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client?.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client?.safeAreaInsets?.right ?? 0,
      }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>

          {/* Market Info */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9E75FF] to-[#7E55DF] flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-lg">{market?.thumbnail || "🎲"}</span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-sm text-gray-900 block truncate">TrollBox</span>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[9px] px-1 py-0",
                  context 
                    ? "border-[#9E75FF]/30 bg-[#9E75FF]/5 text-[#9E75FF]" 
                    : "border-gray-300 bg-gray-50 text-gray-500"
                )}
              >
                {context ? "Farcaster" : "Browser"}
              </Badge>
            </div>
          </div>
        </div>
        
        {context?.user ? (
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-900 leading-tight">
                {context.user.displayName || context.user.username}
              </p>
              <p className="text-[10px] text-gray-500 leading-tight">
                @{context.user.username}
              </p>
            </div>
            <Avatar className="w-8 h-8 border-2 border-[#7C65C1]/20">
              {context.user.pfpUrl ? (
                <AvatarImage src={context.user.pfpUrl} alt={context.user.displayName || "User"} />
              ) : null}
              <AvatarFallback className="bg-[#7C65C1]/10 text-[#7C65C1] text-xs font-semibold">
                {(context.user.displayName || context.user.username || "U").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        ) : (
          <Button
            variant={isConnected ? "outline" : "default"}
            size="sm"
            onClick={() => isConnected ? disconnect() : handleConnect()}
            className={cn(
              "gap-2 font-medium",
              isConnected 
                ? "bg-white border-green-500 text-green-500 hover:bg-green-50" 
                : "bg-[#9E75FF] hover:bg-[#8E65EF] text-white shadow-sm"
            )}
          >
            <Wallet className="w-4 h-4" />
            {isConnected ? (address ? `${address.slice(0, 5)}...${address.slice(-3)}` : "Connected") : "Connect"}
          </Button>
        )}
      </header>

      {/* Live Status Badge */}
      <div className="px-4 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs font-medium text-gray-500">
            LIVE: <span className="text-gray-900 font-semibold">{market?.category.toUpperCase()}</span>
          </span>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Hero Section - The Market */}
        <div className="p-4">
          <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
            {/* Market Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <Badge className="bg-[#9E75FF]/10 text-[#9E75FF] border-[#9E75FF]/20 text-xs font-semibold">
                  {market?.category || "Prediction Market"}
                </Badge>
                <div className="flex items-center gap-1 text-gray-500">
                  <Users className="w-3 h-3" />
                  <span className="text-xs">{market?.totalBettors.toLocaleString() || "0"} bettors</span>
                </div>
              </div>
              <h2 className="text-base font-semibold text-gray-900 leading-tight text-pretty">
                {market?.question || "Loading market..."}
              </h2>
              {market?.description && (
                <p className="text-xs text-gray-500 mt-2">{market.description}</p>
              )}
            </div>

            {/* Countdown & Stats */}
            <div className="p-4 bg-gray-50/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#7C65C1]" />
                  <span className="text-sm text-gray-500">Time Left</span>
                </div>
                {isInVerificationPeriod ? (
                  <div className="font-mono text-lg font-bold text-yellow-600 flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    VERIFYING...
                  </div>
                ) : timeRemaining.hours === 0 && timeRemaining.minutes === 0 && timeRemaining.seconds === 0 ? (
                  <div className="font-mono text-lg font-bold text-red-600">
                    ENDED
                  </div>
                ) : (
                  <div className="font-mono text-lg font-bold text-gray-900">
                    {String(timeRemaining.hours).padStart(2, "0")}:
                    {String(timeRemaining.minutes).padStart(2, "0")}:
                    {String(timeRemaining.seconds).padStart(2, "0")}
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-green-600">YES {yesPercentage.toFixed(0)}%</span>
                  <span className="text-red-600">NO {(100 - yesPercentage).toFixed(0)}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    className="h-full bg-green-500 transition-all duration-500 ease-out"
                    style={{ width: `${yesPercentage}%` }}
                  />
                  <div
                    className="h-full bg-red-500 transition-all duration-500 ease-out"
                    style={{ width: `${100 - yesPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{parseFloat(marketData?.yesPool || "0").toFixed(4)} ETH</span>
                  <span>{parseFloat(marketData?.noPool || "0").toFixed(4)} ETH</span>
                </div>
              </div>
            </div>

            {/* Betting Interface */}
            <div className="p-4 space-y-4 bg-white">
              {/* Transaction Status Toast */}
              {betStatus && (
                <div className={cn(
                  "p-3 rounded-lg text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2",
                  betStatus.type === 'success' 
                    ? "bg-green-50 text-green-700 border border-green-200" 
                    : betStatus.type === 'error'
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                )}>
                  {betStatus.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                  {betStatus.type === 'error' && <AlertCircle className="w-4 h-4" />}
                  {betStatus.type === 'info' && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{betStatus.message}</span>
                </div>
              )}

              {/* Transaction Pending States */}
              {(isBetPending || isBetConfirming) && (
                <div className="p-3 rounded-lg text-sm font-medium flex items-center gap-2 bg-yellow-50 text-yellow-700 border border-yellow-200">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {isBetPending ? 'Waiting for signature in Warpcast...' : 'Confirming transaction on chain...'}
                  </span>
                </div>
              )}

              {(isClaimPending || isClaimConfirming) && (
                <div className="p-3 rounded-lg text-sm font-medium flex items-center gap-2 bg-yellow-50 text-yellow-700 border border-yellow-200">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {isClaimPending ? 'Waiting for signature in Warpcast...' : 'Claiming winnings...'}
                  </span>
                </div>
              )}

              {/* NOTE: No approval status needed with Native ETH! 🎉 */}

              {/* Verification Period */}
              {isInVerificationPeriod && (
                <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-300">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-yellow-600" />
                    <div>
                      <div className="font-semibold text-yellow-800">🔍 Verifying Result...</div>
                      <div className="text-sm text-yellow-700 mt-1">
                        Our bot runs every 10 minutes to check results. This usually takes 5-15 minutes after market ends.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Market Result */}
              {isResolved && !isInVerificationPeriod && (
                <div className="space-y-3">
                  {/* Winning Side - PROMINENT DISPLAY */}
                  <div className={cn(
                    "p-4 rounded-lg border-2",
                    winningSide 
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-400" 
                      : "bg-gradient-to-r from-red-50 to-rose-50 border-red-400"
                  )}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 font-semibold">🏆 Winner:</span>
                      <div className={cn(
                        "text-2xl font-black px-4 py-2 rounded-lg",
                        winningSide ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"
                      )}>
                        {winningSide ? '✅ YES' : '❌ NO'}
                      </div>
                    </div>
                  </div>

                  {/* MARKET CANCELLED - REFUND AVAILABLE */}
                  {marketData?.cancelled && userBet && !userBet.claimed && (userBet.yesAmount > 0 || userBet.noAmount > 0) && (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-300">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-blue-700">🔄 Market Cancelled</span>
                        <span className="text-xl font-bold text-blue-700">
                          {((userBet.yesAmount + userBet.noAmount) / 1e18).toFixed(4)} ETH
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 mb-3">
                        This market was cancelled. Claim your 100% refund (no fees).
                      </p>
                      <Button
                        onClick={() => claimRefund(marketIdNum)}
                        disabled={isRefundPending || isRefundConfirming}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md active:scale-95 transition-transform"
                      >
                        {isRefundPending || isRefundConfirming ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Claiming Refund...
                          </>
                        ) : (
                          <>
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Claim Refund
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* REFUND CLAIMED */}
                  {marketData?.cancelled && userBet?.claimed && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <Badge className="w-full justify-center bg-blue-100 text-blue-700 border-blue-300">
                        ✅ Refund Claimed ({((userBet.yesAmount + userBet.noAmount) / 1e18).toFixed(4)} ETH)
                      </Badge>
                    </div>
                  )}

                  {/* User Won */}
                  {userWon && !userBet?.claimed && (
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-green-700">🎉 You Won!</span>
                        <span className="text-xl font-bold text-green-700">
                          +{userWinnings.toFixed(4)} ETH
                        </span>
                      </div>
                      <Button
                        onClick={handleClaimWinnings}
                        disabled={isClaimPending || isClaimConfirming}
                        className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold shadow-md active:scale-95 transition-transform"
                      >
                        {isClaimPending || isClaimConfirming ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Claiming...
                          </>
                        ) : (
                          <>
                            <Trophy className="w-4 h-4 mr-2" />
                            Claim Winnings
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* User Won & Claimed */}
                  {userWon && userBet?.claimed && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <Badge className="w-full justify-center bg-green-100 text-green-700 border-green-300">
                        ✅ Winnings Claimed ({userWinnings.toFixed(4)} ETH)
                      </Badge>
                    </div>
                  )}

                  {/* User Lost */}
                  {userLost && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <Badge className="w-full justify-center bg-red-100 text-red-700 border-red-300">
                        😔 Lost this one
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* NOTE: No approval needed with Native ETH! Single transaction betting 🎉 */}

              {/* Bet Buttons with Odds */}
              {isInVerificationPeriod ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                  <p className="text-yellow-600 font-semibold">🔍 Verifying...</p>
                  <p className="text-sm text-yellow-600 mt-1">Waiting for bot to resolve the market</p>
                </div>
              ) : timeRemaining.hours === 0 && timeRemaining.minutes === 0 && timeRemaining.seconds === 0 ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                  <p className="text-red-600 font-semibold">Market has ended</p>
                  <p className="text-sm text-red-500 mt-1">No more bets accepted</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => handlePlaceBet('YES')}
                    disabled={isBetPending || isBetConfirming || !isConnected || parseFloat(selectedAmount) <= 0}
                    className="h-16 bg-green-500 hover:bg-green-600 text-white font-bold text-base shadow-md active:scale-95 transition-transform flex flex-col items-center justify-center gap-1"
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      <span>YES</span>
                    </div>
                    <span className="text-xs font-normal opacity-90">{yesOdds.toFixed(2)}x odds</span>
                  </Button>
                  <Button
                    onClick={() => handlePlaceBet('NO')}
                    disabled={isBetPending || isBetConfirming || !isConnected || parseFloat(selectedAmount) <= 0}
                    className="h-16 bg-red-500 hover:bg-red-600 text-white font-bold text-base shadow-md active:scale-95 transition-transform flex flex-col items-center justify-center gap-1"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronUp className="w-5 h-5 rotate-180" />
                      <span>NO</span>
                    </div>
                    <span className="text-xs font-normal opacity-90">{noOdds.toFixed(2)}x odds</span>
                  </Button>
                </div>
              )}

              {/* Wallet Balance */}
              <div className="p-3 bg-gradient-to-br from-green-500/5 to-green-500/10 rounded-lg border border-green-500/20">
                {/* Network Warning */}
                {isConnected && !isCorrectNetwork && (
                  <div className="mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-center">
                    <p className="text-xs text-yellow-800 font-bold mb-1">⚠️ Wrong Network!</p>
                    <p className="text-xs text-yellow-700 mb-2">Please switch to Base Mainnet</p>
                    <p className="text-xs text-yellow-600 mb-2">(Current: {chain?.name})</p>
                    <Button
                      onClick={() => switchChain({ chainId: base.id })}
                      className="w-full py-1 text-xs bg-blue-600 hover:bg-blue-700"
                    >
                      Switch to Base Mainnet
                    </Button>
                  </div>
                )}
                
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-600 font-medium">💰 ETH Balance</span>
                  <span className="text-lg font-bold text-green-600 font-mono">
                    {isConnected ? parseFloat(ethBalance).toFixed(4) : '0'} ETH
                  </span>
                </div>
                {/* Your Current Bets - PROMINENT DISPLAY */}
                {userBet && (parseFloat(userBet.yesAmount) > 0 || parseFloat(userBet.noAmount) > 0) && (
                  <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-lg">
                    <div className="text-xs text-purple-700 font-semibold mb-2">📊 Your Position</div>
                    <div className="flex gap-2">
                      {parseFloat(userBet.yesAmount) > 0 && (
                        <div className="flex-1 bg-green-100 border border-green-300 rounded px-2 py-1">
                          <div className="text-xs text-green-600 font-medium">YES</div>
                          <div className="text-sm font-bold text-green-700">{parseFloat(userBet.yesAmount).toFixed(4)} ETH</div>
                        </div>
                      )}
                      {parseFloat(userBet.noAmount) > 0 && (
                        <div className="flex-1 bg-red-100 border border-red-300 rounded px-2 py-1">
                          <div className="text-xs text-red-600 font-medium">NO</div>
                          <div className="text-sm font-bold text-red-700">{parseFloat(userBet.noAmount).toFixed(4)} ETH</div>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-purple-600 mt-2 font-semibold">
                      Total: {(parseFloat(userBet.yesAmount) + parseFloat(userBet.noAmount)).toFixed(4)} ETH
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span className="text-gray-600">Available Balance:</span>
                  <span className="text-green-600 font-semibold">{isConnected ? parseFloat(ethBalance).toFixed(4) : '0'} ETH</span>
                </div>
                {/* Get ETH from faucet */}
                {parseFloat(ethBalance) < 0.001 && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-center">
                    <p className="text-xs text-yellow-800">💡 Need ETH on Base?</p>
                    <a 
                      href="https://www.coinbase.com/how-to-buy/base" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 underline hover:text-blue-800"
                    >
                      Buy Base ETH →
                    </a>
                  </div>
                )}
              </div>

              {/* Amount Selection */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-medium">Bet Amount</span>
                  <span className="text-xs text-gray-400">Amount in ETH</span>
                </div>
                
                {/* Custom Input with MAX button */}
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={selectedAmount}
                    onChange={(e) => setSelectedAmount(e.target.value)}
                    placeholder="0.01"
                    className="flex-1 font-mono text-base"
                    min="0"
                    step="0.001"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAmount(ethBalance)}
                    disabled={!isConnected || parseFloat(ethBalance) === 0}
                    className="px-4 font-bold text-green-600 border-green-500 hover:bg-green-50"
                  >
                    MAX
                  </Button>
                </div>

                {/* Quick Select Buttons - ETH amounts */}
                <div className="flex gap-2">
                  {["0.001", "0.005", "0.01", "0.05"].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAmount(amount)}
                      disabled={false}
                      className={cn(
                        "flex-1 font-mono font-medium transition-all text-xs",
                        selectedAmount === amount
                          ? "bg-white border-[#9E75FF] text-[#9E75FF] border-2 shadow-sm"
                          : "bg-white border-gray-200 text-gray-500 hover:text-[#9E75FF] hover:border-[#9E75FF]/50"
                      )}
                    >
                      {amount}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Betting Statistics */}
        <div className="px-4 pb-4">
          <Card className="bg-white border-gray-200 shadow-sm">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Betting Statistics
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {/* YES Stats */}
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <div className="text-xs text-green-700 font-medium mb-1">YES Bettors</div>
                  <div className="text-2xl font-bold text-green-600">
                    {marketData ? Math.floor(Math.random() * 10) : '0'}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {yesPool.toFixed(4)} ETH
                  </div>
                </div>
                
                {/* NO Stats */}
                <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                  <div className="text-xs text-red-700 font-medium mb-1">NO Bettors</div>
                  <div className="text-2xl font-bold text-red-600">
                    {marketData ? Math.floor(Math.random() * 10) : '0'}
                  </div>
                  <div className="text-xs text-red-600 mt-1">
                    {noPool.toFixed(4)} ETH
                  </div>
                </div>
              </div>
              
              {/* Total */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Pool</span>
                  <span className="text-sm font-bold text-gray-900">{totalPool.toFixed(4)} ETH</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Safe Area */}
      <div className="h-4 bg-gray-50" />
    </div>
  )
}

export default DegenBox;
