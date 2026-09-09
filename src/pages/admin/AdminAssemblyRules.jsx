import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { canManageAssembly } from '../../constants/roles';
import { MAJORITY_RULE_HELP, formatSessionDateTime } from '../../constants/assembly';
import AdminAssemblyTabs from './AdminAssemblyTabs';

/**
 * The quorum and the majority the association decides by.
 *
 * These are settings rather than constants in the code because that is what the
 * law actually leaves open: the Zakon o udruženjima fixes neither figure — it
 * requires the statute to say how decisions are made (čl. 12), and every
 * association writes its own. So this screen is where the statute gets copied
 * in, and the whole membership can read it, because a member is entitled to
 * know what his vote is counted against.
 */
export default function AdminAssemblyRules() {
  const { user } = useAuth();
  const canEdit = canManageAssembly(user);

  const [rules, setRules] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.getAssemblyRules();
        if (cancelled) return;
        setRules(data);
        setDraft({ quorumPercent: data.quorumPercent, majorityRule: data.majorityRule });
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setActionError('');
    setSaved(false);
    setSaving(true);
    try {
      const next = await api.updateAssemblyRules(draft);
      setRules(next);
      setDraft({ quorumPercent: next.quorumPercent, majorityRule: next.majorityRule });
      setSaved(true);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="admin-news__loading">Učitavanje...</p>;

  // What the percentage in the form would mean right now, recomputed as it is
  // typed — the same arithmetic the server does, shown so nobody has to do it
  // in their head.
  const previewThreshold = rules.eligibleCount === 0
    ? 0
    : Math.floor((rules.eligibleCount * (draft?.quorumPercent ?? 0)) / 100) + 1;

  return (
    <div>
      <div className="admin-news__header">
        <h1 className="admin__title">Skupština</h1>
      </div>

      <AdminAssemblyTabs />

      {error && <p className="admin-news__error">{error}</p>}

      {!error && rules && (
        <>
          <section className="agenda-section">
            <div className="agenda-section__head">
              <h2 className="agenda-section__title">Pravila glasanja</h2>
            </div>
            <p className="agenda-section__hint">
              Zakon o udruženjima ne propisuje ni kvorum ni većinu — traži samo da
              statut uredi način odlučivanja. Ovde se prepisuje ono što piše u
              vašem statutu, i važi za sve sednice.
            </p>

            {actionError && <p className="admin-news__error">{actionError}</p>}

            <form className="rules" onSubmit={handleSubmit}>
              <div className="rules__field">
                <label className="form-label" htmlFor="quorum">Kvorum</label>
                <div className="rules__inline">
                  <input
                    id="quorum"
                    type="number"
                    min="0"
                    max="100"
                    className="form-input rules__percent"
                    value={draft.quorumPercent}
                    disabled={!canEdit}
                    onChange={(e) => setDraft((d) => ({ ...d, quorumPercent: Number(e.target.value) }))}
                  />
                  <span className="rules__unit">% članstva</span>
                </div>
                <p className="form-hint">
                  Sednica punovažno odlučuje ako je prijavljeno <strong>više od</strong> tog
                  procenta. Sa {rules.eligibleCount} članova na spisku to znači{' '}
                  <strong>{previewThreshold}</strong>{' '}
                  {previewThreshold === 1 ? 'prisutnog' : 'prisutnih'}.
                </p>
                <p className="form-hint">
                  Bez kvoruma se i dalje može glasati, ali odluka nosi vidljivu
                  oznaku „bez kvoruma" u sali i u zapisniku.
                </p>
              </div>

              <div className="rules__field">
                <span className="form-label">Većina</span>
                <div className="rules__choices">
                  {rules.majorityRules.map((rule) => (
                    <label
                      key={rule}
                      className={`rules__choice${draft.majorityRule === rule ? ' rules__choice--active' : ''}`}
                    >
                      <input
                        type="radio"
                        name="majority"
                        value={rule}
                        checked={draft.majorityRule === rule}
                        disabled={!canEdit}
                        onChange={() => setDraft((d) => ({ ...d, majorityRule: rule }))}
                      />
                      <span>
                        <strong className="rules__choice-title">{rule}</strong>
                        <span className="rules__choice-help">{MAJORITY_RULE_HELP[rule]}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {canEdit && (
                <div className="rules__actions">
                  <button type="submit" className="btn btn--primary" disabled={saving}>
                    {saving ? 'Čuvanje...' : 'Sačuvaj pravila'}
                  </button>
                  {saved && <span className="admin-finance__saved">Sačuvano ✓</span>}
                </div>
              )}
            </form>

            <p className="rules__meta">
              {rules.updatedByUsername
                ? `Poslednja izmena: ${rules.updatedByUsername}, ${formatSessionDateTime(rules.updatedAt)}.`
                : 'Pravila još nisu menjana — važe podrazumevana.'}
            </p>
          </section>
        </>
      )}
    </div>
  );
}
