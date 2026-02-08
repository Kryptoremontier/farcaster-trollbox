"use client"

import { useState, useEffect, useRef } from "react"
import { sdk } from "@farcaster/frame-sdk"
import { Wallet, Zap, Trophy, Clock, Users, TrendingUp, ChevronUp, Send, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

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

interface FarcasterUser {
  fid: number
  username?: string
  displayName?: string
  pfpUrl?: string
}

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    user: { name: "CryptoMaxi", avatar: "/avatars/1.png", bet: "YES" },
    message: "Peter literally cannot go 24hrs without tweeting about BTC lmao",
    timestamp: new Date(Date.now() - 120000),
  },
  {
    id: "2",
    user: { name: "DiamondHands", avatar: "/avatars/2.png", bet: "NO" },
    message: "Nah he's been quiet lately, gonna surprise everyone",
    timestamp: new Date(Date.now() - 90000),
  },
  {
    id: "3",
    user: { name: "DegenKing", avatar: "/avatars/3.png", bet: "YES" },
    message: "Easy money, Peter tweets gold FUD every single day",
    timestamp: new Date(Date.now() - 60000),
  },
  {
    id: "4",
    user: { name: "MoonBoi", avatar: "/avatars/4.png", bet: "YES" },
    message: "BTC pumping = Peter seething. It's guaranteed",
    timestamp: new Date(Date.now() - 30000),
  },
  {
    id: "5",
    user: { name: "GoldBug42", avatar: "/avatars/5.png", bet: "NO" },
    message: "He just tweeted about gold, might skip BTC today",
    timestamp: new Date(Date.now() - 15000),
  },
]

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, user: { name: "OracleOfDegen", avatar: "/avatars/6.png" }, wins: 47, accuracy: 89, earnings: 125000 },
  { rank: 2, user: { name: "ProphetPepe", avatar: "/avatars/7.png" }, wins: 42, accuracy: 85, earnings: 98000 },
  { rank: 3, user: { name: "BasedBettor", avatar: "/avatars/8.png" }, wins: 38, accuracy: 82, earnings: 76000 },
  { rank: 4, user: { name: "AlphaChad", avatar: "/avatars/9.png" }, wins: 35, accuracy: 79, earnings: 54000 },
  { rank: 5, user: { name: "DegenerateDAO", avatar: "/avatars/10.png" }, wins: 31, accuracy: 76, earnings: 42000 },
]

