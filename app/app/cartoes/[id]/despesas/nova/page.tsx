import { notFound } from "next/navigation";
import { createCartaoDespesa } from "@/app/app/cartoes/actions";
import { CartaoDespesaForm } from "@/components/cartao-despesa-form";
import { getUserCartao } from "@/lib/income-cards";
import { listExpenseOptions } from "@/lib/expenses";

type NovaCartaoDespesaPageProps = { params: Promise<{ id: string }> };

export default async function NovaCartaoDespesaPage({ params }: NovaCartaoDespesaPageProps) {
  const { id } = await params;
  const [{ data: cartao }, { categories }] = await Promise.all([getUserCartao(id), listExpenseOptions()]);
  if (!cartao) notFound();
  return (
    <section className="expenses-page">
      <div className="page-heading"><p>Fatura</p><h1>Nova despesa do cartão</h1><span>Lance uma despesa que irá compor a fatura mensal de {cartao.nome}.</span></div>
      <CartaoDespesaForm action={createCartaoDespesa} cartaoId={id} categories={categories.data || []} />
    </section>
  );
}
