export const SITE_NAME = "MediFlow";
export const SITE_TITLE = `${SITE_NAME} — Plataforma médica multi-consultorio`;
export const SITE_DESCRIPTION =
  "Gestión de pacientes, expediente clínico, agenda, recetas y personalización por consultorio para médicos independientes.";
export const SITE_LOCALE = "es_MX";
export const SITE_THEME_COLOR = "#14B8A6";

export const FAVICON_PATH = "/favicon.ico";
export const OG_IMAGE_PATH = "/og-image.png";

export function getSiteOrigin(): string | undefined {
  const url = import.meta.env.VITE_SITE_URL;
  if (!url || typeof url !== "string") return undefined;
  return url.replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  const origin = getSiteOrigin();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return origin ? `${origin}${normalized}` : normalized;
}

export function rootHead() {
  const origin = getSiteOrigin();
  const ogImage = absoluteUrl(OG_IMAGE_PATH);

  const meta: Array<Record<string, string>> = [
    { charSet: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { title: SITE_TITLE },
    { name: "description", content: SITE_DESCRIPTION },
    { name: "application-name", content: SITE_NAME },
    { name: "theme-color", content: SITE_THEME_COLOR },
    { name: "robots", content: "index, follow" },
    { name: "author", content: SITE_NAME },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:title", content: SITE_TITLE },
    { property: "og:description", content: SITE_DESCRIPTION },
    { property: "og:locale", content: SITE_LOCALE },
    { property: "og:image", content: ogImage },
    { property: "og:image:alt", content: `Logo de ${SITE_NAME}` },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: SITE_TITLE },
    { name: "twitter:description", content: SITE_DESCRIPTION },
    { name: "twitter:image", content: ogImage },
  ];

  const links: Array<Record<string, string>> = [
    { rel: "icon", href: FAVICON_PATH, type: "image/x-icon", sizes: "any" },
    { rel: "apple-touch-icon", href: OG_IMAGE_PATH },
  ];

  if (origin) {
    meta.push({ property: "og:url", content: origin });
    links.push({ rel: "canonical", href: origin });
  }

  return { meta, links };
}
