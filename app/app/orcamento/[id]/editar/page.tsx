import { notFound } from "next/navigation";
import { updateOrcamento } from "@/app/app/orcamento/actions";
import { OrcamentoForm } from "@/components/orcamento-form";
import { getUserOrcamento } from "@/lib/budgets";
import { listExpenseOptions } from "@/lib/expenses";

type EditarOrcamentoPageProps = { params: Promise<{ id: string }> };

export default async function EditarOrcamentoPage({ params }: EditarOrcamentoPageProps) {
  const { id } = await params;
  const [{ data: orcamento }, { categories }] = await Promise.all([getUserOrcamento(id), listExpenseOptions()]);
  if (!orcamento) notFound();
  return (
    <section className="records-page">
      <div className="page-heading"><p>Planejamento</p><h1>Editar orçamento</h1><span>Atualize a regra da categoria selecionada.</span></div>
      <OrcamentoForm action={updateOrcamento} categories={categories.data || []} defaultOrcamento={orcamento} />
    </section>
  );
}
