# PRD — Tela de Cadastro e Alteração de Usuários

## 1. Contexto e Objetivo

Hoje a rota `/usuarios` (`frontend/src/pages/UsersManagement.tsx`) exibe a lista de usuários e utiliza um **modal** para cadastrar e editar usuários. O objetivo é criar uma **tela dedicada** de cadastro/alteração de usuários, replicando o layout de referência em `docs/telaLoginAprovacao` (card dividido: painel lateral índigo + painel de formulário branco).

### Regras de negócio

- A tela possui como primeiro campo o select **"Ação Desejada"** com as opções: `Novo Usuário` e `Alterar Usuário`.
- Ao escolher **Alterar Usuário**, é exibido um campo para digitar a **matrícula** e um botão **Buscar** para localizar o usuário.
- Se a matrícula não existir, exibir a mensagem **"Usuário inexistente"**.
- Se existir, revelar o formulário preenchido com os dados do usuário e permitir a alteração (botão vira **"Atualizar"**).
- A busca por matrícula será feita **no frontend**, filtrando a lista retornada por `GET /usuarios` (não haverá alteração no backend).
- A tela substituirá o modal atual: os botões "Novo Usuário" e "Editar" da listagem passam a navegar para ela.

### Layout de referência

- Arquivos: `docs/telaLoginAprovacao/code.html`, `DESIGN.md` e `screen.png`.
- Card central (`max-w-5xl`) dividido em 2 colunas:
  - **Painel lateral índigo** (`primary #3525cd`): ícone, título "Gestão de Identidade", texto descritivo, card "Dica de Segurança" e versão (ocultos no mobile).
  - **Painel do formulário** (fundo branco): campos em grid de 2 colunas, labels em small caps, inputs com 48px de altura, borda sutil com foco índigo, botões "Cadastrar" (primário) e "Cancelar" (secundário).
- Ícones: usar `lucide-react` (convenção do projeto) no lugar de Material Symbols.

### Modelo de dados real (backend `user.entity.ts`)

| Campo | Tipo | Observação |
|---|---|---|
| `id` | number | Gerado automaticamente; usado no PATCH/DELETE |
| `matricula` | string | Única; normalizada para maiúsculo |
| `nome` | string | Normalizado para maiúsculo |
| `empresa` | string | Select: TELEMONT, VIVO, ONDACOM, ABILITY, ICOMON |
| `cargo` | string | Select: solicitante, gestor, gestor-master (default: solicitante) |
| `senha` | string | Mín. 4 caracteres; hash bcrypt no backend; nunca retornada pela API |

### Endpoints existentes (todos exigem JWT + role `gestor-master`)

- `GET /usuarios` — lista todos (id, matricula, nome, empresa, cargo)
- `POST /usuarios` — cria usuário
- `PATCH /usuarios/:id` — atualiza usuário (senha vazia deve ser omitida do payload)
- `DELETE /usuarios/:id` — remove usuário

---

## 2. Tasks

### Task 1 — Preparar tema (Tailwind + fonte)

- [v] Editar `frontend/tailwind.config.js` adicionando em `theme.extend.colors` os tokens do mockup: `primary: '#3525cd'`, `on-primary: '#ffffff'`, `primary-container: '#4f46e5'`, `on-primary-container: '#dad7ff'`, `secondary-container: '#6063ee'`, `surface: '#f9f9ff'`, `surface-bright: '#f9f9ff'`, `surface-container-lowest: '#ffffff'`, `surface-container-low: '#f1f3ff'`, `surface-container: '#e9edff'`, `on-surface: '#141b2b'`, `on-surface-variant: '#464555'`, `outline: '#777587'`, `outline-variant: '#c7c4d8'`
- [v] Editar `frontend/tailwind.config.js` adicionando em `theme.extend.fontFamily`: `sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']`
- [v] Editar `frontend/index.html` adicionando no `<head>` o link do Google Fonts da Inter: `https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap` (com `preconnect` para `fonts.googleapis.com` e `fonts.gstatic.com`)

### Task 2 — Criar estrutura da página `UserForm.tsx`

