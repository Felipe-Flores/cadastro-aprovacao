# PRD — Gestão de Acesso e Reset de Senha

## 1. Contexto e Objetivo

Hoje não existe no Portal de Aprovação um canal formal para os usuários pedirem **acesso a sistemas** ou **reset de senha**. O objetivo é criar o módulo **Gestão de Acesso**, onde qualquer usuário logado abre solicitações e os **Gestores Master** tratam essas solicitações em uma fila, com status, tags de sistemas e histórico completo.

Fonte: `docs/documento_de_requisitos.md` e `docs/Brainstorming_gestao_acesso.txt`.

### Regras de negócio

- Novo item **"Gestão de Acesso"** na navbar do `Dashboard.tsx`, visível para **todos os cargos**, levando à rota `/gestao-acesso`.
- **Visão do solicitante** (qualquer cargo diferente de `gestor-master`): botões `[Solicitação de Acesso]` e `[Reset de Senha]` no topo central + tabela com **apenas as próprias solicitações** (inclusive concluídas).
- **Visão do Gestor Master**: fila de trabalho com todas as solicitações **não concluídas**, e busca por ID para localizar as concluídas. O Gestor Master também tem os dois botões, para abrir solicitações próprias.
- Dois tipos de solicitação: `acesso` e `reset_senha`. Ambos nascem com status **"Não Iniciado"**.
- Fluxo de status:
  - `Não Iniciado` → **Iniciar** → `Iniciado` (abre a modal automaticamente)
  - `Iniciado` → `Pendente` (liberação parcial; apenas no tipo `acesso`)
  - `Iniciado` ou `Pendente` → `Concluído` (exige **Observação Final**)
  - `Pendente` pode ser editado várias vezes (novas tags/observações) antes de concluir.
- Concluído **some da fila** do Gestor Master; continua visível para o solicitante.
- **Uma solicitação concluída não pode ser reaberta nem editada.** Se precisar de algo novo, o solicitante abre outra solicitação.
- **Reset de senha:** o reset é feito **em outro sistema**, fora do Portal. Aqui o Gestor Master apenas registra um **parecer** (até 150 caracteres) e conclui. O Portal não altera nenhuma senha.
- Ordenação automática da fila: `Não Iniciado` → `Pendente` → `Iniciado`; dentro de cada grupo, as mais antigas primeiro.
- Filtros da fila: **Estado**, **Cidade**, **Solicitante** e **Status**. Colunas ordenáveis por clique, como no Dashboard.
- **Histórico**: toda criação, mudança de status e edição da tratativa gera um registro (data/hora, quem fez, ação, status anterior → novo, observação). O histórico é exibido na modal.
- ID exibido com no mínimo 4 dígitos (`0001`), usando `String(id).padStart(4, '0')`.
- Normalização (frontend no `onChange` + backend no service): `matricula` e `empresa` com `trim` + MAIÚSCULAS; `nome` em MAIÚSCULAS; `telefone` somente dígitos.
- A validação de permissão é feita **no backend**. A tela apenas esconde botões.

### Listas parametrizadas

- **Estados:** `MS`, `MT`, `RO` (GO e DF ficam fora nesta primeira versão)
- **Cidades por estado** (o select de Cidade depende do Estado escolhido):

| Estado | Cidades |
|---|---|
| `MS` | Campo Grande, Três Lagoas, Dourados |
| `MT` | Cuiabá, Várzea Grande, Tangará da Serra, Nova Mutum, Sinop, Rondonópolis, Lucas do Rio Verde, Campo Verde, Primavera do Leste |
| `RO` | Ji-Paraná |

- O mapa `CIDADES_POR_ESTADO` fica em um arquivo compartilhado do frontend (`frontend/src/constants/gestaoAcesso.ts`), e uma cópia fica no backend (`gestao-acesso.constants.ts`).
- No frontend, ao trocar o Estado, o campo Cidade é limpo e as opções são filtradas.
- No backend, `estado` é validado com `@IsIn(ESTADOS)`, e o service confere se a `cidade` pertence ao `estado` informado (`BadRequestException` se não pertencer).

### Modelo de dados

**Tabela `solicitacoes_acesso`** (`backend/src/gestao-acesso/solicitacao-acesso.entity.ts`)

