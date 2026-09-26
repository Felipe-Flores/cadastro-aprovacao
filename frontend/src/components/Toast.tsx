import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, AlertCircle } from 'lucide-react';

export interface ToastData {
  message: string;
  type: 'success' | 'error';
}

// Estado do toast com um único timer: uma nova mensagem reinicia a contagem em vez de ser apagada pelo timer anterior
export const useToast = (duracaoMs = 3000) => {
  const [toast, setToast] = useState<ToastData | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback(
    (message: string, type: ToastData['type']) => {
      clearTimeout(timerRef.current);
      setToast({ message, type });
      timerRef.current = setTimeout(() => setToast(null), duracaoMs);
    },
    [duracaoMs],
  );

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return { toast, showToast };
};

// A região aria-live fica sempre montada para que leitores de tela anunciem cada nova mensagem
export const Toast: React.FC<{ toast: ToastData | null }> = ({ toast }) => (
  <div role="status" aria-live="polite" aria-atomic="true" className="fixed top-6 right-6 z-[100]">
    {toast && (
      <div
        className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border bg-white animate-in fade-in slide-in-from-right-8 duration-300 ${
          toast.type === 'success' ? 'border-emerald-100 text-emerald-800' : 'border-red-100 text-red-800'
        }`}
      >
        {toast.type === 'success' ? (
          <div className="bg-emerald-100 p-1 rounded-full text-emerald-600">
            <Check size={18} aria-hidden="true" />
          </div>
        ) : (
          <div className="bg-red-100 p-1 rounded-full text-red-600">
            <AlertCircle size={18} aria-hidden="true" />
          </div>
        )}
        <p className="text-sm font-bold">
          <span className="sr-only">{toast.type === 'success' ? 'Sucesso: ' : 'Erro: '}</span>
          {toast.message}
        </p>
      </div>
    )}
  </div>
);
