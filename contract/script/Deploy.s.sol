// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SkyOdds.sol";
import "../src/Oracle.sol";
import "../src/mock/MockERC20.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy Mock Token (for testing on testnet)
        MockERC20 token = new MockERC20();
        console.log("Mock Token deployed at:", address(token));

        // Set oracle resolver address
        address oracleResolverTemp = deployer; // Temporary, will be replaced by Oracle

        // Deploy SkyOdds Prediction Market
        SkyOdds market = new SkyOdds(address(token), oracleResolverTemp);
        console.log("SkyOdds deployed at:", address(market));

        // Grant admin role to another address
        // bytes32 adminRole = keccak256("ADMIN_ROLE");
        // address additionalAdmin = 0x...;
        // market.grantRole(adminRole, additionalAdmin);
        // console.log("Granted ADMIN_ROLE to:", additionalAdmin);

        // Deploy Oracle for production
        /*
        address linkToken = vm.envAddress("LINK_TOKEN_ADDRESS");
        address chainlinkOracle = vm.envAddress("CHAINLINK_ORACLE_ADDRESS");
        bytes32 jobId = vm.envBytes32("CHAINLINK_JOB_ID");
        uint256 oracleFee = vm.envUint("ORACLE_FEE");

        Oracle oracle = new Oracle(
            linkToken,
            chainlinkOracle,
            jobId,
            oracleFee,
            address(market)
        );
        console.log("Oracle deployed at:", address(oracle));

        // Update oracle resolver in market
        market.setOracleResolver(address(oracle));
        console.log("Oracle resolver updated");
        */

        vm.stopBroadcast();

        // ============ Deployment Summary ============
        console.log("\n========================================");
        console.log("         DEPLOYMENT SUMMARY");
        console.log("========================================");
        console.log("Network: Mantle Testnet");
        console.log("Deployer:", deployer);
        console.log("----------------------------------------");
        console.log("Token (MockUSDC):", address(token));
        console.log("SkyOdds Market:", address(market));
        console.log("Oracle Resolver:", oracleResolverTemp);
        console.log("----------------------------------------");
    }
}
