import { MoreVertical, Search, SlidersHorizontal } from "lucide-react";

import { createMovimentoAction, deleteMovimentoAction } from "@/app/(app)/actions";
import { getDespesasData } from "@/lib/data";

export const dynamic = "force-dynamic";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default async function DespesasPage() {
  const { categorias, bolsos, cartoes, despesas } = await getDespesasData();
  const pendentes = despesas.filter((item) => item.status === "pendente");
  const pagas = despesas.filter((item) => item.status === "paga");
  const cartao = despesas.filter((item) => item.cartao);
  const totalDespesas = despesas.reduce((sum, item) => sum + item.valor, 0);
  const today = new Date().toISOString().slice(0, 10);

  const cards = [
    { title: "Despesas Pendentes", value: formatCurrency(pendentes.reduce((sum, item) => sum + item.valor, 0)), bg: "#FF9C85" },
    { title: "Despesas Pagas", value: formatCurrency(pagas.reduce((sum, item) => sum + item.valor, 0)), bg: "#FF9C85" },
    { title: "Despesa Cartao", value: formatCurrency(cartao.reduce((sum, item) => sum + item.valor, 0)), bg: "#FFBE72" },
    { title: "Total Despesas", value: formatCurrency(totalDespesas), bg: "#FF6336" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <h1 className="text-[34px] font-semibold text-[var(--cor_escura_primaria)]">Despesas</h1>

        <div className="flex flex-wrap items-center gap-3">
          <form action={createMovimentoAction} className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="tipo" value="despesa" />
            <input type="hidden" name="status" value="pendente" />
            <input type="hidden" name="descricao" value="Nova despesa" />
            <input type="hidden" name="valor" value="1" />
            <input type="hidden" name="data" value={today} />
            <button type="submit" className="rounded-xl bg-[var(--cor_destaque_secundaria)] px-5 py-3 text-sm font-semibold text-[var(--cor_texto_claro)]">
              + Nova Despesa
            </button>
          </form>
          <button type="button" className="rounded-xl bg-[var(--cor_escura_primaria)] p-3 text-[var(--cor_texto_claro)]" aria-label="Buscar">
            <Search className="size-5" />
          </button>
          <button type="button" className="rounded-xl bg-[var(--cor_escura_primaria)] p-3 text-[var(--cor_texto_claro)]" aria-label="Filtrar">
            <SlidersHorizontal className="size-5" />
          </button>
          <button type="button" className="rounded-xl bg-[var(--cor_escura_primaria)] p-3 text-[var(--cor_texto_claro)]" aria-label="Mais opcoes">
            <MoreVertical className="size-5" />
          </button>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr_1fr_220px]">
        {cards.map((card) => (
          <div key={card.title} className="rounded-2xl px-4 py-5 shadow-[0_10px_24px_rgba(44,59,77,0.12)]" style={{ backgroundColor: card.bg }}>
            <p className="text-[13px] font-semibold text-[var(--cor_escura_primaria)]">{card.title}</p>
            <p className="mt-2 text-[27px] font-bold text-[var(--cor_escura_primaria)]">{card.value}</p>
          </div>
        ))}

        <div className="flex flex-col items-center justify-center gap-3 text-center text-[var(--cor_escura_primaria)]/80">
          <p className="text-sm">Selecione o mes desejado abaixo</p>
          <div className="inline-flex items-center gap-3">
            <button type="button" className="rounded-xl bg-transparent px-3 py-2 text-2xl text-[var(--cor_escura_primaria)]">‹</button>
            <div className="rounded-2xl bg-[var(--cor_fundo_botao)] px-6 py-4 text-sm font-semibold text-[var(--cor_texto_claro)]">Marco 2026</div>
            <button type="button" className="rounded-xl bg-transparent px-3 py-2 text-2xl text-[var(--cor_escura_primaria)]">›</button>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] bg-white/48 p-6">
        <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select className="h-11 rounded-xl border border-[var(--cor_escura_primaria)]/12 bg-[var(--cor_fundo_primaria)] px-4 text-sm outline-none">
            <option>Todas as categorias</option>
            {categorias.map((categoria) => (
              <option key={categoria.id}>{categoria.nome}</option>
            ))}
          </select>
          <select className="h-11 rounded-xl border border-[var(--cor_escura_primaria)]/12 bg-[var(--cor_fundo_primaria)] px-4 text-sm outline-none">
            <option>Todos os bolsos</option>
            {bolsos.map((bolso) => (
              <option key={bolso.id}>{bolso.nome}</option>
            ))}
          </select>
          <select className="h-11 rounded-xl border border-[var(--cor_escura_primaria)]/12 bg-[var(--cor_fundo_primaria)] px-4 text-sm outline-none">
            <option>Todos os cartoes</option>
            {cartoes.map((cartao) => (
              <option key={cartao.id}>{cartao.nome}</option>
            ))}
          </select>
          <select className="h-11 rounded-xl border border-[var(--cor_escura_primaria)]/12 bg-[var(--cor_fundo_primaria)] px-4 text-sm outline-none">
            <option>Status</option>
            <option>Pendente</option>
            <option>Paga</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-[22px] border border-[var(--cor_escura_primaria)]/8">
          <table className="min-w-full bg-[rgba(255,255,255,0.58)] text-left text-sm">
            <thead className="bg-[#D5C7B7] text-[var(--cor_escura_primaria)]">
              <tr>
                <th className="px-4 py-4 font-semibold">Situacao</th>
                <th className="px-4 py-4 font-semibold">Data</th>
                <th className="px-4 py-4 font-semibold">Descricao</th>
                <th className="px-4 py-4 font-semibold">Categoria</th>
                <th className="px-4 py-4 font-semibold">Bolso</th>
                <th className="px-4 py-4 font-semibold">Valor</th>
                <th className="px-4 py-4 font-semibold">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {despesas.map((despesa) => (
                <tr key={despesa.id} className="border-t border-[var(--cor_escura_primaria)]/8">
                  <td className="px-4 py-4 font-semibold uppercase text-[var(--cor_escura_primaria)]/70">{despesa.status === 'paga' ? 'P' : 'A'}</td>
                  <td className="px-4 py-4">{new Intl.DateTimeFormat('pt-BR').format(new Date(despesa.data))}</td>
                  <td className="px-4 py-4 font-medium">{despesa.descricao}</td>
                  <td className="px-4 py-4">{despesa.categoria?.nome ?? 'Sem categoria'}</td>
                  <td className="px-4 py-4">{despesa.bolso?.nome ?? despesa.cartao?.nome ?? 'Direto'}</td>
                  <td className="px-4 py-4 font-semibold text-[var(--cor_escura_primaria)]">{formatCurrency(despesa.valor)}</td>
                  <td className="px-4 py-4">
                    <form action={deleteMovimentoAction} className="inline-flex items-center gap-2">
                      <input type="hidden" name="id" value={despesa.id} />
                      <input type="hidden" name="tipo" value="despesa" />
                      <button type="submit" className="rounded-lg bg-[var(--cor_fundo_botao)] px-3 py-2 text-xs font-semibold text-[var(--cor_texto_claro)]">
                        Excluir
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
