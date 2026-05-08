import Link from "next/link";

type PaginationProps = {
  page: number;
  pageSize: number;
  params?: Record<string, string | undefined>;
  total: number;
};

function pageHref(page: number, current: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(current)) {
    if (value) params.set(key, value);
  }
  params.set("page", String(page));
  return `?${params.toString()}`;
}

export function Pagination({ page, pageSize, params = {}, total }: PaginationProps) {
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const previous = Math.max(page - 1, 1);
  const next = Math.min(page + 1, totalPages);

  return (
    <nav className="pagination" aria-label="Paginação">
      <Link className={page <= 1 ? "disabled" : ""} href={pageHref(previous, params)} aria-disabled={page <= 1}>Anterior</Link>
      <span>Página {page} de {totalPages}</span>
      <Link className={page >= totalPages ? "disabled" : ""} href={pageHref(next, params)} aria-disabled={page >= totalPages}>Próxima</Link>
    </nav>
  );
}
