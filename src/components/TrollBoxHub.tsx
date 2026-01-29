"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import sdk from "@farcaster/miniapp-sdk";
import { Wallet, Search, ChevronLeft, ChevronRight, TrendingUp as TrendingUpIcon, Briefcase, UserCog, ChevronDown, ChevronUp, Trophy } from "lucide-react";
import { Button } from "~/components/ui/button-component";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { config } from "~/components/providers/WagmiProvider";
import { base } from "wagmi/chains";
import { MarketCard } from "~/components/MarketCard";
import { UserBetCard } from "~/components/UserBetCard";
import { Portfolio } from "~/components/Portfolio";
import { Leaderboard } from "~/components/Leaderboard";
import { AdminPointsPanel } from "~/components/AdminPointsPanel";
import { MOCK_MARKETS } from "~/lib/mockMarkets";
import { useClaimWinningsETH, useTransactionStatusETH, useClaimRefund, useRefundConfirmation } from "~/hooks/useTrollBetETH";
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
  const { address, isConnected, chain } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { claimWinnings: claimWinningsHook, hash: claimHash, isPending: isClaimPending } = useClaimWinningsETH();
  const { isConfirming: isClaimConfirming } = useTransactionStatusETH(claimHash);
  const { claimRefund: claimRefundHook, hash: refundHash, isPending: isRefundPending } = useClaimRefund();
  const { isConfirming: isRefundConfirming } = useRefundConfirmation(refundHash);

  const [context, setContext] = useState<FarcasterContext | undefined>(undefined);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<"main" | "your-bets" | "trending" | "portfolio" | "leaderboard" | "admin">("main");
  const [showEndedMarkets, setShowEndedMarkets] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Check if user is admin
  const isAdmin = context?.user?.username === "kryptoremontier";

  // Wrapper for claimWinnings
  const claimWinnings = useCallback((marketId: number) => {
    console.log('[TrollBoxHub] claimWinnings called with marketId:', marketId);
    if (!isConnected || !address) {
      console.error('[TrollBoxHub] Cannot claim: not connected');
      return;
    }
    try {
      claimWinningsHook(marketId);
      console.log('[TrollBoxHub] claimWinningsHook called successfully');
    } catch (error) {
      console.error('[TrollBoxHub] Error calling claimWinningsHook:', error);
    }
  }, [claimWinningsHook, isConnected, address]);

  // Wrapper for claimRefund
  const claimRefund = useCallback((marketId: number) => {
    console.log('[TrollBoxHub] claimRefund called with marketId:', marketId);
    if (!isConnected || !address) {
      console.error('[TrollBoxHub] Cannot claim refund: not connected');
      return;
    }
    try {
      claimRefundHook(marketId);
      console.log('[TrollBoxHub] claimRefundHook called successfully');
    } catch (error) {
      console.error('[TrollBoxHub] Error calling claimRefundHook:', error);
    }
  }, [claimRefundHook, isConnected, address]);

  // Load Farcaster context and auto-connect wallet
  useEffect(() => {
    const load = async () => {
      console.log('[TrollBoxHub] Loading Farcaster context...');
      const context = await sdk.context;
      setContext(context);
      console.log('[TrollBoxHub] Context loaded:', { 
        hasContext: !!context, 
        user: context?.user?.username,
        isConnected 
      });
      
      // Auto-connect wallet if in Farcaster context and not already connected
      if (context && !isConnected) {
        console.log('[TrollBoxHub] Auto-connecting wallet...', {
          connector: config.connectors[0]?.name
        });
        try {
          await connect({ connector: config.connectors[0] });
          console.log('[TrollBoxHub] Auto-connect successful!');
        } catch (e) {
          console.error('[TrollBoxHub] Auto-connect failed:', e);
        }
      } else {
        console.log('[TrollBoxHub] Skipping auto-connect:', {
          hasContext: !!context,
          isConnected
        });
      }
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded, isConnected, connect]);

  // Auto-switch to Base Mainnet when connected
  useEffect(() => {
    if (isConnected && chain && chain.id !== base.id && switchChain) {
      console.log('[TrollBoxHub] Auto-switching to Base Mainnet...', {
        currentChain: chain.id,
        targetChain: base.id
      });
      try {
        switchChain({ chainId: base.id });
      } catch (error) {
        console.error('[TrollBoxHub] Auto-switch failed:', error);
      }
    }
  }, [isConnected, chain, switchChain]);

  const handleConnect = useCallback(() => {
    connect({ connector: config.connectors[0] });
  }, [connect]);

  // Helper to check if market is ended
  // Now uses FIXED timestamps from mockMarkets.ts that match contract deployment
  // This ensures ended markets stay ended after page refresh
  const isMarketEnded = useCallback((market: typeof MOCK_MARKETS[0]) => {
    return market.endTime < new Date();
  }, []);

  // Separate active and ended markets
  const { activeMarkets, endedMarkets } = useMemo(() => {
    const active: typeof MOCK_MARKETS = [];
    const ended: typeof MOCK_MARKETS = [];
    
    MOCK_MARKETS.forEach(market => {
      if (isMarketEnded(market)) {
        ended.push(market);
      } else {
        active.push(market);
      }
    });
    
    return { activeMarkets: active, endedMarkets: ended };
  }, [isMarketEnded]);

  // Filter active markets for main/search - sorted by soonest to end
  const filteredActiveMarkets = activeMarkets
    .filter((market) => {
      const matchesSearch =
        searchQuery === "" ||
        market.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch && market.status === "active";
    })
    .sort((a, b) => a.endTime.getTime() - b.endTime.getTime());

  // Filter ended markets for main/search - sorted by most recently ended
  const filteredEndedMarkets = endedMarkets
    .filter((market) => {
      const matchesSearch =
        searchQuery === "" ||
        market.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    })
    .sort((a, b) => b.endTime.getTime() - a.endTime.getTime());

  // Top 10 markets by total pool for trending tab
  const trendingMarkets = [...MOCK_MARKETS]
    .filter((market) => market.status === "active")
    .sort((a, b) => {
      const totalA = a.yesPool + a.noPool;
      const totalB = b.yesPool + b.noPool;
      return totalB - totalA; // Descending order
    })
    .slice(0, 10);

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
            {/* Logo - Clickable */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedTab("main")}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <img 
                  src="/troll-logo.png" 
                  alt="TrollBox Logo" 
                  className="w-12 h-12 rounded-xl shadow-lg"
                />
                <div className="text-left">
                  <h1 className="font-bold text-xl text-gray-900">TrollBox</h1>
                  <p className="text-xs text-gray-500">Prediction Markets</p>
                </div>
              </button>
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
            <div className="flex items-center gap-2">
              {/* Admin Icon - Only visible for admin */}
              {isAdmin && (
                <button
                  onClick={() => setSelectedTab("admin")}
                  className={cn(
                    "p-2 rounded-full transition-all",
                    selectedTab === "admin"
                      ? "bg-[#9E75FF] text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                  title="Admin Panel"
                >
                  <UserCog className="w-5 h-5" />
                </button>
              )}

              {context?.user ? (
                <>
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
                </>
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
        </div>
      </header>

      {/* Compact Hero Section */}
      <div className="bg-gradient-to-r from-[#9E75FF] to-[#7E55DF] text-white py-4 px-4">
        <div className="max-w-7xl mx-auto text-center flex items-center justify-center gap-3">
          <img 
            src="/troll-logo.png" 
            alt="TrollBox" 
            className="w-10 h-10 rounded-lg shadow-lg"
          />
          <div>
            <h2 className="text-xl font-bold">Bet on anything 🎲</h2>
            <p className="text-sm text-white/80">
              Powered by Farcaster • Built on Base
            </p>
          </div>
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
                onClick={() => setSelectedTab("main")}
                className={cn(
                  "px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-2",
                  selectedTab === "main"
                    ? "bg-[#9E75FF] text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                🏠 Main
              </button>

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

          {/* Search - show for main and your-bets */}
          {(selectedTab === "main" || selectedTab === "your-bets") && (
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
          {/* Main Tab - Active + Ended Markets */}
          {selectedTab === "main" && (
            <>
              {filteredActiveMarkets.length === 0 && filteredEndedMarkets.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="text-6xl">🤷</div>
                  <p className="text-gray-500 font-medium">No markets found</p>
                  <p className="text-sm text-gray-400">Try adjusting your search</p>
                </div>
              ) : (
                <>
                  {/* Active Markets */}
                  {filteredActiveMarkets.length > 0 && (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold text-gray-900">
                            {filteredActiveMarkets.length}
                          </span>{" "}
                          active {filteredActiveMarkets.length === 1 ? "market" : "markets"}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                        {filteredActiveMarkets.map((market) => (
                          <MarketCard
                            key={market.id}
                            market={market}
                            onSelect={onMarketSelect}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {/* Ended Markets - Collapsed */}
                  {filteredEndedMarkets.length > 0 && (
                    <div className="mt-8">
                      <button
                        onClick={() => setShowEndedMarkets(!showEndedMarkets)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-700">
                            Ended Markets ({filteredEndedMarkets.length})
                          </span>
                        </div>
                        {showEndedMarkets ? (
                          <ChevronUp className="w-5 h-5 text-gray-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-600" />
                        )}
                      </button>

                      {showEndedMarkets && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                          {filteredEndedMarkets.map((market) => (
                            <MarketCard
                              key={market.id}
                              market={market}
                              onSelect={onMarketSelect}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}

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
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Your Active Bets</h2>
                      <p className="text-xs text-gray-500 mt-1">All markets where you have placed bets</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {MOCK_MARKETS
                      .filter(m => m.contractMarketId !== undefined)
                      .sort((a, b) => a.endTime.getTime() - b.endTime.getTime())
                      .map((market) => (
                        <UserBetCard
                          key={market.id}
                          market={market}
                          userAddress={address as Address}
                          onSelect={onMarketSelect}
                          onClaim={claimWinnings}
                          onClaimRefund={claimRefund}
                          isClaimPending={isClaimPending}
                          isClaimConfirming={isClaimConfirming}
                          isRefundPending={isRefundPending}
                          isRefundConfirming={isRefundConfirming}
                        />
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* Trending Tab - TOP 10 by Total Pool */}
          {selectedTab === "trending" && (
            <>
              {trendingMarkets.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="text-6xl">🤷</div>
                  <p className="text-gray-500 font-medium">No trending markets</p>
                  <p className="text-sm text-gray-400">Check back later</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">🔥 Top 10 Trending Markets</h2>
                      <p className="text-xs text-gray-500 mt-1">Sorted by highest total pool</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {trendingMarkets.map((market, index) => (
                      <div key={market.id} className="relative">
                        {/* Rank Badge */}
                        <div className="absolute -top-2 -left-2 z-10 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-white">
                          {index + 1}
                        </div>
                        <MarketCard
                          market={market}
                          onSelect={onMarketSelect}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* Portfolio Tab */}
          {selectedTab === "portfolio" && (
            <Portfolio 
              onMarketSelect={onMarketSelect}
              onClaim={claimWinnings}
              onClaimRefund={claimRefund}
              isClaimPending={isClaimPending}
              isClaimConfirming={isClaimConfirming}
              isRefundPending={isRefundPending}
              isRefundConfirming={isRefundConfirming}
            />
          )}

          {/* Leaderboard Tab */}
          {selectedTab === "leaderboard" && (
            <Leaderboard />
          )}

          {/* Admin Tab - Only accessible by admin */}
          {selectedTab === "admin" && (
            <>
              {!isAdmin ? (
                <div className="text-center py-16 space-y-3">
                  <div className="text-6xl">🔒</div>
                  <p className="text-gray-500 font-medium">Access Denied</p>
                  <p className="text-sm text-gray-400">This area is restricted to administrators only</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">🔐 Admin Dashboard</h2>
                      <p className="text-sm text-gray-500 mt-1">Welcome back, @{context?.user?.username}</p>
                    </div>
                  </div>

                  {/* Admin Points Panel */}
                  <div className="bg-gradient-to-br from-[#9E75FF]/5 to-white border-2 border-[#9E75FF]/20 rounded-xl p-6">
                    <AdminPointsPanel userAddress={address as Address} />
                  </div>

                  {/* Additional Admin Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-500 mb-2">Total Volume</h3>
                      <p className="text-2xl font-bold text-[#9E75FF]">Coming Soon</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-500 mb-2">Platform Fees</h3>
                      <p className="text-2xl font-bold text-green-600">Coming Soon</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-500 mb-2">Active Users</h3>
                      <p className="text-2xl font-bold text-blue-600">Coming Soon</p>
                    </div>
                  </div>
                </div>
              )}
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
