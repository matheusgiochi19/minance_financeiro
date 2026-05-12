import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function csvEscape(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Não autenticado", { status: 401 });
  }

  const tables = ["categorias", "bolsos", "receitas", "despesas", "cartoes", "cartao_despesas", "orcamentos"];
  const parts: string[] = [];

  for (const table of tables) {
    let query = supabase.from(table).select("*").eq("user_id", user.id);
    if (["categorias", "bolsos", "receitas", "despesas", "cartoes", "cartao_despesas"].includes(table)) {
      query = query.is("deleted_at", null);
    }
    const { data } = await query;
    parts.push(`# ${table}`);
    if (data?.length) {
      const headers = Object.keys(data[0]);
      parts.push(headers.join(","));
      parts.push(...data.map((row) => headers.map((header) => csvEscape(row[header as keyof typeof row])).join(",")));
    } else {
      parts.push("sem_dados");
    }
    parts.push("");
  }

  return new NextResponse(parts.join("\n"), {
    headers: {
      "Content-Disposition": "attachment; filename=minance-dados.csv",
      "Content-Type": "text/csv; charset=utf-8"
    }
  });
}
