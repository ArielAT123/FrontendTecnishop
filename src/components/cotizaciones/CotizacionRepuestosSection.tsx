import React from 'react';
import { Package, Plus, Check, AlertTriangle } from 'lucide-react';
import { Proveedor } from '../../types';
import { EditableRepuesto } from './CotizacionEditorModal';

export interface CotizacionRepuestosSectionProps {
  editRepuestos: EditableRepuesto[];
  setEditRepuestos: React.Dispatch<React.SetStateAction<EditableRepuesto[]>>;
  proveedores: Proveedor[];
  handleOpenNuevoProveedor: (index: number, type: 'repuesto' | 'trabajo') => void;
}

export const CotizacionRepuestosSection: React.FC<CotizacionRepuestosSectionProps> = ({
  editRepuestos,
  setEditRepuestos,
  proveedores,
  handleOpenNuevoProveedor,
}) => {
  const isRepuestoCompleto = (r: EditableRepuesto) => {
    return Boolean(r.proveedor_id && r.costo_unitario_proveedor > 0);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Package className="w-4 h-4 text-[#3498db]" />
          <span>Repuestos Utilizados ({editRepuestos.length})</span>
        </h3>
        <span className="text-[11px] text-slate-400">
          Campo requerido: Proveedor y Costo de compra
        </span>
      </div>

      {editRepuestos.length === 0 ? (
        <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
          No hay repuestos cotizados en esta ficha técnica.
        </p>
      ) : (
        <div className="space-y-3">
          {editRepuestos.map((item, idx) => {
            const costoTotal = item.costo_unitario_proveedor * item.cantidad;
            const ventaTotal = item.precio_unitario * item.cantidad;
            const ganancia = ventaTotal - costoTotal;
            const margenPct = ventaTotal > 0 ? (ganancia / ventaTotal) * 100 : 0;
            const isComplete = isRepuestoCompleto(item);

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-700/50">
                  <div>
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">
                      {item.nombre_repuesto}
                    </span>
                    <span className="text-[11px] text-slate-500 ml-2">
                      Cant: {item.cantidad} un. | Precio Cotizado:{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        ${item.precio_unitario.toFixed(2)} c/u
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isComplete ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        <Check className="w-3 h-3 text-emerald-500" />
                        Completo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        Requiere datos
                      </span>
                    )}
                  </div>
                </div>

                {/* Inputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                  {/* Proveedor */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        Proveedor <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleOpenNuevoProveedor(idx, 'repuesto')}
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
                          handleOpenNuevoProveedor(idx, 'repuesto');
                        } else {
                          const newId = e.target.value;
                          setEditRepuestos((prev) =>
                            prev.map((r, i) =>
                              i === idx ? { ...r, proveedor_id: newId } : r
                            )
                          );
                        }
                      }}
                      className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-750 rounded-lg p-2 focus:ring-2 focus:ring-[#3498db]/40"
                    >
                      <option value="">-- Seleccionar Proveedor --</option>
                      {proveedores.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre_o_razon_social}
                        </option>
                      ))}
                      <option value="__new__">+ Crear nuevo proveedor...</option>
                    </select>
                  </div>

                  {/* Costo Unitario de Compra */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Costo de Adquisición ($) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.costo_unitario_proveedor || ''}
                        placeholder="0.00"
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setEditRepuestos((prev) =>
                            prev.map((r, i) =>
                              i === idx ? { ...r, costo_unitario_proveedor: val } : r
                            )
                          );
                        }}
                        className="w-full pl-7 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-750 rounded-lg focus:ring-2 focus:ring-[#3498db]/40 font-mono font-medium"
                      />
                    </div>
                  </div>

                  {/* Margen Calculado */}
                  <div className="flex flex-col justify-center bg-white dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">
                      Margen Estimado
                    </span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span
                        className={`text-xs font-mono font-bold ${
                          ganancia >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600'
                        }`}
                      >
                        ${ganancia.toFixed(2)} ({margenPct.toFixed(1)}%)
                      </span>
                      <span className="text-[10px] text-slate-400">Ganancia neta</span>
                    </div>
                  </div>
                </div>

                {/* Checkbox: Guardar en Catálogo */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={item.crear_en_catalogo}
                      onChange={(e) => {
                        const chk = e.target.checked;
                        setEditRepuestos((prev) =>
                          prev.map((r, i) =>
                            i === idx ? { ...r, crear_en_catalogo: chk } : r
                          )
                        );
                      }}
                      className="w-3.5 h-3.5 rounded text-[#3498db] focus:ring-[#3498db]/40"
                    />
                    <span className="font-medium">
                      Registrar como nuevo producto en el catálogo oficial
                    </span>
                  </label>

                  {item.crear_en_catalogo && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-[11px] text-slate-400">Código sugerido:</span>
                      <input
                        type="text"
                        value={item.codigo_catalogo}
                        onChange={(e) => {
                          const code = e.target.value;
                          setEditRepuestos((prev) =>
                            prev.map((r, i) =>
                              i === idx ? { ...r, codigo_catalogo: code } : r
                            )
                          );
                        }}
                        className="px-2 py-0.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