- [v] Criar o arquivo `frontend/src/pages/UserForm.tsx` como componente `export const UserForm: React.FC`
- [v] Implementar a proteção de rota: `useEffect` que redireciona para `/dashboard` se `user.cargo !== 'gestor-master'` (mesmo padrão de `UsersManagement.tsx`)
- [v] Implementar navbar superior no padrão do projeto: botão "Voltar" (ícone `ArrowLeft`) navegando para `/usuarios`, título "Cadastro de Usuários", dados do usuário logado (nome/cargo) e botão "Sair" (logout + navigate `/login`)
- [v] Implementar o card central `max-w-5xl` dividido em `md:flex-row` com borda `outline-variant`, cantos arredondados e sombra suave
- [v] Implementar o painel lateral índigo (`w-full md:w-5/12 bg-primary`): ícone `UserPlus` (lucide) dentro de quadrado arredondado, título "Gestão de Identidade", parágrafo descritivo, card "Dica de Segurança" e texto de versão, ambos ocultos em mobile (`hidden md:block`), com blobs decorativos de fundo como no mockup
- [v] Implementar o painel do formulário (`w-full md:w-7/12 bg-white p-8 md:p-12`)

### Task 3 — Implementar select "Ação Desejada" e alternância de modo

- [v] Criar estado `acao: 'novo' | 'alterar'` (default `'novo'`)
- [v] Renderizar o select **"Ação Desejada"** como primeiro campo do formulário, ocupando as 2 colunas do grid (`md:col-span-2`), com opções "Novo Usuário" e "Alterar Usuário"
- [v] Ao trocar para `'novo'`: limpar formulário, erros e usuário encontrado; exibir formulário completo em branco; botão submit exibe "Cadastrar"
- [v] Ao trocar para `'alterar'`: limpar formulário e erros; exibir **apenas** o campo Matrícula + botão "Buscar"; demais campos ficam ocultos até um usuário ser encontrado
- [v] Manter estado `formData` com `matricula`, `nome`, `empresa`, `cargo` (default `'solicitante'`), `senha`, `confirmarSenha`

### Task 4 — Implementar busca por matrícula (modo Alterar)

- [v] No mount da página, carregar a lista de usuários com `api.get('/usuarios')` e guardar em estado `usuarios: UserData[]` (interface com `id`, `matricula`, `nome`, `empresa`, `cargo`); tratar `401` fazendo logout + navigate `/login`
- [v] Renderizar no modo "alterar" o campo **Matrícula** (ícone `Badge`/similar) ao lado de um botão **"Buscar"**, permitindo disparar a busca também pela tecla Enter
- [v] Implementar `handleBuscar`: normalizar a matrícula digitada para maiúsculo e localizar na lista carregada (comparação case-insensitive)
- [v] Se não encontrar: exibir mensagem inline em vermelho **"Usuário inexistente"** abaixo do campo de matrícula e manter os demais campos ocultos
- [v] Se encontrar: limpar a mensagem de erro, preencher `formData` com `matricula`, `nome`, `empresa`, `cargo` do usuário (senha vazia), guardar `editingUserId` e revelar os demais campos do formulário
- [v] Limpar a mensagem "Usuário inexistente" quando o usuário alterar o valor do campo de matrícula
- [v] Exibir estado de carregamento no botão "Buscar" enquanto a lista inicial ainda não foi carregada (desabilitar busca)

### Task 5 — Implementar formulário completo (campos e validações)

- [v] Campo **Matrícula** + **Empresa** na mesma linha do grid (2 colunas em `md`); Empresa como select com placeholder "Selecione..." e opções: TELEMONT, VIVO, ONDACOM, ABILITY, ICOMON
- [v] Campo **Nome Completo** (`md:col-span-2`) com ícone de pessoa
- [v] Campo **Cargo / Nível de Acesso** (`md:col-span-2`) como select com opções: Solicitante (`solicitante`), Gestor (`gestor`), Gestor Master (`gestor-master`)
- [v] Campo **Senha de Acesso** (`md:col-span-2`) com ícone de cadeado e botão olho (`Eye`/`EyeOff`) para exibir/ocultar; obrigatória apenas no modo "novo"; no modo "alterar" usar placeholder "Deixe em branco para manter"
- [v] Campo **Confirmar Senha** (`md:col-span-2`) com o mesmo padrão de olho; validação client-side: se preenchida e diferente de `senha`, exibir erro inline "As senhas não coincidem" e bloquear o submit
- [v] Aplicar em todos os inputs o estilo do mockup: altura `h-12`, borda `outline-variant`, `rounded-lg`, foco com borda e ring `primary`, labels em small caps (`text-xs font-semibold uppercase tracking-wider text-on-surface-variant`)
- [v] Normalizar `matricula` e `nome` para maiúsculo no `onChange` (padrão já existente no projeto)
- [v] Validar senha com mínimo de 4 caracteres (quando preenchida) exibindo toast de erro

