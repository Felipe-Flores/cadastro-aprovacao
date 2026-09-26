import React, { useEffect, useContext, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { Select } from '../components/Select';
import { Toast, useToast } from '../components/Toast';
import { AuthContext } from '../contexts/AuthContext';
import api from '../api/api';
import {
  UserPlus,
  Shield,
  Badge,
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';

interface UserData {
  id: number;
  matricula: string;
  nome: string;
  empresa: string;
  cargo: string;
}

const initialFormData = {
  matricula: '',
  nome: '',
  empresa: '',
  cargo: 'solicitante',
  senha: '',
  confirmarSenha: '',
};

const labelClass = 'block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2';
const inputClass =
  'w-full h-12 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-base placeholder:text-slate-400';
const selectClass =
  'w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-base';

export const UserForm: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const matriculaParam = searchParams.get('matricula');
  const autoSearchDone = useRef(false);

  const [acao, setAcao] = useState<'novo' | 'alterar'>(matriculaParam ? 'alterar' : 'novo');
  const [formData, setFormData] = useState({
    ...initialFormData,
    matricula: matriculaParam ? matriculaParam.toUpperCase() : '',
  });
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [usuarioEncontrado, setUsuarioEncontrado] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [usuarios, setUsuarios] = useState<UserData[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const { toast, showToast } = useToast();

  useEffect(() => {
    if (user && user.cargo !== 'gestor-master') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await api.get('/usuarios');
        setUsuarios(response.data);
      } catch (error: any) {
        if (error.response?.status === 401) {
          logout();
          navigate('/login');
        }
      } finally {
        setLoadingUsuarios(false);
      }
    };
    fetchUsuarios();
  }, [logout, navigate]);


  const limparFormulario = () => {
    setFormData(initialFormData);
    setErrors({});
    setEditingUserId(null);
    setUsuarioEncontrado(false);
    setShowSenha(false);
    setShowConfirmarSenha(false);
  };

  const handleAcaoChange = (value: 'novo' | 'alterar') => {
    setAcao(value);
    limparFormulario();
  };

  const handleBuscar = (matriculaOverride?: string) => {
    if (loadingUsuarios) return;

    const matriculaNorm = (matriculaOverride ?? formData.matricula).trim().toUpperCase();
    if (!matriculaNorm) {
      setErrors((prev) => ({ ...prev, matricula: 'Usuário inexistente' }));
      setUsuarioEncontrado(false);
      setEditingUserId(null);
      return;
    }

    const encontrado = usuarios.find(
      (u) => u.matricula.toUpperCase() === matriculaNorm
    );

    if (!encontrado) {
      setFormData((prev) => ({ ...prev, matricula: matriculaNorm }));
      setErrors((prev) => ({ ...prev, matricula: 'Usuário inexistente' }));
      setUsuarioEncontrado(false);
      setEditingUserId(null);
      return;
    }

    setErrors((prev) => {
      const next = { ...prev };
      delete next.matricula;
      return next;
    });
    setFormData({
      matricula: encontrado.matricula,
      nome: encontrado.nome,
      empresa: encontrado.empresa,
      cargo: encontrado.cargo,
      senha: '',
      confirmarSenha: '',
    });
    setEditingUserId(encontrado.id);
    setUsuarioEncontrado(true);
  };

  useEffect(() => {
    if (!loadingUsuarios && matriculaParam && !autoSearchDone.current) {
      autoSearchDone.current = true;
      setAcao('alterar');
      handleBuscar(matriculaParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingUsuarios, matriculaParam, usuarios]);

  const handleChange = (field: keyof typeof initialFormData, value: string) => {
    let nextValue = value;
    if (field === 'matricula' || field === 'nome') {
      nextValue = value.toUpperCase();
    }

    setFormData((prev) => ({ ...prev, [field]: nextValue }));

    if (field === 'matricula' && errors.matricula) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.matricula;
        return next;
      });
    }

    if (field === 'senha' || field === 'confirmarSenha') {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.confirmarSenha;
        return next;
      });
    }
  };

  const senhasNaoCoincidem =
    formData.confirmarSenha.length > 0 && formData.confirmarSenha !== formData.senha;

  const extractErrorMessage = (error: any): string => {
    const msg = error.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
    return 'Erro ao salvar usuário.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (senhasNaoCoincidem) {
      setErrors((prev) => ({ ...prev, confirmarSenha: 'As senhas não coincidem' }));
      return;
    }

    if (formData.senha && formData.senha.length < 4) {
      showToast('A senha deve ter no mínimo 4 caracteres.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      if (acao === 'novo') {
        const response = await api.post('/usuarios', {
          matricula: formData.matricula,
          nome: formData.nome,
          empresa: formData.empresa,
          cargo: formData.cargo,
          senha: formData.senha,
        });
        setUsuarios((prev) => [...prev, response.data]);
        showToast('Usuário cadastrado com sucesso!', 'success');
        limparFormulario();
        return;
      }

      if (acao === 'alterar' && editingUserId) {
        const payload: Record<string, string> = {
          matricula: formData.matricula,
          nome: formData.nome,
          empresa: formData.empresa,
          cargo: formData.cargo,
        };
        if (formData.senha) {
          payload.senha = formData.senha;
        }
        const response = await api.patch(`/usuarios/${editingUserId}`, payload);
        setUsuarios((prev) => prev.map((u) => (u.id === editingUserId ? response.data : u)));
        showToast('Usuário atualizado com sucesso!', 'success');
        return;
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
        return;
      }
      showToast(extractErrorMessage(error), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const mostrarFormularioCompleto = acao === 'novo' || (acao === 'alterar' && usuarioEncontrado);

  return (
    <AppLayout title="Cadastro de Usuários" icon={UserPlus}>
      <Toast toast={toast} />
        <div className="w-full flex flex-col md:flex-row bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
          <div className="w-full md:w-5/12 bg-gradient-to-br from-blue-950 via-indigo-900 to-blue-800 text-white p-8 md:p-12 flex flex-col justify-between">

            <div>
              <div className="w-12 h-12 bg-white/10 text-white rounded-xl flex items-center justify-center mb-8">
                <UserPlus size={24} aria-hidden="true" />
              </div>
              <h2 className="text-xl font-bold text-white mb-4">Gestão de Identidade</h2>
              <p className="text-base text-blue-100 leading-relaxed">
                Gerencie os acessos do sistema de forma centralizada. Adicione novos colaboradores ou
                atualize permissões existentes com segurança.
              </p>
            </div>

            <div className="mt-12 hidden md:block">
              <div className="p-4 rounded-xl border border-white/20 bg-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <Shield size={16} className="text-blue-200" aria-hidden="true" />
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                    Dica de Segurança
                  </span>
                </div>
                <p className="text-sm text-blue-50">
                  Senhas devem conter pelo menos 8 caracteres, incluindo letras maiúsculas, números e
                  símbolos.
                </p>
              </div>
            </div>
          </div>

          <div className="w-full md:w-7/12 bg-white p-8 md:p-12">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className={labelClass} htmlFor="acao">
                    Ação Desejada
                  </label>
                  <Select
                    id="acao"
                    value={acao}
                    onChange={(e) => handleAcaoChange(e.target.value as 'novo' | 'alterar')}
                    className={selectClass}
                  >
                    <option value="novo">Novo Usuário</option>
                    <option value="alterar">Alterar Usuário</option>
                  </Select>
                </div>

                {acao === 'alterar' && !usuarioEncontrado && (
                  <div className="md:col-span-2">
                    <label className={labelClass} htmlFor="matricula-busca">
                      Matrícula
                    </label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Badge
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                        />
                        <input
                          id="matricula-busca"
                          type="text"
                          placeholder="Ex: A0099999, 80999999"
                          value={formData.matricula}
                          onChange={(e) => handleChange('matricula', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleBuscar();
                            }
                          }}
                          className={`${inputClass} pl-11 pr-4`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleBuscar()}
                        disabled={loadingUsuarios}
                        className="h-12 px-6 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {loadingUsuarios ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Buscar
                          </>
                        ) : (
                          'Buscar'
                        )}
                      </button>
                    </div>
                    {errors.matricula && (
                      <p className="mt-2 text-sm text-red-600">{errors.matricula}</p>
                    )}
                  </div>
                )}

                {mostrarFormularioCompleto && (
                  <>
                    <div>
                      <label className={labelClass} htmlFor="matricula">
                        Matrícula
                      </label>
                      <div className="relative">
                        <Badge
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                        />
                        <input
                          id="matricula"
                          type="text"
                          required
                          placeholder="000000"
                          value={formData.matricula}
                          onChange={(e) => handleChange('matricula', e.target.value)}
                          className={`${inputClass} pl-11 pr-4`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="empresa">
                        Empresa
                      </label>
                      <Select
                        id="empresa"
                        required
                        value={formData.empresa}
                        onChange={(e) => handleChange('empresa', e.target.value)}
                        className={selectClass}
                      >
                        <option value="" disabled>
                          Selecione...
                        </option>
                        <option value="TELEMONT">TELEMONT</option>
                        <option value="VIVO">VIVO</option>
                        <option value="ONDACOM">ONDACOM</option>
                        <option value="ABILITY">ABILITY</option>
                        <option value="ICOMON">ICOMON</option>
                      </Select>
                    </div>

                    <div className="md:col-span-2">
                      <label className={labelClass} htmlFor="nome">
                        Nome Completo
                      </label>
                      <div className="relative">
                        <User
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                        />
                        <input
                          id="nome"
                          type="text"
                          required
                          placeholder="Ex: João Silva Sauro"
                          value={formData.nome}
                          onChange={(e) => handleChange('nome', e.target.value)}
                          className={`${inputClass} pl-11 pr-4`}
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className={labelClass} htmlFor="cargo">
                        Cargo / Nível de Acesso
                      </label>
                      <Select
                        id="cargo"
                        value={formData.cargo}
                        onChange={(e) => handleChange('cargo', e.target.value)}
                        className={selectClass}
                      >
                        <option value="solicitante">Solicitante</option>
                        <option value="gestor">Gestor</option>
                        <option value="gestor-parceiro">Gestor Parceiro</option>
                        <option value="gestor-master">Gestor Master</option>
                      </Select>
                    </div>

                    <div className="md:col-span-2">
                      <label className={labelClass} htmlFor="senha">
                        Senha de Acesso
                      </label>
                      <div className="relative">
                        <Lock
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                        />
                        <input
                          id="senha"
                          type={showSenha ? 'text' : 'password'}
                          required={acao === 'novo'}
                          autoComplete="new-password"
                          placeholder={
                            acao === 'alterar' ? 'Deixe em branco para manter' : '••••••••'
                          }
                          value={formData.senha}
                          onChange={(e) => handleChange('senha', e.target.value)}
                          className={`${inputClass} pl-11 pr-12`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSenha(!showSenha)}
                          aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                          aria-pressed={showSenha}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                        >
                          {showSenha ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                        </button>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className={labelClass} htmlFor="confirmar-senha">
                        Confirmar Senha
                      </label>
                      <div className="relative">
                        <Lock
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                        />
                        <input
                          id="confirmar-senha"
                          type={showConfirmarSenha ? 'text' : 'password'}
                          required={acao === 'novo'}
                          autoComplete="new-password"
                          placeholder={
                            acao === 'alterar' ? 'Deixe em branco para manter' : '••••••••'
                          }
                          value={formData.confirmarSenha}
                          onChange={(e) => handleChange('confirmarSenha', e.target.value)}
                          className={`${inputClass} pl-11 pr-12`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                          aria-label={showConfirmarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                          aria-pressed={showConfirmarSenha}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                        >
                          {showConfirmarSenha ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                        </button>
                      </div>
                      {(senhasNaoCoincidem || errors.confirmarSenha) && (
                        <p className="mt-2 text-sm text-red-600">
                          {errors.confirmarSenha || 'As senhas não coincidem'}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {mostrarFormularioCompleto && (
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100 mt-8">
                  <button
                    type="submit"
                    disabled={senhasNaoCoincidem || isSaving}
                    className="flex-1 h-12 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : acao === 'novo' ? (
                      'Cadastrar'
                    ) : (
                      'Atualizar'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    disabled={isSaving}
                    className="flex-1 h-12 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-all active:scale-[0.98]"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
    </AppLayout>
  );
};
