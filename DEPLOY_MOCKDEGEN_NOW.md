# 🚀 Deploy MockDEGEN na Base Sepolia - TERAZ!

## Problem:
FAUCET pokazuje "No state changes detected" bo **MockDEGEN nie jest wdrożony** pod adresem `0xdDB5C1a86762068485baA1B481FeBeB17d30e002`

## Rozwiązanie: Deploy przez Remix IDE (5 minut!)

### Krok 1: Otwórz Remix IDE
https://remix.ethereum.org

### Krok 2: Stwórz nowy plik
- Kliknij ikonę "📄 +" w File Explorer (lewy panel)
- Nazwij plik: **`MockDEGEN.sol`**

### Krok 3: Wklej kod

Skopiuj i wklej DOKŁADNIE ten kod:

```solidity
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
```

### Krok 4: Kompilacja
1. Kliknij ikonę **"Solidity Compiler"** (ikona "S" po lewej stronie)
2. Wybierz **Compiler version: 0.8.20**
3. Kliknij **"Compile MockDEGEN.sol"**
4. Poczekaj na zielony checkmark ✅

### Krok 5: Deployment
1. Kliknij ikonę **"Deploy & Run Transactions"** (ikona Ethereum po lewej)
2. W **ENVIRONMENT** wybierz: **"Injected Provider - MetaMask"** (lub Rabby)
3. Twój wallet się połączy - **potwierdź połączenie**
4. **WAŻNE**: Upewnij się że jesteś na **Base Sepolia** (Chain ID: 84532)
   - Jeśli nie, przełącz sieć w wallecie!
5. W **CONTRACT** wybierz: **MockDEGEN**
6. Kliknij pomarańczowy przycisk **"Deploy"**
7. **Potwierdź transakcję w wallecie** (koszt ~$0.01 w ETH)

### Krok 6: Skopiuj adres
Po wdrożeniu (10-30 sekund), w sekcji **"Deployed Contracts"** zobaczysz:

```
MOCKDEGEN AT 0x1234...5678 (COPY)
```

**SKOPIUJ TEN ADRES!** 📋

---

## Krok 7: Aktualizuj kod

Wklej nowy adres tutaj w chacie, a ja zaktualizuję kod i zrobimy redeploy!

Format:
```
MockDEGEN deployed at: 0x...
```

---

## ⚠️ Potrzebujesz ETH na gas?

Jeśli nie masz Base Sepolia ETH:

### Alchemy Faucet (Najlepszy):
https://www.alchemy.com/faucets/base-sepolia

1. Wklej swój adres walleta
2. Kliknij "Send Me ETH"
3. Dostaniesz 0.1 ETH (wystarczy na 100+ transakcji)

### Alternatywnie - Base Sepolia Faucet:
https://www.coinbase.com/faucets/base-sepolia-faucet

---

## 🎯 Po wdrożeniu:

1. **Skopiuj adres** MockDEGEN
2. **Wklej tutaj** w chacie
3. Zaktualizuję `src/hooks/useTrollBet.ts`
4. Commit + Push
5. **FAUCET będzie działać!** 🎉

---

## 💡 Dlaczego to jest potrzebne?

```
Twoja aplikacja próbuje:
1. Wywołać funkcję mint() na adresie 0xdDB5C1...
2. Ale na tym adresie NIE MA kontraktu na Base Sepolia
3. Wallet mówi: "No state changes" = nic się nie wykona
4. Dlatego przycisk się kręci i nic nie robi

Po wdrożeniu MockDEGEN:
1. Będziesz miał PRAWDZIWY kontrakt z funkcją mint()
2. Wallet wykona transakcję
3. Dostaniesz 10,000 test tokenów
4. Będziesz mógł obstawiać zakłady! ✅
```

---

**Czas: ~5 minut**  
**Koszt: ~$0.01 w ETH (gas)**  
**Rezultat: Działający FAUCET i możliwość testowania!**

---

**Daj znać jak pójdzie deployment!** 🚀
