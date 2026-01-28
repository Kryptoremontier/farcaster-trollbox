import { MiniAppNotificationDetails } from "@farcaster/miniapp-sdk";
import { Redis } from "@upstash/redis";
import {
  type UserPoints,
  type Tier,
  calculateBetPoints,
  applyOutcomeMultiplier,
  calculateStreakBonus,
  calculateVolumeMilestoneBonus,
  calculateTier,
  getTierMultiplier,
} from "./pointsSystem";

// Re-export UserPoints so consumers can import from kv
export type { UserPoints };

// Check if Redis is configured
const isRedisConfigured = !!(
  (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
  (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)
);

const redis = isRedisConfigured ? new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
}) : null;

// ============ NOTIFICATION DETAILS ============

function getUserNotificationDetailsKey(fid: number): string {
  return `frames-v2-demo:user:${fid}`;
}

export async function getUserNotificationDetails(
  fid: number
): Promise<MiniAppNotificationDetails | null> {
  if (!redis) return null;
  return await redis.get<MiniAppNotificationDetails>(
    getUserNotificationDetailsKey(fid)
  );
}

export async function setUserNotificationDetails(
  fid: number,
  notificationDetails: MiniAppNotificationDetails
): Promise<void> {
  if (!redis) return;
  await redis.set(getUserNotificationDetailsKey(fid), notificationDetails);
}

export async function deleteUserNotificationDetails(
  fid: number
): Promise<void> {
  if (!redis) return;
  await redis.del(getUserNotificationDetailsKey(fid));
}

// ============ POINTS SYSTEM ============

