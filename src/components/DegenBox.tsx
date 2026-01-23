"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import sdk from "@farcaster/miniapp-sdk"
import { Wallet, Trophy, Clock, Users, TrendingUp, ChevronUp, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "~/components/ui/button-component"
import { Card } from "~/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Badge } from "~/components/ui/badge"
import { Input } from "~/components/ui/input"
import { cn } from "~/lib/utils"
import { useAccount, useConnect, useDisconnect } from "wagmi"
import { config } from "~/components/providers/WagmiProvider"
import { getMarketById } from "~/lib/mockMarkets"
import { ArrowLeft } from "lucide-react"
import { 
  usePlaceBetETH, 
  useClaimWinningsETH, 
  useMarketDataETH, 
  useUserBetETH, 
  useTransactionStatusETH,
  useETHBalance
} from "~/hooks/useTrollBetETH"
import type { Address } from "viem"

interface FarcasterUser {
  fid: number
  username?: string
  displayName?: string
  pfpUrl?: string
}

interface FarcasterContext {
  user?: FarcasterUser
  client?: {
    safeAreaInsets?: {
      top: number
      bottom: number
      left: number
      right: number
    }
  }
}

interface ChatMessage {
  id: string
  user: {
    name: string
    avatar: string
    bet: "YES" | "NO" | null
  }
  message: string
  timestamp: Date
}

interface LeaderboardEntry {
  rank: number
  user: {
    name: string
    avatar: string
  }
  wins: number
  accuracy: number
  earnings: number
}

// Helper to generate avatar URL (DiceBear API for unique avatars)
const getAvatarUrl = (name: string) => 
  `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}&backgroundColor=9E75FF`;

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    user: { name: "CryptoMaxi", avatar: getAvatarUrl("CryptoMaxi"), bet: "YES" },
    message: "Peter literally cannot go 24hrs without tweeting about BTC lmao",
    timestamp: new Date(Date.now() - 120000),
  },
  {
    id: "2",
    user: { name: "DiamondHands", avatar: getAvatarUrl("DiamondHands"), bet: "NO" },
    message: "Nah he's been quiet lately, gonna surprise everyone",
    timestamp: new Date(Date.now() - 90000),
  },
  {
    id: "3",
    user: { name: "DegenKing", avatar: getAvatarUrl("DegenKing"), bet: "YES" },
    message: "Easy money, Peter tweets gold FUD every single day",
    timestamp: new Date(Date.now() - 60000),
  },
  {
    id: "4",
    user: { name: "MoonBoi", avatar: getAvatarUrl("MoonBoi"), bet: "YES" },
    message: "BTC pumping = Peter seething. It's guaranteed",
    timestamp: new Date(Date.now() - 30000),
  },
  {
    id: "5",
    user: { name: "GoldBug42", avatar: getAvatarUrl("GoldBug42"), bet: "NO" },
    message: "He just tweeted about gold, might skip BTC today",
    timestamp: new Date(Date.now() - 15000),
  },
]

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, user: { name: "OracleOfDegen", avatar: getAvatarUrl("OracleOfDegen") }, wins: 47, accuracy: 89, earnings: 125000 },
  { rank: 2, user: { name: "ProphetPepe", avatar: getAvatarUrl("ProphetPepe") }, wins: 42, accuracy: 85, earnings: 98000 },
  { rank: 3, user: { name: "BasedBettor", avatar: getAvatarUrl("BasedBettor") }, wins: 38, accuracy: 82, earnings: 76000 },
  { rank: 4, user: { name: "AlphaChad", avatar: getAvatarUrl("AlphaChad") }, wins: 35, accuracy: 79, earnings: 54000 },
  { rank: 5, user: { name: "DegenerateDAO", avatar: getAvatarUrl("DegenerateDAO") }, wins: 31, accuracy: 76, earnings: 42000 },
]

interface DegenBoxProps {
  marketId: string;
  onBack: () => void;
}

