/**
 * ONE-TIME endpoint to reset leaderboard data.
 * Protected by CRON_SECRET. Call once, then remove.
 */

import { NextRequest, NextResponse } from "next/server";
import { resetLeaderboard } from "~/lib/kv";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    // Require secret to prevent abuse
    const authHeader = req.headers.get("authorization");
    const secret = process.env.CRON_SECRET;

    if (!secret) {
      return NextResponse.json(
        { error: "CRON_SECRET not configured" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await resetLeaderboard();

    return NextResponse.json({
      success: true,
      message: `Leaderboard reset. ${result.cleared} users cleared.`,
      cleared: result.cleared,
    });
  } catch (error) {
    console.error("Error resetting leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to reset leaderboard" },
      { status: 500 }
    );
  }
}
