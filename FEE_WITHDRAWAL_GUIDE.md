# Fee Withdrawal Guide

## 💰 How Protocol Fees Work

### Fee Structure
- **Protocol Fee**: 1% (100 basis points)
- **Collected From**: Every winning claim
- **Stored In**: `accumulatedFees` state variable
- **Withdrawable By**: Contract owner only

### Fee Flow
```
User places bet → Market resolves → User claims winnings
                                    ↓
                          99% goes to user
                          1% goes to accumulatedFees
```

---

## 📊 Check Accumulated Fees

```bash
node scripts/check-fees.mjs
```

**Output Example:**
```
💰 Fee Information:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Accumulated Fees:    0.000028 ETH
Contract Balance:    0.009528 ETH
Owner Address:       0xd04DF7710dB3B6448F89752784DA3caC839596a1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Breakdown:
   Fees (withdrawable):  0.000028 ETH
   Locked in bets:       0.0095 ETH
   Total:                0.009528 ETH
```

---

## 💸 Withdraw Fees

### Prerequisites
- ✅ You must be the contract **owner**
- ✅ `DEPLOYER_PRIVATE_KEY` in `.env` must match the owner address
- ✅ There must be fees accumulated (> 0 ETH)

### Command
```bash
node scripts/withdraw-fees.mjs
```

### What Happens
1. Script checks if you're the owner
2. Reads `accumulatedFees` from contract
3. Calls `withdrawFees()` function
4. ETH is sent to **owner address** (not contract creator, but current owner)
5. `accumulatedFees` is reset to 0

### Output Example
```
💰 Withdrawing Fees from TrollBetETH Contract...

📍 Contract: 0xc629e67E221db99CF2A6e0468907bBcFb7D5f5A3
👤 Your address: 0xd04DF7710dB3B6448F89752784DA3caC839596a1

💵 Accumulated fees: 0.000028 ETH

📤 Sending withdrawFees transaction...
   Transaction hash: 0x77988becb6fbad8145e5f0aee8492aaaa9906a501245d1dd6f707e584f842701
   🔗 https://sepolia.basescan.org/tx/0x77988becb6fbad8145e5f0aee8492aaaa9906a501245d1dd6f707e584f842701

⏳ Waiting for confirmation...
✅ Fees withdrawn successfully!

💰 Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Fees withdrawn:      0.000028 ETH
   Gas used:            0.0000000391308 ETH
   Balance before:      0.029969112184974649 ETH
   Balance after:       0.029997112184974649 ETH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 Withdrawal complete!
```

---

## 🔐 Important Security Notes

### ⚠️ Owner-Only Function
```solidity
function withdrawFees() external onlyOwner {
    uint256 fees = accumulatedFees;
    if (fees == 0) revert NoFeesToWithdraw();
    
    accumulatedFees = 0;
    
    (bool sent, ) = owner().call{value: fees}("");
    if (!sent) revert TransferFailed();

    emit FeesWithdrawn(owner(), fees);
}
```

- **Only the current owner** can withdraw fees
- Fees go to **`owner()` address**, not the caller
- If ownership is transferred, new owner can withdraw fees

### 🔄 Ownership Transfer
If you want to change who can withdraw fees:

```solidity
// In Remix or via script
transferOwnership(newOwnerAddress);
```

After transfer:
- Old owner **cannot** withdraw fees
- New owner **can** withdraw fees
- Fees go to **new owner's address**

---

## 📈 Fee Estimation

### Example Calculation
```
Market Pool: 1 ETH (0.5 YES + 0.5 NO)
Winner bets: 0.3 ETH on YES
Winner payout: (0.3 / 0.5) * 1 ETH = 0.6 ETH

Fee (1%): 0.6 * 0.01 = 0.006 ETH → accumulatedFees
Net to user: 0.6 - 0.006 = 0.594 ETH
```

