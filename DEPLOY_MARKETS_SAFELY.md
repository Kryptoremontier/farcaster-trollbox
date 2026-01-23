# 🔐 Bezpieczne Dodawanie Marketów

## ⚠️ WAŻNE: Bezpieczeństwo Private Key

**NIGDY nie udostępniaj swojego private key nikomu!**
- Nie wysyłaj przez chat
- Nie commituj do gita
- Trzymaj tylko lokalnie w `.env`

---

## 🚀 Instrukcja Krok po Kroku

### 1. Utwórz plik `.env` w głównym folderze projektu

```bash
# W głównym folderze (farcaster-trollbox/)
touch .env
```

### 2. Dodaj swój private key do `.env`

Otwórz plik `.env` i wpisz:

```env
DEPLOYER_PRIVATE_KEY=0xyour_private_key_here
```

**Gdzie znaleźć private key?**
- MetaMask → Kliknij 3 kropki → Account Details → Export Private Key
- **UWAGA:** To musi być konto które jest ownerem kontraktu!

### 3. Sprawdź czy `.env` jest w `.gitignore`

Plik `.env` **NIE MOŻE** być w gicie! Sprawdź:

```bash
cat .gitignore | grep .env
```

Jeśli nie ma, dodaj:
```
.env
.env.local
```

### 4. Uruchom skrypt dodawania marketów

```bash
node scripts/add-markets-batch.mjs
```

### 5. Poczekaj na potwierdzenia

Skrypt:
- Doda **3 markety testowe** (30 minut)
- Doda **12 marketów prawdziwych**
- Pokaże linki do transakcji na BaseScan

---

## 📋 Co Robi Skrypt?

### Markety Testowe (30 minut):
1. "Will BTC price end with digit 5 in next 30min?"
2. "Will ETH/BTC ratio be above 0.04 in 30min?"
3. "Will any whale move >1000 ETH in next 30min?"

**Cel:** Szybko przetestować:
- Stawianie zakładów
- Rozwiązywanie marketów
- Wypłatę wygranych
- Twój zarobek (2.5% fee)

### Markety Prawdziwe:
- $DEGEN price (7 dni)
- Elon Pepe meme (18h)
- ETH flip BTC (2026)
- Base TVL (15 dni)
- Vitalik AI tweet (5 dni)
- Farcaster users (60 dni)
- Pudgy Penguin NFT (20 dni)
- ETH Merge anniversary (30 dni)
- Coinbase $DEGEN listing (2026)
- Trump crypto debate (45 dni)
- Super Bowl crypto ad (2027)
- SEC ETH ETF (74 dni)

---

## ✅ Po Dodaniu Marketów

### Test Flow (30 minut):

1. **Odśwież aplikację** - powinny pojawić się nowe markety
2. **Postaw zakład** na testowy market (np. 0.001 ETH)
3. **Poczekaj 30 minut** aż market się zakończy
4. **Rozwiąż market** w Remix:
   ```
   resolveMarket(marketId: 1, winningSide: true)
   ```
5. **Odbierz wygrane** w aplikacji (przycisk "Claim Winnings")
6. **Sprawdź swój wallet** - powinieneś dostać 2.5% fee

### Sprawdź Fee:

W Remix wywołaj:
```
accumulatedFees()
```

Potem:
```
withdrawFees()
```

---

## 🔍 Troubleshooting

### Błąd: "DEPLOYER_PRIVATE_KEY not found"
- Sprawdź czy plik `.env` istnieje
- Sprawdź czy zmienna jest poprawnie nazwana
- Sprawdź czy private key zaczyna się od `0x`

### Błąd: "Not owner"
- Upewnij się że używasz tego samego konta które deployowało kontrakt
- Sprawdź owner w Remix: `owner()`

### Błąd: "Invalid end time"
- Sprawdź czy timestamp jest w przyszłości
- Pamiętaj: Solidity używa sekund, nie milisekund

---

## 💡 Wskazówki

- Skrypt czeka 2 sekundy między transakcjami (aby nie spamować)
- Każda transakcja kosztuje ~50-100k gas
- Możesz przerwać skrypt (Ctrl+C) i uruchomić ponownie
- Transakcje które się powiodły nie będą powtarzane

---

## 🎯 Następne Kroki

Po dodaniu wszystkich marketów:
1. ✅ Przetestuj zakłady na 30min marketach
2. ✅ Rozwiąż testowe markety po 30min
3. ✅ Sprawdź czy wypłaty działają
4. ✅ Wypłać swoje fee jako owner
5. 🚀 Launch na produkcję!
