import Link from "next/link";
import { deleteReceita } from "@/app/app/receitas/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { FinancialFilters } from "@/components/financial-filters";
import { MonthFilter } from "@/components/month-filter";
import { Pagination } from "@/components/pagination";
import { RecurrenceActionDialog, RecurrenceBadge } from "@/components/recurrence-action-dialog";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableWrap } from "@/components/ui/table";
import { calcularTotalReceitas, getPeriodoMes } from "@/services/finance.service";
import { formatCurrency, listExpenseOptions } from "@/lib/expenses";
import type { Receita } from "@/lib/income-cards";
import { createClient } from "@/lib/supabase/server";

type ReceitasPageProps = {
  searchParams: Promise<{ bolso?: string; categoria?: string; mes?: string; page?: string; q?: string }>;
};

const PAGE_SIZE = 20;

export default async function ReceitasPage({ searchParams }: ReceitasPageProps) {
  const params = await searchParams;
  const { categories, pockets, user } = await listExpenseOptions();
  const supabase = await createClient();
  const periodo = getPeriodoMes(params.mes);
  const page = Math.max(Number(params.page || 1), 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("receitas")
    .select("id,descricao,valor,categoria_id,bolso_id,recurrence_group_id,data_competencia,categorias(nome),bolsos(nome)", { count: "exact" })
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .gte("data_competencia", periodo.inicio)
    .lt("data_competencia", periodo.fim)
    .order("data_competencia", { ascending: false })
    .range(from, to);

  if (params.q) query = query.ilike("descricao", `%${params.q}%`);
  if (params.categoria) query = query.eq("categoria_id", params.categoria);
  if (params.bolso) query = query.eq("bolso_id", params.bolso);

  const { count, data: receitas, error } = await query.returns<Receita[]>();
  const totalMes = await calcularTotalReceitas(user.id, periodo);

  return (
    <section className="expenses-page">
      <div className="page-heading with-action">
        <div>
          <p>Movimentação</p>
          <h1>Receitas</h1>
          <span>Cadastre, filtre e acompanhe as receitas do mês.</span>
        </div>
        <Link className="primary-button" href="/app/receitas/nova">Nova receita</Link>
      </div>
      <MonthFilter month={periodo.mes} />

      <div className="expense-summary-grid">
        <Card className="summary-card" tone="income"><span>Total mês</span><strong>{formatCurrency(totalMes)}</strong></Card>
        <Card className="summary-card" tone="muted"><span>Registros</span><strong>{count || 0}</strong></Card>
      </div>

      <Card className="expense-filters-card">
        <FinancialFilters categories={categories.data || []} pockets={pockets.data || []} />
      </Card>

      {error ? <p className="admin-alert">Não foi possível carregar receitas: {error.message}</p> : null}

      <TableWrap>
        <Table className="expenses-table clean-expenses-table">
          <TableHead>
            <TableRow>
              <TableHeader>Data</TableHeader>
              <TableHeader>Descrição</TableHeader>
              <TableHeader>Categoria</TableHeader>
              <TableHeader>Bolso</TableHeader>
              <TableHeader>Valor</TableHeader>
              <TableHeader>Ações</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {(receitas || []).length === 0 ? <TableRow><TableCell className="empty-cell" colSpan={6}>Nenhuma receita encontrada.</TableCell></TableRow> : null}
            {(receitas || []).map((receita) => {
              const deleteFormId = `delete-receita-${receita.id}`;
              const recurring = Boolean(receita.recurrence_group_id);
              return (
                <TableRow key={receita.id}>
                  <TableCell>{new Intl.DateTimeFormat("pt-BR").format(new Date(`${receita.data_competencia}T00:00:00`))}</TableCell>
                  <TableCell>
                    <strong>{receita.descricao}</strong>
                    {recurring ? <RecurrenceBadge /> : null}
                  </TableCell>
                  <TableCell>{receita.categorias?.nome || "-"}</TableCell>
                  <TableCell>{receita.bolsos?.nome || "-"}</TableCell>
                  <TableCell>{formatCurrency(receita.valor)}</TableCell>
                  <TableCell>
                    <div className="table-actions">
                      <Link className="table-link-button" href={`/app/receitas/${receita.id}/editar`}>Editar</Link>
                      {recurring ? (
                        <>
                          <form action={deleteReceita} id={deleteFormId}>
                            <input name="id" type="hidden" value={receita.id} />
                            <input name="recurrence_group_id" type="hidden" value={receita.recurrence_group_id || ""} />
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
                        <form action={deleteReceita}>
                          <input name="id" type="hidden" value={receita.id} />
                          <ConfirmSubmitButton message={`Excluir a receita "${receita.descricao}"?`}>Excluir</ConfirmSubmitButton>
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
      <Pagination page={page} pageSize={PAGE_SIZE} total={count || 0} params={{ bolso: params.bolso, categoria: params.categoria, mes: periodo.mes, q: params.q }} />
    </section>
  );
}
