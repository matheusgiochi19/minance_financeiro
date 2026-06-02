import { notFound } from "next/navigation";
import { updateCategoria } from "@/app/app/categorias/actions";
import { NamedRecordForm } from "@/components/named-record-form";
import { getUserRecord } from "@/lib/user-data";

type EditarCategoriaPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditarCategoriaPage({ params }: EditarCategoriaPageProps) {
  const { id } = await params;
  const { data: categoria } = await getUserRecord("categorias", id);

  if (!categoria) {
    notFound();
  }

  return (
    <section className="records-page">
      <div className="page-heading">
        <p>Cadastro</p>
        <h1>Editar categoria</h1>
        <span>Atualize o nome da categoria selecionada.</span>
      </div>
      <NamedRecordForm action={updateCategoria} cancelHref="/app/categorias" defaultRecord={categoria} placeholder="Ex.: Moradia" title="Dados da categoria" />
    </section>
  );
}
