import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { canManageAssembly, canVoteInAssembly } from '../../constants/roles';
import {
  SESSION_STATUS,
  TOPIC_STATUS,
  TOPIC_STATUS_TONES,
  VOTING_STATUS,
  formatSessionDateTime,
} from '../../constants/assembly';
import { useAssemblyLive } from '../../hooks/useAssemblyLive';
import AdminAssemblyTabs from './AdminAssemblyTabs';

const emptyDraft = { title: '', description: '' };

export default function AdminAssemblyTopics() {
  const { user } = useAuth();
  const isChair = canManageAssembly(user);
  const canPropose = canVoteInAssembly(user);

  const [session, setSession] = useState(null);
  const [topics, setTopics] = useState([]);
  const [backlog, setBacklog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  const [draft, setDraft] = useState(emptyDraft);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(emptyDraft);

  const sessionId = session?.id ?? null;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const current = await api.getCurrentAssemblySession();
      setSession(current);
      const [forSession, loose] = await Promise.all([
        current ? api.getAssemblyTopics({ sessionId: current.id }) : Promise.resolve([]),
        api.getAssemblyTopics({ backlog: true }),
      ]);
      setTopics(forSession);
      setBacklog(loose);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Merge by id, never append: a broadcast can arrive before the fetch that
  // caused it resolves in the tab that acted.
  const mergeTopic = useCallback((topic) => {
    setTopics((prev) => {
      const without = prev.filter((t) => t.id !== topic.id);
      return topic.sessionId === sessionId ? [...without, topic] : without;
    });
    setBacklog((prev) => {
      const without = prev.filter((t) => t.id !== topic.id);
      return topic.sessionId === null ? [...without, topic] : without;
    });
  }, [sessionId]);

  const handlers = useMemo(() => ({
    onTopicChanged: mergeTopic,
    onTopicRemoved: (id) => {
      setTopics((prev) => prev.filter((t) => t.id !== id));
      setBacklog((prev) => prev.filter((t) => t.id !== id));
    },
    // A reorder arrives as the whole list for one status, so the incoming order
    // replaces that slice wholesale and every screen lands on the same one.
    onAgendaReordered: (agenda) => {
      if (agenda.length === 0) return;
      const status = agenda[0].status;
      setTopics((prev) => [...prev.filter((t) => t.status !== status), ...agenda]);
    },
    onSessionChanged: (next) => setSession((prev) => (prev && prev.id === next.id ? next : prev)),
    onResync: load,
  }), [mergeTopic, load]);

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

  const submitProposal = (e) => {
    e.preventDefault();
    return act(async () => {
      mergeTopic(await api.createAssemblyTopic({ ...draft, sessionId: null }));
      setDraft(emptyDraft);
      setShowForm(false);
      // The server may have filed it against a sitting we are not showing, or
      // into the backlog, so the lists are re-read rather than guessed at.
      await load();
    });
  };

  const saveEdit = (id) => act(async () => {
    mergeTopic(await api.updateAssemblyTopic(id, editDraft));
    setEditingId(null);
  });

  const review = (topic, status) => act(async () => {
    const note = status === TOPIC_STATUS.REJECTED
      ? window.prompt(`Zašto se odbija "${topic.title}"? (opciono)`) ?? null
      : null;
    mergeTopic(await api.reviewAssemblyTopic(topic.id, status, note));
  });

  const withdraw = (topic) => act(async () => {
    if (!window.confirm(`Povući predlog "${topic.title}"?`)) return;
    mergeTopic(await api.withdrawAssemblyTopic(topic.id));
  });

  const assign = (topic, targetSessionId) => act(async () => {
    mergeTopic(await api.assignAssemblyTopic(topic.id, targetSessionId));
  });

  const move = (topic, direction) => act(async () => {
    const agenda = await api.moveAssemblyTopic(topic.id, direction);
    setTopics((prev) => [...prev.filter((t) => t.status !== topic.status), ...agenda]);
  });

  const remove = (topic) => act(async () => {
    if (!window.confirm(`Obrisati temu "${topic.title}"?`)) return;
    await api.deleteAssemblyTopic(topic.id);
    setTopics((prev) => prev.filter((t) => t.id !== topic.id));
    setBacklog((prev) => prev.filter((t) => t.id !== topic.id));
  });

  const byStatus = (list, status) => list
    .filter((t) => t.status === status)
    .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id);

  const agenda = byStatus(topics, TOPIC_STATUS.ACCEPTED);
  const pending = byStatus(topics, TOPIC_STATUS.PROPOSED);
  const declined = [
    ...byStatus(topics, TOPIC_STATUS.REJECTED),
    ...byStatus(topics, TOPIC_STATUS.WITHDRAWN),
  ];

  const sessionOpenForChanges = session
    && session.status !== SESSION_STATUS.FINISHED
    && session.status !== SESSION_STATUS.CANCELLED;

  const cardProps = {
    isChair,
    busy,
    editingId,
    editDraft,
    setEditingId,
    setEditDraft,
    saveEdit,
    review,
    withdraw,
    remove,
    currentUserId: user?.id,
  };

  if (loading) return <p className="admin-news__loading">Učitavanje...</p>;

  return (
    <div>
      <div className="admin-news__header">
        <h1 className="admin__title">Skupština</h1>
        {canPropose && sessionOpenForChanges && (
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? 'Odustani' : '+ Predloži temu'}
          </button>
        )}
      </div>

      <AdminAssemblyTabs />

      {actionError && <p className="admin-news__error">{actionError}</p>}
      {error && <p className="admin-news__error">{error}</p>}

      {!error && !session && (
        <p className="admin-news__empty">
          Nema zakazanih sednica. Predlozi se skupljaju u beklegu dok se sednica ne zakaže.
        </p>
      )}

      {session && (
        <p className="agenda__for">
          Dnevni red za <strong>{session.title}</strong> — {formatSessionDateTime(session.scheduledAt)}
          {liveState === 'offline' && (
            <span className="agenda__stale"> · veza sa serverom je prekinuta, osveži stranicu</span>
          )}
        </p>
      )}

      {showForm && (
        <form className="agenda-form" onSubmit={submitProposal}>
          <div className="form-group">
            <label className="form-label" htmlFor="topic-title">
              Naslov teme <span className="required-star">*</span>
            </label>
            <input
              id="topic-title"
              className="form-input"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="npr. Nabavka opreme za merenje buke"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="topic-description">
              O čemu se glasa <span className="required-star">*</span>
            </label>
            <textarea
              id="topic-description"
              className="form-input"
              rows={4}
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="Obrazloženje i konkretan predlog odluke."
              required
            />
          </div>
          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy ? 'Slanje...' : 'Pošalji predlog'}
          </button>
        </form>
      )}

      <TopicSection
        title="Dnevni red"
        hint="Prihvaćene tačke, redom kojim se o njima raspravlja."
        topics={agenda}
        empty="Nijedna tema još nije prihvaćena."
        ordered
        onMove={move}
        {...cardProps}
      />

      <TopicSection
        title="Na čekanju"
        hint={isChair
          ? 'Predlozi koje treba prihvatiti ili odbiti.'
          : 'Tvoji predlozi o kojima Skupština još nije odlučila.'}
        topics={pending}
        empty="Nema predloga na čekanju."
        {...cardProps}
      />

      {backlog.length > 0 && (
        <TopicSection
          title="Bekleg"
          hint="Teme koje još nisu vezane ni za jednu sednicu."
          topics={backlog}
          empty=""
          onAssign={session && sessionOpenForChanges
            ? (topic) => assign(topic, session.id)
            : undefined}
          assignLabel={session ? `Stavi u „${session.title}"` : ''}
          {...cardProps}
        />
      )}

      {declined.length > 0 && (
        <TopicSection
          title="Odbijene i povučene"
          hint=""
          topics={declined}
          empty=""
          onAssign={undefined}
          {...cardProps}
        />
      )}
    </div>
  );
}

