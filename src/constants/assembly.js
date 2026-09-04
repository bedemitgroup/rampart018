import { ROLES } from './roles';

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

export const VOTE_CHOICE = {
  FOR: 'Za',
  AGAINST: 'Protiv',
  ABSTAINED: 'Uzdržan',
};

export const OUTCOME = {
  PASSED: 'Usvojeno',
  FAILED: 'Odbijeno',
  PENDING: 'U toku',
  NOT_OPENED: 'Nije glasano',
};

// The three buttons, in the order a ballot paper has them.
export const VOTE_OPTIONS = [
  { value: VOTE_CHOICE.FOR, label: 'ZA', icon: '✓', tone: 'for' },
  { value: VOTE_CHOICE.AGAINST, label: 'PROTIV', icon: '✕', tone: 'against' },
  { value: VOTE_CHOICE.ABSTAINED, label: 'UZDRŽAN', icon: '−', tone: 'abstain' },
];

export const VOTE_TONES = Object.fromEntries(VOTE_OPTIONS.map((o) => [o.value, o.tone]));
export const VOTE_ICONS = Object.fromEntries(VOTE_OPTIONS.map((o) => [o.value, o.icon]));

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
export function seatState(seat, { voting = false, vote = null } = {}) {
  // While a ballot is on the floor the room is about one question and nothing
  // else, so the attendance colours are dropped entirely rather than ranked
  // below the vote. They share the green: a connected member who has not voted
  // yet would otherwise be indistinguishable from one who voted for.
  if (voting) return vote ? VOTE_TONES[vote] ?? 'silent' : 'silent';

  if (seat.isLive) return 'live';
  if (seat.checkedInAt) return 'present';
  if (!seat.response) return 'silent';
  return RSVP_TONES[seat.response] ?? 'silent';
}

