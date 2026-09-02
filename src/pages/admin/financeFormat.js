/** Formatting shared by the finance admin screens. */

const amountFormatter = new Intl.NumberFormat('sr-RS', { maximumFractionDigits: 2 });
const dateFormatter = new Intl.DateTimeFormat('sr-RS', { dateStyle: 'medium' });

export const TYPE_LABELS = {
  Income: 'Prihod',
  Expense: 'Rashod',
};

export const COLOR_OPTIONS = [
  { value: 'primary', label: 'Tamnoplava', swatch: '#173F73' },
  { value: 'secondary', label: 'Tirkizna', swatch: '#0F8A8D' },
  { value: 'accent', label: 'Crvena', swatch: '#B22234' },
  { value: 'success', label: 'Zelena', swatch: '#2E8B57' },
  { value: 'neutral', label: 'Siva', swatch: '#B0B7C3' },
];

export const QUARTER_STATUSES = ['Usvojen', 'U toku', 'Nije počeo'];

export function formatAmount(value) {
  return amountFormatter.format(value ?? 0);
}

/** Entry dates arrive as plain "YYYY-MM-DD", with no timezone to shift them. */
export function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return dateFormatter.format(new Date(year, month - 1, day));
}
