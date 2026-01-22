"use client";

import { useUserBet } from "~/hooks/useTrollBet";
import type { Address } from "viem";
import type { Market } from "~/lib/mockMarkets";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

interface UserBetCardProps {
  market: Market;
  userAddress: Address;
  onSelect: (marketId: string) => void;
}

export function UserBetCard({ market, userAddress, onSelect }: UserBetCardProps) {
  const { userBet, isLoading } = useUserBet(
    market.contractMarketId ?? 0,
    userAddress
  );

  // Don't render if no bet or loading
  if (isLoading || !userBet) return null;

  const yesAmount = parseFloat(userBet.yesAmount);
  const noAmount = parseFloat(userBet.noAmount);
  const totalBet = yesAmount + noAmount;

  // Don't render if user hasn't bet on this market
  if (totalBet === 0) return null;

  const hasBetYes = yesAmount > 0;
  const hasBetNo = noAmount > 0;

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
        <Badge
          variant="outline"
          className="text-xs px-2 py-0.5 border-[#9E75FF]/30 bg-[#9E75FF]/10 text-[#9E75FF]"
        >
          {market.category}
        </Badge>
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
              {yesAmount.toLocaleString()} $DEGEN
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
              {noAmount.toLocaleString()} $DEGEN
            </span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">Total Bet</span>
          <span className="text-sm font-bold text-[#9E75FF]">
            {totalBet.toLocaleString()} $DEGEN
          </span>
        </div>
      </div>

      {/* Claimed Status */}
      {userBet.claimed && (
        <div className="mt-2">
          <Badge className="w-full justify-center bg-green-100 text-green-700 border-green-300">
            ✅ Winnings Claimed
          </Badge>
        </div>
      )}
    </Card>
  );
}
