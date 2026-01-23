// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TrollBetETH
 * @author TrollBox Team
 * @notice Pari-mutuel prediction market contract using Native ETH on Base
 * @dev Uses OpenZeppelin's Ownable and ReentrancyGuard for security
 * @dev NO ERC20 tokens - all bets and payouts are in Native ETH
 */
contract TrollBetETH is Ownable, ReentrancyGuard {

    // ============ Constants ============
    
    /// @notice Protocol fee in basis points (1% = 100 bp)
    uint256 public constant PROTOCOL_FEE_BPS = 100;
    uint256 public constant BPS_DENOMINATOR = 10000;

    // ============ Structs ============

    struct Market {
        string question;           // Market question
        uint256 endTime;           // Betting deadline
        uint256 yesPool;           // Total ETH in YES pool
        uint256 noPool;            // Total ETH in NO pool
        bool resolved;             // Whether market has been resolved
        bool winningSide;          // true = YES won, false = NO won
        bool exists;               // Whether market exists
    }

    struct UserBet {
        uint256 yesAmount;         // User's bet on YES (in wei)
        uint256 noAmount;          // User's bet on NO (in wei)
        bool claimed;              // Whether user has claimed winnings
    }

    // ============ State Variables ============

    /// @notice Counter for market IDs
    uint256 public marketCount;

    /// @notice Accumulated protocol fees ready for withdrawal
    uint256 public accumulatedFees;

    /// @notice Market ID => Market data
    mapping(uint256 => Market) public markets;

    /// @notice Market ID => User address => User's bet data
    mapping(uint256 => mapping(address => UserBet)) public userBets;

    // ============ Events ============

    event MarketCreated(
        uint256 indexed marketId,
        string question,
        uint256 endTime
    );

    event BetPlaced(
        uint256 indexed marketId,
        address indexed user,
        bool side,
        uint256 amount
    );

    event MarketResolved(
        uint256 indexed marketId,
        bool winningSide,
        uint256 totalPool
    );

    event WinningsClaimed(
        uint256 indexed marketId,
        address indexed user,
        uint256 payout
    );

    event FeesWithdrawn(
        address indexed owner,
        uint256 amount
    );

    // ============ Errors ============

    error MarketDoesNotExist();
    error MarketAlreadyResolved();
    error MarketNotResolved();
    error MarketStillActive();
    error BettingClosed();
    error InvalidAmount();
    error InvalidEndTime();
    error NoBetPlaced();
    error AlreadyClaimed();
    error NotAWinner();
    error NoFeesToWithdraw();
    error TransferFailed();

    // ============ Constructor ============

    /**
     * @notice Initialize the TrollBetETH contract
     * @param _owner Address of the contract owner (admin)
     */
    constructor(address _owner) Ownable(_owner) {}

    // ============ Admin Functions ============

    /**
     * @notice Create a new prediction market
     * @param question The market question
     * @param endTime Unix timestamp when betting closes
     * @return marketId The ID of the newly created market
     */
    function createMarket(
        string calldata question,
        uint256 endTime
    ) external onlyOwner returns (uint256 marketId) {
        if (endTime <= block.timestamp) revert InvalidEndTime();

        marketId = marketCount++;
        
        markets[marketId] = Market({
            question: question,
            endTime: endTime,
            yesPool: 0,
            noPool: 0,
            resolved: false,
            winningSide: false,
            exists: true
        });

        emit MarketCreated(marketId, question, endTime);
    }

    /**
     * @notice Resolve a market with the winning side
     * @param marketId The ID of the market to resolve
     * @param winningSide true = YES won, false = NO won
     */
    function resolveMarket(
        uint256 marketId,
        bool winningSide
    ) external onlyOwner {
        Market storage market = markets[marketId];
        
        if (!market.exists) revert MarketDoesNotExist();
        if (market.resolved) revert MarketAlreadyResolved();
        if (block.timestamp < market.endTime) revert MarketStillActive();

        market.resolved = true;
        market.winningSide = winningSide;

        uint256 totalPool = market.yesPool + market.noPool;

        emit MarketResolved(marketId, winningSide, totalPool);
    }

    /**
     * @notice Withdraw accumulated protocol fees
     */
    function withdrawFees() external onlyOwner {
        uint256 fees = accumulatedFees;
        if (fees == 0) revert NoFeesToWithdraw();
        
        accumulatedFees = 0;
        
        // Transfer ETH to owner
        (bool sent, ) = owner().call{value: fees}("");
        if (!sent) revert TransferFailed();

        emit FeesWithdrawn(owner(), fees);
    }

    // ============ User Functions ============

    /**
     * @notice Place a bet on a market using ETH
     * @param marketId The ID of the market
     * @param side true = YES, false = NO
     * @dev Send ETH with the transaction (msg.value is the bet amount)
     */
    function placeBet(
        uint256 marketId,
        bool side
    ) external payable nonReentrant {
        Market storage market = markets[marketId];
        
        if (!market.exists) revert MarketDoesNotExist();
        if (market.resolved) revert MarketAlreadyResolved();
        if (block.timestamp >= market.endTime) revert BettingClosed();
        if (msg.value == 0) revert InvalidAmount();

        // Update pools and user bet
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

        if (!market.exists) revert MarketDoesNotExist();
        if (!market.resolved) revert MarketNotResolved();
        if (userBet.claimed) revert AlreadyClaimed();

        // Determine user's winning amount
        uint256 userWinningBet = market.winningSide 
            ? userBet.yesAmount 
            : userBet.noAmount;

        if (userWinningBet == 0) revert NotAWinner();

        // Calculate payout using Pari-mutuel formula
        uint256 totalPool = market.yesPool + market.noPool;
        uint256 winningPool = market.winningSide ? market.yesPool : market.noPool;

        // User's share = (userBet / winningPool) * totalPool
        uint256 grossPayout = (userWinningBet * totalPool) / winningPool;

        // Deduct 1% protocol fee
        uint256 fee = (grossPayout * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
        uint256 netPayout = grossPayout - fee;

        // Update state
        userBet.claimed = true;
        accumulatedFees += fee;

        // Transfer ETH winnings to user
        (bool sent, ) = msg.sender.call{value: netPayout}("");
        if (!sent) revert TransferFailed();

        emit WinningsClaimed(marketId, msg.sender, netPayout);
    }

    // ============ View Functions ============

    /**
     * @notice Get market details
     * @param marketId The ID of the market
     * @return question The market question
     * @return endTime Betting deadline
     * @return yesPool Total in YES pool (wei)
     * @return noPool Total in NO pool (wei)
     * @return resolved Whether market is resolved
     * @return winningSide The winning side (only valid if resolved)
     */
    function getMarket(uint256 marketId) external view returns (
        string memory question,
        uint256 endTime,
        uint256 yesPool,
        uint256 noPool,
        bool resolved,
        bool winningSide
    ) {
        Market storage market = markets[marketId];
        if (!market.exists) revert MarketDoesNotExist();
        
        return (
            market.question,
            market.endTime,
            market.yesPool,
            market.noPool,
            market.resolved,
            market.winningSide
        );
    }

    /**
     * @notice Get user's bet on a market
     * @param marketId The ID of the market
     * @param user The user's address
     * @return yesAmount User's YES bet (wei)
     * @return noAmount User's NO bet (wei)
     * @return claimed Whether user has claimed
     */
    function getUserBet(
        uint256 marketId,
        address user
    ) external view returns (
        uint256 yesAmount,
        uint256 noAmount,
        bool claimed
    ) {
        UserBet storage userBet = userBets[marketId][user];
        return (userBet.yesAmount, userBet.noAmount, userBet.claimed);
    }

    /**
     * @notice Calculate current odds for a side
     * @param marketId The ID of the market
     * @param side true = YES, false = NO
     * @return odds The current odds in basis points (10000 = 1.0x)
     */
    function calculateOdds(
        uint256 marketId,
        bool side
    ) external view returns (uint256 odds) {
        Market storage market = markets[marketId];
        if (!market.exists) revert MarketDoesNotExist();

        uint256 totalPool = market.yesPool + market.noPool;
        if (totalPool == 0) return BPS_DENOMINATOR; // 1.0x if empty

        uint256 sidePool = side ? market.yesPool : market.noPool;
        if (sidePool == 0) return 0; // Infinite odds (no bets on this side)

        // Odds = totalPool / sidePool (in basis points)
        return (totalPool * BPS_DENOMINATOR) / sidePool;
    }

    /**
     * @notice Calculate potential payout for a bet
     * @param marketId The ID of the market
     * @param side true = YES, false = NO
     * @param amount The bet amount (wei)
     * @return grossPayout Payout before fees
     * @return netPayout Payout after 1% fee
     */
    function calculatePayout(
        uint256 marketId,
        bool side,
        uint256 amount
    ) external view returns (uint256 grossPayout, uint256 netPayout) {
        Market storage market = markets[marketId];
        if (!market.exists) revert MarketDoesNotExist();

        uint256 totalPool = market.yesPool + market.noPool + amount;
        uint256 sidePool = (side ? market.yesPool : market.noPool) + amount;

        grossPayout = (amount * totalPool) / sidePool;
        uint256 fee = (grossPayout * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
        netPayout = grossPayout - fee;
    }

    /**
     * @notice Get total pool size for a market
     * @param marketId The ID of the market
     * @return totalPool Combined YES + NO pools (wei)
     */
    function getTotalPool(uint256 marketId) external view returns (uint256 totalPool) {
        Market storage market = markets[marketId];
        if (!market.exists) revert MarketDoesNotExist();
        return market.yesPool + market.noPool;
    }

    /**
     * @notice Receive ETH (for direct transfers)
     */
    receive() external payable {}
}
