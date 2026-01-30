/**
 * Mock Markets Data for TrollBox
 * Each market represents a different prediction opportunity
 */

export interface Market {
  id: string;
  contractMarketId?: number; // Maps to smart contract market ID (undefined = not on contract yet)
  question: string;
  description: string;
  thumbnail: string; // Emoji for now, can be replaced with images
  category: 'crypto' | 'tech' | 'memes' | 'politics' | 'sports';
  endTime: Date;
  yesPool: number;
  noPool: number;
  status: 'active' | 'resolved' | 'upcoming';
  result?: 'YES' | 'NO';
}

// ⚠️ CRITICAL: When deploying new markets to contract:
// 1. REMOVE all old/ended markets from this array
// 2. Add ONLY the newly deployed markets
// 3. Use FIXED endTime matching the contract deployment (NOT Date.now()!)
// 4. Match contractMarketId with actual on-chain IDs
// 5. Get the exact endTime from the contract or deployment script output

// ⚠️ MAINNET MARKETS - BASE MAINNET
// Contract: 0x52ABabe88DE8799B374b11B91EC1b32989779e55

// ARCHIVED MARKETS - Old/ended markets kept for Portfolio CLAIM functionality
// Users can still claim winnings from these markets
export const ARCHIVED_MARKETS: Market[] = [
  {
    id: 'market-0',
    contractMarketId: 0,
    question: '🎲 Will BTC price end with digit 5 in next 10min?',
    description: 'Ended - Test market',
    thumbnail: '🎲',
    category: 'crypto',
    endTime: new Date('2026-01-23T20:04:25.000Z'),
    yesPool: 0,
    noPool: 0,
    status: 'resolved',
  },
  {
    id: 'market-1',
    contractMarketId: 1,
    question: '⚡ Will ETH gas be above 15 gwei in 10min?',
    description: 'Ended - Test market',
    thumbnail: '⚡',
    category: 'crypto',
    endTime: new Date('2026-01-23T20:04:25.000Z'),
    yesPool: 0,
    noPool: 0,
    status: 'resolved',
  },
  {
    id: 'market-2',
    contractMarketId: 2,
    question: '🎲 Will BTC price end with digit 3 in next 10min?',
    description: 'Ended - Test market',
    thumbnail: '🎲',
    category: 'crypto',
    endTime: new Date('2026-01-23T20:04:25.000Z'),
    yesPool: 0,
    noPool: 0,
    status: 'resolved',
  },
  {
    id: 'market-3',
    contractMarketId: 3,
    question: '🎲 Will BTC price end with digit 5 in next 30min?',
    description: 'Resolved',
    thumbnail: '🎲',
    category: 'crypto',
    endTime: new Date('2026-01-23T20:37:20.000Z'),
    yesPool: 0,
    noPool: 0,
    status: 'resolved',
  },
  {
    id: 'market-4',
    contractMarketId: 4,
    question: '🎲 Will BTC price end with digit 5 in next 30min?',
    description: 'Resolved',
    thumbnail: '🎲',
    category: 'crypto',
    endTime: new Date('2026-01-23T21:23:32.000Z'),
    yesPool: 0,
    noPool: 0,
    status: 'resolved',
  },
  {
    id: 'market-5',
    contractMarketId: 5,
    question: '🎲 Will BTC price last digit be EVEN (0,2,4,6,8) at resolution?',
    description: 'Resolved',
    thumbnail: '🎲',
    category: 'crypto',
    endTime: new Date('2026-01-24T10:16:24.000Z'),
    yesPool: 0,
    noPool: 0,
    status: 'resolved',
  },
  {
    id: 'market-6',
    contractMarketId: 6,
    question: '🚀 Will ETH price touch $3,000 before resolution?',
    description: 'Resolved',
    thumbnail: '🚀',
    category: 'crypto',
    endTime: new Date('2026-01-24T10:16:52.000Z'),
    yesPool: 0,
    noPool: 0,
    status: 'resolved',
  },
  {
    id: 'market-7',
    contractMarketId: 7,
    question: '🎲 Will BTC price last digit be ODD (1, 3, 5, 7, 9) at resolution?',
    description: 'Resolved',
    thumbnail: '🎲',
    category: 'crypto',
    endTime: new Date('2026-01-25T12:16:49.000Z'),
    yesPool: 0,
    noPool: 0,
    status: 'resolved',
  },
  {
    id: 'market-8',
    contractMarketId: 8,
    question: '🚀 Will ETH price be above $3,000 at resolution time?',
    description: 'Resolved',
    thumbnail: '🚀',
    category: 'crypto',
    endTime: new Date('2026-01-25T12:16:49.000Z'),
    yesPool: 0,
    noPool: 0,
    status: 'resolved',
  },
  // Jan 27 markets (resolved/cancelled)
  {
    id: 'market-12',
    contractMarketId: 12,
    question: '🎲 Will BTC price last digit be EVEN (0,2,4,6,8) at resolution?',
    description: 'Resolved YES',
    thumbnail: '🎲',
    category: 'crypto',
    endTime: new Date('2026-01-27T00:30:15.000Z'),
    yesPool: 0,
    noPool: 0,
    status: 'resolved',
    result: 'YES',
  },
  {
    id: 'market-13',
    contractMarketId: 13,
    question: '₿ Will BTC price be above $88,000 at resolution time?',
    description: 'Cancelled - Refund',
    thumbnail: '₿',
    category: 'crypto',
    endTime: new Date('2026-01-27T00:30:15.000Z'),
    yesPool: 0,
    noPool: 0,
    status: 'resolved',
  },
  {
    id: 'market-14',
    contractMarketId: 14,
    question: 'Ξ Will ETH price be above $2,900 at resolution time?',
    description: 'Cancelled - Refund',
    thumbnail: 'Ξ',
    category: 'crypto',
    endTime: new Date('2026-01-27T00:30:15.000Z'),
    yesPool: 0,
    noPool: 0,
    status: 'resolved',
  },
  {
    id: 'market-15',
    contractMarketId: 15,
    question: '₿ Will BTC price be above $85,000 at resolution time?',
    description: 'Cancelled - Refund',
    thumbnail: '₿',
    category: 'crypto',
    endTime: new Date('2026-01-27T00:30:15.000Z'),
    yesPool: 0,
    noPool: 0,
    status: 'resolved',
  },
  {
    id: 'market-16',
    contractMarketId: 16,
    question: '🚀 Will BTC price be above $90,000 at resolution time?',
    description: 'Cancelled - Refund',
    thumbnail: '🚀',
    category: 'crypto',
    endTime: new Date('2026-01-27T00:30:15.000Z'),
    yesPool: 0,
    noPool: 0,
    status: 'resolved',
  },
  {
    id: 'market-17',
    contractMarketId: 17,
    question: '🚀 Will ETH price be above $3,000 at resolution time?',
    description: 'Cancelled - Refund',
    thumbnail: '🚀',
    category: 'crypto',
    endTime: new Date('2026-01-27T00:30:15.000Z'),
    yesPool: 0,
    noPool: 0,
    status: 'resolved',
  },
  {
    id: 'market-18',
    contractMarketId: 18,
    question: '◎ Will SOL price be above $125 at resolution time?',
    description: 'Cancelled - Refund',
    thumbnail: '◎',
    category: 'crypto',
    endTime: new Date('2026-01-27T00:30:15.000Z'),
    yesPool: 0,
    noPool: 0,
    status: 'resolved',
  },
  {
    id: 'market-19',
    contractMarketId: 19,
    question: '◎ Will SOL price be above $115 at resolution time?',
    description: 'Cancelled - Refund',
    thumbnail: '◎',
    category: 'crypto',
    endTime: new Date('2026-01-27T00:30:15.000Z'),
    yesPool: 0,
    noPool: 0,
    status: 'resolved',
  },
  // Jan 30 markets (cancelled/resolved)
  {
    id: 'market-20',
    contractMarketId: 20,
    question: '₿ Will BTC price be above $90,000 at resolution time?',
    description: 'Cancelled - Refund',
    thumbnail: '₿',
    category: 'crypto',
    endTime: new Date('2026-01-30T14:16:35.000Z'),
    yesPool: 0,
    noPool: 0,
    status: 'resolved',
  },
  {
    id: 'market-21',
    contractMarketId: 21,
    question: '₿ Will BTC price be above $88,000 at resolution time?',
    description: 'Cancelled - Refund',
    thumbnail: '₿',
    category: 'crypto',
    endTime: new Date('2026-01-30T14:16:35.000Z'),
    yesPool: 0,
    noPool: 0,
    status: 'resolved',
  },
  {
    id: 'market-22',
    contractMarketId: 22,
    question: 'Ξ Will ETH price be above $3,000 at resolution time?',
    description: 'Cancelled - Refund',
    thumbnail: 'Ξ',
    category: 'crypto',
    endTime: new Date('2026-01-30T14:16:35.000Z'),
    yesPool: 0,
    noPool: 0,
    status: 'resolved',
  },
  {
    id: 'market-23',
    contractMarketId: 23,
    question: 'Ξ Will ETH price be above $2,900 at resolution time?',
    description: 'Cancelled - Refund',
    thumbnail: 'Ξ',
    category: 'crypto',
    endTime: new Date('2026-01-30T14:16:35.000Z'),
    yesPool: 0,
    noPool: 0,
    status: 'resolved',
  },
  {
    id: 'market-24',
    contractMarketId: 24,
    question: '◎ Will SOL price be above $125 at resolution time?',
    description: 'Cancelled - Refund',
    thumbnail: '◎',
    category: 'crypto',
    endTime: new Date('2026-01-30T14:16:35.000Z'),
    yesPool: 0,
    noPool: 0,
    status: 'resolved',
  },
  {
    id: 'market-25',
    contractMarketId: 25,
    question: '◎ Will SOL price be above $115 at resolution time?',
    description: 'Cancelled - Refund',
    thumbnail: '◎',
    category: 'crypto',
    endTime: new Date('2026-01-30T14:16:35.000Z'),
    yesPool: 0,
    noPool: 0,
    status: 'resolved',
  },
  {
    id: 'market-26',
    contractMarketId: 26,
    question: '🎲 Will BTC price last digit be EVEN (0,2,4,6,8) at resolution?',
    description: 'Cancelled - Refund',
    thumbnail: '🎲',
    category: 'crypto',
    endTime: new Date('2026-01-30T14:16:35.000Z'),
    yesPool: 0,
    noPool: 0,
    status: 'resolved',
  },
  {
    id: 'market-27',
    contractMarketId: 27,
    question: '🎲 Will BTC price last digit be ODD (1,3,5,7,9) at resolution?',
    description: 'Resolved YES',
    thumbnail: '🎲',
    category: 'crypto',
    endTime: new Date('2026-01-30T14:16:35.000Z'),
    yesPool: 0,
    noPool: 0,
    status: 'resolved',
    result: 'YES',
  },
];

