import { notFound } from "next/navigation";
import { updateCartao } from "@/app/app/cartoes/actions";
import { CartaoForm } from "@/components/cartao-form";
import { getUserCartao } from "@/lib/income-cards";

type EditarCartaoPageProps = { params: Promise<{ id: string }> };

export default async function EditarCartaoPage({ params }: EditarCartaoPageProps) {
  const { id } = await params;
  const { data: cartao } = await getUserCartao(id);
  if (!cartao) notFound();
  return (
    <section className="cards-page">
      <div className="page-heading"><p>Crédito</p><h1>Editar cartão</h1><span>Atualize nome e limite do cartão.</span></div>
      <CartaoForm action={updateCartao} defaultCartao={cartao} />
    </section>
  );
}
