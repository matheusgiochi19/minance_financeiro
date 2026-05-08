"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type MonthFilterProps = {
  action?: string;
  month: string;
};

export function MonthFilter({ action, month }: MonthFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(month);
  const [isPending, startTransition] = useTransition();
  const targetPath = action || pathname;
  const query = useMemo(() => searchParams.toString(), [searchParams]);

  useEffect(() => {
    if (value === month) return;
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams(query);
      params.set("mes", value);
      params.delete("page");
      startTransition(() => router.replace(`${targetPath}?${params.toString()}`));
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [month, query, router, targetPath, value]);

  return (
    <form
      className="month-filter"
      onSubmit={(event) => {
        event.preventDefault();
        const params = new URLSearchParams(query);
        params.set("mes", value);
        params.delete("page");
        startTransition(() => router.replace(`${targetPath}?${params.toString()}`));
      }}
    >
      <label>
        <span>Mês/Ano</span>
        <input name="mes" type="month" value={value} onChange={(event) => setValue(event.target.value)} />
      </label>
      <Button type="submit" disabled={isPending}>{isPending ? "Filtrando..." : "Filtrar mês"}</Button>
    </form>
  );
}
