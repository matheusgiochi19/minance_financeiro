import { createCartao } from "@/app/app/cartoes/actions";
import { CartaoForm } from "@/components/cartao-form";

export default function NovoCartaoPage() {
  return (
    <section className="cards-page">
      <div className="page-heading"><p>Crédito</p><h1>Novo cartão</h1><span>Crie um cartão com cor automática e limite opcional.</span></div>
      <CartaoForm action={createCartao} />
    </section>
  );
}