| Campo | Tipo | Observação |
|---|---|---|
| `id` | PK auto | Exibido como `0001` |
| `tipo` | varchar | `acesso` \| `reset_senha` |
| `matricula` | varchar(20) | NOT NULL, trim + maiúsculo |
| `nome` | varchar(100) | NOT NULL, maiúsculo |
| `empresa` | varchar(50) | NOT NULL, trim + maiúsculo |
| `email` | varchar(100) | Opcional, `@IsEmail` (só no tipo acesso) |
| `telefone` | varchar(20) | Obrigatório no tipo acesso; só dígitos (varchar para preservar zeros à esquerda) |
| `estado` | varchar(2) | NOT NULL |
| `cidade` | varchar(50) | NOT NULL |
| `observacao` | varchar(150) | Opcional; sistemas pedidos pelo solicitante |
| `status` | varchar | Default `Não Iniciado` |
| `matricula_solicitante` / `nome_solicitante` | varchar | Preenchidos pelo JWT de quem abriu |
| `id_chamado` | varchar(50) | Preenchido pelo Gestor Master |
| `responsavel_aprovacao` | varchar(100) | Preenchido pelo Gestor Master |
| `sistemas_tags` | `simple-json` (string[]) | Tags, ex.: `Sistema: Portal de Material`, `Toa Técnico` |
| `observacao_tratativa` | varchar(150) | Parecer do reset de senha / observação de andamento do acesso |
| `observacao_final` | varchar(150) | Obrigatória ao concluir |
| `matricula_responsavel` / `nome_responsavel` | varchar | Gestor Master que iniciou/tratou |
| `data_criacao` / `data_modificacao` / `data_conclusao` | timestamp | Create/Update automáticos; conclusão setada no service |

**Tabela `solicitacoes_acesso_historico`** (`solicitacao-acesso-historico.entity.ts`)

| Campo | Tipo |
|---|---|
| `id` | PK auto |
| `solicitacao_id` | FK → `solicitacoes_acesso` (ManyToOne, `onDelete: CASCADE`) |
| `acao` | varchar (`Criação`, `Início`, `Atualização`, `Pendente`, `Conclusão`) |
| `status_anterior` / `status_novo` | varchar |
| `descricao` | text (resumo do que mudou: tags, chamado, observação) |
| `matricula_usuario` / `nome_usuario` | varchar |
| `data` | CreateDateColumn |

### Endpoints (todos com `JwtAuthGuard`)

| Método | Rota | Quem | Descrição |
|---|---|---|---|
| `POST` | `/gestao-acesso` | Todos | Cria solicitação (`tipo` no body) + histórico "Criação" |
| `GET` | `/gestao-acesso/minhas` | Todos | Solicitações do usuário logado |
| `GET` | `/gestao-acesso/fila` | `gestor-master` | Não concluídas, com filtros opcionais `estado`, `cidade`, `solicitante`, `status` |
| `GET` | `/gestao-acesso/busca?termo=` | `gestor-master` | Busca por ID da solicitação **ou** `id_chamado` (inclui concluídas) |
| `GET` | `/gestao-acesso/:id` | Dono ou `gestor-master` | Detalhe + histórico |
| `PATCH` | `/gestao-acesso/:id/iniciar` | `gestor-master` | `Não Iniciado` → `Iniciado` |
| `PATCH` | `/gestao-acesso/:id/tratativa` | `gestor-master` | Atualiza campos da tratativa e/ou status (`Pendente`/`Concluído`) validando as transições |

---

## 2. Fases e Tasks

### Fase 1 — Backend: modelo de dados

- [v] Criar a pasta `backend/src/gestao-acesso/`
- [v] Criar `solicitacao-acesso.entity.ts` conforme a tabela `solicitacoes_acesso` acima
- [v] Criar `solicitacao-acesso-historico.entity.ts` com a relação `ManyToOne` para a solicitação (`OneToMany` no lado da solicitação)
- [v] Criar constantes compartilhadas do backend (`gestao-acesso.constants.ts`): `TIPOS`, `STATUS`, `ESTADOS` (`MS`, `MT`, `RO`) e `CIDADES_POR_ESTADO`
- [v] Registrar as entidades em `backend/src/app.module.ts` (array `entities`); em dev, a tabela é criada via `synchronize`
- [ ] Documentar no PR que, em produção (`synchronize: false`), as tabelas precisam ser criadas manualmente/migração

### Fase 2 — Backend: regras e API

- [v] Criar os DTOs com `class-validator`:
  - `create-solicitacao-acesso.dto.ts`: `tipo` (`@IsIn`), `matricula` (`@MaxLength(20)`), `nome` (`@MaxLength(100)`), `empresa` (`@MaxLength(50)`), `estado` (`@IsIn(ESTADOS)`), `cidade` (`@IsNotEmpty`; o vínculo com o estado é validado no service), `email` (`@IsOptional @IsEmail`), `telefone` (`@Matches(/^\d+$/)`, obrigatório quando `tipo = acesso` via `@ValidateIf`), `observacao` (`@IsOptional @MaxLength(150)`)
  - `tratativa.dto.ts`: `id_chamado`, `responsavel_aprovacao`, `sistemas_tags` (`@IsArray @IsString({ each: true })`), `observacao_tratativa`, `observacao_final` (`@MaxLength(150)`), `status` (`@IsIn(['Pendente','Concluído'])`, opcional)
  - `filtro-fila.dto.ts`: `estado`, `cidade`, `solicitante`, `status` (todos opcionais)
