import { buildSeed } from '../src/data/seed';
import type { Ctx } from '../src/domain/engine';
import type { Complaint, Database } from '../src/domain/types';

export function testCtx(): Ctx {
  let t = Date.parse('2026-01-01T00:00:00.000Z');
  let n = 0;
  return {
    now: () => new Date((t += 1000)).toISOString(),
    id: () => `id_${++n}`,
  };
}

export function seedDb(): Database {
  return buildSeed(Date.parse('2025-12-31T00:00:00.000Z'));
}

export function makeComplaint(over: Partial<Complaint> = {}): Complaint {
  return {
    id: 'c_x',
    number: 900,
    category: 'road',
    subCategory: 'Pothole',
    location: 'Gate 1',
    locationKey: 'gate 1',
    description: 'A test complaint',
    severity: null,
    status: 'open',
    createdBy: 'u_member',
    participantIds: ['u_member'],
    joinedByIds: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    resolvedAt: null,
    resolvedBy: null,
    chatDeleted: false,
    ...over,
  };
}

export const admin = { id: 'u_admin', role: 'admin' as const, name: 'Vijay Gaur' };
export const member = { id: 'u_member', role: 'member' as const, name: 'Anil Sharma' };
export const member2 = { id: 'u_member2', role: 'member' as const, name: 'Sunita Verma' };
export const moderator = { id: 'u_moderator', role: 'moderator' as const, name: 'Ramesh Patel' };
