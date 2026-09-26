import React from 'react';
import { ChevronDown } from 'lucide-react';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

// Select estilizado: remove a seta nativa (diferente em cada navegador) e exibe o ChevronDown
export const Select: React.FC<SelectProps> = ({ className = '', children, disabled, ...props }) => (
  <div className="relative">
    <select
      {...props}
      disabled={disabled}
      className={`${className} appearance-none pr-10 cursor-pointer disabled:cursor-not-allowed`}
    >
      {children}
    </select>
    <ChevronDown
      size={18}
      className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${disabled ? 'text-slate-300' : 'text-slate-400'}`}
    />
  </div>
);
