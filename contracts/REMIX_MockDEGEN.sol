// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockDEGEN
 * @notice Simple ERC20 mock for testing TrollBet on Base Sepolia
 * @dev This is ONLY for testnet. On mainnet, use real $DEGEN: 0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed
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
    
    /**
     * @notice Mint tokens to any address (for testing)
     * @param to Recipient address
     * @param amount Amount to mint (in wei, 18 decimals)
     */
    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }
    
    /**
     * @notice Approve spender to use tokens
     */
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    /**
     * @notice Transfer tokens
     */
    function transfer(address to, uint256 amount) external returns (bool) {
        return _transfer(msg.sender, to, amount);
    }
    
    /**
     * @notice Transfer tokens from another address
     */
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - amount;
        }
        return _transfer(from, to, amount);
    }
    
    /**
     * @dev Internal transfer logic
     */
    function _transfer(address from, address to, uint256 amount) internal returns (bool) {
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
