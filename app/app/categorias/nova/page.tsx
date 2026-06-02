import { createCategoria } from "@/app/app/categorias/actions";
import { NamedRecordForm } from "@/components/named-record-form";

export default function NovaCategoriaPage() {
  return (
    <section className="records-page">
      <div className="page-heading">
        <p>Cadastro</p>
        <h1>Nova categoria</h1>
        <span>Crie uma categoria para classificar seus lançamentos.</span>
      </div>
      <NamedRecordForm action={createCategoria} cancelHref="/app/categorias" placeholder="Ex.: Moradia" title="Dados da categoria" />
    </section>
  );
}
