import { notFound } from "next/navigation";
import { updateDespesa } from "@/app/app/despesas/actions";
import { ExpenseForm } from "@/components/expense-form";
import { getUserExpense, listExpenseOptions } from "@/lib/expenses";

type EditarDespesaPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditarDespesaPage({ params }: EditarDespesaPageProps) {
  const { id } = await params;
  const [{ data: expense }, { categories, pockets }] = await Promise.all([
    getUserExpense(id),
    listExpenseOptions()
  ]);

  if (!expense) {
    notFound();
  }

  return (
    <section className="expenses-page">
      <div className="page-heading">
        <p>Movimentação</p>
        <h1>Editar despesa</h1>
        <span>Atualize os dados da despesa selecionada.</span>
      </div>
      <ExpenseForm action={updateDespesa} categories={categories.data || []} defaultExpense={expense} pockets={pockets.data || []} title="Dados da despesa" />
    </section>
  );
}
