import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/user-data";

export type ExpenseStatus = "p" | "pp" | "ab";

export type ExpenseOption = {
  id: string;
  nome: string;
};

export type Expense = {
  id: string;
  descricao: string;
  valor: number;
  status: ExpenseStatus;
  categoria_id: string | null;
  bolso_id: string | null;
  user_id: string;
  anexo_path: string | null;
  anexo_nome: string | null;
  data_competencia: string;
  created_at: string;
  updated_at: string;
  categorias: { nome: string } | null;
  bolsos: { nome: string } | null;
};

export const expenseStatusLabels: Record<ExpenseStatus, string> = {
  p: "Pendente",
  pp: "Paga",
  ab: "Aberta"
};

export function parseCurrency(value: FormDataEntryValue | null) {
  const normalized = String(value || "")
    .replace(/\s/g, "")
    .replace(/[R$]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency"
  }).format(Number(value || 0));
}

export function getExpenseStatus(value: FormDataEntryValue | null): ExpenseStatus {
  return value === "pp" || value === "ab" ? value : "p";
}

export function getCompetenceDate(value: FormDataEntryValue | null) {
  const parsed = String(value || "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) return parsed;
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

export async function listExpenseOptions() {
  const { supabase, user } = await requireAuthenticatedUser();

  const [categories, pockets] = await Promise.all([
    supabase.from("categorias").select("id,nome").eq("user_id", user.id).order("nome", { ascending: true }).returns<ExpenseOption[]>(),
    supabase.from("bolsos").select("id,nome").eq("user_id", user.id).order("nome", { ascending: true }).returns<ExpenseOption[]>()
  ]);

  return { categories, pockets, user };
}

export async function getUserExpense(id: string) {
  const { supabase, user } = await requireAuthenticatedUser();

  return supabase
    .from("despesas")
    .select("id,descricao,valor,status,categoria_id,bolso_id,user_id,anexo_path,anexo_nome,data_competencia,created_at,updated_at,categorias(nome),bolsos(nome)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle<Expense>();
}

export async function getExpenseAttachmentUrl(path: string | null) {
  if (!path) {
    return null;
  }

  const supabase = await createClient();
  const { data } = await supabase.storage.from("despesas-anexos").createSignedUrl(path, 60 * 10);

  return data?.signedUrl || null;
}
