import Link from "next/link";
import { deleteCartao } from "@/app/app/cartoes/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { MonthFilter } from "@/components/month-filter";
import { Pagination } from "@/components/pagination";
import { formatCurrency } from "@/lib/expenses";
import type { Cartao, CartaoDespesa } from "@/lib/income-cards";
import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/user-data";
import { getPeriodoMes } from "@/services/finance.service";

type CartoesPageProps = { searchParams: Promise<{ mes?: string; page?: string }> };

const PAGE_SIZE = 12;

export default async function CartoesPage({ searchParams }: CartoesPageProps) {
  const params = await searchParams;
  const periodo = getPeriodoMes(params.mes);
  const page = Math.max(Number(params.page || 1), 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { user } = await requireAuthenticatedUser();
  const supabase = await createClient();
  const { count, data: cartoes, error } = await supabase
    .from("cartoes")
    .select("id,nome,limite,cor", { count: "exact" })
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to)
    .returns<Cartao[]>();
  const invoicePairs = await Promise.all(
    (cartoes || []).map(async (cartao) => {
      const { data } = await supabase.from("cartao_despesas").select("valor,status").eq("user_id", user.id).eq("cartao_id", cartao.id).is("deleted_at", null).gte("data_competencia", periodo.inicio).lt("data_competencia", periodo.fim).returns<Array<Pick<CartaoDespesa, "status" | "valor">>>();
      return [cartao.id, (data || []).reduce((total, item) => (item.status === "pp" ? total : total + Number(item.valor || 0)), 0)] as const;
    })
  );
  const invoiceTotals = new Map(invoicePairs);

  return (
    <section className="cards-page">
      <div className="page-heading with-action">
        <div><p>Crédito</p><h1>Cartões</h1><span>Visualize cartões, limites e faturas mensais.</span></div>
        <Link className="primary-button" href="/app/cartoes/novo">Novo cartão</Link>
      </div>
      <MonthFilter month={periodo.mes} />
      {error ? <p className="admin-alert">Não foi possível carregar cartões: {error.message}</p> : null}
      <div className="bank-card-grid">
        {(cartoes || []).length === 0 ? <p className="admin-alert">Nenhum cartão cadastrado ainda.</p> : null}
        {(cartoes || []).map((cartao) => (
          <article className="bank-card" key={cartao.id} style={{ background: cartao.cor }}>
            <div className="bank-card-top"><span>Minance Card</span><strong>{cartao.nome}</strong></div>
            <div className="bank-card-number">**** **** **** {cartao.id.slice(0, 4).toUpperCase()}</div>
            <div className="bank-card-values">
              <span>Fatura mês <strong>{formatCurrency(invoiceTotals.get(cartao.id) || 0)}</strong></span>
              <span>Limite <strong>{cartao.limite ? formatCurrency(cartao.limite) : "-"}</strong></span>
            </div>
            <div className="bank-card-actions">
              <Link href={`/app/cartoes/${cartao.id}/despesas?mes=${periodo.mes}`}>Despesas</Link>
              <Link href={`/app/cartoes/${cartao.id}/editar`}>Editar</Link>
              <form action={deleteCartao}><input name="id" type="hidden" value={cartao.id} /><ConfirmSubmitButton message={`Excluir o cartão "${cartao.nome}"?`}>Excluir</ConfirmSubmitButton></form>
            </div>
          </article>
        ))}
      </div>
      <Pagination page={page} pageSize={PAGE_SIZE} total={count || 0} params={{ mes: periodo.mes }} />
    </section>
  );
}
