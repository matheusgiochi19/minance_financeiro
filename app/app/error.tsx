"use client";

import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <section className="error-state">
      <p>Não foi possível carregar esta tela.</p>
      <h1>Algo saiu do trilho</h1>
      <span>{error.message || "Tente novamente em alguns instantes."}</span>
      <Button type="button" onClick={reset}>Tentar novamente</Button>
    </section>
  );
}
