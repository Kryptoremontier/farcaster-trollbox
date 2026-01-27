"use client";

import { Trophy, TrendingUp, Medal, Crown, Flame } from "lucide-react";
import { Card } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";

interface LeaderboardEntry {
  rank: number;
  address: string;
  username?: string;
  avatar?: string;
  points: number;
  betsPlaced: number;
  volumeTraded: number;
  winsCount: number;
  lossesCount: number;
  currentStreak: number;
  maxStreak: number;
  pnlETH: number;
  roi: number;
  winRate: number;
  tier: string;
  tierMultiplier: number;
}

const getAvatarUrl = (name: string) =>
  `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}&backgroundColor=9E75FF`;

const TIER_BADGES: Record<string, string> = {
  legendary: '👑',
  diamond: '💎',
  gold: '🥇',
  silver: '🥈',
  bronze: '🥉',
};

const TIER_COLORS: Record<string, string> = {
  legendary: 'bg-purple-100 text-purple-700 border-purple-300',
  diamond: 'bg-cyan-100 text-cyan-700 border-cyan-300',
  gold: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  silver: 'bg-gray-100 text-gray-600 border-gray-300',
  bronze: 'bg-orange-100 text-orange-700 border-orange-300',
};

function safeTierBadge(tier: string | undefined): string {
  return TIER_BADGES[tier || 'bronze'] || '🥉';
}

function safeTierColor(tier: string | undefined): string {
  return TIER_COLORS[tier || 'bronze'] || 'bg-orange-100 text-orange-700 border-orange-300';
}