### Task 6 — Implementar ações de submit e cancelar

- [v] Implementar `handleSubmit` no modo "novo": `api.post('/usuarios', { matricula, nome, empresa, cargo, senha })`; em sucesso, navegar para `/usuarios` com `state: { toastMessage: 'Usuário cadastrado com sucesso!', toastType: 'success' }`
- [v] Implementar `handleSubmit` no modo "alterar": montar payload sem `senha`/`confirmarSenha` quando senha estiver vazia e chamar `api.patch('/usuarios/' + editingUserId, payload)`; em sucesso, navegar para `/usuarios` com `state: { toastMessage: 'Usuário atualizado com sucesso!', toastType: 'success' }`
- [v] Em erro de API: extrair `error.response?.data?.message` (tratando array) e exibir toast de erro na própria tela
- [v] Botão submit: estilo primário do mockup (`h-12 bg-primary text-on-primary rounded-lg`), exibir spinner (`Loader2` com `animate-spin`) e desabilitar durante o salvamento; texto "Cadastrar" (novo) ou "Atualizar" (alterar)
- [v] Botão **Cancelar**: estilo secundário (borda `outline-variant`, fundo transparente), navega para `/usuarios`
- [v] Implementar sistema de toast no topo direito (mesmo padrão visual de `UsersManagement.tsx`: verde para sucesso, vermelho para erro, auto-dismiss em 3s)

### Task 7 — Suporte a edição via query param

- [v] Ler `searchParams` da URL (`useSearchParams` do react-router-dom): se existir `?matricula=X`, inicializar `acao = 'alterar'` com o campo preenchido
- [v] Executar a busca automaticamente após o carregamento da lista de usuários quando o query param estiver presente

### Task 8 — Registrar rota

- [v] Editar `frontend/src/App.tsx`: importar `UserForm` e adicionar `<Route path="/usuarios/cadastro" element={<UserForm />} />`

### Task 9 — Integrar listagem à nova tela (remover modal)

- [v] Editar `frontend/src/pages/UsersManagement.tsx`: botão "Novo Usuário" passa a chamar `navigate('/usuarios/cadastro')`
- [v] Editar `frontend/src/pages/UsersManagement.tsx`: botão de editar (lápis) passa a chamar `navigate('/usuarios/cadastro?matricula=' + u.matricula)`
- [v] Remover o modal de cadastro/edição e todo código órfão: estados `isModalOpen`, `isEditMode`, `editingUserId`, `formData`, `showSenha`, handlers `handleCreateUser`, `handleEdit`, `resetForm`, `closeModal`, o `useEffect` da tecla Escape e imports não utilizados
- [v] Adicionar leitura de `location.state` (via `useLocation`) para exibir o toast de sucesso vindo da tela de formulário e limpar o state após exibir (`navigate(location.pathname, { replace: true, state: null })`)
- [v] Manter intactos: listagem, busca, modal de exclusão e toasts existentes

### Task 10 — Verificação

- [v] Rodar `npm run build` em `frontend/` (typecheck + build Vite) sem erros
- [v] Rodar `npm run dev` e validar manualmente: acesso bloqueado para não gestor-master; cadastro de novo usuário; alteração com matrícula existente (formulário preenchido + atualização); alteração com matrícula inexistente (mensagem "Usuário inexistente"); validação de senhas divergentes; senha em branco no modo alterar mantém a atual; navegação "Novo Usuário" e lápis da listagem; toast de sucesso ao voltar para a lista
