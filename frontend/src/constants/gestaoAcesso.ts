// Mesmas listas de backend/src/gestao-acesso/gestao-acesso.constants.ts

export type TipoSolicitacao = 'acesso' | 'reset_senha';

export type StatusSolicitacao = 'Não Iniciado' | 'Iniciado' | 'Pendente' | 'Concluído';

export const STATUS: StatusSolicitacao[] = ['Não Iniciado', 'Iniciado', 'Pendente', 'Concluído'];

export const TIPO_LABEL: Record<TipoSolicitacao, string> = {
  acesso: 'Solicitação de Acesso',
  reset_senha: 'Reset de Senha',
};

// Cidades atendidas por estado (GO e DF ficam fora nesta primeira versão)
export const CIDADES_POR_ESTADO: Record<string, string[]> = {
  MS: ['Campo Grande', 'Três Lagoas', 'Dourados'],
  MT: [
    'Cuiabá',
    'Várzea Grande',
    'Tangará da Serra',
    'Nova Mutum',
    'Sinop',
    'Rondonópolis',
    'Lucas do Rio Verde',
    'Campo Verde',
    'Primavera do Leste',
  ],
  RO: ['Ji-Paraná'],
};

export const ESTADOS = Object.keys(CIDADES_POR_ESTADO);

// Exibe o ID com no mínimo 4 dígitos (ex: 1 -> 0001)
export const formatId = (id: number) => String(id).padStart(4, '0');
