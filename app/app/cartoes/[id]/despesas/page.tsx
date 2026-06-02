import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCartaoDespesa } from "@/app/app/cartoes/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { MonthFilter } from "@/components/month-filter";
import { Pagination } from "@/components/pagination";
import { RecurrenceActionDialog, RecurrenceBadge } from "@/components/recurrence-action-dialog";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableWrap } from "@/components/ui/table";
import { formatCurrency, type ExpenseStatus } from "@/lib/expenses";
import { cardExpenseStatusLabels, getUserCartao, type CartaoDespesa } from "@/lib/income-cards";
import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/user-data";
import { getPeriodoMes } from "@/services/finance.service";

type CartaoDespesasPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mes?: string; page?: string }>;
};

const PAGE_SIZE = 20;

export default async function CartaoDespesasPage({ params, searchParams }: CartaoDespesasPageProps) {
  const { id } = await params;
  const filters = await searchParams;
  const periodo = getPeriodoMes(filters.mes);
  const page = Math.max(Number(filters.page || 1), 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const [{ data: cartao }, { user }] = await Promise.all([getUserCartao(id), requireAuthenticatedUser()]);
  if (!cartao) notFound();

  const supabase = await createClient();
  const { count, data: despesas, error } = await supabase
    .from("cartao_despesas")
    .select("id,cartao_id,descricao,valor,status,categoria_id,recurrence_group_id,user_id,data_competencia,categorias(nome)", { count: "exact" })
    .eq("cartao_id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .gte("data_competencia", periodo.inicio)
    .lt("data_competencia", periodo.fim)
    .order("data_competencia", { ascending: false })
    .range(from, to)
    .returns<CartaoDespesa[]>();

  const totalAberto = (despesas || []).reduce((total, despesa) => (despesa.status === "ab" ? total + Number(despesa.valor || 0) : total), 0);
  const totalParcial = (despesas || []).reduce((total, despesa) => (despesa.status === "p" ? total + Number(despesa.valor || 0) : total), 0);
  const totalPago = (despesas || []).reduce((total, despesa) => (despesa.status === "pp" ? total + Number(despesa.valor || 0) : total), 0);
  const totalFatura = totalAberto + totalParcial + totalPago;

  return (
    <section className="expenses-page">
      <div className="page-heading with-action">
        <div>
          <p>Fatura</p>
          <h1>{cartao.nome}</h1>
          <span>Despesas do cartao e fatura mensal calculada automaticamente.</span>
        </div>
        <Link className="primary-button" href={`/app/cartoes/${id}/despesas/nova`}>Nova despesa</Link>
      </div>
      <MonthFilter month={periodo.mes} />
      <div className="expense-summary-grid">
        <Card className="summary-card" tone="cards"><span>Total fatura mês</span><strong>{formatCurrency(totalFatura)}</strong></Card>
        <Card className="summary-card" tone="expense"><span>Itens abertos</span><strong>{formatCurrency(totalAberto)}</strong></Card>
        <Card className="summary-card" tone="muted"><span>Itens parciais</span><strong>{formatCurrency(totalParcial)}</strong></Card>
        <Card className="summary-card" tone="income"><span>Itens pagos</span><strong>{formatCurrency(totalPago)}</strong></Card>
      </div>
      {error ? <AlertBanner message={`Nao foi possivel carregar despesas do cartao: ${error.message}`} type="error" /> : null}
      <TableWrap>
        <Table className="expenses-table clean-expenses-table">
          <TableHead>
            <TableRow>
              <TableHeader>Situacao</TableHeader>
              <TableHeader>Data</TableHeader>
              <TableHeader>Descricao</TableHeader>
              <TableHeader>Categoria</TableHeader>
              <TableHeader>Valor</TableHeader>
              <TableHeader>Acoes</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {(despesas || []).length === 0 ? <TableRow><TableCell className="empty-cell" colSpan={6}>Nenhuma despesa neste cartao.</TableCell></TableRow> : null}
            {(despesas || []).map((despesa) => {
              const deleteFormId = `delete-cartao-despesa-${despesa.id}`;
              const recurring = Boolean(despesa.recurrence_group_id);
              return (
                <TableRow key={despesa.id}>
                  <TableCell><span className={`status-pill expense-status-${despesa.status as ExpenseStatus}`}>{cardExpenseStatusLabels[despesa.status]}</span></TableCell>
                  <TableCell>{new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(despesa.data_competencia))}</TableCell>
                  <TableCell>
                    <strong>{despesa.descricao}</strong>
                    {recurring ? <RecurrenceBadge /> : null}
                  </TableCell>
                  <TableCell>{despesa.categorias?.nome || "-"}</TableCell>
                  <TableCell>{formatCurrency(despesa.valor)}</TableCell>
                  <TableCell>
                    <div className="table-actions">
                      <Link className="table-link-button" href={`/app/cartoes/${id}/despesas/${despesa.id}/editar`}>Editar</Link>
                      {recurring ? (
                        <>
                          <form action={deleteCartaoDespesa} id={deleteFormId}>
                            <input name="id" type="hidden" value={despesa.id} />
                            <input name="cartao_id" type="hidden" value={id} />
                            <input name="recurrence_group_id" type="hidden" value={despesa.recurrence_group_id || ""} />
                          </form>
                          <RecurrenceActionDialog
                            allLabel="Excluir todos os lancamentos recorrentes"
                            description="Escolha se deseja excluir somente este lancamento ou todo o grupo recorrente."
                            formId={deleteFormId}
                            singleLabel="Excluir somente este lancamento"
                            title="Excluir lancamento recorrente"
                            variant="delete"
                          />
                        </>
                      ) : (
                        <form action={deleteCartaoDespesa}>
                          <input name="id" type="hidden" value={despesa.id} />
                          <input name="cartao_id" type="hidden" value={id} />
                          <ConfirmSubmitButton message={`Excluir a despesa "${despesa.descricao}"?`}>Excluir</ConfirmSubmitButton>
                        </form>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableWrap>
      <Pagination page={page} pageSize={PAGE_SIZE} total={count || 0} params={{ mes: periodo.mes }} />
    </section>
  );
}
