import { notFound } from "next/navigation";
import { updateCartaoDespesa } from "@/app/app/cartoes/actions";
import { CartaoDespesaForm } from "@/components/cartao-despesa-form";
import { getUserCartao, getUserCartaoDespesa } from "@/lib/income-cards";
import { listExpenseOptions } from "@/lib/expenses";

type EditarCartaoDespesaPageProps = { params: Promise<{ despesaId: string; id: string }> };

export default async function EditarCartaoDespesaPage({ params }: EditarCartaoDespesaPageProps) {
  const { despesaId, id } = await params;
  const [{ data: cartao }, { data: despesa }, { categories }] = await Promise.all([getUserCartao(id), getUserCartaoDespesa(id, despesaId), listExpenseOptions()]);
  if (!cartao || !despesa) notFound();
  return (
    <section className="expenses-page">
      <div className="page-heading"><p>Fatura</p><h1>Editar despesa do cartão</h1><span>Atualize o lançamento da fatura de {cartao.nome}.</span></div>
      <CartaoDespesaForm action={updateCartaoDespesa} cartaoId={id} categories={categories.data || []} defaultDespesa={despesa} />
    </section>
  );
}
