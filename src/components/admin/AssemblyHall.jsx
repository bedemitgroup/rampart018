import { useState } from 'react';
import { roleLabel } from '../../constants/roles';
import {
  initials,
  seatState,
  seatStateLabel,
  shortName,
  RSVP_ICONS,
  RSVP_SHORT,
  VOTE_ICONS,
} from '../../constants/assembly';

/**
 * The chamber: one tile per member of the roll.
 *
 * A tile carries all three layers at once, because they answer different
 * questions and the room needs all three at a glance:
 *   - the fill is where he stands now (connected / present / what he answered),
 *   - the ring pulses only while he is actually connected,
 *   - the corner mark is what he answered when the sitting was announced.
 */
export default function AssemblyHall({ seats, currentUserId, tally }) {
  const [selectedId, setSelectedId] = useState(null);

  const selected = seats.find((s) => s.userId === selectedId) ?? null;

  // Built from the tally rather than carried on the seat: attendance and a
  // ballot are different facts about the same person, and merging them into one
  // field is how a seat ends up unable to say which it is showing.
  const voting = Boolean(tally);
  const voteOf = new Map((tally?.votes ?? []).map((v) => [v.userId, v.choice]));

  const counts = {
    live: seats.filter((s) => s.isLive).length,
    present: seats.filter((s) => s.checkedInAt && !s.isLive).length,
    away: seats.filter((s) => !s.checkedInAt && !s.isLive).length,
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

      {seats.length === 0 ? (
        <p className="admin-news__empty">Nema članova sa pravom učešća.</p>
      ) : (
        <ul className="hall__grid">
          {seats.map((seat) => {
            const vote = voteOf.get(seat.userId);
            const state = seatState(seat, { voting, vote });
            const isMe = seat.userId === currentUserId;

            return (
              <li key={seat.userId}>
                <button
                  type="button"
                  className={[
                    'seat',
                    `seat--${state}`,
                    isMe ? 'seat--me' : '',
                    seat.userId === selectedId ? 'seat--selected' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => setSelectedId(seat.userId === selectedId ? null : seat.userId)}
                  aria-pressed={seat.userId === selectedId}
                  aria-label={`${seat.username} — ${seatStateLabel(seat, { voting, vote })}`}
                >
                  {seat.isLive && !voting && <span className="seat__pulse" aria-hidden="true" />}

                  {vote ? (
                    <span className="seat__rsvp" aria-hidden="true">{VOTE_ICONS[vote]}</span>
                  ) : seat.response && (
                    <span className="seat__rsvp" aria-hidden="true">{RSVP_ICONS[seat.response]}</span>
                  )}

                  <span className="seat__initials" aria-hidden="true">{initials(seat.username)}</span>
                  <span className="seat__name">{shortName(seat.username)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

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
