import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

interface SortableHeaderProps {
  label: string;
  // Direção atual se esta coluna for a ordenada; null caso contrário
  direction: 'asc' | 'desc' | null;
  onSort: () => void;
  align?: 'left' | 'center';
}

// Cabeçalho de coluna ordenável: botão acessível por teclado e aria-sort para leitores de tela
export const SortableHeader: React.FC<SortableHeaderProps> = ({ label, direction, onSort, align = 'left' }) => {
  const Icone = direction === 'asc' ? ArrowUp : direction === 'desc' ? ArrowDown : ArrowUpDown;
  return (
    <th
      scope="col"
      aria-sort={direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none'}
      className="p-0"
    >
      <button
        type="button"
        onClick={onSort}
        className={`w-full flex items-center gap-1 px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider hover:bg-slate-100 transition-colors focus-visible:outline-offset-[-2px] ${
          align === 'center' ? 'justify-center' : ''
        }`}
      >
        {label}
        <Icone size={12} aria-hidden="true" className={direction ? 'text-indigo-600' : 'text-slate-400'} />
      </button>
    </th>
  );
};