export function DegenBox() {
  const [isConnected, setIsConnected] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState(100)
  const [activeTab, setActiveTab] = useState<"chat" | "leaderboard">("chat")
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES)
  const [newMessage, setNewMessage] = useState("")
  const [timeRemaining, setTimeRemaining] = useState({ hours: 18, minutes: 42, seconds: 33 })
  const [yesPercentage, setYesPercentage] = useState(65)
  const chatRef = useRef<HTMLDivElement>(null)
  
  // Farcaster SDK state
  const [isInFarcaster, setIsInFarcaster] = useState(false)
  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null)
  const [sdkReady, setSdkReady] = useState(false)

  // Initialize Farcaster SDK
  useEffect(() => {
    const initFarcaster = async () => {
      try {
        // Check if we're running inside a Farcaster client
        const inMiniApp = await sdk.isInMiniApp()
        setIsInFarcaster(inMiniApp)
        
        if (inMiniApp) {
          // Get the user context
          const context = await sdk.context
          if (context?.user) {
            setFarcasterUser(context.user)
          }
          
          // Signal to the Farcaster client that the app is ready
          await sdk.actions.ready()
          setSdkReady(true)
        } else {
          // Not in Farcaster, still mark as ready for regular browser
          setSdkReady(true)
        }
      } catch (error) {
        console.error("Error initializing Farcaster SDK:", error)
        setSdkReady(true) // Mark ready anyway to not block UI
      }
    }
    
    initFarcaster()
  }, [])

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
          avatar: `/avatars/${Math.floor(Math.random() * 10) + 1}.png`,
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

  // Fluctuate bet percentages
  useEffect(() => {
    const interval = setInterval(() => {
      setYesPercentage((prev) => {
        const change = (Math.random() - 0.5) * 2
        return Math.max(40, Math.min(80, prev + change))
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return
    const msg: ChatMessage = {
      id: Date.now().toString(),
      user: { name: "You", avatar: "/avatars/user.png", bet: null },
      message: newMessage,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, msg])
    setNewMessage("")
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  return (
    <div className="flex flex-col h-screen max-h-screen bg-fc-gray-light overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-border shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-fc-purple flex items-center justify-center shadow-sm">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-fc-gray-dark">DegenBox</span>
          {/* Farcaster/Browser indicator */}
          <Badge 
            variant="outline" 
            className={cn(
              "text-[10px] px-1.5 py-0.5",
              isInFarcaster 
                ? "border-fc-purple/30 bg-fc-purple/5 text-fc-purple" 
                : "border-gray-300 bg-gray-50 text-fc-gray-muted"
            )}
          >
            {isInFarcaster ? "Farcaster" : "Browser"}
          </Badge>
        </div>
        
        {/* User section - shows Farcaster user or Connect button */}
        {farcasterUser ? (
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs font-semibold text-fc-gray-dark leading-tight">
                {farcasterUser.displayName || farcasterUser.username}
              </p>
              <p className="text-[10px] text-fc-gray-muted leading-tight">
                @{farcasterUser.username}
              </p>
            </div>
            <Avatar className="w-8 h-8 border-2 border-fc-purple/20">
              {farcasterUser.pfpUrl ? (
                <AvatarImage src={farcasterUser.pfpUrl || "/placeholder.svg"} alt={farcasterUser.displayName || "User"} />
              ) : null}
              <AvatarFallback className="bg-fc-purple/10 text-fc-purple text-xs font-semibold">
                {(farcasterUser.displayName || farcasterUser.username || "U").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        ) : (
          <Button
            variant={isConnected ? "outline" : "default"}
            size="sm"
            onClick={() => setIsConnected(!isConnected)}
            className={cn(
              "gap-2 font-medium",
              isConnected 
                ? "bg-white border-fc-mint text-fc-mint hover:bg-fc-mint/5" 
                : "bg-fc-purple hover:bg-fc-purple/90 text-white shadow-sm"
            )}
          >
            <Wallet className="w-4 h-4" />
            {isConnected ? "0x8f2...3d4" : "Connect"}
          </Button>
        )}
      </header>

      {/* Live Status Badge */}
      <div className="px-4 py-2 bg-white border-b border-border">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fc-coral opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-fc-coral"></span>
          </span>
          <span className="text-xs font-medium text-fc-gray-muted">
            LIVE: <span className="text-fc-gray-dark font-semibold">Peter Schiff vs Bitcoin</span>
          </span>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Hero Section - The Market */}
        <div className="p-4">
          <Card className="bg-white border-border shadow-sm overflow-hidden">
            {/* Market Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-start justify-between mb-3">
                <Badge className="bg-fc-purple/10 text-fc-purple border-fc-purple/20 text-xs font-semibold">
                  Prediction Market
                </Badge>
                <div className="flex items-center gap-1 text-fc-gray-muted">
                  <Users className="w-3 h-3" />
                  <span className="text-xs">1,247 bettors</span>
                </div>
              </div>
              <h2 className="text-base font-semibold text-fc-gray-dark leading-tight text-pretty">
                Will Peter Schiff tweet a negative comment about Bitcoin in the next 24 hours?
              </h2>
            </div>

            {/* Countdown & Stats */}
            <div className="p-4 bg-fc-gray-light/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-fc-purple" />
                  <span className="text-sm text-fc-gray-muted">Time Left</span>
                </div>
                <div className="font-mono text-lg font-bold text-fc-gray-dark">
                  {String(timeRemaining.hours).padStart(2, "0")}:
                  {String(timeRemaining.minutes).padStart(2, "0")}:
                  {String(timeRemaining.seconds).padStart(2, "0")}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-fc-mint">YES {yesPercentage.toFixed(0)}%</span>
                  <span className="text-fc-coral">NO {(100 - yesPercentage).toFixed(0)}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    className="h-full bg-fc-mint transition-all duration-500 ease-out"
                    style={{ width: `${yesPercentage}%` }}
                  />
                  <div
                    className="h-full bg-fc-coral transition-all duration-500 ease-out"
                    style={{ width: `${100 - yesPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-fc-gray-muted">
                  <span>{formatNumber(Math.floor(yesPercentage * 1247))} $DEGEN</span>
                  <span>{formatNumber(Math.floor((100 - yesPercentage) * 1247))} $DEGEN</span>
                </div>
              </div>
            </div>

            {/* Betting Interface */}
            <div className="p-4 space-y-4 bg-white">
              {/* Bet Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  className="h-14 bg-fc-mint hover:bg-fc-mint/90 text-white font-bold text-base shadow-md active:scale-95 transition-transform"
                >
                  <TrendingUp className="w-5 h-5 mr-2" />
                  YES
                </Button>
                <Button
                  className="h-14 bg-fc-coral hover:bg-fc-coral/90 text-white font-bold text-base shadow-md active:scale-95 transition-transform"
                >
                  <ChevronUp className="w-5 h-5 mr-2 rotate-180" />
                  NO
                </Button>
              </div>

              {/* Amount Quick Select */}
              <div className="space-y-2">
                <span className="text-xs text-fc-gray-muted font-medium">Bet Amount</span>
                <div className="flex gap-2">
                  {[100, 500, 1000].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAmount(amount)}
                      className={cn(
                        "flex-1 font-mono font-medium transition-all",
                        selectedAmount === amount
                          ? "bg-white border-fc-purple text-fc-purple border-2 shadow-sm"
                          : "bg-white border-gray-200 text-fc-gray-muted hover:text-fc-purple hover:border-fc-purple/50"
                      )}
                    >
                      {amount} $DEGEN
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 pb-2">
          <div className="flex gap-1 p-1 bg-white rounded-xl shadow-sm border border-border">
            <button
              onClick={() => setActiveTab("chat")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
                activeTab === "chat"
                  ? "bg-fc-purple text-white shadow-sm"
                  : "text-fc-gray-muted hover:text-fc-gray-dark hover:bg-fc-gray-light"
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
                  ? "bg-fc-purple text-white shadow-sm"
                  : "text-fc-gray-muted hover:text-fc-gray-dark hover:bg-fc-gray-light"
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
            <Card className="bg-white border-border shadow-sm overflow-hidden">
              {/* Chat Messages */}
              <div
                ref={chatRef}
                className="h-64 overflow-y-auto p-3 space-y-1 scroll-smooth"
              >
                {messages.map((msg) => (
                  <div key={msg.id} className="flex gap-3 p-2 rounded-lg hover:bg-fc-gray-light/50 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Avatar className="w-8 h-8 flex-shrink-0 shadow-sm">
                      <AvatarImage src={msg.user.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-fc-purple/10 text-fc-purple text-xs font-semibold">
                        {msg.user.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-fc-gray-dark truncate">
                          {msg.user.name}
                        </span>
                        {msg.user.bet && (
                          <Badge
                            className={cn(
                              "text-[10px] px-1.5 py-0 font-semibold",
                              msg.user.bet === "YES"
                                ? "bg-fc-mint/10 text-fc-mint border-fc-mint/20"
                                : "bg-fc-coral/10 text-fc-coral border-fc-coral/20"
                            )}
                          >
                            {msg.user.bet}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-fc-gray-muted leading-relaxed">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-border bg-fc-gray-light/30">
                <div className="flex gap-2">
                  <Input
                    placeholder="Send a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    className="bg-white border-gray-200 text-fc-gray-dark placeholder:text-fc-gray-muted focus:border-fc-purple focus:ring-fc-purple/20"
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    className="bg-fc-purple hover:bg-fc-purple/90 text-white shrink-0 shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="bg-white border-border shadow-sm overflow-hidden">
              <div className="p-3 border-b border-border">
                <h3 className="text-sm font-semibold text-fc-gray-dark">Top Prophets</h3>
                <p className="text-xs text-fc-gray-muted">Best predictors this season</p>
              </div>
              <div className="divide-y divide-border">
                {MOCK_LEADERBOARD.map((entry) => (
                  <div
                    key={entry.rank}
                    className="flex items-center gap-3 p-3 hover:bg-fc-gray-light/50 transition-colors"
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm",
                        entry.rank === 1 && "bg-amber-100 text-amber-600",
                        entry.rank === 2 && "bg-gray-100 text-gray-500",
                        entry.rank === 3 && "bg-orange-100 text-orange-600",
                        entry.rank > 3 && "bg-fc-gray-light text-fc-gray-muted"
                      )}
                    >
                      {entry.rank}
                    </div>
                    <Avatar className="w-8 h-8 shadow-sm">
                      <AvatarImage src={entry.user.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-fc-purple/10 text-fc-purple text-xs font-semibold">
                        {entry.user.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-fc-gray-dark truncate block">
                        {entry.user.name}
                      </span>
                      <span className="text-xs text-fc-gray-muted">
                        {entry.wins} wins • {entry.accuracy}% accuracy
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-fc-mint">
                        +{formatNumber(entry.earnings)}
                      </span>
                      <span className="text-xs text-fc-gray-muted block">$DEGEN</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Bottom Safe Area */}
      <div className="h-4 bg-fc-gray-light" />
    </div>
  )
}
