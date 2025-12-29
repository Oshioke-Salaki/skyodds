// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SkyOdds.sol";
import "../src/mock/MockERC20.sol";

contract GetFlightInfo is Script {
    address constant SKYODDS_ADDRESS = 0x8B87E271FB390FE7db2CE154e49096f72f6BE507;
    bytes32 constant FLIGHT_ID = 0x2e251cc3973af2232e0b0f806c529ab96bdc66b87716f38334efa4673d1bd1de;

    function run() external {
        vm.startBroadcast();

        SkyOdds market = SkyOdds(SKYODDS_ADDRESS);

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
        ) = market.getFlightInfo(FLIGHT_ID);

        console.log("Flight Number:", flightNumber);
        console.log("Route:", string.concat(departureCode, " -> ", destinationCode));
        console.log("Scheduled Departure:", scheduledDeparture);
        console.log("Market Close Time:", marketCloseTime);
        console.log("Current Time:", block.timestamp);
        console.log("Outcome:", uint8(outcome));
        console.log("Is Cancelled:", isCancelled);
        console.log("");

        vm.stopBroadcast();
    }
}
