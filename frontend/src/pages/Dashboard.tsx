import React, { useEffect, useState, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../api/api';
import * as XLSX from 'xlsx';
import { 
  LogOut, 
  LayoutDashboard, 
  ClipboardList, 
  CheckCircle2, 
  BarChart3,
  XCircle, 
  Clock,
  User as UserIcon,
  Plus,
  X,
  Users,
  AlertTriangle,
  Loader2,
  Search,
  ArrowUpDown,
  Check,
  AlertCircle,
  Download,
  FileSpreadsheet,
} from 'lucide-react';

interface Aprovacao {
  id: number;
  pon: string;
  atividade: string;
  cidade: string;
  uf: string;
  data_execucao: string;
  nome_solicitante: string;
  matricula_solicitante: string;
  dentro_time_slot: string;
  empresa: string;
  matricula_tecnico: string;
  tecnico: string;
  time_slot: string;
  motivo: string;
  observacao?: string;
  status: 'Pendente' | 'Aprovado' | 'Reprovado';
  nome_aprovador?: string;
  matricula_aprovador?: string;
  data_inserida: string;
  data_modificacao: string;
}

// Mapeamento de Fusos Horários por UF (Brasil)
const UF_TIMEZONES: Record<string, string> = {
  'AC': 'America/Rio_Branco',
  'AM': 'America/Manaus',
  'MS': 'America/Campo_Grande',
  'MT': 'America/Cuiaba',
  'RO': 'America/Porto_Velho',
  'RR': 'America/Boa_Vista',
  // Todos os demais estados seguem o Horário de Brasília (UTC-3)
};

const calculateWithinSlot = (slot: string, uf: string) => {
  if (slot === 'SLA' || !slot || !uf) return 'Não';
  try {
    const [startTimeStr] = slot.split(' as ');
    const [hours, minutes] = startTimeStr.split(':').map(Number);
    
    const timezone = UF_TIMEZONES[uf] || 'America/Sao_Paulo';
    const now = new Date();

    // Converte o "agora" para o fuso horário da cidade da atividade
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false
    });
    const p: any = {};
    formatter.formatToParts(now).forEach(part => p[part.type] = part.value);
    const nowInTZ = new Date(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);

    const slotDate = new Date(nowInTZ);
    slotDate.setHours(hours, minutes, 0, 0);

    const diffMinutes = Math.abs(nowInTZ.getTime() - slotDate.getTime()) / (1000 * 60);
    return diffMinutes <= 30 ? 'Sim' : 'Não';
  } catch {
    return 'Não';
  }
};

