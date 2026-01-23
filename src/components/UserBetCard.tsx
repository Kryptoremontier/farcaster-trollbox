"use client";

import { useState, useEffect } from "react";
import { useUserBetETH, useMarketDataETH } from "~/hooks/useTrollBetETH";
import type { Address } from "viem";
import type { Market } from "~/lib/mockMarkets";
import { getTimeRemaining } from "~/lib/mockMarkets";
import { TrendingUp, TrendingDown, Trophy, Clock, Loader2 } from "lucide-react";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button-component";

interface UserBetCardProps {
  market: Market;
  userAddress: Address;
  onSelect: (marketId: string) => void;
  onClaim?: (marketId: number) => void;
  isClaimPending?: boolean;
  isClaimConfirming?: boolean;
}

export function UserBetCard({ 
  market, 
  userAddress, 
  onSelect, 
  onClaim,
  isClaimPending = false,
  isClaimConfirming = false
}: UserBetCardProps) {
  const { userBet, isLoading } = useUserBetETH(
    market.contractMarketId ?? 0,
    userAddress
  );
  const { marketData } = useMarketDataETH(market.contractMarketId ?? 0);

  // Use real endTime from contract, fallback to mock data
  const endTime = marketData?.endTimeDate ?? market.endTime;

  // Time remaining state (updates every minute) - MUST be before any returns!
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(endTime));

  useEffect(() => {
    // Update time remaining every minute
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(endTime));
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [endTime]);

  // Don't render if no bet data (but allow loading state to pass through)
  if (!isLoading && !userBet) return null;

  const yesAmount = userBet ? parseFloat(userBet.yesAmount) : 0;
  const noAmount = userBet ? parseFloat(userBet.noAmount) : 0;
  const totalBet = yesAmount + noAmount;

  // Don't render if user hasn't bet on this market (unless still loading)
  if (!isLoading && totalBet === 0) return null;

  // Show skeleton while loading
  if (isLoading) {
    return (
      <Card className="p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </Card>
    );
  }

  // TypeScript guard: userBet must exist at this point
  if (!userBet) return null;

  const hasBetYes = yesAmount > 0;
  const hasBetNo = noAmount > 0;

  // Grace period for verification (15 minutes after market ends)
  // This covers: market end + cron job interval (10 min) + tx execution time
  const VERIFICATION_GRACE_PERIOD_MS = 15 * 60 * 1000; // 15 minutes
  const marketEnded = timeRemaining === 'Ended';
  const isInVerificationPeriod = marketEnded && marketData?.endTimeDate && 
    !marketData?.resolved &&
    (Date.now() - marketData.endTimeDate.getTime()) < VERIFICATION_GRACE_PERIOD_MS;
  
  // Market status from contract
  const isResolved = marketData?.resolved ?? false;
  const winningSide = marketData?.winningSide ?? false; // true = YES, false = NO
  const isClaimed = userBet.claimed;

  // Calculate potential winnings
  const yesPool = marketData ? parseFloat(marketData.yesPool) : market.yesPool;
  const noPool = marketData ? parseFloat(marketData.noPool) : market.noPool;
  const totalPool = yesPool + noPool;
  
  // Potential payout calculation (1% fee, not 3%)
  const yesPotentialWin = hasBetYes && totalPool > 0 
    ? (yesAmount / yesPool) * totalPool * 0.99 // 1% fee
    : 0;
  const noPotentialWin = hasBetNo && totalPool > 0
    ? (noAmount / noPool) * totalPool * 0.99
    : 0;
  const maxPotentialWin = Math.max(yesPotentialWin, noPotentialWin);

  // Determine if user won
  const userWon = isResolved && (
    (winningSide && hasBetYes) || (!winningSide && hasBetNo)
  );
  const userLost = isResolved && !userWon && !isClaimed;
  const actualWinnings = userWon ? (winningSide ? yesPotentialWin : noPotentialWin) : 0;

  return (
    <Card
      className="p-4 hover:shadow-lg transition-all cursor-pointer border-2 border-[#9E75FF]/20 bg-gradient-to-br from-white to-[#9E75FF]/5"
      onClick={() => onSelect(market.id)}
    >
      {/* Market Question */}
      <div className="mb-3">
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">
          {market.question}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className="text-xs px-2 py-0.5 border-[#9E75FF]/30 bg-[#9E75FF]/10 text-[#9E75FF]"
          >
            {market.category}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Clock className="w-3 h-3" />
            <span className={timeRemaining === 'Ended' ? 'text-red-600 font-semibold' : 'font-medium'}>
              {timeRemaining}
            </span>
          </div>
        </div>
      </div>

      {/* User's Bets */}
      <div className="space-y-2">
        {hasBetYes && (
          <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">YES</span>
            </div>
            <span className="text-sm font-bold text-green-700">
              {yesAmount.toFixed(4)} ETH
            </span>
          </div>
        )}

        {hasBetNo && (
          <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-700">NO</span>
            </div>
            <span className="text-sm font-bold text-red-700">
              {noAmount.toFixed(4)} ETH
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">Total Bet</span>
          <span className="text-sm font-bold text-gray-900">
            {totalBet.toFixed(4)} ETH
          </span>
        </div>
        
        {/* Potential Winnings */}
        <div className="flex items-center justify-between p-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-yellow-600" />
            <span className="text-xs text-yellow-700 font-medium">Potential Win</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-yellow-700">
              {maxPotentialWin.toFixed(4)} ETH
            </div>
          </div>
        </div>
      </div>

      {/* Verification Period */}
      {isInVerificationPeriod && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-300">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />
              <span className="text-sm font-semibold text-yellow-700">🔍 Verifying...</span>
            </div>
            <p className="text-xs text-yellow-600 mt-1">
              Bot runs every 10 minutes. Please wait 5-15 minutes.
            </p>
          </div>
        </div>
      )}

      {/* Market Result & Claim Status */}
      {isResolved && !isInVerificationPeriod && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
          {/* Winning Side */}
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-600 font-medium">Result:</span>
            <Badge className={winningSide ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}>
              {winningSide ? '✅ YES Won' : '❌ NO Won'}
            </Badge>
          </div>

          {/* User's Result */}
          {userWon && !isClaimed && (
            <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-green-700">🎉 You Won!</span>
                <span className="text-lg font-bold text-green-700">
                  +{actualWinnings.toFixed(4)} ETH
                </span>
              </div>
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('[UserBetCard] Claim button clicked', { 
                    hasOnClaim: !!onClaim, 
                    marketId: market.contractMarketId,
                    isClaimPending,
                    isClaimConfirming
                  });
                  if (onClaim && market.contractMarketId !== undefined) {
                    console.log('[UserBetCard] Calling onClaim with marketId:', market.contractMarketId);
                    onClaim(market.contractMarketId);
                  } else {
                    console.error('[UserBetCard] Cannot claim:', { 
                      hasOnClaim: !!onClaim, 
                      marketId: market.contractMarketId 
                    });
                  }
                }}
                disabled={isClaimPending || isClaimConfirming}
                className="w-full h-10 bg-green-600 hover:bg-green-700 text-white font-bold shadow-md active:scale-95 transition-transform"
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

          {userWon && isClaimed && (
            <div className="p-2 bg-green-50 rounded-lg border border-green-200">
              <Badge className="w-full justify-center bg-green-100 text-green-700 border-green-300">
                ✅ Winnings Claimed ({actualWinnings.toFixed(4)} ETH)
              </Badge>
            </div>
          )}

          {userLost && (
            <div className="p-2 bg-red-50 rounded-lg border border-red-200">
              <Badge className="w-full justify-center bg-red-100 text-red-700 border-red-300">
                😔 Lost this one
              </Badge>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
