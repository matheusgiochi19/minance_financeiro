"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/user-data";

function parseCsv(text: string) {
  const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
  const headers = headerLine?.split(",").map((item) => item.trim()) || [];
  return lines.map((line) => {
    const values = line.split(",").map((item) => item.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
  });
}

export async function importCsv(formData: FormData) {
  const tipo = String(formData.get("tipo") || "");
  const file = formData.get("arquivo");
  if (!(file instanceof File) || file.size === 0) return;

  const { supabase, user } = await requireAuthenticatedUser();
  const rows = parseCsv(await file.text());

  if (tipo === "categorias") {
    await supabase.from("categorias").insert(rows.filter((row) => row.nome).map((row) => ({ nome: row.nome, user_id: user.id })));
  }
  if (tipo === "bolsos") {
    await supabase.from("bolsos").insert(rows.filter((row) => row.nome).map((row) => ({ nome: row.nome, user_id: user.id })));
  }
  revalidatePath("/app/dados");
}
