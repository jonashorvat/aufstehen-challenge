# Aufsteh-Challenge App

## Setup

### 1. Upstash Redis
Gleiche Instanz wie Tippspiel nutzbar — alle Keys mit `ac:` Prefix, kein Konflikt.

### 2. Vercel
1. GitHub Repo erstellen → Code pushen
2. Vercel importieren
3. Environment Variables:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `ADMIN_PIN` (z.B. `4321`)

### 3. Teilnehmer anpassen
In `lib/config.js` → `INITIAL_PARTICIPANTS` Array prüfen/anpassen.

## Features
- Täglicher Check-in (mit "Entschuldigt" für Urlaub/Feiertage)
- Streak-Counter pro Person
- Pott-Fortschrittsanzeige (Ziel: 240 €)
- Montags-Abrechnung: jeder meldet seine Wochenoptionen selbst
- Strafpunkte werden automatisch gezählt und zum Pott addiert
- Vollständiges Regelwerk in der App
- Admin-Panel für manuelle Korrekturen

## Teilnehmer & Varianten
| Name   | Variante  | Optionen         |
|--------|-----------|------------------|
| Andi   | Minimal   | Sport Basic, f   |
| Markus | Minimal   | a, f             |
| David  | Minimal   | e                |
| Helmut | Minimal   | g, f             |
| Paul   | Mr. Boost | f                |
| Simon  | Minimal+  | f, g             |
| Jonas  | Minimal   | a, f             |
