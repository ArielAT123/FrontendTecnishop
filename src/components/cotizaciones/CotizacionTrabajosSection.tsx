import React from 'react';
import { Wrench, Plus } from 'lucide-react';
import { Proveedor } from '../../types';
import { EditableTrabajo } from './CotizacionEditorModal';

export interface CotizacionTrabajosSectionProps {
  editTrabajos: EditableTrabajo[];
  setEditTrabajos: React.Dispatch<React.SetStateAction<EditableTrabajo[]>>;
  proveedores: Proveedor[];
  handleOpenNuevoProveedor: (index: number, type: 'repuesto' | 'trabajo') => void;
}

export const CotizacionTrabajosSection: React.FC<CotizacionTrabajosSectionProps> = ({
  editTrabajos,
  setEditTrabajos,
  proveedores,
  handleOpenNuevoProveedor,
}) => {
  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Wrench className="w-4 h-4 text-[#3498db]" />
          <span>Trabajos Realizados / Mano de Obra ({editTrabajos.length})</span>
        </h3>
        <span className="text-[11px] text-slate-400">
          Mano de obra interna o servicios tercerizados
        </span>
      </div>

      {editTrabajos.length === 0 ? (
        <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
          No hay trabajos cotizados en esta ficha técnica.
        </p>
      ) : (
        <div className="space-y-3">
          {editTrabajos.map((item, idx) => {
            const ganancia = item.costo - item.costo_proveedor;
            const margenPct = item.costo > 0 ? (ganancia / item.costo) * 100 : 0;

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
                  <span className="font-semibold text-xs text-slate-900 dark:text-white">
                    {item.descripcion}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Precio Cliente:{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      ${item.costo.toFixed(2)}
                    </strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Proveedor / Tercerizado */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        Taller / Tercerizado (Opcional)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleOpenNuevoProveedor(idx, 'trabajo')}
                        className="text-[11px] text-[#3498db] hover:text-[#2980b9] font-medium transition-colors flex items-center gap-0.5"
                        title="Registrar un nuevo proveedor"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Nuevo</span>
                      </button>
                    </div>
                    <select
                      value={item.proveedor_id}
                      onChange={(e) => {
                        if (e.target.value === '__new__') {
                          handleOpenNuevoProveedor(idx, 'trabajo');
                        } else {
                          const newId = e.target.value;
                          setEditTrabajos((prev) =>
                            prev.map((t, i) =>
                              i === idx ? { ...t, proveedor_id: newId } : t
                            )
                          );
                        }
                      }}
                      className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-750 rounded-lg p-2 focus:ring-2 focus:ring-[#3498db]/40"
                    >
                      <option value="">Interno (Tecnishop)</option>
                      {proveedores.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre_o_razon_social}
                        </option>
                      ))}
                      <option value="__new__">+ Registrar nuevo proveedor...</option>
                    </select>
                  </div>

                  {/* Costo Mano de Obra */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Costo Tercerizado ($)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.costo_proveedor || ''}
                        placeholder="0.00"
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setEditTrabajos((prev) =>
                            prev.map((t, i) =>
                              i === idx ? { ...t, costo_proveedor: val } : t
                            )
                          );
                        }}
                        className="w-full pl-7 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-750 rounded-lg focus:ring-2 focus:ring-[#3498db]/40 font-mono"
                      />
                    </div>
                  </div>

                  {/* Margen */}
                  <div className="flex flex-col justify-center bg-white dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">
                      Margen Taller
                    </span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ${ganancia.toFixed(2)} ({margenPct.toFixed(1)}%)
                      </span>
                      <span className="text-[10px] text-slate-400">Rendimiento</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
