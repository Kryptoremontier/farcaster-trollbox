/**
 * 🔒 ADMIN ONLY - SECRET POINTS DASHBOARD
 * 
 * This component shows the secret points system.
 * Access: Only visible to contract owner
 * 
 * URL: /admin/points (protected route)
 */

"use client";

import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { 
  getTierBadge, 
  getTierColor, 
  calculateTier, 
  calculateAirdropAllocation,
  TIER_THRESHOLDS,
  POINTS_CONFIG 
} from "~/lib/pointsSystem";
import { Trophy, TrendingUp, Zap, Gift } from "lucide-react";

interface UserPointsDisplay {
  address: string;
  username?: string;
  totalPoints: number;
  breakdown: {
    betsPlaced: number;
    volumeTraded: number;
    winStreak: number;
    earlyAdopter: number;
    socialEngagement: number;
    referrals: number;
    consistency: number;
  };
  estimatedAirdrop: number;
}

// Mock data - replace with real data from backend
const MOCK_POINTS_DATA: UserPointsDisplay[] = [
  {
    address: "0x1234...5678",
    username: "DegenKing",
    totalPoints: 125000,
    breakdown: {
      betsPlaced: 50000,
      volumeTraded: 40000,
      winStreak: 15000,
      earlyAdopter: 10000,
      socialEngagement: 5000,
      referrals: 3000,
      consistency: 2000,
    },
    estimatedAirdrop: 0, // Will be calculated
  },
  {
    address: "0xabcd...ef01",
    username: "CryptoMaxi",
    totalPoints: 85000,
    breakdown: {
      betsPlaced: 35000,
      volumeTraded: 30000,
      winStreak: 10000,
      earlyAdopter: 5000,
      socialEngagement: 3000,
      referrals: 1000,
      consistency: 1000,
    },
    estimatedAirdrop: 0,
  },
  {
    address: "0x9876...4321",
    username: "MoonBoi",
    totalPoints: 45000,
    breakdown: {
      betsPlaced: 20000,
      volumeTraded: 15000,
      winStreak: 5000,
      earlyAdopter: 1000,
      socialEngagement: 2000,
      referrals: 1000,
      consistency: 1000,
    },
    estimatedAirdrop: 0,
  },
];

interface AdminPointsPanelProps {
  userAddress?: string;
}

export function AdminPointsPanel({ userAddress }: AdminPointsPanelProps) {
  // TODO: Use userAddress to fetch real user data from contract
  console.log('Admin viewing data for:', userAddress);
  
  const totalPoints = MOCK_POINTS_DATA.reduce((sum, user) => sum + user.totalPoints, 0);
  
  // Calculate airdrop allocations
  const usersWithAirdrop = MOCK_POINTS_DATA.map(user => ({
    ...user,
    estimatedAirdrop: calculateAirdropAllocation(user.totalPoints, totalPoints),
  }));

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Gift className="w-8 h-8 text-purple-500" />
            <h1 className="text-3xl font-bold text-gray-900">
              🤫 Secret Points System
            </h1>
          </div>
          <p className="text-gray-600">
            $TROLL Token Airdrop - Admin Dashboard
          </p>
          <Badge className="bg-red-500 text-white">
            🔒 CONFIDENTIAL - DO NOT SHARE
          </Badge>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-purple-700 font-medium">Total Users</span>
            </div>
            <div className="text-2xl font-bold text-purple-700">
              {MOCK_POINTS_DATA.length}
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-700 font-medium">Total Points</span>
            </div>
            <div className="text-2xl font-bold text-blue-700">
              {totalPoints.toLocaleString()}
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700 font-medium">Airdrop Pool</span>
            </div>
            <div className="text-2xl font-bold text-green-700">
              150M
            </div>
            <div className="text-xs text-green-600">$TROLL (15%)</div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-yellow-700 font-medium">Avg Points</span>
            </div>
            <div className="text-2xl font-bold text-yellow-700">
              {Math.floor(totalPoints / MOCK_POINTS_DATA.length).toLocaleString()}
            </div>
          </Card>
        </div>

        {/* Points Configuration */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Points Configuration</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-500 mb-1">Bet Placed</div>
              <div className="font-bold text-gray-900">{POINTS_CONFIG.BET_PLACED} pts</div>
            </div>
            <div>
              <div className="text-gray-500 mb-1">Per 0.01 ETH</div>
              <div className="font-bold text-gray-900">{POINTS_CONFIG.VOLUME_PER_0_01_ETH} pts</div>
            </div>
            <div>
              <div className="text-gray-500 mb-1">Win Multiplier</div>
              <div className="font-bold text-green-600">{POINTS_CONFIG.WIN_MULTIPLIER}x</div>
            </div>
            <div>
              <div className="text-gray-500 mb-1">Daily Active</div>
              <div className="font-bold text-blue-600">{POINTS_CONFIG.DAILY_ACTIVE} pts</div>
            </div>
          </div>
        </Card>

        {/* Tier Thresholds */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🏆 Tier Thresholds</h2>
          <div className="grid grid-cols-5 gap-4">
            {Object.entries(TIER_THRESHOLDS).map(([tier, threshold]) => (
              <div key={tier} className="text-center">
                <div className="text-2xl mb-2">{getTierBadge(tier as 'bronze' | 'silver' | 'gold' | 'diamond' | 'legendary')}</div>
                <div className="text-sm font-medium text-gray-900 capitalize">{tier}</div>
                <div className="text-xs text-gray-500">{threshold.toLocaleString()} pts</div>
              </div>
            ))}
          </div>
        </Card>

        {/* User Points Table */}
        <Card className="overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">👥 User Points & Airdrop Allocation</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">User</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Total Points</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600">Tier</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Airdrop</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">% of Pool</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {usersWithAirdrop.map((user) => {
                  const tier = calculateTier(user.totalPoints);
                  const percentage = ((user.totalPoints / totalPoints) * 100).toFixed(2);
                  
                  return (
                    <tr key={user.address} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{user.username}</div>
                        <div className="text-xs text-gray-500">{user.address}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-bold text-gray-900">
                          {user.totalPoints.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">points</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-2xl">{getTierBadge(tier)}</span>
                          <Badge className={`bg-gradient-to-r ${getTierColor(tier)} text-white capitalize`}>
                            {tier}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-bold text-green-600">
                          {user.estimatedAirdrop.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">$TROLL</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-medium text-gray-900">{percentage}%</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Points Breakdown */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Points Breakdown (Top User)</h2>
          {usersWithAirdrop[0] && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-gray-700">Bets Placed</span>
                <span className="font-bold text-blue-600">
                  {usersWithAirdrop[0].breakdown.betsPlaced.toLocaleString()} pts
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-700">Volume Traded</span>
                <span className="font-bold text-green-600">
                  {usersWithAirdrop[0].breakdown.volumeTraded.toLocaleString()} pts
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm text-gray-700">Win Streak Bonuses</span>
                <span className="font-bold text-yellow-600">
                  {usersWithAirdrop[0].breakdown.winStreak.toLocaleString()} pts
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="text-sm text-gray-700">Early Adopter Bonus</span>
                <span className="font-bold text-purple-600">
                  {usersWithAirdrop[0].breakdown.earlyAdopter.toLocaleString()} pts
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
