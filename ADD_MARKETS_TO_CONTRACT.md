# 📋 Dodaj Markety do Kontraktu TrollBetETH

## 🎯 Aktualny Status
- ✅ Market #0: "Will BTC hit $100k in 2026?" (już dodany)
- ❌ Pozostałe 12 marketów - do dodania

---

## 🔧 Instrukcja (Remix IDE)

### Otwórz Remix:
1. Przejdź do: https://remix.ethereum.org
2. "Deploy & Run Transactions"
3. Znajdź deployed contract: `TrollBetETH at 0xc629...`
4. Rozwiń kontrakt

### Dla każdego marketu poniżej:
1. Znajdź funkcję **`createMarket`**
2. Wklej `question` i `endTime`
3. Kliknij **transact**
4. Potwierdź w MetaMask

---

## 📝 Markety do Dodania (w kolejności)

### Market #1 - $DEGEN Price
```
question: "Will $DEGEN hit $0.10 this week?"
endTime: 1738540800
```
*(30 stycznia 2026, 7 dni od teraz)*

---

### Market #2 - Elon Pepe Meme
```
question: "Will Elon Musk post a Pepe meme today?"
endTime: 1738195200
```
*(24 stycznia 2026, 18 godzin od teraz)*

---

### Market #3 - ETH Flip BTC
```
question: "Will ETH flip BTC market cap in 2025?"
endTime: 1767225600
```
*(31 grudnia 2025 - UWAGA: to już przeszłość! Zmień na 2026)*

**POPRAWIONY:**
```
question: "Will ETH flip BTC market cap in 2026?"
endTime: 1798761600
```
*(31 grudnia 2026)*

---

### Market #4 - Base TVL
```
question: "Will Base TVL exceed $2B this month?"
endTime: 1739836800
```
*(13 lutego 2026, 15 dni od teraz)*

---

### Market #5 - Vitalik AI Tweet
```
question: "Will Vitalik tweet about AI this week?"
endTime: 1738368000
```
*(27 stycznia 2026, 5 dni od teraz)*

---

### Market #6 - Farcaster Users
```
question: "Will Farcaster hit 500K users this quarter?"
endTime: 1743465600
```
*(25 marca 2026, 60 dni od teraz)*

---

### Market #7 - Pudgy Penguin NFT
```
question: "Will any Pudgy Penguin sell for >100 ETH this month?"
endTime: 1740441600
```
*(20 lutego 2026, 20 dni od teraz)*

---

### Market #8 - ETH Merge Anniversary
```
question: "Will ETH be above $3000 on Merge anniversary?"
endTime: 1741046400
```
*(27 lutego 2026, 30 dni od teraz)*

---

### Market #9 - Coinbase $DEGEN Listing
```
question: "Will Coinbase list $DEGEN token this year?"
endTime: 1798761600
```
*(31 grudnia 2026)*

---

### Market #10 - Trump Crypto Debate
```
question: "Will Trump mention crypto in next debate?"
endTime: 1742256000
```
*(12 marca 2026, 45 dni od teraz)*

---

### Market #11 - Super Bowl Crypto Ad
```
question: "Will there be a crypto ad during Super Bowl?"
endTime: 1802035200
```
*(7 lutego 2027 - Super Bowl)*

---

### Market #12 - SEC ETH ETF
```
question: "Will SEC approve spot ETH ETF this quarter?"
endTime: 1743465600
```
*(25 marca 2026, 74 dni od teraz)*

---

## ✅ Weryfikacja

Po dodaniu wszystkich marketów sprawdź:

1. W Remix wywołaj `marketCount` - powinno zwrócić **13**
2. W aplikacji odśwież - wszystkie markety powinny działać
3. Spróbuj postawić zakład na każdy market

---

## 🎯 Szybkie Kopiowanie (dla wygody)

Możesz skopiować wszystkie po kolei:

```
Market #1:
question: Will $DEGEN hit $0.10 this week?
endTime: 1738540800

Market #2:
question: Will Elon Musk post a Pepe meme today?
endTime: 1738195200

Market #3:
question: Will ETH flip BTC market cap in 2026?
endTime: 1798761600

Market #4:
question: Will Base TVL exceed $2B this month?
endTime: 1739836800

Market #5:
question: Will Vitalik tweet about AI this week?
endTime: 1738368000

Market #6:
question: Will Farcaster hit 500K users this quarter?
endTime: 1743465600

Market #7:
question: Will any Pudgy Penguin sell for >100 ETH this month?
endTime: 1740441600

Market #8:
question: Will ETH be above $3000 on Merge anniversary?
endTime: 1741046400

Market #9:
question: Will Coinbase list $DEGEN token this year?
endTime: 1798761600

Market #10:
question: Will Trump mention crypto in next debate?
endTime: 1742256000

Market #11:
question: Will there be a crypto ad during Super Bowl?
endTime: 1802035200

Market #12:
question: Will SEC approve spot ETH ETF this quarter?
endTime: 1743465600
```

---

## 💡 Uwagi

- Wszystkie timestampy są w **sekundach** (Solidity format)
- Pamiętaj o potwierdzaniu każdej transakcji w MetaMask
- Każda transakcja kosztuje ~50-100k gas
- Możesz dodawać po kilka na raz, nie musisz wszystkich od razu

---

## 🚀 Po dodaniu marketów

Aplikacja automatycznie wykryje nowe markety i będzie można na nie stawiać zakłady!