// ACTIVE MARKETS - Current markets shown on main page
export const MOCK_MARKETS: Market[] = [
  // Political market - March 31
  {
    id: 'market-9',
    contractMarketId: 9,
    question: '🇺🇸 Will the US strike Iran by March 31, 2026?',
    description: '🏛️ Political - Semi-auto resolve with Tavily AI',
    thumbnail: '🇺🇸',
    category: 'politics',
    endTime: new Date('2026-03-31T23:59:59.000Z'),
    yesPool: 0,
    noPool: 0,
    status: 'active',
  },
  // Jan 31 markets
  {
    id: 'market-10',
    contractMarketId: 10,
    question: '₿ Will BTC price be above $95,000 at resolution time?',
    description: '✅ CoinGecko Oracle - Auto resolve',
    thumbnail: '₿',
    category: 'crypto',
    endTime: new Date('2026-01-31T23:59:59.000Z'),
    yesPool: 0,
    noPool: 0,
    status: 'active',
  },
  {
    id: 'market-11',
    contractMarketId: 11,
    question: 'Ξ Will ETH price be above $3,300 at resolution time?',
    description: '✅ CoinGecko Oracle - Auto resolve',
    thumbnail: 'Ξ',
    category: 'crypto',
    endTime: new Date('2026-01-31T23:59:59.000Z'),
    yesPool: 0,
    noPool: 0,
    status: 'active',
  },
];

