# Sales Coach Dashboard

Dashboard do analizy raportów z rozmów sprzedażowych.
Dane z Fireflies → Claude (Make) → Google Sheets → ta apka.

---

## 🚀 Deploy na Vercel (5 minut)

### Krok 1: Wrzuć kod na GitHub

```bash
# W terminalu, w folderze projektu:
git init
git add .
git commit -m "initial commit"
```

Idź na https://github.com/new → stwórz repo `sales-coach` → i:

```bash
git remote add origin https://github.com/TWOJ_USERNAME/sales-coach.git
git branch -M main
git push -u origin main
```

### Krok 2: Deploy na Vercel

1. Wejdź na https://vercel.com → **Sign up with GitHub** (darmowe)
2. Kliknij **"Add New Project"**
3. Zaimportuj repo `sales-coach`
4. Kliknij **Deploy** — nic nie zmieniaj w ustawieniach
5. Po ~60 sekundach dostaniesz link: `https://sales-coach-xxx.vercel.app`
6. Ten link wysyłasz zespołowi ✅

---

## 📊 Podłączenie Google Sheets

### Krok 1: Struktura arkusza

Stwórz Google Sheet z takimi kolumnami (wiersz 1 = nagłówki):

| data | handlowiec | rola | klient | typ_spotkania | ocena_kwalifikacji | deal_health | sales_strengths | sales_weaknesses | sales_actions | rel_strengths | rel_weaknesses | rel_actions |
|------|-----------|------|--------|---------------|-------------------|-------------|-----------------|------------------|---------------|---------------|----------------|-------------|

- `deal_health`: `red`, `yellow`, lub `green`
- `ocena_kwalifikacji`: liczba 0-100
- Kolumny `_strengths`, `_weaknesses`, `_actions`: JSON array, np.:
  ```
  ["Punkt 1","Punkt 2","Punkt 3"]
  ```

### Krok 2: Opublikuj arkusz

1. Google Sheets → **Plik** → **Udostępnij** → **Opublikuj w internecie**
2. Wybierz konkretny arkusz (nie "Cały dokument")
3. Format: **CSV**
4. Kliknij **Opublikuj**
5. Skopiuj URL

### Krok 3: Wklej URL do apki

Otwórz `src/app/Dashboard.js` i zmień linię:

```js
const SHEET_CSV_URL = null;
```

na:

```js
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/TWOJ_ID/export?format=csv&gid=0";
```

Zrób commit + push → Vercel automatycznie się zdeployuje.

---

## 🔧 Konfiguracja Make.com

W scenariuszu Make, **po module Claude** (który generuje raport), dodaj moduł:
**Google Sheets → Add a Row**

W prompcie do Claude w Make dodaj na końcu:

```
Na samym końcu odpowiedzi dodaj blok JSON (i nic więcej po nim) w formacie:

---JSON---
{
  "data": "YYYY-MM-DD",
  "handlowiec": "Imię Nazwisko",
  "klient": "Firma / Osoba kontaktowa",
  "typ_spotkania": "Discovery / Demo / Discovery + Demo",
  "ocena_kwalifikacji": <liczba 0-100>,
  "deal_health": "red/yellow/green",
  "sales_strengths": ["mocna 1", "mocna 2", "mocna 3"],
  "sales_weaknesses": ["słaba 1", "słaba 2", "słaba 3"],
  "sales_actions": ["action 1", "action 2", "action 3"],
  "rel_strengths": ["mocna rel 1", "mocna rel 2", "mocna rel 3"],
  "rel_weaknesses": ["słaba rel 1", "słaba rel 2", "słaba rel 3"],
  "rel_actions": ["action rel 1", "action rel 2", "action rel 3"]
}
---JSON---
```

W Make użyj modułu **Text Parser → Match Pattern** żeby wyciągnąć JSON,
potem **JSON → Parse JSON**, a na końcu **Google Sheets → Add a Row**.

---

## 💻 Development lokalny

```bash
npm install
npm run dev
```

Otwórz http://localhost:3000

---

## Koszt: 0 zł

- Vercel: darmowy plan (wystarczy dla 3 osób)
- Google Sheets: darmowe
- Claude API: już płacisz w Make
- Apka: statyczna, zero backendu
