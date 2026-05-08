import Link from "next/link";
import { deleteOrcamento } from "@/app/app/orcamento/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { MonthFilter } from "@/components/month-filter";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableWrap } from "@/components/ui/table";
import type { Orcamento } from "@/lib/budgets";
import { formatCurrency } from "@/lib/expenses";
import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/user-data";
import { getPeriodoMes } from "@/services/finance.service";

type OrcamentoPageProps = {
  searchParams: Promise<{ mes?: string }>;
};

export default async function OrcamentoPage({ searchParams }: OrcamentoPageProps) {
  const filters = await searchParams;
  const periodo = getPeriodoMes(filters.mes);
  const { user } = await requireAuthenticatedUser();
  const supabase = await createClient();
  const [{ data: orcamentos, error }, { data: receitas }, { data: despesas }] = await Promise.all([
    supabase.from("orcamentos").select("id,categoria_id,percentual_renda,valor_limite,user_id,created_at,updated_at,categorias(nome)").eq("user_id", user.id).order("created_at", { ascending: false }).returns<Orcamento[]>(),
    supabase.from("receitas").select("valor").eq("user_id", user.id).gte("data_competencia", periodo.inicio).lt("data_competencia", periodo.fim).returns<Array<{ valor: number }>>(),
    supabase.from("despesas").select("valor,categoria_id").eq("user_id", user.id).gte("data_competencia", periodo.inicio).lt("data_competencia", periodo.fim).returns<Array<{ categoria_id: string | null; valor: number }>>()
  ]);

  const renda = (receitas || []).reduce((total, item) => total + Number(item.valor || 0), 0);
  const gastosPorCategoria = new Map<string, number>();
  for (const despesa of despesas || []) {
    if (despesa.categoria_id) {
      gastosPorCategoria.set(despesa.categoria_id, (gastosPorCategoria.get(despesa.categoria_id) || 0) + Number(despesa.valor || 0));
    }
  }

  return (
    <section className="records-page">
      <div className="page-heading with-action">
        <div>
          <p>Planejamento</p>
          <h1>Orçamento</h1>
          <span>Distribua sua renda por categoria e acompanhe o consumo mensal.</span>
        </div>
        <Link className="primary-button" href="/app/orcamento/novo">Novo orçamento</Link>
      </div>
      <MonthFilter month={periodo.mes} />

      <div className="expense-summary-grid">
        <Card className="summary-card" tone="income"><span>Renda mês</span><strong>{formatCurrency(renda)}</strong></Card>
        <Card className="summary-card" tone="muted"><span>Orçamentos</span><strong>{orcamentos?.length || 0}</strong></Card>
      </div>

      {error ? <p className="admin-alert">Não foi possível carregar orçamento: {error.message}</p> : null}

      <div className="budget-distribution">
        {(orcamentos || []).map((orcamento) => {
          const limite = Number(orcamento.valor_limite || 0) || (renda * Number(orcamento.percentual_renda || 0)) / 100;
          const gasto = gastosPorCategoria.get(orcamento.categoria_id) || 0;
          const percent = limite > 0 ? Math.min((gasto / limite) * 100, 100) : 0;
          return (
            <Card className="budget-card" key={orcamento.id}>
              <div><strong>{orcamento.categorias?.nome || "Categoria"}</strong><span>{orcamento.percentual_renda}% da renda</span></div>
              <div className="budget-bar"><i style={{ width: `${percent}%` }} /></div>
              <p>{formatCurrency(gasto)} usados de {formatCurrency(limite)}</p>
            </Card>
          );
        })}
      </div>

      <TableWrap>
        <Table>
          <TableHead><TableRow><TableHeader>Categoria</TableHeader><TableHeader>% renda</TableHeader><TableHeader>Limite</TableHeader><TableHeader>Gasto mês</TableHeader><TableHeader>Ações</TableHeader></TableRow></TableHead>
          <TableBody>
            {(orcamentos || []).length === 0 ? <TableRow><TableCell className="empty-cell" colSpan={5}>Nenhum orçamento cadastrado ainda.</TableCell></TableRow> : null}
            {(orcamentos || []).map((orcamento) => {
              const limite = Number(orcamento.valor_limite || 0) || (renda * Number(orcamento.percentual_renda || 0)) / 100;
              const gasto = gastosPorCategoria.get(orcamento.categoria_id) || 0;
              return (
                <TableRow key={orcamento.id}>
                  <TableCell><strong>{orcamento.categorias?.nome || "-"}</strong></TableCell>
                  <TableCell>{orcamento.percentual_renda}%</TableCell>
                  <TableCell>{formatCurrency(limite)}</TableCell>
                  <TableCell>{formatCurrency(gasto)}</TableCell>
                  <TableCell><div className="table-actions"><Link className="table-link-button" href={`/app/orcamento/${orcamento.id}/editar`}>Editar</Link><form action={deleteOrcamento}><input name="id" type="hidden" value={orcamento.id} /><ConfirmSubmitButton message="Excluir este orçamento?">Excluir</ConfirmSubmitButton></form></div></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableWrap>
    </section>
  );
}
