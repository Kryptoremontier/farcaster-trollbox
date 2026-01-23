# 🔧 Fix: Farcaster Wallet Transaction Issues

**Data**: 2026-01-23  
**Problem**: Kliknięcie "CONFIRM" w Farcaster wallet nic nie robi, ale MetaMask działa

---

## 🔍 Diagnoza Problemu

### Objawy:
- ✅ **MetaMask działa** - transakcje przechodzą bez problemu
- ❌ **Farcaster wallet się zawiesza** - modal CONFIRM się pojawia, ale po kliknięciu nic się nie dzieje
- ❌ **Modal pokazuje "No state changes detected"**

### Root Cause:
**Brak explicit `chainId` w wywołaniach `writeContract`**

Farcaster wallet (`farcasterMiniApp` connector) wymaga **jawnego określenia sieci** (chainId) w każdej transakcji. W przeciwieństwie do MetaMask, który automatycznie używa aktywnej sieci, Farcaster connector musi wiedzieć dokładnie na którym chain ma wykonać transakcję.

---

## ✅ Rozwiązanie

### Zmiana 1: Dodano `chainId` do wszystkich wywołań `writeContract`

**Plik**: `src/hooks/useTrollBet.ts`

#### Przed:
```typescript
writeContract({
  address: TROLLBET_CONTRACT_ADDRESS,
  abi: TrollBetABI,
  functionName: 'placeBet',
  args: [BigInt(marketId), side, amountWei],
});
```

#### Po:
```typescript
import { baseSepolia } from 'wagmi/chains';

writeContract({
  address: TROLLBET_CONTRACT_ADDRESS,
  abi: TrollBetABI,
  functionName: 'placeBet',
  args: [BigInt(marketId), side, amountWei],
  chainId: baseSepolia.id, // ✅ Explicit chain ID for Farcaster wallet
});
```

### Zmienione funkcje:
1. ✅ `usePlaceBet` - obstawianie zakładów
2. ✅ `useClaimWinnings` - odbieranie wygranych
3. ✅ `useApproveToken` - zatwierdzanie tokenów
4. ✅ `useMintTestTokens` - mintowanie test tokenów (FAUCET)

---

## 📋 Co zostało zaktualizowane

### `src/hooks/useTrollBet.ts`:
```typescript
// Dodano import
import { baseSepolia } from 'wagmi/chains';

// Wszystkie writeContract() calls teraz mają:
chainId: baseSepolia.id,
```

### `src/components/providers/WagmiProvider.tsx`:
- Pozostaje bez zmian (już używamy `farcasterMiniApp()` connector)
- Próbowaliśmy dodać `defaultChain` ale to nie istnieje w Wagmi v2

---

## 🧪 Testowanie

### Co przetestować:

1. **FAUCET (Mint Test Tokens)**:
   - Kliknij "Get Test Tokens"
   - Modal powinien się pojawić z **prawidłowymi danymi transakcji**
   - Po kliknięciu CONFIRM transakcja powinna przejść
   - Saldo powinno zaktualizować się do 10,000 $DEGEN

2. **Pierwszy Bet (z Approval)**:
   - Kliknij YES lub NO
   - **Modal 1**: Approve tokens (MAX_UINT256)
   - Po zatwierdzeniu automatycznie...
   - **Modal 2**: Place bet
   - Po zatwierdzeniu bet powinien pojawić się w "Your Bets"

3. **Kolejne Bety (bez Approval)**:
   - Kliknij YES lub NO
   - **Modal 1**: Place bet (tylko jedna transakcja)
   - Po zatwierdzeniu bet w "Your Bets"

---

## ⚠️ Potencjalne Dalsze Problemy

### Problem 1: "No state changes detected" dalej się pojawia

**Możliwe przyczyny:**
1. **Kontrakty nie są wdrożone** na Base Sepolia pod podanymi adresami
2. **Brak Balance $DEGEN** - nie można obstawić bez tokenów
3. **Brak ETH na gas** - brak ETH na Base Sepolia

