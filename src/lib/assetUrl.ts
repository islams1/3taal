/**
 * Absolute URL for a file in public/. Needed for images passed through a CSS
 * custom property (`--photo: url(...)`): a relative url() there resolves against
 * the stylesheet (/assets/...) in production, not the page, and 404s.
 */
export const assetUrl = (path: string) => new URL(`${import.meta.env.BASE_URL}${path}`, document.baseURI).href
