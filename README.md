# Rifa Feira dos Países 2026 🇺🇸

Sistema completo da rifa escolar da turma dos **Estados Unidos** na Feira dos Países 2026.

Cada número custa **R$ 5,00**. São **29 alunos**, **15 números por aluno** e **435 números** no total (potencial de **R$ 2.175,00**).

Stack:

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS
- Supabase Auth, PostgreSQL e Storage

## 1. Instalar dependências

```bash
npm install
```

## 2. Configurar o Supabase

1. Crie um projeto em [https://supabase.com](https://supabase.com).
2. Em **Authentication → Providers → Email**, desative o cadastro público (*Enable sign ups*) para que só existam os 29 alunos criados pelo seed.
3. Como os e-mails de login são internos (`…@alunos.rifafeiradospaises.local`), desative a confirmação obrigatória de e-mail ou confirme os usuários pelo seed (o script já marca `email_confirm: true`).
4. Copie a URL e as chaves em **Project Settings → API**.

O login do site usa o **login da turma** (ex.: `euller.pedro`), não o e-mail. O sistema converte o login em um e-mail interno só para o Supabase Auth. As senhas **nunca** são salvas em texto puro: o Auth guarda o hash.

A autorização **não** usa o e-mail do usuário. O cargo (`student`, `admin`, `super_admin`) fica na tabela `profiles` e nas políticas RLS.

## 3. Como criar as tabelas

No SQL Editor do Supabase, execute o arquivo:

```text
supabase/schema.sql
```

Esse script cria:

- schema `private` com funções `SECURITY DEFINER`
- tabelas `profiles`, `numeros` e `registros`
- view `student_progress`
- funções de registro, estatísticas e administração
- Row Level Security
- bucket `payment-proofs` (privado)

## 4. Como executar as migrations

Se você usa a CLI do Supabase:

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

A migration equivalente está em:

```text
supabase/migrations/20260918120000_init.sql
```

## 5. Como executar o seed

O seed cria os 29 usuários no Auth, os perfis e os 435 números.

```bash
npm run seed
```

Requer `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`.

O equivalente SQL dos números (depois que os perfis existem) está em `supabase/seed.sql`.

Para reaplicar as senhas iniciais (cuidado: sobrescreve senhas já trocadas):

```bash
SEED_RESET_PASSWORDS=1 npm run seed
```

No primeiro login o aluno é obrigado a trocar a senha inicial.

Euller Pedro (`euller.pedro`) entra como **SUPER ADMIN**.

Login do Kauã Miranda: `kauã.miranda` (também funciona `kaua.miranda`).

## 6. Como configurar o Storage

O `schema.sql` já cria o bucket privado `payment-proofs` com RLS:

- o aluno só envia arquivos na pasta do próprio `user id`
- o aluno só lê os próprios comprovantes
- administradores leem todos
- o bucket **não** é público

Se precisar criar na interface: **Storage → New bucket → payment-proofs → Private**.

## 7. Como configurar o `.env.local`

```bash
cp .env.example .env.local
```

Preencha:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_PIX_KEY=pedroeuller367@gmail.com
NEXT_PUBLIC_PIX_QR_IMAGE=
```

- Use a **publishable key** dos projetos novos ou a **anon key** dos projetos antigos.
- `SUPABASE_SERVICE_ROLE_KEY` é secreta: só o script de seed usa. Nunca coloque `NEXT_PUBLIC_` nela.
- Para substituir o QR Code, coloque a imagem em `public/pix-qr.png` e defina `NEXT_PUBLIC_PIX_QR_IMAGE=/pix-qr.png`.

## 8. Como executar localmente

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Fluxo do aluno no celular:

1. Entrar
2. Ver os 15 números
3. Tocar em um disponível
4. Pagar o PIX de R$ 5,00
5. Enviar a foto do comprovante
6. O número fica **PEGO**

## 9. Como fazer build

```bash
npm run lint
npm run verify:data
npm run build
npm start
```

## 10. Como fazer deploy na Vercel

1. Envie o repositório para o GitHub.
2. Importe o projeto em [https://vercel.com/new](https://vercel.com/new).
3. Framework: Next.js.
4. Cadastre as mesmas variáveis do `.env.local` (exceto a `service_role`, se o seed for só local).
5. Faça o deploy.

Depois do deploy:

- rode o SQL (`schema.sql`) no projeto Supabase de produção
- rode `npm run seed` apontando para as credenciais de produção
- em **Authentication → URL Configuration**, coloque o domínio da Vercel

## Regras de segurança (RLS)

- Aluno comum vê só os próprios números e comprovantes.
- Aluno não acessa `/admin`.
- Aluno não altera o próprio `role`, o dono do número nem registros de outros.
- Admin vê a rifa inteira, pode liberar números e corrigir registros.
- Só o SUPER ADMIN promove/remove administradores.
- Administradores comuns **não** criam outro SUPER ADMIN.
- O registro do número usa `SELECT … FOR UPDATE` + `UPDATE … WHERE status = 'DISPONIVEL'` + unique em `numeros.numero` e `registros.numero_id`. Duas vendas do mesmo número ao mesmo tempo: só uma entra.

## PIX

Chave inicial: `pedroeuller367@gmail.com`

O componente `PixCard` mostra um placeholder claramente identificado. Substitua pelo QR real quando tiver.

## Estrutura

```text
src/app              rotas (home, login, painel, admin)
src/components       Navbar, NumberBall, PaymentModal, painéis...
src/lib/actions      server actions (auth, registro, admin)
src/lib/supabase     clientes SSR / browser
supabase/schema.sql  banco, RLS, storage
scripts/seed.mjs     Auth + perfis + 435 números
```
