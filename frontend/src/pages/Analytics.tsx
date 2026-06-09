import React, { useEffect, useState, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../api/api';
import { 
  LogOut, 
  LayoutDashboard, 
  BarChart3, 
  TrendingUp, 
  PieChart,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Filter
} from 'lucide-react';

interface Aprovacao {
  id: number;
  status: 'Pendente' | 'Aprovado' | 'Reprovado';
  dentro_time_slot: string;
  empresa: string;
}

interface CompanyStats {
  nome: string;
  total: number;
  pendentes: number;
  aprovados: number;
  reprovados: number;
  dentroSlot: number;
  foraSlot: number;
}

export const Analytics: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const [aprovacoes, setAprovacoes] = useState<Aprovacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('TODAS');
  const navigate = useNavigate();

  useEffect(() => {
    // Proteção: Se não houver token, volta para o login
    if (!localStorage.getItem('access_token')) {
      navigate('/login');
      return;
    }

    const fetchAprovacoes = async () => {
      try {
        const response = await api.get('/aprovacoes');
        setAprovacoes(response.data);
      } catch (error) {
        console.error('Erro ao buscar dados para analytics', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAprovacoes();
  }, [navigate]);

  // Proteção de Cargo: Solicitantes não podem ver esta tela
  useEffect(() => {
    if (user && user.cargo === 'solicitante') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const statsByCompany = useMemo(() => {
    const groups: Record<string, CompanyStats> = {};
    
    aprovacoes.forEach(item => {
      const empresa = item.empresa || 'NÃO INFORMADA';
      if (!groups[empresa]) {
        groups[empresa] = {
          nome: empresa,
          total: 0,
          pendentes: 0,
          aprovados: 0,
          reprovados: 0,
          dentroSlot: 0,
          foraSlot: 0
        };
      }
      
      const g = groups[empresa];
      g.total++;
      if (item.status === 'Pendente') g.pendentes++;
      if (item.status === 'Aprovado') g.aprovados++;
      if (item.status === 'Reprovado') g.reprovados++;
      if (item.dentro_time_slot === 'Sim') g.dentroSlot++;
      if (item.dentro_time_slot === 'Não') g.foraSlot++;
    });
    
    return Object.values(groups).sort((a, b) => b.total - a.total);
  }, [aprovacoes]);

  const empresasList = useMemo(() => {
    const list = aprovacoes.map(a => a.empresa || 'NÃO INFORMADA');
    return Array.from(new Set(list)).sort();
  }, [aprovacoes]);

  const filteredStatsByCompany = useMemo(() => {
    if (selectedEmpresa === 'TODAS') return statsByCompany;
    return statsByCompany.filter(s => s.nome === selectedEmpresa);
  }, [statsByCompany, selectedEmpresa]);

  const totals = useMemo(() => {
    return filteredStatsByCompany.reduce((acc, curr) => ({
      total: acc.total + curr.total,
      pendentes: acc.pendentes + curr.pendentes,
      aprovados: acc.aprovados + curr.aprovados,
      foraSlot: acc.foraSlot + curr.foraSlot,
    }), { total: 0, pendentes: 0, aprovados: 0, foraSlot: 0 });
  }, [filteredStatsByCompany]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
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
              <BarChart3 size={24} strokeWidth={2.5} />
              <span className="text-xl font-bold text-slate-900 tracking-tight">Indicadores Gerenciais</span>
            </div>
          </div>
          
          <button 
            onClick={() => { logout(); navigate('/login'); }} 
            className="text-slate-500 hover:text-red-600 font-medium text-sm flex items-center gap-2 transition-colors"
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Filtro por Empresa */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
            <Filter size={18} className="text-slate-400" />
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Filtrar Empresa:</span>
            <select
              value={selectedEmpresa}
              onChange={(e) => setSelectedEmpresa(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 cursor-pointer min-w-[150px]"
            >
              <option value="TODAS">Todas as Empresas</option>
              {empresasList.map(emp => (
                <option key={emp} value={emp}>{emp}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Geral</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{totals.total}</span>
              <TrendingUp size={16} className="text-indigo-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">Pendentes</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{totals.pendentes}</span>
              <Clock size={16} className="text-amber-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Aprovados</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{totals.aprovados}</span>
              <CheckCircle2 size={16} className="text-emerald-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 bg-red-50/30">
            <p className="text-xs font-bold text-red-500 uppercase tracking-wider">Fora do Slot</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-red-600">{totals.foraSlot}</span>
              <AlertTriangle size={16} className="text-red-500" />
            </div>
          </div>
        </div>

        {/* Tabela por Empresa */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <PieChart size={20} className="text-indigo-500" />
            <h3 className="font-bold text-slate-800">Consolidado por Empresa</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Empresa</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Total</th>
                  <th className="px-6 py-4 text-xs font-bold text-amber-600 uppercase tracking-wider text-center">Pendentes</th>
                  <th className="px-6 py-4 text-xs font-bold text-emerald-600 uppercase tracking-wider text-center">Aprovados</th>
                  <th className="px-6 py-4 text-xs font-bold text-red-600 uppercase tracking-wider text-center">Reprovados</th>
                  <th className="px-6 py-4 text-xs font-bold text-indigo-600 uppercase tracking-wider text-center">Fora Slot</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Aproveitamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStatsByCompany.map((s) => {
                  const rate = s.total > 0 ? ((s.aprovados / s.total) * 100).toFixed(1) : 0;
                  return (
                    <tr key={s.nome} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                            <Briefcase size={16} />
                          </div>
                          <span className="font-bold text-slate-700">{s.nome}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-slate-600">{s.total}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold border border-amber-100">
                          {s.pendentes}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-100">
                          {s.aprovados}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2.5 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-bold border border-red-100">
                          {s.reprovados}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          s.foraSlot > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}>
                          {s.foraSlot}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full" style={{ width: `${rate}%` }}></div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};