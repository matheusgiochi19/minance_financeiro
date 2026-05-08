import Link from "next/link";
import { deleteReceita } from "@/app/app/receitas/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableWrap } from "@/components/ui/table";
import { formatCurrency, listExpenseOptions } from "@/lib/expenses";
import type { Receita } from "@/lib/income-cards";
import { createClient } from "@/lib/supabase/server";
import { MonthFilter } from "@/components/month-filter";
import { calcularTotalReceitas, getPeriodoMes } from "@/services/finance.service";

type ReceitasPageProps = {
  searchParams: Promise<{ bolso?: string; categoria?: string; mes?: string; q?: string }>;
};

export default async function ReceitasPage({ searchParams }: ReceitasPageProps) {
  const params = await searchParams;
  const { categories, pockets, user } = await listExpenseOptions();
  const supabase = await createClient();
  const periodo = getPeriodoMes(params.mes);
  let query = supabase
    .from("receitas")
    .select("id,descricao,valor,categoria_id,bolso_id,user_id,data_competencia,created_at,updated_at,categorias(nome),bolsos(nome)")
    .eq("user_id", user.id)
    .gte("data_competencia", periodo.inicio)
    .lt("data_competencia", periodo.fim)
    .order("data_competencia", { ascending: false });

  if (params.q) query = query.ilike("descricao", `%${params.q}%`);
  if (params.categoria) query = query.eq("categoria_id", params.categoria);
  if (params.bolso) query = query.eq("bolso_id", params.bolso);

  const { data: receitas, error } = await query.returns<Receita[]>();
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
        <Card className="summary-card" tone="income">
          <span>Total mês</span>
          <strong>{formatCurrency(totalMes)}</strong>
        </Card>
        <Card className="summary-card" tone="muted">
          <span>Registros</span>
          <strong>{receitas?.length || 0}</strong>
        </Card>
      </div>

      <Card className="expense-filters-card">
        <form className="expense-filters">
          <label><span>Busca</span><input defaultValue={params.q || ""} name="q" placeholder="Buscar descrição" /></label>
          <label><span>Categoria</span><select defaultValue={params.categoria || ""} name="categoria"><option value="">Todas</option>{(categories.data || []).map((category) => <option key={category.id} value={category.id}>{category.nome}</option>)}</select></label>
          <label><span>Bolso</span><select defaultValue={params.bolso || ""} name="bolso"><option value="">Todos</option>{(pockets.data || []).map((pocket) => <option key={pocket.id} value={pocket.id}>{pocket.nome}</option>)}</select></label>
          <Button type="submit">Filtrar</Button>
        </form>
      </Card>

      {error ? <p className="admin-alert">Não foi possível carregar receitas: {error.message}</p> : null}

      <TableWrap>
        <Table className="expenses-table clean-expenses-table">
          <TableHead><TableRow><TableHeader>Data</TableHeader><TableHeader>Descrição</TableHeader><TableHeader>Categoria</TableHeader><TableHeader>Bolso</TableHeader><TableHeader>Valor</TableHeader><TableHeader>Ações</TableHeader></TableRow></TableHead>
          <TableBody>
            {(receitas || []).length === 0 ? <TableRow><TableCell className="empty-cell" colSpan={6}>Nenhuma receita encontrada.</TableCell></TableRow> : null}
            {(receitas || []).map((receita) => (
              <TableRow key={receita.id}>
                <TableCell>{new Intl.DateTimeFormat("pt-BR").format(new Date(`${receita.data_competencia}T00:00:00`))}</TableCell>
                <TableCell><strong>{receita.descricao}</strong></TableCell>
                <TableCell>{receita.categorias?.nome || "-"}</TableCell>
                <TableCell>{receita.bolsos?.nome || "-"}</TableCell>
                <TableCell>{formatCurrency(receita.valor)}</TableCell>
                <TableCell><div className="table-actions"><Link className="table-link-button" href={`/app/receitas/${receita.id}/editar`}>Editar</Link><form action={deleteReceita}><input name="id" type="hidden" value={receita.id} /><ConfirmSubmitButton message={`Excluir a receita "${receita.descricao}"?`}>Excluir</ConfirmSubmitButton></form></div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrap>
    </section>
  );
}
