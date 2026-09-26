// Tipos de solicitação aceitos pela Gestão de Acesso
export const TIPOS_SOLICITACAO = ['acesso', 'reset_senha'];

// Status do fluxo: Não Iniciado -> Iniciado -> Pendente -> Concluído
export const STATUS_SOLICITACAO = {
  NAO_INICIADO: 'Não Iniciado',
  INICIADO: 'Iniciado',
  PENDENTE: 'Pendente',
  CONCLUIDO: 'Concluído',
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
