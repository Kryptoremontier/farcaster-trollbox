"use client";

import { useAccount } from "wagmi";
import { useETHBalance, useUserBetETH, useClaimWinningsETH, useMarketDataETH, useTransactionStatusETH } from "~/hooks/useTrollBetETH";
import { MOCK_MARKETS } from "~/lib/mockMarkets";
import { UserBetCard } from "~/components/UserBetCard";
import type { Address } from "viem";
import { Wallet, TrendingUp, Trophy, Activity } from "lucide-react";
import { Card } from "~/components/ui/card";
import { useState, useEffect, useCallback } from "react";

interface PortfolioProps {
  onMarketSelect: (marketId: string) => void;
}

// Helper component to collect bet stats
function BetStatsCollector({ 
  markets, 
  userAddress, 
  onStatsUpdate 
}: { 
  markets: typeof MOCK_MARKETS, 
  userAddress: Address,
  onStatsUpdate: (stats: { 
    activeBets: number, 
    totalWagered: number,
    wonBets: number,
    lostBets: number,
    totalWinnings: number
  }) => void 
}) {
  const bets = markets.map(market => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { userBet, isLoading } = useUserBetETH(market.contractMarketId ?? 0, userAddress);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { marketData } = useMarketDataETH(market.contractMarketId ?? 0);
    return { userBet, isLoading, marketData, marketId: market.contractMarketId };
  });

  // Serialize bet data for dependency tracking
  const betDataString = JSON.stringify(
    bets.map(b => ({
      yes: b.userBet?.yesAmount || '0',
      no: b.userBet?.noAmount || '0',
      claimed: b.userBet?.claimed || false,
      loading: b.isLoading,
    }))
  );

  useEffect(() => {
    // Wait for all bets to load
    const allLoaded = bets.every(b => !b.isLoading);
    
    console.log('[BetStatsCollector] Update triggered', {
      allLoaded,
      betsCount: bets.length,
      loadingCount: bets.filter(b => b.isLoading).length,
    });

    if (!allLoaded) {
      console.log('[BetStatsCollector] Waiting for bets to load...');
      return;
    }

    let activeBets = 0;
    let totalWagered = 0;
    let wonBets = 0;
    let lostBets = 0;
    let totalWinnings = 0;

    bets.forEach(({ userBet, marketData, marketId }) => {
      if (userBet) {
        const yesAmount = parseFloat(userBet.yesAmount);
        const noAmount = parseFloat(userBet.noAmount);
        const totalBet = yesAmount + noAmount;

        if (totalBet > 0) {
          totalWagered += totalBet;

          // Check if market is resolved
          if (marketData?.resolved) {
            const winningSide = marketData.winningSide;
            const userWon = (winningSide && yesAmount > 0) || (!winningSide && noAmount > 0);
            
            if (userWon) {
              wonBets++;
              // Calculate winnings (1% fee)
              const yesPool = parseFloat(marketData.yesPool);
              const noPool = parseFloat(marketData.noPool);
              const totalPool = yesPool + noPool;
              const winnings = winningSide 
                ? (yesAmount / yesPool) * totalPool * 0.99
                : (noAmount / noPool) * totalPool * 0.99;
              totalWinnings += winnings;
            } else {
              lostBets++;
            }
          } else {
            // Market still active
            activeBets++;
          }

          console.log('[BetStatsCollector] Found bet', {
            marketId,
            totalBet,
            resolved: marketData?.resolved,
            won: marketData?.resolved && ((marketData.winningSide && yesAmount > 0) || (!marketData.winningSide && noAmount > 0))
          });
        }
      }
    });

    console.log('[BetStatsCollector] Final stats', { 
      activeBets, 
      totalWagered, 
      wonBets, 
      lostBets,
      totalWinnings 
    });
    onStatsUpdate({ activeBets, totalWagered, wonBets, lostBets, totalWinnings });
  }, [betDataString, onStatsUpdate, bets]);

  return null;
}

