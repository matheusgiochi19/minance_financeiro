import { createDespesa } from "@/app/app/despesas/actions";
import { ExpenseForm } from "@/components/expense-form";
import { listExpenseOptions } from "@/lib/expenses";

export default async function NovaDespesaPage() {
  const { categories, pockets } = await listExpenseOptions();

  return (
    <section className="expenses-page">
      <div className="page-heading">
        <p>Movimentação</p>
        <h1>Nova despesa</h1>
        <span>Cadastre uma despesa com categoria, bolso, status e anexo opcional.</span>
      </div>
      <ExpenseForm action={createDespesa} categories={categories.data || []} pockets={pockets.data || []} title="Dados da despesa" />
    </section>
  );
}
