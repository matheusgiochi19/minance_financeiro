import Link from "next/link";
import { deleteDespesa, markDespesaAsPaid } from "@/app/app/despesas/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { FinancialFilters } from "@/components/financial-filters";
import { MonthFilter } from "@/components/month-filter";
import { Pagination } from "@/components/pagination";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableWrap } from "@/components/ui/table";
import { calcularTotalDespesas, getPeriodoMes } from "@/services/finance.service";
import { expenseStatusLabels, formatCurrency, getExpenseAttachmentUrl, listExpenseOptions, type Expense, type ExpenseStatus } from "@/lib/expenses";
import { createClient } from "@/lib/supabase/server";

type DespesasPageProps = {
  searchParams: Promise<{
    bolso?: string;
    categoria?: string;
    mes?: string;
    page?: string;
    q?: string;
    status?: ExpenseStatus | "";
  }>;
};

const PAGE_SIZE = 20;

export default async function DespesasPage({ searchParams }: DespesasPageProps) {
  const params = await searchParams;
  const { categories, pockets, user } = await listExpenseOptions();
  const supabase = await createClient();
  const periodo = getPeriodoMes(params.mes);
  const page = Math.max(Number(params.page || 1), 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("despesas")
    .select("id,descricao,valor,status,categoria_id,bolso_id,anexo_path,anexo_nome,data_competencia,categorias(nome),bolsos(nome)", { count: "exact" })
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .gte("data_competencia", periodo.inicio)
    .lt("data_competencia", periodo.fim)
    .order("data_competencia", { ascending: false })
    .range(from, to);

  if (params.q) query = query.ilike("descricao", `%${params.q}%`);
  if (params.status) query = query.eq("status", params.status);
  if (params.categoria) query = query.eq("categoria_id", params.categoria);
  if (params.bolso) query = query.eq("bolso_id", params.bolso);

  const { count, data: expenses, error } = await query.returns<Expense[]>();
  const totalMes = await calcularTotalDespesas(user.id, periodo);
  const { data: monthExpenses } = await supabase.from("despesas").select("valor,status").eq("user_id", user.id).is("deleted_at", null).gte("data_competencia", periodo.inicio).lt("data_competencia", periodo.fim).returns<Array<{ valor: number; status: ExpenseStatus }>>();
  const totals = (monthExpenses || []).reduce(
    (acc, expense) => {
      const value = Number(expense.valor || 0);
      if (expense.status === "pp") acc.paid += value;
      else acc.pending += value;
      return acc;
    },
    { paid: 0, pending: 0, total: totalMes }
  );

  const attachments = await Promise.all((expenses || []).map(async (expense) => [expense.id, await getExpenseAttachmentUrl(expense.anexo_path)] as const));
  const attachmentUrls = new Map(attachments);

  return (
    <section className="expenses-page">
      <div className="page-heading with-action">
        <div>
          <p>Movimentação</p>
          <h1>Despesas</h1>
          <span>Cadastre, filtre e acompanhe as despesas do mês.</span>
        </div>
        <Link className="primary-button" href="/app/despesas/nova">Nova despesa</Link>
      </div>
      <MonthFilter month={periodo.mes} />

      <div className="expense-summary-grid">
        <Card className="summary-card" tone="expense"><span>Pendentes</span><strong>{formatCurrency(totals.pending)}</strong></Card>
        <Card className="summary-card" tone="income"><span>Pagas</span><strong>{formatCurrency(totals.paid)}</strong></Card>
        <Card className="summary-card" tone="cards"><span>Total mês</span><strong>{formatCurrency(totals.total)}</strong></Card>
      </div>

      <Card className="expense-filters-card">
        <FinancialFilters categories={categories.data || []} pockets={pockets.data || []} showStatus status={params.status || ""} />
      </Card>

      {error ? <p className="admin-alert">Não foi possível carregar despesas: {error.message}</p> : null}

      <TableWrap>
        <Table className="expenses-table clean-expenses-table">
          <TableHead>
            <TableRow>
              <TableHeader>Situação</TableHeader>
              <TableHeader>Data</TableHeader>
              <TableHeader>Descrição</TableHeader>
              <TableHeader>Categoria</TableHeader>
              <TableHeader>Bolso</TableHeader>
              <TableHeader>Valor</TableHeader>
              <TableHeader>Anexo</TableHeader>
              <TableHeader>Ações</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {(expenses || []).length === 0 ? <TableRow><TableCell className="empty-cell" colSpan={8}>Nenhuma despesa encontrada.</TableCell></TableRow> : null}
            {(expenses || []).map((expense) => {
              const attachmentUrl = attachmentUrls.get(expense.id);
              return (
                <TableRow key={expense.id}>
                  <TableCell><span className={`status-pill expense-status-${expense.status}`}>{expenseStatusLabels[expense.status]}</span></TableCell>
                  <TableCell>{new Intl.DateTimeFormat("pt-BR").format(new Date(`${expense.data_competencia}T00:00:00`))}</TableCell>
                  <TableCell><strong>{expense.descricao}</strong></TableCell>
                  <TableCell>{expense.categorias?.nome || "-"}</TableCell>
                  <TableCell>{expense.bolsos?.nome || "-"}</TableCell>
                  <TableCell>{formatCurrency(expense.valor)}</TableCell>
                  <TableCell>{attachmentUrl ? <a className="attachment-link" href={attachmentUrl} rel="noreferrer" target="_blank">{expense.anexo_nome || "Abrir"}</a> : "-"}</TableCell>
                  <TableCell>
                    <div className="table-actions">
                      <Link className="table-link-button" href={`/app/despesas/${expense.id}/editar`}>Editar</Link>
                      <form action={markDespesaAsPaid}>
                        <input name="id" type="hidden" value={expense.id} />
                        <Button disabled={expense.status === "pp"} size="sm" type="submit" variant="secondary">Pago</Button>
                      </form>
                      <form action={deleteDespesa}>
                        <input name="id" type="hidden" value={expense.id} />
                        <input name="anexo_path" type="hidden" value={expense.anexo_path || ""} />
                        <ConfirmSubmitButton message={`Excluir a despesa "${expense.descricao}"?`}>Excluir</ConfirmSubmitButton>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableWrap>
      <Pagination page={page} pageSize={PAGE_SIZE} total={count || 0} params={{ bolso: params.bolso, categoria: params.categoria, mes: periodo.mes, q: params.q, status: params.status }} />
    </section>
  );
}
