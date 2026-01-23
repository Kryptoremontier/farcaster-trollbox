# 🚀 MAINNET LAUNCH ROADMAP - TrollBoxHub

## ⚠️ KRYTYCZNE OSTRZEŻENIE

**To są PRAWDZIWE PIENIĄDZE na Base Mainnet. Jeden błąd = utrata funduszy.**

---

## 📋 PHASE 1: SECURITY AUDIT & PREPARATION (2-3h)

### ✅ 1.1 Smart Contract Security Review

**PRZED DEPLOYEM:**

- [ ] **Przeczytaj cały kod `contracts/REMIX_TrollBetETH.sol` linia po linii**
- [ ] **Sprawdź czy `PROTOCOL_FEE_BPS = 250` (2.5%)**
- [ ] **Upewnij się że NIE MA funkcji `mint()` ani `setOwner()` bez `onlyOwner`**
- [ ] **Sprawdź czy wszystkie funkcje mają odpowiednie modyfikatory:**
  - `createMarket` → `onlyOwner`
  - `resolveMarket` → `onlyOwner`
  - `withdrawFees` → `onlyOwner`
  - `placeBet` → `payable`, `nonReentrant`
  - `claimWinnings` → `nonReentrant`

**PYTANIA DO SIEBIE:**
1. Czy ktoś może ukraść ETH z kontraktu? **NIE**
2. Czy użytkownik może odebrać więcej niż wygrał? **NIE**
3. Czy mogę przypadkowo zablokować fundusze użytkowników? **NIE**
4. Czy contract ma `selfdestruct` lub `delegatecall`? **NIE**

---

### ✅ 1.2 Oracle Strategy - KRYTYCZNE!

**⚠️ NAJWAŻNIEJSZY KROK - TU TRACISZ REPUTACJĘ JEŚLI ŹLE ZROBISZ!**

#### **BEZPIECZNE Typy Rynków (Start z TYMI):**

✅ **Crypto Price Digit** (CoinGecko API)
```
"Will BTC price end with digit 5 in next 24h?"
```
- **Oracle**: CoinGecko Free API
- **Weryfikacja**: Automatyczna (Cron Job)
- **Ryzyko manipulacji**: BARDZO NISKIE
- **Czas rozstrzygnięcia**: 5-15 min po zakończeniu

✅ **ETH Gas Price** (Etherscan API)
```
"Will ETH gas be above 30 gwei at time of resolution?"
```
- **Oracle**: Etherscan Free API (current price)
- **Weryfikacja**: Automatyczna (Cron Job)
- **Ryzyko manipulacji**: NISKIE (gas zmienia się wolno)
- **Czas rozstrzygnięcia**: 5-15 min po zakończeniu
- **⚠️ UWAGA**: Cron pobiera cenę "teraz", nie "o 18:00". Dla precyzji użyj CoinGecko Pro (historical data) lub pytaj o "at time of resolution"

✅ **BTC/ETH Ratio** (CoinGecko API)
```
"Will BTC/ETH ratio be above 20 at midnight UTC?"
```
- **Oracle**: CoinGecko Free API
- **Weryfikacja**: Automatyczna (Cron Job)
- **Ryzyko manipulacji**: NISKIE
- **Czas rozstrzygnięcia**: 5-15 min po zakończeniu

#### **⚠️ ORACLE "SHADOW" PROBLEM (KRYTYCZNE!):**

**Problem:** Cron Job uruchamia się co 10 minut. Jeśli rynek kończy się o 18:00:00, Cron może ruszyć dopiero o 18:05:00 lub 18:10:00.

**Konsekwencje:**
- Cena BTC/ETH zmienia się co sekundę
- Gas price zmienia się co kilka sekund
- Użytkownicy mogą czuć się oszukani jeśli wynik "zmienił się" w tych 5-10 minutach

**ROZWIĄZANIA:**

✅ **Opcja 1: "At time of resolution"** (ZALECANE na start)
```
"Will BTC price end with digit 5 at time of resolution?"
```
- Jasne: cena jest sprawdzana gdy Cron ruszy (0-10 min po końcu)
- Użytkownicy wiedzą że to nie jest "dokładnie o 18:00"
- Digit końcówki zmienia się rzadko, więc 10 min delay = OK

