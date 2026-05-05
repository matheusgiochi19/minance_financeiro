import { notFound } from "next/navigation";
import { updateBolso } from "@/app/app/bolsos/actions";
import { NamedRecordForm } from "@/components/named-record-form";
import { getUserRecord } from "@/lib/user-data";

type EditarBolsoPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditarBolsoPage({ params }: EditarBolsoPageProps) {
  const { id } = await params;
  const { data: bolso } = await getUserRecord("bolsos", id);

  if (!bolso) {
    notFound();
  }

  return (
    <section className="records-page">
      <div className="page-heading">
        <p>Cadastro</p>
        <h1>Editar bolso</h1>
        <span>Atualize o nome do bolso selecionado.</span>
      </div>
      <NamedRecordForm action={updateBolso} cancelHref="/app/bolsos" defaultRecord={bolso} placeholder="Ex.: Nubank Matheus" title="Dados do bolso" />
    </section>
  );
}