**Jak sprawdzić:**
```
1. Otwórz: https://sepolia.basescan.org/address/0xdDB5C1a86762068485baA1B481FeBeB17d30e002
   - Jeśli widzisz "Contract" z kodem → OK
   - Jeśli widzisz "Address" bez kodu → kontrakt NIE istnieje

2. Otwórz: https://sepolia.basescan.org/address/0x26dEe56f85fAa471eFF9210326734389186ac625
   - Jeśli widzisz "Contract" z kodem → OK
   - Jeśli widzisz "Address" bez kodu → kontrakt NIE istnieje
```

**Jeśli kontrakty NIE istnieją:**
- Trzeba wdrożyć przez Remix IDE (instrukcja w `QUICK_REMIX_DEPLOY.md`)

### Problem 2: Transaction fails / User rejects

**Możliwe przyczyny:**
1. **Brak ETH na gas** - potrzebujesz ~0.001 ETH na Base Sepolia
2. **Kontrakt ma błąd** - funkcja `mint` może mieć access control
3. **Farcaster wallet bug** - czasami trzeba zrestartować app

**Rozwiązanie:**
1. Zdobądź testnet ETH: https://www.alchemy.com/faucets/base-sepolia
2. Sprawdź console w DevTools (F12) - szukaj błędów
3. Zrestartuj Warpcast app

---

## 📊 Status Po Fix'ie

### Wdrożone zmiany:
- ✅ Dodano `chainId: baseSepolia.id` do wszystkich transakcji
- ✅ Import `baseSepolia` z `wagmi/chains`
- ✅ Build przechodzi bez błędów
- ✅ Deployed na Vercel

### Do przetestowania:
- [ ] Test FAUCET w Farcaster wallet
- [ ] Test pierwszego bet (approve + place)
- [ ] Test kolejnych betów (tylko place)
- [ ] Sprawdzenie czy "No state changes detected" zniknęło

---

## 🎯 Następne Kroki

### Jeśli FIX ZADZIAŁAŁ:
1. ✅ Przetestuj wszystkie funkcje
2. ✅ Sprawdź czy bety się zapisują
3. ✅ Sprawdź czy points system działa
4. ✅ Przygotuj się do mainnet deployment

### Jeśli DALEJ NIE DZIAŁA:
1. ❌ Sprawdź czy kontrakty są wdrożone (linki BaseScan powyżej)
2. ❌ Jeśli NIE - wdróż przez Remix IDE
3. ❌ Jeśli TAK - dodamy więcej debugowania

---

## 💡 Dlaczego To Było Potrzebne?

### Różnice między connectorami:

**MetaMask / Rabby (injected)**:
- Automatycznie używają aktywnej sieci z UI walleta
- Jeśli użytkownik ma ustawioną Base Sepolia → działa
- Nie wymagają explicit `chainId`

**Farcaster Wallet (farcasterMiniApp)**:
- Jest "headless" - nie ma UI wyboru sieci
- Wymaga explicit `chainId` w każdej transakcji
- Bez tego nie wie na którym chain ma wykonać TX

### Wagmi v2 Best Practice:
```typescript
// ❌ BAD - może nie działać z niektórymi connectorami
writeContract({
  address: CONTRACT_ADDRESS,
  abi: ABI,
  functionName: 'function',
  args: [arg1, arg2],
});

// ✅ GOOD - działa ze wszystkimi connectorami
writeContract({
  address: CONTRACT_ADDRESS,
  abi: ABI,
  functionName: 'function',
  args: [arg1, arg2],
  chainId: YOUR_CHAIN.id, // Zawsze dodawaj chainId!
});
```

---

**Deployment**: ✅ Live na https://v0-farcaster-troll-box-app.vercel.app  
**Czas wdrożenia**: ~2 minuty od teraz  

**Przetestuj i daj znać czy działa!** 🚀
