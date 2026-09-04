import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { roleLabel } from '../../constants/roles';
import {
  arrangeHall,
  hallHeight,
  initials,
  rowGeometry,
  seatArc,
  seatState,
  seatStateLabel,
  shortName,
  RSVP_ICONS,
  RSVP_SHORT,
  VOTE_ICONS,
  CHECK_IN_MODE,
} from '../../constants/assembly';

// The smallest a seat may get before its initials stop being legible, and the
// largest one is worth making. Between the two the chamber sizes itself from
// the room it is given — which is what lets the same hemicycle work on a phone
// and on a laptop instead of collapsing into a plain list on one of them.
//
// The floor is 42 rather than something comfortable because a full assembly on
// a phone has to choose: fewer, bigger tiles and the arcs flatten into a grid,
// or smaller tiles and a real chamber. Thirty people at 54px gave six rows of
// five, all the same width, 540px tall. At 42px they give four proper arcs in
// 290px — which is also what the board in a real chamber looks like: coloured
// squares, no names.
const MIN_SEAT = 36;
const MAX_SEAT = 78;
const SEAT_GAP = 8;

// The presidium sits square on rather than on an arc: the chair is the one
// everyone else faces.
const FLAT = { spread: SEAT_GAP, halfWidth: 0, depth: 0 };

// Below this the name under the initials has nowhere to go, so the tile keeps
// only the initials and the full name moves to the tap-panel.
const NAME_THRESHOLD = 62;

// How much vertical room the chamber may take before the tiles start shrinking.
// The point of the room is that you can see all of it while a vote is running:
// thirty people at full size came out 790px tall, which means scrolling past
// half the assembly to watch a ballot.
const MAX_HALL_HEIGHT = 460;

/**
 * The chamber.
 *
 * One tile per member of the roll, laid out the way the room actually sits:
 * whoever chairs at the podium, the roles that carry a section of the work in
 * the front arcs, and the rest of the membership behind them.
 *
 * A tile carries three things at once, because the room needs all three at a
 * glance: the fill is where he stands now, the ring pulses only while he is
 * really connected, and the corner mark is what he answered when the sitting
 * was called — or, once a ballot is on the floor, how he voted.
 */
