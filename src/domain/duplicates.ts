import { normaliseLocation } from './labels';
import type { CategoryId, Complaint } from './types';

/** Active complaints with the same category at the same normalised location. Newest first. */
export function findSimilar(complaints: Complaint[], category: CategoryId, location: string): Complaint[] {
  const key = normaliseLocation(location);
  if (!key) return [];
  return complaints
    .filter((c) => c.status !== 'resolved' && c.category === category && c.locationKey === key)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Up to `limit` distinct locations used before, most used first. */
export function locationSuggestions(complaints: Complaint[], limit = 5): string[] {
  // Label is the first spelling used at that place; recency breaks ties in the ordering.
  const counts = new Map<string, { label: string; count: number; last: string; first: string }>();
  for (const c of complaints) {
    const entry = counts.get(c.locationKey);
    if (entry) {
      entry.count += 1;
      if (c.createdAt > entry.last) entry.last = c.createdAt;
      if (c.createdAt < entry.first) {
        entry.first = c.createdAt;
        entry.label = c.location;
      }
    } else counts.set(c.locationKey, { label: c.location, count: 1, last: c.createdAt, first: c.createdAt });
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || b.last.localeCompare(a.last))
    .slice(0, limit)
    .map((e) => e.label);
}
