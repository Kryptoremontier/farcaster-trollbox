# 🔍 Sprawdzanie Kontraktów na Base Sepolia

## Adresy w kodzie:

1. **MockDEGEN**: `0xdDB5C1a86762068485baA1B481FeBeB17d30e002`
2. **TrollBet**: `0x26dEe56f85fAa471eFF9210326734389186ac625`

## Sprawdź te linki:

### MockDEGEN:
https://sepolia.basescan.org/address/0xdDB5C1a86762068485baA1B481FeBeB17d30e002

**Co powinieneś zobaczyć:**
- ✅ Jeśli jest "Contract" z kodem → OK, kontrakt istnieje
- ❌ Jeśli jest "Address" bez kodu → **KONTRAKT NIE ISTNIEJE** ← Prawdopodobnie to!

### TrollBet:
https://sepolia.basescan.org/address/0x26dEe56f85fAa471eFF9210326734389186ac625

**Co powinieneś zobaczyć:**
- ✅ Jeśli jest "Contract" z kodem → OK
- ❌ Jeśli jest "Address" bez kodu → **KONTRAKT NIE ISTNIEJE**

---

## Jeśli kontrakty NIE istnieją:

Musimy je wdrożyć! Masz 2 opcje:

### Opcja 1: Szybkie wdrożenie przez Remix IDE (15 min)

1. **Deploy MockDEGEN**:
   - Otwórz: https://remix.ethereum.org
   - Skopiuj kod z `contracts/REMIX_MockDEGEN.sol`
   - Compile (Solidity 0.8.20)
   - Deploy na Base Sepolia
   - **ZAPISZ ADRES!**

2. **Deploy TrollBet**:
   - Skopiuj kod z `contracts/src/TrollBet.sol`
   - W constructor podaj adres MockDEGEN z kroku 1
   - Deploy na Base Sepolia
   - **ZAPISZ ADRES!**

3. **Aktualizuj kod**:
   - Wklej nowe adresy tutaj
   - Zrobimy commit i redeploy

### Opcja 2: Użyj istniejącego testowego ERC20

Jeśli nie chcesz wdrażać, możemy użyć dowolnego istniejącego ERC20 na Base Sepolia do testów.

---

## Dlaczego to się dzieje?

### Problem: Race Condition + Błędny Chain

```
1. App ładuje się → próbuje czytać saldo
2. Wallet może być na Base Mainnet (gdzie masz 100k $DEGEN)
3. Przez ułamek sekundy czyta z Mainnet → pokazuje 100k
4. Wagmi przełącza na Base Sepolia (bo to mamy w config)
5. Próbuje czytać ten sam adres na Sepolia → pusty → 0
6. Faucet próbuje mintować na Sepolia → adres nie istnieje → "No state changes"
```

### Rozwiązanie:

**Musimy mieć osobne adresy dla każdej sieci:**

```typescript
// Base Mainnet (8453)
const DEGEN_MAINNET = '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed';

// Base Sepolia (84532) 
const MOCKDEGEN_SEPOLIA = '0x...' // ← TO MUSIMY WDROŻYĆ!
```

---

**Sprawdź te linki BaseScan i powiedz mi co widzisz!** 🔍
