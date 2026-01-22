// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/TrollBet.sol";

contract CreateMarketsScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address trollBetAddress = vm.envAddress("TROLLBET_ADDRESS");
        
        TrollBet trollBet = TrollBet(trollBetAddress);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Market 1: Peter Schiff Bitcoin Tweet
        uint256 market1EndTime = block.timestamp + 1 days;
        uint256 marketId1 = trollBet.createMarket(
            "Will Peter Schiff tweet about Bitcoin today?",
            market1EndTime
        );
        console.log("Created Market 1 (Peter Schiff) with ID:", marketId1);
        
        // Market 2: Degen Price
        uint256 market2EndTime = block.timestamp + 7 days;
        uint256 marketId2 = trollBet.createMarket(
            "Will $DEGEN reach $0.10 this week?",
            market2EndTime
        );
        console.log("Created Market 2 (Degen Price) with ID:", marketId2);
        
        // Market 3: Elon Musk Pepe
        uint256 market3EndTime = block.timestamp + 1 days;
        uint256 marketId3 = trollBet.createMarket(
            "Will Elon Musk post a Pepe meme today?",
            market3EndTime
        );
        console.log("Created Market 3 (Elon Pepe) with ID:", marketId3);
        
        // Market 4: Bitcoin Price
        uint256 market4EndTime = block.timestamp + 7 days;
        uint256 marketId4 = trollBet.createMarket(
            "Will Bitcoin hit $110k this week?",
            market4EndTime
        );
        console.log("Created Market 4 (Bitcoin 110k) with ID:", marketId4);
        
        // Market 5: Vitalik Ethereum
        uint256 market5EndTime = block.timestamp + 3 days;
        uint256 marketId5 = trollBet.createMarket(
            "Will Vitalik call Ethereum ultrasound money?",
            market5EndTime
        );
        console.log("Created Market 5 (Vitalik) with ID:", marketId5);
        
        // Market 6: Crypto Twitter
        uint256 market6EndTime = block.timestamp + 1 days;
        uint256 marketId6 = trollBet.createMarket(
            "Will Crypto Twitter argue about PoW vs PoS today?",
            market6EndTime
        );
        console.log("Created Market 6 (PoW vs PoS) with ID:", marketId6);
        
        vm.stopBroadcast();
        
        console.log("\n=== Markets Created Successfully ===");
        console.log("Total Markets:", trollBet.marketCount());
        console.log("\nNext Steps:");
        console.log("1. Update src/lib/mockMarkets.ts with these market IDs");
        console.log("2. Map each UI market to its contract market ID");
        console.log("3. Deploy frontend to Netlify");
    }
}
