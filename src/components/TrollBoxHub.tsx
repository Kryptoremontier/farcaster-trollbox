"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { sdk } from "@farcaster/frame-sdk";
import { Wallet, Zap, Search, ChevronLeft, ChevronRight, TrendingUp as TrendingUpIcon, Briefcase, Trophy } from "lucide-react";
import { Button } from "~/components/ui/button-component";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { config } from "~/components/providers/WagmiProvider";
import { MarketCard } from "~/components/MarketCard";
import { UserBetCard } from "~/components/UserBetCard";
import { Portfolio } from "~/components/Portfolio";
import { Leaderboard } from "~/components/Leaderboard";
import { MOCK_MARKETS } from "~/lib/mockMarkets";
import type { Address } from "viem";

interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

interface FarcasterContext {
  user?: FarcasterUser;
  client?: {
    safeAreaInsets?: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
  };
}

interface TrollBoxHubProps {
  onMarketSelect: (marketId: string) => void;
}

export function TrollBoxHub({ onMarketSelect }: TrollBoxHubProps) {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const [context, setContext] = useState<FarcasterContext | undefined>(undefined);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<"your-bets" | "trending" | "portfolio" | "leaderboard">("trending");
  const tabsRef = useRef<HTMLDivElement>(null);

  // Initialize Farcaster SDK
  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      setContext(context);
      sdk.actions.ready({});
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

  const handleConnect = useCallback(() => {
    connect({ connector: config.connectors[0] });
  }, [connect]);

  // Filter markets for trending tab
  const filteredMarkets = MOCK_MARKETS.filter((market) => {
    const matchesSearch =
      searchQuery === "" ||
      market.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      market.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch && market.status === "active";
  });

  // Scroll tabs
  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      const scrollAmount = 200;
      tabsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!isSDKLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#9E75FF]/5 to-white">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">🎲</div>
          <p className="text-gray-600 font-medium">Loading TrollBox...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col min-h-screen bg-gradient-to-br from-[#F3F4F6] to-white"
      style={{
        paddingTop: context?.client?.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client?.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client?.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client?.safeAreaInsets?.right ?? 0,
      }}
    >
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9E75FF] to-[#7E55DF] flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-xl text-gray-900">TrollBox</h1>
                <p className="text-xs text-gray-500">Prediction Markets</p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs px-2 py-0.5",
                  context
                    ? "border-[#9E75FF]/30 bg-[#9E75FF]/5 text-[#9E75FF]"
                    : "border-gray-300 bg-gray-50 text-gray-500"
                )}
              >
                {context ? "Farcaster" : "Browser"}
              </Badge>
            </div>

            {/* User / Wallet */}
            {context?.user ? (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">
                    {context.user.displayName || context.user.username}
                  </p>
                  <p className="text-xs text-gray-500 leading-tight">
                    @{context.user.username}
                  </p>
                </div>
                <Avatar className="w-10 h-10 border-2 border-[#9E75FF]/20">
                  {context.user.pfpUrl ? (
                    <AvatarImage
                      src={context.user.pfpUrl}
                      alt={context.user.displayName || "User"}
                    />
                  ) : null}
                  <AvatarFallback className="bg-[#9E75FF]/10 text-[#9E75FF] text-sm font-semibold">
                    {(context.user.displayName || context.user.username || "U")
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            ) : (
              <Button
                variant={isConnected ? "outline" : "default"}
                size="sm"
                onClick={() => (isConnected ? disconnect() : handleConnect())}
                className={cn(
                  "gap-2 font-medium",
                  isConnected
                    ? "bg-white border-green-500 text-green-500 hover:bg-green-50"
                    : "bg-[#9E75FF] hover:bg-[#8E65EF] text-white shadow-md"
                )}
              >
                <Wallet className="w-4 h-4" />
                {isConnected
                  ? address
                    ? `${address.slice(0, 5)}...${address.slice(-3)}`
                    : "Connected"
                  : "Connect"}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Compact Hero Section */}
      <div className="bg-gradient-to-r from-[#9E75FF] to-[#7E55DF] text-white py-4 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-xl font-bold">Bet on anything 🎲</h2>
          <p className="text-sm text-white/80 mt-1">
            Powered by Farcaster • Built on Base
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-gray-200 py-3 px-4 sticky top-[73px] z-10 shadow-sm">
        <div className="max-w-7xl mx-auto">
          {/* Tabs with Arrow Navigation */}
          <div className="relative flex items-center gap-2">
            {/* Left Arrow */}
            <button
              onClick={() => scrollTabs('left')}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>

            {/* Tabs Container */}
            <div
              ref={tabsRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide flex-1"
            >
              <button
                onClick={() => setSelectedTab("your-bets")}
                className={cn(
                  "px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-2",
                  selectedTab === "your-bets"
                    ? "bg-[#9E75FF] text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                <Wallet className="w-4 h-4" />
                Your Bets
              </button>

              <button
                onClick={() => setSelectedTab("trending")}
                className={cn(
                  "px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-2",
                  selectedTab === "trending"
                    ? "bg-[#9E75FF] text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                <TrendingUpIcon className="w-4 h-4" />
                Trending
              </button>

              <button
                onClick={() => setSelectedTab("portfolio")}
                className={cn(
                  "px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-2",
                  selectedTab === "portfolio"
                    ? "bg-[#9E75FF] text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                <Briefcase className="w-4 h-4" />
                Portfolio
              </button>

              <button
                onClick={() => setSelectedTab("leaderboard")}
                className={cn(
                  "px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-2",
                  selectedTab === "leaderboard"
                    ? "bg-[#9E75FF] text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                <Trophy className="w-4 h-4" />
                Leaderboard
              </button>
            </div>

            {/* Right Arrow */}
            <button
              onClick={() => scrollTabs('right')}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Search - only show for trending and your-bets */}
          {(selectedTab === "trending" || selectedTab === "your-bets") && (
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search markets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full h-9"
              />
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 py-6 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Your Bets Tab */}
          {selectedTab === "your-bets" && (
            <>
              {!isConnected ? (
                <div className="text-center py-16 space-y-3">
                  <div className="text-6xl">🔒</div>
                  <p className="text-gray-500 font-medium">Connect your wallet</p>
                  <p className="text-sm text-gray-400">Connect to see your active bets</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Your Active Bets</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {MOCK_MARKETS.filter(m => m.contractMarketId !== undefined).map((market) => (
                      <UserBetCard
                        key={market.id}
                        market={market}
                        userAddress={address as Address}
                        onSelect={onMarketSelect}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* Trending Tab */}
          {selectedTab === "trending" && (
            <>
              {filteredMarkets.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="text-6xl">🤷</div>
                  <p className="text-gray-500 font-medium">No markets found</p>
                  <p className="text-sm text-gray-400">Try adjusting your search</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold text-gray-900">
                        {filteredMarkets.length}
                      </span>{" "}
                      active {filteredMarkets.length === 1 ? "market" : "markets"}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredMarkets.map((market) => (
                      <MarketCard
                        key={market.id}
                        market={market}
                        onSelect={onMarketSelect}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* Portfolio Tab */}
          {selectedTab === "portfolio" && (
            <Portfolio onMarketSelect={onMarketSelect} />
          )}

          {/* Leaderboard Tab */}
          {selectedTab === "leaderboard" && (
            <Leaderboard />
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 px-4">
        <div className="max-w-7xl mx-auto text-center text-xs text-gray-500">
          <p>
            Built with 💜 on{" "}
            <span className="font-semibold text-[#9E75FF]">Farcaster</span> •
            Powered by <span className="font-semibold">Base</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
