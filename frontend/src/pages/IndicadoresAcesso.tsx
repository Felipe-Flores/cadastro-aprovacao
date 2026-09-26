import React, { useEffect, useState, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { AuthContext } from '../contexts/AuthContext';
import api from '../api/api';
import { Select } from '../components/Select';
import {
  BarChart3,
  TrendingUp,
  Clock,
  PlayCircle,
  CheckCircle2,
  Timer,
  Filter,
  Loader2,
  Briefcase,
  Users,
  Layers,
} from 'lucide-react';
import { TIPO_LABEL, TipoSolicitacao, StatusSolicitacao } from '../constants/gestaoAcesso';

interface SolicitacaoIndicador {
  id: number;
  tipo: TipoSolicitacao;
  status: StatusSolicitacao;
  empresa: string;
  estado: string;
  cidade: string;
  matricula_solicitante: string;
  nome_solicitante: string;
  data_criacao: string;
  data_conclusao: string | null;
}

interface Grupo {
  chave: string;
  rotulo: string;
  subrotulo?: string;
  total: number;
  acesso: number;
  reset: number;
  naoIniciado: number;
  emAndamento: number; // Iniciado + Pendente
  concluido: number;
}

const FILTROS_VAZIOS = { de: '', ate: '', empresa: '', tipo: '' };

const inputClass =
  'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all';
const labelClass = 'text-xs font-bold text-slate-500 uppercase tracking-wide ml-1';

const agrupar = (
  lista: SolicitacaoIndicador[],
  chaveDe: (s: SolicitacaoIndicador) => string,
  rotuloDe: (s: SolicitacaoIndicador) => { rotulo: string; subrotulo?: string },
) => {
  const grupos: Record<string, Grupo> = {};
  lista.forEach((s) => {
    const chave = chaveDe(s);
    if (!grupos[chave]) {
      grupos[chave] = { chave, ...rotuloDe(s), total: 0, acesso: 0, reset: 0, naoIniciado: 0, emAndamento: 0, concluido: 0 };
    }
    const g = grupos[chave];
    g.total++;
    if (s.tipo === 'acesso') g.acesso++;
    else g.reset++;
    if (s.status === 'Concluído') g.concluido++;
    else if (s.status === 'Não Iniciado') g.naoIniciado++;
    else g.emAndamento++;
  });
  // Maior volume primeiro; empate em ordem alfabética
  return Object.values(grupos).sort((a, b) => b.total - a.total || a.rotulo.localeCompare(b.rotulo));
};

const percentual = (parte: number, total: number) => (total > 0 ? Math.round((parte / total) * 100) : 0);

// Converte milissegundos em texto curto (ex: 2d 4h, 3h 15min, 20min, < 1min)
const formatarDuracao = (ms: number) => {
  if (ms < 60000) return '< 1min';
  const minutos = Math.round(ms / 60000);
  if (minutos < 60) return `${minutos}min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `${horas}h ${minutos % 60}min`;
  return `${Math.floor(horas / 24)}d ${horas % 24}h`;
};

// Barras horizontais ordenadas (uma única medida: quantidade de pedidos)
const BarrasRanking: React.FC<{ grupos: Grupo[]; totalGeral: number; limite?: number }> = ({ grupos, totalGeral, limite }) => {
  const visiveis = limite ? grupos.slice(0, limite) : grupos;
  const maior = Math.max(...visiveis.map((g) => g.total), 1);
  return (
    <div className="space-y-1">
      {visiveis.map((g) => (
        <div
          key={g.chave}
          title={`${g.rotulo}${g.subrotulo ? ` (${g.subrotulo})` : ''}: ${g.total} pedido(s) • ${percentual(g.total, totalGeral)}% do total • ${g.concluido} concluído(s)`}
          className="grid grid-cols-[minmax(0,10rem)_1fr_5.5rem] sm:grid-cols-[minmax(0,14rem)_1fr_5.5rem] items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">{g.rotulo}</p>
            {g.subrotulo && <p className="text-[11px] text-slate-400 truncate">{g.subrotulo}</p>}
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(g.total / maior) * 100}%` }}></div>
          </div>
          <p className="text-sm text-slate-700 tabular-nums text-right whitespace-nowrap">
            <span className="font-bold">{g.total}</span>
            <span className="text-slate-400 text-xs ml-1.5">{percentual(g.total, totalGeral)}%</span>
          </p>
        </div>
      ))}
      {limite && grupos.length > limite && (
        <p className="text-xs text-slate-400 px-2 pt-1">
          Exibindo os {limite} maiores de {grupos.length}. Veja todos na tabela abaixo.
        </p>
      )}
    </div>
  );
};

