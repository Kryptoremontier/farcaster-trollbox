"use client";

import { Trophy, TrendingUp, Medal, Crown } from "lucide-react";
import { Card } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";

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
}

// Mock data - in production, fetch from contract/API
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    address: "0x1234...5678",
    username: "DegenKing",
    avatar: "/avatars/1.png",
    totalWagered: 50000,
    totalWon: 35000,
    totalLost: 10000,
    pnl: 25000,
    roi: 50.0,
    winRate: 77.8,
    activeBets: 5,
  },
  {
    rank: 2,
    address: "0xabcd...ef01",
    username: "CryptoMaxi",
    avatar: "/avatars/2.png",
    totalWagered: 42000,
    totalWon: 28000,
    totalLost: 12000,
    pnl: 16000,
    roi: 38.1,
    winRate: 70.0,
    activeBets: 3,
  },
  {
    rank: 3,
    address: "0x9876...4321",
    username: "MoonBoi",
    avatar: "/avatars/3.png",
    totalWagered: 38000,
    totalWon: 24000,
    totalLost: 11000,
    pnl: 13000,
    roi: 34.2,
    winRate: 68.6,
    activeBets: 7,
  },
  {
    rank: 4,
    address: "0xd04d...96a1",
    username: "You",
    totalWagered: 1256,
    totalWon: 0,
    totalLost: 0,
    pnl: 0,
    roi: 0,
    winRate: 0,
    activeBets: 1,
  },
  {
    rank: 5,
    address: "0x5555...6666",
    username: "DiamondHands",
    totalWagered: 25000,
    totalWon: 15000,
    totalLost: 8000,
    pnl: 7000,
    roi: 28.0,
    winRate: 65.2,
    activeBets: 2,
  },
];

export function Leaderboard() {
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
            {MOCK_LEADERBOARD.length}
          </div>
          <div className="text-xs text-yellow-600 mt-1">Total Players</div>
        </Card>

        <Card className="p-3 text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="text-2xl font-bold text-green-700">
            {MOCK_LEADERBOARD.reduce((sum, e) => sum + e.totalWagered, 0).toLocaleString()}
          </div>
          <div className="text-xs text-green-600 mt-1">Total Volume</div>
        </Card>

        <Card className="p-3 text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="text-2xl font-bold text-blue-700">
            {MOCK_LEADERBOARD.reduce((sum, e) => sum + e.activeBets, 0)}
          </div>
          <div className="text-xs text-blue-600 mt-1">Active Bets</div>
        </Card>

        <Card className="p-3 text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="text-2xl font-bold text-purple-700">
            {(MOCK_LEADERBOARD.reduce((sum, e) => sum + e.winRate, 0) / MOCK_LEADERBOARD.length).toFixed(1)}%
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
              {MOCK_LEADERBOARD.map((entry) => (
                <tr
                  key={entry.address}
                  className={`hover:bg-gray-50 transition-colors ${
                    entry.username === "You" ? "bg-[#9E75FF]/5" : ""
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
                    <div className="text-xs text-gray-500">$DEGEN</div>
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
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