export const Dashboard: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const [aprovacoes, setAprovacoes] = useState<Aprovacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  // Estados para o Modal e Formuário
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estados para o Modal de Detalhes
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAprovacao, setSelectedAprovacao] = useState<Aprovacao | null>(null);

  // Estados para Filtros e Ordenação
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Aprovacao; direction: 'asc' | 'desc' } | null>(null);

  // Estado para o Toast (Notificação)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Estados para o Modal de Confirmação de Reprovação
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [itemToReject, setItemToReject] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    pon: '',
    atividade: '',
    cidade: '',
    uf: '',
    dentro_time_slot: 'Não',
    matricula_tecnico: '',
    tecnico: '',
    time_slot: '',
    motivo: '',
    observacao: '',
    data_execucao: ''
  });

  const resetForm = () => {
    setFormData({
      pon: '',
      atividade: '',
      cidade: '',
      uf: '',
      dentro_time_slot: 'Não',
      matricula_tecnico: '',
      tecnico: '',
      time_slot: '',
      motivo: '',
      observacao: '',
      data_execucao: ''
    });
  };

  // Automação do campo "Dentro do Slot"
  useEffect(() => {
    if (isModalOpen) {
      const result = calculateWithinSlot(formData.time_slot, formData.uf);
      if (formData.dentro_time_slot !== result) {
        setFormData(prev => ({ ...prev, dentro_time_slot: result }));
      }
    }
  }, [formData.time_slot, formData.uf, isModalOpen]);

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedAprovacao(null);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getInitials = (name: string | undefined) => { // Permite que 'name' seja undefined
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

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleSort = (key: keyof Aprovacao) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      await api.patch(`/aprovacoes/${id}/status`, { status: newStatus });
      // Atualiza o estado local para refletir a mudança instantaneamente na tela
      setAprovacoes((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus as any } : item))
      );
      showToast(`Atividade ${newStatus === 'Aprovado' ? 'aprovada' : 'reprovada'} com sucesso!`, 'success');
    } catch (error: any) {
      console.error('Erro ao atualizar status', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      }
      showToast('Erro ao atualizar status.', 'error');
    }
  };

  const exportToExcel = () => {
    const dataToExport = searchedAndSortedAprovacoes.map(item => ({
      ID: item.id,
      PON: item.pon,
      'Atividade (OS)': item.atividade,
      Cidade: item.cidade,
      UF: item.uf,
      'Data Execução': formatDate(item.data_execucao),
      'Nome Solicitante': item.nome_solicitante,
      'Matrícula Solicitante': item.matricula_solicitante,
      Empresa: item.empresa,
      'Nome Técnico': item.tecnico,
      'Matrícula Técnico': item.matricula_tecnico,
      'Time Slot': item.time_slot,
      'Dentro do Slot': item.dentro_time_slot,
      'Motivo da Solicitação': item.motivo,
      Observação: item.observacao || '',
      Status: item.status,
      'Aprovado/Reprovado por': item.nome_aprovador || 'N/A',
      'Matrícula do Aprovador': item.matricula_aprovador || 'N/A',
      'Criado em': item.data_inserida ? new Date(item.data_inserida).toLocaleString('pt-BR') : '',
      'Última Modificação': item.data_modificacao ? new Date(item.data_modificacao).toLocaleString('pt-BR') : ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Aprovações");
    XLSX.writeFile(wb, `Relatorio_Aprovacoes_${new Date().toLocaleDateString()}.xlsx`);
    showToast('Excel gerado com sucesso!', 'success');
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação de data futura
    const today = new Date().toISOString().split('T')[0];
    if (formData.data_execucao > today) {
      showToast('A data de execução não pode ser uma data futura.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/aprovacoes', formData);
      closeModal();
      showToast('Atividade cadastrada com sucesso!', 'success');
      // Recarrega a lista
      const response = await api.get('/aprovacoes');
      setAprovacoes(response.data);
    } catch (error) {
      console.error('Erro ao criar atividade', error);
      showToast('Erro ao salvar atividade.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // 1. Primeiro filtramos pela busca e ordenação (Base completa para o Excel)
  const searchedAndSortedAprovacoes = useMemo(() => {
    return aprovacoes
    .filter((item) => {
      // Base completa para busca e exportação:
      // Solicitante: Vê apenas o que ele criou.
      // Gestores/Master: Veem tudo (necessário para o Excel completo).
      const isOwner = item.matricula_solicitante === user?.matricula;
      if (user?.cargo === 'solicitante' && !isOwner) return false;

      return (
        (item.pon ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.empresa ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.cidade ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.uf ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.status ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.dentro_time_slot ?? "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;
      const { key, direction } = sortConfig;
      
      const valA = a[key];
      const valB = b[key];

      const valueA = valA !== null && valA !== undefined ? valA : '';
      const valueB = valB !== null && valB !== undefined ? valB : '';

      if (valueA < valueB) return direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [aprovacoes, searchTerm, sortConfig, user]);

  // 2. Depois filtramos o que aparece na tela (Apenas Pendentes para Gestores)
  const filteredAndSortedAprovacoes = useMemo(() => {
    return searchedAndSortedAprovacoes.filter((item) => {
      const isOwner = item.matricula_solicitante === user?.matricula;

      if (user?.cargo === 'gestor-master') {
        // Requisito: Gestor Master vê na tela apenas o que é 'Pendente' E fora do slot ('Não')
        // Mantemos 'isOwner' para que ele veja também o que ele mesmo solicitou
        return (item.status === 'Pendente' && item.dentro_time_slot === 'Não') || isOwner;
      }

      // Regra para Gestores comuns e Solicitantes
      return (user?.cargo === 'gestor' && item.status === 'Pendente') || isOwner;
    });
  }, [searchedAndSortedAprovacoes, user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isModalOpen) closeModal();
        if (isDetailsModalOpen) closeDetailsModal();
        if (isRejectModalOpen) {
          setIsRejectModalOpen(false);
          setItemToReject(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isRejectModalOpen, isDetailsModalOpen]);

  useEffect(() => {
    // Se não houver usuário logado (token expirou ou não existe), volta para o login
    if (!localStorage.getItem('access_token')) {
      navigate('/login');
      return;
    }

    const fetchAprovacoes = async () => {
      try {
        const response = await api.get('/aprovacoes');
        setAprovacoes(response.data);
      } catch (error: any) {
        console.error('Erro ao buscar aprovações', error);
        if (error.response?.status === 401) {
          logout();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAprovacoes();
  }, [navigate]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Aprovado':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Reprovado':
        return 'bg-red-50 text-red-700 border-red-100';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Aprovado': return <CheckCircle2 size={16} />;
      case 'Reprovado': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar Superior */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-full mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 text-indigo-600">
            <LayoutDashboard size={24} strokeWidth={2.5} />
            <span className="text-xl font-bold text-slate-900 tracking-tight">Portal de Aprovação</span>
          </div>
          
          <div className="flex items-center gap-6">
            {(user?.cargo === 'gestor' || user?.cargo === 'gestor-master') && (
              <div className="flex items-center gap-4 border-r border-slate-200 pr-6">
                <button 
                  onClick={() => navigate('/analytics')}
                  className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium text-sm"
                >
                  <BarChart3 size={18} />
                  <span>Indicadores</span>
                </button>
                {user?.cargo === 'gestor-master' && (
                  <button 
                    onClick={() => navigate('/usuarios')}
                    className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium text-sm"
                  >
                    <Users size={18} />
                    <span>Usuários</span>
                  </button>
                )}
              </div>
            )}
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
          {/* Barra de Busca e Título */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Buscar por PON, Empresa ou Status..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {(user?.cargo === 'gestor' || user?.cargo === 'gestor-master') && (
                <button 
                  onClick={exportToExcel}
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-100"
                  title="Exportar para Excel"
                >
                  <Download size={18} />
                  <span className="hidden sm:inline">Exportar Excel</span>
                </button>
              )}
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-100"
              >
                <Plus size={18} />
                Nova Atividade
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList className="text-indigo-500" />
              Lista de Atividades
            </h2>
            <div className="flex items-center gap-4">
              <span className="hidden md:inline px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 shadow-sm">
                Encontrados: {filteredAndSortedAprovacoes.length}
              </span>
            </div>
          </div>

          {/* Tabela */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {[
                      { label: 'Cidade', key: 'cidade' },
                      { label: 'Atividade', key: 'atividade' },
                      { label: 'Solicitante', key: 'nome_solicitante' },
                      { label: 'Empresa', key: 'empresa' },
                      { label: 'Data Execução', key: 'data_execucao' },
                      { label: 'Dentro Slot', key: 'dentro_time_slot', align: 'center' },
                      { label: 'Status', key: 'status', align: 'center' }
                    ].map((col) => (
                      <th 
                        key={col.key}
                        onClick={() => handleSort(col.key as keyof Aprovacao)}
                        className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors ${col.align === 'center' ? 'text-center' : ''}`}
                      >
                        <div className={`flex items-center gap-1 ${col.align === 'center' ? 'justify-center' : ''}`}>
                          {col.label}
                          <ArrowUpDown size={12} className={sortConfig?.key === col.key ? 'text-indigo-600' : 'text-slate-300'} />
                        </div>
                      </th>
                    ))}
                    {(user?.cargo === 'gestor-master' || user?.cargo === 'gestor') && (
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Ações</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={8} className="px-6 py-10 text-center text-slate-400">Carregando dados...</td></tr>
                  ) : filteredAndSortedAprovacoes.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-10 text-center text-slate-400">Nenhum registro encontrado.</td></tr>
                  ) : filteredAndSortedAprovacoes.map((item) => (
                    <tr 
                      key={item.id} 
                      onClick={() => {
                        setSelectedAprovacao(item);
                        setIsDetailsModalOpen(true);
                      }}
                      className="hover:bg-slate-100/50 even:bg-slate-50/50 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{item.cidade}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-700">{item.atividade}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{item.nome_solicitante}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.empresa}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">{formatDate(item.data_execucao)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-xs font-bold ${item.dentro_time_slot === 'Sim' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {item.dentro_time_slot}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`mx-auto w-fit flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${getStatusStyle(item.status)}`}>
                          {getStatusIcon(item.status)}
                          {item.status}
                        </div>
                      </td>
                      {(user?.cargo === 'gestor-master' || user?.cargo === 'gestor') && (
                        <td className="px-6 py-4 text-center">
                          {item.status === 'Pendente' ? (
                            // Regra: Gestor só aprova se estiver dentro do slot ('Sim'). Master aprova qualquer uma.
                            (user?.cargo === 'gestor-master' || item.dentro_time_slot === 'Sim') ? (
                              <div className="flex justify-end gap-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusUpdate(item.id, 'Aprovado');
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg transition-all border border-emerald-200 text-xs font-bold shadow-sm"
                                >
                                  <CheckCircle2 size={14} />
                                  Aprovar
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setItemToReject(item.id);
                                    setIsRejectModalOpen(true);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white rounded-lg transition-all border border-red-200 text-xs font-bold shadow-sm"
                                >
                                  <XCircle size={14} />
                                  Reprovar
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Requer Master</span>
                            )
                          ) : (
                            <span className="text-xs text-slate-400 italic">Concluído</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Nova Atividade */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">Cadastrar Nova Atividade</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateActivity} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Atividade</label>
                  <input
                    type="text" required placeholder="Digite numero da atividade Ex: 18798549"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={formData.atividade} onChange={(e) => setFormData({...formData, atividade: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Número PON</label>
                  <input
                    type="text" required placeholder="Pon: 8-PKd85"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={formData.pon} onChange={(e) => setFormData({...formData, pon: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Cidade</label>
                  <input
                    type="text" required placeholder="Ex: Campo Grande"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 uppercase rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={formData.cidade} onChange={(e) => setFormData({...formData, cidade: e.target.value.toUpperCase()})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">UF</label>
                  <select 
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                    value={formData.uf} 
                    onChange={(e) => setFormData({...formData, uf: e.target.value})}
                  >
                    <option value="" disabled>Selecione a UF</option>
                    <option value="MS">MS</option>
                    <option value="MT">MT</option>
                    <option value="RO">RO</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Data Execução</label>
                  <input
                    type="date" required
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={formData.data_execucao} onChange={(e) => setFormData({...formData, data_execucao: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Matrícula Técnico</label>
                  <input 
                    type="text" required placeholder="A80xxxx"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 uppercase rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={formData.matricula_tecnico} onChange={(e) => setFormData({...formData, matricula_tecnico: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Nome Técnico</label>
                  <input 
                    type="text" required placeholder="Nome completo"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 uppercase rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={formData.tecnico} onChange={(e) => setFormData({...formData, tecnico: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Time Slot</label>
                  <select 
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                    value={formData.time_slot} 
                    onChange={(e) => setFormData({...formData, time_slot: e.target.value})}
                  >
                    <option value="" disabled>Selecione o horário</option>
                    <option value="08:30 as 10:30">08:30-10:30</option>
                    <option value="10:30 as 12:00">10:30-12:00</option>
                    <option value="14:00 as 16:00">14:00-16:00</option>
                    <option value="16:00 as 18:00">16:00-18:00</option>
                    <option value="SLA">SLA</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Atividade está Dentro dos 30min?</label>
                  <select 
                    disabled
                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none text-slate-500 font-bold cursor-not-allowed"
                    value={formData.dentro_time_slot} 
                  >
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                  </select>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Motivo</label>
                  <select 
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                    value={formData.motivo} 
                    onChange={(e) => setFormData({...formData, motivo: e.target.value})}
                  >
                    <option value="" disabled>Selecione o motivo</option>
                    <option value="Atividade complexa">Atividade complexa</option>
                    <option value="Falta de controle">Falta de controle</option>
                    <option value="Atividade injetada vencida">Atividade injetada vencida</option>
                    <option value="Erro Sistemico">Erro Sistemico</option>
                    <option value="Ordem Voltou para o Bucket">Roterizador moveu para o bucket</option>
                  </select>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Observação (Opcional)</label>
                  <textarea 
                    rows={2}
                    maxLength={255}
                    placeholder="Descreva brevemente detalhes relevantes da atividade..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                    value={formData.observacao} 
                    onChange={(e) => setFormData({...formData, observacao: e.target.value})}
                  />
                  <div className="text-[10px] text-right text-slate-400 mt-1 mr-1 font-medium">
                    {formData.observacao.length} / 255 caracteres
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" onClick={closeModal}
                  className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 disabled:bg-indigo-300 disabled:shadow-none"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Atividade'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalhes da Atividade */}
      {isDetailsModalOpen && selectedAprovacao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Detalhes da Atividade</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">ID: #{selectedAprovacao.id}</p>
              </div>
              <button onClick={closeDetailsModal} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-white rounded-full">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status e PON */}
                <div className="flex flex-col gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Atual</span>
                    <div className={`mt-2 w-fit flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${getStatusStyle(selectedAprovacao.status)}`}>
                      {getStatusIcon(selectedAprovacao.status)}
                      {selectedAprovacao.status}
                    </div>
                  </div>
                  
                  <div className="space-y-1 px-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Número PON</p>
                    <p className="text-lg font-mono font-bold text-indigo-600">{selectedAprovacao.pon}</p>
                  </div>
                  
                  <div className="space-y-1 px-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Atividade (OS)</p>
                    <p className="text-slate-700 font-medium">{selectedAprovacao.atividade}</p>
                  </div>

                  <div className="space-y-1 px-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cidade</p>
                    <p className="text-slate-700 font-medium">{selectedAprovacao.cidade}</p>
                  </div>
                  <div className="space-y-1 px-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">UF</p>
                    <p className="text-slate-700 font-medium">{selectedAprovacao.uf}</p>
                  </div>
                </div>

                {/* Datas e Slot */}
                <div className="flex flex-col gap-4">
                  <div className="space-y-1 px-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Data de Execução</p>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Clock size={16} className="text-slate-400" />
                      <span className="font-semibold">{formatDate(selectedAprovacao.data_execucao)}</span>
                    </div>
                  </div>

                  <div className="space-y-1 px-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Janela / Time Slot</p>
                    <p className="text-slate-700">{selectedAprovacao.time_slot} <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded border ${selectedAprovacao.dentro_time_slot === 'Sim' ? 'text-emerald-600 border-emerald-100' : 'text-red-600 border-red-100'}`}>Slot: {selectedAprovacao.dentro_time_slot}</span></p>
                  </div>

                  <div className="space-y-1 px-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Motivo da Solicitação</p>
                    <p className="text-slate-700">{selectedAprovacao.motivo}</p>
                  </div>
                </div>

                {/* Informações de Pessoal */}
                <div className="md:col-span-2 border-t border-slate-100 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-indigo-50/30 p-4 rounded-xl border border-indigo-100/50">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3">Solicitante</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-sm font-bold">
                          {getInitials(selectedAprovacao.nome_solicitante)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{selectedAprovacao.nome_solicitante}</p>
                          <p className="text-xs text-slate-500">{selectedAprovacao.empresa} • {selectedAprovacao.matricula_solicitante}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Técnico em Campo</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500">
                          <UserIcon size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{selectedAprovacao.tecnico}</p>
                          <p className="text-xs text-slate-500">Matrícula: {selectedAprovacao.matricula_tecnico}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Observações */}
                <div className="md:col-span-2 space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Observações Adicionais</p>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 min-h-[80px]">
                    <p className="text-sm text-slate-600 italic">
                      {selectedAprovacao.observacao || 'Nenhuma observação informada.'}
                    </p>
                  </div>
                </div>

                {/* Histórico de Registro */}
                <div className="md:col-span-2 border-t border-slate-100 pt-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 mb-3">Histórico de Registro</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1 px-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Criado em</p>
                      <div className="flex items-center gap-2 text-slate-700">
                        <span className="font-semibold">{selectedAprovacao.data_inserida ? new Date(selectedAprovacao.data_inserida).toLocaleString('pt-BR') : 'N/A'}</span>
                      </div>
                    </div>
                    <div className="space-y-1 px-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Última Modificação</p>
                      <div className="flex items-center gap-2 text-slate-700">
                        <span className="font-semibold">{selectedAprovacao.data_modificacao ? new Date(selectedAprovacao.data_modificacao).toLocaleString('pt-BR') : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={closeDetailsModal}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-all text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Reprovação */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4 border border-red-100">
                <AlertTriangle size={30} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Confirmar Reprovação</h3>
              <p className="text-sm text-slate-500 mt-2">
                Tem certeza que deseja <span className="font-bold text-red-600">reprovar</span> esta atividade? Esta ação não poderá ser desfeita.
              </p>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setItemToReject(null);
                }}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if(itemToReject) handleStatusUpdate(itemToReject, 'Reprovado');
                  setIsRejectModalOpen(false);
                  setItemToReject(null);
                }}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-100 transition-all text-sm"
              >
                Sim, Reprovar
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