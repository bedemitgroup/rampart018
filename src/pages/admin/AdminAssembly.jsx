import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ROLES, ROLE_LABELS, canManageAssembly, canVoteInAssembly } from '../../constants/roles';
import {
  CHECK_IN_MODE,
  RSVP,
  RSVP_OPTIONS,
  SESSION_STATUS,
  SESSION_STATUS_TONES,
  formatSessionDateTime,
} from '../../constants/assembly';
import { useAssemblyLive } from '../../hooks/useAssemblyLive';
import AssemblyHall from '../../components/admin/AssemblyHall';
import AdminAssemblyTabs from './AdminAssemblyTabs';
import ReadOnlyNotice from './ReadOnlyNotice';

// Which counter each answer feeds. Anything unanswered falls to noAnswer.
const RSVP_COUNT_KEYS = {
  [RSVP.ATTENDING]: 'attending',
  [RSVP.ONLINE]: 'online',
  [RSVP.UNSURE]: 'unsure',
  [RSVP.ABSENT]: 'absent',
};

const LIVE_LABELS = {
  connecting: 'Povezivanje…',
  live: 'Uživo',
  reconnecting: 'Veza prekinuta — ponovo se povezujem…',
  offline: 'Nema veze sa serverom. Osvežite stranicu.',
};

