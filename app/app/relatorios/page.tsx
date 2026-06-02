import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function RelatoriosPage() {
  return (
    <section className="records-page">
      <div className="page-heading">
        <p>Análise</p>
        <h1>Relatórios</h1>
        <span>Gere uma visão formatada por período e tipo de lançamento.</span>
      </div>
      <Card className="entity-form-card">
        <h2>Filtros do relatório</h2>
        <form action="/app/relatorios/gerar" className="entity-form">
          <label><span>Data inicial</span><input name="inicio" type="date" /></label>
          <label><span>Data final</span><input name="fim" type="date" /></label>
          <label>
            <span>Tipo</span>
            <select name="tipo" defaultValue="todos">
              <option value="todos">Todos</option>
              <option value="receitas">Receitas</option>
              <option value="despesas">Despesas</option>
              <option value="cartoes">Cartões</option>
            </select>
          </label>
          <div className="form-actions">
            <Button type="submit">Gerar</Button>
            <Link className="secondary-link-button" href="/app/dashboard">Cancelar</Link>
          </div>
        </form>
      </Card>
    </section>
  );
}
