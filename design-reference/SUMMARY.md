# Design-Referenz — Kite-Seite (sportfest-2026.kite.space)

Erfasst am 2026-06-21 von der publizierten Seite. Zweck: das Design in das bestehende React-Projekt übernehmen/kombinieren. Screenshots in `screenshots/`, voller HTML in `raw.html`, CSS in `all.css`.

## Design-System
- **Fonts:** `DM Serif Display` für große Headings („Sportfest", „Aktuelle Spitzenreiter", „Jahrgangs-Duell", „Zeitplan"), `Inter` für Body.
- **Farben:**
  - Primär-Grün `#008037`, dunkler `#00662c`, Grün-Tints `#f0fdf4` / `#dcfce7`
  - Text-Navy `#101828`, Graustufen `#4a5565` / `#6a7282` / `#99a1af`
  - Rot-Akzent `#e31e24` (Datum, „Gesamtwertung"-Icon), `#fb2c36`
  - Hintergrund hell `#f8f9fa` / `#f9fafb`, Weiß, Orange-Tints `#fff7ed`/`#ffedd5`
- **Look:** sehr hell/luftig, viel Weißraum, weiße Karten mit großzügiger Rundung + weichem Schatten, Stadion-Foto im Hero.
- **Assets:** Hero-BG `screenshots/hero-bg.png` (Original: static.kite.ai …/iter1-hero-bg.png); außerdem `iter1-catering.png`, `iter1-map-placeholder.png` auf static.kite.ai.

## Seitenaufbau (von oben nach unten)
1. **Header:** EHG-Logo + Wortmarke „Sportfest 2026" · Nav: Stationen / Scoreboard / Beamer · grüner Button „Orga-Login".
2. **Hero:** Stadion-Hintergrund. Datum-Pill „7. Juli 2026" (rot). „**Sportfest**" (Navy-Serife) + „**2026**" (Grün-Serife). „Ernst-Haeckel-Gymnasium Werder (Havel)" · „Organisiert vom Jahrgang 11". CTAs: „Zum Live-Scoreboard" (grün, Pokal-Icon) + „Beamer-Ansicht" (weiß, Monitor-Icon).
3. **Aktuelle Spitzenreiter** — „Live-Stand der klassenübergreifenden Wertung". Podium aus 3 Karten: Platz 2 = 9b (1320), Platz 1 (mittig, erhöht, grünes Pokal-Badge) = 10a (1450), Platz 3 = 8c (1280). Karte: Rang-Kreis oben, große Punktzahl, „PUNKTE", farbiger Unterstrich, Klassenname.
4. **Gesamtwertung → „Jahrgangs-Duell":** Balkendiagramm der Stufen 5–10 (Werte ~950 / 1080 / 1150 / 1280 / 2240 / 2700; höchste Balken grün/rot).
5. **Ablauf → „Zeitplan":** Timeline mit Punkten:
   - 08:00 **Eröffnung** — Begrüßung durch den Jahrgang 11 auf dem Sportplatz.
   - 08:30 **Start Stationsbetrieb** — Die Riegen verteilen sich auf die Stationen 1–20.
   - 12:00 **Mittagspause** — Grill, Waffeln und Getränke am Verpflegungsstand.
   - 13:00 **Volleyball Turnier** — Die Finalspiele der Jahrgänge 9 und 10 in der Halle.
   - 15:00 **Siegerehrung** — Bekanntgabe der Gewinner und Übergabe des Wanderpokals.
6. **Wettkampf — „12 Stationen — eine Siegerklasse":** „Von Allgemeinwissen-Quiz über Sackhüpfen bis zum Volleyball-Turnier. Alle Klassen kämpfen an denselben Stationen um den Wanderpokal." Stations-Beispiele: Allgemeinwissen Quiz, Lehrkräfte Quiz, Hobbyhorsing, Wasserpong, Just Dance, Bobbycar Racing (+ weitere). Button „Alle Stationen ansehen".
7. **Orientierung → „Lageplan":** Platzhalter „Lageplan folgt in Kürze".
8. **Verpflegung — „Für Stärkung ist gesorgt":** Herzhaft & Süß (Gegrilltes, Crepes, Waffeln) · Kuchenbasar (Selbstgebackenes vom Jahrgang 11) · Erfrischungen (kalte Getränke).
9. **Footer:** Impressum · Datenschutz.

## Kombi-Plan (Design hier ← Logik aus bestehendem React-Projekt)
- **Live anbinden (an Supabase):** Spitzenreiter-Podium ← echte `leaderboard`-Daten (Top 3); Jahrgangs-Duell ← `computeJahrgangWertung`; Header-Links → `/rangliste`, `/beamer`, `/admin`.
- **Statisch übernehmen:** Zeitplan, Stationen-Liste, Verpflegung, Lageplan-Platzhalter, Footer.
- **Tokens:** `DM Serif Display` als Display-Font ergänzen; Grün ggf. auf `#008037` angleichen oder bei bestehendem `moss` bleiben (abstimmen).
