import { createDespesa, deleteDespesa, markDespesaAsPaid, updateDespesa } from "@/app/app/despesas/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableWrap } from "@/components/ui/table";
import { expenseStatusLabels, formatCurrency, getExpenseAttachmentUrl, listExpenseOptions, type Expense, type ExpenseStatus } from "@/lib/expenses";
import { createClient } from "@/lib/supabase/server";

type DespesasPageProps = {
  searchParams: Promise<{
    bolso?: string;
    categoria?: string;
    q?: string;
    status?: ExpenseStatus | "";
  }>;
};

const statusOptions: Array<{ label: string; value: ExpenseStatus }> = [
  { label: "Pendente", value: "p" },
  { label: "Paga", value: "pp" },
  { label: "Aberta", value: "ab" }
];

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return { end: end.toISOString(), start: start.toISOString() };
}

export default async function DespesasPage({ searchParams }: DespesasPageProps) {
  const params = await searchParams;
  const { categories, pockets, user } = await listExpenseOptions();
  const supabase = await createClient();

  let query = supabase
    .from("despesas")
    .select("id,descricao,valor,status,categoria_id,bolso_id,user_id,anexo_path,anexo_nome,created_at,updated_at,categorias(nome),bolsos(nome)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (params.q) {
    query = query.ilike("descricao", `%${params.q}%`);
  }

  if (params.status) {
    query = query.eq("status", params.status);
  }

  if (params.categoria) {
    query = query.eq("categoria_id", params.categoria);
  }

  if (params.bolso) {
    query = query.eq("bolso_id", params.bolso);
  }

  const { data: expenses, error } = await query.returns<Expense[]>();
  const { start, end } = getMonthRange();
  const { data: monthExpenses } = await supabase
    .from("despesas")
    .select("valor,status")
    .eq("user_id", user.id)
    .gte("created_at", start)
    .lt("created_at", end)
    .returns<Array<{ valor: number; status: ExpenseStatus }>>();

  const totals = (monthExpenses || []).reduce(
    (acc, expense) => {
      const value = Number(expense.valor || 0);
      acc.total += value;
      if (expense.status === "pp") {
        acc.paid += value;
      } else {
        acc.pending += value;
      }
      return acc;
    },
    { paid: 0, pending: 0, total: 0 }
  );

  const attachments = await Promise.all(
    (expenses || []).map(async (expense) => [expense.id, await getExpenseAttachmentUrl(expense.anexo_path)] as const)
  );
  const attachmentUrls = new Map(attachments);

  return (
    <section className="expenses-page">
      <div className="page-heading">
        <p>Movimentação</p>
        <h1>Despesas</h1>
        <span>Cadastre, filtre e acompanhe as despesas do mês.</span>
      </div>

      <div className="expense-summary-grid">
        <Card className="summary-card" tone="expense">
          <span>Pendentes</span>
          <strong>{formatCurrency(totals.pending)}</strong>
        </Card>
        <Card className="summary-card" tone="income">
          <span>Pagas</span>
          <strong>{formatCurrency(totals.paid)}</strong>
        </Card>
        <Card className="summary-card" tone="cards">
          <span>Total mês</span>
          <strong>{formatCurrency(totals.total)}</strong>
        </Card>
      </div>

      <Card className="record-form-card expense-form-card">
        <h2>Nova despesa</h2>
        <form action={createDespesa} className="expense-form" encType="multipart/form-data">
          <label>
            <span>Descrição</span>
            <input maxLength={120} name="descricao" placeholder="Ex.: Aluguel" required />
          </label>
          <label>
            <span>Valor</span>
            <input inputMode="decimal" name="valor" placeholder="0,00" required />
          </label>
          <label>
            <span>Status</span>
            <select defaultValue="p" name="status">
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Categoria</span>
            <select name="categoria_id">
              <option value="">Sem categoria</option>
              {(categories.data || []).map((category) => (
                <option key={category.id} value={category.id}>{category.nome}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Bolso</span>
            <select name="bolso_id">
              <option value="">Sem bolso</option>
              {(pockets.data || []).map((pocket) => (
                <option key={pocket.id} value={pocket.id}>{pocket.nome}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Anexo</span>
            <input name="anexo" type="file" />
          </label>
          <Button type="submit">Adicionar</Button>
        </form>
      </Card>

      <Card className="expense-filters-card">
        <form className="expense-filters">
          <label>
            <span>Busca</span>
            <input defaultValue={params.q || ""} name="q" placeholder="Buscar descrição" />
          </label>
          <label>
            <span>Status</span>
            <select defaultValue={params.status || ""} name="status">
              <option value="">Todos</option>
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Categoria</span>
            <select defaultValue={params.categoria || ""} name="categoria">
              <option value="">Todas</option>
              {(categories.data || []).map((category) => (
                <option key={category.id} value={category.id}>{category.nome}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Bolso</span>
            <select defaultValue={params.bolso || ""} name="bolso">
              <option value="">Todos</option>
              {(pockets.data || []).map((pocket) => (
                <option key={pocket.id} value={pocket.id}>{pocket.nome}</option>
              ))}
            </select>
          </label>
          <Button type="submit">Filtrar</Button>
        </form>
      </Card>

      {error ? <p className="admin-alert">Não foi possível carregar despesas: {error.message}</p> : null}

      <TableWrap>
        <Table className="expenses-table">
          <TableHead>
            <TableRow>
              <TableHeader>Despesa</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Categoria</TableHeader>
              <TableHeader>Bolso</TableHeader>
              <TableHeader>Valor</TableHeader>
              <TableHeader>Anexo</TableHeader>
              <TableHeader>Ações</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {(expenses || []).length === 0 ? (
              <TableRow>
                <TableCell className="empty-cell" colSpan={7}>Nenhuma despesa encontrada.</TableCell>
              </TableRow>
            ) : null}
            {(expenses || []).map((expense) => {
              const attachmentUrl = attachmentUrls.get(expense.id);
              return (
                <TableRow key={expense.id}>
                  <TableCell>
                    <form action={updateDespesa} className="expense-row-form" encType="multipart/form-data">
                      <input name="id" type="hidden" value={expense.id} />
                      <input defaultValue={expense.descricao} maxLength={120} name="descricao" required />
                      <input defaultValue={String(expense.valor).replace(".", ",")} inputMode="decimal" name="valor" required />
                      <select defaultValue={expense.status} name="status">
                        {statusOptions.map((status) => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </select>
                      <select defaultValue={expense.categoria_id || ""} name="categoria_id">
                        <option value="">Sem categoria</option>
                        {(categories.data || []).map((category) => (
                          <option key={category.id} value={category.id}>{category.nome}</option>
                        ))}
                      </select>
                      <select defaultValue={expense.bolso_id || ""} name="bolso_id">
                        <option value="">Sem bolso</option>
                        {(pockets.data || []).map((pocket) => (
                          <option key={pocket.id} value={pocket.id}>{pocket.nome}</option>
                        ))}
                      </select>
                      <input name="anexo" type="file" />
                      <Button size="sm" type="submit">Salvar</Button>
                    </form>
                  </TableCell>
                  <TableCell><span className={`status-pill expense-status-${expense.status}`}>{expenseStatusLabels[expense.status]}</span></TableCell>
                  <TableCell>{expense.categorias?.nome || "-"}</TableCell>
                  <TableCell>{expense.bolsos?.nome || "-"}</TableCell>
                  <TableCell>{formatCurrency(expense.valor)}</TableCell>
                  <TableCell>
                    {attachmentUrl ? <a className="attachment-link" href={attachmentUrl} rel="noreferrer" target="_blank">{expense.anexo_nome || "Abrir"}</a> : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="table-actions">
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
    </section>
  );
}
