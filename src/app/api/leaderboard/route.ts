/**
 * API endpoint to get leaderboard with full user stats
 */

import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard, getUserPoints, getUserStats } from "~/lib/kv";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 100;

    const leaderboard = await getLeaderboard(limit);

    // Enrich with full user stats
    const enrichedLeaderboard = await Promise.all(
      leaderboard.map(async (entry) => {
        const userPoints = await getUserPoints(entry.address);
        if (!userPoints) {
          return {
            address: entry.address,
            points: entry.points,
            username: undefined,
            fid: undefined,
            betsPlaced: 0,
            volumeTraded: 0,
            winsCount: 0,
            lossesCount: 0,
            currentStreak: 0,
            maxStreak: 0,
            pnlETH: 0,
            roi: 0,
            winRate: 0,
            tier: 'bronze' as const,
            tierMultiplier: 1.0,
            totalWonETH: 0,
            totalLostETH: 0,
          };
        }

        const stats = getUserStats(userPoints);
        return {
          address: entry.address,
          points: userPoints.totalPoints || entry.points,
          username: userPoints.username,
          fid: userPoints.fid,
          betsPlaced: userPoints.betsPlaced,
          volumeTraded: userPoints.volumeTraded,
          winsCount: userPoints.winsCount,
          lossesCount: userPoints.lossesCount,
          currentStreak: userPoints.currentStreak,
          maxStreak: userPoints.maxStreak,
          pnlETH: stats.pnlETH,
          roi: stats.roi,
          winRate: stats.winRate,
          tier: stats.tier,
          tierMultiplier: stats.tierMultiplier,
          totalWonETH: userPoints.totalWonETH,
          totalLostETH: userPoints.totalLostETH,
        };
      })
    );

    return NextResponse.json({
      success: true,
      leaderboard: enrichedLeaderboard,
    });
  } catch (error) {
    console.error("Error getting leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to get leaderboard" },
      { status: 500 }
    );
  }
}
