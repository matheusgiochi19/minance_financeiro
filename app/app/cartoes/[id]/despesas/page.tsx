import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCartaoDespesa } from "@/app/app/cartoes/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { MonthFilter } from "@/components/month-filter";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableWrap } from "@/components/ui/table";
import { expenseStatusLabels, formatCurrency, type ExpenseStatus } from "@/lib/expenses";
import { getUserCartao, type CartaoDespesa } from "@/lib/income-cards";
import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/user-data";
import { getPeriodoMes } from "@/services/finance.service";

type CartaoDespesasPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mes?: string }>;
};

export default async function CartaoDespesasPage({ params, searchParams }: CartaoDespesasPageProps) {
  const { id } = await params;
  const filters = await searchParams;
  const periodo = getPeriodoMes(filters.mes);
  const [{ data: cartao }, { user }] = await Promise.all([getUserCartao(id), requireAuthenticatedUser()]);
  if (!cartao) notFound();

  const supabase = await createClient();
  const { data: despesas, error } = await supabase
    .from("cartao_despesas")
    .select("id,cartao_id,descricao,valor,status,categoria_id,user_id,data_competencia,created_at,updated_at,categorias(nome)")
    .eq("cartao_id", id)
    .eq("user_id", user.id)
    .gte("data_competencia", periodo.inicio)
    .lt("data_competencia", periodo.fim)
    .order("data_competencia", { ascending: false })
    .returns<CartaoDespesa[]>();

  const totalFatura = (despesas || []).reduce((total, despesa) => total + Number(despesa.valor || 0), 0);

  return (
    <section className="expenses-page">
      <div className="page-heading with-action">
        <div>
          <p>Fatura</p>
          <h1>{cartao.nome}</h1>
          <span>Despesas do cartão e fatura mensal calculada automaticamente.</span>
        </div>
        <Link className="primary-button" href={`/app/cartoes/${id}/despesas/nova`}>Nova despesa</Link>
      </div>
      <MonthFilter month={periodo.mes} />
      <div className="expense-summary-grid">
        <Card className="summary-card" tone="cards"><span>Fatura mês</span><strong>{formatCurrency(totalFatura)}</strong></Card>
      </div>
      {error ? <p className="admin-alert">Não foi possível carregar despesas do cartão: {error.message}</p> : null}
      <TableWrap>
        <Table className="expenses-table clean-expenses-table">
          <TableHead>
            <TableRow>
              <TableHeader>Situação</TableHeader>
              <TableHeader>Data</TableHeader>
              <TableHeader>Descrição</TableHeader>
              <TableHeader>Categoria</TableHeader>
              <TableHeader>Valor</TableHeader>
              <TableHeader>Ações</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {(despesas || []).length === 0 ? <TableRow><TableCell className="empty-cell" colSpan={6}>Nenhuma despesa neste cartão.</TableCell></TableRow> : null}
            {(despesas || []).map((despesa) => (
              <TableRow key={despesa.id}>
                <TableCell><span className={`status-pill expense-status-${despesa.status as ExpenseStatus}`}>{expenseStatusLabels[despesa.status]}</span></TableCell>
                <TableCell>{new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(despesa.data_competencia))}</TableCell>
                <TableCell><strong>{despesa.descricao}</strong></TableCell>
                <TableCell>{despesa.categorias?.nome || "-"}</TableCell>
                <TableCell>{formatCurrency(despesa.valor)}</TableCell>
                <TableCell>
                  <div className="table-actions">
                    <Link className="table-link-button" href={`/app/cartoes/${id}/despesas/${despesa.id}/editar`}>Editar</Link>
                    <form action={deleteCartaoDespesa}>
                      <input name="id" type="hidden" value={despesa.id} />
                      <input name="cartao_id" type="hidden" value={id} />
                      <ConfirmSubmitButton message={`Excluir a despesa "${despesa.descricao}"?`}>Excluir</ConfirmSubmitButton>
                    </form>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrap>
    </section>
  );
}
