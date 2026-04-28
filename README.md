# Minance

Minance e um SaaS de gestao financeira pessoal construido com:

- Next.js 16 + React 19
- App Router + Server Actions
- Supabase Auth
- Supabase PostgreSQL
- Deploy em GitHub + Vercel

## Sprint 1 + Sprint 2

Base entregue nesta etapa:

- setup do projeto Next.js
- integracao com Supabase
- estrutura de pastas organizada
- variaveis de ambiente documentadas
- layout base do produto
- autenticacao com sessao persistente
- cadastro com senha provisoria gerada no servidor
- primeiro login com troca obrigatoria de senha
- protecao de rotas para usuarios autenticados

## Importante sobre o banco

Voce ainda nao criou a base no Supabase, entao execute manualmente este arquivo no SQL Editor:

```txt
supabase/schema.sql
```

O arquivo foi regravado no codigo sem segredo embutido e pronto para versionamento.

## Importante sobre envio de senha por e-mail

O fluxo atual gera a senha provisoria no servidor e a exibe na interface logo apos o cadastro.

Isso foi feito porque, com apenas `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`, nao existe um caminho seguro para enviar a senha aleatoria por e-mail automaticamente.

Para ativar envio real por e-mail em uma proxima etapa, vamos precisar de pelo menos um destes caminhos:

- `SUPABASE_SERVICE_ROLE_KEY` para fluxo admin seguro
- provedor de e-mail transacional como Resend
- template e politica de onboarding ajustados no Supabase Auth

## Variaveis de ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Como rodar localmente

1. Instale as dependencias:

```bash
npm install
```

2. Configure o ambiente:

```bash
cp .env.example .env.local
```

3. Execute `supabase/schema.sql` no painel do Supabase.

4. Rode o projeto dentro da pasta correta:

```bash
npm run dev
```

Se estiver no Windows PowerShell e quiser garantir o diretorio certo:

```powershell
cd "C:\Users\mathe\Documents\Codex\2026-04-28\voc-um-engenheiro-de-software-s"
npm.cmd run dev
```

5. Acesse:

```txt
http://localhost:3000
```

## Validacao util

```bash
npm run lint
npm run typecheck
```

## Estrutura principal

```txt
src/app/auth                  -> login e cadastro
src/app/primeiro-acesso       -> troca obrigatoria de senha
src/app/(app)/dashboard       -> dashboard
src/app/(app)/despesas        -> tela de despesas
src/app/(app)/categorias      -> categorias
src/lib/supabase              -> clients SSR/browser + middleware
src/lib/users.ts              -> perfil do usuario da aplicacao
supabase/schema.sql           -> schema principal para executar manualmente
supabase/minance_schema.sql   -> espelho do schema principal
```