- [v] Criar `gestao-acesso.service.ts`:
  - `criar()`: validar se a `cidade` pertence ao `estado` (via `CIDADES_POR_ESTADO`), normalizar campos (trim/maiúsculo/só dígitos), preencher solicitante pelo JWT, status `Não Iniciado`, gravar histórico "Criação"
  - `listarMinhas()`: filtrar por `matricula_solicitante`, ordenadas por `data_criacao DESC`
  - `listarFila()`: `status != 'Concluído'` + filtros (`solicitante` com `ILIKE` em nome/matrícula) + ordenação `CASE status WHEN 'Não Iniciado' THEN 0 WHEN 'Pendente' THEN 1 ELSE 2 END, data_criacao ASC`
  - `buscar(termo)`: por `id` (quando numérico) ou `id_chamado`
  - `detalhar(id, user)`: retorna solicitação + histórico ordenado; `ForbiddenException` se não for dono nem `gestor-master`
  - `iniciar(id, user)`: só permitido em `Não Iniciado`; grava responsável + histórico "Início"
  - `tratar(id, dto, user)`: valida transições (`Pendente` só no tipo `acesso` e a partir de `Iniciado`/`Pendente`; `Concluído` a partir de `Iniciado`/`Pendente`, exigindo `observacao_final` no tipo `acesso` e `observacao_tratativa` (parecer) no tipo `reset_senha`; se o status atual já for `Concluído`, lançar `BadRequestException('Solicitação concluída não pode ser reaberta ou alterada.')`); seta `data_conclusao`; gera histórico descrevendo o que mudou
  - Usar transação (`dataSource.transaction`) para salvar solicitação + histórico juntos
- [v] Criar `gestao-acesso.controller.ts` com as rotas da tabela de endpoints, usando `@Roles('gestor-master')` + `RolesGuard` nas rotas do Gestor Master (mesmo padrão de `aprovacoes.controller.ts`)
- [v] Criar `gestao-acesso.module.ts` (`TypeOrmModule.forFeature([...])`) e importar em `app.module.ts`
- [v] Incluir `empresa` e `matricula` no retorno de `POST /auth/login` (`auth.service.ts`), para o frontend pré-preencher os formulários

### Fase 3 — Frontend: menu, rota e tela do solicitante

- [ ] Adicionar `empresa?: string` ao `User` de `frontend/src/contexts/AuthContext.tsx` e salvá-la em `Login.tsx`
- [ ] Criar `frontend/src/constants/gestaoAcesso.ts` com `ESTADOS`, `CIDADES_POR_ESTADO`, `STATUS` e o helper `formatId(id)` (`padStart(4,'0')`)
- [ ] Criar `frontend/src/pages/GestaoAcesso.tsx` com navbar no padrão do Dashboard (Voltar, nome/cargo, Sair) e redirecionamento para `/login` sem usuário ou em caso de `401`
- [ ] Registrar `<Route path="/gestao-acesso" element={<GestaoAcesso />} />` em `frontend/src/App.tsx`
- [ ] Adicionar botão **"Gestão de Acesso"** (ícone `KeyRound`/`ShieldCheck` do lucide) na navbar de `Dashboard.tsx`, visível para todos os cargos
- [ ] Botões centrais `[Solicitação de Acesso]` e `[Reset de Senha]`
- [ ] Tabela "Minhas Solicitações": ID, Tipo, Estado, Cidade, Data, Status (badge colorido por status); clique na linha abre a modal de detalhes em modo **somente leitura** com o histórico
- [ ] Toasts de sucesso/erro reaproveitando o padrão visual do Dashboard

### Fase 4 — Frontend: formulários de abertura

- [ ] Modal **Solicitação de Acesso** com os campos Matrícula, Nome, Empresa, E-mail, Telefone, Estado (select), Cidade (select) e Observação (textarea com contador `x/150`), pré-preenchidos com os dados do usuário logado e editáveis
- [ ] Normalização no `onChange`: maiúsculo em matrícula/nome/empresa; telefone aceita só dígitos (`replace(/\D/g,'')`); `maxLength` em todos os campos conforme o modelo
- [ ] Select **Cidade** dependente do Estado: fica desabilitado até escolher o Estado, lista apenas as cidades de `CIDADES_POR_ESTADO[estado]` e é limpo ao trocar o Estado
- [ ] Validação client-side dos obrigatórios e do formato de e-mail antes do envio
- [ ] Modal **Reset de Senha** com os campos Estado, Cidade, Empresa, Matrícula e Nome (mesmas regras)
- [ ] Botões **Enviar** (spinner `Loader2` + desabilitado durante o envio) e **Cancelar** (fecha sem salvar; tecla Esc também fecha)
- [ ] Após enviar: toast de sucesso, fechar a modal e recarregar a tabela

