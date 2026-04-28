import { createCategoriaAction, deleteCategoriaAction } from "@/app/(app)/actions";
import { getDashboardData } from "@/lib/data";

export const dynamic = "force-dynamic";

const presets = ["#FFB162", "#A35139", "#455564", "#FF6336", "#FFA287", "#FFBC78"];

export default async function CategoriesPage() {
  const { categorias } = await getDashboardData();

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm uppercase tracking-[0.16em] text-[var(--cor_escura_primaria)]/70">
          Organizacao
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Categorias</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--cor_escura_primaria)]/78">
          Estruture receitas e despesas com taxonomia isolada por usuario.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form action={createCategoriaAction} className="rounded-lg bg-[var(--cor_fundo_secundaria)] p-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Nova categoria</h2>
            <p className="text-sm text-[var(--cor_escura_primaria)]/78">
              Dados salvos no servidor com vinculo por user_id.
            </p>
          </div>

          <div className="mt-6 grid gap-4">
            <label className="space-y-2">
              <span className="text-sm">Nome</span>
              <input name="nome" required className="h-11 w-full rounded-md border border-[var(--cor_escura_primaria)]/15 bg-[var(--cor_fundo_primaria)] px-3 text-sm outline-none" />
            </label>

            <label className="space-y-2">
              <span className="text-sm">Tipo</span>
              <select name="tipo" defaultValue="despesa" className="h-11 w-full rounded-md border border-[var(--cor_escura_primaria)]/15 bg-[var(--cor_fundo_primaria)] px-3 text-sm outline-none">
                <option value="despesa">Despesa</option>
                <option value="receita">Receita</option>
                <option value="ambos">Ambos</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm">Cor</span>
              <div className="grid grid-cols-6 gap-2">
                {presets.map((cor, index) => (
                  <label key={cor} className="flex cursor-pointer items-center justify-center">
                    <input type="radio" name="cor" value={cor} defaultChecked={index === 0} className="peer sr-only" />
                    <span className="h-10 w-full rounded-md border border-[var(--cor_escura_primaria)]/10 peer-checked:ring-2 peer-checked:ring-[var(--cor_escura_primaria)]" style={{ backgroundColor: cor }} />
                  </label>
                ))}
              </div>
            </label>
          </div>

          <button type="submit" className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-[var(--cor_fundo_botao)] px-4 text-sm font-medium text-[var(--cor_texto_claro)]">
            Salvar categoria
          </button>
        </form>

        <div className="rounded-lg bg-[var(--cor_fundo_secundaria)] p-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Categorias ativas</h2>
            <p className="text-sm text-[var(--cor_escura_primaria)]/78">
              Cada usuario visualiza apenas a propria estrutura.
            </p>
          </div>

          <div className="mt-6 grid gap-3">
            {categorias.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--cor_escura_primaria)]/15 p-8 text-center text-sm text-[var(--cor_escura_primaria)]/70">
                Nenhuma categoria criada ainda.
              </div>
            ) : (
              categorias.map((categoria) => (
                <div key={categoria.id} className="flex items-center justify-between rounded-lg bg-[var(--cor_fundo_primaria)] p-4">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: categoria.cor }} />
                    <div>
                      <p className="text-sm font-medium">{categoria.nome}</p>
                      <p className="text-xs uppercase tracking-[0.14em] text-[var(--cor_escura_primaria)]/60">{categoria.tipo}</p>
                    </div>
                  </div>

                  <form action={deleteCategoriaAction}>
                    <input type="hidden" name="id" value={categoria.id} />
                    <button type="submit" className="rounded-md bg-[var(--cor_fundo_botao)] px-3 py-2 text-xs font-medium text-[var(--cor_texto_claro)]">
                      Excluir
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

