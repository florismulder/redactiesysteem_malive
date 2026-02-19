# MaLive Draaiboek — Koppeling met Google Sheets
## In 10 minuten live

---

## Stap 1 — Google Sheet aanmaken

1. Ga naar **sheets.google.com** en maak een nieuw spreadsheet aan
2. Geef het een naam, bijv. `MaLive Draaiboek`
3. Laat de tabbladen voorlopig leeg — het script maakt ze zelf aan

---

## Stap 2 — Apps Script instellen

1. Open het spreadsheet
2. Klik in het menu op **Extensions → Apps Script**
3. Verwijder alle bestaande code in `Code.gs`
4. Plak de volledige inhoud van **Code.gs** (bijgevoegd bestand)
5. Klik op **Save** (💾) of Ctrl+S

---

## Stap 3 — Deployen als Web App

1. Klik rechtsboven op **Deploy → New deployment**
2. Klik op het tandwiel (⚙) naast "Select type" → kies **Web app**
3. Stel in:
   - **Description:** `MaLive API v1`
   - **Execute as:** `Me (jouw@email.com)`
   - **Who has access:** `Anyone`  ← dit is nodig zodat het team er bij kan
4. Klik **Deploy**
5. Geef toestemming als Google daarom vraagt (éénmalig)
6. **Kopieer de URL** — die ziet eruit als:
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```

---

## Stap 4 — URL in de webapp plakken

Open **malive-draaiboek-v3.jsx** en zoek bovenaan:

```js
const API_URL = "https://script.google.com/macros/s/JOUW_DEPLOYMENT_ID/exec";
```

Vervang `JOUW_DEPLOYMENT_ID` door je echte deployment ID:

```js
const API_URL = "https://script.google.com/macros/s/AKfycby.../exec";
```

---

## Stap 5 — Webapp hosten

### Optie A: Lokaal draaien (voor testen)
```bash
# Vereist: Node.js + npm
npm create vite@latest malive -- --template react
cd malive
# Vervang src/App.jsx door malive-draaiboek-v3.jsx
npm install
npm run dev
```
Open dan http://localhost:5173 in de browser.

### Optie B: Gratis hosten op Vercel
```bash
npm install -g vercel
vercel
```
Vercel geeft je een publieke URL die iedereen in het team kan openen.

### Optie C: Gratis hosten op Netlify
Sleep de `dist/` map (na `npm run build`) naar **app.netlify.com/drop**

---

## Hoe werkt de opslag?

Elke keer dat iemand iets invult, wordt na **1,2 seconden stilstand** automatisch gesynchroniseerd naar Google Sheets. Er is geen "Opslaan" knop nodig.

De sync-status is zichtbaar rechtsboven in de header:
- `⟳ Laden…` — app haalt data op bij opstarten
- `⟳ Opslaan…` — bezig met wegschrijven
- `✓ Gesynchroniseerd` — alles opgeslagen
- `✕ Sync mislukt` — controleer internet of Apps Script URL

---

## Wat staat er in de Sheet?

Het script maakt automatisch 4 tabbladen aan:

| Tabblad | Inhoud |
|---------|--------|
| `Rundown` | Alle ingevulde items per uitzending (artiest, tekst, duur etc.) |
| `Gasten` | Gastenlijst per uitzending |
| `Redactie` | Namenlijst per rol |
| `Uitzendingen` | Overzicht van alle uitzendingen (voor later archief) |

---

## Meerdere mensen tegelijk

Iedereen opent dezelfde URL in de browser. Omdat elke wijziging na 1,2s wordt weggeschreven, zien collega's na een pagina-refresh de meest recente versie. 

> **Tip voor later:** voeg een "ververs" knop toe of stel polling in (elke 30s herladen) voor écht real-time samenwerking.

---

## Problemen?

| Probleem | Oplossing |
|----------|-----------|
| `CORS error` in browser | Zorg dat "Who has access" op **Anyone** staat bij de deployment |
| `✕ Sync mislukt` | Controleer of de URL eindigt op `/exec` (niet `/dev`) |
| Script vraagt geen toestemming | Ga naar Apps Script → Run → `doGet` om handmatig toestemming te geven |
| Data laadt niet | Open de Apps Script URL direct in de browser — je moet JSON zien |