✅ **Opcja 2: Digit Markets** (NAJLEPSZE na start)
```
"Will BTC price end with digit 5 in next 6 hours?"
```
- Ostatnia cyfra ceny zmienia się wolniej niż pełna cena
- 10 min delay ma mniejszy wpływ
- Trudniejsze do manipulacji

❌ **Opcja 3: Historical Data** (wymaga CoinGecko Pro, $400/miesiąc)
```
"Will BTC price be above $100k at exactly 18:00 UTC?"
```
- Możesz pobrać cenę z dokładnego timestampu
- Ale wymaga płatnego API
- Na start: overkill

#### **🚫 NIEBEZPIECZNE Typy Rynków (NIE UŻYWAJ NA START):**

❌ **Whale Movements** - wymaga płatnego API Etherscan/Dune
❌ **Social Media Events** - wymaga Twitter API (płatne) + subiektywna interpretacja
❌ **"Will X happen?"** - zbyt ogólne, łatwe do manipulacji
❌ **Rynki < 1 godzina** - za mało czasu na weryfikację
❌ **Rynki > 7 dni** - użytkownicy zapomną, niskie zaangażowanie
❌ **"At exactly HH:MM UTC"** - Cron ma 10min delay, użytkownicy mogą czuć się oszukani

#### **📝 TEMPLATE dla Bezpiecznych Rynków:**

```javascript
// DOBRE - Konkretne, weryfikowalne, niemożliwe do manipulacji
{
  question: "🎲 Will BTC price end with digit 7 at time of resolution?",
  endTime: "2026-01-24T18:00:00.000Z", // FIXED timestamp
  category: "crypto",
  oracle: "CoinGecko (current price when Cron runs)",
  verificationMethod: "Automatic (Cron Job every 10 min)",
  note: "⚠️ Price checked 0-10 min after market ends, not exactly at endTime"
}

// ZŁE - Zbyt ogólne, subiektywne
{
  question: "Will BTC pump today?", // ❌ Co to znaczy "pump"?
  question: "Will Elon tweet about crypto?", // ❌ Która wiadomość? Jak weryfikować?
  question: "Will market crash?", // ❌ Który market? O ile?
}
```

---

### ✅ 1.3 Environment Variables - MAINNET

**Stwórz nowy plik `.env.mainnet` (NIE commituj do Git!):**

```bash
# .env.mainnet - DO NOT COMMIT!

# Mainnet RPC (MUSISZ mieć własny!)
BASE_MAINNET_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
# Lub: https://mainnet.base.org (publiczny, może być wolny)

# Deployer Private Key (NOWY wallet tylko do deploymentu!)
DEPLOYER_PRIVATE_KEY=0x... # Wallet z ~$50 ETH na Base Mainnet

# Cron Job Secret (wygeneruj losowy string)
CRON_SECRET=WYGENERUJ_TUTAJ_LOSOWY_STRING_64_ZNAKI

# Upstash Redis (opcjonalne, ale zalecane)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# External APIs (FREE tier wystarczy na start)
COINGECKO_API_KEY=optional_but_recommended
ETHERSCAN_API_KEY=your_free_etherscan_key
```

**🔒 BEZPIECZEŃSTWO:**
- **NIE UŻYWAJ** swojego głównego walletu jako `DEPLOYER_PRIVATE_KEY`!
- Stwórz **NOWY** wallet tylko do deploymentu i Cron Jobs
- Trzymaj na nim **TYLKO** tyle ETH ile potrzeba (~$50)
- **NIGDY** nie commituj `.env.mainnet` do Git!

---

### ✅ 1.4 Vercel Environment Variables Setup

**Wejdź w Vercel Dashboard → Settings → Environment Variables:**

**DODAJ TE ZMIENNE (Production):**

| Key | Value | Environment |
|-----|-------|-------------|
| `BASE_MAINNET_RPC_URL` | `https://mainnet.base.org` lub Alchemy | Production |
| `DEPLOYER_PRIVATE_KEY` | `0x...` (NOWY wallet!) | Production |
| `CRON_SECRET` | Losowy string 64 znaki | Production |
| `UPSTASH_REDIS_REST_URL` | URL z Upstash | Production |
| `UPSTASH_REDIS_REST_TOKEN` | Token z Upstash | Production |
| `ETHERSCAN_API_KEY` | Free key z Etherscan | Production |

