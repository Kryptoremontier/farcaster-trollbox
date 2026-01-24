// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TrollBetETH
 * @author TrollBox Team
 * @notice Pari-mutuel prediction market contract using Native ETH on Base
 * @dev Self-contained version for Remix IDE deployment (no external imports)
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Copy this entire file to Remix IDE
 * 2. Compile with Solidity 0.8.20
 * 3. Deploy to Base Sepolia (or Base Mainnet)
 * 4. Constructor parameter: your wallet address (owner)
 * 5. Save the deployed contract address
 */
contract TrollBetETH {

    // ============ Constants ============
    
    uint256 public PROTOCOL_FEE_BPS = 250; // 2.5% fee (modifiable by owner)
    uint256 public constant BPS_DENOMINATOR = 10000;

    // ============ State Variables ============
    
    address public owner;
    uint256 public marketCount;
    uint256 public accumulatedFees;
    bool public paused; // Emergency pause
    bool private locked; // Reentrancy guard

    // ============ Structs ============

    struct Market {
        string question;
        uint256 endTime;
        uint256 yesPool;
        uint256 noPool;
        bool resolved;
        bool winningSide;
        bool exists;
        bool cancelled; // Market can be cancelled by owner
    }

    struct UserBet {
        uint256 yesAmount;
        uint256 noAmount;
        bool claimed;
    }

    // ============ Mappings ============

    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => UserBet)) public userBets;

    // ============ Events ============

    event MarketCreated(uint256 indexed marketId, string question, uint256 endTime);
    event BetPlaced(uint256 indexed marketId, address indexed user, bool side, uint256 amount);
    event MarketResolved(uint256 indexed marketId, bool winningSide, uint256 totalPool);
    event WinningsClaimed(uint256 indexed marketId, address indexed user, uint256 payout);
    event FeesWithdrawn(address indexed owner, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Paused(address indexed by);
    event Unpaused(address indexed by);
    event MarketCancelled(uint256 indexed marketId);
    event FeeUpdated(uint256 oldFee, uint256 newFee);

    // ============ Modifiers ============

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier nonReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Initialize contract with owner address
     * @param _owner The address that will own this contract
     */
    constructor(address _owner) {
        require(_owner != address(0), "Invalid owner");
        owner = _owner;
        emit OwnershipTransferred(address(0), _owner);
    }

    // ============ Admin Functions ============

    /**
     * @notice Create a new prediction market
     * @param question The market question
     * @param endTime Unix timestamp when betting closes
     */
    function createMarket(string calldata question, uint256 endTime) external onlyOwner returns (uint256 marketId) {
        require(endTime > block.timestamp, "Invalid end time");

        marketId = marketCount++;
        
        markets[marketId] = Market({
            question: question,
            endTime: endTime,
            yesPool: 0,
            noPool: 0,
            resolved: false,
            winningSide: false,
            exists: true,
            cancelled: false
        });

        emit MarketCreated(marketId, question, endTime);
    }

    /**
     * @notice Resolve a market with the winning side
     * @param marketId The ID of the market
     * @param winningSide true = YES won, false = NO won
     * @dev If winning side has no bets, market is auto-cancelled for refunds
     */
    function resolveMarket(uint256 marketId, bool winningSide) external onlyOwner {
        Market storage market = markets[marketId];
        
        require(market.exists, "Market does not exist");
        require(!market.resolved, "Already resolved");
        require(!market.cancelled, "Market cancelled");
        require(block.timestamp >= market.endTime, "Market still active");

        // CRITICAL: If winning side has no bets, auto-cancel for refunds
        uint256 winningPool = winningSide ? market.yesPool : market.noPool;
        
        if (winningPool == 0) {
            // Auto-cancel: all bettors get 100% refund
            market.cancelled = true;
            emit MarketCancelled(marketId);
            return;
        }

        market.resolved = true;
        market.winningSide = winningSide;

        emit MarketResolved(marketId, winningSide, market.yesPool + market.noPool);
    }

    /**
     * @notice Cancel a market (allows users to get refunds)
     * @dev Can only cancel unresolved markets. Users get 100% refund.
     */
    function cancelMarket(uint256 marketId) external onlyOwner {
        Market storage market = markets[marketId];
        
        require(market.exists, "Market does not exist");
        require(!market.resolved, "Already resolved");
        require(!market.cancelled, "Already cancelled");

        market.cancelled = true;

        emit MarketCancelled(marketId);
    }

    /**
     * @notice Claim refund from cancelled market
     * @dev Returns 100% of user's bet (no fees)
     */
    function claimRefund(uint256 marketId) external nonReentrant {
        Market storage market = markets[marketId];
        UserBet storage userBet = userBets[marketId][msg.sender];

        require(market.exists, "Market does not exist");
        require(market.cancelled, "Market not cancelled");
        require(!userBet.claimed, "Already claimed");

        uint256 refundAmount = userBet.yesAmount + userBet.noAmount;
        require(refundAmount > 0, "No bet to refund");

        userBet.claimed = true;

        (bool sent, ) = msg.sender.call{value: refundAmount}("");
        require(sent, "Transfer failed");

        emit WinningsClaimed(marketId, msg.sender, refundAmount);
    }

    /**
     * @notice Withdraw accumulated protocol fees
     */
    function withdrawFees() external onlyOwner {
        uint256 fees = accumulatedFees;
        require(fees > 0, "No fees");
        
        accumulatedFees = 0;
        
        (bool sent, ) = owner.call{value: fees}("");
        require(sent, "Transfer failed");

        emit FeesWithdrawn(owner, fees);
    }

    /**
     * @notice Transfer ownership to a new address
     * @param newOwner The new owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ============ User Functions ============

    /**
     * @notice Place a bet on a market using ETH
     * @param marketId The ID of the market
     * @param side true = YES, false = NO
     * @dev Send ETH with the transaction (msg.value is the bet amount)
     */
    function placeBet(uint256 marketId, bool side) external payable nonReentrant whenNotPaused {
        Market storage market = markets[marketId];
        
        require(market.exists, "Market does not exist");
        require(!market.resolved, "Market resolved");
        require(block.timestamp < market.endTime, "Betting closed");
        require(msg.value > 0, "Invalid amount");

        UserBet storage userBet = userBets[marketId][msg.sender];
        
        if (side) {
            market.yesPool += msg.value;
            userBet.yesAmount += msg.value;
        } else {
            market.noPool += msg.value;
            userBet.noAmount += msg.value;
        }

        emit BetPlaced(marketId, msg.sender, side, msg.value);
    }

    /**
     * @notice Claim winnings from a resolved market
     * @param marketId The ID of the market
     */
    function claimWinnings(uint256 marketId) external nonReentrant {
        Market storage market = markets[marketId];
        UserBet storage userBet = userBets[marketId][msg.sender];

        require(market.exists, "Market does not exist");
        require(market.resolved, "Not resolved");
        require(!userBet.claimed, "Already claimed");

        uint256 userWinningBet = market.winningSide ? userBet.yesAmount : userBet.noAmount;
        require(userWinningBet > 0, "Not a winner");

        uint256 totalPool = market.yesPool + market.noPool;
        uint256 winningPool = market.winningSide ? market.yesPool : market.noPool;

        uint256 grossPayout = (userWinningBet * totalPool) / winningPool;
        uint256 fee = (grossPayout * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
        uint256 netPayout = grossPayout - fee;

        userBet.claimed = true;
        accumulatedFees += fee;

        (bool sent, ) = msg.sender.call{value: netPayout}("");
        require(sent, "Transfer failed");

        emit WinningsClaimed(marketId, msg.sender, netPayout);
    }

    // ============ View Functions ============

    function getMarket(uint256 marketId) external view returns (
        string memory question,
        uint256 endTime,
        uint256 yesPool,
        uint256 noPool,
        bool resolved,
        bool winningSide
    ) {
        Market storage market = markets[marketId];
        require(market.exists, "Market does not exist");
        
        return (
            market.question,
            market.endTime,
            market.yesPool,
            market.noPool,
            market.resolved,
            market.winningSide
        );
    }

    function getUserBet(uint256 marketId, address user) external view returns (
        uint256 yesAmount,
        uint256 noAmount,
        bool claimed
    ) {
        UserBet storage userBet = userBets[marketId][user];
        return (userBet.yesAmount, userBet.noAmount, userBet.claimed);
    }

    function calculatePayout(uint256 marketId, bool side, uint256 amount) external view returns (
        uint256 grossPayout,
        uint256 netPayout
    ) {
        Market storage market = markets[marketId];
        require(market.exists, "Market does not exist");

        uint256 totalPool = market.yesPool + market.noPool + amount;
        uint256 sidePool = (side ? market.yesPool : market.noPool) + amount;

        grossPayout = (amount * totalPool) / sidePool;
        uint256 fee = (grossPayout * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
        netPayout = grossPayout - fee;
    }

    function getTotalPool(uint256 marketId) external view returns (uint256) {
        Market storage market = markets[marketId];
        require(market.exists, "Market does not exist");
        return market.yesPool + market.noPool;
    }

    // ============ Emergency Functions ============

    /**
     * @notice Pause the contract (emergency stop)
     * @dev Only owner can pause. Prevents new bets but allows claims.
     */
    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @notice Unpause the contract
     * @dev Only owner can unpause.
     */
    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    /**
     * @notice Emergency withdraw all ETH from contract
     * @dev Only callable when paused. Last resort if contract is compromised.
     * @dev Users should be refunded manually off-chain if this is used.
     */
    function emergencyWithdraw() external onlyOwner {
        require(paused, "Must be paused first");
        uint256 balance = address(this).balance;
        (bool sent, ) = owner.call{value: balance}("");
        require(sent, "Transfer failed");
    }

    /**
     * @notice Update protocol fee (owner only)
     * @dev Fee cannot exceed 10% (1000 basis points)
     */
    function setFee(uint256 _newFeeBps) external onlyOwner {
        require(_newFeeBps <= 1000, "Fee too high (max 10%)");
        uint256 oldFee = PROTOCOL_FEE_BPS;
        PROTOCOL_FEE_BPS = _newFeeBps;
        emit FeeUpdated(oldFee, _newFeeBps);
    }

    // Receive ETH
    receive() external payable {}
}
