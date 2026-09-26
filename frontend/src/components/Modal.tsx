import React, { useEffect, useRef } from 'react';

interface ModalProps {
  onClose: () => void;
  // id do título do modal (aria-labelledby)
  labelledBy: string;
  // Classes do painel (largura, padding etc.)
  className?: string;
  // z-index do overlay; modais de confirmação sobre outros modais usam valor maior
  zIndex?: number;
  children: React.ReactNode;
}

const FOCAVEIS =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Pilha de modais abertos: Esc e o foco preso valem apenas para o modal do topo
const pilha: symbol[] = [];

export const Modal: React.FC<ModalProps> = ({ onClose, labelledBy, className = '', zIndex = 50, children }) => {
  const painelRef = useRef<HTMLDivElement>(null);
  // Mantém a referência atual sem reinstalar os listeners a cada render
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const id = Symbol('modal');
    pilha.push(id);
    const noTopo = () => pilha[pilha.length - 1] === id;

    const focoAnterior = document.activeElement as HTMLElement | null;
    const painel = painelRef.current;
    // Foca o primeiro campo do modal; se não houver, o próprio painel
    const primeiro = painel?.querySelector<HTMLElement>('input, select, textarea') ?? painel;
    primeiro?.focus();

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!noTopo() || !painel) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const focaveis = Array.from(painel.querySelectorAll<HTMLElement>(FOCAVEIS));
      if (!focaveis.length) {
        e.preventDefault();
        return;
      }
      const inicio = focaveis[0];
      const fim = focaveis[focaveis.length - 1];
      if (e.shiftKey && (document.activeElement === inicio || document.activeElement === painel)) {
        e.preventDefault();
        fim.focus();
      } else if (!e.shiftKey && document.activeElement === fim) {
        e.preventDefault();
        inicio.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      pilha.splice(pilha.indexOf(id), 1);
      if (!pilha.length) document.body.style.overflow = overflowAnterior;
      focoAnterior?.focus?.();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overscroll-contain animate-in fade-in duration-200"
      style={{ zIndex }}
    >
      <div
        ref={painelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`bg-white rounded-2xl shadow-2xl w-full focus:outline-none animate-in zoom-in-95 duration-200 ${className}`}
      >
        {children}
      </div>
    </div>
  );
};
