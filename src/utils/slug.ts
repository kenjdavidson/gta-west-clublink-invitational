/**
 * Converts a player's display name to a URL-safe slug.
 * e.g. "Ken Davidson" → "ken-davidson"
 */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
