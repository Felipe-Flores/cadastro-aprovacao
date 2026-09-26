import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../api/api';
import { ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { matricula, senha });
      const { access_token, nome, cargo, empresa } = response.data;
      login(access_token, { nome, cargo, matricula, empresa });
      navigate('/dashboard'); // <--- Redireciona para a Dashboard
    } catch (err: any) {
      // Captura a mensagem do NestJS ou usa uma padrão
      const message = err.response?.data?.message || 'Falha na conexão com o servidor.';
      setError(typeof message === 'string' ? message : 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-10">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
            <ShieldCheck size={40} />
          </div>
        </div>
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Portal de Gestão
          </h1>
          <p className="text-slate-500 mt-2">Entre com suas credenciais de acesso</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="login-matricula" className="block text-sm font-semibold text-slate-700 mb-2">Matrícula</label>
            <input
              id="login-matricula"
              name="matricula"
              type="text"
              autoComplete="username"
              autoCapitalize="characters"
              spellCheck={false}
              autoFocus
              required
              placeholder="A00xxx, G00xxx, 8081xxx"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="login-senha" className="block text-sm font-semibold text-slate-700 mb-2">Senha</label>
            <div className="relative">
              <input
                id="login-senha"
                name="senha"
                autoComplete="current-password"
                type={showSenha ? 'text' : 'password'}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-12"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={showSenha}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-600 transition-colors rounded"
              >
                {showSenha ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={18} aria-hidden="true" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-sm disabled:bg-slate-300"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};