**⚠️ NIE DODAWAJ `COINGECKO_API_KEY` jeśli nie masz - Free tier działa bez klucza!**

---

## 📋 PHASE 2: SMART CONTRACT DEPLOYMENT (30 min)

### ✅ 2.1 Deploy Contract na Base Mainnet

**UWAGA: To będzie kosztować ~$5-10 w ETH!**

1. **Otwórz Remix IDE**: https://remix.ethereum.org
2. **Wklej kod** z `contracts/REMIX_TrollBetETH.sol`
3. **Skompiluj**:
   - Compiler: `0.8.20`
   - Optimization: `200 runs`
   - Sprawdź czy `PROTOCOL_FEE_BPS = 250` ✅

4. **Deploy**:
   - Environment: `Injected Provider - MetaMask`
   - **ZMIEŃ SIEĆ NA BASE MAINNET** (Chain ID: 8453)
   - Constructor: `_owner` = Twój adres (ten sam co `DEPLOYER_PRIVATE_KEY`)
   - **SPRAWDŹ 3 RAZY CZY JESTEŚ NA BASE MAINNET!**
   - Kliknij `Deploy`
   - Potwierdź w MetaMask (~$5-10 gas)

5. **Zapisz adres kontraktu**:
   ```
   MAINNET_CONTRACT_ADDRESS=0x...
   ```

6. **Zweryfikuj na BaseScan**:
   - Wejdź: https://basescan.org/address/YOUR_CONTRACT_ADDRESS
   - Verify & Publish Contract Code
   - Compiler: `0.8.20`, Optimization: `200`
   - Wklej kod z `REMIX_TrollBetETH.sol`

---

### ✅ 2.2 Test Contract Functions (Mainnet!)

**⚠️ To są PRAWDZIWE transakcje - każda kosztuje gas!**

```bash
# W Remix IDE (Base Mainnet):

# 1. Sprawdź owner
owner() → Twój adres ✅

# 2. Sprawdź fee
PROTOCOL_FEE_BPS() → 250 ✅

# 3. Sprawdź marketCount
marketCount() → 0 ✅

# 4. NIE TWÓRZ jeszcze rynków!
```

---

## 📋 PHASE 3: FRONTEND UPDATE (15 min)

### ✅ 3.1 Update Contract Address

**Edytuj `src/hooks/useTrollBetETH.ts`:**

```typescript
// BEFORE (Testnet)
const TROLLBET_ETH_ADDRESS = '0xc629e67E221db99CF2A6e0468907bBcFb7D5f5A3' as const;

// AFTER (Mainnet)
const TROLLBET_ETH_ADDRESS = '0xYOUR_NEW_MAINNET_ADDRESS' as const;
```

### ✅ 3.2 Update Chain Configuration

**Edytuj `src/components/providers/WagmiProvider.tsx`:**

```typescript
import { base } from 'viem/chains'; // ← ZMIEŃ z baseSepolia na base!

export const config = createConfig({
  chains: [base], // ← BASE MAINNET
  // ...
});
```

**Znajdź WSZYSTKIE wystąpienia `baseSepolia` i zmień na `base`:**

```bash
# Użyj Find & Replace w całym projekcie:
# Znajdź: baseSepolia
# Zamień na: base
```

### ✅ 3.3 Clear Mock Markets

**Edytuj `src/lib/mockMarkets.ts`:**

```typescript
// WYCZYŚĆ wszystkie testowe rynki!
export const MOCK_MARKETS: Market[] = [
  // Będziemy dodawać rynki przez skrypt po deployment
];
```

---

## 📋 PHASE 4: MARKET CREATION STRATEGY (1h)

### ✅ 4.1 Przygotuj Pierwsze 5 Rynków (Launch Day)

