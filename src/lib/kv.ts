import { MiniAppNotificationDetails } from "@farcaster/miniapp-sdk";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

function getUserNotificationDetailsKey(fid: number): string {
  return `frames-v2-demo:user:${fid}`;
}

export async function getUserNotificationDetails(
  fid: number
): Promise<MiniAppNotificationDetails | null> {
  return await redis.get<MiniAppNotificationDetails>(
    getUserNotificationDetailsKey(fid)
  );
}

export async function setUserNotificationDetails(
  fid: number,
  notificationDetails: MiniAppNotificationDetails
): Promise<void> {
  await redis.set(getUserNotificationDetailsKey(fid), notificationDetails);
}

export async function deleteUserNotificationDetails(
  fid: number
): Promise<void> {
  await redis.del(getUserNotificationDetailsKey(fid));
}

// ============ POINTS SYSTEM ============

interface UserPoints {
  address: string;
  fid?: number;
  username?: string;
  totalPoints: number;
  betsPlaced: number;
  volumeTraded: number; // in ETH
  winsCount: number;
  lossesCount: number;
  currentStreak: number;
  maxStreak: number;
  firstBetTimestamp: number;
  lastBetTimestamp: number;
  referrals: number;
  activeDays: Set<string>; // YYYY-MM-DD format
}

interface BetRecord {
  marketId: number;
  amount: number;
  side: boolean; // true = YES, false = NO
  timestamp: number;
  txHash?: string;
}

function getUserPointsKey(address: string): string {
  return `trollbox:points:${address.toLowerCase()}`;
}

function getUserBetsKey(address: string): string {
  return `trollbox:bets:${address.toLowerCase()}`;
}

function getLeaderboardKey(): string {
  return `trollbox:leaderboard`;
}

/**
 * Get user points
 */
export async function getUserPoints(address: string): Promise<UserPoints | null> {
  try {
    const data = await redis.get<UserPoints>(getUserPointsKey(address));
    if (data && data.activeDays) {
      // Convert activeDays array back to Set
      data.activeDays = new Set(data.activeDays as unknown as string[]);
    }
    return data;
  } catch (error) {
    console.error('Error getting user points:', error);
    return null;
  }
}

/**
 * Initialize user points
 */
export async function initializeUserPoints(
  address: string,
  fid?: number,
  username?: string
): Promise<UserPoints> {
  const points: UserPoints = {
    address: address.toLowerCase(),
    fid,
    username,
    totalPoints: 0,
    betsPlaced: 0,
    volumeTraded: 0,
    winsCount: 0,
    lossesCount: 0,
    currentStreak: 0,
    maxStreak: 0,
    firstBetTimestamp: Date.now(),
    lastBetTimestamp: Date.now(),
    referrals: 0,
    activeDays: new Set<string>(),
  };

  await redis.set(getUserPointsKey(address), {
    ...points,
    activeDays: Array.from(points.activeDays),
  });

  return points;
}

/**
 * Record a bet and update points
 */
export async function recordBet(
  address: string,
  marketId: number,
  amount: number,
  side: boolean,
  fid?: number,
  username?: string,
  txHash?: string
): Promise<UserPoints> {
  // Get or initialize user points
  let userPoints = await getUserPoints(address);
  if (!userPoints) {
    userPoints = await initializeUserPoints(address, fid, username);
  }

  // Update user info if provided
  if (fid && !userPoints.fid) userPoints.fid = fid;
  if (username && !userPoints.username) userPoints.username = username;

  // Record the bet
  const bet: BetRecord = {
    marketId,
    amount,
    side,
    timestamp: Date.now(),
    txHash,
  };

  // Add bet to user's bet history
  const betsKey = getUserBetsKey(address);
  await redis.lpush(betsKey, bet);

  // Update points
  const today = new Date().toISOString().split('T')[0];
  userPoints.activeDays.add(today);
  userPoints.betsPlaced += 1;
  userPoints.volumeTraded += amount;
  userPoints.lastBetTimestamp = Date.now();

  // Calculate points (from pointsSystem.ts logic)
  const BET_PLACED_POINTS = 100;
  const VOLUME_POINTS_PER_1K = 50;
  const DAILY_ACTIVE_POINTS = 25;

  let pointsEarned = BET_PLACED_POINTS;
  pointsEarned += Math.floor(amount / 1000) * VOLUME_POINTS_PER_1K;
  
  // Daily active bonus (first bet of the day)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  if (!userPoints.activeDays.has(yesterday)) {
    pointsEarned += DAILY_ACTIVE_POINTS;
  }

  userPoints.totalPoints += pointsEarned;

  // Save updated points
  await redis.set(getUserPointsKey(address), {
    ...userPoints,
    activeDays: Array.from(userPoints.activeDays),
  });

  // Update leaderboard (sorted set by total points)
  await redis.zadd(getLeaderboardKey(), {
    score: userPoints.totalPoints,
    member: address.toLowerCase(),
  });

  return userPoints;
}

/**
 * Get top N users from leaderboard
 */
export async function getLeaderboard(limit: number = 100): Promise<Array<{ address: string; points: number }>> {
  try {
    const results = await redis.zrange(getLeaderboardKey(), 0, limit - 1, {
      rev: true,
      withScores: true,
    });

    const leaderboard: Array<{ address: string; points: number }> = [];
    for (let i = 0; i < results.length; i += 2) {
      leaderboard.push({
        address: results[i] as string,
        points: results[i + 1] as number,
      });
    }

    return leaderboard;
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
}

/**
 * Get user's bet history
 */
export async function getUserBetHistory(
  address: string,
  limit: number = 50
): Promise<BetRecord[]> {
  try {
    const bets = await redis.lrange<BetRecord>(getUserBetsKey(address), 0, limit - 1);
    return bets || [];
  } catch (error) {
    console.error('Error getting bet history:', error);
    return [];
  }
}