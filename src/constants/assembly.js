// Mirrors backend/BedemApi/Models/AssemblyEnums.cs. The server stores these
// exact Serbian strings, so they are values, not labels — a typo here is a 400,
// not a cosmetic slip.

export const SESSION_STATUS = {
  SCHEDULED: 'Zakazana',
  IN_PROGRESS: 'U toku',
  FINISHED: 'Završena',
  CANCELLED: 'Otkazana',
};

export const RSVP = {
  ATTENDING: 'Dolazim',
  ONLINE: 'Online',
  UNSURE: 'Nisam siguran',
  ABSENT: 'Ne dolazim',
};

export const TOPIC_STATUS = {
  PROPOSED: 'Predložena',
  ACCEPTED: 'Prihvaćena',
  REJECTED: 'Odbijena',
  WITHDRAWN: 'Povučena',
};

export const VOTING_STATUS = {
  NOT_OPENED: 'Nije otvoreno',
  OPEN: 'U toku',
  CLOSED: 'Zatvoreno',
};

export const TOPIC_STATUS_TONES = {
  [TOPIC_STATUS.PROPOSED]: 'proposed',
  [TOPIC_STATUS.ACCEPTED]: 'accepted',
  [TOPIC_STATUS.REJECTED]: 'rejected',
  [TOPIC_STATUS.WITHDRAWN]: 'withdrawn',
};

export const CHECK_IN_MODE = {
  IN_PERSON: 'Uživo',
  ONLINE: 'Online',
};

// The four buttons a member sees, in the order they are offered. `tone` picks
// the seat colour and the button accent; `icon` is what fits on a seat corner.
export const RSVP_OPTIONS = [
  { value: RSVP.ATTENDING, label: 'Dolazim', short: 'Dolazi', icon: '✓', tone: 'yes' },
  { value: RSVP.ONLINE, label: 'Online', short: 'Online', icon: '◎', tone: 'online' },
  { value: RSVP.UNSURE, label: 'Nisam siguran', short: 'Možda', icon: '?', tone: 'maybe' },
  { value: RSVP.ABSENT, label: 'Ne dolazim', short: 'Ne dolazi', icon: '✕', tone: 'no' },
];

export const RSVP_TONES = Object.fromEntries(RSVP_OPTIONS.map((o) => [o.value, o.tone]));
export const RSVP_ICONS = Object.fromEntries(RSVP_OPTIONS.map((o) => [o.value, o.icon]));
export const RSVP_SHORT = Object.fromEntries(RSVP_OPTIONS.map((o) => [o.value, o.short]));

export const SESSION_STATUS_TONES = {
  [SESSION_STATUS.SCHEDULED]: 'scheduled',
  [SESSION_STATUS.IN_PROGRESS]: 'live',
  [SESSION_STATUS.FINISHED]: 'finished',
  [SESSION_STATUS.CANCELLED]: 'cancelled',
};

/**
 * Where a seat stands right now, as one word the CSS can key on.
 *
 * The three layers are deliberately not collapsed into one field on the server,
 * and the precedence here is the reason: being connected outranks having
 * checked in, which outranks what you answered a week ago.
 */
export function seatState(seat) {
  if (seat.isLive) return 'live';
  if (seat.checkedInAt) return 'present';
  if (!seat.response) return 'silent';
  return RSVP_TONES[seat.response] ?? 'silent';
}

export function seatStateLabel(seat) {
  if (seat.isLive) return 'Priključen';
  if (seat.checkedInAt) return `Prisutan (${seat.checkInMode ?? 'uživo'})`;
  if (!seat.response) return 'Nije se izjasnio';
  return RSVP_SHORT[seat.response] ?? seat.response;
}

/**
 * What fits under the initials on a 76px tile. A full "Biljana Dimitrijevic"
 * clips mid-word and reads as neither name, so a two-word name is shortened to
 * first name plus an initial. The full name stays in the aria-label and in the
 * detail panel, which is where someone actually goes to identify a seat.
 */
export function shortName(name) {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1][0]}.`;
}

/** Two letters for the seat tile: initials where there are two words, else the first two. */
export function initials(name) {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// Members are all in Serbia, so a member travelling should still see the hour
// the sitting actually starts in Belgrade rather than wherever his laptop is.
const BELGRADE = 'Europe/Belgrade';

export function formatSessionDateTime(iso) {
  return new Date(iso).toLocaleString('sr-RS', {
    timeZone: BELGRADE,
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatSessionTime(iso) {
  return new Date(iso).toLocaleTimeString('sr-RS', {
    timeZone: BELGRADE,
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * An ISO instant for the API, from what `<input type="datetime-local">` gives
 * us — naive local wall time. `new Date(value)` reads it in the browser's zone
 * and toISOString converts, so the server never has to guess.
 */
export function localInputToIso(value) {
  return value ? new Date(value).toISOString() : null;
}

/** The inverse, for populating the edit form. */
export function isoToLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
