// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SkyOdds.sol";
import "../src/mock/MockERC20.sol";

contract TestResolution is Script {
    address constant SKYODDS_ADDRESS = 0x8B87E271FB390FE7db2CE154e49096f72f6BE507;
    bytes32 constant FLIGHT_ID = 0x2e251cc3973af2232e0b0f806c529ab96bdc66b87716f38334efa4673d1bd1de;

    function run() external {
        vm.startBroadcast();

        SkyOdds market = SkyOdds(SKYODDS_ADDRESS);

        // Resolve
        market.resolveMarket(FLIGHT_ID, SkyOdds.Outcome.OnTime);
        console.log("Market resolved");

        // Claim
        market.claimWinnings(FLIGHT_ID);
        console.log("Winnings claimed");

        // Withdraw fees
        market.withdrawFees(msg.sender);
        console.log("Fees withdrawn");

        vm.stopBroadcast();
    }
}
