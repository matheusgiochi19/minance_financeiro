import Link from "next/link";
import { CurrencyInput } from "@/components/currency-input";
import { FormSubmitButton } from "@/components/form-submit-button";
import { RecurrenceActionDialog } from "@/components/recurrence-action-dialog";
import { Card } from "@/components/ui/card";
import type { ExpenseOption } from "@/lib/expenses";
import type { Receita } from "@/lib/income-cards";

type ReceitaFormProps = {
  action: (formData: FormData) => Promise<void>;
  categories: ExpenseOption[];
  defaultReceita?: Receita | null;
  formId?: string;
  pockets: ExpenseOption[];
};

export function ReceitaForm({ action, categories, defaultReceita, formId = "receita-form", pockets }: ReceitaFormProps) {
  const defaultCompetence = defaultReceita?.data_competencia || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const isRecurring = Boolean(defaultReceita?.recurrence_group_id);

  return (
    <Card className="entity-form-card expense-edit-card">
      <h2>Dados da receita</h2>
      <form action={action} className="expense-edit-form" id={formId}>
        {defaultReceita ? <input name="id" type="hidden" value={defaultReceita.id} /> : null}
        {defaultReceita?.recurrence_group_id ? <input name="recurrence_group_id" type="hidden" value={defaultReceita.recurrence_group_id} /> : null}
        <label>
          <span>Descrição</span>
          <input defaultValue={defaultReceita?.descricao || ""} maxLength={120} name="descricao" placeholder="Ex.: Salário" required />
        </label>
        <label>
          <span>Valor</span>
          <CurrencyInput defaultValue={defaultReceita?.valor} name="valor" required />
        </label>
        <label>
          <span>Competência</span>
          <input defaultValue={defaultCompetence} name="data_competencia" type="date" required />
        </label>
        {!defaultReceita ? (
          <label>
            <span>Repetir por</span>
            <div className="repeat-field">
              <input defaultValue={1} max={120} min={1} name="repeat_months" type="number" />
              <span>meses</span>
            </div>
          </label>
        ) : null}
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
        {isRecurring ? (
          <RecurrenceActionDialog
            allLabel="Editar todos os lancamentos recorrentes"
            cancelHref="/app/receitas"
            defaultOpen
            inline
            description="Escolha se a alteracao vale apenas para este lancamento ou para todo o grupo recorrente."
            formId={formId}
            singleLabel="Editar somente este lancamento"
            title="Editar lancamento recorrente"
          />
        ) : (
          <div className="form-actions">
            <FormSubmitButton>Salvar</FormSubmitButton>
            <Link className="secondary-link-button" href="/app/receitas">Cancelar</Link>
          </div>
        )}
      </form>
    </Card>
  );
}
