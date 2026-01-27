/**
 * POINTS SYSTEM FOR $TROLL AIRDROP
 *
 * Logical, transparent point system based on:
 * 1. Volume (main factor) - more trading = more points
 * 2. P&L Boost - winners get multiplier, losers still earn
 * 3. Consistency - streak bonuses
 * 4. Early adopter - bonus for early users
 */

export type Tier = 'bronze' | 'silver' | 'gold' | 'diamond' | 'legendary';

export interface UserPoints {
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
  totalWonETH: number;    // ETH won from claims
  totalLostETH: number;   // ETH lost (bet amount on losing bets)
  totalClaimedETH: number; // ETH actually claimed
  firstBetTimestamp: number;
  lastBetTimestamp: number;
  referrals: number;
  activeDays: string[]; // YYYY-MM-DD format (stored as array in Redis)
}

// ============ POINTS CONFIGURATION ============

export const POINTS_CONFIG = {
  // Base points per bet
  BET_BASE: 10,

  // Volume: points per 0.001 ETH wagered
  VOLUME_PER_0_001_ETH: 10,

  // P&L outcome multipliers (applied after market resolution)
  WIN_MULTIPLIER: 2.0,
  LOSS_MULTIPLIER: 0.5,

  // Streak bonuses (one-time when streak reached)
  STREAK_BONUSES: {
    3: 200,
    5: 1000,
    10: 5000,
  } as Record<number, number>,

  // Volume milestones (one-time bonus)
  VOLUME_MILESTONES: {
    0.1: 500,
    0.5: 2500,
    1: 10000,
    5: 50000,
    10: 150000,
  } as Record<number, number>,

  // Early adopter bonuses
  EARLY_ADOPTER: {
    FIRST_10: 100000,
    FIRST_50: 50000,
    FIRST_100: 25000,
    FIRST_500: 10000,
    FIRST_1000: 5000,
    FIRST_5000: 1000,
  },

  // Social / misc
  CHAT_MESSAGE: 5,
  DAILY_ACTIVE: 100,
};

// ============ TIER SYSTEM ============

export const TIER_THRESHOLDS: Record<Tier, number> = {
  bronze: 0,
  silver: 1000,
  gold: 10000,
  diamond: 50000,
  legendary: 200000,
};

export const TIER_MULTIPLIERS: Record<Tier, number> = {
  bronze: 1.0,
  silver: 1.1,
  gold: 1.25,
  diamond: 1.5,
  legendary: 2.0,
};

// ============ CORE FUNCTIONS ============

/**
 * Calculate base points for placing a bet (before outcome known)
 * Formula: 10 base + (amountETH / 0.001) * 10
 */
export function calculateBetPoints(amountETH: number): number {
  const base = POINTS_CONFIG.BET_BASE;
  const volumePoints = Math.floor(amountETH / 0.001) * POINTS_CONFIG.VOLUME_PER_0_001_ETH;
  return base + volumePoints;
}

/**
 * Apply outcome multiplier after market resolution
 * Win: x2.0, Loss: x0.5
 */
export function applyOutcomeMultiplier(basePoints: number, won: boolean): number {
  const multiplier = won ? POINTS_CONFIG.WIN_MULTIPLIER : POINTS_CONFIG.LOSS_MULTIPLIER;
  return Math.floor(basePoints * multiplier);
}

/**
 * Calculate streak bonus (one-time, when exact streak is reached)
 */
export function calculateStreakBonus(currentStreak: number): number {
  return POINTS_CONFIG.STREAK_BONUSES[currentStreak] || 0;
}

/**
 * Calculate volume milestone bonus (one-time per milestone crossed)
 */
export function calculateVolumeMilestoneBonus(
  newTotalVolume: number,
  previousVolume: number
): number {
  let bonus = 0;
  for (const [thresholdStr, points] of Object.entries(POINTS_CONFIG.VOLUME_MILESTONES)) {
    const threshold = parseFloat(thresholdStr);
    if (newTotalVolume >= threshold && previousVolume < threshold) {
      bonus += points;
    }
  }
  return bonus;
}

/**
 * Calculate user tier based on total points
 */
export function calculateTier(totalPoints: number): Tier {
  if (totalPoints >= TIER_THRESHOLDS.legendary) return 'legendary';
  if (totalPoints >= TIER_THRESHOLDS.diamond) return 'diamond';
  if (totalPoints >= TIER_THRESHOLDS.gold) return 'gold';
  if (totalPoints >= TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

/**
 * Get multiplier for user tier
 */
export function getTierMultiplier(tier: Tier): number {
  return TIER_MULTIPLIERS[tier];
}

/**
 * Apply tier multiplier to points
 */
export function applyTierMultiplier(points: number, totalPoints: number): number {
  const tier = calculateTier(totalPoints);
  const multiplier = getTierMultiplier(tier);
  return Math.floor(points * multiplier);
}

/**
 * Calculate early adopter bonus
 */
export function calculateEarlyAdopterBonus(userIndex: number): number {
  if (userIndex <= 10) return POINTS_CONFIG.EARLY_ADOPTER.FIRST_10;
  if (userIndex <= 50) return POINTS_CONFIG.EARLY_ADOPTER.FIRST_50;
  if (userIndex <= 100) return POINTS_CONFIG.EARLY_ADOPTER.FIRST_100;
  if (userIndex <= 500) return POINTS_CONFIG.EARLY_ADOPTER.FIRST_500;
  if (userIndex <= 1000) return POINTS_CONFIG.EARLY_ADOPTER.FIRST_1000;
  if (userIndex <= 5000) return POINTS_CONFIG.EARLY_ADOPTER.FIRST_5000;
  return 0;
}

// ============ UI HELPERS ============

export function getTierBadge(tier: Tier): string {
  switch (tier) {
    case 'legendary': return '👑';
    case 'diamond': return '💎';
    case 'gold': return '🥇';
    case 'silver': return '🥈';
    case 'bronze': return '🥉';
    default: return '🎯';
  }
}

export function getTierColor(tier: Tier): string {
  switch (tier) {
    case 'legendary': return 'from-purple-500 to-pink-500';
    case 'diamond': return 'from-cyan-400 to-blue-500';
    case 'gold': return 'from-yellow-400 to-orange-500';
    case 'silver': return 'from-gray-300 to-gray-400';
    case 'bronze': return 'from-orange-700 to-orange-900';
    default: return 'from-gray-400 to-gray-500';
  }
}

/**
 * AIRDROP ALLOCATION FORMULA
 * Total $TROLL supply: 1,000,000,000 (1B)
 * Airdrop allocation: 15% = 150,000,000 $TROLL
 * User allocation = (User Points / Total Points) * 150M $TROLL
 */
export function calculateAirdropAllocation(
  userPoints: number,
  totalPoints: number
): number {
  const AIRDROP_POOL = 150_000_000;
  if (totalPoints === 0) return 0;
  const userShare = userPoints / totalPoints;
  return Math.floor(userShare * AIRDROP_POOL);
}
