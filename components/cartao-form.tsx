import Link from "next/link";
import { CurrencyInput } from "@/components/currency-input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Cartao } from "@/lib/income-cards";

type CartaoFormProps = {
  action: (formData: FormData) => Promise<void>;
  defaultCartao?: Cartao | null;
};

export function CartaoForm({ action, defaultCartao }: CartaoFormProps) {
  return (
    <Card className="entity-form-card">
      <h2>Dados do cartão</h2>
      <form action={action} className="entity-form">
        {defaultCartao ? <input name="id" type="hidden" value={defaultCartao.id} /> : null}
        <label>
          <span>Nome</span>
          <input defaultValue={defaultCartao?.nome || ""} maxLength={80} name="nome" placeholder="Ex.: Nubank Black" required />
        </label>
        <label>
          <span>Limite</span>
          <CurrencyInput defaultValue={defaultCartao?.limite} name="limite" />
        </label>
        <div className="form-actions">
          <Button type="submit">Salvar</Button>
          <Link className="secondary-link-button" href="/app/cartoes">Cancelar</Link>
        </div>
      </form>
    </Card>
  );
}