**ZASADY:**
- ✅ Tylko **weryfikowalne** rynki (CoinGecko, Etherscan)
- ✅ Czas trwania: **6-24 godziny** (nie za krótko, nie za długo)
- ✅ Pytania **jasne i konkretne**
- ✅ Różne godziny zakończenia (rozłóż w czasie)
- ✅ **NIE** używaj "Will X pump?" - zbyt subiektywne!

**PRZYKŁADOWE PIERWSZE 5 RYNKÓW:**

```javascript
// markets-mainnet-launch.mjs
const LAUNCH_MARKETS = [
  {
    question: "🎲 Will BTC price end with digit 5 at time of resolution?",
    endTime: "2026-01-24T18:00:00.000Z", // 6h od teraz
    note: "CoinGecko Oracle - Automatic (price checked when Cron runs, 0-10min after end)"
  },
  {
    question: "⚡ Will ETH gas be above 30 gwei at time of resolution?",
    endTime: "2026-01-24T20:00:00.000Z", // 8h od teraz
    note: "Etherscan Oracle - Automatic (gas checked when Cron runs, 0-10min after end)"
  },
  {
    question: "🎲 Will BTC price end with digit 3 at midnight UTC?",
    endTime: "2026-01-25T00:00:00.000Z", // 12h od teraz
    note: "CoinGecko Oracle - Automatic"
  },
  {
    question: "📊 Will BTC/ETH ratio be above 20 at 06:00 UTC tomorrow?",
    endTime: "2026-01-25T06:00:00.000Z", // 18h od teraz
    note: "CoinGecko Oracle - Automatic"
  },
  {
    question: "⚡ Will average ETH gas be below 25 gwei at noon UTC tomorrow?",
    endTime: "2026-01-25T12:00:00.000Z", // 24h od teraz
    note: "Etherscan Oracle - Automatic"
  }
];
```

### ✅ 4.2 Stwórz Skrypt Deployment (Mainnet)

**Skopiuj i edytuj `scripts/add-mainnet-markets.mjs`:**

```javascript
#!/usr/bin/env node
import 'dotenv/config';
import { createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains'; // ← BASE MAINNET!

const TROLLBET_ETH_ADDRESS = '0xYOUR_MAINNET_ADDRESS'; // ← WSTAW TUTAJ!

// ... (reszta kodu jak w add-mainnet-safe-markets.mjs)

const LAUNCH_MARKETS = [
  // Wklej rynki z 4.1
];

// DODAJ CONFIRMATION PROMPT!
console.log('⚠️  WARNING: You are about to create markets on BASE MAINNET!');
console.log('⚠️  This will cost REAL ETH!');
console.log('⚠️  Markets to create:', LAUNCH_MARKETS.length);
console.log('\nPress Ctrl+C to cancel, or wait 10 seconds to continue...');

await new Promise(resolve => setTimeout(resolve, 10000));

// ... (reszta kodu)
```

---

## 📋 PHASE 5: CRON JOB VERIFICATION (30 min)

### ✅ 5.1 Update Cron Job dla Mainnet

**Edytuj `src/app/api/cron/resolve-markets/route.ts`:**

**ZNAJDŹ I ZMIEŃ:**

```typescript
// BEFORE (Testnet)
import { baseSepolia } from 'viem/chains';
const chain = baseSepolia;
const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';

// AFTER (Mainnet)
import { base } from 'viem/chains';
const chain = base;
const rpcUrl = process.env.BASE_MAINNET_RPC_URL || 'https://mainnet.base.org';
```

**DODAJ DODATKOWE LOGI:**

```typescript
export async function GET(request: Request) {
  console.log('🚀 [MAINNET CRON] Starting market resolution...');
  console.log('⚠️  [MAINNET] Using chain:', chain.name);
  console.log('⚠️  [MAINNET] Contract:', TROLLBET_ETH_ADDRESS);
  
  // ... reszta kodu
}
```

### ✅ 5.2 Test Cron Job Locally (Mainnet!)

**⚠️ To wywoła PRAWDZIWĄ transakcję jeśli znajdzie zakończone rynki!**

```bash
# Ustaw env variables
export BASE_MAINNET_RPC_URL="https://mainnet.base.org"
export DEPLOYER_PRIVATE_KEY="0x..."

# Test (NIE uruchamiaj jeśli nie masz zakończonych rynków!)
curl http://localhost:3000/api/cron/resolve-markets
```

