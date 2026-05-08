import Link from "next/link";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/expenses";
import type { Receita } from "@/lib/income-cards";
import type { ExpenseOption } from "@/lib/expenses";

type ReceitaFormProps = {
  action: (formData: FormData) => Promise<void>;
  categories: ExpenseOption[];
  defaultReceita?: Receita | null;
  pockets: ExpenseOption[];
};

export function ReceitaForm({ action, categories, defaultReceita, pockets }: ReceitaFormProps) {
  const defaultCompetence = defaultReceita?.data_competencia || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  return (
    <Card className="entity-form-card expense-edit-card">
      <h2>Dados da receita</h2>
      <form action={action} className="expense-edit-form">
        {defaultReceita ? <input name="id" type="hidden" value={defaultReceita.id} /> : null}
        <label>
          <span>Descrição</span>
          <input defaultValue={defaultReceita?.descricao || ""} maxLength={120} name="descricao" placeholder="Ex.: Salário" required />
        </label>
        <label>
          <span>Valor</span>
          <input defaultValue={defaultReceita ? formatCurrency(defaultReceita.valor).replace("R$", "").trim() : ""} inputMode="decimal" name="valor" placeholder="0,00" required />
        </label>
        <label>
          <span>Competência</span>
          <input defaultValue={defaultCompetence} name="data_competencia" type="date" required />
        </label>
        <label>
          <span>Categoria</span>
          <select defaultValue={defaultReceita?.categoria_id || ""} name="categoria_id">
            <option value="">Sem categoria</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.nome}</option>)}
          </select>
        </label>
        <label>
          <span>Bolso</span>
          <select defaultValue={defaultReceita?.bolso_id || ""} name="bolso_id">
            <option value="">Sem bolso</option>
            {pockets.map((pocket) => <option key={pocket.id} value={pocket.id}>{pocket.nome}</option>)}
          </select>
        </label>
        <div className="form-actions">
          <FormSubmitButton>Salvar</FormSubmitButton>
          <Link className="secondary-link-button" href="/app/receitas">Cancelar</Link>
        </div>
      </form>
    </Card>
  );
}
