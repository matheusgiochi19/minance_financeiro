import Link from "next/link";
import { PrintButton } from "@/components/print-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableWrap } from "@/components/ui/table";
import { formatCurrency } from "@/lib/expenses";
import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/user-data";

type RelatorioGerarPageProps = {
  searchParams: Promise<{ fim?: string; inicio?: string; tipo?: string }>;
};

type ReportRow = { data: string; descricao: string; tipo: string; valor: number };

export default async function RelatorioGerarPage({ searchParams }: RelatorioGerarPageProps) {
  const params = await searchParams;
  const { user } = await requireAuthenticatedUser();
  const supabase = await createClient();
  const inicio = params.inicio || "1970-01-01";
  const fim = params.fim || new Date().toISOString().slice(0, 10);
  const tipo = params.tipo || "todos";
  const rows: ReportRow[] = [];

  if (tipo === "todos" || tipo === "receitas") {
    const { data } = await supabase.from("receitas").select("descricao,valor,data_competencia").eq("user_id", user.id).gte("data_competencia", inicio).lte("data_competencia", fim);
    rows.push(...(data || []).map((item) => ({ data: item.data_competencia, descricao: item.descricao, tipo: "Receita", valor: Number(item.valor) })));
  }
  if (tipo === "todos" || tipo === "despesas") {
    const { data } = await supabase.from("despesas").select("descricao,valor,data_competencia").eq("user_id", user.id).gte("data_competencia", inicio).lte("data_competencia", fim);
    rows.push(...(data || []).map((item) => ({ data: item.data_competencia, descricao: item.descricao, tipo: "Despesa", valor: Number(item.valor) })));
  }
  if (tipo === "todos" || tipo === "cartoes") {
    const { data } = await supabase.from("cartao_despesas").select("descricao,valor,data_competencia").eq("user_id", user.id).gte("data_competencia", inicio).lte("data_competencia", fim);
    rows.push(...(data || []).map((item) => ({ data: item.data_competencia, descricao: item.descricao, tipo: "Cartão", valor: Number(item.valor) })));
  }

  rows.sort((a, b) => a.data.localeCompare(b.data));
  const total = rows.reduce((sum, row) => sum + row.valor, 0);

  return (
    <section className="records-page report-page">
      <div className="page-heading with-action">
        <div><p>Relatório</p><h1>Resultado</h1><span>{rows.length} registros encontrados.</span></div>
        <div className="form-actions no-print"><PrintButton /><Link className="secondary-link-button" href="/app/relatorios">Voltar</Link></div>
      </div>
      <TableWrap>
        <Table>
          <TableHead><TableRow><TableHeader>Data</TableHeader><TableHeader>Tipo</TableHeader><TableHeader>Descrição</TableHeader><TableHeader>Valor</TableHeader></TableRow></TableHead>
          <TableBody>
            {rows.map((row, index) => <TableRow key={`${row.tipo}-${index}`}><TableCell>{new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(row.data))}</TableCell><TableCell>{row.tipo}</TableCell><TableCell>{row.descricao}</TableCell><TableCell>{formatCurrency(row.valor)}</TableCell></TableRow>)}
            <TableRow><TableCell colSpan={3}><strong>Total</strong></TableCell><TableCell><strong>{formatCurrency(total)}</strong></TableCell></TableRow>
          </TableBody>
        </Table>
      </TableWrap>
    </section>
  );
}
