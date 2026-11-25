import { SEVERITY_RANK } from './labels';
import type { CategoryId, Complaint, Severity } from './types';

export type HotspotKind = 'repeated' | 'mixed';

export interface Hotspot {
  key: string; // stable id for lists
  kind: HotspotKind;
  locationKey: string;
  location: string; // display text of the newest complaint
  category: CategoryId | null; // set for repeated hotspots
  categories: CategoryId[];
  count: number;
  highestSeverity: Severity | null;
  complaintIds: string[];
}

function highest(list: Complaint[]): Severity | null {
  let best: Severity | null = null;
  for (const c of list) {
    if (c.severity && (!best || SEVERITY_RANK[c.severity] > SEVERITY_RANK[best])) best = c.severity;
  }
  return best;
}

function rank(s: Severity | null): number {
  return s ? SEVERITY_RANK[s] : 0;
}

function sortHotspots(list: Hotspot[]): Hotspot[] {
  return list.sort(
    (a, b) => b.count - a.count || rank(b.highestSeverity) - rank(a.highestSeverity) || a.location.localeCompare(b.location),
  );
}

function newestLocation(list: Complaint[]): string {
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.location ?? '';
}

function groupBy<T>(items: T[], keyOf: (t: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = keyOf(item);
    const arr = map.get(k);
    if (arr) arr.push(item);
    else map.set(k, [item]);
  }
  return map;
}

/** Repeated: two or more unresolved complaints with the same category and the same location key. */
export function repeatedHotspots(complaints: Complaint[]): Hotspot[] {
  const active = complaints.filter((c) => c.status !== 'resolved');
  const out: Hotspot[] = [];
  for (const [, list] of groupBy(active, (c) => `${c.category}|${c.locationKey}`)) {
    if (list.length < 2) continue;
    const first = list[0];
    out.push({
      key: `repeated|${first.category}|${first.locationKey}`,
      kind: 'repeated',
      locationKey: first.locationKey,
      location: newestLocation(list),
      category: first.category,
      categories: [first.category],
      count: list.length,
      highestSeverity: highest(list),
      complaintIds: list.map((c) => c.id),
    });
  }
  return sortHotspots(out);
}

/** Mixed: two or more different categories among unresolved complaints at the same location key. */
export function mixedHotspots(complaints: Complaint[]): Hotspot[] {
  const active = complaints.filter((c) => c.status !== 'resolved');
  const out: Hotspot[] = [];
  for (const [locationKey, list] of groupBy(active, (c) => c.locationKey)) {
    const categories = Array.from(new Set(list.map((c) => c.category)));
    if (categories.length < 2) continue;
    out.push({
      key: `mixed|${locationKey}`,
      kind: 'mixed',
      locationKey,
      location: newestLocation(list),
      category: null,
      categories,
      count: list.length,
      highestSeverity: highest(list),
      complaintIds: list.map((c) => c.id),
    });
  }
  return sortHotspots(out);
}

/** All complaints (any status) at a place, newest first. Optionally limited to one category. */
export function complaintsAtLocation(
  complaints: Complaint[],
  locationKey: string,
  category: CategoryId | null,
): Complaint[] {
  return complaints
    .filter((c) => c.locationKey === locationKey && (!category || c.category === category))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
