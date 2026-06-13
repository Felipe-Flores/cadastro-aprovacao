# Sistema de Aprovação 🚀

Este é um sistema Full Stack desenvolvido para gerenciar usuários e fluxos de aprovação, focado em segurança, padronização de dados e usabilidade.

## 🛠️ Tecnologias Utilizadas

### Backend
- **NestJS**: Framework progressivo para Node.js.
- **PostgreSQL**: Banco de dados relacional robusto.
- **TypeORM**: Integração transparente com o banco de dados.
- **Bcrypt**: Criptografia de senhas (Hashing).
- **JWT (JSON Web Token)**: Autenticação segura entre as camadas.

### Frontend
- **React**: Biblioteca para construção de interfaces.
- **Tailwind CSS**: Estilização moderna e responsiva.
- **Lucide React**: Conjunto de ícones minimalistas.
- **React Router v6**: Gerenciamento de rotas e navegação.

## ✨ Funcionalidades Implementadas

- **Segurança**: Autenticação completa e senhas protegidas com Bcrypt.
- **Controle de Acesso (RBAC)**: Níveis diferenciados para `Solicitante`, `Gestor` e `Gestor Master`.
- **Gestão de Usuários**: CRUD completo com validação de senha (mínimo 4 caracteres).
- **Padronização**: Conversão automática de Matrícula e Nome para letras maiúsculas.
- **Fluxo de Visibilidade**: Atividades concluídas desaparecem da fila de aprovação dos gestores, permanecendo visíveis apenas para o solicitante.
- **Interface**: Design limpo com feedbacks visuais via Toasts e modais de confirmação.

## 📦 Como rodar o projeto

### Pré-requisitos
- **Node.js**: Versão 18.x ou superior.
- **PostgreSQL**: Banco de dados relacional instalado e rodando.
- **Git**: Para clonagem e controle de versão.
- **NPM**: Gerenciador de pacotes (instalado junto com o Node).

### 🛠️ Passo a Passo para Instalação

#### 1. Configuração do Banco de Dados
1. Abra o seu gerenciador de banco de dados (ex: pgAdmin ou DBeaver).
2. Crie um novo banco de dados chamado `aprovacao_app`.

#### 2. Configuração do Backend
1. Acesse a pasta `backend`.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie um arquivo `.env` na raiz da pasta `/backend` com as seguintes variáveis:
   ```env
   DATABASE_URL=postgresql://seu_usuario:sua_senha@localhost:5432/aprovacao_app
   JWT_SECRET=sua_chave_secreta_aqui
   NODE_ENV=development

   # Opcional: apenas para criar o primeiro admin (uma única vez)
   SETUP_ADMIN_SECRET=um_segredo_forte_para_setup
   SETUP_ADMIN_PASSWORD=senha_forte_do_admin
   ```
4. Inicie o servidor:
   ```bash
   npm run start:dev
   ```

5. **Primeiro acesso (opcional):** se o banco estiver vazio, crie o admin inicial com:
   ```bash
   curl -H "x-setup-secret: um_segredo_forte_para_setup" http://localhost:3000/setup-admin
   ```
   Depois faça login com matrícula `ADMIN` e a senha definida em `SETUP_ADMIN_PASSWORD`. Remova `SETUP_ADMIN_SECRET` do `.env` após o setup.

#### 3. Configuração do Frontend
1. Acesse a pasta `frontend`.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie a aplicação:
   ```bash
   npm run dev
   ```

A aplicação estará disponível em `http://localhost:5173` e o servidor em `http://localhost:3000`.

## 🚀 Deploy Gratuito (Passo a Passo)

### 1. Banco de Dados (Neon.tech)
1. Crie uma conta no Neon.tech.
2. Crie um projeto chamado `aprovacao-app`.
3. Copie a **Connection String** (se parece com `postgres://user:password@host/neondb`).

### 2. Backend (Render.com)
1. Crie uma conta no Render e conecte seu GitHub.
2. Clique em **New > Web Service**.
3. Selecione o repositório do projeto.
4. **Root Directory**: `backend`
5. **Build Command**: `npm install && npm run build`
6. **Start Command**: `node dist/main`
7. Em **Environment Variables**, adicione:
   - `DATABASE_URL`: (A string que você copiou do Neon)
   - `JWT_SECRET`: (Sua chave secreta — obrigatória)
   - `NODE_ENV`: `production`
   - `PORT`: `3000`

### 3. Frontend (Vercel)
1. Crie uma conta na Vercel.
2. Importe o seu repositório do GitHub.
3. **Framework Preset**: Vite.
4. **Root Directory**: `frontend`
5. Em **Environment Variables**, adicione:
   - `VITE_API_URL`: (A URL que o Render gerou para o seu Backend).
6. Clique em **Deploy**.

---
Desenvolvido por Felipe.