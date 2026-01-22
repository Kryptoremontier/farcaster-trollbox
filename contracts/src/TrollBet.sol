// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title TrollBet
 * @author TrollBox Team
 * @notice Pari-mutuel prediction market contract for $DEGEN token on Base
 * @dev Uses OpenZeppelin's Ownable and ReentrancyGuard for security
 */
contract TrollBet is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Constants ============
    
    /// @notice Protocol fee in basis points (1% = 100 bp)
    uint256 public constant PROTOCOL_FEE_BPS = 100;
    uint256 public constant BPS_DENOMINATOR = 10000;

    // ============ Structs ============

    struct Market {
        string question;           // Market question
        uint256 endTime;           // Betting deadline
        uint256 yesPool;           // Total $DEGEN in YES pool
        uint256 noPool;            // Total $DEGEN in NO pool
        bool resolved;             // Whether market has been resolved
        bool winningSide;          // true = YES won, false = NO won
        bool exists;               // Whether market exists
    }

    struct UserBet {
        uint256 yesAmount;         // User's bet on YES
        uint256 noAmount;          // User's bet on NO
        bool claimed;              // Whether user has claimed winnings
    }

    // ============ State Variables ============

    /// @notice The $DEGEN token contract
    IERC20 public immutable degenToken;

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

    // ============ Constructor ============

    /**
     * @notice Initialize the TrollBet contract
     * @param _degenToken Address of the $DEGEN ERC-20 token
     * @param _owner Address of the contract owner (admin)
     */
    constructor(address _degenToken, address _owner) Ownable(_owner) {
        degenToken = IERC20(_degenToken);
    }

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
        degenToken.safeTransfer(owner(), fees);

        emit FeesWithdrawn(owner(), fees);
    }

    // ============ User Functions ============

    /**
     * @notice Place a bet on a market
     * @param marketId The ID of the market
     * @param side true = YES, false = NO
     * @param amount Amount of $DEGEN to bet
     */
    function placeBet(
        uint256 marketId,
        bool side,
        uint256 amount
    ) external nonReentrant {
        Market storage market = markets[marketId];
        
        if (!market.exists) revert MarketDoesNotExist();
        if (market.resolved) revert MarketAlreadyResolved();
        if (block.timestamp >= market.endTime) revert BettingClosed();
        if (amount == 0) revert InvalidAmount();

        // Transfer $DEGEN from user to contract
        degenToken.safeTransferFrom(msg.sender, address(this), amount);

        // Update pools and user bet
        UserBet storage userBet = userBets[marketId][msg.sender];
        
        if (side) {
            market.yesPool += amount;
            userBet.yesAmount += amount;
        } else {
            market.noPool += amount;
            userBet.noAmount += amount;
        }

        emit BetPlaced(marketId, msg.sender, side, amount);
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
        // Using fixed-point math to avoid precision loss
        uint256 grossPayout = (userWinningBet * totalPool) / winningPool;

        // Deduct 1% protocol fee
        uint256 fee = (grossPayout * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
        uint256 netPayout = grossPayout - fee;

        // Update state
        userBet.claimed = true;
        accumulatedFees += fee;

        // Transfer winnings to user
        degenToken.safeTransfer(msg.sender, netPayout);

        emit WinningsClaimed(marketId, msg.sender, netPayout);
    }

    // ============ View Functions ============

    /**
     * @notice Get market details
     * @param marketId The ID of the market
     * @return question The market question
     * @return endTime Betting deadline
     * @return yesPool Total in YES pool
     * @return noPool Total in NO pool
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
     * @return yesAmount User's YES bet
     * @return noAmount User's NO bet
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
     * @param amount The bet amount
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
     * @return totalPool Combined YES + NO pools
     */
    function getTotalPool(uint256 marketId) external view returns (uint256 totalPool) {
        Market storage market = markets[marketId];
        if (!market.exists) revert MarketDoesNotExist();
        return market.yesPool + market.noPool;
    }
}
