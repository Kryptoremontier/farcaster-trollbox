/**
 * API endpoint to record bet outcome after market resolution.
 * Called after claim winnings or when cron resolves markets.
 *
 * Updates user P&L, win/loss counts, streak, and applies P&L boost to points.
 */

import { NextRequest, NextResponse } from "next/server";
import { recordOutcome, recordClaim } from "~/lib/kv";

export const runtime = "edge";

interface RecordOutcomeRequest {
  address: string;
  marketId: number;
  won: boolean;
  betAmount: number;  // ETH originally bet
  payout: number;     // ETH payout (0 if lost)
  claimed?: boolean;  // whether this is a claim action
  claimedAmount?: number; // ETH actually claimed
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as RecordOutcomeRequest;

    if (!body.address || body.marketId === undefined || body.won === undefined || body.betAmount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: address, marketId, won, betAmount" },
        { status: 400 }
      );
    }

    // Record the outcome (P&L boost, streak, win/loss)
    const userPoints = await recordOutcome(
      body.address,
      body.marketId,
      body.won,
      body.betAmount,
      body.payout || 0,
    );

    if (!userPoints) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // If this is also a claim, record the claimed amount
    if (body.claimed && body.claimedAmount) {
      await recordClaim(body.address, body.claimedAmount);
    }

    return NextResponse.json({
      success: true,
      points: userPoints,
    });
  } catch (error) {
    console.error("Error recording outcome:", error);
    return NextResponse.json(
      { error: "Failed to record outcome" },
      { status: 500 }
    );
  }
}
