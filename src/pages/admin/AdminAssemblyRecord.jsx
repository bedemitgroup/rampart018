import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { roleLabel } from '../../constants/roles';
import {
  OUTCOME,
  SESSION_STATUS,
  VOTE_CHOICE,
  VOTE_TONES,
  formatSessionDateTime,
} from '../../constants/assembly';
import AdminAssemblyTabs from './AdminAssemblyTabs';

/**
 * What the assembly leaves behind: the attendance standings, and the roll call
 * on everything that was put to a vote.
 *
 * Open to the whole membership, like the hall it archives — the votes were
 * public while they were being cast, so locking the record away afterwards
 * would only hide from members what those same members watched happen.
 */
export default function AdminAssemblyRecord() {
  const { user } = useAuth();

  const [standings, setStandings] = useState(null);
  const [year, setYear] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState('');
  const [record, setRecord] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recordError, setRecordError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [table, all] = await Promise.all([
        api.getAssemblyStandings(year ?? undefined),
        api.getAssemblySessions(),
      ]);
      setStandings(table);
      // Only sittings that actually happened have anything to archive.
      setSessions(all.filter((s) => s.status === SESSION_STATUS.FINISHED));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!sessionId) {
      setRecord(null);
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setRecordError('');
      try {
        const data = await api.getAssemblySessionRecord(sessionId);
        if (!cancelled) setRecord(data);
      } catch (err) {
        if (!cancelled) setRecordError(err.message);
      }
    })();

    return () => { cancelled = true; };
  }, [sessionId]);

  if (loading) return <p className="admin-news__loading">Učitavanje...</p>;

  return (
    <div>
      <div className="admin-news__header">
        <h1 className="admin__title">Skupština</h1>
      </div>

      <AdminAssemblyTabs />

      {error && <p className="admin-news__error">{error}</p>}

      <Standings
        standings={standings}
        year={year}
        onYear={setYear}
        currentUserId={user?.id}
      />

      <section className="agenda-section">
        <div className="agenda-section__head">
          <h2 className="agenda-section__title">Zapisnik sednice</h2>
        </div>
        <p className="agenda-section__hint">
          Ko je kako glasao o kojoj tački, i koliko je ko dobio poena.
        </p>

        {sessions.length === 0 ? (
          <p className="admin-news__empty">Nema održanih sednica.</p>
        ) : (
          <div className="admin-filters">
            <div className="admin-filters__group admin-filters__group--wide">
              <label className="admin-filters__label" htmlFor="record-session">Sednica</label>
              <select
                id="record-session"
                className="form-input"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
              >
                <option value="">Izaberi sednicu…</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} — {formatSessionDateTime(s.scheduledAt)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {recordError && <p className="admin-news__error">{recordError}</p>}
        {record && <SessionRecord record={record} currentUserId={user?.id} />}
      </section>
    </div>
  );
}

function Standings({ standings, year, onYear, currentUserId }) {
  const rows = standings?.standings ?? [];
  const years = standings?.availableYears ?? [];

  return (
    <section className="agenda-section">
      <div className="agenda-section__head">
        <h2 className="agenda-section__title">Poeni za prisustvo</h2>
        <span className="agenda-section__count">{rows.length}</span>
      </div>
      <p className="agenda-section__hint">
        Ko je bio na sednici — u sali ili online — dobija +1, ko se nije pojavio −1.
        Upisuje se kad se sednica zatvori.
      </p>

      {years.length > 1 && (
        <div className="admin-filters">
          <div className="admin-filters__group">
            <label className="admin-filters__label" htmlFor="points-year">Godina</label>
            <select
              id="points-year"
              className="form-input"
              value={year ?? standings?.year ?? ''}
              onChange={(e) => onYear(Number(e.target.value))}
            >
              {years.map((y) => <option key={y} value={y}>{y}.</option>)}
            </select>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="admin-news__empty">
          Još nema upisanih poena — upisuju se kad se prva sednica zatvori.
        </p>
      ) : (
        <div className="record-table-wrap">
          <table className="admin-news__table record-table">
            <thead>
              <tr>
                <th>Član</th>
                <th>Rola</th>
                <th colSpan={2}>{standings.year}.</th>
                <th colSpan={2}>Ukupno</th>
              </tr>
              <tr className="record-table__subhead">
                <th />
                <th />
                <th>bio / nije</th>
                <th>poeni</th>
                <th>bio / nije</th>
                <th>poeni</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.userId} className={r.userId === currentUserId ? 'record-table__me' : undefined}>
                  <td className="admin-news__title-cell">
                    {r.username}
                    {r.userId === currentUserId && <span className="agenda-item__mine"> (ti)</span>}
                  </td>
                  <td>{roleLabel(r.role)}</td>
                  <td>{r.presentInYear} / {r.absentInYear}</td>
                  <td><Score value={r.pointsInYear} /></td>
                  <td>{r.presentTotal} / {r.absentTotal}</td>
                  <td><Score value={r.pointsTotal} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SessionRecord({ record, currentUserId }) {
  const { session, points, topics } = record;

  return (
    <div className="record">
      <h3 className="record__title">
        {session.title} — {formatSessionDateTime(session.scheduledAt)}
      </h3>

      <h4 className="record__heading">Prisustvo</h4>
      {points.length === 0 ? (
        <p className="admin-news__empty">
          Za ovu sednicu poeni nisu upisani — održana je pre nego što se evidencija vodila.
        </p>
      ) : (
        <ul className="record__chips">
          {points.map((p) => (
            <li
              key={p.userId}
              className={`record-chip record-chip--${p.attended ? 'present' : 'absent'}`}
            >
              <span className="record-chip__name">
                {p.username}
                {p.userId === currentUserId && ' (ti)'}
              </span>
              <span className="record-chip__meta">
                {p.attended ? p.mode ?? 'prisutan' : 'nije došao'} · {p.points > 0 ? `+${p.points}` : p.points}
              </span>
            </li>
          ))}
        </ul>
      )}

      <h4 className="record__heading">Glasanja</h4>
      {topics.length === 0 ? (
        <p className="admin-news__empty">O nijednoj tački se nije glasalo.</p>
      ) : (
        topics.map((t) => (
          <article className="record__topic" key={t.topicId}>
            <div className="record__topic-head">
              <h5 className="record__topic-title">{t.title}</h5>
              <span className={`agenda-item__result agenda-item__result--${t.outcome === OUTCOME.PASSED ? 'passed' : 'failed'}`}>
                {t.outcome}
              </span>
            </div>
            <p className="record__topic-body">{t.description}</p>
            <p className="record__topic-tally">
              za {t.for} · protiv {t.against} · uzdržano {t.abstained}
            </p>

            {t.rollCall.length === 0 ? (
              <p className="record__none">Niko nije glasao.</p>
            ) : (
              <ul className="record__chips">
                {[VOTE_CHOICE.FOR, VOTE_CHOICE.AGAINST, VOTE_CHOICE.ABSTAINED].flatMap((choice) =>
                  t.rollCall
                    .filter((v) => v.choice === choice)
                    .map((v) => (
                      <li key={`${t.topicId}-${v.userId}`} className={`record-chip record-chip--${VOTE_TONES[choice]}`}>
                        <span className="record-chip__name">
                          {v.username}
                          {v.userId === currentUserId && ' (ti)'}
                        </span>
                        <span className="record-chip__meta">{choice}</span>
                      </li>
                    )))}
              </ul>
            )}
          </article>
        ))
      )}
    </div>
  );
}

function Score({ value }) {
  const tone = value > 0 ? 'plus' : value < 0 ? 'minus' : 'zero';
  return <strong className={`record-score record-score--${tone}`}>{value > 0 ? `+${value}` : value}</strong>;
}
