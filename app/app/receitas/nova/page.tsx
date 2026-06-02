import { createReceita } from "@/app/app/receitas/actions";
import { ReceitaForm } from "@/components/receita-form";
import { listExpenseOptions } from "@/lib/expenses";

export default async function NovaReceitaPage() {
  const { categories, pockets } = await listExpenseOptions();
  return (
    <section className="expenses-page">
      <div className="page-heading"><p>Movimentação</p><h1>Nova receita</h1><span>Cadastre uma entrada associada a categoria e bolso.</span></div>
      <ReceitaForm action={createReceita} categories={categories.data || []} pockets={pockets.data || []} />
    </section>
  );
}
