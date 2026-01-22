"use client";

import { Clock, Users, TrendingUp } from "lucide-react";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button-component";
import { cn } from "~/lib/utils";
import {
  type Market,
  getTimeRemaining,
  getYesPercentage,
  formatPoolAmount,
  getCategoryColor,
} from "~/lib/mockMarkets";

interface MarketCardProps {
  market: Market;
  onSelect: (marketId: string) => void;
}

export function MarketCard({ market, onSelect }: MarketCardProps) {
  const yesPercentage = getYesPercentage(market);
  const totalPool = market.yesPool + market.noPool;
  const timeRemaining = getTimeRemaining(market.endTime);

  return (
    <Card className="bg-white border-gray-200 hover:border-[#9E75FF]/50 hover:shadow-lg transition-all duration-200 overflow-hidden group cursor-pointer">
      <div onClick={() => onSelect(market.id)}>
        {/* Thumbnail Header */}
        <div className="relative h-32 bg-gradient-to-br from-[#9E75FF]/10 to-[#9E75FF]/5 flex items-center justify-center border-b border-gray-100">
          <div className="text-6xl group-hover:scale-110 transition-transform duration-200">
            {market.thumbnail}
          </div>
          <Badge
            className={cn(
              "absolute top-3 right-3 text-xs font-semibold",
              getCategoryColor(market.category)
            )}
          >
            {market.category.toUpperCase()}
          </Badge>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Question */}
          <h3 className="font-semibold text-gray-900 leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-[#9E75FF] transition-colors">
            {market.question}
          </h3>

          {/* Description */}
          <p className="text-xs text-gray-500 line-clamp-2 min-h-[2rem]">
            {market.description}
          </p>

          {/* Stats Row */}
          <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#9E75FF]" />
              <span className="font-medium">{timeRemaining}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-[#9E75FF]" />
              <span className="font-medium">{market.totalBettors.toLocaleString()}</span>
            </div>
          </div>

          {/* Pool Display */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Total Pool</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-[#9E75FF]" />
                <span className="text-sm font-bold text-[#9E75FF]">
                  {formatPoolAmount(totalPool)} $DEGEN
                </span>
              </div>
            </div>

            {/* YES/NO Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-green-600">YES {yesPercentage.toFixed(0)}%</span>
                <span className="text-red-600">NO {(100 - yesPercentage).toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${yesPercentage}%` }}
                />
                <div
                  className="h-full bg-red-500 transition-all duration-300"
                  style={{ width: `${100 - yesPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{formatPoolAmount(market.yesPool)}</span>
                <span>{formatPoolAmount(market.noPool)}</span>
              </div>
            </div>
          </div>

          {/* Bet Button */}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(market.id);
            }}
            className="w-full bg-[#9E75FF] hover:bg-[#8E65EF] text-white font-semibold shadow-md active:scale-95 transition-transform"
          >
            Bet Now
          </Button>
        </div>
      </div>
    </Card>
  );
}
