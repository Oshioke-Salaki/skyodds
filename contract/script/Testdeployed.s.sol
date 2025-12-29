// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SkyOdds.sol";
import "../src/mock/MockERC20.sol";

contract TestDeployedContract is Script {
    // Replace with your deployed addresses
    address constant TOKEN_ADDRESS = 0xFAEC032f2E8c85Da9d04b06947a6BdCf02Ad7a71;
    address constant SKYODDS_ADDRESS = 0x8B87E271FB390FE7db2CE154e49096f72f6BE507;

    MockERC20 token;
    SkyOdds market;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        token = MockERC20(TOKEN_ADDRESS);
        market = SkyOdds(SKYODDS_ADDRESS);

        console.log("=== Testing SkyOdds Contract ===");
        console.log("Your address:", deployer);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Get test tokens
        console.log("Step 1: Getting test tokens...");
        uint256 balanceBefore = token.balanceOf(deployer);
        console.log("Balance before:", balanceBefore);

        token.faucet(1000e6); // Get 1000 USDC

        uint256 balanceAfter = token.balanceOf(deployer);
        console.log("Balance after:", balanceAfter);
        console.log("SUCCESS: Got test tokens!");
        console.log("");

        // Step 2: Create a new test market
        console.log("Step 2: Creating new test market...");
        bytes32 flightId = market.createFlightMarket("TEST123", "JFK", "LAX", "AA", block.timestamp + 2 hours, 0);
        console.log("Market created:", vm.toString(flightId));
        console.log("");

        // Step 3: Check market info
        console.log("Step 3: Checking market info...");
        (
            string memory flightNumber,
            string memory departureCode,
            string memory destinationCode,
            uint256 scheduledDeparture,
            uint256 marketCloseTime,
            SkyOdds.Outcome outcome,
            bool isCancelled
        ) = market.getFlightInfo(flightId);

        console.log("Flight Number:", flightNumber);
        console.log("Route:", string.concat(departureCode, " -> ", destinationCode));
        console.log("Scheduled Departure:", scheduledDeparture);
        console.log("Market Close Time:", marketCloseTime);
        console.log("Current Time:", block.timestamp);
        console.log("Outcome:", uint8(outcome));
        console.log("Is Cancelled:", isCancelled);
        console.log("");

        // Step 4: Check initial prices
        console.log("Step 4: Checking initial prices...");
        (uint256 p1, uint256 p2, uint256 p3, uint256 p4) = market.getAllPrices(flightId);
        console.log("OnTime price:", p1);
        console.log("Delayed30 price:", p2);
        console.log("Delayed120+ price:", p3);
        console.log("Cancelled price:", p4);
        console.log("(Should all be 250000000000000000 = 25%)");
        console.log("");

        // Step 5: Place a bet
        console.log("Step 5: Placing bet...");
        console.log("Betting 100 USDC on OnTime (YES)");

        // Place bet
        SkyOdds.Outcome betOutcome = SkyOdds.Outcome.OnTime;
        SkyOdds.Position betPosition = SkyOdds.Position.YES;
        uint256 betAmount = 100e6;

        // Approve tokens
        token.approve(SKYODDS_ADDRESS, betAmount);
        console.log("Approved tokens");

        market.placeBet(flightId, betOutcome, betPosition, betAmount);
        console.log("SUCCESS: Bet placed!");
        console.log("");

        // Step 6: Check position
        console.log("Step 6: Checking your position...");
        (uint256 yesShares, uint256 noShares, uint256 totalCost) =
            market.getUserPosition(flightId, deployer, betOutcome);

        console.log("Your YES shares:", yesShares);
        console.log("Your NO shares:", noShares);
        console.log("Your total cost:", totalCost);
        console.log("");

        // Step 7: Check updated prices
        console.log("Step 7: Checking updated prices...");
        (p1, p2, p3, p4) = market.getAllPrices(flightId);
        console.log("OnTime price:", p1, "(should be higher now)");
        console.log("Delayed30 price:", p2);
        console.log("Delayed120+ price:", p3);
        console.log("Cancelled price:", p4);
        console.log("");

        // Step 8: Check market shares
        console.log("Step 8: Checking market shares...");
        (uint256 s1, uint256 s2, uint256 s3, uint256 s4) = market.getMarketShares(flightId);
        console.log("OnTime shares:", s1);
        console.log("Delayed30 shares:", s2);
        console.log("Delayed120+ shares:", s3);
        console.log("Cancelled shares:", s4);
        console.log("");

        // Step 9: Check fee tracking
        console.log("Step 9: Checking fee tracking...");
        console.log("Total fees collected:", market.totalFeesCollected());
        console.log("Total fees withdrawn:", market.totalFeesWithdrawn());
        console.log("(No fees yet - none claimed)");
        console.log("");

        // Step 10: Test resolution and claiming
        console.log("Step 10: Testing resolution and claiming...");

        // Fast forward time past market close
        vm.warp(marketCloseTime + 1);
        console.log("Time warped past market close");

        // Resolve market (OnTime wins)
        market.resolveMarket(flightId, SkyOdds.Outcome.OnTime);
        console.log("Market resolved: OnTime");

        // Claim winnings
        uint256 balanceBeforeClaim = token.balanceOf(deployer);
        market.claimWinnings(flightId);
        uint256 balanceAfterClaim = token.balanceOf(deployer);

        uint256 payout = balanceAfterClaim - balanceBeforeClaim;
        console.log("Payout received:", payout);
        console.log("Expected: ~98 USDC (100 - 2% fee)");

        // Check fees collected
        uint256 feesCollected = market.totalFeesCollected();
        console.log("Fees collected:", feesCollected);
        console.log("Expected: ~2 USDC (2% of 100)");
        console.log("");

        // Step 11: Test fee withdrawal
        console.log("Step 11: Testing fee withdrawal...");
        uint256 balanceBeforeWithdraw = token.balanceOf(deployer);
        market.withdrawFees(deployer);
        uint256 balanceAfterWithdraw = token.balanceOf(deployer);

        uint256 feesWithdrawn = balanceAfterWithdraw - balanceBeforeWithdraw;
        console.log("Fees withdrawn:", feesWithdrawn);
        console.log("Total fees withdrawn:", market.totalFeesWithdrawn());
        console.log("");

        vm.stopBroadcast();

        console.log("=== ALL TESTS PASSED! ===");
        console.log("");
    }
}
