const WINDOW = 2;

export default function Pagination({ page, pageCount, onPageChange }) {
  if (pageCount <= 1) {
    return null;
  }

  const go = (target) => {
    const clamped = Math.min(Math.max(1, target), pageCount);

    if (clamped !== page) {
      onPageChange(clamped);
    }
  };

  const start = Math.max(1, page - WINDOW);
  const end = Math.min(pageCount, page + WINDOW);

  const pages = [];
  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }

  return (
    <nav className="admin-pagination" aria-label="Paginacija">
      <button
        type="button"
        className="admin-pagination__btn"
        onClick={() => go(1)}
        disabled={page === 1}
        aria-label="Prva strana"
      >
        «
      </button>

      <button
        type="button"
        className="admin-pagination__btn"
        onClick={() => go(page - 1)}
        disabled={page === 1}
        aria-label="Prethodna strana"
      >
        ‹
      </button>

      {start > 1 && (
        <span className="admin-pagination__ellipsis">…</span>
      )}

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={`admin-pagination__btn${
            p === page ? ' admin-pagination__btn--active' : ''
          }`}
          onClick={() => go(p)}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </button>
      ))}

      {end < pageCount && (
        <span className="admin-pagination__ellipsis">…</span>
      )}

      <button
        type="button"
        className="admin-pagination__btn"
        onClick={() => go(page + 1)}
        disabled={page === pageCount}
        aria-label="Sledeća strana"
      >
        ›
      </button>

      <button
        type="button"
        className="admin-pagination__btn"
        onClick={() => go(pageCount)}
        disabled={page === pageCount}
        aria-label="Poslednja strana"
      >
        »
      </button>
    </nav>
  );
}
