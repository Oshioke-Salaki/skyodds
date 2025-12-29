// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SkyOdds.sol";
import "../src/mock/MockERC20.sol";

contract SkyOddsTest is Test {
    SkyOdds public market;
    MockERC20 public token;

    address public owner;
    address public oracleResolver;
    address public user1;
    address public user2;
    address public user3;
    address public user4;
    address public admin2;

    bytes32 public flightId;
    uint256 public marketCloseTime;

    function setUp() public {
        owner = address(this);
        oracleResolver = makeAddr("oracle");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        user3 = makeAddr("user3");
        user4 = makeAddr("user4");
        admin2 = makeAddr("admin2");

        token = new MockERC20();
        market = new SkyOdds(address(token), oracleResolver);

        // Mint tokens to users
        token.mint(user1, 10000e6);
        token.mint(user2, 10000e6);
        token.mint(user3, 10000e6);
        token.mint(user4, 10000e6);

        // Create a flight market
        uint256 scheduledDeparture = block.timestamp + 2 days;
        flightId = market.createFlightMarket("AA100", "JFK", "LAX", "AA", scheduledDeparture, 100e6);

        (,,,, marketCloseTime,,) = market.getFlightInfo(flightId);
    }

    // ============ NEW: Economic Correctness Tests ============

    function testSingleUserGetsFullPayout() public {
        // User bets 100 USDC
        _placeBet(user1, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 100e6);

        // Resolve as OnTime
        vm.warp(marketCloseTime + 1);
        vm.prank(oracleResolver);
        market.resolveMarket(flightId, SkyOdds.Outcome.OnTime);

        // Claim
        uint256 balanceBefore = token.balanceOf(user1);
        vm.prank(user1);
        market.claimWinnings(flightId);
        uint256 balanceAfter = token.balanceOf(user1);

        uint256 payout = balanceAfter - balanceBefore;
        uint256 expectedPayout = 98e6; // 100 - 2% fee

        // Should get ~98 USDC
        assertApproxEqRel(payout, expectedPayout, 0.01e18, "Single user should get full payout");
    }

    function testConservationOfFunds() public {
        // Three users bet
        _placeBet(user1, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 100e6);
        _placeBet(user2, SkyOdds.Outcome.Delayed30, SkyOdds.Position.YES, 150e6);
        _placeBet(user3, SkyOdds.Outcome.OnTime, SkyOdds.Position.NO, 200e6);

        uint256 totalDeposited = 100e6 + 150e6 + 200e6;

        // Resolve
        vm.warp(marketCloseTime + 1);
        vm.prank(oracleResolver);
        market.resolveMarket(flightId, SkyOdds.Outcome.Delayed30);

        // Claim all winnings
        uint256 totalPaidOut = 0;
        uint256 totalFees = 0;

        // User2 wins (bet YES on Delayed30)
        uint256 user2Before = token.balanceOf(user2);
        vm.prank(user2);
        market.claimWinnings(flightId);
        uint256 user2Payout = token.balanceOf(user2) - user2Before;
        totalPaidOut += user2Payout;

        // User3 wins (bet NO on OnTime)
        uint256 user3Before = token.balanceOf(user3);
        vm.prank(user3);
        market.claimWinnings(flightId);
        uint256 user3Payout = token.balanceOf(user3) - user3Before;
        totalPaidOut += user3Payout;

        // Calculate fees
        totalFees = market.totalFeesCollected();

        // Conservation check: totalDeposited = totalPaidOut + totalFees
        assertApproxEqRel(
            totalDeposited, totalPaidOut + totalFees, 0.001e18, "Total deposited should equal total paid out plus fees"
        );
    }

    function testInitialPricesAreExactly25Percent() public view {
        (uint256 onTimePrice, uint256 delayed30Price, uint256 delayed120Price, uint256 cancelledPrice) =
            market.getAllPrices(flightId);

        assertEq(onTimePrice, 25e16, "OnTime should be exactly 25%");
        assertEq(delayed30Price, 25e16, "Delayed30 should be exactly 25%");
        assertEq(delayed120Price, 25e16, "Delayed120+ should be exactly 25%");
        assertEq(cancelledPrice, 25e16, "Cancelled should be exactly 25%");
    }

    function testPriceSymmetryYesVsNo() public {
        // User1 bets YES on OnTime
        _placeBet(user1, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 100e6);

        uint256 priceAfterYes = market.getPrice(flightId, SkyOdds.Outcome.OnTime);

        assertTrue(priceAfterYes > 25e16, "Price should increase");

        // User2 bets NO on OnTime
        _placeBet(user2, SkyOdds.Outcome.OnTime, SkyOdds.Position.NO, 100e6);

        // Prices should move symmetrically
        uint256 priceAfterNo = market.getPrice(flightId, SkyOdds.Outcome.OnTime);

        assertTrue(priceAfterNo < priceAfterYes, "NO bet should decrease OnTime price");
    }

    function testLargeBet() public {
        // Bet 1000 USDC (10x liquidity parameter)
        token.mint(user1, 1000e6);

        vm.startPrank(user1);

        // Should fail: bet too large
        uint256 cost = 1001e6;
        token.approve(address(market), cost);

        vm.expectRevert("Bet too large for market");
        market.placeBet(flightId, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, cost);

        vm.stopPrank();
    }

    function testTinyBet() public {
        // Bet 0.01 USDC
        _placeBet(user1, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 0.01e6);

        // Should succeed and user should have position
        (uint256 yesShares,,) = market.getUserPosition(flightId, user1, SkyOdds.Outcome.OnTime);
        assertTrue(yesShares > 0, "Should have shares from tiny bet");
    }

    function testManyUsersOnSameOutcome() public {
        // 4 users all bet on OnTime
        _placeBet(user1, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 100e6);
        _placeBet(user2, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 100e6);
        _placeBet(user3, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 100e6);
        _placeBet(user4, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 100e6);

        // Resolve as OnTime
        vm.warp(marketCloseTime + 1);
        vm.prank(oracleResolver);
        market.resolveMarket(flightId, SkyOdds.Outcome.OnTime);

        // All should be able to claim
        uint256 totalPayouts = 0;

        uint256 user1Before = token.balanceOf(user1);
        vm.prank(user1);
        market.claimWinnings(flightId);
        totalPayouts += (token.balanceOf(user1) - user1Before);

        uint256 user2Before = token.balanceOf(user2);
        vm.prank(user2);
        market.claimWinnings(flightId);
        totalPayouts += (token.balanceOf(user2) - user2Before);

        uint256 user3Before = token.balanceOf(user3);
        vm.prank(user3);
        market.claimWinnings(flightId);
        totalPayouts += (token.balanceOf(user3) - user3Before);

        uint256 user4Before = token.balanceOf(user4);
        vm.prank(user4);
        market.claimWinnings(flightId);
        totalPayouts += (token.balanceOf(user4) - user4Before);

        // Total deposited: 400 USDC
        // After 2% pool fee: 392 USDC
        uint256 expectedTotal = 392e6;
        assertApproxEqRel(totalPayouts, expectedTotal, 0.01e18, "Total payout should match");

        // Each user should get approximately 98 USDC (400/4 * 0.98)
        uint256 user1Payout = token.balanceOf(user1) - user1Before;
        assertApproxEqRel(user1Payout, 98e6, 0.01e18, "Each user should get ~98 USDC");
    }

    function testEmptyMarketResolution() public {
        // Create a market with no bets
        uint256 scheduledDeparture = block.timestamp + 3 days;
        bytes32 emptyFlightId = market.createFlightMarket("DL300", "ATL", "MIA", "DL", scheduledDeparture, 100e6);

        (,,,, uint256 emptyMarketCloseTime,,) = market.getFlightInfo(emptyFlightId);

        // Resolve it
        vm.warp(emptyMarketCloseTime + 1);
        vm.prank(oracleResolver);
        market.resolveMarket(emptyFlightId, SkyOdds.Outcome.OnTime);

        // Should resolve successfully
        (,,,,, SkyOdds.Outcome outcome,) = market.getFlightInfo(emptyFlightId);
        assertEq(uint8(outcome), uint8(SkyOdds.Outcome.OnTime));
    }

    function testCreateMarket() public {
        uint256 scheduledDeparture = block.timestamp + 3 days;
        bytes32 newFlightId = market.createFlightMarket("UA200", "LAX", "ORD", "UA", scheduledDeparture, 100e6);

        (string memory flightNumber, string memory departureCode, string memory destinationCode,,,,) =
            market.getFlightInfo(newFlightId);

        assertEq(flightNumber, "UA200");
        assertEq(departureCode, "LAX");
        assertEq(destinationCode, "ORD");
    }

    function testClaimWinningsNoPosition() public {
        _placeBet(user1, SkyOdds.Outcome.OnTime, SkyOdds.Position.NO, 100e6);

        vm.warp(marketCloseTime + 1);
        vm.prank(oracleResolver);
        market.resolveMarket(flightId, SkyOdds.Outcome.Delayed30);

        uint256 balanceBefore = token.balanceOf(user1);
        vm.prank(user1);
        market.claimWinnings(flightId);
        uint256 balanceAfter = token.balanceOf(user1);

        assertTrue(balanceAfter > balanceBefore, "Should receive winnings for NO position");
    }

    function testMultipleUsersBetting() public {
        _placeBet(user1, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 100e6);
        _placeBet(user2, SkyOdds.Outcome.Delayed30, SkyOdds.Position.YES, 100e6);
        _placeBet(user3, SkyOdds.Outcome.OnTime, SkyOdds.Position.NO, 100e6);

        (uint256 user1Shares,,) = market.getUserPosition(flightId, user1, SkyOdds.Outcome.OnTime);
        (uint256 user2Shares,,) = market.getUserPosition(flightId, user2, SkyOdds.Outcome.Delayed30);
        (, uint256 user3NoShares,) = market.getUserPosition(flightId, user3, SkyOdds.Outcome.OnTime);

        assertTrue(user1Shares > 0, "User1 should have shares");
        assertTrue(user2Shares > 0, "User2 should have shares");
        assertTrue(user3NoShares > 0, "User3 should have NO shares");
    }

    // ============ Fee Management Tests ============

    function testWithdrawFees() public {
        // User1 bets 100 USDC
        _placeBet(user1, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 100e6);

        // Resolve and claim
        vm.warp(marketCloseTime + 1);
        vm.prank(oracleResolver);
        market.resolveMarket(flightId, SkyOdds.Outcome.OnTime);

        vm.prank(user1);
        market.claimWinnings(flightId);

        // Check fees collected (2% of 100 = 2 USDC)
        uint256 expectedFees = 2e6;
        assertEq(market.totalFeesCollected(), expectedFees, "Fees should be collected");
        assertEq(market.totalFeesWithdrawn(), 0, "Fees not withdrawn yet");

        // Withdraw fees
        uint256 ownerBalanceBefore = token.balanceOf(owner);
        market.withdrawFees(owner);
        uint256 ownerBalanceAfter = token.balanceOf(owner);

        assertEq(ownerBalanceAfter - ownerBalanceBefore, expectedFees, "Owner should receive fees");
        assertEq(market.totalFeesWithdrawn(), expectedFees, "Fees withdrawn should be tracked");
    }

    function testWithdrawFeesMultipleMarkets() public {
        // Create second market
        uint256 scheduledDeparture2 = block.timestamp + 3 days;
        bytes32 flightId2 = market.createFlightMarket("UA200", "LAX", "ORD", "UA", scheduledDeparture2, 100e6);
        (,,,, uint256 marketCloseTime2,,) = market.getFlightInfo(flightId2);

        // Bet on market 1
        _placeBet(user1, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 100e6);

        // Bet on market 2
        vm.startPrank(user2);
        token.approve(address(market), 150e6);
        market.placeBet(flightId2, SkyOdds.Outcome.Delayed30, SkyOdds.Position.YES, 150e6);
        vm.stopPrank();

        // Resolve both markets
        vm.warp(marketCloseTime2 + 1);
        vm.prank(oracleResolver);
        market.resolveMarket(flightId, SkyOdds.Outcome.OnTime);
        vm.prank(oracleResolver);
        market.resolveMarket(flightId2, SkyOdds.Outcome.Delayed30);

        // Claim from both
        vm.prank(user1);
        market.claimWinnings(flightId);
        vm.prank(user2);
        market.claimWinnings(flightId2);

        // Total fees: 2% of (100 + 150) = 5 USDC
        uint256 expectedTotalFees = 5e6;
        assertEq(market.totalFeesCollected(), expectedTotalFees, "Total fees from both markets");

        // Withdraw all fees
        uint256 ownerBalanceBefore = token.balanceOf(owner);
        market.withdrawFees(owner);
        uint256 ownerBalanceAfter = token.balanceOf(owner);

        assertEq(ownerBalanceAfter - ownerBalanceBefore, expectedTotalFees, "Owner receives all fees");
    }

    function testWithdrawFeesOnlyAdmin() public {
        // Setup: collect some fees
        _placeBet(user1, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 100e6);
        vm.warp(marketCloseTime + 1);
        vm.prank(oracleResolver);
        market.resolveMarket(flightId, SkyOdds.Outcome.OnTime);
        vm.prank(user1);
        market.claimWinnings(flightId);

        // Non-admin tries to withdraw
        vm.prank(user2);
        vm.expectRevert();
        market.withdrawFees(user2);

        // Owner can withdraw
        market.withdrawFees(owner);
        assertEq(market.totalFeesWithdrawn(), 2e6, "Owner successfully withdrew");
    }

    function testCannotWithdrawFeesWhenNone() public {
        // Try withdrawing before any fees collected
        vm.expectRevert("No fees to withdraw");
        market.withdrawFees(owner);
    }

    function testCannotWithdrawFeesTwice() public {
        // Collect fees
        _placeBet(user1, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 100e6);
        vm.warp(marketCloseTime + 1);
        vm.prank(oracleResolver);
        market.resolveMarket(flightId, SkyOdds.Outcome.OnTime);
        vm.prank(user1);
        market.claimWinnings(flightId);

        // Withdraw once
        market.withdrawFees(owner);

        // Try withdrawing again
        vm.expectRevert("No fees to withdraw");
        market.withdrawFees(owner);
    }

    function testFeesAccumulateCorrectly() public {
        // User1 bets and claims
        _placeBet(user1, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 100e6);

        // User2 bets
        _placeBet(user2, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 150e6);

        // Resolve
        vm.warp(marketCloseTime + 1);
        vm.prank(oracleResolver);
        market.resolveMarket(flightId, SkyOdds.Outcome.OnTime);

        // User1 claims
        vm.prank(user1);
        market.claimWinnings(flightId);

        uint256 feesAfterUser1 = market.totalFeesCollected();
        assertTrue(feesAfterUser1 > 0, "Fees should accumulate after user1");

        // User2 claims
        vm.prank(user2);
        market.claimWinnings(flightId);

        uint256 feesAfterUser2 = market.totalFeesCollected();
        assertTrue(feesAfterUser2 > feesAfterUser1, "Fees should accumulate after user2");

        // Total fees should be ~2% of 250 USDC = 5 USDC
        assertApproxEqRel(feesAfterUser2, 5e6, 0.01e18, "Total fees approximately 5 USDC");
    }

    function testPartialFeeWithdrawal() public {
        // Collect fees from market 1
        _placeBet(user1, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 100e6);
        vm.warp(marketCloseTime + 1);
        vm.prank(oracleResolver);
        market.resolveMarket(flightId, SkyOdds.Outcome.OnTime);
        vm.prank(user1);
        market.claimWinnings(flightId);

        // Withdraw fees (2 USDC)
        market.withdrawFees(owner);
        assertEq(market.totalFeesWithdrawn(), 2e6, "First withdrawal");

        // Create and resolve second market
        uint256 scheduledDeparture2 = block.timestamp + 1 days;
        bytes32 flightId2 = market.createFlightMarket("UA200", "LAX", "ORD", "UA", scheduledDeparture2, 100e6);
        (,,,, uint256 marketCloseTime2,,) = market.getFlightInfo(flightId2);

        vm.startPrank(user2);
        token.approve(address(market), 100e6);
        market.placeBet(flightId2, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 100e6);
        vm.stopPrank();

        vm.warp(marketCloseTime2 + 1);
        vm.prank(oracleResolver);
        market.resolveMarket(flightId2, SkyOdds.Outcome.OnTime);
        vm.prank(user2);
        market.claimWinnings(flightId2);

        // Withdraw again (another 2 USDC)
        uint256 ownerBalanceBefore = token.balanceOf(owner);
        market.withdrawFees(owner);
        uint256 ownerBalanceAfter = token.balanceOf(owner);

        assertEq(ownerBalanceAfter - ownerBalanceBefore, 2e6, "Second withdrawal amount");
        assertEq(market.totalFeesWithdrawn(), 4e6, "Total withdrawn after two withdrawals");
    }

    // ============ Access Control Tests ============

    function testGrantAdminRole() public {
        bytes32 adminRole = market.ADMIN_ROLE();

        // Owner grants admin role to admin2
        market.grantRole(adminRole, admin2);

        // Verify admin2 has role
        assertTrue(market.hasRole(adminRole, admin2), "admin2 should have ADMIN_ROLE");

        // admin2 can create markets
        vm.prank(admin2);
        bytes32 newFlightId = market.createFlightMarket("DL100", "ATL", "MIA", "DL", block.timestamp + 2 days, 100e6);

        (string memory flightNumber,,,,,,) = market.getFlightInfo(newFlightId);
        assertEq(flightNumber, "DL100", "Admin2 created market successfully");
    }

    function testRevokeAdminRole() public {
        bytes32 adminRole = market.ADMIN_ROLE();

        // Grant then revoke
        market.grantRole(adminRole, admin2);
        market.revokeRole(adminRole, admin2);

        // Verify admin2 no longer has role
        assertFalse(market.hasRole(adminRole, admin2), "admin2 should not have ADMIN_ROLE");

        // admin2 cannot create markets
        vm.prank(admin2);
        vm.expectRevert();
        market.createFlightMarket("DL100", "ATL", "MIA", "DL", block.timestamp + 2 days, 100e6);
    }

    function testNonAdminCannotCreateMarket() public {
        // Regular user tries to create market
        vm.prank(user1);
        vm.expectRevert();
        market.createFlightMarket("DL100", "ATL", "MIA", "DL", block.timestamp + 2 days, 100e6);
    }

    function testNonAdminCannotCancelMarket() public {
        // Regular user tries to cancel market
        vm.prank(user1);
        vm.expectRevert();
        market.cancelMarket(flightId, "Testing");
    }

    function testAdminCanCancelMarket() public {
        bytes32 adminRole = market.ADMIN_ROLE();
        market.grantRole(adminRole, admin2);

        // Admin2 can cancel market
        vm.prank(admin2);
        market.cancelMarket(flightId, "Admin cancellation test");

        (,,,,,, bool isCancelled) = market.getFlightInfo(flightId);
        assertTrue(isCancelled, "Market should be cancelled");
    }

    // ============ Edge Case Tests ============

    function testNoWinnersScenario() public {
        // Everyone bets on OnTime
        _placeBet(user1, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 100e6);
        _placeBet(user2, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 150e6);
        _placeBet(user3, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 200e6);

        uint256 totalDeposited = 450e6;

        // Resolve as Delayed30 (no one bet on this)
        vm.warp(marketCloseTime + 1);
        vm.prank(oracleResolver);
        market.resolveMarket(flightId, SkyOdds.Outcome.Delayed30);

        // No one can claim
        vm.prank(user1);
        vm.expectRevert("No winnings");
        market.claimWinnings(flightId);

        vm.prank(user2);
        vm.expectRevert("No winnings");
        market.claimWinnings(flightId);

        // All funds stay in contract
        uint256 contractBalance = token.balanceOf(address(market));
        assertEq(contractBalance, totalDeposited, "All funds stuck in contract");

        // No fees collected (since no claims)
        assertEq(market.totalFeesCollected(), 0, "No fees collected when no winners");
    }

    function testSingleWinnerGetsEntirePool() public {
        // User1 bets on OnTime
        _placeBet(user1, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 100e6);

        // User2 and User3 bet on Delayed30
        _placeBet(user2, SkyOdds.Outcome.Delayed30, SkyOdds.Position.YES, 150e6);
        _placeBet(user3, SkyOdds.Outcome.Delayed30, SkyOdds.Position.YES, 200e6);

        uint256 totalPool = 450e6;

        // Resolve as OnTime (only user1 wins)
        vm.warp(marketCloseTime + 1);
        vm.prank(oracleResolver);
        market.resolveMarket(flightId, SkyOdds.Outcome.OnTime);

        // User1 claims
        uint256 user1BalanceBefore = token.balanceOf(user1);
        vm.prank(user1);
        market.claimWinnings(flightId);
        uint256 user1BalanceAfter = token.balanceOf(user1);

        uint256 payout = user1BalanceAfter - user1BalanceBefore;
        uint256 expectedPayout = (totalPool * 98) / 100; // 450 * 0.98 = 441

        assertApproxEqRel(payout, expectedPayout, 0.01e18, "Single winner gets entire pool minus fees");

        // Others cannot claim
        vm.prank(user2);
        vm.expectRevert("No winnings");
        market.claimWinnings(flightId);
    }

    function testMixedYesNoPositions() public {
        // User1: YES on OnTime
        _placeBet(user1, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 100e6);

        // User2: NO on OnTime (bets it won't be on time)
        _placeBet(user2, SkyOdds.Outcome.OnTime, SkyOdds.Position.NO, 150e6);

        // User3: YES on Delayed30
        _placeBet(user3, SkyOdds.Outcome.Delayed30, SkyOdds.Position.YES, 200e6);

        // Resolve as Delayed30
        vm.warp(marketCloseTime + 1);
        vm.prank(oracleResolver);
        market.resolveMarket(flightId, SkyOdds.Outcome.Delayed30);

        // Winners: User2 (NO on OnTime) and User3 (YES on Delayed30)
        uint256 user2BalanceBefore = token.balanceOf(user2);
        vm.prank(user2);
        market.claimWinnings(flightId);
        uint256 user2Payout = token.balanceOf(user2) - user2BalanceBefore;

        uint256 user3BalanceBefore = token.balanceOf(user3);
        vm.prank(user3);
        market.claimWinnings(flightId);
        uint256 user3Payout = token.balanceOf(user3) - user3BalanceBefore;

        // Total pool: 450, Prize pool: 441 (after 2% fee)
        // Winners split by cost: user2 (150) + user3 (200) = 350 total
        // user2 gets: (150/350) * 441 = 189
        // user3 gets: (200/350) * 441 = 252

        assertApproxEqRel(user2Payout, 189e6, 0.01e18, "User2 payout");
        assertApproxEqRel(user3Payout, 252e6, 0.01e18, "User3 payout");

        // User1 (loser) cannot claim
        vm.prank(user1);
        vm.expectRevert("No winnings");
        market.claimWinnings(flightId);
    }

    function testContractBalanceAfterFullCycle() public {
        uint256 initialContractBalance = token.balanceOf(address(market));

        // Users bet
        _placeBet(user1, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 100e6);
        _placeBet(user2, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 100e6);

        // Contract should have all bets
        assertEq(token.balanceOf(address(market)), initialContractBalance + 200e6, "Contract holds bets");

        // Resolve and claim
        vm.warp(marketCloseTime + 1);
        vm.prank(oracleResolver);
        market.resolveMarket(flightId, SkyOdds.Outcome.OnTime);

        vm.prank(user1);
        market.claimWinnings(flightId);
        vm.prank(user2);
        market.claimWinnings(flightId);

        // Contract should have fees left
        uint256 expectedFeesRemaining = 4e6; // 2% of 200
        assertEq(
            token.balanceOf(address(market)), initialContractBalance + expectedFeesRemaining, "Contract holds fees"
        );

        // Withdraw fees
        market.withdrawFees(owner);

        // Contract balance should return to initial (or close)
        assertApproxEqAbs(
            token.balanceOf(address(market)),
            initialContractBalance,
            1, // Allow 1 wei rounding error
            "Contract balance cleared after fee withdrawal"
        );
    }

    // ============ Helper Functions ============

    function _placeBet(address user, SkyOdds.Outcome outcome, SkyOdds.Position position, uint256 cost) internal {
        vm.startPrank(user);
        token.approve(address(market), cost);
        market.placeBet(flightId, outcome, position, cost);
        vm.stopPrank();
    }
}
