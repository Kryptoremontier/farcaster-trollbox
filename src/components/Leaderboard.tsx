"use client";

import { Trophy, TrendingUp, Medal, Crown } from "lucide-react";
import { Card } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";

interface LeaderboardEntry {
  rank: number;
  address: string;
  username: string;
  points: number;
  betsPlaced: number;
  volumeTraded: number;
  winsCount: number;
  lossesCount: number;
  currentStreak: number;
  pnlETH: number;
  roi: number;
  winRate: number;
  tier: string;
}

const getAvatarUrl = (name: string) =>
  `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}&backgroundColor=9E75FF`;

const TIER_BADGE: Record<string, string> = {
  legendary: '👑', diamond: '💎', gold: '🥇', silver: '🥈', bronze: '🥉',
};

export function Leaderboard() {
  const { address } = useAccount();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/leaderboard?limit=50');

        if (!response.ok) {
          setError(`API error: ${response.status}`);
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        console.log('[Leaderboard] API response:', JSON.stringify(data).slice(0, 500));

        if (data.success && Array.isArray(data.leaderboard)) {
          const entries: LeaderboardEntry[] = [];
          for (let i = 0; i < data.leaderboard.length; i++) {
            const e = data.leaderboard[i];
            entries.push({
              rank: i + 1,
              address: String(e.address || ''),
              username: String(e.username || `${String(e.address || '').slice(0, 6)}...`),
              points: Number(e.points) || 0,
              betsPlaced: Number(e.betsPlaced) || 0,
              volumeTraded: Number(e.volumeTraded) || 0,
              winsCount: Number(e.winsCount) || 0,
              lossesCount: Number(e.lossesCount) || 0,
              currentStreak: Number(e.currentStreak) || 0,
              pnlETH: Number(e.pnlETH) || 0,
              roi: Number(e.roi) || 0,
              winRate: Number(e.winRate) || 0,
              tier: String(e.tier || 'bronze'),
            });
          }
          console.log('[Leaderboard] Parsed entries:', entries.length);
          setLeaderboard(entries);
        } else {
          console.log('[Leaderboard] No data or unexpected format');
          setLeaderboard([]);
        }
      } catch (err) {
        console.error('[Leaderboard] Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
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
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Medal className="w-5 h-5 text-orange-600" />;
      default: return <span className="text-sm font-bold text-gray-400">#{rank}</span>;
    }
  };

  // Find current user
  const currentUser = address
    ? leaderboard.find((e) => e.address.toLowerCase() === address.toLowerCase())
    : null;

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

      {/* Error display */}
      {error && (
        <Card className="p-3 bg-red-50 border-red-200">
          <p className="text-sm text-red-600">Error: {error}</p>
        </Card>
      )}

      {/* Your Stats */}
      {currentUser && (
        <Card className="p-3 bg-gradient-to-r from-[#9E75FF]/10 to-[#7E55DF]/10 border-[#9E75FF]/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-[#9E75FF]">Your Stats</span>
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
        </Card>
      )}

      {/* Overview */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-2 text-center bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="text-lg font-bold text-yellow-700">
            {isLoading ? '...' : leaderboard.length}
          </div>
          <div className="text-[10px] text-yellow-600">Players</div>
        </Card>
        <Card className="p-2 text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="text-lg font-bold text-green-700">
            {isLoading ? '...' : leaderboard.reduce((s, e) => s + e.volumeTraded, 0).toFixed(3)}
          </div>
          <div className="text-[10px] text-green-600">Volume (ETH)</div>
        </Card>
        <Card className="p-2 text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="text-lg font-bold text-blue-700">
            {isLoading ? '...' : leaderboard.reduce((s, e) => s + e.betsPlaced, 0)}
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

      {/* Table */}
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
                      <p className="text-lg font-semibold text-gray-700">No players yet!</p>
                      <p className="text-sm text-gray-500">Place a bet to get on the board!</p>
                    </div>
                  </td>
                </tr>
              ) : (
                leaderboard.map((entry) => {
                  const isMe = entry.address.toLowerCase() === (address || '').toLowerCase();
                  return (
                    <tr
                      key={entry.address}
                      className={`hover:bg-gray-50 transition-colors ${isMe ? "bg-[#9E75FF]/5" : ""}`}
                    >
                      <td className="px-3 py-2.5">{getRankIcon(entry.rank)}</td>

                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6 border border-gray-200">
                            <AvatarImage src={getAvatarUrl(entry.username || entry.address)} alt={entry.username} />
                            <AvatarFallback className="bg-[#9E75FF]/10 text-[#9E75FF] text-[10px] font-semibold">
                              {entry.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-gray-900 truncate max-w-[100px] flex items-center gap-1">
                              {entry.username}
                              {isMe && <Badge className="text-[8px] px-1 py-0 bg-[#9E75FF] text-white">You</Badge>}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {TIER_BADGE[entry.tier] || '🥉'} {entry.winsCount}W/{entry.lossesCount}L
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-2.5 text-right">
                        <div className="text-xs font-bold text-[#9E75FF]">{entry.points.toLocaleString()}</div>
                      </td>

                      <td className="px-3 py-2.5 text-right">
                        <div className="text-xs font-medium text-gray-700">{entry.volumeTraded.toFixed(3)}</div>
                        <div className="text-[10px] text-gray-400">ETH</div>
                      </td>

                      <td className="px-3 py-2.5 text-right">
                        <div className={`text-xs font-bold ${entry.pnlETH > 0 ? 'text-green-600' : entry.pnlETH < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          {entry.pnlETH > 0 ? '+' : ''}{entry.pnlETH.toFixed(4)}
                        </div>
                        {entry.roi !== 0 && (
                          <div className={`text-[10px] ${entry.roi > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {entry.roi > 0 ? '+' : ''}{entry.roi.toFixed(0)}%
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          {entry.winRate > 60 && <TrendingUp className="w-3 h-3 text-green-500" />}
                          <span className={`text-xs font-medium ${entry.winRate > 60 ? 'text-green-600' : entry.winRate > 0 ? 'text-gray-700' : 'text-gray-400'}`}>
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
