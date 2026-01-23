/**
 * API endpoint to record a bet and update user points
 * Called after successful bet transaction on blockchain
 */

import { NextRequest, NextResponse } from "next/server";
import { recordBet } from "~/lib/kv";

export const runtime = "edge";

interface RecordBetRequest {
  address: string;
  marketId: number;
  amount: number;
  side: boolean;
  fid?: number;
  username?: string;
  txHash?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as RecordBetRequest;

    // Validate required fields
    if (!body.address || body.marketId === undefined || !body.amount || body.side === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Record the bet and update points
    const userPoints = await recordBet(
      body.address,
      body.marketId,
      body.amount,
      body.side,
      body.fid,
      body.username,
      body.txHash
    );

    return NextResponse.json({
      success: true,
      points: userPoints,
    });
  } catch (error) {
    console.error("Error recording bet:", error);
    return NextResponse.json(
      { error: "Failed to record bet" },
      { status: 500 }
    );
  }
}
