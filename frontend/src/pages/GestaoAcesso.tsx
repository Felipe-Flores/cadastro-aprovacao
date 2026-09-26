import React, { useEffect, useState, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../api/api';
import {
  LogOut,
  ArrowLeft,
  KeyRound,
  UserPlus,
  RotateCcw,
  ClipboardList,
  CheckCircle2,
  Clock,
  PlayCircle,
  PauseCircle,
  X,
  ArrowUpDown,
  Check,
  AlertCircle,
  Loader2,
  History,
  Tag,
} from 'lucide-react';
import { formatId, TIPO_LABEL, TipoSolicitacao, StatusSolicitacao } from '../constants/gestaoAcesso';

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

const formatDateTime = (dateString?: string | null) =>
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

export const GestaoAcesso: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoAcesso[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: keyof SolicitacaoAcesso; direction: 'asc' | 'desc' } | null>(null);

  // Formulário de abertura (implementado na Fase 4)
  const [formularioAberto, setFormularioAberto] = useState<TipoSolicitacao | null>(null);

  // Modal de detalhes (somente leitura)
  const [selected, setSelected] = useState<SolicitacaoAcesso | null>(null);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return '?';
    const names = name.trim().split(' ');
    return names.length >= 2
      ? (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase()
      : names[0].charAt(0).toUpperCase();
  };

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

  const abrirDetalhes = async (item: SolicitacaoAcesso) => {
    // Abre com os dados da linha e completa com o histórico vindo da API
    setSelected(item);
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

  const closeDetalhes = () => setSelected(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selected) closeDetalhes();
        if (formularioAberto) setFormularioAberto(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, formularioAberto]);

  const handleSort = (key: keyof SolicitacaoAcesso) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedSolicitacoes = useMemo(() => {
    if (!sortConfig) return solicitacoes;
    const { key, direction } = sortConfig;
    return [...solicitacoes].sort((a, b) => {
      const valueA = a[key] ?? '';
      const valueB = b[key] ?? '';
      if (valueA < valueB) return direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [solicitacoes, sortConfig]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar Superior */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-full mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 flex items-center gap-2 text-sm font-medium"
            >
              <ArrowLeft size={18} />
              Voltar
            </button>
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-2 text-indigo-600">
              <KeyRound size={24} strokeWidth={2.5} />
              <span className="text-xl font-bold text-slate-900 tracking-tight">Gestão de Acesso</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {user && (
              <div className="flex items-center gap-3 px-4 py-1.5 bg-slate-100 rounded-full">
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {getInitials(user?.nome)}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm uppercase font-bold text-slate-900 leading-none">{user?.nome}</p>
                  <p className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider mt-1">{user?.cargo}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors font-medium text-sm"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-full w-full mx-auto p-6">
        <div className="flex flex-col gap-6">
          {/* Botões de Ação (centralizados) */}
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => setFormularioAberto('acesso')}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-100"
            >
              <UserPlus size={18} />
              Solicitação de Acesso
            </button>
            <button
              onClick={() => setFormularioAberto('reset_senha')}
              className="flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm"
            >
              <RotateCcw size={18} />
              Reset de Senha
            </button>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList className="text-indigo-500" />
              Minhas Solicitações
            </h2>
            <span className="hidden md:inline px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 shadow-sm">
              Encontrados: {sortedSolicitacoes.length}
            </span>
          </div>

          {/* Tabela */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {[
                      { label: 'ID', key: 'id' },
                      { label: 'Tipo', key: 'tipo' },
                      { label: 'Estado', key: 'estado' },
                      { label: 'Cidade', key: 'cidade' },
                      { label: 'Data', key: 'data_criacao' },
                      { label: 'Status', key: 'status', align: 'center' },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key as keyof SolicitacaoAcesso)}
                        className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors ${col.align === 'center' ? 'text-center' : ''}`}
                      >
                        <div className={`flex items-center gap-1 ${col.align === 'center' ? 'justify-center' : ''}`}>
                          {col.label}
                          <ArrowUpDown size={12} className={sortConfig?.key === col.key ? 'text-indigo-600' : 'text-slate-300'} />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400">Carregando dados...</td></tr>
                  ) : sortedSolicitacoes.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400">Nenhuma solicitação encontrada.</td></tr>
                  ) : sortedSolicitacoes.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => abrirDetalhes(item)}
                      className="hover:bg-slate-100/50 even:bg-slate-50/50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 text-sm font-mono font-bold text-indigo-600">#{formatId(item.id)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-700 whitespace-nowrap">{TIPO_LABEL[item.tipo]}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.estado}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{item.cidade}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium whitespace-nowrap">{formatDateTime(item.data_criacao)}</td>
                      <td className="px-6 py-4">
                        <div className={`mx-auto w-fit flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold whitespace-nowrap ${getStatusStyle(item.status)}`}>
                          {getStatusIcon(item.status)}
                          {item.status}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Detalhes da Solicitação (somente leitura) */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{TIPO_LABEL[selected.tipo]}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">ID: #{formatId(selected.id)}</p>
              </div>
              <button onClick={closeDetalhes} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-white rounded-full">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status */}
                <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Atual</span>
                  <div className={`mt-2 w-fit flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${getStatusStyle(selected.status)}`}>
                    {getStatusIcon(selected.status)}
                    {selected.status}
                  </div>
                </div>

                {/* Dados informados */}
                <div className="space-y-1 px-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome</p>
                  <p className="text-slate-700 font-medium">{selected.nome}</p>
                </div>
                <div className="space-y-1 px-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Matrícula</p>
                  <p className="text-slate-700 font-medium">{selected.matricula}</p>
                </div>
                <div className="space-y-1 px-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Empresa</p>
                  <p className="text-slate-700 font-medium">{selected.empresa}</p>
                </div>
                <div className="space-y-1 px-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado / Cidade</p>
                  <p className="text-slate-700 font-medium">{selected.estado} • {selected.cidade}</p>
                </div>
                {selected.tipo === 'acesso' && (
                  <>
                    <div className="space-y-1 px-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">E-mail</p>
                      <p className="text-slate-700 font-medium">{selected.email || 'Não informado'}</p>
                    </div>
                    <div className="space-y-1 px-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Telefone</p>
                      <p className="text-slate-700 font-medium">{selected.telefone}</p>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Sistemas Solicitados</p>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-sm text-slate-600 italic">{selected.observacao || 'Nenhuma observação informada.'}</p>
                      </div>
                    </div>
                  </>
                )}

                {/* Tratativa do Gestor Master */}
                {(selected.id_chamado || selected.responsavel_aprovacao || selected.sistemas_tags?.length || selected.observacao_tratativa || selected.observacao_final) && (
                  <div className="md:col-span-2 border-t border-slate-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <p className="md:col-span-2 text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Tratativa</p>
                    {selected.id_chamado && (
                      <div className="space-y-1 px-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">ID do Chamado</p>
                        <p className="text-slate-700 font-mono font-bold">{selected.id_chamado}</p>
                      </div>
                    )}
                    {selected.responsavel_aprovacao && (
                      <div className="space-y-1 px-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Responsável pela Aprovação</p>
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
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{selected.tipo === 'reset_senha' ? 'Parecer' : 'Observação'}</p>
                        <p className="text-sm text-slate-600">{selected.observacao_tratativa}</p>
                      </div>
                    )}
                    {selected.observacao_final && (
                      <div className="md:col-span-2 space-y-1 px-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Observação Final</p>
                        <p className="text-sm text-slate-600">{selected.observacao_final}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Histórico da Solicitação */}
                <div className="md:col-span-2 border-t border-slate-100 pt-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 mb-3 flex items-center gap-2">
                    <History size={14} />
                    Histórico
                  </p>
                  {loadingDetalhe ? (
                    <div className="flex items-center gap-2 text-sm text-slate-400 px-1">
                      <Loader2 size={16} className="animate-spin" />
                      Carregando histórico...
                    </div>
                  ) : !selected.historico?.length ? (
                    <p className="text-sm text-slate-400 italic px-1">Nenhum registro de histórico.</p>
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
                className="px-6 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-all text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sistema de Toast (Notificação) */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] animate-in fade-in slide-in-from-right-8 duration-300">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border ${
            toast.type === 'success'
              ? 'bg-white border-emerald-100 text-emerald-800'
              : 'bg-white border-red-100 text-red-800'
          }`}>
            {toast.type === 'success' ? (
              <div className="bg-emerald-100 p-1 rounded-full text-emerald-600"><Check size={18} /></div>
            ) : (
              <div className="bg-red-100 p-1 rounded-full text-red-600"><AlertCircle size={18} /></div>
            )}
            <p className="text-sm font-bold">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};