interface BetRecord {
  marketId: number;
  amount: number; // ETH
  side: boolean; // true = YES, false = NO
  timestamp: number;
  txHash?: string;
  basePoints: number; // points earned at bet time (before outcome)
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
 * Get user points data
 */
export async function getUserPoints(address: string): Promise<UserPoints | null> {
  if (!redis) return null;
  try {
    const data = await redis.get<UserPoints>(getUserPointsKey(address));
    if (!data) return null;
    // Ensure activeDays is always an array
    if (!data.activeDays) {
      data.activeDays = [];
    } else if (!Array.isArray(data.activeDays)) {
      data.activeDays = Array.from(data.activeDays as unknown as Set<string>);
    }
    // Ensure all fields exist (backward compat with old data)
    if (data.totalWonETH === undefined) data.totalWonETH = 0;
    if (data.totalLostETH === undefined) data.totalLostETH = 0;
    if (data.totalClaimedETH === undefined) data.totalClaimedETH = 0;
    if (data.winsCount === undefined) data.winsCount = 0;
    if (data.lossesCount === undefined) data.lossesCount = 0;
    if (data.currentStreak === undefined) data.currentStreak = 0;
    if (data.maxStreak === undefined) data.maxStreak = 0;
    if (data.betsPlaced === undefined) data.betsPlaced = 0;
    if (data.volumeTraded === undefined) data.volumeTraded = 0;
    if (data.totalPoints === undefined) data.totalPoints = 0;
    if (data.referrals === undefined) data.referrals = 0;

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
    totalWonETH: 0,
    totalLostETH: 0,
    totalClaimedETH: 0,
    firstBetTimestamp: Date.now(),
    lastBetTimestamp: Date.now(),
    referrals: 0,
    activeDays: [],
  };

  if (redis) {
    await redis.set(getUserPointsKey(address), points);
  }

  return points;
}

/**
 * Record a bet and update points using the new logical system.
 *
 * Points awarded at bet time:
 * - Base: 10 points
 * - Volume: (amountETH / 0.001) * 10 points
 * - Volume milestone bonus (if crossed)
 * - All multiplied by tier multiplier
 */
export async function recordBet(
  address: string,
  marketId: number,
  amount: number, // ETH amount (e.g. 0.01)
  side: boolean,
  fid?: number,
  username?: string,
  txHash?: string
): Promise<UserPoints> {
  let userPoints = await getUserPoints(address);
  if (!userPoints) {
    userPoints = await initializeUserPoints(address, fid, username);
  }

  // Update user info if provided
  if (fid && !userPoints.fid) userPoints.fid = fid;
  if (username && !userPoints.username) userPoints.username = username;

  // Calculate base points for this bet
  const basePoints = calculateBetPoints(amount);

  // Check volume milestones BEFORE updating volume
  const previousVolume = userPoints.volumeTraded;
  const newVolume = previousVolume + amount;
  const milestoneBonus = calculateVolumeMilestoneBonus(newVolume, previousVolume);

  // Apply tier multiplier to earned points
  const tier = calculateTier(userPoints.totalPoints);
  const tierMultiplier = getTierMultiplier(tier);
  const pointsEarned = Math.floor((basePoints + milestoneBonus) * tierMultiplier);

  // Daily active bonus
  const today = new Date().toISOString().split('T')[0];
  let dailyBonus = 0;
  if (!userPoints.activeDays.includes(today)) {
    dailyBonus = Math.floor(100 * tierMultiplier); // DAILY_ACTIVE with tier
    userPoints.activeDays.push(today);
  }

  // Update stats
  userPoints.betsPlaced += 1;
  userPoints.volumeTraded = newVolume;
  userPoints.lastBetTimestamp = Date.now();
  userPoints.totalPoints += pointsEarned + dailyBonus;

  // Record bet with basePoints for later outcome calculation
  const bet: BetRecord = {
    marketId,
    amount,
    side,
    timestamp: Date.now(),
    txHash,
    basePoints,
  };

  if (redis) {
    const betsKey = getUserBetsKey(address);
    await redis.lpush(betsKey, bet);

    await redis.set(getUserPointsKey(address), userPoints);

    await redis.zadd(getLeaderboardKey(), {
      score: userPoints.totalPoints,
      member: address.toLowerCase(),
    });
  }

  return userPoints;
}

/**
 * Record outcome after market resolution.
 * Called when a user's bet is resolved (win or loss).
 *
 * - Applies P&L boost: win x2.0, loss x0.5 on original basePoints
 * - Updates win/loss counts
 * - Updates streak + streak bonus
 * - Updates totalWonETH / totalLostETH
 */
export async function recordOutcome(
  address: string,
  marketId: number,
  won: boolean,
  betAmount: number, // ETH the user originally bet
  payout: number,    // ETH payout (0 if lost, winnings if won)
): Promise<UserPoints | null> {
  const userPoints = await getUserPoints(address);
  if (!userPoints) return null;

  // Calculate outcome bonus points
  // The base points were: calculateBetPoints(betAmount)
  const basePoints = calculateBetPoints(betAmount);
  const outcomePoints = applyOutcomeMultiplier(basePoints, won);
  // The user already got basePoints at bet time.
  // Outcome adjustment = outcomePoints - basePoints (can be positive or negative)
  const pointsAdjustment = outcomePoints - basePoints;

  // Update win/loss counts
  if (won) {
    userPoints.winsCount += 1;
    userPoints.currentStreak += 1;
    if (userPoints.currentStreak > userPoints.maxStreak) {
      userPoints.maxStreak = userPoints.currentStreak;
    }
    userPoints.totalWonETH += payout;
  } else {
    userPoints.lossesCount += 1;
    userPoints.currentStreak = 0;
    userPoints.totalLostETH += betAmount;
  }

  // Streak bonus (only on win)
  let streakBonus = 0;
  if (won) {
    streakBonus = calculateStreakBonus(userPoints.currentStreak);
  }

  // Apply tier multiplier to adjustment and streak
  const tier = calculateTier(userPoints.totalPoints);
  const tierMultiplier = getTierMultiplier(tier);
  const totalAdjustment = Math.floor((pointsAdjustment + streakBonus) * tierMultiplier);

  userPoints.totalPoints += totalAdjustment;
  // Ensure points never go below 0
  if (userPoints.totalPoints < 0) userPoints.totalPoints = 0;

  if (redis) {
    await redis.set(getUserPointsKey(address), userPoints);

    await redis.zadd(getLeaderboardKey(), {
      score: userPoints.totalPoints,
      member: address.toLowerCase(),
    });
  }

  return userPoints;
}

/**
 * Record a claim (user claimed winnings or refund)
 */
export async function recordClaim(
  address: string,
  claimedAmount: number, // ETH claimed
): Promise<void> {
  const userPoints = await getUserPoints(address);
  if (!userPoints || !redis) return;

  userPoints.totalClaimedETH += claimedAmount;
  await redis.set(getUserPointsKey(address), userPoints);
}

/**
 * Get full user stats for leaderboard display
 */
export function getUserStats(userPoints: UserPoints): {
  pnlETH: number;
  roi: number;
  winRate: number;
  tier: Tier;
  tierMultiplier: number;
} {
  const wins = userPoints.winsCount || 0;
  const losses = userPoints.lossesCount || 0;
  const totalBets = wins + losses;
  const wonETH = userPoints.totalWonETH || 0;
  const lostETH = userPoints.totalLostETH || 0;
  const volume = userPoints.volumeTraded || 0;
  const points = userPoints.totalPoints || 0;

  const pnlETH = wonETH - lostETH;
  const roi = volume > 0 ? (pnlETH / volume) * 100 : 0;
  const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0;
  const tier = calculateTier(points);
  const tierMult = getTierMultiplier(tier);

  return {
    pnlETH,
    roi,
    winRate,
    tier,
    tierMultiplier: tierMult,
  };
}

// ============ LEADERBOARD ============

/**
 * Get top N users from leaderboard
 */
export async function getLeaderboard(limit: number = 100): Promise<Array<{ address: string; points: number }>> {
  if (!redis) return [];
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
 * Reset entire leaderboard: remove sorted set and all user points/bets data.
 * Use with caution - this wipes all points history.
 */
export async function resetLeaderboard(): Promise<{ cleared: number }> {
  if (!redis) return { cleared: 0 };

  try {
    // Get all members from leaderboard sorted set
    const members = await redis.zrange(getLeaderboardKey(), 0, -1);

    let cleared = 0;
    for (const addr of members) {
      const address = String(addr);
      // Delete user points hash
      await redis.del(getUserPointsKey(address));
      // Delete user bets list
      await redis.del(getUserBetsKey(address));
      cleared++;
    }

    // Delete leaderboard sorted set
    await redis.del(getLeaderboardKey());

    console.log(`[RESET] Cleared leaderboard: ${cleared} users wiped`);
    return { cleared };
  } catch (error) {
    console.error('Error resetting leaderboard:', error);
    return { cleared: 0 };
  }
}

// ============ BET HISTORY ============

/**
 * Get user's bet history
 */
export async function getUserBetHistory(
  address: string,
  limit: number = 50
): Promise<BetRecord[]> {
  if (!redis) return [];
  try {
    const bets = await redis.lrange<BetRecord>(getUserBetsKey(address), 0, limit - 1);
    return bets || [];
  } catch (error) {
    console.error('Error getting bet history:', error);
    return [];
  }
}
