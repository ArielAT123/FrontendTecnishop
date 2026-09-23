import React from 'react';
import { NumericInput } from '../ui/NumericInput';
import { Producto } from '../../types';
import { Cpu, Plus, X, DollarSign, ShieldCheck } from 'lucide-react';

export interface FichaTecnicaDiagnosticoSectionProps {
  diagnosticoProblemasList: string[];
  problemaInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  handleProblemaChange: (idx: number, val: string) => void;
  handleProblemaKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => void;
  handleRemoveProblema: (idx: number) => void;
  handleAddProblema: () => void;
  tipoChequeoId: string;
  handleSelectChequeo: (id: string) => void;
  chequeos: Producto[];
  precioChequeo: string | number;
  setPrecioChequeo: (val: any) => void;
}

export const FichaTecnicaDiagnosticoSection: React.FC<FichaTecnicaDiagnosticoSectionProps> = ({
  diagnosticoProblemasList,
  problemaInputRefs,
  handleProblemaChange,
  handleProblemaKeyDown,
  handleRemoveProblema,
  handleAddProblema,
  tipoChequeoId,
  handleSelectChequeo,
  chequeos,
  precioChequeo,
  setPrecioChequeo,
}) => {
  return (
    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
        <Cpu className="w-4 h-4 text-emerald-500" />
        <span>2. Diagnóstico Técnico Real & Chequeo de Respaldo</span>
      </h4>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Problemas Reales Detectados por el Técnico (Post-Chequeo) *
            </label>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
              Presiona <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-mono font-bold">Enter ↵</kbd> para agregar otro
            </span>
          </div>

          <div className="space-y-2">
            {diagnosticoProblemasList.map((prob, idx) => (
              <div key={idx} className="flex items-center gap-2 group">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 shrink-0">
                  {idx + 1}
                </span>
                <input
                  ref={(el) => (problemaInputRefs.current[idx] = el)}
                  type="text"
                  value={prob}
                  onChange={(e) => handleProblemaChange(idx, e.target.value)}
                  onKeyDown={(e) => handleProblemaKeyDown(e, idx)}
                  placeholder={
                    idx === 0
                      ? 'Escribe el problema real (ej: Corto en línea principal de 19V)...'
                      : idx === 1
                      ? 'Ej: Celda de batería degradada al 40%...'
                      : idx === 2
                      ? 'Ej: Pasta térmica petrificada...'
                      : 'Escribe otro problema detectado...'
                  }
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3498db]/40 shadow-sm transition-all"
                />
                {diagnosticoProblemasList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveProblema(idx)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors shrink-0"
                    title="Eliminar este renglón"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            <div className="pt-1 flex items-center justify-between">
              <button
                type="button"
                onClick={handleAddProblema}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3498db] hover:text-[#2980b9] dark:hover:text-blue-400 transition-colors py-1 px-2.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar otro problema</span>
              </button>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {diagnosticoProblemasList.filter((p) => p.trim()).length} problema(s) especificado(s)
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tipo de Chequeo / Tarifa de Diagnóstico *
            </label>
            <select
              value={tipoChequeoId}
              onChange={(e) => handleSelectChequeo(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-[#3498db]/40"
            >
              {chequeos.map((chk) => (
                <option key={chk.id} value={chk.id}>
                  {chk.nombre} - ${Number(chk.precio_venta_sugerido || 0).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Precio Chequeo (Editable para Casos Especiales) ($)
            </label>
            <NumericInput
              value={precioChequeo}
              onChange={(val) => setPrecioChequeo(val)}
              placeholder="0.00"
              leftIcon={<DollarSign className="w-3.5 h-3.5" />}
              className="font-bold text-xs"
            />
          </div>

          <div className="sm:col-span-2 text-[11px] text-blue-800 dark:text-blue-300 flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              <strong>Regla de negocio:</strong> Este valor (${Number(precioChequeo).toFixed(2)}) se cobrará <u>ÚNICAMENTE</u> si el cliente rechaza toda la cotización. Si aprueba cualquier servicio o repuesto cotizado, el chequeo será <strong>$0.00 (GRATIS)</strong>.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
