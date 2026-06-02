import Link from "next/link";
import { importCsv } from "@/app/app/dados/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function DadosPage() {
  return (
    <section className="records-page">
      <div className="page-heading">
        <p>Dados</p>
        <h1>Importação e exportação</h1>
        <span>Movimente seus dados em CSV para auditoria ou carga inicial.</span>
      </div>
      <div className="settings-grid">
        <Card className="entity-form-card">
          <h2>Exportar CSV</h2>
          <p className="muted-copy">Baixe categorias, bolsos, receitas, despesas, cartões e orçamento.</p>
          <Link className="primary-button" href="/app/dados/export">Exportar CSV</Link>
        </Card>
        <Card className="entity-form-card">
          <h2>Importar CSV</h2>
          <form action={importCsv} className="entity-form" encType="multipart/form-data">
            <label><span>Tipo</span><select name="tipo" defaultValue="categorias"><option value="categorias">Categorias</option><option value="bolsos">Bolsos</option></select></label>
            <label><span>Arquivo CSV</span><input name="arquivo" type="file" accept=".csv,text/csv" required /></label>
            <Button type="submit">Importar</Button>
          </form>
        </Card>
      </div>
    </section>
  );
}
