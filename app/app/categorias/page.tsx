import { createCategoria, deleteCategoria, updateCategoria } from "@/app/app/categorias/actions";
import { NamedRecordsManager } from "@/components/named-records-manager";
import { listUserRecords } from "@/lib/user-data";

export default async function CategoriasPage() {
  const { data: categorias, error } = await listUserRecords("categorias");

  return (
    <section className="records-page">
      <div className="page-heading">
        <p>Cadastro</p>
        <h1>Categorias</h1>
        <span>Organize os tipos de receitas e despesas que serão usados nos lançamentos.</span>
      </div>

      {error ? <p className="admin-alert">Não foi possível carregar categorias: {error.message}</p> : null}

      <NamedRecordsManager
        createAction={createCategoria}
        deleteAction={deleteCategoria}
        emptyText="Nenhuma categoria cadastrada ainda."
        inputPlaceholder="Ex.: Moradia"
        records={categorias || []}
        title="Categoria"
        updateAction={updateCategoria}
      />
    </section>
  );
}
