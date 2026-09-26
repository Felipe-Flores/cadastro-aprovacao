import React, { useEffect, useState, useContext, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { Modal } from '../components/Modal';
import { SortableHeader } from '../components/SortableHeader';
import { Toast, useToast } from '../components/Toast';
import { AuthContext } from '../contexts/AuthContext';
import api from '../api/api';
import {
  KeyRound,
  UserPlus,
  RotateCcw,
  ClipboardList,
  CheckCircle2,
  Clock,
  PlayCircle,
  PauseCircle,
  X,
  AlertCircle,
  Loader2,
  History,
  Tag,
  Search,
  Filter,
  Inbox,
  FolderOpen,
  ClipboardCheck,
  BarChart3,
} from 'lucide-react';
import { TagInput } from '../components/TagInput';
import { Select } from '../components/Select';
import { formatId, TIPO_LABEL, TipoSolicitacao, StatusSolicitacao, ESTADOS, CIDADES_POR_ESTADO, STATUS } from '../constants/gestaoAcesso';

interface HistoricoItem {
  id: number;
  acao: string;
  status_anterior: string | null;
  status_novo: string;
  descricao: string | null;
  matricula_usuario: string;
  nome_usuario: string;
  data: string;
}

interface SolicitacaoAcesso {
  id: number;
  tipo: TipoSolicitacao;
  matricula: string;
  nome: string;
  empresa: string;
  email: string | null;
  telefone: string | null;
  estado: string;
  cidade: string;
  observacao: string | null;
  status: StatusSolicitacao;
  matricula_solicitante: string;
  nome_solicitante: string;
  id_chamado: string | null;
  responsavel_aprovacao: string | null;
  sistemas_tags: string[] | null;
  observacao_tratativa: string | null;
  observacao_final: string | null;
  nome_responsavel: string | null;
  data_criacao: string;
  data_modificacao: string;
  data_conclusao: string | null;
  historico?: HistoricoItem[];
}

const FORM_VAZIO = {
  matricula: '',
  nome: '',
  empresa: '',
  email: '',
  telefone: '',
  estado: '',
  cidade: '',
  observacao: '',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
  'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all';
const labelClass = 'text-xs font-bold text-slate-500 uppercase tracking-wide ml-1';

const formatDateTime =(dateString?: string | null) =>
  dateString ? new Date(dateString).toLocaleString('pt-BR') : 'N/A';

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'Concluído':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'Pendente':
      return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'Iniciado':
      return 'bg-blue-50 text-blue-700 border-blue-100';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Concluído': return <CheckCircle2 size={16} />;
    case 'Pendente': return <PauseCircle size={16} />;
    case 'Iniciado': return <PlayCircle size={16} />;
    default: return <Clock size={16} />;
  }
};

interface Coluna {
  label: string;
  key: keyof SolicitacaoAcesso;
  align?: 'center';
  render: (item: SolicitacaoAcesso) => React.ReactNode;
}

const renderStatus = (item: SolicitacaoAcesso) => (
  <div className={`mx-auto w-fit flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold whitespace-nowrap ${getStatusStyle(item.status)}`}>
    {getStatusIcon(item.status)}
    {item.status}
  </div>
);

const COLUNA_ID: Coluna = {
  label: 'ID',
  key: 'id',
  render: (item) => <span className="font-mono font-bold text-indigo-600">#{formatId(item.id)}</span>,
};

const COLUNA_TIPO: Coluna = {
  label: 'Tipo',
  key: 'tipo',
  render: (item) => <span className="font-medium text-slate-700">{TIPO_LABEL[item.tipo]}</span>,
};

const COLUNAS_MINHAS: Coluna[] = [
  COLUNA_ID,
  COLUNA_TIPO,
  { label: 'Estado', key: 'estado', render: (item) => item.estado },
  { label: 'Cidade', key: 'cidade', render: (item) => item.cidade },
  { label: 'Data', key: 'data_criacao', render: (item) => formatDateTime(item.data_criacao) },
  { label: 'Status', key: 'status', align: 'center', render: renderStatus },
];

const COLUNAS_FILA: Coluna[] = [
  COLUNA_ID,
  COLUNA_TIPO,
  { label: 'Estado', key: 'estado', render: (item) => item.estado },
  { label: 'Cidade', key: 'cidade', render: (item) => item.cidade },
  {
    label: 'Solicitante',
    key: 'nome_solicitante',
    render: (item) => (
      <div>
        <p className="font-medium text-slate-700">{item.nome_solicitante}</p>
        <p className="text-xs text-slate-500">{item.matricula_solicitante}</p>
      </div>
    ),
  },
  { label: 'Empresa', key: 'empresa', render: (item) => item.empresa },
  { label: 'Status', key: 'status', align: 'center', render: renderStatus },
];

const FILTROS_VAZIOS = { estado: '', cidade: '', solicitante: '', status: '' };

