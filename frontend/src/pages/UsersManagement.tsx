import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../api/api';
import {
  LogOut,
  UserPlus,
  Loader2,
  Users as UsersIcon,
  Search,
  Check,
  AlertCircle,
  ArrowLeft,
  Pencil,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

interface UserData {
  id: number;
  matricula: string;
  nome: string;
  empresa: string;
  cargo: string;
}

export const UsersManagement: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const [usuarios, setUsuarios] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (user && user.cargo !== 'gestor-master') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const state = location.state as {
      toastMessage?: string;
      toastType?: 'success' | 'error';
    } | null;

    if (state?.toastMessage) {
      showToast(state.toastMessage, state.toastType || 'success');
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

  const handleDeleteClick = (u: UserData) => {
    setUserToDelete(u);
    setIsDeleteModalOpen(true);
  };

  const fetchUsuarios = async () => {
    try {
      const response = await api.get('/usuarios');
      setUsuarios(response.data);
    } catch (error: any) {
      console.error('Erro ao buscar usuários', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      }
      showToast('Erro ao carregar lista de usuários.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setIsSaving(true);
    try {
      await api.delete(`/usuarios/${userToDelete.id}`);
      showToast('Usuário removido com sucesso.', 'success');
      fetchUsuarios();
    } catch (error) {
      showToast('Erro ao remover usuário.', 'error');
    } finally {
      setIsSaving(false);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const filteredUsuarios = usuarios.filter(
    (u) =>
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.empresa.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>
            <div className="flex items-center gap-2 text-indigo-600">
              <UsersIcon size={24} strokeWidth={2.5} />
              <span className="text-xl font-bold text-slate-900 tracking-tight">
                Gestão de Usuários
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {user && (
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-slate-900 leading-none">{user?.nome}</p>
                <p className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider mt-1">
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

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome, matrícula ou empresa..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => navigate('/usuarios/cadastro')}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-100"
          >
            <UserPlus size={18} />
            Novo Usuário
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Matrícula
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Cargo
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                      Carregando usuários...
                    </td>
                  </tr>
                ) : filteredUsuarios.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredUsuarios.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 font-mono text-sm font-semibold text-indigo-600">
                        {u.matricula}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-700">{u.nome}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{u.empresa}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider border ${
                            u.cargo === 'gestor-master'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                              : u.cargo === 'gestor'
                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {u.cargo}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-4">
                          <button
                            onClick={() =>
                              navigate('/usuarios/cadastro?matricula=' + u.matricula)
                            }
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Editar Usuário"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(u)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Excluir Usuário"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4 border border-red-100">
                <AlertTriangle size={30} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Remover Acesso</h3>
              <p className="text-sm text-slate-500 mt-2">
                Tem certeza que deseja excluir o usuário{' '}
                <span className="font-bold text-slate-700">{userToDelete?.nome}</span>?
              </p>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={isSaving}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-100 transition-all text-sm disabled:bg-red-300"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-6 right-6 z-[100] animate-in fade-in slide-in-from-right-8 duration-300">
          <div
            className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border ${
              toast.type === 'success'
                ? 'bg-white border-emerald-100 text-emerald-800'
                : 'bg-white border-red-100 text-red-800'
            }`}
          >
            {toast.type === 'success' ? (
              <Check size={18} className="text-emerald-600" />
            ) : (
              <AlertCircle size={18} className="text-red-600" />
            )}
            <p className="text-sm font-bold">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};
