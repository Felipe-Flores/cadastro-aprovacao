# Especificação Funcional: Módulo de Gestão de Acesso e Reset de Senha

---

## 1. Visão Geral
Este documento especifica a criação da funcionalidade de **Gestão de Acesso** e **Reset de Senha**, permitindo que usuários façam solicitações e que a equipe de **Gestores Master** efetue a tratativa, acompanhamento e histórico das demandas.

---

## 2. Estrutura e Interface do Usuário

### 2.1 Menu Principal
* **Localização:** Topo da página inicial.
* **Ação:** Adicionar o menu **"Gestão de Acesso"**.
* **Comportamento:** Ao clicar no menu, o usuário é direcionado para a tela principal de Gestão de Acesso.

### 2.2 Tela Principal (Visão do Solicitante)
A tela contém:
1. **Botões de Ação (Aba Superior Central):**
   * `[Solicitação de Acesso]`
   * `[Reset de Senha]`
2. **Tabela de Acompanhamento:** Exibe todas as solicitações já realizadas pelo usuário logado.

---

## 3. Passo a Passo: Solicitação de Acesso

### Passo 1: Abertura do Formulário
* O usuário clica no botão **"Solicitação de Acesso"**.
* O sistema exibe um formulário de solicitação.

### Passo 2: Preenchimento do Formulário (Regras de Campos)

| Campo | Tipo / Formato | Obrigatoriedade | Regras de Negócio |
| :--- | :--- | :--- | :--- |
| **ID** | Primary Key | Automático | Preenchido automaticamente pelo sistema. Mínimo de 4 caracteres (ex: `0001`). |
| **Matrícula** | `VARCHAR(20)` | `NOT NULL` | Sem espaços no início/fim (`TRIM`). Converter automaticamente para letras **MAIÚSCULAS**. |
| **Nome** | `VARCHAR(100)` | `NOT NULL` | Converter automaticamente para letras **MAIÚSCULAS**. |
| **Empresa** | `VARCHAR(50)` | `NOT NULL` | Sem espaços no início/fim (`TRIM`). Converter automaticamente para letras **MAIÚSCULAS**. |
| **E-mail** | `VARCHAR(100)` | Opcional | Formato válido de e-mail. |
| **Telefone** | `NUMBER` | `NOT NULL` | Apenas números. |
| **Estado** | Dropdown | `NOT NULL` | Opções do Centro-Oeste: `MT`, `MS`, `GO`, `DF`. |
| **Cidade** | Dropdown | `NOT NULL` | Opções: `Campo Grande`, `Três Lagoas`, `Dourados`, `Tangará da Serra`, `Cuiabá`, `Várzea Grande`, `Nova Mutum`, `Sinop`, `Rondonópolis`, `Lucas do Rio Verde`, `Campo Verde`, `Ji-Paraná`, `Primavera do Leste`. |
| **Observação** | `VARCHAR(150)` | Opcional | O usuário especifica os sistemas nos quais solicita o acesso. |

### Passo 3: Envio ou Cancelamento
* **Botão "Enviar":** Valida os campos obrigatórios, salva a solicitação e insere o item na fila dos Gestores Master com o status **"Não Iniciado"**.
* **Botão "Cancelar":** Cancela a ação sem salvar os dados e fecha o formulário.

---

## 4. Passo a Passo: Reset de Senha

### Passo 1: Abertura do Formulário
* O usuário clica no botão **"Reset de Senha"**.

### Passo 2: Preenchimento do Formulário
O formulário solicitará apenas os seguintes campos:
1. **Estado** *(Dropdown com MT, MS, GO, DF)*
2. **Cidade** *(Dropdown com a lista de cidades parametrizadas)*
3. **Empresa** *(Texto - Automaiúsculo)*
4. **Matrícula** *(Texto - Automaiúsculo)*
5. **Nome** *(Texto - Automaiúsculo)*

### Passo 3: Envio
* Ao clicar em **"Enviar"**, a solicitação entra diretamente na fila de atendimento do Gestor Master com o status **"Não Iniciado"**.

---

## 5. Painel e Fila do Gestor Master

### 5.1 Visão Geral da Tabela do Gestor Master
A tabela de trabalho exibe as colunas:
* `Estado` | `Cidade` | `Solicitante` | `Empresa` | `Status` | `Ações`

### 5.2 Ordenação e Filtros
* **Ordenação Automática (Prioridade):**
  1. Registros com status **"Não Iniciado"** no topo.
  2. Registros com status **"Pendente"** na sequência.
* **Filtros Disponíveis na Tela:**
  * Por **Estado**
  * Por **Cidade**
  * Por **Solicitante**
  * Por **Status**
* **Busca por ID do Chamado:**
  * Campo específico para pesquisar e exibir atividades já concluídas (visto que elas somem da lista padrão após a conclusão).

---

## 6. Passo a Passo: Tratativa pelo Gestor Master

```
  +-----------------+      Clicar "Iniciar"     +-----------------+
  |  Não Iniciado   | ------------------------> |    Iniciado     |
  +-----------------+                           +-----------------+
                                                         |
                                             Aguardar liberação parcial
                                                         v
  +-----------------+      Concluir Tudo        +-----------------+
  |    Concluído    | <------------------------ |    Pendente     |
  +-----------------+                           +-----------------+
  (Oculto da visão)
```

### Passo 1: Iniciar a Atividade
1. O Gestor Master localiza a solicitação na tabela.
2. Clica no botão **"Iniciar"** presente ao lado do status.
3. O status altera automaticamente para **"Iniciado"** e a modal de detalhes da atividade é exibida.

### Passo 2: Tratativa de Solicitação de Acesso (Modal)
Dentro da modal de detalhes, o Gestor Master deve preencher:
* **ID do Chamado Aberto:** Código do chamado no sistema de suporte.
* **Nome do Responsável para Aprovação:** Nome da pessoa que aprovou a concessão.
* **Sistemas/Solicitações (Formato Tags):** Registro em formato de tags para identificar o que foi pedido (Ex: `Sistema: Portal de Material`, `Toa Técnico`).
* **Histórico da Atividade:** A modal deve registrar e exibir todo o histórico de alterações da solicitação, desde a criação até a conclusão final.

#### A. Tratar Etapa Parcial / Pendência
* Caso nem todos os sistemas possam ser liberados de imediato (ex: dependência de liberação prévia de outros acessos), o gestor atualiza as observações/tags e altera o status para **"Pendente"**.
* A solicitação é salva e permanece visível na fila do gestor.

#### B. Finalizar Solicitação de Acesso
1. Quando todos os acessos solicitados forem concluídos, o gestor altera o status para **"Concluído"**.
2. Preenche o campo **Observação Final** (`VARCHAR(150)`).
3. Ao salvar, a atividade é marcada como concluída e **some da lista principal de trabalho**.

### Passo 3: Tratativa de Reset de Senha (Modal)
1. O Gestor Master clica em **"Iniciar"** na linha da solicitação de Reset de Senha.
2. É exibida a modal com os dados do solicitante.
3. O Gestor realiza o reset da senha no sistema correspondente.
4. Preenche a **Observação** (`VARCHAR(150)`).
5. Modifica o status para **"Concluído"** e salva.
6. A solicitação é finalizada e **some da lista principal de trabalho**.