const TRATATIVA_VAZIA = {
  id_chamado: '',
  responsavel_aprovacao: '',
  sistemas_tags: [] as string[],
  observacao_tratativa: '',
  observacao_final: '',
  status: '' as '' | 'Pendente' | 'Concluído', // Vazio = mantém o status atual
};

export const GestaoAcesso: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoAcesso[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: keyof SolicitacaoAcesso; direction: 'asc' | 'desc' } | null>(null);

  // Fila de Atendimento (somente Gestor Master)
  const isGestorMaster = user?.cargo === 'gestor-master';
  const [aba, setAba] = useState<'fila' | 'minhas'>('minhas');
  const [fila, setFila] = useState<SolicitacaoAcesso[]>([]);
  const [loadingFila, setLoadingFila] = useState(true);
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [solicitanteDebounced, setSolicitanteDebounced] = useState('');
  const [iniciandoId, setIniciandoId] = useState<number | null>(null);

  // Busca por ID / Nº do chamado (inclui concluídos)
  const [termoBusca, setTermoBusca] = useState('');
  const [resultadoBusca, setResultadoBusca] = useState<SolicitacaoAcesso[] | null>(null);
  const [buscando, setBuscando] = useState(false);

  // Formulário de abertura (Solicitação de Acesso / Reset de Senha)
  const [formularioAberto, setFormularioAberto] = useState<TipoSolicitacao | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(FORM_VAZIO);

  // Modal de detalhes (somente leitura)
  const [selected, setSelected] = useState<SolicitacaoAcesso | null>(null);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);

  // Tratativa do Gestor Master (dentro da modal de detalhes)
  const [tratativa, setTratativa] = useState(TRATATIVA_VAZIA);
  const [isSavingTratativa, setIsSavingTratativa] = useState(false);

  const { toast, showToast } = useToast();


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleApiError = (error: any, fallback: string) => {
    console.error(fallback, error);
    if (error.response?.status === 401) {
      handleLogout();
      return;
    }
    const message = error.response?.data?.message;
    showToast(Array.isArray(message) ? message[0] : message || fallback, 'error');
  };

  const fetchMinhas = async () => {
    try {
      const response = await api.get('/gestao-acesso/minhas');
      setSolicitacoes(response.data);
    } catch (error: any) {
      handleApiError(error, 'Erro ao buscar solicitações.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Se não houver usuário logado (token expirou ou não existe), volta para o login
    if (!localStorage.getItem('access_token')) {
      navigate('/login');
      return;
    }
    fetchMinhas();
  }, [navigate]);

  // O usuário é carregado do localStorage após o primeiro render; o Gestor Master abre na fila
  useEffect(() => {
    if (isGestorMaster) setAba('fila');
  }, [isGestorMaster]);

  const fetchFila = async () => {
    setLoadingFila(true);
    try {
      // Envia apenas os filtros preenchidos
      const params = Object.fromEntries(
        Object.entries({ ...filtros, solicitante: solicitanteDebounced.trim() }).filter(([, valor]) => valor),
      );
      const response = await api.get('/gestao-acesso/fila', { params });
      setFila(response.data);
    } catch (error: any) {
      handleApiError(error, 'Erro ao buscar a fila de atendimento.');
    } finally {
      setLoadingFila(false);
    }
  };

  // Aguarda o usuário parar de digitar antes de filtrar pelo solicitante
  useEffect(() => {
    const timer = setTimeout(() => setSolicitanteDebounced(filtros.solicitante), 400);
    return () => clearTimeout(timer);
  }, [filtros.solicitante]);

  useEffect(() => {
    if (isGestorMaster) fetchFila();
  }, [isGestorMaster, filtros.estado, filtros.cidade, filtros.status, solicitanteDebounced]);

  const handleIniciar = async (item: SolicitacaoAcesso) => {
    setIniciandoId(item.id);
    try {
      const response = await api.patch(`/gestao-acesso/${item.id}/iniciar`);
      const atualizada: SolicitacaoAcesso = response.data;
      // Atualiza a linha na fila e no resultado da busca sem recarregar
      setFila((prev) => prev.map((s) => (s.id === item.id ? { ...s, ...atualizada } : s)));
      setResultadoBusca((prev) => prev && prev.map((s) => (s.id === item.id ? { ...s, ...atualizada } : s)));
      showToast(`Solicitação #${formatId(item.id)} iniciada!`, 'success');
      abrirDetalhes({ ...item, ...atualizada });
    } catch (error: any) {
      handleApiError(error, 'Erro ao iniciar a solicitação.');
      // Outro gestor pode ter iniciado antes: recarrega a fila
      fetchFila();
    } finally {
      setIniciandoId(null);
    }
  };

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    const termo = termoBusca.trim().replace(/^#/, '');
    if (!termo) return;

    setBuscando(true);
    try {
      const response = await api.get('/gestao-acesso/busca', { params: { termo } });
      setResultadoBusca(response.data);
    } catch (error: any) {
      handleApiError(error, 'Erro ao buscar a solicitação.');
    } finally {
      setBuscando(false);
    }
  };

  const limparBusca = () => {
    setTermoBusca('');
    setResultadoBusca(null);
  };

  const preencherTratativa = (item: SolicitacaoAcesso) => {
    setTratativa({
      id_chamado: item.id_chamado ?? '',
      responsavel_aprovacao: item.responsavel_aprovacao ?? '',
      sistemas_tags: item.sistemas_tags ?? [],
      observacao_tratativa: item.observacao_tratativa ?? '',
      observacao_final: item.observacao_final ?? '',
      status: '',
    });
  };

  const abrirDetalhes = async (item: SolicitacaoAcesso) => {
    // Abre com os dados da linha e completa com o histórico vindo da API
    setSelected(item);
    preencherTratativa(item);
    setLoadingDetalhe(true);
    try {
      const response = await api.get(`/gestao-acesso/${item.id}`);
      setSelected(response.data);
    } catch (error: any) {
      handleApiError(error, 'Erro ao carregar o histórico.');
    } finally {
      setLoadingDetalhe(false);
    }
  };

  const closeDetalhes = () => {
    if (isSavingTratativa) return;
    setSelected(null);
  };

  // Gestor Master só trata solicitações já iniciadas e ainda não concluídas
  const podeTratar = !!selected && isGestorMaster && (selected.status === 'Iniciado' || selected.status === 'Pendente');

  const handleSalvarTratativa = async (concluir = false) => {
    if (!selected) return;
    const isReset = selected.tipo === 'reset_senha';
    const novoStatus = concluir ? 'Concluído' : tratativa.status;

    // Regras de conclusão (também validadas no backend)
    if (novoStatus === 'Concluído' && !isReset && !tratativa.observacao_final.trim()) {
      showToast('Informe a observação final para concluir a solicitação.', 'error');
      return;
    }
    if (novoStatus === 'Concluído' && isReset && !tratativa.observacao_tratativa.trim()) {
      showToast('Informe o parecer para concluir o reset de senha.', 'error');
      return;
    }

    const payload = isReset
      ? { observacao_tratativa: tratativa.observacao_tratativa.trim(), ...(novoStatus && { status: novoStatus }) }
      : {
          id_chamado: tratativa.id_chamado.trim(),
          responsavel_aprovacao: tratativa.responsavel_aprovacao.trim(),
          sistemas_tags: tratativa.sistemas_tags,
          observacao_tratativa: tratativa.observacao_tratativa.trim(),
          observacao_final: tratativa.observacao_final.trim(),
          ...(novoStatus && { status: novoStatus }),
        };

    setIsSavingTratativa(true);
    try {
      await api.patch(`/gestao-acesso/${selected.id}/tratativa`, payload);
      // Recarrega o detalhe para trazer o histórico atualizado
      const response = await api.get(`/gestao-acesso/${selected.id}`);
      const atualizada: SolicitacaoAcesso = response.data;
      setSelected(atualizada);
      preencherTratativa(atualizada);

      const atualizarLista = (lista: SolicitacaoAcesso[]) => lista.map((s) => (s.id === atualizada.id ? { ...s, ...atualizada } : s));
      // Concluída sai da fila de trabalho
      setFila((prev) => (atualizada.status === 'Concluído' ? prev.filter((s) => s.id !== atualizada.id) : atualizarLista(prev)));
      setSolicitacoes(atualizarLista);
      setResultadoBusca((prev) => prev && atualizarLista(prev));

      showToast(
        atualizada.status === 'Concluído'
          ? `Solicitação #${formatId(atualizada.id)} concluída!`
          : 'Tratativa salva com sucesso!',
        'success',
      );
    } catch (error: any) {
      handleApiError(error, 'Erro ao salvar a tratativa.');
    } finally {
      setIsSavingTratativa(false);
    }
  };

  const abrirFormulario = (tipo: TipoSolicitacao) => {
    // A solicitação é feita para um terceiro: matrícula e nome são do técnico, informados
    // pelo solicitante (a empresa continua sugerida e pode ser editada)
    setFormData({
      ...FORM_VAZIO,
      empresa: user?.empresa?.toUpperCase() ?? '',
    });
    setFormularioAberto(tipo);
  };

  const fecharFormulario = () => {
    setFormularioAberto(null);
    setFormData(FORM_VAZIO);
  };

  const handleEstadoChange = (estado: string) => {
    // Ao trocar o estado, a cidade precisa ser escolhida novamente
    setFormData({ ...formData, estado, cidade: '' });
  };

  const handleCriarSolicitacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formularioAberto) return;

    const dados = {
      ...formData,
      matricula: formData.matricula.trim(),
      nome: formData.nome.trim(),
      empresa: formData.empresa.trim(),
      email: formData.email.trim(),
      observacao: formData.observacao.trim(),
    };

    if (!dados.matricula || !dados.nome || !dados.empresa || !dados.estado || !dados.cidade) {
      showToast('Preencha todos os campos obrigatórios.', 'error');
      return;
    }

    const isAcesso = formularioAberto === 'acesso';
    if (isAcesso && !dados.telefone) {
      showToast('O telefone é obrigatório.', 'error');
      return;
    }
    if (isAcesso && dados.email && !EMAIL_REGEX.test(dados.email)) {
      showToast('Informe um e-mail válido.', 'error');
      return;
    }

    const payload = {
      tipo: formularioAberto,
      matricula: dados.matricula,
      nome: dados.nome,
      empresa: dados.empresa,
      estado: dados.estado,
      cidade: dados.cidade,
      // Campos exclusivos da Solicitação de Acesso
      ...(isAcesso && {
        telefone: dados.telefone,
        ...(dados.email && { email: dados.email }),
        ...(dados.observacao && { observacao: dados.observacao }),
      }),
    };

    setIsSaving(true);
    try {
      await api.post('/gestao-acesso', payload);
      fecharFormulario();
      showToast(isAcesso ? 'Solicitação de acesso enviada com sucesso!' : 'Reset de senha solicitado com sucesso!', 'success');
      // Recarrega a lista (e a fila, pois o Gestor Master também pode abrir solicitações)
      await fetchMinhas();
      if (isGestorMaster) fetchFila();
    } catch (error: any) {
      handleApiError(error, 'Erro ao enviar a solicitação.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSort = (key: keyof SolicitacaoAcesso) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const ordenar = (lista: SolicitacaoAcesso[]) => {
    // Sem ordenação escolhida, mantém a ordem da API (fila já vem por prioridade)
    if (!sortConfig) return lista;
    const { key, direction } = sortConfig;
    return [...lista].sort((a, b) => {
      const valueA = a[key] ?? '';
      const valueB = b[key] ?? '';
      if (valueA < valueB) return direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortedSolicitacoes = useMemo(() => ordenar(solicitacoes), [solicitacoes, sortConfig]);
  const sortedFila = useMemo(() => ordenar(fila), [fila, sortConfig]);

  const trocarAba = (novaAba: 'fila' | 'minhas') => {
    setAba(novaAba);
    setSortConfig(null);
  };

  // Cidades do filtro: as do estado escolhido ou todas
  const cidadesFiltro = filtros.estado
    ? CIDADES_POR_ESTADO[filtros.estado] ?? []
    : Object.values(CIDADES_POR_ESTADO).flat();

  const temFiltroAtivo = !!(filtros.estado || filtros.cidade || filtros.solicitante || filtros.status);

  const renderTabela = (
    itens: SolicitacaoAcesso[],
    colunas: Coluna[],
    options: { carregando?: boolean; mensagemVazia: string; comAcoes?: boolean },
  ) => {
    const totalColunas = colunas.length + (options.comAcoes ? 1 : 0);
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {colunas.map((col) => (
                  <SortableHeader
                    key={col.key}
                    label={col.label}
                    align={col.align === 'center' ? 'center' : 'left'}
                    direction={sortConfig?.key === col.key ? sortConfig.direction : null}
                    onSort={() => handleSort(col.key)}
                  />
                ))}
                {options.comAcoes && (
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Ações</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {options.carregando ? (
                <tr><td colSpan={totalColunas} className="px-6 py-10 text-center text-slate-500">Carregando dados...</td></tr>
              ) : itens.length === 0 ? (
                <tr><td colSpan={totalColunas} className="px-6 py-10 text-center text-slate-500">{options.mensagemVazia}</td></tr>
              ) : itens.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => abrirDetalhes(item)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    // Enter/Espaço na própria linha abre os detalhes (ignora teclas vindas dos botões internos)
                    if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      abrirDetalhes(item);
                    }
                  }}
                  className="hover:bg-slate-100/50 even:bg-slate-50/50 transition-colors cursor-pointer focus-visible:outline-offset-[-2px]"
                >
                  {colunas.map((col) => (
                    <td key={col.key} className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                      {col.render(item)}
                    </td>
                  ))}
                  {options.comAcoes && (
                    <td className="px-6 py-4 text-center">
                      {item.status === 'Não Iniciado' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIniciar(item);
                          }}
                          disabled={iniciandoId === item.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-lg transition-all border border-indigo-200 text-xs font-bold shadow-sm disabled:opacity-60"
                        >
                          {iniciandoId === item.id ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />}
                          Iniciar
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirDetalhes(item);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-600 hover:bg-slate-100 rounded-lg transition-all border border-slate-200 text-xs font-bold shadow-sm"
                        >
                          <FolderOpen size={14} />
                          Abrir
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <AppLayout
      title="Gestão de Acesso"
      icon={KeyRound}
      width="full"
      actions={
        <>
          <button
            onClick={() => abrirFormulario('acesso')}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm"
          >
            <UserPlus size={18} />
            Solicitação de Acesso
          </button>
          <button
            onClick={() => abrirFormulario('reset_senha')}
            className="flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm"
          >
            <RotateCcw size={18} />
            Reset de Senha
          </button>
        </>
      }
    >
          {/* Abas: apenas o Gestor Master possui a Fila de Atendimento */}
          {isGestorMaster && (
            <div className="flex gap-2 border-b border-slate-200">
              {[
                { id: 'fila' as const, label: 'Fila de Atendimento', icon: <Inbox size={16} /> },
                { id: 'minhas' as const, label: 'Minhas Solicitações', icon: <ClipboardList size={16} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => trocarAba(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${
                    aba === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
              {/* Link para o painel de indicadores (somente Gestor Master) */}
              <Link
                to="/gestao-acesso/indicadores"
                aria-label="Painel de Indicadores"
                className="ml-auto mb-1.5 flex items-center gap-2 px-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-xl transition-colors"
              >
                <BarChart3 size={16} />
                <span className="hidden sm:inline">Painel de Indicadores</span>
              </Link>
            </div>
          )}

          {aba === 'fila' && isGestorMaster ? (
            <>
              {/* Busca por ID / Nº do chamado (inclui concluídos) */}
              <form onSubmit={handleBuscar} className="flex flex-col md:flex-row gap-2 md:items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar por ID ou Nº do chamado (inclui concluídos)..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={buscando || !termoBusca.trim()}
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm disabled:bg-indigo-300"
                  >
                    {buscando ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                    Buscar
                  </button>
                  {resultadoBusca && (
                    <button
                      type="button"
                      onClick={limparBusca}
                      className="px-4 py-2.5 border border-slate-200 bg-white text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm"
                    >
                      Limpar busca
                    </button>
                  )}
                </div>
              </form>

              {resultadoBusca && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Search size={18} className="text-indigo-500" />
                    Resultado da busca
                  </h3>
                  {renderTabela(resultadoBusca, COLUNAS_FILA, {
                    mensagemVazia: 'Nenhuma solicitação encontrada para este ID ou chamado.',
                    comAcoes: true,
                  })}
                </div>
              )}

              {/* Filtros da fila */}
              <div className="flex flex-col lg:flex-row lg:items-end gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 lg:pb-2.5">
                  <Filter size={18} />
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Filtros</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
                  <div className="space-y-1">
                    <label htmlFor="acs-estado" className={labelClass}>Estado</label>
                    <Select id="acs-estado"
                      className={`${inputClass}`}
                      value={filtros.estado}
                      onChange={(e) => setFiltros({ ...filtros, estado: e.target.value, cidade: '' })}
                    >
                      <option value="">Todos</option>
                      {ESTADOS.map((uf) => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="acs-cidade" className={labelClass}>Cidade</label>
                    <Select id="acs-cidade"
                      className={`${inputClass}`}
                      value={filtros.cidade}
                      onChange={(e) => setFiltros({ ...filtros, cidade: e.target.value })}
                    >
                      <option value="">Todas</option>
                      {cidadesFiltro.map((cidade) => (
                        <option key={cidade} value={cidade}>{cidade}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="acs-solicitante" className={labelClass}>Solicitante</label>
                    <input id="acs-solicitante"
                      type="text"
                      placeholder="Nome ou matrícula"
                      className={inputClass}
                      value={filtros.solicitante}
                      onChange={(e) => setFiltros({ ...filtros, solicitante: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="acs-status" className={labelClass}>Status</label>
                    <Select id="acs-status"
                      className={`${inputClass}`}
                      value={filtros.status}
                      onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                    >
                      <option value="">Todos</option>
                      {STATUS.filter((s) => s !== 'Concluído').map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </Select>
                  </div>
                </div>
                <button
                  onClick={() => setFiltros(FILTROS_VAZIOS)}
                  disabled={!temFiltroAtivo}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Limpar filtros
                </button>
              </div>

              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <Inbox className="text-indigo-500" />
                  Fila de Atendimento
                </h2>
                <span className="hidden md:inline px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 shadow-sm">
                  Encontrados: {sortedFila.length}
                </span>
              </div>

              {renderTabela(sortedFila, COLUNAS_FILA, {
                carregando: loadingFila,
                mensagemVazia: temFiltroAtivo ? 'Nenhuma solicitação encontrada com os filtros aplicados.' : 'Nenhuma solicitação na fila.',
                comAcoes: true,
              })}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <ClipboardList className="text-indigo-500" />
                  Minhas Solicitações
                </h2>
                <span className="hidden md:inline px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 shadow-sm">
                  Encontrados: {sortedSolicitacoes.length}
                </span>
              </div>

              {renderTabela(sortedSolicitacoes, COLUNAS_MINHAS, {
                carregando: loading,
                mensagemVazia: 'Nenhuma solicitação encontrada.',
              })}
            </>
          )}

      {/* Modal de Solicitação de Acesso / Reset de Senha */}
      {formularioAberto && (
        <Modal onClose={() => { if (!isSaving) fecharFormulario(); }} labelledBy="titulo-formulario-acesso" className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
            <h3 id="titulo-formulario-acesso" className="text-xl font-bold text-slate-800">{TIPO_LABEL[formularioAberto]}</h3>
            <button type="button" onClick={fecharFormulario} disabled={isSaving} aria-label="Fechar" className="text-slate-500 hover:text-slate-600 transition-colors">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleCriarSolicitacao} className="p-6 overflow-y-auto space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="acs-estado-2" className={labelClass}>Estado</label>
                <Select id="acs-estado-2"
                  required
                  className={`${inputClass}`}
                  value={formData.estado}
                  onChange={(e) => handleEstadoChange(e.target.value)}
                >
                  <option value="" disabled>Selecione o estado</option>
                  {ESTADOS.map((uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <label htmlFor="acs-cidade-2" className={labelClass}>Cidade</label>
                <Select id="acs-cidade-2"
                  required
                  disabled={!formData.estado}
                  className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed`}
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                >
                  <option value="" disabled>{formData.estado ? 'Selecione a cidade' : 'Escolha o estado primeiro'}</option>
                  {(CIDADES_POR_ESTADO[formData.estado] ?? []).map((cidade) => (
                    <option key={cidade} value={cidade}>{cidade}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <label htmlFor="acs-matricula-do-tecnico" className={labelClass}>Matrícula do Técnico</label>
                <input id="acs-matricula-do-tecnico"
                  type="text" required maxLength={20} placeholder="A80xxxx"
                  className={`${inputClass} uppercase`}
                  value={formData.matricula}
                  onChange={(e) => setFormData({ ...formData, matricula: e.target.value.toUpperCase().trimStart() })}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="acs-empresa" className={labelClass}>Empresa</label>
                <input id="acs-empresa"
                  type="text" required maxLength={50} placeholder="Ex: TELEMONT"
                  className={`${inputClass} uppercase`}
                  value={formData.empresa}
                  onChange={(e) => setFormData({ ...formData, empresa: e.target.value.toUpperCase().trimStart() })}
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label htmlFor="acs-nome-do-tecnico" className={labelClass}>Nome do Técnico</label>
                <input id="acs-nome-do-tecnico"
                  type="text" required maxLength={100} placeholder="Nome completo do técnico"
                  className={`${inputClass} uppercase`}
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value.toUpperCase() })}
                />
              </div>

              {formularioAberto === 'acesso' && (
                <>
                  <div className="space-y-1">
                    <label htmlFor="acs-e-mail-opcional" className={labelClass}>E-mail (Opcional)</label>
                    <input id="acs-e-mail-opcional"
                      type="email" maxLength={100} placeholder="nome@empresa.com.br"
                      className={inputClass}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value.trim() })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="acs-telefone" className={labelClass}>Telefone</label>
                    <input id="acs-telefone"
                      type="text" inputMode="numeric" required maxLength={20} placeholder="Apenas números. Ex: 67999999999"
                      className={inputClass}
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label htmlFor="acs-observacao-opcional" className={labelClass}>Observação (Opcional)</label>
                    <textarea id="acs-observacao-opcional"
                      rows={2}
                      maxLength={150}
                      placeholder="Informe os sistemas nos quais deseja acesso..."
                      className={`${inputClass} resize-none`}
                      value={formData.observacao}
                      onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                    />
                    <div className="text-[10px] text-right text-slate-500 mt-1 mr-1 font-medium">
                      {formData.observacao.length} / 150 caracteres
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button" onClick={fecharFormulario} disabled={isSaving}
                className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-sm transition-all flex items-center justify-center gap-2 disabled:bg-indigo-300"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar'
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal de Detalhes da Solicitação (tratativa editável para o Gestor Master) */}
      {selected && (
        <Modal onClose={closeDetalhes} labelledBy="titulo-detalhes-solicitacao" className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h3 id="titulo-detalhes-solicitacao" className="text-xl font-bold text-slate-800">{TIPO_LABEL[selected.tipo]}</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">ID: #{formatId(selected.id)}</p>
            </div>
            <button type="button" onClick={closeDetalhes} aria-label="Fechar" className="text-slate-500 hover:text-slate-600 transition-colors p-1 hover:bg-white rounded-full">
              <X size={24} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status */}
              <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status Atual</span>
                <div className={`mt-2 w-fit flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${getStatusStyle(selected.status)}`}>
                  {getStatusIcon(selected.status)}
                  {selected.status}
                </div>
              </div>

              {/* Dados informados: matrícula e nome são do técnico, não de quem abriu */}
              <div className="space-y-1 px-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome do Técnico</p>
                <p className="text-slate-700 font-medium">{selected.nome}</p>
              </div>
              <div className="space-y-1 px-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Matrícula do Técnico</p>
                <p className="text-slate-700 font-medium">{selected.matricula}</p>
              </div>
              <div className="md:col-span-2 space-y-1 px-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Solicitado por</p>
                <p className="text-slate-700 font-medium">{selected.nome_solicitante} ({selected.matricula_solicitante})</p>
              </div>
              <div className="space-y-1 px-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Empresa</p>
                <p className="text-slate-700 font-medium">{selected.empresa}</p>
              </div>
              <div className="space-y-1 px-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado / Cidade</p>
                <p className="text-slate-700 font-medium">{selected.estado} • {selected.cidade}</p>
              </div>
              {selected.tipo === 'acesso' && (
                <>
                  <div className="space-y-1 px-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">E-mail</p>
                    <p className="text-slate-700 font-medium">{selected.email || 'Não informado'}</p>
                  </div>
                  <div className="space-y-1 px-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Telefone</p>
                    <p className="text-slate-700 font-medium">{selected.telefone}</p>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Sistemas Solicitados</p>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-sm text-slate-600 italic">{selected.observacao || 'Nenhuma observação informada.'}</p>
                    </div>
                  </div>
                </>
              )}

              {/* Tratativa do Gestor Master (editável) */}
              {podeTratar && selected.tipo === 'acesso' && (
                <div className="md:col-span-2 border-t border-slate-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <p className="md:col-span-2 text-xs font-bold text-indigo-500 uppercase tracking-wider px-1 flex items-center gap-2">
                    <ClipboardCheck size={14} />
                    Tratativa
                  </p>
                  <div className="space-y-1">
                    <label htmlFor="acs-id-do-chamado" className={labelClass}>ID do Chamado</label>
                    <input id="acs-id-do-chamado"
                      type="text" maxLength={50} placeholder="Nº do chamado aberto"
                      className={inputClass}
                      value={tratativa.id_chamado}
                      onChange={(e) => setTratativa({ ...tratativa, id_chamado: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="acs-responsavel-pela-aprovacao" className={labelClass}>Responsável pela Aprovação</label>
                    <input id="acs-responsavel-pela-aprovacao"
                      type="text" maxLength={100} placeholder="Nome de quem aprovou"
                      className={`${inputClass} uppercase`}
                      value={tratativa.responsavel_aprovacao}
                      onChange={(e) => setTratativa({ ...tratativa, responsavel_aprovacao: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label htmlFor="acs-sistemas-solicitacoes" className={labelClass}>Sistemas / Solicitações</label>
                    <TagInput id="acs-sistemas-solicitacoes"
                      value={tratativa.sistemas_tags}
                      onChange={(tags) => setTratativa({ ...tratativa, sistemas_tags: tags })}
                      placeholder="Digite e pressione Enter. Ex: Sistema: Portal de Material"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label htmlFor="acs-observacao-de-andamento-opcional" className={labelClass}>Observação de Andamento (Opcional)</label>
                    <textarea id="acs-observacao-de-andamento-opcional"
                      rows={2} maxLength={150}
                      placeholder="Ex: aguardando liberação do Portal de Material para pedir o Toa Técnico"
                      className={`${inputClass} resize-none`}
                      value={tratativa.observacao_tratativa}
                      onChange={(e) => setTratativa({ ...tratativa, observacao_tratativa: e.target.value })}
                    />
                    <div className="text-[10px] text-right text-slate-500 mr-1 font-medium">
                      {tratativa.observacao_tratativa.length} / 150 caracteres
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label htmlFor="acs-alterar-status" className={labelClass}>Alterar Status</label>
                    <Select id="acs-alterar-status"
                      className={`${inputClass}`}
                      value={tratativa.status}
                      onChange={(e) => setTratativa({ ...tratativa, status: e.target.value as typeof tratativa.status })}
                    >
                      <option value="">Manter como "{selected.status}"</option>
                      {selected.status !== 'Pendente' && <option value="Pendente">Pendente (liberação parcial)</option>}
                      <option value="Concluído">Concluído</option>
                    </Select>
                  </div>
                  {tratativa.status === 'Concluído' && (
                    <div className="md:col-span-2 space-y-1">
                      <label htmlFor="acs-observacao-final" className={labelClass}>Observação Final</label>
                      <textarea id="acs-observacao-final"
                        rows={2} maxLength={150} required
                        placeholder="Resumo final do que foi liberado"
                        className={`${inputClass} resize-none`}
                        value={tratativa.observacao_final}
                        onChange={(e) => setTratativa({ ...tratativa, observacao_final: e.target.value })}
                      />
                      <div className="flex justify-between text-[10px] font-medium mx-1">
                        <span className="text-amber-600">Após concluir, a solicitação não poderá ser reaberta.</span>
                        <span className="text-slate-500">{tratativa.observacao_final.length} / 150 caracteres</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {podeTratar && selected.tipo === 'reset_senha' && (
                <div className="md:col-span-2 border-t border-slate-100 pt-6 space-y-4">
                  <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider px-1 flex items-center gap-2">
                    <ClipboardCheck size={14} />
                    Tratativa
                  </p>
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 text-amber-800 p-3 rounded-xl text-sm">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <p>O reset é realizado no sistema externo; registre aqui apenas o parecer.</p>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="acs-parecer" className={labelClass}>Parecer</label>
                    <textarea id="acs-parecer"
                      rows={3} maxLength={150}
                      placeholder="Descreva o que foi feito no sistema externo"
                      className={`${inputClass} resize-none`}
                      value={tratativa.observacao_tratativa}
                      onChange={(e) => setTratativa({ ...tratativa, observacao_tratativa: e.target.value })}
                    />
                    <div className="flex justify-between text-[10px] font-medium mx-1">
                      <span className="text-amber-600">Após concluir, a solicitação não poderá ser reaberta.</span>
                      <span className="text-slate-500">{tratativa.observacao_tratativa.length} / 150 caracteres</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tratativa do Gestor Master (somente leitura) */}
              {!podeTratar && (selected.id_chamado ||selected.responsavel_aprovacao || selected.sistemas_tags?.length || selected.observacao_tratativa || selected.observacao_final) && (
                <div className="md:col-span-2 border-t border-slate-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <p className="md:col-span-2 text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Tratativa</p>
                  {selected.id_chamado && (
                    <div className="space-y-1 px-1">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">ID do Chamado</p>
                      <p className="text-slate-700 font-mono font-bold">{selected.id_chamado}</p>
                    </div>
                  )}
                  {selected.responsavel_aprovacao && (
                    <div className="space-y-1 px-1">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Responsável pela Aprovação</p>
                      <p className="text-slate-700 font-medium">{selected.responsavel_aprovacao}</p>
                    </div>
                  )}
                  {!!selected.sistemas_tags?.length && (
                    <div className="md:col-span-2 flex flex-wrap gap-2 px-1">
                      {selected.sistemas_tags.map((tag) => (
                        <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-bold">
                          <Tag size={12} />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {selected.observacao_tratativa && (
                    <div className="md:col-span-2 space-y-1 px-1">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{selected.tipo === 'reset_senha' ? 'Parecer' : 'Observação'}</p>
                      <p className="text-sm text-slate-600">{selected.observacao_tratativa}</p>
                    </div>
                  )}
                  {selected.observacao_final && (
                    <div className="md:col-span-2 space-y-1 px-1">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Observação Final</p>
                      <p className="text-sm text-slate-600">{selected.observacao_final}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Histórico da Solicitação */}
              <div className="md:col-span-2 border-t border-slate-100 pt-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1 mb-3 flex items-center gap-2">
                  <History size={14} />
                  Histórico
                </p>
                {loadingDetalhe ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500 px-1">
                    <Loader2 size={16} className="animate-spin" />
                    Carregando histórico...
                  </div>
                ) : !selected.historico?.length ? (
                  <p className="text-sm text-slate-500 italic px-1">Nenhum registro de histórico.</p>
                ) : (
                  <ol className="relative border-l border-slate-200 ml-2 space-y-5">
                    {selected.historico.map((h) => (
                      <li key={h.id} className="ml-5">
                        <span className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white"></span>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-slate-800">{h.acao}</p>
                          {h.status_anterior && h.status_anterior !== h.status_novo && (
                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                              {h.status_anterior} → {h.status_novo}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatDateTime(h.data)} • {h.nome_usuario} ({h.matricula_usuario})
                        </p>
                        {h.descricao && <p className="text-sm text-slate-600 mt-1">{h.descricao}</p>}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <button
              onClick={closeDetalhes}
              disabled={isSavingTratativa}
              className="px-6 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-all text-sm"
            >
              Fechar
            </button>
            {podeTratar && (
              <button
                onClick={() => handleSalvarTratativa(selected.tipo === 'reset_senha')}
                disabled={isSavingTratativa}
                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-sm transition-all text-sm flex items-center gap-2 disabled:bg-indigo-300"
              >
                {isSavingTratativa ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Salvando...
                  </>
                ) : selected.tipo === 'reset_senha' || tratativa.status === 'Concluído' ? (
                  <>
                    <CheckCircle2 size={16} />
                    Concluir
                  </>
                ) : (
                  'Salvar'
                )}
              </button>
            )}
          </div>
        </Modal>
      )}

      <Toast toast={toast} />
    </AppLayout>
  );
};
