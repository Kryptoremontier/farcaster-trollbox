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
    <Card className="bg-white border-gray-200 hover:border-[#9E75FF]/50 hover:shadow-xl transition-all duration-200 overflow-hidden group cursor-pointer">
      <div onClick={() => onSelect(market.id)}>
        {/* Thumbnail Header - Larger */}
        <div className="relative h-40 bg-gradient-to-br from-[#9E75FF]/10 to-[#9E75FF]/5 flex items-center justify-center border-b border-gray-100">
          <div className="text-7xl group-hover:scale-110 transition-transform duration-200">
            {market.thumbnail}
          </div>
          <Badge
            className={cn(
              "absolute top-4 right-4 text-sm font-semibold px-3 py-1",
              getCategoryColor(market.category)
            )}
          >
            {market.category.toUpperCase()}
          </Badge>
        </div>

        {/* Content - More padding */}
        <div className="p-5 space-y-4">
          {/* Question - Larger, more visible */}
          <h3 className="font-bold text-lg text-gray-900 leading-snug line-clamp-3 min-h-[4rem] group-hover:text-[#9E75FF] transition-colors">
            {market.question}
          </h3>

          {/* Description - Slightly larger */}
          <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
            {market.description}
          </p>

          {/* Stats Row - Larger */}
          <div className="flex items-center justify-between text-sm text-gray-600 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#9E75FF]" />
              <span className="font-medium">{timeRemaining}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#9E75FF]" />
              <span className="font-medium">{market.totalBettors.toLocaleString()}</span>
            </div>
          </div>

          {/* Pool Display - Larger */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 font-medium">Total Pool</span>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#9E75FF]" />
                <span className="text-base font-bold text-[#9E75FF]">
                  {formatPoolAmount(totalPool)} $DEGEN
                </span>
              </div>
            </div>

            {/* YES/NO Progress Bar - Taller */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-green-600">YES {yesPercentage.toFixed(0)}%</span>
                <span className="text-red-600">NO {(100 - yesPercentage).toFixed(0)}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden flex shadow-inner">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${yesPercentage}%` }}
                />
                <div
                  className="h-full bg-red-500 transition-all duration-300"
                  style={{ width: `${100 - yesPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-500 font-medium">
                <span>{formatPoolAmount(market.yesPool)}</span>
                <span>{formatPoolAmount(market.noPool)}</span>
              </div>
            </div>
          </div>

          {/* Bet Button - Larger */}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(market.id);
            }}
            className="w-full h-12 bg-[#9E75FF] hover:bg-[#8E65EF] text-white font-bold text-base shadow-lg active:scale-95 transition-transform"
          >
            Bet Now
          </Button>
        </div>
      </div>
    </Card>
  );
}