export default function AssemblyHall({ seats, currentUserId, tally, onOverrideAttendance, busy }) {
  const [selectedId, setSelectedId] = useState(null);
  const [width, setWidth] = useState(0);
  const frameRef = useRef(null);

  // The layout depends on how wide the chamber actually is, and no media query
  // can answer that here: this sits in a panel whose width changes with the
  // sidebar, not only with the viewport.
  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return undefined;

    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    setWidth(el.getBoundingClientRect().width);

    return () => observer.disconnect();
  }, []);

  // A seat can vanish from the roll while its panel is open — someone is
  // deactivated, or the roll simply reloads.
  useEffect(() => {
    if (selectedId && !seats.some((s) => s.userId === selectedId)) setSelectedId(null);
  }, [seats, selectedId]);

  const selected = seats.find((s) => s.userId === selectedId) ?? null;

  const voting = Boolean(tally);
  const voteOf = new Map((tally?.votes ?? []).map((v) => [v.userId, v.choice]));

  // Sizing is two passes, and it has to be.
  //
  // The first asks how many seats could fit in a row at the smallest legible
  // size — that is what caps the arcs so a wide chamber never overflows. The
  // second sizes the seats to the row that actually got filled: a hall of nine
  // ends up with arcs of three and four, and sizing those off the theoretical
  // maximum would leave tiny tiles adrift in a wide panel.
  const usable = Math.max(width, MIN_SEAT);
  const maxPerRow = Math.max(3, Math.min(13,
    Math.floor((usable + SEAT_GAP) / (MIN_SEAT + SEAT_GAP))));

  const { presidium, rows } = arrangeHall(seats, maxPerRow, {
    frameWidth: usable,
    gap: SEAT_GAP,
    nameSeat: NAME_THRESHOLD,
  });

  // The podium wraps like any other row. Nothing stops an association from
  // handing the Skupstina role to six people, and an unwrapped flat row of six
  // runs straight off the side of a phone.
  const podiumRows = [];
  for (let i = 0; i < presidium.length; i += maxPerRow) {
    podiumRows.push(presidium.slice(i, i + maxPerRow));
  }

  const widestRow = Math.max(
    1,
    ...podiumRows.map((r) => r.length),
    ...rows.map((r) => r.length),
  );

  // As big as the widest arc allows...
  const widthLimit = Math.max(MIN_SEAT, Math.min(MAX_SEAT,
    Math.floor((usable - (widestRow - 1) * SEAT_GAP) / widestRow)));

  // ...and then no bigger than keeps the whole room on screen. Stepping down
  // rather than solving for it: height depends on the arc depth, which depends
  // on the tile size, so there is no closed form worth writing here.
  const rowSizes = [...podiumRows.map((r) => r.length), ...rows.map((r) => r.length)];
  let seatSize = widthLimit;
  while (
    seatSize > MIN_SEAT
    && hallHeight({ rowSizes, seatSize, frameWidth: usable, gap: SEAT_GAP }) > MAX_HALL_HEIGHT
  ) {
    seatSize -= 2;
  }

  const counts = {
    live: seats.filter((s) => s.isLive).length,
    present: seats.filter((s) => s.checkedInAt && !s.isLive).length,
    away: seats.filter((s) => !s.checkedInAt && !s.isLive).length,
  };

  const renderSeat = (seat, index, count, geometry) => {
    const vote = voteOf.get(seat.userId);
    const state = seatState(seat, { voting, vote });

    return (
      <li key={seat.userId} className="hemicycle__slot" style={seatArc(index, count, geometry)}>
        <button
          type="button"
          className={[
            'seat',
            `seat--${state}`,
            seat.userId === currentUserId ? 'seat--me' : '',
            seat.userId === selectedId ? 'seat--selected' : '',
          ].filter(Boolean).join(' ')}
          onClick={() => setSelectedId(seat.userId === selectedId ? null : seat.userId)}
          aria-pressed={seat.userId === selectedId}
          aria-label={`${seat.username} — ${roleLabel(seat.role)} — ${seatStateLabel(seat, { voting, vote })}`}
        >
          {seat.isLive && !voting && <span className="seat__pulse" aria-hidden="true" />}

          {vote ? (
            <span className="seat__rsvp" aria-hidden="true">{VOTE_ICONS[vote]}</span>
          ) : seat.response && (
            <span className="seat__rsvp" aria-hidden="true">{RSVP_ICONS[seat.response]}</span>
          )}

          <span className="seat__initials" aria-hidden="true">{initials(seat.username)}</span>
          {seatSize >= NAME_THRESHOLD && (
            <span className="seat__name">{shortName(seat.username)}</span>
          )}
        </button>
      </li>
    );
  };

  return (
    <div className="hall">
      <div className="hall__tally" role="status">
        <span className="hall__tally-item hall__tally-item--live">
          <span className="hall__tally-dot" aria-hidden="true" />
          Priključeno <strong>{counts.live}</strong>
        </span>
        <span className="hall__tally-item hall__tally-item--present">
          Prisutno <strong>{counts.present}</strong>
        </span>
        <span className="hall__tally-item hall__tally-item--away">
          Odsutno <strong>{counts.away}</strong>
        </span>
      </div>

      <div
        className="hemicycle"
        ref={frameRef}
        style={{ '--seat-size': `${seatSize}px`, '--seat-gap': `${SEAT_GAP}px` }}
      >
        {seats.length === 0 ? (
          <p className="admin-news__empty">Nema članova sa pravom učešća.</p>
        ) : (
          <>
            {podiumRows.length > 0 && (
              <div className="hemicycle__podium">
                <span className="hemicycle__podium-label">Predsedava</span>
                {podiumRows.map((row) => (
                  <ul
                    className="hemicycle__row hemicycle__row--podium"
                    key={row[0].userId}
                    style={{ '--row-spread': `${SEAT_GAP}px` }}
                  >
                    {row.map((seat, i) => renderSeat(seat, i, row.length, FLAT))}
                  </ul>
                ))}
              </div>
            )}

            {rows.map((row, rowIndex) => {
              const geometry = rowGeometry({
                count: row.length,
                rowIndex,
                rowCount: rows.length,
                seatSize,
                frameWidth: usable,
                gap: SEAT_GAP,
              });

              return (
                <ul
                  className="hemicycle__row"
                  key={row[0].userId}
                  aria-label={`${rowIndex + 1}. red`}
                  style={{
                    '--row-spread': `${geometry.spread}px`,
                    '--row-depth': `${geometry.depth}px`,
                  }}
                >
                  {row.map((seat, i) => renderSeat(seat, i, row.length, geometry))}
                </ul>
              );
            })}
          </>
        )}
      </div>

      {selected && (
        <div className="hall__detail" role="status">
          <div className="hall__detail-head">
            <span className="hall__detail-name">
              {selected.username}
              {selected.userId === currentUserId && <span className="hall__detail-me"> (ti)</span>}
            </span>
            <button
              type="button"
              className="hall__detail-close"
              onClick={() => setSelectedId(null)}
              aria-label="Zatvori"
            >
              ×
            </button>
          </div>
          <dl className="hall__detail-rows">
            <div>
              <dt>Rola</dt>
              <dd>{roleLabel(selected.role)}</dd>
            </div>
            <div>
              <dt>Najava</dt>
              <dd>{selected.response ? RSVP_SHORT[selected.response] ?? selected.response : '—'}</dd>
            </div>
            <div>
              <dt>Prisustvo</dt>
              <dd>{selected.checkedInAt ? `Prijavljen — ${selected.checkInMode ?? 'uživo'}` : 'Nije prijavljen'}</dd>
            </div>
            <div>
              <dt>Veza</dt>
              <dd>{selected.isLive ? 'Priključen sada' : 'Nije priključen'}</dd>
            </div>
            {voting && (
              <div>
                <dt>Glas</dt>
                <dd>{voteOf.get(selected.userId) ?? 'Još nije glasao'}</dd>
              </div>
            )}
          </dl>

          {onOverrideAttendance && (
            <div className="hall__detail-actions">
              <span className="hall__detail-hint">Ispravi spisak prisutnih:</span>
              <button
                type="button"
                className="admin-news__action-btn"
                disabled={busy}
                onClick={() => onOverrideAttendance(selected, CHECK_IN_MODE.IN_PERSON)}
              >
                U sali
              </button>
              <button
                type="button"
                className="admin-news__action-btn"
                disabled={busy}
                onClick={() => onOverrideAttendance(selected, CHECK_IN_MODE.ONLINE)}
              >
                Online
              </button>
              <button
                type="button"
                className="admin-news__action-btn admin-news__action-btn--delete"
                disabled={busy}
                onClick={() => onOverrideAttendance(selected, null)}
              >
                Nije došao
              </button>
            </div>
          )}
        </div>
      )}

      <ul className="hall__legend">
        {voting ? (
          <>
            <li><span className="hall__swatch hall__swatch--for" />Za</li>
            <li><span className="hall__swatch hall__swatch--against" />Protiv</li>
            <li><span className="hall__swatch hall__swatch--abstain" />Uzdržan</li>
            <li><span className="hall__swatch hall__swatch--silent" />Nije glasao</li>
          </>
        ) : (
          <>
            <li><span className="hall__swatch hall__swatch--live" />Priključen</li>
            <li><span className="hall__swatch hall__swatch--present" />Prisutan</li>
            <li><span className="hall__swatch hall__swatch--yes" />Najavio dolazak</li>
            <li><span className="hall__swatch hall__swatch--online" />Najavio online</li>
            <li><span className="hall__swatch hall__swatch--maybe" />Nije siguran</li>
            <li><span className="hall__swatch hall__swatch--no" />Ne dolazi</li>
            <li><span className="hall__swatch hall__swatch--silent" />Bez odgovora</li>
          </>
        )}
      </ul>
    </div>
  );
}