---

## 📋 PHASE 6: DEPLOYMENT & GO LIVE (30 min)

### ✅ 6.1 Deploy do Vercel (Production)

```bash
# 1. Commit wszystkie zmiany
git add -A
git commit -m "🚀 MAINNET LAUNCH - Base Mainnet deployment"
git push

# 2. Vercel automatycznie zbuduje i wdroży
# Sprawdź logi: https://vercel.com/your-project/deployments

# 3. Sprawdź czy build przeszedł ✅
```

### ✅ 6.2 Verify Production Environment

**Otwórz aplikację w przeglądarce:**

1. **Sprawdź adres kontraktu** (F12 → Console):
   ```
   [TrollBetETH] Contract: 0xYOUR_MAINNET_ADDRESS ✅
   ```

2. **Sprawdź chain** (powinno być Base Mainnet, nie Sepolia):
   ```
   [WagmiProvider] Chain: base (8453) ✅
   ```

3. **Podłącz wallet** → Sprawdź czy pokazuje Base Mainnet

4. **NIE OBSTAWIAJ** jeszcze - nie ma rynków!

---

### ✅ 6.3 Create Launch Markets

**⚠️ OSTATNI CHECKPOINT - Sprawdź 3 RAZY:**

- [ ] Jestem na **Base Mainnet** (nie Sepolia)
- [ ] Mam **wystarczająco ETH** na gas (~$20)
- [ ] **Przeczytałem** wszystkie pytania rynków
- [ ] **Timestamps** są poprawne (UTC, przyszłość)
- [ ] **Oracle** dla każdego rynku jest gotowy (CoinGecko/Etherscan)

**Uruchom skrypt:**

```bash
node scripts/add-mainnet-markets.mjs
```

**Poczekaj 10 sekund (confirmation delay), potem:**

```
✅ Market 0 created: Will BTC price end with digit 5...
   TX: 0x...
   
✅ Market 1 created: Will ETH gas be above 30 gwei...
   TX: 0x...
   
... (5 rynków)

🎉 All markets created successfully!
```

---

### ✅ 6.4 Update mockMarkets.ts

**Skopiuj output ze skryptu i wklej do `src/lib/mockMarkets.ts`:**

```typescript
export const MOCK_MARKETS: Market[] = [
  {
    id: 'market-0',
    contractMarketId: 0,
    question: '🎲 Will BTC price end with digit 5 at 18:00 UTC today?',
    description: '✅ CoinGecko Oracle - Automatic',
    thumbnail: '🎲',
    category: 'crypto',
    endTime: new Date('2026-01-24T18:00:00.000Z'),
    yesPool: 0,
    noPool: 0,
    totalBettors: 0,
    status: 'active',
  },
  // ... (pozostałe 4 rynki)
];
```

**Commit i push:**

```bash
git add src/lib/mockMarkets.ts
git commit -m "Add launch markets to frontend"
git push
```

---

## 📋 PHASE 7: MONITORING & FIRST 24H (Ongoing)

### ✅ 7.1 Monitor Contract Activity

**BaseScan Dashboard:**
https://basescan.org/address/YOUR_CONTRACT_ADDRESS

**Sprawdzaj co 1-2h:**
- [ ] Liczba transakcji `placeBet`
- [ ] Total ETH w kontrakcie
- [ ] Czy są błędy/reverts?
- [ ] Czy Cron Job rozstrzyga rynki? (sprawdź `MarketResolved` events)

### ✅ 7.2 Monitor Cron Job Logs

**Vercel Dashboard → Deployments → Functions:**

Filtruj: `/api/cron/resolve-markets`

**Sprawdzaj co 10 min (lub po każdym Cron run):**
- [ ] Czy Cron się uruchomił?
- [ ] Czy znalazł zakończone rynki?
- [ ] Czy rozstrzygnął poprawnie?
- [ ] Czy są błędy?

**Przykładowy DOBRY log:**
```
🚀 [MAINNET CRON] Starting market resolution...
✅ [MAINNET] Found 1 ended market: Market 0
✅ [MAINNET] BTC price digit: 5 (target: 5) → YES wins
✅ [MAINNET] Market 0 resolved: YES
🎉 [MAINNET] Completed: 1 resolved, 0 failed
```

