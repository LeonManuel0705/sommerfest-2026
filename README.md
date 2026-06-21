# 🏆 Sportfest · Live-Punktesystem

Zentrales Punkte-System für das Sportfest am **Ernst-Haeckel-Gymnasium Werder (Havel)**.
Helfer tragen an ihren Stationen Punkte ein, alle sehen den Stand in Echtzeit – auf iPad, Handy, Laptop und Beamer.

Läuft komplett im **Browser (Safari)** – kein App-Store, kein Installieren. Perfekt für die gesperrten Schul-iPads.

---

## ✨ Features

- **Live-Rangliste** für alle Klassen (5s–10s), aktualisiert sich automatisch in Echtzeit.
- **Helfer-Ansicht pro Station** – per QR-Code/Link + **PIN** geschützt. Jeder Helfer trägt nur seine Station ein.
- **Offline-Puffer**: Eingaben werden lokal gespeichert und automatisch nachgesendet, wenn das WLAN wackelt. Kein Punkt geht verloren.
- **Beamer-Modus** mit Podium, Animationen und Konfetti beim Führungswechsel.
- **Admin-Panel**: Klassen & Stationen verwalten, PINs setzen, QR-Codes generieren, **Fairness-Gewichtung** pro Station, Werte korrigieren, Protokoll (wer hat wann was geändert), **CSV-/PDF-Export** für die Siegerehrung.

## 🔒 Sicherheit (warum Mitschüler keine Punkte fälschen können)

- Punkte schreiben geht **nur über die Server-Funktion `submit_score`**, die zuerst Stations-Token **und PIN** prüft.
- **PINs liegen bcrypt-gehasht** in der Datenbank und sind über die API **nicht auslesbar**.
- Direktes Schreiben in die Tabellen ist per **Row-Level-Security** für die Öffentlichkeit gesperrt – auch wer den (öffentlichen) Anon-Key kennt, kommt nicht durch.
- Vollzugriff hat nur ein **eingeloggter Orga-Account**.

---

## 🚀 Einrichtung (einmalig, ~15 Min)

### 1. Supabase-Projekt anlegen
1. Auf [supabase.com](https://supabase.com) kostenlos registrieren → **New Project**.
2. Projektname + DB-Passwort vergeben, Region **Frankfurt** wählen.

### 2. Datenbank aufsetzen
1. Im Supabase-Dashboard links **SQL Editor** öffnen.
2. Kompletten Inhalt von [`supabase/setup.sql`](supabase/setup.sql) reinkopieren → **Run** (eine Datei, alles drin: Tabellen, Sicherheit, Funktionen, Beispiel-Klassen 5s–10s & Demo-Stationen mit PIN `1234`).
3. Du solltest unten „Success. No rows returned" sehen. Das Skript ist beliebig oft wiederholbar – setzt aber die Daten zurück, also vor dem Event nicht mehr laufen lassen.

### 3. Orga-Account anlegen + Registrierung sperren
1. **Authentication → Users → Add user** → E-Mail + Passwort für die Orga eingeben (Häkchen „Auto Confirm" setzen).
2. Wichtig: **Authentication → Sign In / Providers → Email** → **„Allow new users to sign up" ausschalten**.
   So kann sich außer eurem Orga-Account niemand anmelden (und damit niemand fremd Punkte ändern).

### 4. App verbinden
1. **Project Settings → API**: **Project URL** und **anon public key** kopieren.
2. Datei `.env` im Projekt füllen:
   ```
   VITE_SUPABASE_URL=https://deinprojekt.supabase.co
   VITE_SUPABASE_ANON_KEY=dein-anon-public-key
   ```

### 5. Starten
```bash
npm install
npm run dev
```
→ Öffnet auf http://localhost:5173

---

## 📋 Vor dem Event

Alles bequem im **Admin-Panel** (`/admin`, mit Orga-Login):

- [ ] **Klassen** prüfen/anpassen (Tab *Klassen*; Button „Standard-Klassen einfügen" legt 5s–10s automatisch an).
- [ ] **Stationen** anlegen (Tab *Stationen*): Name, Icon, Einheit, ggf. **Gewicht** (für faire Skalen).
- [ ] **PIN pro Station** setzen 🔑 (ohne PIN kann dort niemand eintragen).
- [ ] **QR-Codes ausdrucken** (jede Station hat im Detail-Bereich einen QR + Link) und an die Stationen verteilen.
- [ ] **Testlauf**: Eine Station per QR öffnen, PIN eingeben, ein paar Punkte testen, Rangliste checken – dann im Tab *Übersicht* die Testwerte wieder auf 0 setzen.

> 💡 **Gewichtung**: Bei freier Punkteingabe haben Stationen oft unterschiedliche Skalen (Weitsprung in cm vs. Tore). Mit dem Gewicht pro Station gleicht ihr das aus – Standard ist `1` (kein Effekt).

## 🎪 Am Event-Tag

- **Helfer**: QR-Code der Station scannen → PIN eingeben → Klasse antippen → Ergebnis eintragen. Fertig.
- **Beamer**: in der Aula/Halle `/beamer` öffnen, Vollbild an → Live-Rangliste mit Podium.
- **WLAN weg?** Kein Problem – Eingaben werden gepuffert und automatisch nachgesendet.
- **Fehler passiert?** Im Admin-Tab *Übersicht* jede Zelle direkt korrigieren; alles steht im *Protokoll*.

## 🏁 Siegerehrung
Im Admin-Tab *Übersicht*: **Ergebnis-CSV**, **Matrix-CSV** oder **Drucken/PDF**.

---

## 🌐 Online stellen (damit die iPads drankommen)

Die iPads brauchen eine erreichbare Adresse. Zwei Wege:

**A) Gehostet (empfohlen, klappt überall) – z.B. Vercel:**
1. Projekt auf GitHub pushen.
2. Auf [vercel.com](https://vercel.com) importieren.
3. Unter *Environment Variables* `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` eintragen → Deploy.
4. Ihr bekommt eine feste URL (z.B. `sportfest.vercel.app`). Die QR-Codes zeigen automatisch dorthin.

*(`vercel.json` für sauberes Deep-Linking liegt schon bei. Netlify geht genauso – `public/_redirects` ist dabei.)*

**B) Lokal im Schul-WLAN:** `npm run dev` auf einem Laptop; iPads im selben WLAN öffnen `http://<laptop-ip>:5173`.
Achtung: Funktioniert nur, solange der Laptop läuft und alle im selben Netz sind. Variante A ist robuster.

---

## 🗺️ Routen

| Route        | Zweck                                   |
| ------------ | --------------------------------------- |
| `/`          | Startseite / Übersicht                  |
| `/rangliste` | Öffentliche Live-Rangliste              |
| `/beamer`    | Großbild-Modus für die Halle            |
| `/s/:token`  | Helfer-Eingabe einer Station (PIN nötig)|
| `/admin`     | Orga-Panel (Login nötig)                |

## 🛠️ Tech-Stack
React 19 · Vite · TypeScript · Tailwind v4 · Framer Motion · Supabase (Postgres + Realtime + Auth)
