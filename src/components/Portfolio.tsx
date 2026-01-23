"use client";

import { useAccount } from "wagmi";
import { useETHBalance, useUserBetETH } from "~/hooks/useTrollBetETH";
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
  onStatsUpdate: (stats: { activeBets: number, totalWagered: number }) => void 
}) {
  const bets = markets.map(market => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { userBet, isLoading } = useUserBetETH(market.contractMarketId ?? 0, userAddress);
    return { userBet, isLoading, marketId: market.contractMarketId };
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

    bets.forEach(({ userBet, marketId }) => {
      if (userBet) {
        const yesAmount = parseFloat(userBet.yesAmount);
        const noAmount = parseFloat(userBet.noAmount);
        const totalBet = yesAmount + noAmount;

        if (totalBet > 0) {
          console.log('[BetStatsCollector] Found active bet', {
            marketId,
            yesAmount,
            noAmount,
            totalBet,
          });
          activeBets++;
          totalWagered += totalBet;
        }
      }
    });

    console.log('[BetStatsCollector] Final stats', { activeBets, totalWagered });
    onStatsUpdate({ activeBets, totalWagered });
  }, [betDataString, onStatsUpdate, bets]);

  return null;
}

export function Portfolio({ onMarketSelect }: PortfolioProps) {
  const { address, isConnected, isConnecting } = useAccount();
  const { balance: ethBalance } = useETHBalance(address as Address | undefined);
  const [stats, setStats] = useState({ activeBets: 0, totalWagered: 0 });

  const handleStatsUpdate = useCallback((newStats: { activeBets: number, totalWagered: number }) => {
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

  const wonBets = 0;
  const lostBets = 0;
  const totalBets = stats.activeBets + wonBets + lostBets;
  const winRate = totalBets > 0 ? ((wonBets / totalBets) * 100).toFixed(1) : '0.0';

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
            {wonBets}W / {lostBets}L
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
            <div className="text-lg font-bold text-gray-900">+0 ETH</div>
            <div className="text-xs text-gray-400">0.0% ROI</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Best Win</div>
            <div className="text-lg font-bold text-green-600">+0</div>
            <div className="text-xs text-gray-400">No wins yet</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Worst Loss</div>
            <div className="text-lg font-bold text-red-600">-0</div>
            <div className="text-xs text-gray-400">No losses yet</div>
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
            />
          ))}
        </div>
      </div>
    </div>
  );
}
