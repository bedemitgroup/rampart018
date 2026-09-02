import { OUTCOME, VOTE_OPTIONS, VOTING_STATUS } from '../../constants/assembly';

/**
 * What the room is deciding, and the three buttons for deciding it.
 *
 * Built for a phone held in a room: the buttons are full width, tall, and
 * carry the word rather than only a colour, because the one thing that must
 * never be ambiguous is which way you just voted.
 */
export default function AssemblyBallot({
  topic, tally, myChoice, canVote, busy, onVote, onClose, isChair,
}) {
  const open = tally.votingStatus === VOTING_STATUS.OPEN;
  const cast = tally.for + tally.against + tally.abstained;

  const bars = [
    { key: 'for', label: 'ZA', value: tally.for },
    { key: 'against', label: 'PROTIV', value: tally.against },
    { key: 'abstain', label: 'UZDRŽAN', value: tally.abstained },
  ];

  return (
    <section className={`ballot ballot--${open ? 'open' : 'closed'}`}>
      <div className="ballot__head">
        <span className="ballot__flag">
          {open ? 'Glasanje u toku' : 'Glasanje zatvoreno'}
        </span>
        {isChair && open && (
          <button type="button" className="btn btn--primary btn--sm" disabled={busy} onClick={onClose}>
            Zatvori glasanje
          </button>
        )}
      </div>

      <h2 className="ballot__title">{topic?.title ?? tally.topicTitle}</h2>
      {topic?.description && <p className="ballot__body">{topic.description}</p>}

      <div className="ballot__bars">
        {bars.map(({ key, label, value }) => (
          <div className="ballot__bar" key={key}>
            <div className="ballot__bar-head">
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
            <div className="ballot__bar-track">
              <div
                className={`ballot__bar-fill ballot__bar-fill--${key}`}
                style={{ width: `${cast === 0 ? 0 : (value / cast) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="ballot__meta">
        Glasalo {cast} od {tally.eligibleVoters} · nije glasalo {tally.notVoted}
        {tally.quorumRequired != null && (
          <span className={tally.quorumMet ? 'ballot__quorum--met' : 'ballot__quorum--short'}>
            {' · kvorum '}
            {tally.quorumMet ? 'ispunjen' : `nije ispunjen (traži se ${tally.quorumRequired})`}
          </span>
        )}
      </p>

      {!open && (
        <p className={`ballot__verdict ballot__verdict--${tally.outcome === OUTCOME.PASSED ? 'passed' : 'failed'}`}>
          {tally.outcome}
        </p>
      )}

      {open && canVote && (
        <div className="ballot__choices">
          {VOTE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={[
                'vote-btn',
                `vote-btn--${option.tone}`,
                myChoice === option.value ? 'vote-btn--active' : '',
              ].filter(Boolean).join(' ')}
              disabled={busy}
              aria-pressed={myChoice === option.value}
              onClick={() => onVote(option.value)}
            >
              <span className="vote-btn__icon" aria-hidden="true">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      )}

      {open && canVote && (
        <p className="ballot__hint" role="status">
          {myChoice
            ? `Tvoj glas: ${myChoice}. Možeš ga promeniti dok je glasanje otvoreno.`
            : 'Još nisi glasao.'}
        </p>
      )}

      {open && !canVote && (
        <p className="ballot__hint">Tvoj nalog nema pravo glasa na skupštini.</p>
      )}
    </section>
  );
}
