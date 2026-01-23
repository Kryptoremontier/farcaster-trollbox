"use client";

import { useAccount } from "wagmi";
import { useDegenBalance } from "~/hooks/useTrollBet";
import { MOCK_MARKETS } from "~/lib/mockMarkets";
import { UserBetCard } from "~/components/UserBetCard";
import type { Address } from "viem";
import { Wallet, TrendingUp, Trophy, Activity } from "lucide-react";
import { Card } from "~/components/ui/card";

interface PortfolioProps {
  onMarketSelect: (marketId: string) => void;
}

export function Portfolio({ onMarketSelect }: PortfolioProps) {
  const { address, isConnected } = useAccount();
  const { balance: degenBalance } = useDegenBalance(address as Address | undefined);

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

  // Mock stats - in production, calculate from actual bets
  const totalBets = 3;
  const totalWagered = 1256; // From screenshot
  const activeBets = 1;
  const wonBets = 0;
  const lostBets = 0;
  const winRate = totalBets > 0 ? ((wonBets / totalBets) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Portfolio Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Wallet Balance */}
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-green-600" />
            <span className="text-xs text-green-700 font-medium">Balance</span>
          </div>
          <div className="text-xl font-bold text-green-700">
            {parseFloat(degenBalance).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-green-600 mt-1">$DEGEN</div>
        </Card>

        {/* Total Wagered */}
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-700 font-medium">Wagered</span>
          </div>
          <div className="text-xl font-bold text-blue-700">
            {totalWagered.toLocaleString()}
          </div>
          <div className="text-xs text-blue-600 mt-1">$DEGEN</div>
        </Card>

        {/* Active Bets */}
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-purple-700 font-medium">Active</span>
          </div>
          <div className="text-xl font-bold text-purple-700">
            {activeBets}
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
            <div className="text-lg font-bold text-gray-900">+0 $DEGEN</div>
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
