import { SiteHeader } from '@/components/site/SiteHeader'
import { SiteFooter } from '@/components/site/SiteFooter'

export default function Impressum() {
  return (
    <div className="min-h-dvh bg-paper">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
        <h1 className="font-display text-4xl text-graphite sm:text-5xl">Impressum</h1>

        <section className="mt-8 space-y-6 text-[15px] leading-relaxed text-graphite-soft">
          <div>
            <h2 className="font-bold text-graphite">Angaben gemäß § 5 DDG / § 18 Abs. 2 MStV</h2>
            <p className="mt-2">
              Leon Manuel Töpper
              <br />
              Sommerfest 2026 · Ernst-Haeckel-Gymnasium Werder (Havel)
            </p>
          </div>

          <div>
            <h2 className="font-bold text-graphite">Kontakt</h2>
            <p className="mt-2">
              E-Mail:{' '}
              <a href="mailto:sommerfest.2026@ehgwerder.de" className="font-medium text-moss-700 underline-offset-2 hover:underline">
                sommerfest.2026@ehgwerder.de
              </a>
            </p>
          </div>

          <div>
            <h2 className="font-bold text-graphite">Verantwortlich für den Inhalt</h2>
            <p className="mt-2">Leon Manuel Töpper (Kontakt siehe oben)</p>
          </div>

          <div>
            <h2 className="font-bold text-graphite">Über dieses Projekt</h2>
            <p className="mt-2">
              Diese Seite ist ein nicht-kommerzielles Projekt des Jahrgangs 11 zur Live-Wertung des Sommerfests am Ernst-Haeckel-Gymnasium Werder (Havel). Sie dient
              ausschließlich der internen Anzeige der Punktestände für die Schülerinnen und Schüler.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-graphite">Haftung für Inhalte</h2>
            <p className="mt-2">
              Für die Richtigkeit der angezeigten Punktestände wird keine Gewähr übernommen. Maßgeblich ist die offizielle Auswertung des Sommerfests.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