// ALL MARKETS - Combined active + archived (for Portfolio)
export const ALL_MARKETS: Market[] = [...MOCK_MARKETS, ...ARCHIVED_MARKETS];

/**
 * Get market by ID (searches both active and archived)
 */
export function getMarketById(id: string): Market | undefined {
  return ALL_MARKETS.find(m => m.id === id);
}

/**
 * Get time remaining string
 */
export function getTimeRemaining(endTime: Date): string {
  const now = new Date();
  const diff = endTime.getTime() - now.getTime();
  
  if (diff <= 0) return 'Ended';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Calculate YES percentage
 */
export function getYesPercentage(market: Market): number {
  const total = market.yesPool + market.noPool;
  if (total === 0) return 50;
  return (market.yesPool / total) * 100;
}

/**
 * Format pool amount
 */
export function formatPoolAmount(amount: number): string {
  // For ETH amounts (small numbers), show with appropriate decimals
  if (amount < 1) {
    if (amount >= 0.001) return `${amount.toFixed(3)} ETH`;
    return `${amount.toFixed(4)} ETH`; // For very small amounts
  }
  if (amount >= 1) return `${amount.toFixed(2)} ETH`;
  return `${amount.toFixed(4)} ETH`;
}

/**
 * Get category color classes
 */
export function getCategoryColor(category: Market['category']): string {
  const colors = {
    crypto: 'bg-orange-100 text-orange-700 border-orange-300',
    tech: 'bg-blue-100 text-blue-700 border-blue-300',
    memes: 'bg-pink-100 text-pink-700 border-pink-300',
    politics: 'bg-purple-100 text-purple-700 border-purple-300',
    sports: 'bg-green-100 text-green-700 border-green-300',
  };
  return colors[category] || colors.crypto;
}
