import Link from "next/link";
import { CurrencyInput } from "@/components/currency-input";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Card } from "@/components/ui/card";
import { type ExpenseOption } from "@/lib/expenses";
import type { Orcamento } from "@/lib/budgets";

type OrcamentoFormProps = {
  action: (formData: FormData) => Promise<void>;
  categories: ExpenseOption[];
  defaultOrcamento?: Orcamento | null;
};

export function OrcamentoForm({ action, categories, defaultOrcamento }: OrcamentoFormProps) {
  return (
    <Card className="entity-form-card">
      <h2>Dados do orçamento</h2>
      <form action={action} className="entity-form">
        {defaultOrcamento ? <input name="id" type="hidden" value={defaultOrcamento.id} /> : null}
        <label>
          <span>Categoria</span>
          <select defaultValue={defaultOrcamento?.categoria_id || ""} name="categoria_id" required>
            <option value="">Selecione</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.nome}</option>)}
          </select>
        </label>
        <label>
          <span>Percentual da renda</span>
          <input defaultValue={defaultOrcamento?.percentual_renda || ""} inputMode="decimal" name="percentual_renda" placeholder="Ex.: 30" required />
        </label>
        <label>
          <span>Valor limite manual</span>
          <CurrencyInput defaultValue={defaultOrcamento?.valor_limite} name="valor_limite" placeholder="Opcional" />
        </label>
        <div className="form-actions">
          <FormSubmitButton>Salvar</FormSubmitButton>
          <Link className="secondary-link-button" href="/app/orcamento">Cancelar</Link>
        </div>
      </form>
    </Card>
  );
}
