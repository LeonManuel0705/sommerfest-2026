# Design-Prompt: Startseite „Sportfest-Live" (Ernst-Haeckel-Gymnasium)

> Kopier alles unterhalb der Linie in die andere AI. Sie bekommt volle gestalterische Freiheit beim Look, muss aber innerhalb der Rahmenbedingungen bleiben.

---

Du bist ein erstklassiger Senior-Product-/Web-Designer **und** Frontend-Entwickler. Entwirf die **Startseite (Landing-Page)** einer Live-Wertungs-Web-App für ein Schul-Sportfest. Du hast **volle kreative Freiheit** beim Aussehen, Layout und der Inszenierung – solange du die „Muss"- und „Darf-nicht"-Punkte unten einhältst. Ziel: Es soll **nicht** nach generischem AI-/SaaS-Template aussehen, sondern eigenständig, lebendig und genau zu diesem Event passen.

## Worum es geht
- Zentrale Live-Punkte-/Wertungs-App für das **jährliche Sportfest** am **Ernst-Haeckel-Gymnasium Werder (Havel)**, organisiert von der 11. Jahrgangsstufe.
- **Teams = alle Klassen 5–10** (~22 Klassen, z. B. 5s, 6s, 7a–d + 7s …). Pro Station werden Punkte vergeben; gewichtete Gesamtsumme → Live-Rangliste.
- Läuft als **Web-App/PWA im Safari** auf MDM-gesperrten **Schul-iPads**, plus Handys der Zuschauer und ein **Beamer** (Projektor) im großen Modus.
- **Outdoor-Event** → Lesbarkeit bei Sonnenlicht mitdenken.

## Zielgruppen
Schüler (schauen am Handy zu), Lehrkräfte, Orga-Team, Stations-Helfer. Die Startseite ist die öffentliche Eingangsseite für alle.

## Tech-Rahmen (Output muss damit umsetzbar sein)
- **React 19 + Vite + TypeScript + Tailwind CSS v4 (`@theme`-Tokens) + Framer Motion + lottie-react.** Backend ist Supabase (für dich irrelevant außer der Datenform).
- **Liefere fertigen `.tsx`-Code** für die Landing-Page (eine oder mehrere Komponenten) mit Tailwind-Klassen + Framer-Motion-Animationen. Responsiv (Handy zuerst, dann Desktop).

## Vorhandene Bausteine (bitte nutzen/wiederverwenden)
- `FireBars` – vertikales, animiertes Live-Säulendiagramm (Säulen wachsen von unten, „on fire"-Glanz, Bounce bei Punktänderung). Props: `rows: LeaderboardRow[]`.
- `SkyBackground` – Vollbild-Himmel + langsam driftende Wolken (Parallax).
- `Brand` – EHG-Logo (rund) + Wortmarke „Sportfest / EHG Werder".
- `computeJahrgangWertung(rows)` – aggregiert die Klassen zu Jahrgangsstufen (Ø je Klasse).
- **Live-Datenform:** `LeaderboardRow = { team_id, name, jahrgang: number|null, farbe: string, gesamt: number }`.
- **Routen:** `/` (Landing), `/rangliste` (Live-Rangliste), `/beamer` (Großbild), `/admin` (Orga-Login).

## Design-Tokens (Tailwind v4 `@theme`)
- **Fonts:** System-Stack = SF Pro auf Apple-Geräten (`-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', …`); Display-Serife für Festliches: **Playfair Display**.
- **Farben:** Akzent = **Emerald/Grün** `moss` (`#6ee7b7 #34d399 #10b981 #059669 #047857`); heller Hintergrund `paper #f3f7f4`; Text `graphite #14201a`, weich `#5a6b61`; Gold `brass #fcd34d→#d97706`; Teal `electric`; Rosé `crimson`. Großzügige Rundung (`--radius-card: 1.5rem`).

## MUSS enthalten
1. **Schul-Identität prominent:** EHG-Logo/Wappen, „**Sportfest 2026**", Datum (Platzhalter `<DATUM>`), Ort „Werder (Havel)". → **Hero-Richtung: großes, ruhiges Event-Branding** (Wappen/Name/Datum groß und offiziell), darunter die Live-Sektion.
2. **Live-Daten sichtbar** (aktueller Stand / aktueller Führender + animierte Säulen). Vor Eventbeginn ggf. ein dezenter Zustand „bald geht's los".
3. **CTAs:** „Zum Live-Scoreboard" (`/rangliste`) und „Beamer-Modus" (`/beamer`).
4. **Dezenter Orga-Login** oben (führt zu `/admin`).
5. **Jahrgangs-Duell-Block:** kleiner Vergleich der Jahrgangsstufen 5–10 (Ø je Klasse).

## DARF NICHT
- **Keine generischen Motivations-/AI-Headlines** wie „Jeder Punkt zählt.", „Wo Sieger entstehen" o. Ä. → **absolutes No-Go.** Lieber konkrete, echte Inhalte (Daten, Datum, Stand) als Hero.
- **Keine Emojis als Icons** → echte Icons (Lucide) oder eigene SVGs.
- **Keine scharfen Ecken** → großzügig runden (rounded-2xl/3xl/full), gleichmäßige Formen.
- **Kein milchiges „Glassmorphism".** Falls Glas: **sehr transparent/durchsehbar** (Tint ~3 %, Blur ~3 px); Rand + weicher Schatten definieren die Scheibe. Echte Szene hinter dem Glas (Himmel).
- Kein austauschbarer SaaS-Template-Look.

## Stil & Anspruch
Hell, farbig (Grün-Akzente), **stark animiert** (Micro-Interactions überall, Framer-Entrances mit Stagger/Spring, lebendige Bewegung), runde gleichmäßige Formen, Liquid-Glass-Touch, **premium und eventspezifisch**. Es soll sich anfühlen wie für genau dieses Sportfest gebaut – nicht von einer KI hingeworfen.

## Output-Format
1. **Kurzes Designkonzept** (3–5 Sätze): die Leitidee, warum sie zum Event passt.
2. **Fertiger React/TSX-Code** der Landing-Page mit Tailwind-v4-Klassen + Framer Motion, der die obigen Bausteine/Tokens nutzt, responsiv und outdoor-lesbar ist.
