// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockERC20
 * @notice Mock stablecoin for testing the prediction market
 */
contract MockERC20 is ERC20, Ownable {
    constructor() ERC20("Mock USDC", "mUSDC") Ownable(msg.sender) {
        // Mint initial supply to deployer
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    /**
     * @notice Mint tokens to any address (for testing only)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Faucet function - anyone can mint test tokens
     */
    function faucet(uint256 amount) external {
        require(amount <= 10000 * 10 ** decimals(), "Amount too large");
        _mint(msg.sender, amount);
    }

    /**
     * @notice Returns 6 decimals like USDC
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }
}
