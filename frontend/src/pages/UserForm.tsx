import React, { useEffect, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import {
  ArrowLeft,
  LogOut,
  UserPlus,
  Shield,
  Info,
  Badge,
} from 'lucide-react';

const initialFormData = {
  matricula: '',
  nome: '',
  empresa: '',
  cargo: 'solicitante',
  senha: '',
  confirmarSenha: '',
};

export const UserForm: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [acao, setAcao] = useState<'novo' | 'alterar'>('novo');
  const [formData, setFormData] = useState(initialFormData);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [usuarioEncontrado, setUsuarioEncontrado] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && user.cargo !== 'gestor-master') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const limparFormulario = () => {
    setFormData(initialFormData);
    setErrors({});
    setEditingUserId(null);
    setUsuarioEncontrado(false);
  };

  const handleAcaoChange = (value: 'novo' | 'alterar') => {
    setAcao(value);
    limparFormulario();
  };

  const mostrarFormularioCompleto = acao === 'novo' || (acao === 'alterar' && usuarioEncontrado);

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/usuarios')}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 flex items-center gap-2 text-sm font-medium"
            >
              <ArrowLeft size={18} />
              Voltar
            </button>
            <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>
            <div className="flex items-center gap-2 text-primary">
              <UserPlus size={24} strokeWidth={2.5} />
              <span className="text-xl font-bold text-on-surface tracking-tight">
                Cadastro de Usuários
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {user && (
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-on-surface leading-none">{user?.nome}</p>
                <p className="text-[10px] uppercase font-semibold text-on-surface-variant tracking-wider mt-1">
                  {user?.cargo}
                </p>
              </div>
            )}
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="text-slate-500 hover:text-red-600 font-medium text-sm flex items-center gap-2 transition-colors"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-5xl flex flex-col md:flex-row bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_10px_20px_rgba(0,0,0,0.05)] border border-outline-variant">
          <div className="w-full md:w-5/12 bg-primary p-8 md:p-12 flex flex-col justify-between relative overflow-hidden text-on-primary">
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary-container opacity-20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>

            <div className="relative z-10">
              <div className="w-12 h-12 bg-on-primary/10 rounded-xl flex items-center justify-center mb-8">
                <UserPlus size={24} className="text-white" />
              </div>
              <h2 className="text-xl font-semibold mb-4">Gestão de Identidade</h2>
              <p className="text-base opacity-80 leading-relaxed">
                Gerencie os acessos do sistema de forma centralizada. Adicione novos colaboradores ou
                atualize permissões existentes com segurança.
              </p>
            </div>

            <div className="mt-12 relative z-10 hidden md:block">
              <div className="p-4 rounded-lg border border-white/20 bg-white/5 mb-4 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-2">
                  <Shield size={16} className="text-white" />
                  <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                    Dica de Segurança
                  </span>
                </div>
                <p className="text-xs opacity-90">
                  Senhas devem conter pelo menos 8 caracteres, incluindo letras maiúsculas, números e
                  símbolos.
                </p>
              </div>
              <div className="flex items-center gap-2 opacity-60">
                <Info size={14} />
                <span className="text-[10px] uppercase font-bold tracking-widest">v2.4.0 Stable</span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-7/12 bg-white p-8 md:p-12">
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2"
                    htmlFor="acao"
                  >
                    Ação Desejada
                  </label>
                  <select
                    id="acao"
                    value={acao}
                    onChange={(e) => handleAcaoChange(e.target.value as 'novo' | 'alterar')}
                    className="w-full h-12 px-4 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-base"
                  >
                    <option value="novo">Novo Usuário</option>
                    <option value="alterar">Alterar Usuário</option>
                  </select>
                </div>

                {acao === 'alterar' && !usuarioEncontrado && (
                  <div className="md:col-span-2">
                    <label
                      className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2"
                      htmlFor="matricula-busca"
                    >
                      Matrícula
                    </label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Badge
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"
                        />
                        <input
                          id="matricula-busca"
                          type="text"
                          placeholder="000000"
                          value={formData.matricula}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              matricula: e.target.value.toUpperCase(),
                            }))
                          }
                          className="w-full h-12 pl-11 pr-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-base placeholder:text-outline/50"
                        />
                      </div>
                      <button
                        type="button"
                        className="h-12 px-6 bg-primary text-on-primary font-semibold text-sm rounded-lg hover:bg-primary-container transition-all"
                      >
                        Buscar
                      </button>
                    </div>
                    {errors.matricula && (
                      <p className="mt-2 text-sm text-red-600">{errors.matricula}</p>
                    )}
                  </div>
                )}

                {mostrarFormularioCompleto && (
                  <>
                    {/* Demais campos serão implementados nas próximas tasks */}
                    <div className="md:col-span-2 text-sm text-on-surface-variant">
                      Formulário completo (modo {acao === 'novo' ? 'novo' : 'alterar'})
                    </div>
                  </>
                )}
              </div>

              {mostrarFormularioCompleto && (
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-outline-variant/30 mt-8">
                  <button
                    type="submit"
                    className="flex-1 h-12 bg-primary text-on-primary font-semibold text-sm rounded-lg hover:bg-primary-container transition-all active:scale-[0.98] shadow-sm"
                  >
                    {acao === 'novo' ? 'Cadastrar' : 'Atualizar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/usuarios')}
                    className="flex-1 h-12 bg-transparent border border-outline-variant text-on-surface font-semibold text-sm rounded-lg hover:bg-surface-container-low transition-all active:scale-[0.98]"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};
