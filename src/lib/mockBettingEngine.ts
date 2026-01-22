/**
 * Mock Betting Engine - Pari-mutuel System
 * 
 * This simulates a full betting system before we connect to smart contracts.
 * It implements Pari-mutuel betting where odds are determined by the pool sizes.
 */

export interface BettingPool {
  yesPool: number;  // Total amount in YES pool
  noPool: number;   // Total amount in NO pool
  totalPool: number; // Combined pool
}

export interface UserBet {
  id: string;
  amount: number;
  side: 'YES' | 'NO';
  timestamp: Date;
  odds: number; // Odds at time of bet
}

export interface UserState {
  balance: number;
  bets: UserBet[];
  totalWagered: number;
  winnings: number;
}

export interface BettingEngineState {
  pool: BettingPool;
  userState: UserState;
  marketResolved: boolean;
  winningSide?: 'YES' | 'NO';
}

// Initial state
const INITIAL_BALANCE = 10000; // Start users with 10,000 mock tokens
const INITIAL_YES_POOL = 65000; // Existing YES bets
const INITIAL_NO_POOL = 35000; // Existing NO bets

export class MockBettingEngine {
  private state: BettingEngineState;
  private listeners: Set<(state: BettingEngineState) => void>;

  constructor() {
    this.state = {
      pool: {
        yesPool: INITIAL_YES_POOL,
        noPool: INITIAL_NO_POOL,
        totalPool: INITIAL_YES_POOL + INITIAL_NO_POOL,
      },
      userState: {
        balance: INITIAL_BALANCE,
        bets: [],
        totalWagered: 0,
        winnings: 0,
      },
      marketResolved: false,
    };
    this.listeners = new Set();
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: BettingEngineState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state change
   */
  private notify() {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  /**
   * Get current state (immutable copy)
   */
  getState(): BettingEngineState {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Calculate current odds for a side
   * Pari-mutuel odds = (Total Pool / Side Pool)
   * Returns the multiplier (e.g., 1.5x, 2.0x)
   */
  calculateOdds(side: 'YES' | 'NO'): number {
    const { yesPool, noPool, totalPool } = this.state.pool;
    
    // Prevent division by zero
    if (totalPool === 0) return 1;
    
    if (side === 'YES') {
      return yesPool === 0 ? totalPool : totalPool / yesPool;
    } else {
      return noPool === 0 ? totalPool : totalPool / noPool;
    }
  }

  /**
   * Calculate percentage of pool for a side
   */
  calculatePercentage(side: 'YES' | 'NO'): number {
    const { yesPool, noPool, totalPool } = this.state.pool;
    
    if (totalPool === 0) return 50;
    
    if (side === 'YES') {
      return (yesPool / totalPool) * 100;
    } else {
      return (noPool / totalPool) * 100;
    }
  }

  /**
   * Place a bet
   */
  placeBet(amount: number, side: 'YES' | 'NO'): { success: boolean; error?: string; bet?: UserBet } {
    // Validation
    if (this.state.marketResolved) {
      return { success: false, error: 'Market already resolved' };
    }

    if (amount <= 0) {
      return { success: false, error: 'Amount must be positive' };
    }

    if (amount > this.state.userState.balance) {
      return { success: false, error: 'Insufficient balance' };
    }

    // Calculate current odds
    const odds = this.calculateOdds(side);

    // Create bet
    const bet: UserBet = {
      id: `bet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      amount,
      side,
      timestamp: new Date(),
      odds,
    };

    // Update user state
    this.state.userState.balance -= amount;
    this.state.userState.totalWagered += amount;
    this.state.userState.bets.push(bet);

    // Update pool
    if (side === 'YES') {
      this.state.pool.yesPool += amount;
    } else {
      this.state.pool.noPool += amount;
    }
    this.state.pool.totalPool += amount;

    // Notify listeners
    this.notify();

    return { success: true, bet };
  }

  /**
   * Resolve the market (for testing)
   */
  resolveMarket(winningSide: 'YES' | 'NO') {
    if (this.state.marketResolved) {
      return { success: false, error: 'Market already resolved' };
    }

    this.state.marketResolved = true;
    this.state.winningSide = winningSide;

    // Calculate winnings
    const winningPool = winningSide === 'YES' ? this.state.pool.yesPool : this.state.pool.noPool;
    const totalPool = this.state.pool.totalPool;

    let totalWinnings = 0;

    // Calculate winnings for each winning bet
    this.state.userState.bets.forEach(bet => {
      if (bet.side === winningSide) {
        // User's share of winning pool
        const shareOfWinningPool = bet.amount / winningPool;
        // User gets their share of the total pool
        const payout = shareOfWinningPool * totalPool;
        totalWinnings += payout;
      }
    });

    this.state.userState.winnings = totalWinnings;
    this.state.userState.balance += totalWinnings;

    // Notify listeners
    this.notify();

    return { success: true, winnings: totalWinnings };
  }

  /**
   * Simulate pool fluctuations (other users betting)
   */
  simulateMarketActivity() {
    if (this.state.marketResolved) return;

    // Random amount between 100-1000
    const amount = Math.floor(Math.random() * 900) + 100;
    
    // Random side (60% YES, 40% NO to simulate current trend)
    const side: 'YES' | 'NO' = Math.random() > 0.4 ? 'YES' : 'NO';

    // Update pool (but not user state - these are other users)
    if (side === 'YES') {
      this.state.pool.yesPool += amount;
    } else {
      this.state.pool.noPool += amount;
    }
    this.state.pool.totalPool += amount;

    // Notify listeners
    this.notify();
  }

  /**
   * Reset the engine (for testing)
   */
  reset() {
    this.state = {
      pool: {
        yesPool: INITIAL_YES_POOL,
        noPool: INITIAL_NO_POOL,
        totalPool: INITIAL_YES_POOL + INITIAL_NO_POOL,
      },
      userState: {
        balance: INITIAL_BALANCE,
        bets: [],
        totalWagered: 0,
        winnings: 0,
      },
      marketResolved: false,
    };
    
    this.notify();
  }
}

// Singleton instance
let engineInstance: MockBettingEngine | null = null;

export function getBettingEngine(): MockBettingEngine {
  if (!engineInstance) {
    engineInstance = new MockBettingEngine();
  }
  return engineInstance;
}
