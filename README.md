# Rifa Feira dos Países 2026 🇺🇸

Sistema completo da rifa escolar da turma dos **Estados Unidos** na Feira dos Países 2026.

Cada número custa **R$ 5,00**. São **29 alunos**, **15 números por aluno** e **435 números** no total (potencial de **R$ 2.175,00**).

Stack:

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS
- Firebase Authentication, Cloud Firestore e Cloud Storage

O site não usa o SDK do Firebase no navegador. Login, números e comprovantes passam pelo servidor (`firebase-admin`) com cookie HTTP-only.

## 1. Instalar dependências

```bash
npm install
```

## 2. Configurar o Firebase

1. Crie um projeto em [https://console.firebase.google.com](https://console.firebase.google.com).
2. Ative **Authentication → Sign-in method → Email/Password**.
3. Crie um banco **Cloud Firestore** (modo de produção; as regras do repositório bloqueiam escrita pelo cliente).
4. Ative **Storage**.
5. Em **Project settings → Service accounts**, gere uma chave JSON da conta de serviço.

O login do site usa o **login da turma** (ex.: `euller.pedro`), não o e-mail. O sistema converte o login em um e-mail interno (`…@alunos.rifafeiradospaises.local`) só para o Firebase Auth. As senhas **nunca** são salvas em texto puro: o Auth guarda o hash.

A autorização **não** usa o e-mail do usuário. O cargo (`student`, `admin`, `super_admin`) fica no documento `profiles/{uid}` e na custom claim `role` (definida só pelo Admin SDK).

As regras em `firestore.rules` e `storage.rules` são um protótipo para revisão: o cliente não escreve no Firestore/Storage; o servidor usa o Admin SDK depois de validar a sessão.

## 3. Como criar as coleções

Não há SQL. O seed cria:

- `profiles/{uid}` — nome, login, e-mail interno, cargo, troca de senha
- `numeros/{1..435}` — dono, status DISPONÍVEL/PEGO
- `registros/{numero}` — 1:1 com o número (comprador, telefone, comprovante)
- `stats/public` — totais da home (sem dados pessoais)

## 4. Como publicar regras e índices

```bash
npx -y firebase-tools@latest login
npx -y firebase-tools@latest use SEU_PROJECT_ID
npx -y firebase-tools@latest deploy --only auth,firestore,storage
```

Arquivos:

```text
firebase.json
firestore.rules
firestore.indexes.json
storage.rules
```

## 5. Como executar o seed

O seed cria os 29 usuários no Auth, os perfis, os 435 números e o documento de estatísticas.

```bash
npm run seed
```

Requer a conta de serviço no `.env.local`.

Para reaplicar as senhas iniciais (cuidado: sobrescreve senhas já trocadas):

```bash
SEED_RESET_PASSWORDS=1 npm run seed
```

No primeiro login o aluno é obrigado a trocar a senha inicial.

Euller Pedro (`euller.pedro`) entra como **SUPER ADMIN**.

Login do Kauã Miranda: `kauã.miranda` (também funciona `kaua.miranda`).

## 6. Como configurar o Storage

O bucket fica privado. As regras em `storage.rules` **negam** leitura e escrita pelo cliente.

Comprovantes sobem só pelo Admin SDK, no caminho:

```text
payment-proofs/{uid}/{numeroId}/{arquivo}
```

URLs assinadas (1 minuto) são geradas no servidor para o painel admin.

## 7. Como configurar o `.env.local`

```bash
cp .env.example .env.local
```

Preencha:

```bash
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_API_KEY=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_PIX_KEY=pedroeuller367@gmail.com
NEXT_PUBLIC_PIX_QR_IMAGE=
```

- `FIREBASE_API_KEY` é a Web API Key do projeto (login no servidor).
- A chave da conta de serviço é secreta. Nunca use prefixo `NEXT_PUBLIC_` nela.
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
4. Cadastre as mesmas variáveis do `.env.local`.
5. Em **Authentication → Settings → Authorized domains**, adicione o domínio da Vercel.
6. Faça o deploy.

Depois do deploy:

- publique regras e índices (`firebase deploy --only auth,firestore,storage`)
- rode `npm run seed` apontando para as credenciais de produção

## Regras de segurança

- Aluno comum vê só os próprios números.
- Aluno não acessa `/admin`.
- Aluno não altera o próprio `role`, o dono do número nem registros de outros (escritas do cliente estão bloqueadas).
- Admin vê a rifa inteira, pode liberar números e corrigir registros.
- Só o SUPER ADMIN promove/remove administradores.
- Administradores comuns **não** criam outro SUPER ADMIN.
- O registro do número usa transação no Firestore: status `DISPONIVEL` + documento `registros/{numero}` criado com `create`. Duas vendas do mesmo número ao mesmo tempo: só uma entra.

## PIX

Chave inicial: `pedroeuller367@gmail.com`

O componente `PixCard` mostra um placeholder claramente identificado. Substitua pelo QR real quando tiver.

## Estrutura

```text
src/app              rotas (home, login, painel, admin)
src/components       Navbar, NumberBall, PaymentModal, painéis...
src/lib/actions      server actions (auth, registro, admin)
src/lib/firebase     Admin SDK, sessão, transações
firestore.rules      regras do Firestore
storage.rules        regras do Storage
scripts/seed.mjs     Auth + perfis + 435 números
```
