import React, { useContext } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { getInitials } from '../utils/getInitials';
import {
  LayoutDashboard,
  ClipboardList,
  KeyRound,
  BarChart3,
  Users,
  LogOut,
  ChevronLeft,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  cargos?: string[]; // sem cargos = visível para todos
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Atividades', icon: ClipboardList },
  { to: '/gestao-acesso', label: 'Gestão de Acesso', icon: KeyRound },
  { to: '/analytics', label: 'Indicadores', icon: BarChart3, cargos: ['gestor', 'gestor-master'] },
  { to: '/usuarios', label: 'Usuários', icon: Users, cargos: ['gestor-master'] },
];

interface AppLayoutProps {
  title: string;
  icon?: LucideIcon;
  // Link de retorno exibido acima do título (páginas filhas, ex.: Indicadores de Acesso)
  back?: { to: string; label: string };
  // Ações à direita do título (botões primários da página)
  actions?: React.ReactNode;
  children: React.ReactNode;
}

// Estrutura comum das páginas autenticadas: menu superior único + cabeçalho com <h1>
export const AppLayout: React.FC<AppLayoutProps> = ({
  title,
  icon: Icon,
  back,
  actions,
  children,
}) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const itensVisiveis = NAV_ITEMS.filter((item) => !item.cargos || (user && item.cargos.includes(user.cargo)));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="px-6 lg:px-10 flex flex-wrap items-center gap-x-6">
          <Link to="/dashboard" className="flex items-center gap-2 py-4 text-indigo-600 shrink-0">
            <LayoutDashboard size={24} strokeWidth={2.5} aria-hidden="true" />
            <span className="text-xl font-bold text-slate-900 tracking-tight">Portal de Aprovação</span>
          </Link>

          {/* Em telas pequenas o menu desce para uma segunda linha com rolagem horizontal */}
          <nav aria-label="Principal" className="order-last w-full md:order-none md:w-auto md:flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <ul className="flex items-center gap-1">
              {itensVisiveis.map(({ to, label, icon: ItemIcon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                        isActive
                          ? 'border-indigo-600 text-indigo-700'
                          : 'border-transparent text-slate-500 hover:text-slate-900'
                      }`
                    }
                  >
                    <ItemIcon size={18} aria-hidden="true" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-4 py-3">
            {user && (
              <div className="flex items-center gap-3 sm:pl-1.5 sm:pr-4 sm:py-1.5 sm:bg-slate-100 rounded-full">
                <div
                  className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  aria-hidden="true"
                >
                  {getInitials(user.nome)}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm uppercase font-bold text-slate-900 leading-none">{user.nome}</p>
                  <p className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider mt-1">{user.cargo}</p>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sair"
              className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors font-medium text-sm"
            >
              <LogOut size={18} aria-hidden="true" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full px-6 lg:px-10 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              {back && (
                <Link
                  to={back.to}
                  className="inline-flex items-center gap-1 mb-1 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                  {back.label}
                </Link>
              )}
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                {Icon && <Icon className="text-indigo-500" aria-hidden="true" />}
                {title}
              </h1>
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
};
