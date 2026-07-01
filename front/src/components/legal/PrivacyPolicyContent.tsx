import {
  PRIVACY_CONTACT_EMAIL,
  PRIVACY_LAST_UPDATED,
  PRIVACY_SECTIONS,
} from "@/content/privacyPolicy";
import { MEDIFLOW_PLATFORM } from "@/lib/theme/platformBranding";

export function PrivacyPolicyContent() {
  return (
    <article className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Política de privacidad
        </h1>
        <p className="text-sm text-muted-foreground">
          {MEDIFLOW_PLATFORM.name} · Última actualización: {PRIVACY_LAST_UPDATED}
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Esta política describe cómo {MEDIFLOW_PLATFORM.name} trata los datos personales de
          usuarios de la plataforma y de pacientes cuya información gestionan los consultorios
          registrados.
        </p>
      </header>

      <nav aria-label="Índice de la política de privacidad" className="rounded-xl border bg-card p-5">
        <h2 className="text-sm font-semibold mb-3">Contenido</h2>
        <ol className="space-y-1.5 text-sm">
          {PRIVACY_SECTIONS.map((section, index) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="text-primary hover:underline"
              >
                {index + 1}. {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-10">
        {PRIVACY_SECTIONS.map((section, index) => (
          <section key={section.id} id={section.id} className="scroll-mt-8 space-y-3">
            <h2 className="font-display text-xl font-semibold">
              {index + 1}. {section.title}
            </h2>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              {section.paragraphs.map((paragraph, i) => (
                <p key={i}>
                  {paragraph.includes(PRIVACY_CONTACT_EMAIL) ? (
                    <>
                      {paragraph.split(PRIVACY_CONTACT_EMAIL)[0]}
                      <a
                        href={`mailto:${PRIVACY_CONTACT_EMAIL}`}
                        className="text-primary hover:underline"
                      >
                        {PRIVACY_CONTACT_EMAIL}
                      </a>
                      {paragraph.split(PRIVACY_CONTACT_EMAIL)[1]}
                    </>
                  ) : (
                    paragraph
                  )}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
