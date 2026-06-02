import { createOrcamento } from "@/app/app/orcamento/actions";
import { OrcamentoForm } from "@/components/orcamento-form";
import { listExpenseOptions } from "@/lib/expenses";

export default async function NovoOrcamentoPage() {
  const { categories } = await listExpenseOptions();
  return (
    <section className="records-page">
      <div className="page-heading"><p>Planejamento</p><h1>Novo orçamento</h1><span>Defina um limite por categoria usando percentual da renda.</span></div>
      <OrcamentoForm action={createOrcamento} categories={categories.data || []} />
    </section>
  );
}
