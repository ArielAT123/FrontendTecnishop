import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

export interface IncompleteCartModalProps {
  errors: string[] | null;
  onClose: () => void;
}

export const IncompleteCartModal: React.FC<IncompleteCartModalProps> = ({
  errors,
  onClose,
}) => {
  if (!errors) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800/60 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn">
        <div className="p-6 bg-gradient-to-b from-amber-50 dark:from-amber-950/20 to-transparent border-b border-amber-100 dark:border-amber-900/40">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                No se puede emitir esta factura si hay productos o servicios que faltan por completar
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Se detectaron los siguientes ítems con información incompleta o vacía:
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 max-h-72 overflow-y-auto space-y-2.5">
          {errors.map((errText, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200"
            >
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="font-medium leading-relaxed">{errText}</span>
            </div>
          ))}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-[#3498db] hover:bg-[#2980b9] text-white font-bold text-xs px-5 py-2 rounded-xl shadow-md shadow-[#3498db]/20"
          >
            Entendido, ir a completar
          </Button>
        </div>
      </div>
    </div>
  );
};