export default function AdminAssembly() {
  const { user } = useAuth();
  const canEdit = canManageAssembly(user);
  const canTakePart = canVoteInAssembly(user);

  const [session, setSession] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  const sessionId = session?.id ?? null;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const current = await api.getCurrentAssemblySession();
      if (!current) {
        setSession(null);
        setSeats([]);
        return;
      }
      const hall = await api.getAssemblyHall(current.id);
      setSession(hall.session);
      setSeats(hall.seats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Every live handler merges by userId and is safe to run twice: a SignalR
  // frame can beat the fetch that caused it back to the client that acted.
  const handlers = useMemo(() => ({
    onPresence: (presence) => {
      const liveIds = new Set(presence.map((p) => p.userId));
      setSeats((prev) => prev.map((s) => ({ ...s, isLive: liveIds.has(s.userId) })));
    },
    onMemberJoined: (who) => {
      setSeats((prev) => prev.map((s) => (s.userId === who.userId ? { ...s, isLive: true } : s)));
    },
    onMemberLeft: (userId) => {
      setSeats((prev) => prev.map((s) => (s.userId === userId ? { ...s, isLive: false } : s)));
    },
    onSeatChanged: (seat) => {
      // isLive on a REST-shaped payload reflects the server's view at write
      // time; presence events are the authority, so the local flag is kept.
      setSeats((prev) => prev.map((s) => (s.userId === seat.userId ? { ...seat, isLive: s.isLive } : s)));
    },
    onSessionChanged: (next) => {
      setSession((prev) => (prev && prev.id === next.id ? next : prev));
    },
    onResync: load,
  }), [load]);

  const liveState = useAssemblyLive(sessionId, handlers);

  async function act(fn) {
    setActionError('');
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      setActionError(err.message);
      await load();
    } finally {
      setBusy(false);
    }
  }

  const setRsvp = (response) => act(async () => {
    const seat = await api.setAssemblyRsvp(session.id, response, null);
    setSeats((prev) => prev.map((s) => (s.userId === seat.userId ? { ...seat, isLive: s.isLive } : s)));
  });

  const setCheckIn = (mode) => act(async () => {
    const seat = await api.setAssemblyCheckIn(session.id, mode);
    setSeats((prev) => prev.map((s) => (s.userId === seat.userId ? { ...seat, isLive: s.isLive } : s)));
  });

  const setStatus = (status) => act(async () => {
    setSession(await api.setAssemblySessionStatus(session.id, status));
  });

  if (loading) return <p className="admin-news__loading">Učitavanje...</p>;

  const mySeat = seats.find((s) => s.userId === user?.id) ?? null;
  const isLiveSession = session?.status === SESSION_STATUS.IN_PROGRESS;

  // Counted off the seats rather than read from session.rsvp: the seats are what
  // the live socket keeps current, so deriving the tally from them means the
  // numbers can never disagree with the grid under them — and an RSVP from
  // anyone moves both at once, without a second broadcast or a reload.
  const tally = seats.reduce((acc, seat) => {
    const key = RSVP_COUNT_KEYS[seat.response] ?? 'noAnswer';
    acc[key] += 1;
    return acc;
  }, { attending: 0, online: 0, unsure: 0, absent: 0, noAnswer: 0 });

  return (
    <div>
      <div className="admin-news__header">
        <h1 className="admin__title">Skupština</h1>
        {canEdit && (
          <Link to="/admin/skupstina/sednice/nova" className="btn btn--primary">
            + Zakaži sednicu
          </Link>
        )}
      </div>

      {!canEdit && <ReadOnlyNotice owner={ROLE_LABELS[ROLES.ASSEMBLY]} />}

      <AdminAssemblyTabs />

      {actionError && <p className="admin-news__error">{actionError}</p>}
      {error && <p className="admin-news__error">{error}</p>}

      {!error && !session && (
        <p className="admin-news__empty">
          Nema zakazanih sednica.
          {canEdit && ' Zakažite prvu dugmetom iznad.'}
        </p>
      )}

      {!error && session && (
        <>
          <section className={`assembly-head assembly-head--${SESSION_STATUS_TONES[session.status]}`}>
            <div className="assembly-head__main">
              <span className="assembly-head__status">{session.status}</span>
              <h2 className="assembly-head__title">{session.title}</h2>
              <p className="assembly-head__when">{formatSessionDateTime(session.scheduledAt)}</p>

              {(session.location || session.onlineUrl) && (
                <p className="assembly-head__where">
                  {session.location}
                  {session.location && session.onlineUrl && ' · '}
                  {session.onlineUrl && (
                    <a href={session.onlineUrl} target="_blank" rel="noopener noreferrer">
                      Online link
                    </a>
                  )}
                </p>
              )}

              {session.description && (
                <p className="assembly-head__note">{session.description}</p>
              )}
            </div>

            <div className="assembly-head__side">
              {isLiveSession && (
                <span className={`assembly-live assembly-live--${liveState}`}>
                  <span className="assembly-live__dot" aria-hidden="true" />
                  {LIVE_LABELS[liveState] ?? ''}
                </span>
              )}

              <dl className="assembly-head__counts">
                <div><dt>Dolazi</dt><dd>{tally.attending}</dd></div>
                <div><dt>Online</dt><dd>{tally.online}</dd></div>
                <div><dt>Možda</dt><dd>{tally.unsure}</dd></div>
                <div><dt>Ne dolazi</dt><dd>{tally.absent}</dd></div>
                <div><dt>Bez odgovora</dt><dd>{tally.noAnswer}</dd></div>
              </dl>

              {canEdit && (
                <div className="assembly-head__actions">
                  {session.status === SESSION_STATUS.SCHEDULED && (
                    <>
                      <button
                        type="button"
                        className="btn btn--primary btn--sm"
                        disabled={busy}
                        onClick={() => setStatus(SESSION_STATUS.IN_PROGRESS)}
                      >
                        Otvori sednicu
                      </button>
                      <button
                        type="button"
                        className="btn btn--outline btn--sm"
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm(`Otkazati sednicu "${session.title}"?`)) {
                            setStatus(SESSION_STATUS.CANCELLED);
                          }
                        }}
                      >
                        Otkaži
                      </button>
                    </>
                  )}

                  {isLiveSession && (
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm('Zatvoriti sednicu? Posle toga se više ne otvara.')) {
                          setStatus(SESSION_STATUS.FINISHED);
                        }
                      }}
                    >
                      Zatvori sednicu
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>

          {canTakePart && session.status !== SESSION_STATUS.FINISHED
            && session.status !== SESSION_STATUS.CANCELLED && (
            <section className="assembly-me">
              <div className="assembly-me__block">
                <h3 className="assembly-me__title">Da li dolaziš?</h3>
                <div className="assembly-me__choices">
                  {RSVP_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={[
                        'rsvp-btn',
                        `rsvp-btn--${option.tone}`,
                        mySeat?.response === option.value ? 'rsvp-btn--active' : '',
                      ].filter(Boolean).join(' ')}
                      disabled={busy}
                      aria-pressed={mySeat?.response === option.value}
                      onClick={() => setRsvp(option.value)}
                    >
                      <span className="rsvp-btn__icon" aria-hidden="true">{option.icon}</span>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {isLiveSession && (
                <div className="assembly-me__block">
                  <h3 className="assembly-me__title">Prisustvo</h3>
                  <div className="assembly-me__choices">
                    <button
                      type="button"
                      className={`rsvp-btn rsvp-btn--yes${mySeat?.checkInMode === CHECK_IN_MODE.IN_PERSON ? ' rsvp-btn--active' : ''}`}
                      disabled={busy}
                      onClick={() => setCheckIn(CHECK_IN_MODE.IN_PERSON)}
                    >
                      <span className="rsvp-btn__icon" aria-hidden="true">◉</span>
                      U sali
                    </button>
                    <button
                      type="button"
                      className={`rsvp-btn rsvp-btn--online${mySeat?.checkInMode === CHECK_IN_MODE.ONLINE ? ' rsvp-btn--active' : ''}`}
                      disabled={busy}
                      onClick={() => setCheckIn(CHECK_IN_MODE.ONLINE)}
                    >
                      <span className="rsvp-btn__icon" aria-hidden="true">◎</span>
                      Online
                    </button>
                    {mySeat?.checkedInAt && (
                      <button
                        type="button"
                        className="rsvp-btn rsvp-btn--no"
                        disabled={busy}
                        onClick={() => setCheckIn(null)}
                      >
                        <span className="rsvp-btn__icon" aria-hidden="true">✕</span>
                        Odjavi se
                      </button>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

          <AssemblyHall seats={seats} currentUserId={user?.id} />
        </>
      )}
    </div>
  );
}
