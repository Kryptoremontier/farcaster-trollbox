/**
 * 🤫 SECRET POINTS SYSTEM FOR $TROLL AIRDROP
 * 
 * Users earn points through various activities.
 * Points will be used for future $TROLL token airdrop allocation.
 * 
 * DO NOT expose this system to users yet!
 */

export interface UserPoints {
  address: string;
  totalPoints: number;
  breakdown: {
    betsPlaced: number;        // Points from placing bets
    volumeTraded: number;      // Points from total volume
    winStreak: number;         // Bonus for winning streaks
    earlyAdopter: number;      // Bonus for early users
    socialEngagement: number;  // Points from chat/social
    referrals: number;         // Points from referrals
    consistency: number;       // Daily active bonus
  };
  multiplier: number;          // VIP multiplier (1x - 5x)
  tier: 'bronze' | 'silver' | 'gold' | 'diamond' | 'legendary';
  lastUpdated: number;
}

/**
 * POINTS CALCULATION RULES
 */
export const POINTS_CONFIG = {
  // Base points per action
  BET_PLACED: 10,                    // 10 points per bet
  VOLUME_PER_1K_DEGEN: 5,           // 5 points per 1,000 $DEGEN wagered
  WIN_MULTIPLIER: 2,                 // 2x points if bet wins
  LOSS_CONSOLATION: 0.5,            // 0.5x points if bet loses
  
  // Streak bonuses
  WIN_STREAK_BONUS: {
    3: 50,    // 3 wins in a row: +50 points
    5: 150,   // 5 wins in a row: +150 points
    10: 500,  // 10 wins in a row: +500 points
    20: 2000, // 20 wins in a row: +2000 points
  },
  
  // Early adopter bonuses (by user ID)
  EARLY_ADOPTER: {
    FIRST_10: 10000,      // First 10 users: 10k points
    FIRST_100: 5000,      // First 100 users: 5k points
    FIRST_1000: 1000,     // First 1,000 users: 1k points
    FIRST_10000: 100,     // First 10,000 users: 100 points
  },
  
  // Social engagement
  CHAT_MESSAGE: 1,              // 1 point per message
  MARKET_CREATED: 500,          // 500 points for creating market
  REFERRAL: 1000,               // 1,000 points per referral
  
  // Consistency bonuses
  DAILY_ACTIVE: 20,             // 20 points for daily activity
  WEEKLY_STREAK: 200,           // 200 points for 7-day streak
  MONTHLY_STREAK: 1000,         // 1,000 points for 30-day streak
  
  // Volume milestones
  VOLUME_MILESTONES: {
    10000: 100,      // 10k $DEGEN: +100 points
    50000: 500,      // 50k $DEGEN: +500 points
    100000: 1500,    // 100k $DEGEN: +1,500 points
    500000: 10000,   // 500k $DEGEN: +10,000 points
    1000000: 25000,  // 1M $DEGEN: +25,000 points
  },
};

/**
 * TIER THRESHOLDS
 */
export const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 1000,
  gold: 5000,
  diamond: 25000,
  legendary: 100000,
};

/**
 * MULTIPLIERS BY TIER
 */
export const TIER_MULTIPLIERS = {
  bronze: 1.0,
  silver: 1.2,
  gold: 1.5,
  diamond: 2.0,
  legendary: 3.0,
};

/**
 * Calculate points for placing a bet
 */
export function calculateBetPoints(
  amount: number,
  won: boolean,
  currentStreak: number
): number {
  let points = POINTS_CONFIG.BET_PLACED;
  
  // Volume bonus
  points += (amount / 1000) * POINTS_CONFIG.VOLUME_PER_1K_DEGEN;
  
  // Win/loss multiplier
  if (won) {
    points *= POINTS_CONFIG.WIN_MULTIPLIER;
    
    // Streak bonus
    const streakBonus = POINTS_CONFIG.WIN_STREAK_BONUS[currentStreak as keyof typeof POINTS_CONFIG.WIN_STREAK_BONUS];
    if (streakBonus) {
      points += streakBonus;
    }
  } else {
    points *= POINTS_CONFIG.LOSS_CONSOLATION;
  }
  
  return Math.floor(points);
}

/**
 * Calculate user tier based on total points
 */
export function calculateTier(totalPoints: number): UserPoints['tier'] {
  if (totalPoints >= TIER_THRESHOLDS.legendary) return 'legendary';
  if (totalPoints >= TIER_THRESHOLDS.diamond) return 'diamond';
  if (totalPoints >= TIER_THRESHOLDS.gold) return 'gold';
  if (totalPoints >= TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

/**
 * Get multiplier for user tier
 */
export function getTierMultiplier(tier: UserPoints['tier']): number {
  return TIER_MULTIPLIERS[tier];
}

/**
 * Calculate early adopter bonus
 */
export function calculateEarlyAdopterBonus(userIndex: number): number {
  if (userIndex <= 10) return POINTS_CONFIG.EARLY_ADOPTER.FIRST_10;
  if (userIndex <= 100) return POINTS_CONFIG.EARLY_ADOPTER.FIRST_100;
  if (userIndex <= 1000) return POINTS_CONFIG.EARLY_ADOPTER.FIRST_1000;
  if (userIndex <= 10000) return POINTS_CONFIG.EARLY_ADOPTER.FIRST_10000;
  return 0;
}

/**
 * Calculate volume milestone bonus
 */
export function calculateVolumeMilestoneBonus(
  totalVolume: number,
  previousVolume: number
): number {
  let bonus = 0;
  
  for (const [threshold, points] of Object.entries(POINTS_CONFIG.VOLUME_MILESTONES)) {
    const thresholdNum = parseInt(threshold);
    if (totalVolume >= thresholdNum && previousVolume < thresholdNum) {
      bonus += points;
    }
  }
  
  return bonus;
}

/**
 * 🎁 AIRDROP ALLOCATION FORMULA
 * 
 * Total $TROLL supply: 1,000,000,000 (1B)
 * Airdrop allocation: 15% = 150,000,000 $TROLL
 * 
 * User allocation = (User Points / Total Points) × 150M $TROLL
 */
export function calculateAirdropAllocation(
  userPoints: number,
  totalPoints: number
): number {
  const AIRDROP_POOL = 150_000_000; // 150M $TROLL
  const userShare = userPoints / totalPoints;
  return Math.floor(userShare * AIRDROP_POOL);
}

/**
 * Get tier badge emoji (for UI - subtle hints)
 */
export function getTierBadge(tier: UserPoints['tier']): string {
  switch (tier) {
    case 'legendary': return '👑';
    case 'diamond': return '💎';
    case 'gold': return '🥇';
    case 'silver': return '🥈';
    case 'bronze': return '🥉';
    default: return '🎯';
  }
}

/**
 * Get tier color (for UI)
 */
export function getTierColor(tier: UserPoints['tier']): string {
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
 * Mock data for testing (will be replaced with real data from backend)
 */
export function getMockUserPoints(address: string): UserPoints {
  // This will be replaced with actual data from your backend/contract
  return {
    address,
    totalPoints: 0,
    breakdown: {
      betsPlaced: 0,
      volumeTraded: 0,
      winStreak: 0,
      earlyAdopter: 0,
      socialEngagement: 0,
      referrals: 0,
      consistency: 0,
    },
    multiplier: 1.0,
    tier: 'bronze',
    lastUpdated: Date.now(),
  };
}
