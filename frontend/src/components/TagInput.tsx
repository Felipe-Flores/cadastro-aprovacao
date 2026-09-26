import React, { useState } from 'react';
import { Tag, X } from 'lucide-react';

interface TagInputProps {
  id?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
}

// Campo de tags: Enter ou vírgula adiciona, "x" remove, Backspace com campo vazio remove a última
export const TagInput: React.FC<TagInputProps> = ({ id, value, onChange, placeholder, maxLength = 100, disabled }) => {
  const [texto, setTexto] = useState('');

  const adicionar = () => {
    const nova = texto.trim().replace(/,+$/, '').trim();
    setTexto('');
    if (!nova) return;
    // Evita duplicadas (sem diferenciar maiúsculas/minúsculas)
    if (value.some((tag) => tag.toLowerCase() === nova.toLowerCase())) return;
    onChange([...value, nova]);
  };

  const remover = (tag: string) => onChange(value.filter((t) => t !== tag));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      adicionar();
    } else if (e.key === 'Backspace' && !texto && value.length) {
      remover(value[value.length - 1]);
    }
  };

  return (
    <div
      className={`w-full min-h-[46px] flex flex-wrap items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500 transition-all ${disabled ? 'opacity-60' : ''}`}
    >
      {value.map((tag) => (
        <span key={tag} className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-bold">
          <Tag size={12} aria-hidden="true" />
          {tag}
          {!disabled && (
            <button type="button" onClick={() => remover(tag)} className="p-0.5 rounded-full hover:bg-indigo-100" aria-label={`Remover ${tag}`}>
              <X size={12} aria-hidden="true" />
            </button>
          )}
        </span>
      ))}
      {!disabled && (
        <input
          id={id}
          type="text"
          maxLength={maxLength}
          placeholder={value.length ? '' : placeholder}
          className="flex-1 min-w-[160px] bg-transparent py-1 text-sm focus:outline-none"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={adicionar}
        />
      )}
    </div>
  );
};
