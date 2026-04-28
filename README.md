# Minance

Minance é um SaaS de gestão financeira pessoal construído com:

- Next.js 16 + React 19
- App Router + Server Actions
- Supabase Auth
- Supabase PostgreSQL
- Deploy pronto para Vercel

## O que já está pronto

- Autenticação com Supabase (`/auth`)
- Proteção de sessão com middleware SSR
- Dashboard financeiro (`/dashboard`)
- Cadastro e remoção de lançamentos
- Cadastro e remoção de categorias
- Schema SQL inicial com RLS em `supabase/schema.sql`

## Configuração local

1. Instale as dependências:

```bash
npm install
```

2. Configure as variáveis de ambiente:

```bash
cp .env.example .env.local
```

3. No Supabase SQL Editor, execute:

```sql
-- arquivo:
supabase/schema.sql
```

4. Rode o projeto:

```bash
npm run dev
```

5. Acesse:

```txt
http://localhost:3000
```

## Variáveis de ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Estrutura principal

```txt
src/app/auth                -> login e cadastro
src/app/(app)/dashboard     -> dashboard e lançamentos
src/app/(app)/categorias    -> gestão de categorias
src/lib/supabase            -> clients SSR/browser + middleware
supabase/schema.sql         -> tabelas, índices e policies
```

## Deploy

### GitHub

1. Criar repositório
2. Fazer push da pasta do projeto

### Vercel

1. Importar o repositório
2. Adicionar as variáveis:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy

## Próximos passos sugeridos

- metas mensais por categoria
- recorrência de despesas e receitas
- filtros por período
- gráficos de evolução
- exportação CSV