**Przykładowy ZŁY log (ACTION REQUIRED):**
```
❌ [MAINNET] Error resolving market 0: HTTP 403 Forbidden
❌ [MAINNET] CoinGecko API rate limit exceeded
```
→ **AKCJA**: Dodaj `COINGECKO_API_KEY` lub zmniejsz częstotliwość Cron

### ✅ 7.3 Monitor User Feedback

**Farcaster / Twitter / Discord:**

**Czerwone flagi (STOP EVERYTHING!):**
- "Nie mogę odebrać wygranej" → Sprawdź `claimWinnings` funkcję
- "Rynek rozstrzygnięty źle" → Sprawdź Oracle logs
- "Straciłem więcej niż obstawiłem" → CRITICAL BUG!

**Zielone flagi (All good!):**
- "Właśnie wygrałem!" → ✅
- "Fajne rynki!" → ✅
- "Kiedy więcej rynków?" → ✅

---

## 📋 PHASE 8: SCALE UP (Day 2-7)

### ✅ 8.1 Add More Markets (Gradually)

**Day 2-3: +5 rynków**
**Day 4-5: +10 rynków**
**Day 6-7: +15 rynków**

**ZASADY:**
- ✅ Tylko weryfikowalne rynki (CoinGecko, Etherscan)
- ✅ Różne czasy zakończenia (6h, 12h, 24h)
- ✅ Monitor czy Cron Job nadąża
- ✅ Monitor czy nie ma rate limitów API

### ✅ 8.2 Marketing & Growth

**Farcaster:**
- Post o każdym nowym rynku
- Highlight wygranych użytkowników
- Share stats (Total Volume, Top Winners)

**Twitter:**
- Thread o launch
- Daily stats
- User testimonials

**Discord/Telegram:**
- Community dla power users
- Early access do nowych rynków
- Feedback loop

---

## 🚨 EMERGENCY PROCEDURES

### 🔴 CRITICAL: Contract Bug / Exploit

**JEŚLI:**
- Użytkownicy tracą więcej niż obstawiają
- Ktoś może odebrać cudze wygrane
- Contract jest exploitowany

**AKCJA:**
1. **PAUSE wszystko** (jeśli masz funkcję `pause()` - NIE MASZ!)
2. **Ogłoś na Farcaster/Twitter**: "We detected an issue, investigating"
3. **NIE TWÓRZ** nowych rynków
4. **Skontaktuj się** z audytorem (jeśli masz)
5. **Przygotuj plan** zwrotu funduszy użytkownikom

**PREVENTION:**
- Przed Mainnet: Zrób audit (nawet płatny, ~$5k)
- Testuj na Testnet z większymi kwotami
- Miej plan awaryjny

### 🟡 WARNING: Oracle Failure

**JEŚLI:**
- Cron Job nie rozstrzyga rynków
- API zwraca błędy (403, 429, 500)
- Rynki rozstrzygnięte źle

**AKCJA:**
1. **Sprawdź logi** Vercel Cron
2. **Sprawdź API status** (CoinGecko, Etherscan)
3. **Ręcznie rozstrzygnij** rynek przez Remix (jeśli trzeba)
4. **Ogłoś delay**: "Market resolution delayed, investigating"
5. **Fix** i redeploy

### 🟢 INFO: High Gas Prices

**JEŚLI:**
- Gas na Base > $5 per transaction
- Użytkownicy narzekają na koszty

**AKCJA:**
1. **Ogłoś**: "High gas prices on Base, consider waiting"
2. **NIE MOŻESZ** nic zrobić (to Base network issue)
3. **Poczekaj** aż gas spadnie
4. **Consider**: Dodaj info o gas price w UI

---

## ✅ FINAL CHECKLIST - PRZED LAUNCH

**Przeczytaj i zaznacz KAŻDY punkt:**

### Smart Contract:
- [ ] Deployed na **Base Mainnet** (Chain ID: 8453)
- [ ] Zweryfikowany na BaseScan
- [ ] `PROTOCOL_FEE_BPS = 250` (2.5%)
- [ ] `owner()` = mój adres
- [ ] Przetestowany (createMarket, placeBet, resolveMarket, claimWinnings)

