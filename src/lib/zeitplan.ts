import type { AppSettings, ZeitplanEintrag } from './types'

export function defaultZeitplan(s: Pick<AppSettings, 'regen_modus' | 'lehrer_spiel_aktiv'>): ZeitplanEintrag[] {
  const mittagOrt = s.regen_modus ? 'Grill & Foodcourt' : 'Auf dem Schulhof'
  const mittagDesc = s.lehrer_spiel_aktiv
    ? `${mittagOrt} — dazu das Highlight: Lehrkräfte vs. Jahrgang 11 in der Turnhalle.`
    : `${mittagOrt} — Zeit zum Essen, Quatschen und Durchatmen.`
  return [
    { time: '08:00', title: 'Treffen im Klassenraum', desc: 'Anwesenheit & Orga mit den Klassenlehrkräften.' },
    { time: '08:15', title: 'Begrüßung in der Aula', desc: 'Offizieller Start für alle gemeinsam.' },
    { time: '08:40', title: 'Stationen 1–5', desc: 'Je 15 Min. Action, dann 5 Min. Wechselzeit.' },
    { time: '10:20', title: 'Große Frühstückspause', desc: 'Foodcourt im Foyer (30 Min.).' },
    { time: '10:50', title: 'Stationen 6–10', desc: 'Weiter durch die Disziplinen.' },
    { time: '12:30', title: 'Mittagspause & Grillen', desc: mittagDesc },
    { time: '13:20', title: 'Letzte Station', desc: 'Station 11 für alle Klassen.' },
    { time: '13:40', title: 'Tanzshow', desc: 'Auftritt des WP-Kurses Tanz in der Aula.' },
    { time: '14:00', title: 'Siegerehrung', desc: 'Großer Abschluss in der Aula — wer ist die beste Klasse?' },
  ]
}

export function aktiverZeitplan(s: AppSettings): ZeitplanEintrag[] {
  return s.zeitplan && s.zeitplan.length > 0 ? s.zeitplan : defaultZeitplan(s)
}
