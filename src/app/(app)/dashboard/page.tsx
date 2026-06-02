import { createMovimentoAction } from "@/app/(app)/actions";
import { getDashboardData } from "@/lib/data";

export const dynamic = "force-dynamic";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

const monthlyBars = [4200, 3500, 3855, 3650, 3700, 3690];
const pieItems = [
  { label: "Moradia", value: 45, color: "#7C6AE6" },
  { label: "Servicos", value: 10, color: "#4F7BF1" },
  { label: "Alimentacao", value: 22, color: "#FF8C88" },
  { label: "Cartao", value: 18, color: "#42B4CE" },
  { label: "Emprestimo", value: 5, color: "#FFB347" },
];
const creditBars = [690, 420, 400, 232, 123, 66, 99];
const creditLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul"];

export default async function DashboardPage() {
  const { categorias, bolsos, cartoes, movimentosRecentes, resumo } = await getDashboardData();
  const firstName = "Matheus";

  const pieGradient = pieItems
    .reduce(
      (acc, item) => {
        const next = acc.current + item.value;
        acc.stops.push(`${item.color} ${acc.current}% ${next}%`);
        acc.current = next;
        return acc;
      },
      { current: 0, stops: [] as string[] },
    )
    .stops.join(", ");

  const cards = [
    { title: "Saldo Atual", value: formatCurrency(resumo.saldo), bg: "#C7BDAA" },
    { title: "Receitas", value: formatCurrency(resumo.receitas), bg: "#C6CFB8" },
    { title: "Despesas", value: formatCurrency(resumo.despesas), bg: "#FF9C85" },
    { title: "Fatura Cartoes", value: formatCurrency(creditBars[0]), bg: "#FFBE72" },
  ];

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-[15px] text-[var(--cor_escura_primaria)]">Bem-vindo</p>
        <h1 className="text-[38px] font-semibold leading-none text-[var(--cor_destaque_secundaria)]">
          {firstName} Souchie
        </h1>
        <p className="pt-3 text-[18px] text-[var(--cor_escura_primaria)]/86">
          Abaixo, estao disponiveis as visoes sobre o mes atual
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <div key={card.title} className="rounded-2xl px-4 py-5 shadow-[0_10px_24px_rgba(44,59,77,0.12)]" style={{ backgroundColor: card.bg }}>
                <p className="text-[13px] font-semibold text-[var(--cor_escura_primaria)]">{card.title}</p>
                <p className="mt-2 text-[27px] font-bold text-[var(--cor_escura_primaria)]">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[28px] bg-[rgba(255,255,255,0.36)] px-8 py-7">
            <div className="flex h-[320px] items-end justify-between gap-5">
              {monthlyBars.map((value, index) => {
                const despesa = Math.max(value - 350, 1800);
                return (
                  <div key={`${value}-${index}`} className="flex flex-1 items-end justify-center gap-2">
                    <div className="flex h-[250px] w-8 items-end rounded-full bg-[rgba(70,96,22,0.08)]">
                      <div className="w-full rounded-full bg-[#456816]" style={{ height: `${Math.min((value / 4200) * 100, 100)}%` }} />
                    </div>
                    <div className="flex h-[250px] w-8 items-end rounded-full bg-[rgba(255,99,54,0.08)]">
                      <div className="w-full rounded-full bg-[#F77751]" style={{ height: `${Math.min((despesa / 4200) * 100, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex justify-between px-4 text-xs text-[var(--cor_escura_primaria)]/65">
              {['Jan 26', 'Fev 26', 'Mar 26', 'Abr 26', 'Mai 26', 'Jun 26'].map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-center gap-8 text-xs text-[var(--cor_escura_primaria)]/70">
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded bg-[#456816]" />Receitas</span>
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded bg-[#F77751]" />Despesas</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="mb-4 text-sm text-[var(--cor_escura_primaria)]/70">Despesas x Categorias</p>
            <div className="mx-auto h-[240px] w-[240px] rounded-full" style={{ background: `conic-gradient(${pieGradient})` }} />
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-[var(--cor_escura_primaria)]/75">
              {pieItems.map((item) => (
                <span key={item.label} className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-4 text-sm text-[var(--cor_escura_primaria)]/70">Faturas Cartao</p>
            <div className="space-y-3">
              {creditBars.map((value, index) => (
                <div key={`${value}-${creditLabels[index]}`} className="grid grid-cols-[34px_1fr_42px] items-center gap-3 text-xs text-[var(--cor_escura_primaria)]/72">
                  <span>{creditLabels[index]}</span>
                  <div className="h-5 rounded-full bg-[rgba(197,116,255,0.15)]">
                    <div className="flex h-5 items-center rounded-full bg-[#C86BFF] pl-3 text-[11px] font-medium text-white" style={{ width: `${Math.max((value / 690) * 100, 18)}%` }}>
                      {value}
                    </div>
                  </div>
                  <span className="text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] bg-white/40 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--cor_escura_primaria)]">Lancamentos recentes</h2>
            <p className="text-sm text-[var(--cor_escura_primaria)]/72">
              Fonte server-side pronta para a Sprint 1.
            </p>
          </div>
        </div>

        <form action={createMovimentoAction} className="mt-5 grid gap-3 rounded-[18px] bg-[var(--cor_fundo_primaria)]/70 p-4 md:grid-cols-2 xl:grid-cols-[120px_1fr_120px_150px_150px]">
          <select name="tipo" defaultValue="despesa" className="h-11 rounded-xl border border-[var(--cor_escura_primaria)]/12 bg-white/70 px-3 text-sm outline-none">
            <option value="despesa">Despesa</option>
            <option value="receita">Receita</option>
          </select>
          <input name="descricao" required placeholder="Descricao" className="h-11 rounded-xl border border-[var(--cor_escura_primaria)]/12 bg-white/70 px-3 text-sm outline-none" />
          <input name="valor" required type="number" min="0.01" step="0.01" placeholder="Valor" className="h-11 rounded-xl border border-[var(--cor_escura_primaria)]/12 bg-white/70 px-3 text-sm outline-none" />
          <input name="data" required type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="h-11 rounded-xl border border-[var(--cor_escura_primaria)]/12 bg-white/70 px-3 text-sm outline-none" />
          <label className="grid gap-1 text-xs text-[var(--cor_escura_primaria)]/75">
            Repetir pelos proximos
            <input name="repeat_months" type="number" min="1" max="24" defaultValue={1} className="h-11 rounded-xl border border-[var(--cor_escura_primaria)]/12 bg-white/70 px-3 text-sm outline-none" />
          </label>
          <select name="categoria_id" defaultValue="" className="h-11 rounded-xl border border-[var(--cor_escura_primaria)]/12 bg-white/70 px-3 text-sm outline-none">
            <option value="">Categoria</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
            ))}
          </select>
          <select name="bolso_id" defaultValue="" className="h-11 rounded-xl border border-[var(--cor_escura_primaria)]/12 bg-white/70 px-3 text-sm outline-none">
            <option value="">Bolso</option>
            {bolsos.map((bolso) => (
              <option key={bolso.id} value={bolso.id}>{bolso.nome}</option>
            ))}
          </select>
          <select name="cartao_id" defaultValue="" className="h-11 rounded-xl border border-[var(--cor_escura_primaria)]/12 bg-white/70 px-3 text-sm outline-none">
            <option value="">Cartao opcional</option>
            {cartoes.map((cartao) => (
              <option key={cartao.id} value={cartao.id}>{cartao.nome}</option>
            ))}
          </select>
          <input name="observacoes" placeholder="Observacoes" className="h-11 rounded-xl border border-[var(--cor_escura_primaria)]/12 bg-white/70 px-3 text-sm outline-none xl:col-span-1" />
          <button type="submit" className="h-11 rounded-xl bg-[var(--cor_fundo_botao)] px-4 text-sm font-semibold text-[var(--cor_texto_claro)]">
            Salvar
          </button>
        </form>

        <div className="mt-5 overflow-hidden rounded-[22px] border border-[var(--cor_escura_primaria)]/8">
          <table className="min-w-full bg-[rgba(255,255,255,0.58)] text-left text-sm">
            <thead className="bg-[#D5C7B7] text-[var(--cor_escura_primaria)]">
              <tr>
                <th className="px-4 py-4 font-semibold">Tipo</th>
                <th className="px-4 py-4 font-semibold">Descricao</th>
                <th className="px-4 py-4 font-semibold">Categoria</th>
                <th className="px-4 py-4 font-semibold">Origem</th>
                <th className="px-4 py-4 font-semibold">Valor</th>
              </tr>
            </thead>
            <tbody>
              {movimentosRecentes.slice(0, 6).map((movimento) => (
                <tr key={`${movimento.tipo}-${movimento.id}`} className="border-t border-[var(--cor_escura_primaria)]/8">
                  <td className="px-4 py-4 uppercase text-[12px] font-semibold text-[var(--cor_escura_primaria)]/72">{movimento.tipo}</td>
                  <td className="px-4 py-4 font-medium">
                    <div className="flex flex-col gap-1">
                      <span>{movimento.descricao}</span>
                      {movimento.recurrence_group_id ? (
                        <span className="text-xs font-semibold text-[var(--cor_destaque_secundaria)]">↻ Recorrente</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-4">{movimento.categoria?.nome ?? 'Sem categoria'}</td>
                  <td className="px-4 py-4">{movimento.cartao?.nome ?? movimento.bolso?.nome ?? 'Direto'}</td>
                  <td className={`px-4 py-4 font-semibold ${movimento.tipo === 'receita' ? 'text-[var(--cor_destaque_secundaria)]' : 'text-[var(--cor_despesa_secundaria)]'}`}>
                    {movimento.tipo === 'receita' ? '+' : '-'}{formatCurrency(movimento.valor)}
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
