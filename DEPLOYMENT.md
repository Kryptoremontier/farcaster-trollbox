# 🚀 Instrukcja Wdrożenia DegenBox

## Krok 1: Przygotowanie do GitHub

1. **Zainicjuj repozytorium Git** (jeśli jeszcze nie jest zainicjowane):
```bash
git init
git add .
git commit -m "Initial commit: DegenBox Farcaster Frame v2"
```

2. **Utwórz repozytorium na GitHub**:
   - Wejdź na https://github.com/new
   - Nazwij repozytorium: `farcaster-trollbox` lub `degenbox`
   - NIE zaznaczaj "Add README" (już masz README.md)
   - Kliknij "Create repository"

3. **Połącz z GitHub**:
```bash
git remote add origin https://github.com/TwojeUsername/nazwa-repo.git
git branch -M main
git push -u origin main
```

## Krok 2: Wdrożenie na Netlify

1. **Zaloguj się na Netlify**:
   - Wejdź na https://app.netlify.com/
   - Zaloguj się lub utwórz konto

2. **Import projektu**:
   - Kliknij "Add new site" → "Import an existing project"
   - Wybierz "GitHub"
   - Autoryzuj Netlify do dostępu do Twojego GitHub
   - Wybierz repozytorium `farcaster-trollbox` lub `degenbox`

3. **Konfiguracja**:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - Netlify automatycznie wykryje Next.js i użyje `netlify.toml`

4. **Zmienne środowiskowe**:
   - W Netlify, przejdź do: Site settings → Environment variables
   - Dodaj zmienną:
     - **Key**: `NEXT_PUBLIC_URL`
     - **Value**: Twój URL Netlify (np. `https://degenbox.netlify.app`)
   
5. **Deploy**:
   - Kliknij "Deploy site"
   - Poczekaj na zakończenie budowania (2-5 minut)

## Krok 3: Aktualizacja manifestu Farcaster

Po wdrożeniu, zaktualizuj `public/.well-known/farcaster.json`:

```json
{
  "accountAssociation": {
    "payload": "eyJkb21haW4iOiJUWÓJ-NETLIFY-DOMAIN.netlify.app"}",
    ...
  },
  "frame": {
    "homeUrl": "https://TWÓJ-NETLIFY-DOMAIN.netlify.app"
  }
}
```

Następnie:
```bash
git add public/.well-known/farcaster.json
git commit -m "Update Farcaster manifest with production domain"
git push
```

Netlify automatycznie zbuduje i wdroży aktualizację.

## Krok 4: Testowanie w Farcaster

1. **Otwórz Frame Playground**:
   - Na telefonie z Warpcast, wejdź na: https://warpcast.com/~/developers/frame-playground

2. **Wpisz URL swojej aplikacji**:
   - `https://TWÓJ-NETLIFY-DOMAIN.netlify.app`

3. **Kliknij "Launch"** i przetestuj aplikację!

## 🔧 Rozwiązywanie problemów

### Build się nie udał
- Sprawdź logi budowania w Netlify
- Upewnij się, że `npm run build` działa lokalnie

### Aplikacja nie ładuje się w Farcaster
- Sprawdź czy `farcaster.json` jest dostępny pod: `https://TWÓJ-DOMAIN/.well-known/farcaster.json`
- Upewnij się, że domena w manifeście jest poprawna

### Błędy TypeScript
- Upewnij się, że wszystkie zależności są zainstalowane
- Sprawdź `tsconfig.json` - ścieżki muszą być poprawne

## 📝 Dodatkowe opcje

### Custom Domain
1. W Netlify: Domain settings → Add custom domain
2. Skonfiguruj DNS zgodnie z instrukcjami Netlify
3. Zaktualizuj `NEXT_PUBLIC_URL` i `farcaster.json`

### Monitoring
- Netlify Analytics: automatycznie dostępne
- Error tracking: rozważ dodanie Sentry

## ✅ Checklist przed wdrożeniem

- [ ] Build działa lokalnie (`npm run build`)
- [ ] Wszystkie zmiany są commitowane do Git
- [ ] Repozytorium jest na GitHub
- [ ] `NEXT_PUBLIC_URL` jest ustawiony w Netlify
- [ ] `farcaster.json` ma poprawną domenę
- [ ] Aplikacja działa w Frame Playground

---

🎉 Gratulacje! Twoja aplikacja DegenBox jest live!
