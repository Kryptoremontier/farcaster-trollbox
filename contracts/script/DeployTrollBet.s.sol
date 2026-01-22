// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/TrollBet.sol";

/**
 * @title DeployTrollBet
 * @notice Deployment script for TrollBet contract on Base Sepolia
 * 
 * Usage:
 * 
 * 1. Set environment variables:
 *    export PRIVATE_KEY=your_private_key
 *    export BASESCAN_API_KEY=your_basescan_api_key
 * 
 * 2. Deploy to Base Sepolia:
 *    forge script script/DeployTrollBet.s.sol:DeployTrollBet \
 *      --rpc-url base_sepolia \
 *      --broadcast \
 *      --verify
 * 
 * 3. For mainnet deployment (after testing):
 *    forge script script/DeployTrollBet.s.sol:DeployTrollBet \
 *      --rpc-url base \
 *      --broadcast \
 *      --verify
 */
contract DeployTrollBet is Script {
    // ============ Token Addresses ============
    
    // $DEGEN Token on Base Mainnet
    address constant DEGEN_TOKEN_BASE = 0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed;
    
    // $DEGEN Token on Base Sepolia (use a mock or wrapped version for testing)
    // Note: You may need to deploy a mock ERC20 for testing on Sepolia
    address constant DEGEN_TOKEN_SEPOLIA = 0x0000000000000000000000000000000000000000; // UPDATE THIS
    
    // ============ Deployment ============

    function run() external {
        // Get private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying TrollBet contract...");
        console.log("Deployer address:", deployer);
        
        // Determine which token address to use based on chain
        address degenToken;
        if (block.chainid == 8453) {
            // Base Mainnet
            degenToken = DEGEN_TOKEN_BASE;
            console.log("Deploying to Base Mainnet");
        } else if (block.chainid == 84532) {
            // Base Sepolia
            degenToken = DEGEN_TOKEN_SEPOLIA;
            console.log("Deploying to Base Sepolia");
            
            // If no Sepolia token set, we'll deploy a mock
            if (degenToken == address(0)) {
                console.log("WARNING: No DEGEN token set for Sepolia. Deploy MockDEGEN first!");
                revert("Set DEGEN_TOKEN_SEPOLIA address or deploy MockDEGEN");
            }
        } else {
            revert("Unsupported chain");
        }
        
        console.log("Using DEGEN token:", degenToken);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy TrollBet
        TrollBet trollBet = new TrollBet(degenToken, deployer);
        
        console.log("TrollBet deployed at:", address(trollBet));

        vm.stopBroadcast();

        // Log deployment info
        console.log("");
        console.log("=== Deployment Summary ===");
        console.log("Chain ID:", block.chainid);
        console.log("TrollBet:", address(trollBet));
        console.log("DEGEN Token:", degenToken);
        console.log("Owner:", deployer);
        console.log("Protocol Fee: 1%");
    }
}

/**
 * @title DeployMockDEGEN
 * @notice Deploy a mock DEGEN token for testing on Sepolia
 */
contract DeployMockDEGEN is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying MockDEGEN token...");
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        MockDEGEN mockToken = new MockDEGEN();
        
        // Mint initial supply to deployer for testing
        mockToken.mint(deployer, 1_000_000 * 10**18); // 1M tokens
        
        console.log("MockDEGEN deployed at:", address(mockToken));

        vm.stopBroadcast();
    }
}

/**
 * @title MockDEGEN
 * @notice Simple ERC20 mock for testing
 */
contract MockDEGEN {
    string public name = "Mock DEGEN";
    string public symbol = "mDEGEN";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        return _transfer(msg.sender, to, amount);
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - amount;
        }
        return _transfer(from, to, amount);
    }
    
    function _transfer(address from, address to, uint256 amount) internal returns (bool) {
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
