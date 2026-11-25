/** Join truthy class names. */
export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function noteSlugFromPath(pathname: string): string | null {
  if (!pathname.startsWith("/notes/")) return null;
  const slug = pathname.slice("/notes/".length).replace(/\/$/, "");
  if (!slug || slug.includes("/")) return null;
  try {
    const decoded = decodeURIComponent(slug);
    return decoded.includes("/") ? null : decoded;
  } catch {
    return null;
  }
}
