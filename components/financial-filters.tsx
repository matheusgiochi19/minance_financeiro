"use client";

import { memo, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ExpenseOption, ExpenseStatus } from "@/lib/expenses";

type FinancialFiltersProps = {
  categories: ExpenseOption[];
  pockets: ExpenseOption[];
  showStatus?: boolean;
  status?: ExpenseStatus | "";
};

const statusOptions: Array<{ label: string; value: ExpenseStatus }> = [
  { label: "Pendente", value: "p" },
  { label: "Paga", value: "pp" },
  { label: "Aberta", value: "ab" }
];

function FinancialFiltersComponent({ categories, pockets, showStatus = false, status = "" }: FinancialFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = useMemo(() => searchParams.toString(), [searchParams]);
  const [isPending, startTransition] = useTransition();
  const didMount = useRef(false);
  const [filters, setFilters] = useState({
    bolso: searchParams.get("bolso") || "",
    categoria: searchParams.get("categoria") || "",
    q: searchParams.get("q") || "",
    status
  });

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }

    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams(query);
      for (const [key, value] of Object.entries(filters)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      params.delete("page");
      startTransition(() => router.replace(`${pathname}?${params.toString()}`));
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [filters, pathname, query, router]);

  return (
    <CardlessFilterForm isPending={isPending}>
      <label>
        <span>Busca</span>
        <input value={filters.q} name="q" placeholder="Buscar descrição" onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} />
      </label>
      {showStatus ? (
        <label>
          <span>Status</span>
          <select value={filters.status} name="status" onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as ExpenseStatus | "" }))}>
            <option value="">Todos</option>
            {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      ) : null}
      <label>
        <span>Categoria</span>
        <select value={filters.categoria} name="categoria" onChange={(event) => setFilters((current) => ({ ...current, categoria: event.target.value }))}>
          <option value="">Todas</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.nome}</option>)}
        </select>
      </label>
      <label>
        <span>Bolso</span>
        <select value={filters.bolso} name="bolso" onChange={(event) => setFilters((current) => ({ ...current, bolso: event.target.value }))}>
          <option value="">Todos</option>
          {pockets.map((pocket) => <option key={pocket.id} value={pocket.id}>{pocket.nome}</option>)}
        </select>
      </label>
    </CardlessFilterForm>
  );
}

function CardlessFilterForm({ children, isPending }: { children: ReactNode; isPending: boolean }) {
  return (
    <form className="expense-filters" onSubmit={(event) => event.preventDefault()}>
      {children}
      <Button type="button" disabled={isPending}>{isPending ? "Filtrando..." : "Filtros ativos"}</Button>
    </form>
  );
}

export const FinancialFilters = memo(FinancialFiltersComponent);
