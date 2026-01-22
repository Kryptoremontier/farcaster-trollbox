// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/TrollBet.sol";

contract TrollBetTest is Test {
    TrollBet public trollBet;
    MockDEGEN public degenToken;
    
    address public owner = address(1);
    address public alice = address(2);
    address public bob = address(3);
    address public charlie = address(4);
    
    uint256 constant INITIAL_BALANCE = 100_000 * 10**18; // 100k DEGEN each
    
    function setUp() public {
        // Deploy mock DEGEN token
        degenToken = new MockDEGEN();
        
        // Deploy TrollBet contract
        vm.prank(owner);
        trollBet = new TrollBet(address(degenToken), owner);
        
        // Mint tokens to test users
        degenToken.mint(alice, INITIAL_BALANCE);
        degenToken.mint(bob, INITIAL_BALANCE);
        degenToken.mint(charlie, INITIAL_BALANCE);
        
        // Approve TrollBet to spend tokens
        vm.prank(alice);
        degenToken.approve(address(trollBet), type(uint256).max);
        
        vm.prank(bob);
        degenToken.approve(address(trollBet), type(uint256).max);
        
        vm.prank(charlie);
        degenToken.approve(address(trollBet), type(uint256).max);
    }
    
    // ============ Market Creation Tests ============
    
    function test_CreateMarket() public {
        vm.prank(owner);
        uint256 marketId = trollBet.createMarket(
            "Will Peter Schiff tweet about Bitcoin?",
            block.timestamp + 1 days
        );
        
        assertEq(marketId, 0);
        
        (
            string memory question,
            uint256 endTime,
            uint256 yesPool,
            uint256 noPool,
            bool resolved,
            bool winningSide
        ) = trollBet.getMarket(marketId);
        
        assertEq(question, "Will Peter Schiff tweet about Bitcoin?");
        assertEq(endTime, block.timestamp + 1 days);
        assertEq(yesPool, 0);
        assertEq(noPool, 0);
        assertFalse(resolved);
        assertFalse(winningSide);
    }
    
    function test_CreateMarket_OnlyOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        trollBet.createMarket("Test?", block.timestamp + 1 days);
    }
    
    function test_CreateMarket_InvalidEndTime() public {
        vm.prank(owner);
        vm.expectRevert(TrollBet.InvalidEndTime.selector);
        trollBet.createMarket("Test?", block.timestamp - 1);
    }
    
    // ============ Betting Tests ============
    
    function test_PlaceBet_Yes() public {
        // Create market
        vm.prank(owner);
        uint256 marketId = trollBet.createMarket("Test?", block.timestamp + 1 days);
        
        // Alice bets YES
        uint256 betAmount = 1000 * 10**18;
        vm.prank(alice);
        trollBet.placeBet(marketId, true, betAmount);
        
        // Check pools
        (,, uint256 yesPool, uint256 noPool,,) = trollBet.getMarket(marketId);
        assertEq(yesPool, betAmount);
        assertEq(noPool, 0);
        
        // Check user bet
        (uint256 userYes, uint256 userNo,) = trollBet.getUserBet(marketId, alice);
        assertEq(userYes, betAmount);
        assertEq(userNo, 0);
        
        // Check token transfer
        assertEq(degenToken.balanceOf(alice), INITIAL_BALANCE - betAmount);
        assertEq(degenToken.balanceOf(address(trollBet)), betAmount);
    }
    
    function test_PlaceBet_No() public {
        vm.prank(owner);
        uint256 marketId = trollBet.createMarket("Test?", block.timestamp + 1 days);
        
        uint256 betAmount = 500 * 10**18;
        vm.prank(bob);
        trollBet.placeBet(marketId, false, betAmount);
        
        (,, uint256 yesPool, uint256 noPool,,) = trollBet.getMarket(marketId);
        assertEq(yesPool, 0);
        assertEq(noPool, betAmount);
    }
    
    function test_PlaceBet_MultipleBets() public {
        vm.prank(owner);
        uint256 marketId = trollBet.createMarket("Test?", block.timestamp + 1 days);
        
        // Alice bets YES
        vm.prank(alice);
        trollBet.placeBet(marketId, true, 1000 * 10**18);
        
        // Bob bets NO
        vm.prank(bob);
        trollBet.placeBet(marketId, false, 500 * 10**18);
        
        // Alice bets YES again
        vm.prank(alice);
        trollBet.placeBet(marketId, true, 500 * 10**18);
        
        (,, uint256 yesPool, uint256 noPool,,) = trollBet.getMarket(marketId);
        assertEq(yesPool, 1500 * 10**18);
        assertEq(noPool, 500 * 10**18);
        
        (uint256 aliceYes,,) = trollBet.getUserBet(marketId, alice);
        assertEq(aliceYes, 1500 * 10**18);
    }
    
    function test_PlaceBet_AfterDeadline() public {
        vm.prank(owner);
        uint256 marketId = trollBet.createMarket("Test?", block.timestamp + 1 days);
        
        // Warp past deadline
        vm.warp(block.timestamp + 2 days);
        
        vm.prank(alice);
        vm.expectRevert(TrollBet.BettingClosed.selector);
        trollBet.placeBet(marketId, true, 1000 * 10**18);
    }
    
    // ============ Market Resolution Tests ============
    
    function test_ResolveMarket() public {
        vm.prank(owner);
        uint256 marketId = trollBet.createMarket("Test?", block.timestamp + 1 days);
        
        // Place some bets
        vm.prank(alice);
        trollBet.placeBet(marketId, true, 1000 * 10**18);
        
        // Warp past deadline
        vm.warp(block.timestamp + 2 days);
        
        // Resolve market
        vm.prank(owner);
        trollBet.resolveMarket(marketId, true);
        
        (,,,, bool resolved, bool winningSide) = trollBet.getMarket(marketId);
        assertTrue(resolved);
        assertTrue(winningSide);
    }
    
    function test_ResolveMarket_OnlyOwner() public {
        vm.prank(owner);
        uint256 marketId = trollBet.createMarket("Test?", block.timestamp + 1 days);
        
        vm.warp(block.timestamp + 2 days);
        
        vm.prank(alice);
        vm.expectRevert();
        trollBet.resolveMarket(marketId, true);
    }
    
    function test_ResolveMarket_StillActive() public {
        vm.prank(owner);
        uint256 marketId = trollBet.createMarket("Test?", block.timestamp + 1 days);
        
        vm.prank(owner);
        vm.expectRevert(TrollBet.MarketStillActive.selector);
        trollBet.resolveMarket(marketId, true);
    }
    
    // ============ Claim Winnings Tests ============
    
    function test_ClaimWinnings_SingleWinner() public {
        vm.prank(owner);
        uint256 marketId = trollBet.createMarket("Test?", block.timestamp + 1 days);
        
        // Alice bets 1000 YES
        vm.prank(alice);
        trollBet.placeBet(marketId, true, 1000 * 10**18);
        
        // Bob bets 500 NO
        vm.prank(bob);
        trollBet.placeBet(marketId, false, 500 * 10**18);
        
        // Warp and resolve (YES wins)
        vm.warp(block.timestamp + 2 days);
        vm.prank(owner);
        trollBet.resolveMarket(marketId, true);
        
        // Alice claims
        uint256 aliceBalanceBefore = degenToken.balanceOf(alice);
        vm.prank(alice);
        trollBet.claimWinnings(marketId);
        uint256 aliceBalanceAfter = degenToken.balanceOf(alice);
        
        // Total pool = 1500, Alice's share = 100%
        // Gross payout = 1500, Fee = 15 (1%), Net = 1485
        uint256 expectedPayout = 1485 * 10**18;
        assertEq(aliceBalanceAfter - aliceBalanceBefore, expectedPayout);
        
        // Check fees accumulated
        assertEq(trollBet.accumulatedFees(), 15 * 10**18);
    }
    
    function test_ClaimWinnings_MultipleWinners() public {
        vm.prank(owner);
        uint256 marketId = trollBet.createMarket("Test?", block.timestamp + 1 days);
        
        // Alice bets 600 YES
        vm.prank(alice);
        trollBet.placeBet(marketId, true, 600 * 10**18);
        
        // Bob bets 400 YES
        vm.prank(bob);
        trollBet.placeBet(marketId, true, 400 * 10**18);
        
        // Charlie bets 1000 NO
        vm.prank(charlie);
        trollBet.placeBet(marketId, false, 1000 * 10**18);
        
        // Warp and resolve (YES wins)
        vm.warp(block.timestamp + 2 days);
        vm.prank(owner);
        trollBet.resolveMarket(marketId, true);
        
        // Total pool = 2000, YES pool = 1000
        // Alice: 600/1000 * 2000 = 1200 gross, 1188 net
        // Bob: 400/1000 * 2000 = 800 gross, 792 net
        
        vm.prank(alice);
        trollBet.claimWinnings(marketId);
        
        vm.prank(bob);
        trollBet.claimWinnings(marketId);
        
        // Verify fees (1200 * 0.01 + 800 * 0.01 = 20)
        assertEq(trollBet.accumulatedFees(), 20 * 10**18);
    }
    
    function test_ClaimWinnings_NotAWinner() public {
        vm.prank(owner);
        uint256 marketId = trollBet.createMarket("Test?", block.timestamp + 1 days);
        
        // Alice bets YES, Bob bets NO
        vm.prank(alice);
        trollBet.placeBet(marketId, true, 1000 * 10**18);
        
        vm.prank(bob);
        trollBet.placeBet(marketId, false, 500 * 10**18);
        
        // Resolve - YES wins
        vm.warp(block.timestamp + 2 days);
        vm.prank(owner);
        trollBet.resolveMarket(marketId, true);
        
        // Bob tries to claim (he bet NO)
        vm.prank(bob);
        vm.expectRevert(TrollBet.NotAWinner.selector);
        trollBet.claimWinnings(marketId);
    }
    
    function test_ClaimWinnings_AlreadyClaimed() public {
        vm.prank(owner);
        uint256 marketId = trollBet.createMarket("Test?", block.timestamp + 1 days);
        
        vm.prank(alice);
        trollBet.placeBet(marketId, true, 1000 * 10**18);
        
        vm.warp(block.timestamp + 2 days);
        vm.prank(owner);
        trollBet.resolveMarket(marketId, true);
        
        // First claim
        vm.prank(alice);
        trollBet.claimWinnings(marketId);
        
        // Second claim should fail
        vm.prank(alice);
        vm.expectRevert(TrollBet.AlreadyClaimed.selector);
        trollBet.claimWinnings(marketId);
    }
    
    // ============ Fee Withdrawal Tests ============
    
    function test_WithdrawFees() public {
        vm.prank(owner);
        uint256 marketId = trollBet.createMarket("Test?", block.timestamp + 1 days);
        
        vm.prank(alice);
        trollBet.placeBet(marketId, true, 1000 * 10**18);
        
        vm.warp(block.timestamp + 2 days);
        vm.prank(owner);
        trollBet.resolveMarket(marketId, true);
        
        vm.prank(alice);
        trollBet.claimWinnings(marketId);
        
        uint256 fees = trollBet.accumulatedFees();
        uint256 ownerBalanceBefore = degenToken.balanceOf(owner);
        
        vm.prank(owner);
        trollBet.withdrawFees();
        
        assertEq(degenToken.balanceOf(owner), ownerBalanceBefore + fees);
        assertEq(trollBet.accumulatedFees(), 0);
    }
    
    // ============ View Function Tests ============
    
    function test_CalculateOdds() public {
        vm.prank(owner);
        uint256 marketId = trollBet.createMarket("Test?", block.timestamp + 1 days);
        
        // 60% YES, 40% NO
        vm.prank(alice);
        trollBet.placeBet(marketId, true, 600 * 10**18);
        
        vm.prank(bob);
        trollBet.placeBet(marketId, false, 400 * 10**18);
        
        // YES odds = 1000/600 = 1.67x = 16666 bps
        // NO odds = 1000/400 = 2.5x = 25000 bps
        uint256 yesOdds = trollBet.calculateOdds(marketId, true);
        uint256 noOdds = trollBet.calculateOdds(marketId, false);
        
        assertEq(yesOdds, 16666); // ~1.67x
        assertEq(noOdds, 25000);  // 2.5x
    }
    
    function test_CalculatePayout() public {
        vm.prank(owner);
        uint256 marketId = trollBet.createMarket("Test?", block.timestamp + 1 days);
        
        vm.prank(alice);
        trollBet.placeBet(marketId, true, 500 * 10**18);
        
        // Calculate payout if Bob bets 500 on NO
        (uint256 gross, uint256 net) = trollBet.calculatePayout(marketId, false, 500 * 10**18);
        
        // Total would be 1000, NO pool would be 500
        // Gross = 500 * 1000 / 500 = 1000
        // Net = 1000 - 10 (1%) = 990
        assertEq(gross, 1000 * 10**18);
        assertEq(net, 990 * 10**18);
    }
}
