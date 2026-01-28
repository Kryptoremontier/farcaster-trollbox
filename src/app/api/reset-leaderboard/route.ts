/**
 * ONE-TIME endpoint to reset leaderboard data.
 * Protected by CRON_SECRET. Call once, then remove.
 */

import { NextRequest, NextResponse } from "next/server";
import { resetLeaderboard } from "~/lib/kv";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    // ONE-TIME reset - remove this endpoint after use
    const url = new URL(req.url);
    const confirm = url.searchParams.get("confirm");
    if (confirm !== "RESET_ALL_POINTS_2026") {
      return NextResponse.json(
        { error: "Add ?confirm=RESET_ALL_POINTS_2026 to confirm" },
        { status: 400 }
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