export function Portfolio({ onMarketSelect }: PortfolioProps) {
  const { address, isConnected, isConnecting } = useAccount();
  const { balance: ethBalance } = useETHBalance(address as Address | undefined);
  const { claimWinnings, hash: claimHash, isPending: isClaimPending } = useClaimWinningsETH();
  const { isConfirming: isClaimConfirming } = useTransactionStatusETH(claimHash);
  const [stats, setStats] = useState({ 
    activeBets: 0, 
    totalWagered: 0,
    wonBets: 0,
    lostBets: 0,
    totalWinnings: 0
  });

  const handleStatsUpdate = useCallback((newStats: { 
    activeBets: number, 
    totalWagered: number,
    wonBets: number,
    lostBets: number,
    totalWinnings: number
  }) => {
    setStats(newStats);
  }, []);

  // Show loading state while connecting
  if (isConnecting) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="text-6xl animate-pulse">⏳</div>
        <p className="text-gray-500 font-medium">Connecting wallet...</p>
        <p className="text-sm text-gray-400">Please wait</p>
      </div>
    );
  }

  if (!isConnected || !address) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="text-6xl">🔒</div>
        <p className="text-gray-500 font-medium">Connect your wallet</p>
        <p className="text-sm text-gray-400">Connect to see your portfolio</p>
      </div>
    );
  }

  const marketsWithBets = MOCK_MARKETS.filter(m => m.contractMarketId !== undefined);

  const totalBets = stats.activeBets + stats.wonBets + stats.lostBets;
  const winRate = (stats.wonBets + stats.lostBets) > 0 
    ? ((stats.wonBets / (stats.wonBets + stats.lostBets)) * 100).toFixed(1) 
    : '0.0';
  const roi = stats.totalWagered > 0
    ? (((stats.totalWinnings - stats.totalWagered) / stats.totalWagered) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Hidden stats collector */}
      <BetStatsCollector 
        markets={marketsWithBets} 
        userAddress={address as Address}
        onStatsUpdate={handleStatsUpdate}
      />

      {/* Portfolio Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Wallet Balance */}
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-green-600" />
            <span className="text-xs text-green-700 font-medium">Balance</span>
          </div>
          <div className="text-xl font-bold text-green-700">
            {parseFloat(ethBalance).toFixed(4)}
          </div>
          <div className="text-xs text-green-600 mt-1">ETH</div>
        </Card>

        {/* Total Wagered */}
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-700 font-medium">Wagered</span>
          </div>
          <div className="text-xl font-bold text-blue-700">
            {stats.totalWagered.toFixed(4)}
          </div>
          <div className="text-xs text-blue-600 mt-1">ETH</div>
        </Card>

        {/* Active Bets */}
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-purple-700 font-medium">Active</span>
          </div>
          <div className="text-xl font-bold text-purple-700">
            {stats.activeBets}
          </div>
          <div className="text-xs text-purple-600 mt-1">markets</div>
        </Card>

        {/* Win Rate */}
        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-yellow-600" />
            <span className="text-xs text-yellow-700 font-medium">Win Rate</span>
          </div>
          <div className="text-xl font-bold text-yellow-700">
            {winRate}%
          </div>
          <div className="text-xs text-yellow-600 mt-1">
            {stats.wonBets}W / {stats.lostBets}L
          </div>
        </Card>
      </div>

      {/* P&L Summary */}
      <Card className="p-4 bg-gradient-to-r from-gray-50 to-white border-gray-200">
        <h3 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#9E75FF]" />
          Profit & Loss
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Total P&L</div>
            <div className={`text-lg font-bold ${parseFloat(roi) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {parseFloat(roi) >= 0 ? '+' : ''}{(stats.totalWinnings - stats.totalWagered).toFixed(4)} ETH
            </div>
            <div className="text-xs text-gray-400">{roi}% ROI</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Total Winnings</div>
            <div className="text-lg font-bold text-green-600">
              {stats.totalWinnings.toFixed(4)} ETH
            </div>
            <div className="text-xs text-gray-400">{stats.wonBets} wins</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Total Wagered</div>
            <div className="text-lg font-bold text-gray-900">
              {stats.totalWagered.toFixed(4)} ETH
            </div>
            <div className="text-xs text-gray-400">{totalBets} bets</div>
          </div>
        </div>
      </Card>

      {/* Active Positions */}
      <div>
        <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#9E75FF]" />
          Active Positions
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {marketsWithBets.map((market) => (
            <UserBetCard
              key={market.id}
              market={market}
              userAddress={address as Address}
              onSelect={onMarketSelect}
              onClaim={claimWinnings}
              isClaimPending={isClaimPending}
              isClaimConfirming={isClaimConfirming}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
