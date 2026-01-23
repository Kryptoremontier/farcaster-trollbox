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
  totalBettors: number;
  status: 'active' | 'resolved' | 'upcoming';
  result?: 'YES' | 'NO';
}

// ⚠️ CRITICAL: When deploying new markets to contract:
// 1. REMOVE all old/ended markets from this array
// 2. Add ONLY the newly deployed markets
// 3. Use FIXED endTime matching the contract deployment (NOT Date.now()!)
// 4. Match contractMarketId with actual on-chain IDs
// 5. Get the exact endTime from the contract or deployment script output

// ⚠️ MAINNET MARKET - BASE MAINNET
// Contract: 0x52ABabe88DE8799B374b11B91EC1b32989779e55
// Deployed: 2026-01-23 21:53:32 UTC (Market #4)

export const MOCK_MARKETS: Market[] = [
  {
    id: 'market-4',
    contractMarketId: 4,
    question: '🎲 Will BTC price end with digit 5 in next 30min?',
    description: '✅ MAINNET LAUNCH - CoinGecko Oracle',
    thumbnail: '🎲',
    category: 'crypto',
    endTime: new Date('2026-01-23T21:23:32.000Z'), // FIXED timestamp - Ends 22:23:32 CET
    yesPool: 0, 
    noPool: 0, 
    totalBettors: 0, 
    status: 'active',
  },
];

/**
 * Get market by ID
 */
export function getMarketById(id: string): Market | undefined {
  return MOCK_MARKETS.find(m => m.id === id);
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