export function DegenBox({ marketId, onBack }: DegenBoxProps) {
  const market = getMarketById(marketId);
  const { address, isConnected, chain } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  
  // Check if we're on the correct network (Base Sepolia)
  const isCorrectNetwork = chain?.id === 84532;
  
  // ETH amounts (much smaller than token amounts!)
  const [selectedAmount, setSelectedAmount] = useState("0.001")
  const [activeTab, setActiveTab] = useState<"chat" | "leaderboard">("chat")
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES)
  const [newMessage, setNewMessage] = useState("")
  const [timeRemaining, setTimeRemaining] = useState({ hours: 18, minutes: 42, seconds: 33 })
  const chatRef = useRef<HTMLDivElement>(null)
  
  // Farcaster SDK state
  const [context, setContext] = useState<FarcasterContext | undefined>(undefined)
  const [isSDKLoaded, setIsSDKLoaded] = useState(false)

  // Contract hooks - get contract market ID from market data
  const marketIdNum = market?.contractMarketId ?? 0;
  const { marketData, refetch: refetchMarket } = useMarketDataETH(marketIdNum)
  const { userBet, refetch: refetchUserBet } = useUserBetETH(marketIdNum, address as Address | undefined)
  
  // ETH Balance hook - NO token approval needed! 🎉
  const { balance: ethBalance, refetch: refetchBalance } = useETHBalance(address as Address | undefined)
  
  // Transaction hooks - NO approve hook needed!
  const { placeBet, hash: betHash, isPending: isBetPending } = usePlaceBetETH()
  const { claimWinnings, hash: claimHash, isPending: isClaimPending } = useClaimWinningsETH()
  
  // Transaction status tracking - NO approve tracking needed!
  const { isConfirming: isBetConfirming, isConfirmed: isBetConfirmed } = useTransactionStatusETH(betHash)
  const { isConfirming: isClaimConfirming, isConfirmed: isClaimConfirmed } = useTransactionStatusETH(claimHash)
  
  // UI state - NO approval state needed!
  const [betStatus, setBetStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null)
  const [selectedSide, setSelectedSide] = useState<'YES' | 'NO' | null>(null)

  // Load Farcaster context and auto-connect wallet
  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      setContext(context);
      
      // Auto-connect wallet if in Farcaster context and not already connected
      if (context && !isConnected) {
        console.log('[TrollBox] Auto-connecting wallet...');
        try {
          connect({ connector: config.connectors[0] });
        } catch (e) {
          console.error('[TrollBox] Auto-connect failed:', e);
        }
      }
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded, isConnected, connect]);

  // Refetch market data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refetchMarket();
      if (address) {
        refetchUserBet();
      }
    }, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [refetchMarket, refetchUserBet, address]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        }
        return prev
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Simulate live chat
  useEffect(() => {
    const newMessages = [
      "This is too easy, Peter never misses",
      "All in on YES, let's gooo",
      "NO gang rise up!",
      "Imagine betting against Peter tweeting",
      "He's probably typing right now lol",
    ]
    
    const interval = setInterval(() => {
      const randomMessage = newMessages[Math.floor(Math.random() * newMessages.length)]
      const newMsg: ChatMessage = {
        id: Date.now().toString(),
        user: {
          name: `Degen${Math.floor(Math.random() * 1000)}`,
          avatar: getAvatarUrl(`Degen${Math.floor(Math.random() * 1000)}`),
          bet: Math.random() > 0.4 ? "YES" : "NO",
        },
        message: randomMessage,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev.slice(-20), newMsg])
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages])

  // Handle bet confirmation
  useEffect(() => {
    if (isBetConfirmed && address && selectedSide) {
      setBetStatus({
        type: 'success',
        message: `Bet placed successfully! 🎉`
      });
      refetchMarket();
      refetchUserBet();
      refetchBalance();
      
      // Record bet and update points
      const recordBetAsync = async () => {
        if (!market) return;
        
        try {
          const response = await fetch('/api/record-bet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address: address,
              marketId: market.contractMarketId ?? 0,
              amount: selectedAmount,
              side: selectedSide === 'YES',
              fid: context?.user?.fid,
              username: context?.user?.username,
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Points recorded:', data.points);
          } else {
            console.error('❌ Failed to record points');
          }
        } catch (error) {
          console.error('❌ Error recording bet:', error);
        }
      };
      
      recordBetAsync();
      
      // Add message to chat
      const betMessage: ChatMessage = {
        id: Date.now().toString(),
        user: { 
          name: context?.user?.displayName || context?.user?.username || "You", 
          avatar: context?.user?.pfpUrl || getAvatarUrl("You"), 
          bet: selectedSide 
        },
        message: `Bet ${selectedAmount} ETH on ${selectedSide}! 🎲`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, betMessage]);
      
      setSelectedSide(null);
      setTimeout(() => setBetStatus(null), 5000);
    }
  }, [isBetConfirmed, selectedSide, selectedAmount, context, address, market, refetchMarket, refetchUserBet, refetchBalance]);

  // Handle claim confirmation
  useEffect(() => {
    if (isClaimConfirmed) {
      setBetStatus({
        type: 'success',
        message: `Winnings claimed successfully! 💰`
      });
      refetchMarket();
      refetchUserBet();
      setTimeout(() => setBetStatus(null), 5000);
    }
  }, [isClaimConfirmed, refetchMarket, refetchUserBet]);

  // NOTE: No approval needed with Native ETH! 🎉
  // NOTE: No mint/faucet needed - users bring their own ETH!

  const handleSendMessage = () => {
    if (!newMessage.trim()) return
    const msg: ChatMessage = {
      id: Date.now().toString(),
      user: { name: "You", avatar: getAvatarUrl("You"), bet: null },
      message: newMessage,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, msg])
    setNewMessage("")
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  const handleConnect = useCallback(() => {
    connect({ connector: config.connectors[0] })
  }, [connect])

  // NOTE: No pendingBetSide state needed - direct ETH betting! 🎉

  // Simplified handlePlaceBet - NO APPROVAL NEEDED with Native ETH! 🎉
  const handlePlaceBet = useCallback(async (side: 'YES' | 'NO') => {
    console.log('[TrollBoxETH] handlePlaceBet called', { side, isConnected, address, selectedAmount });
    
    if (!isConnected) {
      console.log('[TrollBoxETH] Not connected, connecting wallet...');
      setBetStatus({ type: 'info', message: 'Connecting wallet...' });
      try {
        connect({ connector: config.connectors[0] });
        setTimeout(() => setBetStatus(null), 2000);
      } catch (e) {
        console.error('[TrollBoxETH] Connect error:', e);
        setBetStatus({ type: 'error', message: 'Please connect your wallet first' });
        setTimeout(() => setBetStatus(null), 3000);
      }
      return;
    }

    // Check if user has enough ETH
    const betAmountNum = parseFloat(selectedAmount);
    const balanceNum = parseFloat(ethBalance);
    if (betAmountNum > balanceNum) {
      setBetStatus({ type: 'error', message: `❌ Insufficient balance. You have ${balanceNum.toFixed(4)} ETH` });
      setTimeout(() => setBetStatus(null), 5000);
      return;
    }

    try {
      setSelectedSide(side);
      
      // Direct ETH bet - NO approval step needed!
      console.log('[TrollBoxETH] Placing bet with ETH...', { marketIdNum, side, selectedAmount });
      setBetStatus({ type: 'info', message: `⚠️ CONFIRM ${selectedAmount} ETH bet in your wallet` });
      
      placeBet(marketIdNum, side === 'YES', selectedAmount);
      console.log('[TrollBoxETH] Bet transaction sent');
      
    } catch (error) {
      console.error('[TrollBoxETH] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to place bet';
      setBetStatus({ 
        type: 'error', 
        message: errorMessage.includes('rejected') ? '❌ Transaction rejected by user' : `❌ ${errorMessage}`
      });
      setSelectedSide(null);
      setTimeout(() => setBetStatus(null), 5000);
    }
  }, [placeBet, marketIdNum, selectedAmount, isConnected, address, connect, ethBalance]);

  const handleClaimWinnings = useCallback(async () => {
    if (!isConnected) {
      setBetStatus({ type: 'error', message: 'Please connect your wallet first' });
      setTimeout(() => setBetStatus(null), 3000);
      return;
    }

    try {
      setBetStatus({ type: 'info', message: 'Claiming winnings...' });
      await claimWinnings(marketIdNum);
    } catch (error) {
      console.error('Claim error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to claim winnings';
      setBetStatus({ 
        type: 'error', 
        message: errorMessage
      });
      setTimeout(() => setBetStatus(null), 3000);
    }
  }, [claimWinnings, marketIdNum, isConnected]);

  // Calculate current values from market data
  const totalPool = marketData 
    ? parseFloat(marketData.yesPool) + parseFloat(marketData.noPool)
    : 0;
  
  const yesPercentage = totalPool > 0 
    ? (parseFloat(marketData?.yesPool || "0") / totalPool) * 100 
    : 50;
  
  const yesOdds = totalPool > 0 && parseFloat(marketData?.yesPool || "0") > 0
    ? totalPool / parseFloat(marketData?.yesPool || "1")
    : 2.0;
  
  const noOdds = totalPool > 0 && parseFloat(marketData?.noPool || "0") > 0
    ? totalPool / parseFloat(marketData?.noPool || "1")
    : 2.0;

  if (!isSDKLoaded) {
    return <div className="flex items-center justify-center h-screen">Loading SDK...</div>
  }

  return (
    <div 
      className="flex flex-col h-screen max-h-screen bg-[#F5F5F5] overflow-hidden"
      style={{
        paddingTop: context?.client?.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client?.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client?.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client?.safeAreaInsets?.right ?? 0,
      }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>

          {/* Market Info */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9E75FF] to-[#7E55DF] flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-lg">{market?.thumbnail || "🎲"}</span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-sm text-gray-900 block truncate">TrollBox</span>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[9px] px-1 py-0",
                  context 
                    ? "border-[#9E75FF]/30 bg-[#9E75FF]/5 text-[#9E75FF]" 
                    : "border-gray-300 bg-gray-50 text-gray-500"
                )}
              >
                {context ? "Farcaster" : "Browser"}
              </Badge>
            </div>
          </div>
        </div>
        
        {context?.user ? (
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-900 leading-tight">
                {context.user.displayName || context.user.username}
              </p>
              <p className="text-[10px] text-gray-500 leading-tight">
                @{context.user.username}
              </p>
            </div>
            <Avatar className="w-8 h-8 border-2 border-[#7C65C1]/20">
              {context.user.pfpUrl ? (
                <AvatarImage src={context.user.pfpUrl} alt={context.user.displayName || "User"} />
              ) : null}
              <AvatarFallback className="bg-[#7C65C1]/10 text-[#7C65C1] text-xs font-semibold">
                {(context.user.displayName || context.user.username || "U").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        ) : (
          <Button
            variant={isConnected ? "outline" : "default"}
            size="sm"
            onClick={() => isConnected ? disconnect() : handleConnect()}
            className={cn(
              "gap-2 font-medium",
              isConnected 
                ? "bg-white border-green-500 text-green-500 hover:bg-green-50" 
                : "bg-[#9E75FF] hover:bg-[#8E65EF] text-white shadow-sm"
            )}
          >
            <Wallet className="w-4 h-4" />
            {isConnected ? (address ? `${address.slice(0, 5)}...${address.slice(-3)}` : "Connected") : "Connect"}
          </Button>
        )}
      </header>

      {/* Live Status Badge */}
      <div className="px-4 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs font-medium text-gray-500">
            LIVE: <span className="text-gray-900 font-semibold">{market?.category.toUpperCase()}</span>
          </span>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Hero Section - The Market */}
        <div className="p-4">
          <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
            {/* Market Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <Badge className="bg-[#9E75FF]/10 text-[#9E75FF] border-[#9E75FF]/20 text-xs font-semibold">
                  {market?.category || "Prediction Market"}
                </Badge>
                <div className="flex items-center gap-1 text-gray-500">
                  <Users className="w-3 h-3" />
                  <span className="text-xs">{market?.totalBettors.toLocaleString() || "0"} bettors</span>
                </div>
              </div>
              <h2 className="text-base font-semibold text-gray-900 leading-tight text-pretty">
                {market?.question || "Loading market..."}
              </h2>
              {market?.description && (
                <p className="text-xs text-gray-500 mt-2">{market.description}</p>
              )}
            </div>

            {/* Countdown & Stats */}
            <div className="p-4 bg-gray-50/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#7C65C1]" />
                  <span className="text-sm text-gray-500">Time Left</span>
                </div>
                <div className="font-mono text-lg font-bold text-gray-900">
                  {String(timeRemaining.hours).padStart(2, "0")}:
                  {String(timeRemaining.minutes).padStart(2, "0")}:
                  {String(timeRemaining.seconds).padStart(2, "0")}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-green-600">YES {yesPercentage.toFixed(0)}%</span>
                  <span className="text-red-600">NO {(100 - yesPercentage).toFixed(0)}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    className="h-full bg-green-500 transition-all duration-500 ease-out"
                    style={{ width: `${yesPercentage}%` }}
                  />
                  <div
                    className="h-full bg-red-500 transition-all duration-500 ease-out"
                    style={{ width: `${100 - yesPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{parseFloat(marketData?.yesPool || "0").toFixed(4)} ETH</span>
                  <span>{parseFloat(marketData?.noPool || "0").toFixed(4)} ETH</span>
                </div>
              </div>
            </div>

            {/* Betting Interface */}
            <div className="p-4 space-y-4 bg-white">
              {/* Transaction Status Toast */}
              {betStatus && (
                <div className={cn(
                  "p-3 rounded-lg text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2",
                  betStatus.type === 'success' 
                    ? "bg-green-50 text-green-700 border border-green-200" 
                    : betStatus.type === 'error'
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                )}>
                  {betStatus.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                  {betStatus.type === 'error' && <AlertCircle className="w-4 h-4" />}
                  {betStatus.type === 'info' && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{betStatus.message}</span>
                </div>
              )}

              {/* Transaction Pending States */}
              {(isBetPending || isBetConfirming) && (
                <div className="p-3 rounded-lg text-sm font-medium flex items-center gap-2 bg-yellow-50 text-yellow-700 border border-yellow-200">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {isBetPending ? 'Waiting for signature in Warpcast...' : 'Confirming transaction on chain...'}
                  </span>
                </div>
              )}

              {(isClaimPending || isClaimConfirming) && (
                <div className="p-3 rounded-lg text-sm font-medium flex items-center gap-2 bg-yellow-50 text-yellow-700 border border-yellow-200">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {isClaimPending ? 'Waiting for signature in Warpcast...' : 'Claiming winnings...'}
                  </span>
                </div>
              )}

              {/* NOTE: No approval status needed with Native ETH! 🎉 */}

              {/* Claim Button */}
              {marketData?.resolved && userBet && !userBet.claimed && (
                <Button
                  onClick={handleClaimWinnings}
                  disabled={isClaimPending || isClaimConfirming}
                  className="w-full h-12 bg-yellow-500 hover:bg-yellow-600 text-white font-bold shadow-md active:scale-95 transition-transform"
                >
                  {isClaimPending || isClaimConfirming ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Claiming...
                    </>
                  ) : (
                    <>
                      <Trophy className="w-4 h-4 mr-2" />
                      Claim Winnings
                    </>
                  )}
                </Button>
              )}

              {/* Auto-approve info */}
              {needsApproval && isConnected && (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700 text-center">
                    ℹ️ First bet will auto-approve tokens (2 transactions)
                  </p>
                </div>
              )}

              {/* Bet Buttons with Odds */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handlePlaceBet('YES')}
                  disabled={isBetPending || isBetConfirming || !isConnected || parseFloat(selectedAmount) <= 0}
                  className="h-16 bg-green-500 hover:bg-green-600 text-white font-bold text-base shadow-md active:scale-95 transition-transform flex flex-col items-center justify-center gap-1"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>YES</span>
                  </div>
                  <span className="text-xs font-normal opacity-90">{yesOdds.toFixed(2)}x odds</span>
                </Button>
                <Button
                  onClick={() => handlePlaceBet('NO')}
                  disabled={isBetPending || isBetConfirming || !isConnected || parseFloat(selectedAmount) <= 0}
                  className="h-16 bg-red-500 hover:bg-red-600 text-white font-bold text-base shadow-md active:scale-95 transition-transform flex flex-col items-center justify-center gap-1"
                >
                  <div className="flex items-center gap-2">
                    <ChevronUp className="w-5 h-5 rotate-180" />
                    <span>NO</span>
                  </div>
                  <span className="text-xs font-normal opacity-90">{noOdds.toFixed(2)}x odds</span>
                </Button>
              </div>

              {/* Wallet Balance */}
              <div className="p-3 bg-gradient-to-br from-green-500/5 to-green-500/10 rounded-lg border border-green-500/20">
                {/* Network Warning */}
                {isConnected && !isCorrectNetwork && (
                  <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-center">
                    <p className="text-xs text-yellow-800 font-bold">⚠️ Wrong Network!</p>
                    <p className="text-xs text-yellow-700">Switch to Base Sepolia</p>
                    <p className="text-xs text-yellow-600">(Current: {chain?.name})</p>
                  </div>
                )}
                
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-600 font-medium">💰 ETH Balance</span>
                  <span className="text-lg font-bold text-green-600 font-mono">
                    {isConnected ? parseFloat(ethBalance).toFixed(4) : '0'} ETH
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Your Bets: {userBet ? (parseFloat(userBet.yesAmount) + parseFloat(userBet.noAmount)).toFixed(4) : '0'} ETH</span>
                  <span className="text-green-600">Available: {isConnected ? parseFloat(ethBalance).toFixed(4) : '0'} ETH</span>
                </div>
                {/* Get ETH from faucet */}
                {parseFloat(ethBalance) < 0.001 && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-center">
                    <p className="text-xs text-yellow-800">💡 Need testnet ETH?</p>
                    <a 
                      href="https://www.alchemy.com/faucets/base-sepolia" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 underline hover:text-blue-800"
                    >
                      Get free Base Sepolia ETH →
                    </a>
                  </div>
                )}
              </div>

              {/* Amount Selection */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-medium">Bet Amount</span>
                  <span className="text-xs text-gray-400">Amount in ETH</span>
                </div>
                
                {/* Custom Input with MAX button */}
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={selectedAmount}
                    onChange={(e) => setSelectedAmount(e.target.value)}
                    placeholder="0.01"
                    className="flex-1 font-mono text-base"
                    min="0"
                    step="0.001"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAmount(ethBalance)}
                    disabled={!isConnected || parseFloat(ethBalance) === 0}
                    className="px-4 font-bold text-green-600 border-green-500 hover:bg-green-50"
                  >
                    MAX
                  </Button>
                </div>

                {/* Quick Select Buttons - ETH amounts */}
                <div className="flex gap-2">
                  {["0.001", "0.005", "0.01", "0.05"].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAmount(amount)}
                      disabled={false}
                      className={cn(
                        "flex-1 font-mono font-medium transition-all text-xs",
                        selectedAmount === amount
                          ? "bg-white border-[#9E75FF] text-[#9E75FF] border-2 shadow-sm"
                          : "bg-white border-gray-200 text-gray-500 hover:text-[#9E75FF] hover:border-[#9E75FF]/50"
                      )}
                    >
                      {amount}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 pb-2">
          <div className="flex gap-1 p-1 bg-white rounded-xl shadow-sm border border-gray-200">
            <button
              onClick={() => setActiveTab("chat")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
                activeTab === "chat"
                  ? "bg-[#9E75FF] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15c-.83 0-1.5-.67-1.5-1.5S9.17 14 10 14s1.5.67 1.5 1.5S10.83 17 10 17zm4 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-6.5-5c0-.28.22-.5.5-.5h8c.28 0 .5.22.5.5s-.22.5-.5.5H6c-.28 0-.5-.22-.5-.5zM7 8.5C7 7.67 7.67 7 8.5 7S10 7.67 10 8.5 9.33 10 8.5 10 7 9.33 7 8.5zm7 0c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5z"/>
                <path d="M6.5 6C7.33 6 8 5.33 8 4.5S7.33 3 6.5 3 5 3.67 5 4.5 5.67 6 6.5 6zm11 0c.83 0 1.5-.67 1.5-1.5S18.33 3 17.5 3 16 3.67 16 4.5s.67 1.5 1.5 1.5z"/>
              </svg>
              TrollBox
            </button>
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
                activeTab === "leaderboard"
                  ? "bg-[#9E75FF] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <Trophy className="w-4 h-4" />
              Top Prophets
            </button>
          </div>
        </div>

        {/* Chat / Leaderboard Content */}
        <div className="px-4 pb-4">
          {activeTab === "chat" ? (
            <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
              {/* Chat Messages */}
              <div
                ref={chatRef}
                className="h-64 overflow-y-auto p-3 space-y-1 scroll-smooth"
              >
                {messages.map((msg) => (
                  <div key={msg.id} className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <Avatar className="w-8 h-8 flex-shrink-0 shadow-sm">
                      <AvatarImage src={msg.user.avatar} />
                      <AvatarFallback className="bg-[#7C65C1]/10 text-[#7C65C1] text-xs font-semibold">
                        {msg.user.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {msg.user.name}
                        </span>
                        {msg.user.bet && (
                          <Badge
                            className={cn(
                              "text-[10px] px-1.5 py-0 font-semibold",
                              msg.user.bet === "YES"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : "bg-red-100 text-red-700 border-red-200"
                            )}
                          >
                            {msg.user.bet}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-gray-100 bg-gray-50/30">
                <div className="flex gap-2">
                  <Input
                    placeholder="Send a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#7C65C1]"
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    className="bg-[#7C65C1] hover:bg-[#6952A3] text-white shrink-0 shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
              <div className="p-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Top Prophets</h3>
                <p className="text-xs text-gray-500">Best predictors this season</p>
              </div>
              <div className="divide-y divide-gray-100">
                {MOCK_LEADERBOARD.map((entry) => (
                  <div
                    key={entry.rank}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm",
                        entry.rank === 1 && "bg-amber-100 text-amber-600",
                        entry.rank === 2 && "bg-gray-100 text-gray-500",
                        entry.rank === 3 && "bg-orange-100 text-orange-600",
                        entry.rank > 3 && "bg-gray-50 text-gray-400"
                      )}
                    >
                      {entry.rank}
                    </div>
                    <Avatar className="w-8 h-8 shadow-sm">
                      <AvatarImage src={entry.user.avatar} />
                      <AvatarFallback className="bg-[#7C65C1]/10 text-[#7C65C1] text-xs font-semibold">
                        {entry.user.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-gray-900 truncate block">
                        {entry.user.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {entry.wins} wins • {entry.accuracy}% accuracy
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-green-600">
                        +{formatNumber(entry.earnings)}
                      </span>
                      <span className="text-xs text-gray-500 block">ETH</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Bottom Safe Area */}
      <div className="h-4 bg-gray-50" />
    </div>
  )
}

export default DegenBox;
