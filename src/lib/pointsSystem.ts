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
 * 🎯 Designed to reward early adopters and active traders heavily
 * 
 * NOTE: Now using Native ETH for betting (not $DEGEN tokens)
 * Volume calculations adjusted for ETH amounts
 */
export const POINTS_CONFIG = {
  // Base points per action (INCREASED for early phase)
  BET_PLACED: 100,                   // 100 points per bet (10x boost for launch)
  VOLUME_PER_0_01_ETH: 50,          // 50 points per 0.01 ETH wagered (10x boost)
  WIN_MULTIPLIER: 2.5,               // 2.5x points if bet wins
  LOSS_CONSOLATION: 0.8,            // 0.8x points if bet loses (still rewarded!)
  
  // Streak bonuses (MASSIVE rewards for consistency)
  WIN_STREAK_BONUS: {
    3: 500,     // 3 wins in a row: +500 points
    5: 2000,    // 5 wins in a row: +2,000 points
    10: 10000,  // 10 wins in a row: +10,000 points
    20: 50000,  // 20 wins in a row: +50,000 points
  },
  
  // Early adopter bonuses (HUGE incentive for first users)
  EARLY_ADOPTER: {
    FIRST_10: 100000,     // First 10 users: 100k points 🚀
    FIRST_50: 50000,      // First 50 users: 50k points
    FIRST_100: 25000,     // First 100 users: 25k points
    FIRST_500: 10000,     // First 500 users: 10k points
    FIRST_1000: 5000,     // First 1,000 users: 5k points
    FIRST_5000: 1000,     // First 5,000 users: 1k points
  },
  
  // Social engagement
  CHAT_MESSAGE: 5,              // 5 points per message
  MARKET_CREATED: 5000,         // 5,000 points for creating market
  REFERRAL: 10000,              // 10,000 points per referral (HUGE!)
  
  // Consistency bonuses (Reward daily users)
  DAILY_ACTIVE: 100,            // 100 points for daily activity
  WEEKLY_STREAK: 1000,          // 1,000 points for 7-day streak
  MONTHLY_STREAK: 10000,        // 10,000 points for 30-day streak
  
  // Volume milestones in ETH (Progressive rewards)
  VOLUME_MILESTONES: {
    0.1: 1000,       // 0.1 ETH: +1,000 points
    0.5: 5000,       // 0.5 ETH: +5,000 points
    1: 15000,        // 1 ETH: +15,000 points
    5: 100000,       // 5 ETH: +100,000 points
    10: 300000,      // 10 ETH: +300,000 points 🎉
  },
};

/**
 * TIER THRESHOLDS
 * 🏆 Achievable but aspirational
 */
export const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 5000,      // ~50 bets or 1 ETH volume
  gold: 25000,       // ~250 bets or 5 ETH volume
  diamond: 100000,   // ~1000 bets or 20 ETH volume
  legendary: 500000, // Elite traders only 👑
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
 * @param amount - Bet amount in ETH
 */
export function calculateBetPoints(
  amount: number,
  won: boolean,
  currentStreak: number
): number {
  let points = POINTS_CONFIG.BET_PLACED;
  
  // Volume bonus (per 0.01 ETH)
  points += (amount / 0.01) * POINTS_CONFIG.VOLUME_PER_0_01_ETH;
  
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
  if (userIndex <= 50) return POINTS_CONFIG.EARLY_ADOPTER.FIRST_50;
  if (userIndex <= 100) return POINTS_CONFIG.EARLY_ADOPTER.FIRST_100;
  if (userIndex <= 500) return POINTS_CONFIG.EARLY_ADOPTER.FIRST_500;
  if (userIndex <= 1000) return POINTS_CONFIG.EARLY_ADOPTER.FIRST_1000;
  if (userIndex <= 5000) return POINTS_CONFIG.EARLY_ADOPTER.FIRST_5000;
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
