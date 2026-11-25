import { describe, expect, it } from 'vitest';
import { findSimilar, locationSuggestions } from '../src/domain/duplicates';
import { complaintsAtLocation, mixedHotspots, repeatedHotspots } from '../src/domain/hotspots';
import { normaliseLocation } from '../src/domain/labels';
import { makeComplaint, seedDb } from './helpers';

describe('duplicate matching', () => {
  it('normalises case and spaces', () => {
    expect(normaliseLocation('  Gate 2   MAIN road ')).toBe('gate 2 main road');
  });

  it('matches same category and same normalised location', () => {
    const db = seedDb();
    const found = findSimilar(db.complaints, 'road', 'GATE 2 main   Road');
    expect(found.map((c) => c.number).sort()).toEqual([101, 102]);
  });

  it('ignores other categories, other places and resolved complaints', () => {
    const db = seedDb();
    expect(findSimilar(db.complaints, 'water', 'Gate 2 Main Road')).toEqual([]);
    expect(findSimilar(db.complaints, 'road', 'Gate 3')).toEqual([]);
    expect(findSimilar(db.complaints, 'water', 'Plot 45 Phase 1')).toEqual([]); // #106 is resolved
    expect(findSimilar(db.complaints, 'road', '   ')).toEqual([]);
  });

  it('suggests locations used before, without duplicates', () => {
    const list = locationSuggestions(seedDb().complaints);
    expect(list.length).toBeLessThanOrEqual(5);
    expect(new Set(list.map(normaliseLocation)).size).toBe(list.length);
  });
});

describe('hotspots', () => {
  it('repeated groups two or more unresolved complaints by category and place', () => {
    const r = repeatedHotspots(seedDb().complaints);
    expect(r).toHaveLength(1);
    expect(r[0].locationKey).toBe('gate 2 main road');
    expect(r[0].category).toBe('road');
    expect(r[0].count).toBe(2);
    expect(r[0].highestSeverity).toBe('high');
  });

  it('mixed groups two or more categories at one place', () => {
    const m = mixedHotspots(seedDb().complaints);
    expect(m).toHaveLength(1);
    expect(m[0].locationKey).toBe('near water tank');
    expect(m[0].categories.sort()).toEqual(['parking', 'water']);
    expect(m[0].highestSeverity).toBe('critical');
  });

  it('resolved complaints do not count', () => {
    const list = [
      makeComplaint({ id: 'a', status: 'resolved' }),
      makeComplaint({ id: 'b' }),
      makeComplaint({ id: 'c', category: 'water', status: 'resolved' }),
    ];
    expect(repeatedHotspots(list)).toEqual([]);
    expect(mixedHotspots(list)).toEqual([]);
  });

  it('sorts by count then severity', () => {
    const list = [
      makeComplaint({ id: 'a1', locationKey: 'a', location: 'A', severity: 'low' }),
      makeComplaint({ id: 'a2', locationKey: 'a', location: 'A' }),
      makeComplaint({ id: 'b1', locationKey: 'b', location: 'B', severity: 'critical' }),
      makeComplaint({ id: 'b2', locationKey: 'b', location: 'B' }),
      makeComplaint({ id: 'c1', locationKey: 'c', location: 'C' }),
      makeComplaint({ id: 'c2', locationKey: 'c', location: 'C' }),
      makeComplaint({ id: 'c3', locationKey: 'c', location: 'C' }),
    ];
    expect(repeatedHotspots(list).map((h) => h.locationKey)).toEqual(['c', 'b', 'a']);
  });

  it('detail lists every complaint at the place', () => {
    const all = complaintsAtLocation(seedDb().complaints, 'near water tank', null);
    expect(all.map((c) => c.number).sort()).toEqual([103, 104]);
    expect(complaintsAtLocation(seedDb().complaints, 'near water tank', 'water')).toHaveLength(1);
  });
});
