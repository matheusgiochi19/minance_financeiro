export function PageSkeleton() {
  return (
    <section className="page-skeleton" aria-label="Carregando dados">
      <div className="skeleton-line skeleton-title" />
      <div className="skeleton-line skeleton-subtitle" />
      <div className="skeleton-grid">
        <div className="skeleton-card" />
        <div className="skeleton-card" />
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </div>
      <div className="skeleton-table">
        {Array.from({ length: 6 }).map((_, index) => <div className="skeleton-row" key={index} />)}
      </div>
    </section>
  );
}
