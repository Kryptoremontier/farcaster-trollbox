# 🧪 SEPOLIA FINAL TEST PLAN - "Ostatni Poligon Doświadczalny"

## ✅ STATUS: IN PROGRESS

---

## 📋 **KROK 1: Wielkie Sprzątanie i Nowy Deploy** ✅ DONE

### ✅ **Zaktualizowano REMIX_TrollBetETH.sol:**
- Dodano `bool public paused`
- Dodano `modifier whenNotPaused()`
- Dodano `pause()`, `unpause()`, `emergencyWithdraw()`
- `placeBet()` ma teraz `whenNotPaused`
- `claimWinnings()` działa nawet gdy paused (users can always claim!)

### 📝 **Następne kroki:**
1. **Deploy na Sepolia:**
   - Otwórz Remix IDE: https://remix.ethereum.org
   - Wklej kod z `contracts/REMIX_TrollBetETH.sol`
   - Compile: Solidity 0.8.20, Optimization 200 runs
   - Deploy na Base Sepolia (Chain ID: 84532)
   - Constructor: Twój adres (owner)
   - **ZAPISZ ADRES KONTRAKTU!**

2. **Zaktualizuj Frontend:**
   ```typescript
   // src/hooks/useTrollBetETH.ts
   const TROLLBET_ETH_ADDRESS = '0xNOWY_ADRES_SEPOLIA' as const;
   ```

3. **Stress Test - 10 rynków:**
   ```bash
   # Edytuj scripts/add-markets-batch.mjs
   # Zmień adres kontraktu na nowy
   # Dodaj 10 rynków
   node scripts/add-markets-batch.mjs
   ```

4. **Sprawdź Frontend:**
   - Czy ładuje wszystkie 10 rynków?
   - Czy przewijanie działa płynnie?
   - Czy nie ma lagów?

---

## 📋 **KROK 2: Integracja useAllMarkets()** 🔄 IN PROGRESS

### ✅ **Stworzono Hooki:**
- `useMarketCount()` - pobiera liczbę rynków z kontraktu
- `useAllMarkets()` - dynamicznie ładuje wszystkie rynki

### 🔄 **Obecnie wykonywane:**
Integracja `useAllMarkets()` w `TrollBoxHub.tsx` zamiast `MOCK_MARKETS`

### 📝 **Plan Integracji:**

```typescript
// TrollBoxHub.tsx - PRZED:
import { MOCK_MARKETS } from "~/lib/mockMarkets";

// TrollBoxHub.tsx - PO:
import { useAllMarkets, useMarketDataETH } from "~/hooks/useTrollBetETH";

const { markets, marketCount, isLoading } = useAllMarkets();

// Loading state:
if (isLoading) {
  return <div>Loading markets... <Spinner /></div>;
}

// Empty state:
if (marketCount === 0) {
  return <div>Brak aktywnych zakładów. Wrócimy wkrótce!</div>;
}

// Render markets:
{markets.map((market) => (
  <MarketCard key={market.id} marketId={market.id} />
))}
```

### ⚠️ **Uwagi Techniczne:**
- `endTime` z kontraktu to `BigInt` (seconds) → konwertuj na `Date`
- Użyj `fromSolidityTimestamp()` z `~/lib/utils`
- Dodaj skeleton loaders dla lepszego UX
- Sprawdź performance przy 50+ rynkach

---

## 📋 **KROK 3: "Próba Generalna" Przycisku Paniki** ⏳ PENDING

### 🧪 **Test 1: PAUSE**

**Cel:** Sprawdzić czy `pause()` blokuje nowe zakłady

**Kroki:**
1. Otwórz Remix IDE
2. Połącz się z deployed contract
3. Wywołaj `pause()` (jako owner)
4. Otwórz aplikację
5. Spróbuj postawić zakład

**✅ Oczekiwany wynik:**
- Przycisk zakładu disabled ALBO
- Transakcja revertuje z błędem "Contract paused"

**📸 Screenshot:** (dodaj po teście)

---

### 🧪 **Test 2: CLAIM podczas pauzy**

**Cel:** Sprawdzić czy użytkownicy mogą odebrać wygrane nawet gdy paused

**Kroki:**
1. Znajdź rynek który wygrałeś (z poprzednich testów)
2. Contract jest nadal paused (z Test 1)
3. Kliknij "Claim Winnings"

**✅ Oczekiwany wynik:**
- Transakcja przechodzi!
- Otrzymujesz ETH
- To jest **KRYTYCZNE** dla zaufania użytkowników

**📸 Screenshot:** (dodaj po teście)

---

### 🧪 **Test 3: UNPAUSE**

**Cel:** Sprawdzić czy `unpause()` przywraca działanie

**Kroki:**
1. W Remix wywołaj `unpause()` (jako owner)
2. Spróbuj postawić zakład w aplikacji

**✅ Oczekiwany wynik:**
- Zakład przechodzi normalnie
- System wrócił do pełnej funkcjonalności

**📸 Screenshot:** (dodaj po teście)

---

### 🧪 **Test 4: EMERGENCY WITHDRAW**

**Cel:** Sprawdzić czy `emergencyWithdraw()` działa w kryzysie

**Setup:**
1. Wyślij 0.01 ETH bezpośrednio na adres kontraktu
   ```
   MetaMask → Send → Contract Address → 0.01 ETH
   ```
