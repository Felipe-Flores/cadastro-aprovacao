-- =====================================================================
-- Gestão de Acesso e Reset de Senha — criação das tabelas (PostgreSQL)
-- Referência: docs/PRDGestaoAcesso.md
--
-- Em produção o TypeORM roda com synchronize: false, então as tabelas
-- precisam ser criadas por este script ANTES do deploy.
--
-- Gerado a partir do schema criado pelo TypeORM para as entidades
-- backend/src/gestao-acesso/*.entity.ts. Os nomes das constraints (PK_/FK_)
-- são os mesmos que o TypeORM gera, para não haver divergência caso o
-- synchronize seja ligado no futuro.
--
-- Idempotente: pode ser executado mais de uma vez sem erro.
-- =====================================================================

BEGIN;

-- Solicitações de acesso e de reset de senha
CREATE TABLE IF NOT EXISTS public.solicitacoes_acesso (
    id                    SERIAL                       NOT NULL,
    tipo                  character varying            NOT NULL,  -- 'acesso' | 'reset_senha'
    matricula             character varying(20)        NOT NULL,
    nome                  character varying(100)       NOT NULL,
    empresa               character varying(50)        NOT NULL,
    email                 character varying(100),
    telefone              character varying(20),                  -- apenas dígitos; obrigatório no tipo 'acesso'
    estado                character varying(2)         NOT NULL,
    cidade                character varying(50)        NOT NULL,
    observacao            character varying(150),                 -- sistemas pedidos pelo solicitante
    status                character varying            NOT NULL DEFAULT 'Não Iniciado',
    matricula_solicitante character varying            NOT NULL,
    nome_solicitante      character varying            NOT NULL,
    id_chamado            character varying(50),
    responsavel_aprovacao character varying(100),
    sistemas_tags         text,                                   -- JSON (simple-json do TypeORM)
    observacao_tratativa  character varying(150),                 -- parecer do reset / andamento do acesso
    observacao_final      character varying(150),
    matricula_responsavel character varying,
    nome_responsavel      character varying,
    data_criacao          timestamp without time zone  NOT NULL DEFAULT now(),
    data_modificacao      timestamp without time zone  NOT NULL DEFAULT now(),
    data_conclusao        timestamp without time zone,
    CONSTRAINT "PK_b2491c0ed3d90f2c2cc7c73f642" PRIMARY KEY (id)
);

-- Histórico de todas as ações realizadas em cada solicitação
CREATE TABLE IF NOT EXISTS public.solicitacoes_acesso_historico (
    id                SERIAL                       NOT NULL,
    solicitacao_id    integer                      NOT NULL,
    acao              character varying            NOT NULL,  -- Criação, Início, Atualização, Pendente, Conclusão
    status_anterior   character varying,
    status_novo       character varying            NOT NULL,
    descricao         text,
    matricula_usuario character varying            NOT NULL,
    nome_usuario      character varying            NOT NULL,
    data              timestamp without time zone  NOT NULL DEFAULT now(),
    CONSTRAINT "PK_35c892777b93828b2c89fd76706" PRIMARY KEY (id),
    CONSTRAINT "FK_b775b6766e99b097785c6ab5be1" FOREIGN KEY (solicitacao_id)
        REFERENCES public.solicitacoes_acesso (id) ON DELETE CASCADE
);

COMMIT;
