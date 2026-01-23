/**
 * API endpoint to get user points
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserPoints } from "~/lib/kv";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Address parameter is required" },
        { status: 400 }
      );
    }

    const points = await getUserPoints(address);

    if (!points) {
      return NextResponse.json({
        success: true,
        points: null,
        message: "User has no points yet",
      });
    }

    return NextResponse.json({
      success: true,
      points: {
        ...points,
        activeDays: Array.from(points.activeDays),
      },
    });
  } catch (error) {
    console.error("Error getting user points:", error);
    return NextResponse.json(
      { error: "Failed to get user points" },
      { status: 500 }
    );
  }
}
