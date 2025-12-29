// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SkyOdds.sol";
import "../src/mock/MockERC20.sol";

/**
 * @title SkyOddsIntegrationTest
 * @notice End-to-end integration tests simulating real-world usage scenarios
 * @dev Tests complete workflows from market creation to fee withdrawal
 */
contract SkyOddsIntegrationTest is Test {
    SkyOdds public market;
    MockERC20 public token;

    address public owner;
    address public oracleResolver;
    address public admin1;
    address public bettor1;
    address public bettor2;
    address public bettor3;
    address public bettor4;
    address public bettor5;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    function setUp() public {
        owner = address(this);
        oracleResolver = makeAddr("oracle");
        admin1 = makeAddr("admin1");
        bettor1 = makeAddr("bettor1");
        bettor2 = makeAddr("bettor2");
        bettor3 = makeAddr("bettor3");
        bettor4 = makeAddr("bettor4");
        bettor5 = makeAddr("bettor5");

        // Deploy contracts
        token = new MockERC20();
        market = new SkyOdds(address(token), oracleResolver);

        // Fund bettors
        token.mint(bettor1, 10000e6);
        token.mint(bettor2, 10000e6);
        token.mint(bettor3, 10000e6);
        token.mint(bettor4, 10000e6);
        token.mint(bettor5, 10000e6);

        // Grant admin role to admin1
        market.grantRole(ADMIN_ROLE, admin1);
    }

    // ============ Complete User Journey Tests ============

    function testCompleteUserJourney() public {
        console.log("=== Testing Complete User Journey ===");

        // 1. Admin creates market
        vm.prank(admin1);
        uint256 scheduledDeparture = block.timestamp + 2 days;
        bytes32 flightId = market.createFlightMarket("AA100", "JFK", "LAX", "AA", scheduledDeparture, 0);
        console.log("Step 1: Market created");

        // 2. Multiple users place bets
        _placeBet(bettor1, flightId, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 100e6);
        _placeBet(bettor2, flightId, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 200e6);
        _placeBet(bettor3, flightId, SkyOdds.Outcome.Delayed30, SkyOdds.Position.YES, 150e6);
        _placeBet(bettor4, flightId, SkyOdds.Outcome.OnTime, SkyOdds.Position.NO, 100e6);
        console.log("Step 2: Users placed bets (total: 550 USDC)");

        // 3. Check market state
        (uint256 p1, uint256 p2,,) = market.getAllPrices(flightId);
        console.log("Step 3: Market prices updated");
        console.log("  OnTime price:", p1);
        console.log("  Delayed30 price:", p2);

        // 4. Market closes and oracle resolves
        (,,,, uint256 marketCloseTime,,) = market.getFlightInfo(flightId);
        vm.warp(marketCloseTime + 1);

        vm.prank(oracleResolver);
        market.resolveMarket(flightId, SkyOdds.Outcome.OnTime);
        console.log("Step 4: Market resolved as OnTime");

        // 5. Winners claim
        uint256 totalPaidOut = 0;

        vm.prank(bettor1);
        market.claimWinnings(flightId);
        uint256 payout1 = token.balanceOf(bettor1) - (10000e6 - 100e6);
        totalPaidOut += payout1;
        console.log("Step 5a: Bettor1 claimed:", payout1);

        vm.prank(bettor2);
        market.claimWinnings(flightId);
        uint256 payout2 = token.balanceOf(bettor2) - (10000e6 - 200e6);
        totalPaidOut += payout2;
        console.log("Step 5b: Bettor2 claimed:", payout2);

        // 6. Check fees
        uint256 feesCollected = market.totalFeesCollected();
        console.log("Step 6: Fees collected:", feesCollected);

        uint256 expectedFees = (550e6 * 200) / 10000; // 2% of total pool
        // assertEq(feesCollected, expectedFees, "Fees should be 2% of pool");
        assertApproxEqAbs(feesCollected, expectedFees, 1, "Fees should be 2% of pool");

        // 7. Conservation of funds
        assertApproxEqRel(550e6, totalPaidOut + feesCollected, 0.001e18, "Total in = Total out + Fees");
        console.log("Step 7: Conservation verified");

        // 8. Owner withdraws fees
        uint256 ownerBalanceBefore = token.balanceOf(owner);
        market.withdrawFees(owner);
        uint256 ownerBalanceAfter = token.balanceOf(owner);

        assertEq(ownerBalanceAfter - ownerBalanceBefore, feesCollected, "Owner received fees");
        console.log("Step 8: Fees withdrawn to owner");

        console.log("=== Complete User Journey: PASSED ===\n");
    }

    function testMultipleMarketsSimultaneously() public {
        console.log("=== Testing Multiple Markets Simultaneously ===");

        // Create 3 markets
        uint256 dep1 = block.timestamp + 2 days;
        uint256 dep2 = block.timestamp + 3 days;
        uint256 dep3 = block.timestamp + 4 days;

        bytes32 flight1 = market.createFlightMarket("AA100", "JFK", "LAX", "AA", dep1, 0);
        bytes32 flight2 = market.createFlightMarket("UA200", "ORD", "SFO", "UA", dep2, 0);
        bytes32 flight3 = market.createFlightMarket("DL300", "ATL", "MIA", "DL", dep3, 0);
        console.log("Created 3 markets");

        // Bets on all markets
        _placeBet(bettor1, flight1, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 100e6);
        _placeBet(bettor2, flight2, SkyOdds.Outcome.Delayed30, SkyOdds.Position.YES, 200e6);
        _placeBet(bettor3, flight3, SkyOdds.Outcome.Cancelled, SkyOdds.Position.YES, 300e6);
        console.log("Placed bets on all 3 markets");

        // Resolve all differently
        (,,,, uint256 close1,,) = market.getFlightInfo(flight1);
        vm.warp(close1 + 1);
        vm.prank(oracleResolver);
        market.resolveMarket(flight1, SkyOdds.Outcome.OnTime);

        (,,,, uint256 close2,,) = market.getFlightInfo(flight2);
        vm.warp(close2 + 1);
        vm.prank(oracleResolver);
        market.resolveMarket(flight2, SkyOdds.Outcome.Delayed30);

        (,,,, uint256 close3,,) = market.getFlightInfo(flight3);
        vm.warp(close3 + 1);
        vm.prank(oracleResolver);
        market.resolveMarket(flight3, SkyOdds.Outcome.Cancelled);

        console.log("Resolved all 3 markets");

        // All claim
        vm.prank(bettor1);
        market.claimWinnings(flight1);

        vm.prank(bettor2);
        market.claimWinnings(flight2);

        vm.prank(bettor3);
        market.claimWinnings(flight3);

        console.log("All winners claimed");

        // Check total fees
        uint256 totalFees = market.totalFeesCollected();
        uint256 expectedTotalFees = ((100e6 + 200e6 + 300e6) * 200) / 10000;
        assertEq(totalFees, expectedTotalFees, "Fees from all markets");

        console.log("Total fees collected:", totalFees);
        console.log("=== Multiple Markets: PASSED ===\n");
    }

    function testHighVolumeMarket() public {
        console.log("=== Testing High Volume Market ===");

        // Create market
        bytes32 flightId = market.createFlightMarket("AA100", "JFK", "LAX", "AA", block.timestamp + 2 days, 0);

        // 5 bettors with different amounts
        _placeBet(bettor1, flightId, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 500e6);
        _placeBet(bettor2, flightId, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 300e6);
        _placeBet(bettor3, flightId, SkyOdds.Outcome.Delayed30, SkyOdds.Position.YES, 400e6);
        _placeBet(bettor4, flightId, SkyOdds.Outcome.OnTime, SkyOdds.Position.NO, 200e6);
        _placeBet(bettor5, flightId, SkyOdds.Outcome.Cancelled, SkyOdds.Position.YES, 100e6);

        console.log("5 users bet total: 1500 USDC");

        // Check total pool
        uint256 totalPool = market.totalPoolAmount(flightId);
        assertEq(totalPool, 1500e6, "Pool should be 1500 USDC");

        // Resolve
        (,,,, uint256 marketCloseTime,,) = market.getFlightInfo(flightId);
        vm.warp(marketCloseTime + 1);
        vm.prank(oracleResolver);
        market.resolveMarket(flightId, SkyOdds.Outcome.OnTime);

        // Winners claim
        vm.prank(bettor1);
        market.claimWinnings(flightId);

        vm.prank(bettor2);
        market.claimWinnings(flightId);

        // Verify fees
        uint256 expectedFees = (1500e6 * 200) / 10000;
        assertEq(market.totalFeesCollected(), expectedFees, "Fees should be 2% of 1500");

        console.log("Fees collected:", market.totalFeesCollected());
        console.log("=== High Volume Market: PASSED ===\n");
    }

    function testMarketCancellationWorkflow() public {
        console.log("=== Testing Market Cancellation Workflow ===");

        // Create market
        bytes32 flightId = market.createFlightMarket("AA100", "JFK", "LAX", "AA", block.timestamp + 2 days, 0);

        // Users bet
        _placeBet(bettor1, flightId, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 100e6);
        _placeBet(bettor2, flightId, SkyOdds.Outcome.Delayed30, SkyOdds.Position.YES, 200e6);
        console.log("Users placed bets");

        // Admin cancels market
        vm.prank(admin1);
        market.cancelMarket(flightId, "Flight cancelled by airline");
        console.log("Market cancelled by admin");

        // Users withdraw
        uint256 bal1Before = token.balanceOf(bettor1);
        vm.prank(bettor1);
        market.withdrawFromCancelledMarket(flightId);
        assertEq(token.balanceOf(bettor1) - bal1Before, 100e6, "Full refund for bettor1");

        uint256 bal2Before = token.balanceOf(bettor2);
        vm.prank(bettor2);
        market.withdrawFromCancelledMarket(flightId);
        assertEq(token.balanceOf(bettor2) - bal2Before, 200e6, "Full refund for bettor2");

        console.log("All users got full refunds");

        // No fees collected
        assertEq(market.totalFeesCollected(), 0, "No fees on cancelled market");

        console.log("=== Market Cancellation: PASSED ===\n");
    }

    function testAdminRoleManagement() public {
        console.log("=== Testing Admin Role Management ===");

        // Admin1 can create markets
        vm.prank(admin1);
        bytes32 flight1 = market.createFlightMarket("AA100", "JFK", "LAX", "AA", block.timestamp + 2 days, 0);
        assertTrue(flight1 != bytes32(0), "Admin1 created market");

        // Regular user cannot
        vm.prank(bettor1);
        vm.expectRevert();
        market.createFlightMarket("UA200", "ORD", "SFO", "UA", block.timestamp + 3 days, 0);
        console.log("Regular user blocked from creating market");

        // Owner grants role to bettor1
        market.grantRole(ADMIN_ROLE, bettor1);

        // Now bettor1 can create
        vm.prank(bettor1);
        bytes32 flight2 = market.createFlightMarket("UA200", "ORD", "SFO", "UA", block.timestamp + 3 days, 0);
        assertTrue(flight2 != bytes32(0), "Bettor1 created market after role grant");

        // Owner revokes role
        market.revokeRole(ADMIN_ROLE, bettor1);

        // Bettor1 can no longer create
        vm.prank(bettor1);
        vm.expectRevert();
        market.createFlightMarket("DL300", "ATL", "MIA", "DL", block.timestamp + 4 days, 0);
        console.log("Bettor1 blocked after role revoked");

        console.log("=== Admin Role Management: PASSED ===\n");
    }

    function testFeeWithdrawalAcrossMultipleClaims() public {
        console.log("=== Testing Fee Withdrawal Across Multiple Claims ===");

        bytes32 flightId = market.createFlightMarket("AA100", "JFK", "LAX", "AA", block.timestamp + 2 days, 0);

        // 3 users bet
        _placeBet(bettor1, flightId, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 100e6);
        _placeBet(bettor2, flightId, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 200e6);
        _placeBet(bettor3, flightId, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 300e6);

        // Resolve
        (,,,, uint256 marketCloseTime,,) = market.getFlightInfo(flightId);
        vm.warp(marketCloseTime + 1);
        vm.prank(oracleResolver);
        market.resolveMarket(flightId, SkyOdds.Outcome.OnTime);

        // Bettor1 claims
        vm.prank(bettor1);
        market.claimWinnings(flightId);
        uint256 feesAfter1 = market.totalFeesCollected();
        console.log("Fees after claim 1:", feesAfter1);

        // Owner withdraws partial fees
        market.withdrawFees(owner);
        assertEq(market.totalFeesWithdrawn(), feesAfter1, "Partial withdrawal");

        // Bettor2 claims
        vm.prank(bettor2);
        market.claimWinnings(flightId);
        uint256 feesAfter2 = market.totalFeesCollected();
        console.log("Fees after claim 2:", feesAfter2);
        assertTrue(feesAfter2 > feesAfter1, "More fees accumulated");

        // Bettor3 claims
        vm.prank(bettor3);
        market.claimWinnings(flightId);
        uint256 finalFees = market.totalFeesCollected();
        console.log("Final fees:", finalFees);

        // Withdraw remaining
        market.withdrawFees(owner);
        assertEq(market.totalFeesWithdrawn(), finalFees, "All fees withdrawn");

        console.log("=== Fee Withdrawal: PASSED ===\n");
    }

    function testNoWinnersScenario() public {
        console.log("=== Testing No Winners Scenario ===");

        bytes32 flightId = market.createFlightMarket("AA100", "JFK", "LAX", "AA", block.timestamp + 2 days, 0);

        // Everyone bets on OnTime
        _placeBet(bettor1, flightId, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 100e6);
        _placeBet(bettor2, flightId, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 200e6);
        _placeBet(bettor3, flightId, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 300e6);

        console.log("All users bet on OnTime (total: 600 USDC)");

        // Resolve as Delayed30 (no one wins!)
        (,,,, uint256 marketCloseTime,,) = market.getFlightInfo(flightId);
        vm.warp(marketCloseTime + 1);
        vm.prank(oracleResolver);
        market.resolveMarket(flightId, SkyOdds.Outcome.Delayed30);

        console.log("Resolved as Delayed30 (everyone loses)");

        // No one can claim
        vm.prank(bettor1);
        vm.expectRevert("No winnings");
        market.claimWinnings(flightId);

        vm.prank(bettor2);
        vm.expectRevert("No winnings");
        market.claimWinnings(flightId);

        // All funds stay in contract
        uint256 contractBalance = token.balanceOf(address(market));
        assertEq(contractBalance, 600e6, "All funds trapped in contract");

        // No fees collected (no one claimed)
        assertEq(market.totalFeesCollected(), 0, "No fees without claims");

        console.log("Funds remain in contract as protocol revenue");
        console.log("Contract balance:", contractBalance);
        console.log("=== No Winners Scenario: PASSED ===\n");
    }

    function testPriceDiscoveryDynamics() public {
        console.log("=== Testing Price Discovery Dynamics ===");

        bytes32 flightId = market.createFlightMarket("AA100", "JFK", "LAX", "AA", block.timestamp + 2 days, 0);

        // Initial prices (should be 25% each)
        (uint256 p1, uint256 p2, uint256 p3, uint256 p4) = market.getAllPrices(flightId);
        assertEq(p1, 25e16, "Initial OnTime: 25%");
        assertEq(p2, 25e16, "Initial Delayed30: 25%");
        console.log("Initial prices all at 25%");

        // Large bet on OnTime
        _placeBet(bettor1, flightId, SkyOdds.Outcome.OnTime, SkyOdds.Position.YES, 500e6);

        (p1, p2, p3, p4) = market.getAllPrices(flightId);
        console.log("After 500 USDC on OnTime:");
        console.log("  OnTime price:", p1);
        console.log("  Delayed30 price:", p2);
        assertTrue(p1 > 25e16, "OnTime price increased");
        assertTrue(p2 < 25e16, "Others decreased");

        // Opposite bet
        _placeBet(bettor2, flightId, SkyOdds.Outcome.Delayed30, SkyOdds.Position.YES, 300e6);

        (p1, p2,,) = market.getAllPrices(flightId);
        console.log("After 300 USDC on Delayed30:");
        console.log("  OnTime price:", p1);
        console.log("  Delayed30 price:", p2);

        console.log("=== Price Discovery: PASSED ===\n");
    }

    // ============ Helper Function ============

    function _placeBet(address user, bytes32 flightId, SkyOdds.Outcome outcome, SkyOdds.Position position, uint256 cost)
        internal
    {
        vm.startPrank(user);
        token.approve(address(market), cost);
        market.placeBet(flightId, outcome, position, cost);
        vm.stopPrank();
    }
}