### Frontend:
- [ ] `TROLLBET_ETH_ADDRESS` = Mainnet address
- [ ] `baseSepolia` zmienione na `base` wszędzie
- [ ] `mockMarkets.ts` ma 5 launch markets
- [ ] Deployed na Vercel Production
- [ ] Testowane w przeglądarce (Base Mainnet, nie Sepolia)

### Vercel Environment Variables:
- [ ] `BASE_MAINNET_RPC_URL` ustawione
- [ ] `DEPLOYER_PRIVATE_KEY` ustawione (NOWY wallet!)
- [ ] `CRON_SECRET` ustawione
- [ ] `ETHERSCAN_API_KEY` ustawione
- [ ] Cron Job działa (sprawdzone w logs)

### Markets:
- [ ] 5 launch markets przygotowane
- [ ] Wszystkie weryfikowalne (CoinGecko/Etherscan)
- [ ] Różne czasy zakończenia (6h, 12h, 24h)
- [ ] Pytania jasne i konkretne
- [ ] Timestamps w UTC, w przyszłości

### Monitoring:
- [ ] BaseScan dashboard otwarty
- [ ] Vercel logs otwarty
- [ ] Farcaster/Twitter gotowe do ogłoszeń
- [ ] Plan awaryjny przygotowany

### Security:
- [ ] `.env.mainnet` NIE w Git
- [ ] `DEPLOYER_PRIVATE_KEY` to NOWY wallet (nie główny)
- [ ] Mam backup private key
- [ ] Rozumiem że to PRAWDZIWE pieniądze

---

## 🎉 LAUNCH DAY TIMELINE

**T-24h:**
- [ ] Final code review
- [ ] Deploy contract
- [ ] Update frontend
- [ ] Deploy to Vercel
- [ ] Test everything

**T-12h:**
- [ ] Create launch markets
- [ ] Update mockMarkets.ts
- [ ] Final deployment
- [ ] Monitor setup

**T-1h:**
- [ ] Announce on Farcaster: "TrollBoxHub launching in 1 hour!"
- [ ] Final checks

**T-0 (LAUNCH!):**
- [ ] Post on Farcaster: "🚀 TrollBoxHub is LIVE on Base Mainnet!"
- [ ] Share link
- [ ] Monitor closely

**T+1h:**
- [ ] Check first bets
- [ ] Respond to feedback
- [ ] Fix any issues

**T+6h:**
- [ ] First market ends
- [ ] Cron Job resolves
- [ ] Users claim winnings
- [ ] Celebrate! 🎉

---

## 📞 SUPPORT & RESOURCES

**BaseScan:** https://basescan.org
**Base Docs:** https://docs.base.org
**Vercel Docs:** https://vercel.com/docs
**CoinGecko API:** https://www.coingecko.com/en/api
**Etherscan API:** https://docs.etherscan.io

**Emergency Contact:**
- Your email/Telegram for critical issues
- Base Discord for network issues
- Vercel Support for deployment issues

---

## 🎯 SUCCESS METRICS (Week 1)

**Minimum Viable Success:**
- [ ] 50+ unique users
- [ ] 100+ total bets
- [ ] 1+ ETH total volume
- [ ] 0 critical bugs
- [ ] 0 user complaints about lost funds

**Good Success:**
- [ ] 200+ unique users
- [ ] 500+ total bets
- [ ] 5+ ETH total volume
- [ ] 10+ markets created
- [ ] Positive community feedback

**Great Success:**
- [ ] 500+ unique users
- [ ] 2000+ total bets
- [ ] 20+ ETH total volume
- [ ] 20+ markets created
- [ ] Featured on Farcaster trending

---

## 🚀 READY TO LAUNCH?

**If you checked ALL boxes above: GO! 🎉**

**If you missed ANY box: STOP and fix it first! ⚠️**

Remember: **Slow is smooth, smooth is fast.** Better to launch 1 day late than lose user funds.

Good luck! 🍀

---

*Last updated: 2026-01-23*
*Version: 1.0 - Mainnet Launch*
