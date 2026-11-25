import type { Audience, Role, Severity, Status } from './types';

export const STATUS_LABEL: Record<Status, string> = {
  open: 'Open',
  in_progress: 'In progress',
  fixed: 'Fixed',
  resolved: 'Resolved',
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const SEVERITY_RANK: Record<Severity, number> = { low: 1, medium: 2, high: 3, critical: 4 };

export const ROLE_LABEL: Record<Role, string> = {
  member: 'Member',
  moderator: 'Moderator',
  admin: 'Admin',
};

export const AUDIENCE_LABEL: Record<Audience, string> = {
  everyone: 'Everyone',
  members: 'All members',
  moderators: 'All moderators',
  selected: 'Selected people',
  complaint: 'Everyone in one complaint',
};

export const STATUSES: Status[] = ['open', 'in_progress', 'fixed', 'resolved'];
export const SEVERITIES: Severity[] = ['low', 'medium', 'high', 'critical'];

export function complaintNo(n: number): string {
  return `#${n}`;
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** Lowercase, trimmed, collapsed spaces. Used to match complaints at the same place. */
export function normaliseLocation(location: string): string {
  return location.trim().toLowerCase().replace(/\s+/g, ' ');
}
