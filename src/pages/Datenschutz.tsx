import { SiteHeader } from '@/components/site/SiteHeader'
import { SiteFooter } from '@/components/site/SiteFooter'

export default function Datenschutz() {
  return (
    <div className="min-h-dvh bg-paper">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
        <h1 className="font-display text-4xl text-graphite sm:text-5xl">Datenschutz</h1>

        <section className="mt-8 space-y-6 text-[15px] leading-relaxed text-graphite-soft">
          <div>
            <h2 className="font-bold text-graphite">Verantwortlicher</h2>
            <p className="mt-2">
              Leon Manuel Töpper · E-Mail:{' '}
              <a href="mailto:sommerfest.2026@ehgwerder.de" className="font-medium text-moss-700 underline-offset-2 hover:underline">
                sommerfest.2026@ehgwerder.de
              </a>
            </p>
          </div>

          <div>
            <h2 className="font-bold text-graphite">Welche Daten verarbeitet werden</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>
                <b>Server-Logdaten</b> beim Aufruf der Seite (u. a. gekürzte IP-Adresse, Zeitpunkt, Browsertyp) — technisch notwendig für den Betrieb (Art. 6 Abs. 1 lit. f DSGVO).
              </li>
              <li>
                <b>Orga-Zugang:</b> E-Mail-Adresse und Anmeldedaten der Organisator:innen für den geschützten Admin-Bereich.
              </li>
              <li>
                <b>Wertungsdaten:</b> Punktestände je Klasse. Dies sind <b>keine personenbezogenen Schülerdaten</b> (es werden Klassen, keine Namen erfasst).
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-bold text-graphite">Hosting & Auftragsverarbeitung</h2>
            <p className="mt-2">
              Die Seite wird bei <b>Netlify</b> gehostet; Datenbank und Anmeldung laufen über <b>Supabase</b>. Mit diesen Anbietern besteht jeweils ein Vertrag zur
              Auftragsverarbeitung (AVV). Eine Datenübermittlung in Drittländer erfolgt ggf. auf Basis der EU-Standardvertragsklauseln.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-graphite">Cookies & Tracking</h2>
            <p className="mt-2">
              Diese Seite setzt <b>keine Analyse- oder Tracking-Cookies</b> ein. Es werden nur technisch notwendige Daten verarbeitet.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-graphite">Deine Rechte</h2>
            <p className="mt-2">
              Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie ein
              Beschwerderecht bei der zuständigen Aufsichtsbehörde. Kontakt:{' '}
              <a href="mailto:sommerfest.2026@ehgwerder.de" className="font-medium text-moss-700 underline-offset-2 hover:underline">
                sommerfest.2026@ehgwerder.de
              </a>
              .
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