### Monthly Revenue Estimate (Mainnet)
```
Assumptions:
- 100 markets/month
- Average pool: 10 ETH
- Average claim: 5 ETH

Monthly fees: 100 markets * 5 ETH * 1% = 5 ETH
At $3,500/ETH = $17,500/month
```

---

## 🚨 Error Handling

### "NoFeesToWithdraw"
```bash
❌ Error: NoFeesToWithdraw
💡 The contract has no fees to withdraw.
```
**Solution**: Wait for users to claim winnings (fees accumulate on claim)

### "OwnableUnauthorizedAccount"
```bash
❌ Error: OwnableUnauthorizedAccount
💡 Only the contract owner can withdraw fees.
```
**Solution**: 
1. Check owner: `cast call $CONTRACT "owner()(address)"`
2. Use correct private key in `.env`
3. Or transfer ownership to your address

### "TransferFailed"
```bash
❌ Error: TransferFailed
```
**Solution**: 
- Contract has insufficient balance (shouldn't happen)
- Owner address is a contract that rejects ETH
- Network issue - try again

---

## 🎯 Best Practices

### 1. Regular Withdrawals
- **Testnet**: Withdraw after each test to verify functionality
- **Mainnet**: Withdraw monthly or when fees > gas cost

### 2. Gas Optimization
- Withdrawal costs ~30,000 gas (~$0.50 at 20 gwei)
- Only withdraw when fees > $10 to be cost-effective

### 3. Security
- **Never share** your `DEPLOYER_PRIVATE_KEY`
- Use a **hardware wallet** for mainnet owner
- Consider a **multisig** for owner address

### 4. Monitoring
```bash
# Add to cron for daily checks
0 9 * * * cd /path/to/project && node scripts/check-fees.mjs
```

---

## 📝 Contract State

### Current Status (Base Sepolia)
- **Contract**: `0xc629e67E221db99CF2A6e0468907bBcFb7D5f5A3`
- **Owner**: `0xd04DF7710dB3B6448F89752784DA3caC839596a1`
- **Accumulated Fees**: 0 ETH (just withdrawn)
- **Contract Balance**: 0.0095 ETH (locked in active bets)

### View on BaseScan
```
https://sepolia.basescan.org/address/0xc629e67E221db99CF2A6e0468907bBcFb7D5f5A3
```

---

## 🔮 Future Improvements

### 1. Multi-Recipient Fees
```solidity
// Split fees between team members
address public treasury;
address public developer;
uint256 public treasurySplit = 7000; // 70%
uint256 public developerSplit = 3000; // 30%
```

### 2. Auto-Compound
```solidity
// Automatically reinvest fees into liquidity
function autoCompound() external {
    // Use fees to provide liquidity or buy back tokens
}
```

### 3. Fee Adjustment
```solidity
// Allow owner to adjust fee (with limits)
function setProtocolFee(uint256 newFeeBps) external onlyOwner {
    require(newFeeBps <= 500, "Max 5%"); // Safety limit
    PROTOCOL_FEE_BPS = newFeeBps;
}
```

---

## ✅ Test Results

### Test Transaction
- **TX Hash**: `0x77988becb6fbad8145e5f0aee8492aaaa9906a501245d1dd6f707e584f842701`
- **Amount Withdrawn**: 0.000028 ETH
- **Gas Used**: 0.0000000391308 ETH
- **Status**: ✅ Success
- **Block**: Confirmed on Base Sepolia

### Verification
```bash
# Before withdrawal
Accumulated Fees: 0.000028 ETH

# After withdrawal
Accumulated Fees: 0 ETH ✅
```

---

## 📞 Support

If you encounter issues:
1. Check BaseScan for transaction details
2. Verify you're the owner: `cast call $CONTRACT "owner()(address)"`
3. Check contract balance: `cast balance $CONTRACT`
4. Review error messages in script output

---

**Last Updated**: January 23, 2026
**Contract Version**: TrollBetETH v1.0
**Network**: Base Sepolia (Testnet)
