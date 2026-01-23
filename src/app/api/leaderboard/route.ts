/**
 * API endpoint to get leaderboard
 */

import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard, getUserPoints } from "~/lib/kv";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 100;

    const leaderboard = await getLeaderboard(limit);

    // Enrich with user details
    const enrichedLeaderboard = await Promise.all(
      leaderboard.map(async (entry) => {
        const userPoints = await getUserPoints(entry.address);
        return {
          address: entry.address,
          points: entry.points,
          username: userPoints?.username,
          fid: userPoints?.fid,
          betsPlaced: userPoints?.betsPlaced || 0,
          volumeTraded: userPoints?.volumeTraded || 0,
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
