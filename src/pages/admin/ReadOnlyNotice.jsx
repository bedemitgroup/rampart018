// Shown at the top of a section somebody may read but not change. Without it a
// missing "Nova vest" button reads as a bug rather than as a permission.
export default function ReadOnlyNotice({ owner }) {
  return (
    <p className="admin__readonly" role="status">
      Pregled bez izmena — ovom sekcijom upravlja rola <strong>{owner}</strong>.
    </p>
  );
}