// Tabela com o detalhamento por status de cada grupo
const TabelaGrupos: React.FC<{ grupos: Grupo[]; colunaRotulo: string; mostrarTipos?: boolean }> = ({ grupos, colunaRotulo, mostrarTipos = true }) => (
  <div className="overflow-x-auto border-t border-slate-100">
    <table className="w-full text-left border-collapse">
      <thead className="bg-slate-50 border-b border-slate-200">
        <tr>
          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{colunaRotulo}</th>
          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Total</th>
          {mostrarTipos && (
            <>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Acesso</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Reset</th>
            </>
          )}
          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Não Iniciado</th>
          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Em Andamento</th>
          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Concluído</th>
          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">% Concluído</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {grupos.map((g) => {
          const taxa = percentual(g.concluido, g.total);
          return (
            <tr key={g.chave} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3">
                <p className="text-sm font-bold text-slate-700">{g.rotulo}</p>
                {g.subrotulo && <p className="text-xs text-slate-400">{g.subrotulo}</p>}
              </td>
              <td className="px-4 py-3 text-center font-mono font-bold text-slate-700">{g.total}</td>
              {mostrarTipos && (
                <>
                  <td className="px-4 py-3 text-center text-sm text-slate-600 tabular-nums">{g.acesso}</td>
                  <td className="px-4 py-3 text-center text-sm text-slate-600 tabular-nums">{g.reset}</td>
                </>
              )}
              <td className="px-4 py-3 text-center">
                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200">{g.naoIniciado}</span>
              </td>
              <td className="px-4 py-3 text-center">
                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold border border-amber-100">{g.emAndamento}</span>
              </td>
              <td className="px-4 py-3 text-center">
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-100">{g.concluido}</span>
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${taxa}%` }}></div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">{taxa}%</span>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const Painel: React.FC<{ titulo: string; descricao: string; icone: React.ReactNode; children: React.ReactNode }> = ({ titulo, descricao, icone, children }) => (
  <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-100">
      <h3 className="font-bold text-slate-800 flex items-center gap-2">
        {icone}
        {titulo}
      </h3>
      <p className="text-xs text-slate-400 mt-0.5">{descricao}</p>
    </div>
    {children}
  </section>
);

export const IndicadoresAcesso: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoIndicador[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    // Proteção: se não houver token, volta para o login
    if (!localStorage.getItem('access_token')) {
      navigate('/login');
      return;
    }

    const fetchIndicadores = async () => {
      try {
        const response = await api.get('/gestao-acesso/indicadores');
        setSolicitacoes(response.data);
      } catch (error: any) {
        console.error('Erro ao buscar indicadores de acesso', error);
        if (error.response?.status === 401) {
          handleLogout();
        } else if (error.response?.status === 403) {
          navigate('/gestao-acesso');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchIndicadores();
  }, [navigate]);

  // Proteção de Cargo: apenas o Gestor Master acessa o painel
  useEffect(() => {
    if (user && user.cargo !== 'gestor-master') {
      navigate('/gestao-acesso');
    }
  }, [user, navigate]);

  const empresas = useMemo(
    () => Array.from(new Set(solicitacoes.map((s) => s.empresa))).sort(),
    [solicitacoes],
  );

  const filtradas = useMemo(() => {
    const inicio = filtros.de ? new Date(`${filtros.de}T00:00:00`) : null;
    const fim = filtros.ate ? new Date(`${filtros.ate}T23:59:59.999`) : null;
    return solicitacoes.filter((s) => {
      const criada = new Date(s.data_criacao);
      if (inicio && criada < inicio) return false;
      if (fim && criada > fim) return false;
      if (filtros.empresa && s.empresa !== filtros.empresa) return false;
      if (filtros.tipo && s.tipo !== filtros.tipo) return false;
      return true;
    });
  }, [solicitacoes, filtros]);

  const resumo = useMemo(() => {
    const concluidas = filtradas.filter((s) => s.status === 'Concluído' && s.data_conclusao);
    const tempoMedio = concluidas.length
      ? concluidas.reduce((soma, s) => soma + (new Date(s.data_conclusao!).getTime() - new Date(s.data_criacao).getTime()), 0) / concluidas.length
      : null;
    return {
      total: filtradas.length,
      naoIniciado: filtradas.filter((s) => s.status === 'Não Iniciado').length,
      emAndamento: filtradas.filter((s) => s.status === 'Iniciado' || s.status === 'Pendente').length,
      concluido: filtradas.filter((s) => s.status === 'Concluído').length,
      tempoMedio,
    };
  }, [filtradas]);

  const porTipo = useMemo(
    () => agrupar(filtradas, (s) => s.tipo, (s) => ({ rotulo: TIPO_LABEL[s.tipo] })),
    [filtradas],
  );
  const porEmpresa = useMemo(
    () => agrupar(filtradas, (s) => s.empresa, (s) => ({ rotulo: s.empresa })),
    [filtradas],
  );
  const porSolicitante = useMemo(
    () => agrupar(filtradas, (s) => s.matricula_solicitante, (s) => ({ rotulo: s.nome_solicitante, subrotulo: s.matricula_solicitante })),
    [filtradas],
  );

  const temFiltroAtivo = !!(filtros.de || filtros.ate || filtros.empresa || filtros.tipo);

  return (
    <AppLayout title="Indicadores de Acesso" icon={BarChart3} back={{ to: '/gestao-acesso', label: 'Gestão de Acesso' }}>
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-indigo-600" size={40} aria-label="Carregando indicadores" />
        </div>
      ) : (
        <>
          {/* Filtros (uma linha acima dos gráficos) */}
          <div className="flex flex-col lg:flex-row lg:items-end gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-400 lg:pb-2.5">
              <Filter size={18} />
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Filtros</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
              <div className="space-y-1">
                <label className={labelClass}>Pedidos de</label>
                <input
                  type="date" className={inputClass} max={filtros.ate || undefined}
                  value={filtros.de} onChange={(e) => setFiltros({ ...filtros, de: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Até</label>
                <input
                  type="date" className={inputClass} min={filtros.de || undefined}
                  value={filtros.ate} onChange={(e) => setFiltros({ ...filtros, ate: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Empresa</label>
                <Select className={inputClass} value={filtros.empresa} onChange={(e) => setFiltros({ ...filtros, empresa: e.target.value })}>
                  <option value="">Todas</option>
                  {empresas.map((empresa) => (
                    <option key={empresa} value={empresa}>{empresa}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Tipo do Pedido</label>
                <Select className={inputClass} value={filtros.tipo} onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}>
                  <option value="">Todos</option>
                  <option value="acesso">{TIPO_LABEL.acesso}</option>
                  <option value="reset_senha">{TIPO_LABEL.reset_senha}</option>
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

          {/* Cards de Resumo */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Pedidos</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tabular-nums">{resumo.total}</span>
                <TrendingUp size={16} className="text-indigo-500" />
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Não Iniciados</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tabular-nums">{resumo.naoIniciado}</span>
                <Clock size={16} className="text-slate-400" />
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Em Andamento</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tabular-nums">{resumo.emAndamento}</span>
                <PlayCircle size={16} className="text-amber-500" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Iniciados + Pendentes</p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Concluídos</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tabular-nums">{resumo.concluido}</span>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{percentual(resumo.concluido, resumo.total)}% do total</p>
            </div>
            <div className="col-span-2 lg:col-span-1 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Tempo Médio de Conclusão</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tabular-nums">
                  {resumo.tempoMedio !== null ? formatarDuracao(resumo.tempoMedio) : '—'}
                </span>
                <Timer size={16} className="text-indigo-500" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Da abertura até a conclusão</p>
            </div>
          </div>

          {resumo.total === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-16 text-center text-slate-400">
              {temFiltroAtivo ? 'Nenhum pedido encontrado com os filtros aplicados.' : 'Nenhum pedido registrado até o momento.'}
            </div>
          ) : (
            <>
              {/* Por Tipo do Pedido (motivo) */}
              <Painel
                titulo="Por Tipo do Pedido"
                descricao="Solicitação de Acesso x Reset de Senha"
                icone={<Layers size={20} className="text-indigo-500" />}
              >
                <div className="p-4">
                  <BarrasRanking grupos={porTipo} totalGeral={resumo.total} />
                </div>
                <TabelaGrupos grupos={porTipo} colunaRotulo="Tipo" mostrarTipos={false} />
              </Painel>

              {/* Por Empresa */}
              <Painel
                titulo="Por Empresa"
                descricao="Empresa informada no pedido (a do técnico)"
                icone={<Briefcase size={20} className="text-indigo-500" />}
              >
                <div className="p-4">
                  <BarrasRanking grupos={porEmpresa} totalGeral={resumo.total} limite={10} />
                </div>
                <TabelaGrupos grupos={porEmpresa} colunaRotulo="Empresa" />
              </Painel>

              {/* Por Solicitante */}
              <Painel
                titulo="Por Solicitante"
                descricao="Quem abriu os pedidos (usuário logado no momento da abertura)"
                icone={<Users size={20} className="text-indigo-500" />}
              >
                <div className="p-4">
                  <BarrasRanking grupos={porSolicitante} totalGeral={resumo.total} limite={10} />
                </div>
                <TabelaGrupos grupos={porSolicitante} colunaRotulo="Solicitante" />
              </Painel>
            </>
          )}
        </>
      )}
    </AppLayout>
  );
};
