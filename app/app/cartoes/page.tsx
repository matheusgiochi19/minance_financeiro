import Link from "next/link";
import { deleteCartao } from "@/app/app/cartoes/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { formatCurrency } from "@/lib/expenses";
import { getCurrentInvoiceTotal, type Cartao } from "@/lib/income-cards";
import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/user-data";

export default async function CartoesPage() {
  const { user } = await requireAuthenticatedUser();
  const supabase = await createClient();
  const { data: cartoes, error } = await supabase.from("cartoes").select("id,nome,limite,cor,user_id,created_at,updated_at").eq("user_id", user.id).order("created_at", { ascending: false }).returns<Cartao[]>();
  const invoicePairs = await Promise.all((cartoes || []).map(async (cartao) => [cartao.id, await getCurrentInvoiceTotal(cartao.id)] as const));
  const invoiceTotals = new Map(invoicePairs);

  return (
    <section className="cards-page">
      <div className="page-heading with-action">
        <div><p>Crédito</p><h1>Cartões</h1><span>Visualize cartões, limites e faturas mensais.</span></div>
        <Link className="primary-button" href="/app/cartoes/novo">Novo cartão</Link>
      </div>
      {error ? <p className="admin-alert">Não foi possível carregar cartões: {error.message}</p> : null}
      <div className="bank-card-grid">
        {(cartoes || []).length === 0 ? <p className="admin-alert">Nenhum cartão cadastrado ainda.</p> : null}
        {(cartoes || []).map((cartao) => (
          <article className="bank-card" key={cartao.id} style={{ background: cartao.cor }}>
            <div className="bank-card-top"><span>Minance Card</span><strong>{cartao.nome}</strong></div>
            <div className="bank-card-number">•••• •••• •••• {cartao.id.slice(0, 4).toUpperCase()}</div>
            <div className="bank-card-values">
              <span>Fatura mês <strong>{formatCurrency(invoiceTotals.get(cartao.id) || 0)}</strong></span>
              <span>Limite <strong>{cartao.limite ? formatCurrency(cartao.limite) : "-"}</strong></span>
            </div>
            <div className="bank-card-actions">
              <Link href={`/app/cartoes/${cartao.id}/despesas`}>Despesas</Link>
              <Link href={`/app/cartoes/${cartao.id}/editar`}>Editar</Link>
              <form action={deleteCartao}><input name="id" type="hidden" value={cartao.id} /><ConfirmSubmitButton message={`Excluir o cartão "${cartao.nome}"?`}>Excluir</ConfirmSubmitButton></form>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
