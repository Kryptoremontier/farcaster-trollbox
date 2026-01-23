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

export const MOCK_MARKETS: Market[] = [
  {
    id: 'peter-schiff-btc',
    contractMarketId: 0,
    question: 'Will Peter Schiff tweet negatively about Bitcoin in the next 24 hours?',
    description: 'Peter literally cannot go 24hrs without BTC FUD',
    thumbnail: '🧓💬',
    category: 'crypto',
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    yesPool: 65000,
    noPool: 35000,
    totalBettors: 1247,
    status: 'active',
  },
  {
    id: 'degen-price',
    contractMarketId: 1,
    question: 'Will $DEGEN hit $0.10 this week?',
    description: 'Degens betting on Degen. Meta af.',
    thumbnail: '🎩📈',
    category: 'crypto',
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    yesPool: 42000,
    noPool: 58000,
    totalBettors: 892,
    status: 'active',
  },
  {
    id: 'elon-pepe',
    contractMarketId: 2,
    question: 'Will Elon Musk post a Pepe meme today?',
    description: 'The ultimate troll moves are unpredictable',
    thumbnail: '🐸🚀',
    category: 'memes',
    endTime: new Date(Date.now() + 18 * 60 * 60 * 1000),
    yesPool: 38000,
    noPool: 27000,
    totalBettors: 654,
    status: 'active',
  },
  {
    id: 'base-tvl',
    contractMarketId: 4,
    question: 'Will Base TVL exceed $2B this month?',
    description: 'Onchain summer vibes or bearish reality?',
    thumbnail: '🔵💎',
    category: 'crypto',
    endTime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    yesPool: 51000,
    noPool: 49000,
    totalBettors: 1103,
    status: 'active',
  },
  {
    id: 'vitalik-tweet',
    contractMarketId: 5,
    question: 'Will Vitalik tweet about AI this week?',
    description: 'He loves AI more than you love your portfolio',
    thumbnail: '🧙‍♂️🤖',
    category: 'tech',
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    yesPool: 29000,
    noPool: 21000,
    totalBettors: 445,
    status: 'active',
  },
  {
    id: 'eth-flip-btc',
    contractMarketId: 3,
    question: 'Will ETH flip BTC market cap in 2025?',
    description: 'The ultimate flippening debate',
    thumbnail: '💎⚡',
    category: 'crypto',
    endTime: new Date('2025-12-31'),
    yesPool: 125000,
    noPool: 98000,
    totalBettors: 3421,
    status: 'active',
  },
  {
    id: 'farcaster-users',
    question: 'Will Farcaster hit 500K users this quarter?',
    description: 'Bullish on decentralized social or nah?',
    thumbnail: '🟣👥',
    category: 'tech',
    endTime: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    yesPool: 73000,
    noPool: 44000,
    totalBettors: 1521,
    status: 'active',
  },
  {
    id: 'nft-floor',
    question: 'Will any Pudgy Penguin sell for >100 ETH this month?',
    description: 'Penguins going parabolic or staying chill?',
    thumbnail: '🐧💰',
    category: 'crypto',
    endTime: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    yesPool: 18000,
    noPool: 32000,
    totalBettors: 287,
    status: 'active',
  },
  {
    id: 'eth-merge-anniversary',
    question: 'Will ETH be above $3000 on Merge anniversary?',
    description: 'One year later, are we still bullish?',
    thumbnail: '💎📅',
    category: 'crypto',
    endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    yesPool: 87000,
    noPool: 63000,
    totalBettors: 1876,
    status: 'active',
  },
  {
    id: 'coinbase-listing',
    question: 'Will Coinbase list $DEGEN token this year?',
    description: 'The ultimate degen dream scenario',
    thumbnail: '🎩🏛️',
    category: 'crypto',
    endTime: new Date('2026-12-31'),
    yesPool: 95000,
    noPool: 105000,
    totalBettors: 2341,
    status: 'active',
  },
  {
    id: 'trump-crypto',
    question: 'Will Trump mention crypto in next debate?',
    description: 'Politics meets decentralization',
    thumbnail: '🗳️₿',
    category: 'politics',
    endTime: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    yesPool: 61000,
    noPool: 54000,
    totalBettors: 1432,
    status: 'active',
  },
  {
    id: 'superbowl-crypto-ad',
    question: 'Will there be a crypto ad during Super Bowl?',
    description: 'Are we back to 2021 vibes?',
    thumbnail: '🏈📺',
    category: 'sports',
    endTime: new Date('2027-02-07'),
    yesPool: 44000,
    noPool: 36000,
    totalBettors: 678,
    status: 'active',
  },
  {
    id: 'sec-eth-etf',
    question: 'Will SEC approve spot ETH ETF this quarter?',
    description: 'Regulatory hopium or copium?',
    thumbnail: '⚖️💎',
    category: 'crypto',
    endTime: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
    yesPool: 112000,
    noPool: 88000,
    totalBettors: 2654,
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
 * Calculate time remaining in human-readable format
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
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
  return amount.toString();
}

/**
 * Get category color
 */
export function getCategoryColor(category: Market['category']): string {
  const colors = {
    crypto: 'bg-purple-100 text-purple-700 border-purple-200',
    tech: 'bg-blue-100 text-blue-700 border-blue-200',
    memes: 'bg-green-100 text-green-700 border-green-200',
    politics: 'bg-red-100 text-red-700 border-red-200',
    sports: 'bg-orange-100 text-orange-700 border-orange-200',
  };
  return colors[category];
}