function TopicSection({
  title, hint, topics, empty, ordered = false,
  onMove, onAssign, assignLabel, ...card
}) {
  return (
    <section className="agenda-section">
      <div className="agenda-section__head">
        <h2 className="agenda-section__title">{title}</h2>
        <span className="agenda-section__count">{topics.length}</span>
      </div>
      {hint && <p className="agenda-section__hint">{hint}</p>}

      {topics.length === 0 ? (
        empty && <p className="admin-news__empty">{empty}</p>
      ) : (
        <ol className="agenda-list">
          {topics.map((topic, index) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              index={ordered ? index + 1 : null}
              onMoveUp={onMove && index > 0 ? () => onMove(topic, 'up') : null}
              onMoveDown={onMove && index < topics.length - 1 ? () => onMove(topic, 'down') : null}
              onAssign={onAssign ? () => onAssign(topic) : null}
              assignLabel={assignLabel}
              {...card}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

function TopicCard({
  topic, index, isChair, busy, currentUserId,
  editingId, editDraft, setEditingId, setEditDraft, saveEdit,
  review, withdraw, remove,
  onMoveUp, onMoveDown, onAssign, assignLabel,
}) {
  const isEditing = editingId === topic.id;
  const isMine = topic.proposedByUserId === currentUserId;
  const votingStarted = topic.votingStatus !== VOTING_STATUS.NOT_OPENED;

  return (
    <li className={`agenda-item agenda-item--${TOPIC_STATUS_TONES[topic.status]}`}>
      <div className="agenda-item__head">
        <div className="agenda-item__heading">
          {index && <span className="agenda-item__index">{index}.</span>}
          {isEditing ? (
            <input
              className="form-input"
              value={editDraft.title}
              onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
            />
          ) : (
            <h3 className="agenda-item__title">{topic.title}</h3>
          )}
        </div>

        <span className={`agenda-badge agenda-badge--${TOPIC_STATUS_TONES[topic.status]}`}>
          {topic.status}
        </span>
      </div>

      {isEditing ? (
        <textarea
          className="form-input"
          rows={4}
          value={editDraft.description}
          onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value }))}
        />
      ) : (
        <p className="agenda-item__body">{topic.description}</p>
      )}

      <p className="agenda-item__meta">
        Predložio {topic.proposedByUsername}
        {isMine && <span className="agenda-item__mine"> (ti)</span>}
        {topic.reviewedByUsername && ` · odlučio ${topic.reviewedByUsername}`}
        {votingStarted && ` · glasanje: ${topic.votingStatus.toLowerCase()}`}
      </p>

      {topic.reviewNote && (
        <p className="agenda-item__note">Obrazloženje: {topic.reviewNote}</p>
      )}

      <div className="agenda-item__actions">
        {isEditing ? (
          <>
            <button type="button" className="admin-news__action-btn" disabled={busy} onClick={() => saveEdit(topic.id)}>
              Sačuvaj
            </button>
            <button type="button" className="admin-news__action-btn" onClick={() => setEditingId(null)}>
              Odustani
            </button>
          </>
        ) : (
          <>
            {isChair && topic.status === TOPIC_STATUS.PROPOSED && (
              <>
                <button type="button" className="admin-news__action-btn" disabled={busy}
                  onClick={() => review(topic, TOPIC_STATUS.ACCEPTED)}>
                  Prihvati
                </button>
                <button type="button" className="admin-news__action-btn admin-news__action-btn--delete" disabled={busy}
                  onClick={() => review(topic, TOPIC_STATUS.REJECTED)}>
                  Odbij
                </button>
              </>
            )}

            {onAssign && (
              <button type="button" className="admin-news__action-btn" disabled={busy} onClick={onAssign}>
                {assignLabel}
              </button>
            )}

            {onMoveUp !== undefined && (onMoveUp || onMoveDown) && (
              <span className="admin-news__move-cell">
                <button type="button" className="admin-news__move-btn" disabled={busy || !onMoveUp}
                  onClick={onMoveUp ?? undefined} aria-label="Pomeri gore">↑</button>
                <button type="button" className="admin-news__move-btn" disabled={busy || !onMoveDown}
                  onClick={onMoveDown ?? undefined} aria-label="Pomeri dole">↓</button>
              </span>
            )}

            {topic.canEdit && (
              <button
                type="button"
                className="admin-news__action-btn"
                onClick={() => {
                  setEditingId(topic.id);
                  setEditDraft({ title: topic.title, description: topic.description });
                }}
              >
                Izmeni
              </button>
            )}

            {isMine && topic.status === TOPIC_STATUS.PROPOSED && (
              <button type="button" className="admin-news__action-btn" disabled={busy} onClick={() => withdraw(topic)}>
                Povuci
              </button>
            )}

            {topic.canDelete && (
              <button type="button" className="admin-news__action-btn admin-news__action-btn--delete"
                disabled={busy} onClick={() => remove(topic)}>
                Obriši
              </button>
            )}
          </>
        )}
      </div>
    </li>
  );
}