export function Leaderboard() {
  const { address } = useAccount();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/leaderboard?limit=50');
        const data = await response.json();

        if (data.success && data.leaderboard) {
          const entries: LeaderboardEntry[] = data.leaderboard.map(
            (entry: {
              address: string;
              points: number;
              username?: string;
              fid?: number;
              betsPlaced?: number;
              volumeTraded?: number;
              winsCount?: number;
              lossesCount?: number;
              currentStreak?: number;
              maxStreak?: number;
              pnlETH?: number;
              roi?: number;
              winRate?: number;
              tier?: string;
              tierMultiplier?: number;
            }, index: number) => ({
              rank: index + 1,
              address: entry.address,
              username: entry.username || `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`,
              avatar: getAvatarUrl(entry.username || entry.address),
              points: entry.points || 0,
              betsPlaced: entry.betsPlaced || 0,
              volumeTraded: entry.volumeTraded || 0,
              winsCount: entry.winsCount || 0,
              lossesCount: entry.lossesCount || 0,
              currentStreak: entry.currentStreak || 0,
              maxStreak: entry.maxStreak || 0,
              pnlETH: entry.pnlETH || 0,
              roi: entry.roi || 0,
              winRate: entry.winRate || 0,
              tier: entry.tier || 'bronze',
              tierMultiplier: entry.tierMultiplier || 1.0,
            })
          );
          setLeaderboard(entries);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-orange-600" />;
      default:
        return <span className="text-sm font-bold text-gray-400">#{rank}</span>;
    }
  };

  // Find current user in leaderboard
  const currentUser = leaderboard.find(
    (e) => e.address.toLowerCase() === address?.toLowerCase()
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h2 className="text-xl font-bold text-gray-900">Leaderboard</h2>
        </div>
        <p className="text-xs text-gray-500">
          Earn points by trading. Points = future $TROLL airdrop allocation.
        </p>
      </div>

      {/* Your Stats (if connected) */}
      {currentUser && (
        <Card className="p-3 bg-gradient-to-r from-[#9E75FF]/10 to-[#7E55DF]/10 border-[#9E75FF]/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#9E75FF]">Your Stats</span>
              <Badge className={`text-[10px] px-1.5 py-0 border ${safeTierColor(currentUser.tier)}`}>
                {safeTierBadge(currentUser.tier)} {(currentUser.tier || 'bronze').charAt(0).toUpperCase() + (currentUser.tier || 'bronze').slice(1)}
              </Badge>
            </div>
            <span className="text-sm font-bold text-gray-900">#{currentUser.rank}</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="text-sm font-bold text-[#9E75FF]">{currentUser.points.toLocaleString()}</div>
              <div className="text-[10px] text-gray-500">Points</div>
            </div>
            <div>
              <div className={`text-sm font-bold ${currentUser.pnlETH >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {currentUser.pnlETH >= 0 ? '+' : ''}{currentUser.pnlETH.toFixed(4)}
              </div>
              <div className="text-[10px] text-gray-500">P&L (ETH)</div>
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900">{currentUser.winRate.toFixed(0)}%</div>
              <div className="text-[10px] text-gray-500">Win Rate</div>
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900">{currentUser.volumeTraded.toFixed(4)}</div>
              <div className="text-[10px] text-gray-500">Volume</div>
            </div>
          </div>
          {currentUser.currentStreak >= 2 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-orange-600">
              <Flame className="w-3 h-3" />
              {currentUser.currentStreak} win streak!
            </div>
          )}
        </Card>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-2 text-center bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="text-lg font-bold text-yellow-700">
            {isLoading ? '...' : leaderboard.length}
          </div>
          <div className="text-[10px] text-yellow-600">Players</div>
        </Card>
        <Card className="p-2 text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="text-lg font-bold text-green-700">
            {isLoading ? '...' : leaderboard.reduce((sum, e) => sum + e.volumeTraded, 0).toFixed(3)}
          </div>
          <div className="text-[10px] text-green-600">Volume (ETH)</div>
        </Card>
        <Card className="p-2 text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="text-lg font-bold text-blue-700">
            {isLoading ? '...' : leaderboard.reduce((sum, e) => sum + e.betsPlaced, 0)}
          </div>
          <div className="text-[10px] text-blue-600">Total Bets</div>
        </Card>
      </div>

      {/* Season Info */}
      <div className="text-center">
        <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-300">
          Season 1 - Points convert to $TROLL at TGE
        </Badge>
      </div>

      {/* Leaderboard Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600">#</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600">Player</th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-600">Points</th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-600">Volume</th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-600">P&L</th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-600">Win%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#9E75FF]"></div>
                      Loading leaderboard...
                    </div>
                  </td>
                </tr>
              ) : leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Trophy className="w-12 h-12 text-gray-300" />
                      <div>
                        <p className="text-lg font-semibold text-gray-700">No players yet!</p>
                        <p className="text-sm text-gray-500 mt-1">Place a bet to get on the board!</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                leaderboard.map((entry) => {
                  const isCurrentUser = entry.address.toLowerCase() === address?.toLowerCase();
                  return (
                    <tr
                      key={entry.address}
                      className={`hover:bg-gray-50 transition-colors ${
                        isCurrentUser ? "bg-[#9E75FF]/5" : ""
                      }`}
                    >
                      {/* Rank */}
                      <td className="px-3 py-2.5">
                        {getRankIcon(entry.rank)}
                      </td>

                      {/* Player */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6 border border-gray-200">
                            {entry.avatar ? (
                              <AvatarImage src={entry.avatar} alt={entry.username} />
                            ) : null}
                            <AvatarFallback className="bg-[#9E75FF]/10 text-[#9E75FF] text-[10px] font-semibold">
                              {(entry.username || entry.address).slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-gray-900 truncate max-w-[100px] flex items-center gap-1">
                              {entry.username}
                              {isCurrentUser && (
                                <Badge className="text-[8px] px-1 py-0 bg-[#9E75FF] text-white">You</Badge>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-400 flex items-center gap-1">
                              <span>{safeTierBadge(entry.tier)}</span>
                              <span>{entry.winsCount}W/{entry.lossesCount}L</span>
                              {entry.currentStreak >= 3 && (
                                <span className="text-orange-500 flex items-center">
                                  <Flame className="w-2.5 h-2.5" />
                                  {entry.currentStreak}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Points */}
                      <td className="px-3 py-2.5 text-right">
                        <div className="text-xs font-bold text-[#9E75FF]">
                          {entry.points.toLocaleString()}
                        </div>
                      </td>

                      {/* Volume */}
                      <td className="px-3 py-2.5 text-right">
                        <div className="text-xs font-medium text-gray-700">
                          {entry.volumeTraded.toFixed(3)}
                        </div>
                        <div className="text-[10px] text-gray-400">ETH</div>
                      </td>

                      {/* P&L */}
                      <td className="px-3 py-2.5 text-right">
                        <div className={`text-xs font-bold ${
                          entry.pnlETH > 0 ? 'text-green-600' : entry.pnlETH < 0 ? 'text-red-600' : 'text-gray-400'
                        }`}>
                          {entry.pnlETH > 0 ? '+' : ''}{entry.pnlETH.toFixed(4)}
                        </div>
                        {entry.roi !== 0 && (
                          <div className={`text-[10px] ${entry.roi > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {entry.roi > 0 ? '+' : ''}{entry.roi.toFixed(0)}%
                          </div>
                        )}
                      </td>

                      {/* Win Rate */}
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          {entry.winRate > 60 && <TrendingUp className="w-3 h-3 text-green-500" />}
                          <span className={`text-xs font-medium ${
                            entry.winRate > 60 ? 'text-green-600' : entry.winRate > 0 ? 'text-gray-700' : 'text-gray-400'
                          }`}>
                            {entry.winRate.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
