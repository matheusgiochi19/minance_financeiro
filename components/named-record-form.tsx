import Link from "next/link";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Card } from "@/components/ui/card";
import type { NamedUserRecord } from "@/lib/user-data";

type NamedRecordFormProps = {
  action: (formData: FormData) => Promise<void>;
  cancelHref: string;
  defaultRecord?: NamedUserRecord | null;
  placeholder: string;
  title: string;
};

export function NamedRecordForm({ action, cancelHref, defaultRecord, placeholder, title }: NamedRecordFormProps) {
  return (
    <Card className="entity-form-card">
      <h2>{title}</h2>
      <form action={action} className="entity-form">
        {defaultRecord ? <input name="id" type="hidden" value={defaultRecord.id} /> : null}
        <label>
          <span>Nome</span>
          <input defaultValue={defaultRecord?.nome || ""} maxLength={80} name="nome" placeholder={placeholder} required />
        </label>
        <div className="form-actions">
          <FormSubmitButton>Salvar</FormSubmitButton>
          <Link className="secondary-link-button" href={cancelHref}>Cancelar</Link>
        </div>
      </form>
    </Card>
  );
}
