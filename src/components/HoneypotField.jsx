/**
 * Hidden field that only an automated form-filler will complete. The backend
 * silently discards any submission that arrives with it set.
 *
 * The name is deliberately mundane so it does not read as a trap to a script
 * scanning field names, but it is also outside the autocomplete vocabulary -
 * a name like "website" or "middle_name" risks the browser filling it for a
 * real person, whose submission would then vanish without explanation.
 */
export const HONEYPOT_NAME = 'contact_reference';

export default function HoneypotField({ value, onChange }) {
  return (
    <div className="visually-hidden" aria-hidden="true">
      <label htmlFor={HONEYPOT_NAME}>Ostavite ovo polje prazno</label>
      <input
        id={HONEYPOT_NAME}
        name={HONEYPOT_NAME}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}
