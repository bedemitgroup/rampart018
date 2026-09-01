import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import HoneypotField, { HONEYPOT_NAME } from './HoneypotField';
import './Comments.css';

function formatDate(isoString) {
  const d = new Date(isoString);
  const months = ['jan','feb','mar','apr','maj','jun','jul','avg','sep','okt','nov','dec'];
  return `${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}.`;
}

function Avatar({ username }) {
  return <div className="comment-avatar">{username ? username[0].toUpperCase() : '?'}</div>;
}

export default function Comments({ vestSlug }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [content, setContent] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [actionError, setActionError] = useState('');

  const isMod = user && (user.role === 'Moderator' || user.role === 'Admin');

  useEffect(() => { loadComments(); }, [vestSlug]);

  async function loadComments() {
    setLoadingComments(true);
    setFetchError('');
    try {
      const data = await api.getComments(vestSlug);
      setComments(data);
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setLoadingComments(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);
    try {
      await api.postComment({
        vestSlug,
        content: content.trim(),
        [HONEYPOT_NAME]: honeypot,
      });
      setContent('');
      setSubmitSuccess(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(id) {
    setActionError('');
    try {
      await api.approveComment(id);
      setComments(prev => prev.map(c => c.id === id ? { ...c, isApproved: true } : c));
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleDelete(id) {
    setActionError('');
    try {
      await api.deleteComment(id);
      setComments(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleVote(commentId, isLike) {
    if (!user) { setShowAuth(true); return; }
    try {
      const result = await api.voteComment({ commentId, isLike });
      setComments(prev => prev.map(c => {
        if (c.id !== commentId) return c;
        // toggle: if same vote, remove it; if different, switch
        const wasLike = c.userVote === true;
        const wasDislike = c.userVote === false;
        const removed = (isLike && wasLike) || (!isLike && wasDislike);
        return {
          ...c,
          likes: result.likes,
          dislikes: result.dislikes,
          userVote: removed ? null : isLike,
        };
      }));
    } catch (err) {
      setActionError(err.message);
    }
  }

  const approved = comments.filter(c => c.isApproved);
  const pending  = comments.filter(c => !c.isApproved);

  return (
    <section className="comments-section">
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {loadingComments && <p className="comments-loading">Učitavanje komentara...</p>}
      {fetchError     && <p className="comments-fetch-error">{fetchError}</p>}

      {!loadingComments && !fetchError && (
        <>
          {approved.length === 0 && !isMod && (
            <p className="comments-empty">Još nema komentara. Budite prvi!</p>
          )}

          <div className="comments-list">
            {approved.map(c => (
              <CommentCard
                key={c.id}
                comment={c}
                isMod={false}
                onVote={handleVote}
                currentUser={user}
              />
            ))}
          </div>

          {isMod && pending.length > 0 && (
            <div className="comments-pending-section">
              <h3 className="comments-pending-title">Na čekanju ({pending.length})</h3>
              {actionError && <p className="comments-action-error">{actionError}</p>}
              <div className="comments-list">
                {pending.map(c => (
                  <CommentCard
                    key={c.id}
                    comment={c}
                    isMod
                    onApprove={() => handleApprove(c.id)}
                    onDelete={() => handleDelete(c.id)}
                    onVote={handleVote}
                    currentUser={user}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="comments-form-wrap">
        {!user ? (
          <div className="comments-login-prompt">
            <p>
              <button className="comments-login-btn" onClick={() => setShowAuth(true)}>
                Prijavite se
              </button>{' '}
              da biste ostavili komentar.
            </p>
          </div>
        ) : (
          <form className="comments-form" onSubmit={handleSubmit}>
            <div className="comments-form__header">
              <Avatar username={user.username} />
              <span className="comments-form__username">{user.username}</span>
            </div>
            <textarea
              className="comments-textarea"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Napišite komentar..."
              rows={4}
              required
            />
            <HoneypotField value={honeypot} onChange={setHoneypot} />
            {submitError && <p className="comments-submit-error">{submitError}</p>}
            {submitSuccess && (
              <p className="comments-submit-success">
                Vaš komentar je primljen i čeka odobrenje moderatora.
              </p>
            )}
            <button className="comments-submit-btn" type="submit" disabled={submitting}>
              {submitting ? 'Slanje...' : 'Pošalji komentar'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function CommentCard({ comment, isMod, onApprove, onDelete, onVote, currentUser }) {
  const userVote = comment.userVote; // true=like, false=dislike, null=none

  return (
    <div className={`comment-card${isMod && !comment.isApproved ? ' comment-card--pending' : ''}`}>
      <div className="comment-card__top">
        <Avatar username={comment.username} />
        <div className="comment-card__meta">
          <span className="comment-card__username">{comment.username}</span>
          <span className="comment-card__date">{formatDate(comment.createdAt)}</span>
        </div>
        {isMod && !comment.isApproved && (
          <span className="comment-badge">Na čekanju</span>
        )}
      </div>

      <p className="comment-card__content">{comment.content}</p>

      <div className="comment-card__footer">
        {/* Like / Dislike */}
        <div className="comment-votes">
          <button
            className={`comment-vote-btn comment-vote-btn--like${userVote === true ? ' active' : ''}`}
            onClick={() => onVote(comment.id, true)}
            title="Korisno"
          >
            <span className="comment-vote-icon">👍</span>
            <span className="comment-vote-count">{comment.likes || 0}</span>
          </button>
          <button
            className={`comment-vote-btn comment-vote-btn--dislike${userVote === false ? ' active' : ''}`}
            onClick={() => onVote(comment.id, false)}
            title="Nije korisno"
          >
            <span className="comment-vote-icon">👎</span>
            <span className="comment-vote-count">{comment.dislikes || 0}</span>
          </button>
        </div>

        {/* Mod actions */}
        {isMod && !comment.isApproved && (
          <div className="comment-card__actions">
            <button className="comment-btn comment-btn--approve" onClick={onApprove}>Odobri</button>
            <button className="comment-btn comment-btn--delete" onClick={onDelete}>Obriši</button>
          </div>
        )}
      </div>
    </div>
  );
}
