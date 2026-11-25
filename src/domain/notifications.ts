import { getCategory } from './categories';
import { complaintNo, STATUS_LABEL } from './labels';
import type { AppNotification, Audience, Complaint, NotificationKind, Status, User } from './types';
import { threadMemberIds, unique } from './visibility';

type Person = Pick<User, 'id' | 'role' | 'name'>;

export interface NotificationDraft {
  toUserIds: string[];
  kind: NotificationKind;
  title: string;
  body: string;
  complaintId: string | null;
  broadcastId?: string | null;
}

function adminIds(users: Person[]): string[] {
  return users.filter((u) => u.role === 'admin').map((u) => u.id);
}

/** Removes the actor and duplicates. Nobody is ever notified about their own action. */
export function excludeActor(ids: string[], actorId: string): string[] {
  return unique(ids).filter((id) => id !== actorId);
}

export function complaintRaised(users: Person[], actor: Person, c: Complaint): NotificationDraft {
  return {
    toUserIds: excludeActor(adminIds(users), actor.id),
    kind: 'complaint_raised',
    title: `New complaint ${complaintNo(c.number)}`,
    body: `${actor.name} reported ${c.subCategory} at ${c.location}`,
    complaintId: c.id,
  };
}

export function complaintJoined(users: Person[], actor: Person, c: Complaint): NotificationDraft {
  return {
    toUserIds: excludeActor([...adminIds(users), c.createdBy], actor.id),
    kind: 'complaint_raised',
    title: `${actor.name} also reported this`,
    body: `${complaintNo(c.number)} ${c.subCategory} at ${c.location}`,
    complaintId: c.id,
  };
}

export function peopleAdded(actor: Person, c: Complaint, addedIds: string[]): NotificationDraft {
  return {
    toUserIds: excludeActor(addedIds, actor.id),
    kind: 'added_to_complaint',
    title: `You were added to ${complaintNo(c.number)}`,
    body: `${actor.name} added you to a ${getCategory(c.category).name.toLowerCase()} issue`,
    complaintId: c.id,
  };
}

/** Status change goes to the complainant and all participants. A move to Fixed asks the complainant to confirm. */
export function statusChanged(actor: Person, c: Complaint, to: Status): NotificationDraft[] {
  const everyone = excludeActor(threadMemberIds(c), actor.id);
  if (to === 'fixed') {
    const complainant = excludeActor([c.createdBy], actor.id);
    const rest = everyone.filter((id) => id !== c.createdBy);
    const drafts: NotificationDraft[] = [];
    if (complainant.length) {
      drafts.push({
        toUserIds: complainant,
        kind: 'status_changed',
        title: `Please confirm the fix for ${complaintNo(c.number)}`,
        body: `${actor.name} says this ${c.subCategory.toLowerCase()} issue is fixed. Tap to confirm or reopen.`,
        complaintId: c.id,
      });
    }
    if (rest.length) {
      drafts.push({
        toUserIds: rest,
        kind: 'status_changed',
        title: `${complaintNo(c.number)} is now ${STATUS_LABEL.fixed}`,
        body: `${c.subCategory} at ${c.location}`,
        complaintId: c.id,
      });
    }
    return drafts;
  }
  return [
    {
      toUserIds: everyone,
      kind: 'status_changed',
      title: `${complaintNo(c.number)} is now ${STATUS_LABEL[to]}`,
      body: `${c.subCategory} at ${c.location}`,
      complaintId: c.id,
    },
  ];
}

export function reopened(users: Person[], actor: Person, c: Complaint, reason: string): NotificationDraft {
  return {
    toUserIds: excludeActor([...adminIds(users), ...threadMemberIds(c)], actor.id),
    kind: 'status_changed',
    title: `${complaintNo(c.number)} was reopened`,
    body: reason,
    complaintId: c.id,
  };
}

export function severitySet(actor: Person, c: Complaint, label: string): NotificationDraft {
  return {
    toUserIds: excludeActor([c.createdBy], actor.id),
    kind: 'status_changed',
    title: `${complaintNo(c.number)} severity set to ${label}`,
    body: `${c.subCategory} at ${c.location}`,
    complaintId: c.id,
  };
}

export function newMessage(actor: Person, c: Complaint, text: string): NotificationDraft {
  return {
    toUserIds: excludeActor(threadMemberIds(c), actor.id),
    kind: 'new_message',
    title: `New message in ${complaintNo(c.number)}`,
    body: `${actor.name}: ${text.length > 80 ? `${text.slice(0, 77)}...` : text}`,
    complaintId: c.id,
  };
}

/** Who receives an admin broadcast. The sender is never included. */
export function resolveAudience(params: {
  users: Person[];
  complaints: Complaint[];
  audience: Audience;
  senderId: string;
  selectedIds?: string[];
  complaintId?: string | null;
}): string[] {
  const { users, complaints, audience, senderId } = params;
  let ids: string[];
  switch (audience) {
    case 'everyone':
      ids = users.map((u) => u.id);
      break;
    case 'members':
      ids = users.filter((u) => u.role === 'member').map((u) => u.id);
      break;
    case 'moderators':
      ids = users.filter((u) => u.role === 'moderator').map((u) => u.id);
      break;
    case 'selected': {
      const known = new Set(users.map((u) => u.id));
      ids = (params.selectedIds ?? []).filter((id) => known.has(id));
      break;
    }
    case 'complaint': {
      const c = complaints.find((x) => x.id === params.complaintId);
      ids = c ? threadMemberIds(c) : [];
      break;
    }
  }
  return excludeActor(ids, senderId);
}

/** Turns drafts into stored notifications, one per recipient. */
export function materialise(
  drafts: NotificationDraft[],
  now: string,
  makeId: () => string,
): AppNotification[] {
  const out: AppNotification[] = [];
  for (const d of drafts) {
    for (const to of d.toUserIds) {
      out.push({
        id: makeId(),
        toUserId: to,
        kind: d.kind,
        title: d.title,
        body: d.body,
        complaintId: d.complaintId,
        createdAt: now,
        readAt: null,
        broadcastId: d.broadcastId ?? null,
      });
    }
  }
  return out;
}
