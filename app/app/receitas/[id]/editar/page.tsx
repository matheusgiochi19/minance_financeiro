import { notFound } from "next/navigation";
import { updateReceita } from "@/app/app/receitas/actions";
import { ReceitaForm } from "@/components/receita-form";
import { getUserReceita } from "@/lib/income-cards";
import { listExpenseOptions } from "@/lib/expenses";

type EditarReceitaPageProps = { params: Promise<{ id: string }> };

export default async function EditarReceitaPage({ params }: EditarReceitaPageProps) {
  const { id } = await params;
  const [{ data: receita }, { categories, pockets }] = await Promise.all([getUserReceita(id), listExpenseOptions()]);
  if (!receita) notFound();
  return (
    <section className="expenses-page">
      <div className="page-heading"><p>Movimentação</p><h1>Editar receita</h1><span>Atualize os dados da receita selecionada.</span></div>
      <ReceitaForm action={updateReceita} categories={categories.data || []} defaultReceita={receita} pockets={pockets.data || []} />
    </section>
  );
}
