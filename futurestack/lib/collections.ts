const STORAGE_KEY = "discova-saved-tools";

export function getSavedToolSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isToolSaved(slug: string): boolean {
  return getSavedToolSlugs().includes(slug);
}

export function toggleSavedTool(slug: string): boolean {
  const current = getSavedToolSlugs();
  const next = current.includes(slug)
    ? current.filter((s) => s !== slug)
    : [...current, slug];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next.includes(slug);
}

export function removeSavedTool(slug: string): void {
  const next = getSavedToolSlugs().filter((s) => s !== slug);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
