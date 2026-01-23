"use client";

import { Trophy, TrendingUp, Medal, Crown } from "lucide-react";
import { Card } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { getTierBadge, calculateTier } from "~/lib/pointsSystem";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";

interface LeaderboardEntry {
  rank: number;
  address: string;
  username?: string;
  avatar?: string;
  totalWagered: number;
  totalWon: number;
  totalLost: number;
  pnl: number;
  roi: number;
  winRate: number;
  activeBets: number;
  // 🤫 Secret points for future airdrop
  secretPoints?: number;
}

// Helper to generate avatar URL (DiceBear API for unique avatars)
const getAvatarUrl = (name: string) => 
  `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}&backgroundColor=9E75FF`;

// Empty initial state - real data will come from API/Redis
const MOCK_LEADERBOARD: LeaderboardEntry[] = [];

export function Leaderboard() {
  const { address } = useAccount();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(MOCK_LEADERBOARD);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/leaderboard?limit=20');
        const data = await response.json();
        
        if (data.success && data.leaderboard) {
          // Convert API data to LeaderboardEntry format
          const entries: LeaderboardEntry[] = data.leaderboard.map((entry: {
            address: string;
            points: number;
            username?: string;
            fid?: number;
            betsPlaced?: number;
            volumeTraded?: number;
          }, index: number) => ({
            rank: index + 1,
            address: entry.address,
            username: entry.username || `User ${entry.address.slice(0, 6)}`,
            avatar: getAvatarUrl(entry.username || entry.address),
            totalWagered: entry.volumeTraded || 0,
            totalWon: 0, // TODO: Calculate from contract
            totalLost: 0, // TODO: Calculate from contract
            pnl: 0, // TODO: Calculate from contract
            roi: 0, // TODO: Calculate from contract
            winRate: 0, // TODO: Calculate from contract
            activeBets: entry.betsPlaced || 0,
            secretPoints: entry.points || 0,
          }));
          setLeaderboard(entries);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        // Keep existing data on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
    // Refresh every 30 seconds
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900">Leaderboard</h2>
        </div>
        <p className="text-sm text-gray-500">
          Top performers by total profit & loss
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 text-center bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="text-2xl font-bold text-yellow-700">
            {isLoading ? '...' : leaderboard.length}
          </div>
          <div className="text-xs text-yellow-600 mt-1">Total Players</div>
        </Card>

        <Card className="p-3 text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="text-2xl font-bold text-green-700">
            {isLoading ? '...' : leaderboard.reduce((sum, e) => sum + e.totalWagered, 0).toFixed(4)}
          </div>
          <div className="text-xs text-green-600 mt-1">Total Volume (ETH)</div>
        </Card>

        <Card className="p-3 text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="text-2xl font-bold text-blue-700">
            {isLoading ? '...' : leaderboard.reduce((sum, e) => sum + e.activeBets, 0)}
          </div>
          <div className="text-xs text-blue-600 mt-1">Total Bets</div>
        </Card>

        <Card className="p-3 text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="text-2xl font-bold text-purple-700">
            {isLoading ? '...' : leaderboard.length > 0 
              ? (leaderboard.reduce((sum, e) => sum + e.winRate, 0) / leaderboard.length).toFixed(1) + '%'
              : '0.0%'}
          </div>
          <div className="text-xs text-purple-600 mt-1">Avg Win Rate</div>
        </Card>
      </div>

      {/* Leaderboard Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Player</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Wagered</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">P&L</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">ROI</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Win Rate</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
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
                        <p className="text-sm text-gray-500 mt-1">Be the first to place a bet and claim your spot! 🚀</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : leaderboard.map((entry) => (
                <tr
                  key={entry.address}
                  className={`hover:bg-gray-50 transition-colors ${
                    entry.address.toLowerCase() === address?.toLowerCase() ? "bg-[#9E75FF]/5" : ""
                  }`}
                >
                  {/* Rank */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getRankIcon(entry.rank)}
                    </div>
                  </td>

                  {/* Player */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8 border border-gray-200">
                        {entry.avatar ? (
                          <AvatarImage src={entry.avatar} alt={entry.username} />
                        ) : null}
                        <AvatarFallback className="bg-[#9E75FF]/10 text-[#9E75FF] text-xs font-semibold">
                          {(entry.username || entry.address).slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm text-gray-900 flex items-center gap-2">
                          {entry.username || entry.address}
                          {entry.username === "You" && (
                            <Badge className="text-xs px-1.5 py-0 bg-[#9E75FF] text-white">You</Badge>
                          )}
                          {/* 🤫 Subtle tier badge - users don't know what it means yet */}
                          {entry.secretPoints && (
                            <span className="text-sm" title="Activity level">
                              {getTierBadge(calculateTier(entry.secretPoints))}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{entry.address}</div>
                      </div>
                    </div>
                  </td>

                  {/* Wagered */}
                  <td className="px-4 py-3 text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {entry.totalWagered.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">ETH</div>
                  </td>

                  {/* P&L */}
                  <td className="px-4 py-3 text-right">
                    <div className={`text-sm font-bold ${entry.pnl > 0 ? 'text-green-600' : entry.pnl < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {entry.pnl > 0 ? '+' : ''}{entry.pnl.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {entry.totalWon}W / {entry.totalLost}L
                    </div>
                  </td>

                  {/* ROI */}
                  <td className="px-4 py-3 text-right">
                    <div className={`text-sm font-bold ${entry.roi > 0 ? 'text-green-600' : entry.roi < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {entry.roi > 0 ? '+' : ''}{entry.roi.toFixed(1)}%
                    </div>
                  </td>

                  {/* Win Rate */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <TrendingUp className={`w-3 h-3 ${entry.winRate > 60 ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className="text-sm font-medium text-gray-900">
                        {entry.winRate.toFixed(1)}%
                      </span>
                    </div>
                  </td>

                  {/* Active Bets */}
                  <td className="px-4 py-3 text-right">
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                      {entry.activeBets}
                    </Badge>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
