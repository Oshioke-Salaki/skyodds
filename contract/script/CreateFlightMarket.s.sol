// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SkyOdds.sol";
import "../src/mock/MockERC20.sol";

contract GetFlightInfo is Script {
    address constant SKYODDS_ADDRESS = 0x8B87E271FB390FE7db2CE154e49096f72f6BE507;

    function run() external {
        vm.startBroadcast();

        SkyOdds market = SkyOdds(SKYODDS_ADDRESS);

        // Create a new test market
        console.log("Step 2: Creating new test market...");
        bytes32 flightId = market.createFlightMarket("TEST456", "JFK", "LAX", "AA", block.timestamp + 2 hours, 0);
        console.log("Market created:", vm.toString(flightId));
        console.log("");

        // Check market info
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

        // Check initial prices
        console.log("Step 4: Checking initial prices...");
        (uint256 p1, uint256 p2, uint256 p3, uint256 p4) = market.getAllPrices(flightId);
        console.log("OnTime price:", p1);
        console.log("Delayed30 price:", p2);
        console.log("Delayed120+ price:", p3);
        console.log("Cancelled price:", p4);
        console.log("(Should all be 250000000000000000 = 25%)");
        console.log("");

        vm.stopBroadcast();
    }
}