### Fase 5 — Frontend: fila do Gestor Master

- [ ] Quando `user.cargo === 'gestor-master'`, renderizar a **Fila de Atendimento** (a tabela "Minhas Solicitações" fica em uma aba secundária)
- [ ] Colunas: ID, Tipo, Estado, Cidade, Solicitante, Empresa, Status e Ações (botão **Iniciar** quando `Não Iniciado`, **Abrir** nos demais)
- [ ] Ordenação padrão vinda do backend (`Não Iniciado` → `Pendente` → `Iniciado`) + ordenação por clique no cabeçalho (padrão `sortConfig` do Dashboard)
- [ ] Barra de filtros: Estado, Cidade (dependente do Estado quando um Estado estiver selecionado), Solicitante (texto) e Status (sem "Concluído"), além do botão "Limpar filtros"
- [ ] Campo **"Buscar por ID / Nº do chamado"** que consulta `/gestao-acesso/busca` e exibe o resultado (inclusive concluídos) com a opção de abrir em modo leitura

### Fase 6 — Frontend: modal de tratativa

- [ ] **Iniciar**: chamar `PATCH /:id/iniciar`, atualizar a linha para `Iniciado` e abrir a modal automaticamente
- [ ] Cabeçalho da modal: todos os dados enviados pelo solicitante (somente leitura)
- [ ] **Tipo acesso**: campos ID do Chamado, Responsável pela Aprovação, **Sistemas (tags)**, Observação Final e select de Status (`Pendente` / `Concluído`)
- [ ] Criar o componente `TagInput` (`frontend/src/components/TagInput.tsx`): adiciona tag com Enter ou vírgula, remove no "x", sem duplicadas
- [ ] **Tipo reset_senha**: aviso "O reset é realizado no sistema externo; registre aqui apenas o parecer", campo **Parecer** (obrigatório, 150 caracteres, com contador) e botão **Concluir**
- [ ] Regras na tela: conclusão do acesso exige Observação Final e conclusão do reset exige Parecer; após concluir, a modal fica **somente leitura, sem opção de reabrir**, e o item sai da fila
- [ ] Seção **Histórico** em timeline (data/hora, usuário, ação, status anterior → novo, descrição), carregada via `GET /:id`
- [ ] Botões Salvar (com spinner) e Fechar; tratar erros do backend (mensagem em array) com toast

### Fase 7 — Verificação

- [ ] `npm run build` em `backend/` e em `frontend/` sem erros
- [ ] Backend (`npm run start:dev`) + frontend (`npm run dev`) e validação manual:
  - solicitante abre acesso e reset; vê só os próprios; campos normalizados (maiúsculas, trim, telefone numérico)
  - validações: obrigatórios, e-mail inválido, limite de 150 caracteres
  - Gestor Master: fila ordenada (Não Iniciado → Pendente), filtros funcionando, Iniciar abre a modal
  - fluxo acesso: Iniciado → Pendente (tags) → nova edição → Concluído com observação final → some da fila → encontrado pela busca por ID e por nº do chamado
  - fluxo reset: Iniciar → parecer → Concluído (tentar concluir sem parecer deve ser bloqueado)
  - Estado × Cidade: trocar o Estado limpa a Cidade e filtra as opções; via API, enviar `MS` + `Cuiabá` retorna **400**
  - solicitação concluída: `PATCH /:id/tratativa` retorna **400** e a modal não oferece edição
  - histórico registra cada passo com usuário e horário
  - segurança via API direta (curl/Postman com token de solicitante): `/fila`, `/iniciar` e `/tratativa` retornam **403**; `GET /:id` de outro usuário retorna **403**
- [ ] Criar as tabelas no banco de produção antes do deploy (Vercel usa `synchronize: false`)

---

## 3. Decisões tomadas

1. **Estado RO incluído** para comportar Ji-Paraná.
2. **A Cidade depende do Estado.** GO e DF ficam **fora** nesta primeira versão; para incluí-los depois, basta acrescentar as entradas em `CIDADES_POR_ESTADO` (frontend e backend).
3. **O reset de senha é feito em outro sistema.** No Portal, o Gestor Master apenas registra o **parecer** e conclui a solicitação.
4. **Uma solicitação concluída não pode ser reaberta.** O backend bloqueia qualquer alteração após `Concluído`, e o solicitante deve abrir uma nova solicitação.