2. Wywołaj `pause()` (wymagane przed emergency)
3. Sprawdź balance kontraktu w Remix

**Kroki:**
1. W Remix wywołaj `emergencyWithdraw()` (jako owner)
2. Sprawdź swój wallet

**✅ Oczekiwany wynik:**
- Wszystkie ETH z kontraktu trafiają na Twój wallet
- Contract balance = 0 ETH

**⚠️ UWAGA:** To jest **OSTATNIA DESKA RATUNKU**!
- Użyj tylko jeśli contract jest skompromitowany
- Użytkownicy stracą dostęp do swoich środków
- Musisz zwrócić im pieniądze off-chain

**📸 Screenshot:** (dodaj po teście)

---

## 📋 **KROK 4: Rynek "Meta"** ⏳ PENDING

### 🎯 **Specyfikacja Rynku:**

```javascript
{
  question: "Will TrollBoxHub exceed 50 unique bettors in its first 24h on Mainnet?",
  description: "✅ Verified manually by owner after 24h. Data from blockchain + analytics.",
  thumbnail: "🎯",
  category: "meta",
  endTime: new Date('2026-01-25T12:00:00.000Z'), // 24h po Mainnet launch
  oracle: "Manual (Owner)",
  verificationMethod: "Count unique addresses that called placeBet() in first 24h"
}
```

### 📊 **Jak Weryfikować:**

**Opcja 1: BaseScan Events (Najprostsze)**
```
1. Wejdź na BaseScan: https://basescan.org/address/CONTRACT_ADDRESS#events
2. Filtruj: Event "BetPlaced"
3. Timeframe: First 24h after deployment
4. Count unique "user" addresses
5. If >= 50 → YES wins
```

**Opcja 2: Skrypt (Bardziej precyzyjne)**
```javascript
// scripts/count-unique-bettors.mjs
const events = await contract.queryFilter('BetPlaced', fromBlock, toBlock);
const uniqueUsers = new Set(events.map(e => e.args.user));
console.log('Unique bettors:', uniqueUsers.size);
```

### 🎯 **Cel Marketingowy:**
- Buduje społeczność wokół startu
- Użytkownicy mają interes w promowaniu projektu
- "Meta" element - zakład na sam projekt
- Świetny content na Farcaster/Twitter

---

## ✅ **CHECKLIST PRZED MAINNET:**

### **Smart Contract:**
- [ ] Deployed na Sepolia z nowym kodem (pause, etc.)
- [ ] Przetestowano `pause()` - blokuje zakłady ✅
- [ ] Przetestowano `claimWinnings()` podczas pauzy - działa ✅
- [ ] Przetestowano `unpause()` - przywraca funkcjonalność ✅
- [ ] Przetestowano `emergencyWithdraw()` - wypłaca wszystko ✅
- [ ] Stress test: 10+ rynków, frontend ładuje płynnie ✅

### **Frontend:**
- [ ] `useAllMarkets()` zintegrowany w `TrollBoxHub.tsx`
- [ ] `MOCK_MARKETS` usunięty (lub jako fallback)
- [ ] Loading states (skeleton loaders)
- [ ] Empty states ("Brak rynków")
- [ ] Error states (błędy RPC, etc.)
- [ ] Performance test: 50+ rynków bez lagów

### **Oracle & Cron:**
- [ ] Cron Job rozstrzyga rynki automatycznie
- [ ] "At time of resolution" w pytaniach (nie "at 18:00 UTC")
- [ ] Digit markets preferowane (mniej wrażliwe na timing)
- [ ] Historical data API (opcjonalne, CoinGecko Pro)

### **Marketing:**
- [ ] Rynek "Meta" przygotowany
- [ ] Post na Farcaster: "Testing on Sepolia, Mainnet soon!"
- [ ] Screenshot pause mechanism (pokazuje bezpieczeństwo)
- [ ] GIF dynamic loading (pokazuje że to prawdziwy dApp)

---

## 🚀 **TIMELINE:**

**Day 1 (Dzisiaj):**
- ✅ Update REMIX contract
- 🔄 Integracja `useAllMarkets()`
- ⏳ Deploy na Sepolia
- ⏳ Stress test (10 rynków)

**Day 2:**
- ⏳ Test pause mechanism (wszystkie 4 testy)
- ⏳ Performance test (50+ rynków)
- ⏳ Fix any bugs

**Day 3:**
- ⏳ Final review MAINNET_LAUNCH_ROADMAP.md
- ⏳ Przygotuj rynek "Meta"
- ⏳ Marketing prep (posty, screenshots)

**Day 4:**
- 🚀 **MAINNET LAUNCH!**

---

## 📞 **SUPPORT:**

**Jeśli coś pójdzie nie tak:**
- Sprawdź logi Vercel
- Sprawdź BaseScan transactions
- Sprawdź Console (F12) w przeglądarce
- Wywołaj `pause()` jeśli trzeba
- Poproś Cursora o pomoc z konkretnym błędem

**Emergency Contact:**
- Base Discord: https://discord.gg/base
- Vercel Support: https://vercel.com/support

---

*Last updated: 2026-01-23*
*Status: Krok 2 in progress - Integracja useAllMarkets()*