export function seatStateLabel(seat, { voting = false, vote = null } = {}) {
  if (voting) return vote ? `Glasao: ${vote}` : 'Nije glasao';

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

// ---------------------------------------------------------------------------
// The seating plan
// ---------------------------------------------------------------------------

/**
 * Who sits at the podium: the role whose whole job is running the assembly,
 * and nobody else.
 *
 * An Admin may open a sitting too, but he is not in the chamber at all — the
 * server leaves him off the roll, because administering the site is not being
 * a member of the association.
 *
 * If nobody holds this role the podium row simply does not appear — which is
 * honest, because then nobody holds that office.
 */
const PRESIDIUM_ROLES = [ROLES.ASSEMBLY];

/**
 * The order the floor fills up in: the roles that carry a section of the
 * association's work sit closest to the podium, plain members behind them.
 * Anything unknown falls to the back rather than to the front.
 *
 * Admin is absent because he holds no seat at all — the server leaves him off
 * the roll, so no tile ever reaches this list for him.
 */
const SEAT_ORDER = [
  ROLES.ASSEMBLY,
  ROLES.MODERATOR,
  ROLES.FINANCE,
  ROLES.MEMBER,
];

function seatRank(seat) {
  const index = SEAT_ORDER.indexOf(seat.role);
  return index === -1 ? SEAT_ORDER.length : index;
}

/**
 * How many people go in each arc.
 *
 * Not "fill three, then five, then seven until they run out" — that leaves the
 * remainder in the last row, which is the one place it shows, because the back
 * arc is the one that ought to be widest. Twenty people used to come out as
 * 3, 5, 7 and then a stub of 2 sitting behind a row three times its width.
 *
 * Instead every seat is dealt at once, with a weight that grows by one per row
 * and the largest remainders going to the back. The rows come out gently
 * increasing and always full: 4, 6, 7 for twenty; 4, 6, 8, 9 for thirty.
 */
function splitIntoRows(total, rowCount, maxPerRow) {
  const weights = Array.from({ length: rowCount }, (_, r) => r + 2);
  const weightSum = weights.reduce((a, b) => a + b, 0);

  const ideal = weights.map((w) => (total * w) / weightSum);

  // Clamped to the cap here, not only when handing out the remainder: with few
  // rows the ideal share is already wider than the container can hold, and an
  // unclamped floor() would sail straight past it — which is how a phone ended
  // up drawing rows of ten in a frame that fits six.
  const sizes = ideal.map((x) => Math.min(maxPerRow, Math.max(1, Math.floor(x))));

  // Hand out what rounding left over, biggest fractional part first, and never
  // past the width the container can hold.
  const byRemainder = ideal
    .map((x, r) => ({ r, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac);

  let left = total - sizes.reduce((a, b) => a + b, 0);

  for (let pass = 0; left > 0 && pass < rowCount * 2; pass += 1) {
    for (const { r } of byRemainder) {
      if (left === 0) break;
      if (sizes[r] < maxPerRow) {
        sizes[r] += 1;
        left -= 1;
      }
    }
  }

  // Sorting is what guarantees the back arc is never narrower than the one in
  // front of it, whatever the rounding did.
  if (left !== 0 || Math.max(...sizes) > maxPerRow) return null;

  return sizes.sort((a, b) => a - b);
}

/**
 * Lays the roll out as a chamber: a presidium at the podium, then arcs that
 * grow as they go back.
 *
 * `maxPerRow` comes from the measured width of the container, so the widest arc
 * always fits — that is what lets the same hemicycle work on a phone and on a
 * laptop instead of degrading into a plain grid on one of them.
 */
export function arrangeHall(seats, maxPerRow = 9, fit = null) {
  const sorted = [...seats].sort(
    (a, b) => seatRank(a) - seatRank(b) || a.username.localeCompare(b.username, 'sr'),
  );

  const presidium = sorted.filter((s) => PRESIDIUM_ROLES.includes(s.role));
  const floor = sorted.filter((s) => !PRESIDIUM_ROLES.includes(s.role));

  return { presidium, rows: dealRows(floor, maxPerRow, fit) };
}

// A chamber should read as wider than it is deep, so the row count is chosen to
// keep the widest arc at roughly this many times the number of rows.
const CHAMBER_ASPECT = 2.2;

// How much a layout is preferred for keeping the tiles big enough to carry a
// name. Larger than any realistic aspect score, so readability decides whenever
// it is still on the table and proportion decides once it is not.
const READABLE_BONUS = 4;

/**
 * @param fit  optional { frameWidth, gap, nameSeat } — when given, layouts whose
 *             tiles would still fit a name are preferred over better-proportioned
 *             ones that would not. On a wide screen every candidate keeps its
 *             names and this changes nothing; on a phone it is the difference
 *             between "Biljana D." and a bare "BD".
 */
function dealRows(floor, maxPerRow, fit) {
  if (floor.length === 0) return [];

  const cap = Math.max(1, maxPerRow);
  let chosen = null;
  let bestScore = Infinity;

  for (let rowCount = 1; rowCount <= Math.min(12, floor.length); rowCount += 1) {
    const sizes = splitIntoRows(floor.length, rowCount, cap);
    if (!sizes) continue;

    const widest = Math.max(...sizes);
    let score = Math.abs(widest - CHAMBER_ASPECT * rowCount);

    if (fit) {
      const tile = (fit.frameWidth - (widest - 1) * fit.gap) / widest;
      if (tile >= fit.nameSeat) score -= READABLE_BONUS;
    }

    if (score < bestScore) {
      bestScore = score;
      chosen = sizes;
    }
  }

  // Nothing fitted — only possible with an absurdly narrow frame. One row per
  // seat is ugly but it is still a chamber, and it never overflows.
  const plan = chosen ?? floor.map(() => 1);

  const rows = [];
  let i = 0;
  for (const size of plan) {
    rows.push(floor.slice(i, i + size));
    i += size;
  }

  return rows;
}

// How deep an arc bows, as a fraction of its own half-width. A proportion
// rather than a pixel count, so the curve looks the same whether the chamber is
// 340px wide or 1200.
const ARC_DEPTH = 0.16;

// An arc never bows more than this fraction of a tile's height.
const MAX_ARC_DEPTH_IN_SEATS = 0.55;

// A lone pair of seats should not fly to opposite walls.
const MAX_SPREAD = 48;

/**
 * The geometry of one arc.
 *
 * The arcs widen as they go back — the innermost spans about half the chamber,
 * the outermost the whole of it — which is what makes ten people read as a
 * room rather than as a small cluster adrift in the middle of one. Seats keep
 * the same size throughout; it is the spacing that opens up, exactly as it
 * does in a real hemicycle where every row shares an angle but not a radius.
 */
export function rowGeometry({ count, rowIndex, rowCount, seatSize, frameWidth, gap }) {
  const fraction = rowCount <= 1 ? 1 : 0.5 + 0.5 * ((rowIndex + 1) / rowCount);
  const target = frameWidth * fraction;

  const spread = count > 1
    ? Math.max(gap, Math.min(MAX_SPREAD, (target - count * seatSize) / (count - 1)))
    : gap;

  const pitch = seatSize + spread;
  const halfWidth = ((count - 1) / 2) * pitch;

  // Capped, because depth is height: a nine-seat arc spanning the whole
  // chamber would otherwise bow by most of a tile and a full assembly would
  // spend more vertical space on curvature than on people.
  const depth = Math.min(halfWidth * ARC_DEPTH, seatSize * MAX_ARC_DEPTH_IN_SEATS);

  return { spread, halfWidth, depth };
}

/**
 * How tall the chamber comes out at a given tile size — the sum of every arc
 * plus the curve it bows through. Used to decide whether the tiles have to
 * shrink for the whole room to stay on screen at once.
 */
export function hallHeight({ rowSizes, seatSize, frameWidth, gap }) {
  return rowSizes.reduce((total, count, rowIndex) => {
    const { depth } = rowGeometry({
      count, rowIndex, rowCount: rowSizes.length, seatSize, frameWidth, gap,
    });
    return total + seatSize + depth + gap;
  }, 0);
}

/**
 * Where one seat sits on its arc, as plain CSS custom properties.
 *
 * Returned as variables rather than a finished `transform` on purpose: an
 * inline transform would outrank the stylesheet, and the reduced-motion rule
 * could no longer flatten the curve.
 */
export function seatArc(index, count, geometry) {
  if (count < 2 || geometry.halfWidth === 0) return { '--seat-lift': '0px' };

  // -1 at the left end of the arc, 0 in the middle, +1 at the right.
  const t = (index - (count - 1) / 2) / ((count - 1) / 2);

  // Only a lift, deliberately: the seats sit on the curve but stay upright.
  // Rotating them as well tilted the names with them, and a tile you have to
  // read at an angle costs more than the extra realism was worth.
  return { '--seat-lift': `${-(t ** 2) * geometry.depth}px` };
}
