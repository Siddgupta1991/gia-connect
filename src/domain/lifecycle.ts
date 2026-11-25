import type { Complaint, Status, User } from './types';
import { canViewComplaint } from './visibility';

type Actor = Pick<User, 'id' | 'role'>;

export type TransitionKind = 'start' | 'mark_fixed' | 'confirm' | 'reopen' | 'force_resolve';

/**
 * Allowed moves:
 *  open -> in_progress          admin or added moderator
 *  in_progress -> fixed         admin or added moderator
 *  fixed -> resolved            complainant confirms
 *  fixed -> in_progress         complainant reopens with a reason (admin may also reopen)
 *  any -> resolved              admin "Resolve now"
 */
export function transitionKind(actor: Actor, complaint: Complaint, to: Status): TransitionKind | null {
  const from = complaint.status;
  if (from === 'resolved' || from === to) return null;
  if (!canViewComplaint(actor, complaint)) return null;

  const isAdmin = actor.role === 'admin';
  const isWorker = isAdmin || actor.role === 'moderator';
  const isComplainant = complaint.createdBy === actor.id;

  if (to === 'resolved') {
    if (from === 'fixed' && isComplainant) return 'confirm';
    if (isAdmin) return 'force_resolve';
    return null;
  }
  if (from === 'open' && to === 'in_progress' && isWorker) return 'start';
  if (from === 'in_progress' && to === 'fixed' && isWorker) return 'mark_fixed';
  if (from === 'fixed' && to === 'in_progress' && (isComplainant || isAdmin)) return 'reopen';
  return null;
}

export function canTransition(actor: Actor, complaint: Complaint, to: Status): boolean {
  return transitionKind(actor, complaint, to) !== null;
}

/**
 * Next statuses this actor may pick from the status sheet.
 * Resolving is done through "Resolve now" or "Confirm fix", and reopening through "Reopen",
 * so the sheet only offers forward work moves.
 */
export function sheetStatusOptions(actor: Actor, complaint: Complaint): Status[] {
  return (['in_progress', 'fixed'] as Status[]).filter((s) => {
    const kind = transitionKind(actor, complaint, s);
    return kind === 'start' || kind === 'mark_fixed';
  });
}
