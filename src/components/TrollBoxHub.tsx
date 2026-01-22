"use client";

import { useState, useEffect, useCallback } from "react";
import { sdk } from "@farcaster/frame-sdk";
import { Wallet, Zap, Search } from "lucide-react";
import { Button } from "~/components/ui/button-component";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { config } from "~/components/providers/WagmiProvider";
import { MarketCard } from "~/components/MarketCard";
import { MOCK_MARKETS, type Market } from "~/lib/mockMarkets";

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
  const [selectedCategory, setSelectedCategory] = useState<Market["category"] | "all">("all");

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

  // Filter markets
  const filteredMarkets = MOCK_MARKETS.filter((market) => {
    const matchesSearch =
      searchQuery === "" ||
      market.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      market.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || market.category === selectedCategory;

    return matchesSearch && matchesCategory && market.status === "active";
  });

  const categories: Array<Market["category"] | "all"> = [
    "all",
    "crypto",
    "tech",
    "memes",
    "politics",
    "sports",
  ];

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

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#9E75FF] to-[#7E55DF] text-white py-8 px-4">
        <div className="max-w-7xl mx-auto text-center space-y-3">
          <h2 className="text-3xl font-bold">Welcome to TrollBox 🎲</h2>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Bet on anything. From crypto price predictions to Elon&apos;s next tweet.
            <br />
            <span className="text-sm">Powered by Farcaster • Built on Base</span>
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border-b border-gray-200 py-4 px-4 sticky top-[73px] z-10 shadow-sm">
        <div className="max-w-7xl mx-auto space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  selectedCategory === category
                    ? "bg-[#9E75FF] text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {category === "all" ? "All Markets" : category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Market Grid */}
      <div className="flex-1 py-6 px-4">
        <div className="max-w-7xl mx-auto">
          {filteredMarkets.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="text-6xl">🤷</div>
              <p className="text-gray-500 font-medium">No markets found</p>
              <p className="text-sm text-gray-400">Try adjusting your filters</p>
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
