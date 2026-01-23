"use client";

import { useState, useEffect } from "react";
import { Clock, Users, TrendingUp } from "lucide-react";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import {
  type Market,
  getTimeRemaining,
  getYesPercentage,
  formatPoolAmount,
  getCategoryColor,
} from "~/lib/mockMarkets";
import { useMarketDataETH } from "~/hooks/useTrollBetETH";

interface MarketCardProps {
  market: Market;
  onSelect: (marketId: string) => void;
}

export function MarketCard({ market, onSelect }: MarketCardProps) {
  const { marketData } = useMarketDataETH(market.contractMarketId ?? 0);
  
  // Use real endTime from contract, fallback to mock data
  const endTime = marketData?.endTimeDate ?? market.endTime;
  
  // Time remaining state (updates every minute)
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(endTime));

  useEffect(() => {
    // Update time remaining every minute
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(endTime));
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [endTime]);

  const yesPercentage = getYesPercentage(market);
  const totalPool = market.yesPool + market.noPool;

  return (
    <Card 
      className="bg-white border border-gray-200 hover:border-[#9E75FF]/50 hover:shadow-md transition-all duration-200 overflow-hidden group cursor-pointer"
      onClick={() => onSelect(market.id)}
    >
      {/* Compact Header with Emoji & Badge */}
      <div className="flex items-start justify-between p-3 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="text-3xl group-hover:scale-110 transition-transform duration-200">
            {market.thumbnail}
          </div>
          <Badge
            className={cn(
              "text-xs font-semibold px-2 py-0.5",
              getCategoryColor(market.category)
            )}
          >
            {market.category.toUpperCase()}
          </Badge>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#9E75FF]">{yesPercentage.toFixed(0)}%</div>
          <div className="text-xs text-gray-500">chance</div>
        </div>
      </div>

      {/* Question - Compact but readable */}
      <div className="p-3 pb-2">
        <h3 className="font-semibold text-sm text-gray-900 leading-tight line-clamp-2 group-hover:text-[#9E75FF] transition-colors">
          {market.question}
        </h3>
      </div>

      {/* YES/NO Buttons - Polymarket style */}
      <div className="px-3 pb-3">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(market.id);
            }}
            className="py-2 rounded-lg bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 font-semibold text-sm transition-colors"
          >
            Yes
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(market.id);
            }}
            className="py-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-semibold text-sm transition-colors"
          >
            No
          </button>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="px-3 pb-3 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-purple-500" />
            <span className="font-semibold text-purple-600">{formatPoolAmount(totalPool)}</span>
          </div>
          {/* Note: totalBettors removed - contract doesn't track this */}
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-gray-600" />
          <span className="font-medium text-gray-700">{timeRemaining}</span>
        </div>
      </div>
    </Card>
  );
}
