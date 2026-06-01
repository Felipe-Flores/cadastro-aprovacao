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
- **Interface**: Design limpo com feedbacks visuais via Toasts e modais de confirmação.

## 📦 Como rodar o projeto

### Pré-requisitos
- **Node.js**: Versão 18 ou superior.
- **PostgreSQL**: Instalado e em execução.
- **Git**: Para clonar o repositório.

### 1. Configuração do Banco de Dados
1. Abra o seu gerenciador de banco de dados (ex: pgAdmin ou DBeaver).
2. Crie um novo banco de dados chamado `aprovacao_db` (ou o nome que preferir).

### 2. Configuração do Backend
1. Acesse a pasta `backend`.
2. Instale as dependências do NestJS:
   ```bash
   npm install
   ```
3. Crie um arquivo `.env` na raiz da pasta `/backend` e configure as chaves:
   - `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`.
   - `JWT_SECRET` (Uma string longa para segurança do token).
4. Inicie o servidor:
   ```bash
   npm run start:dev
   ```

### 3. Configuração do Frontend
1. Acesse a pasta `frontend`.
2. Instale as dependências do React/Vite:
   ```bash
   npm install
   ```
3. Inicie a aplicação:
   ```bash
   npm run dev
   ```

A aplicação estará disponível em `http://localhost:5173` e o servidor em `http://localhost:3000`.