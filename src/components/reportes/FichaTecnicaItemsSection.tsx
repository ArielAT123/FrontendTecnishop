import React from 'react';
import { NumericInput } from '../ui/NumericInput';
import { AutocompleteInput } from './AutocompleteInput';
import { api } from '../../api/client';
import { Producto } from '../../types';
import { Wrench, Package, DollarSign, Check, X, Tag } from 'lucide-react';

export interface TrabajoRow {
  descripcion: string;
  costo: string | number;
  estado: 'COTIZADO' | 'RECHAZADO';
}

export interface RepuestoRow {
  producto_id?: string;
  nombre_repuesto: string;
  cantidad: number;
  precio_unitario: string | number;
  estado: 'COTIZADO' | 'RECHAZADO';
  categoria?: string;
}

export interface FichaTecnicaItemsSectionProps {
  trabajos: TrabajoRow[];
  setTrabajos: React.Dispatch<React.SetStateAction<TrabajoRow[]>>;
  handleAddTrabajo: () => void;
  handleRemoveTrabajo: (idx: number) => void;
  handleToggleEstadoTrabajo: (idx: number) => void;
  repuestos: RepuestoRow[];
  setRepuestos: React.Dispatch<React.SetStateAction<RepuestoRow[]>>;
  handleAddRepuesto: () => void;
  handleRemoveRepuesto: (idx: number) => void;
  handleToggleEstadoRepuesto: (idx: number) => void;
  handleRepuestoSelect: (idx: number, item: any) => void;
  productosCatalogo: Producto[];
}

export const FichaTecnicaItemsSection: React.FC<FichaTecnicaItemsSectionProps> = ({
  trabajos,
  setTrabajos,
  handleAddTrabajo,
  handleRemoveTrabajo,
  handleToggleEstadoTrabajo,
  repuestos,
  setRepuestos,
  handleAddRepuesto,
  handleRemoveRepuesto,
  handleToggleEstadoRepuesto,
  handleRepuestoSelect,
  productosCatalogo,
}) => {
  return (
    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#3498db]" />
            <span>3. Cotización de Reparación (Recomendaciones del Técnico)</span>
          </h4>
          <p className="text-[11px] text-slate-500">
            Usa los switches para marcar cada ítem como <strong>Cotizado (Aceptado)</strong> o <strong>Rechazado por el cliente</strong>
          </p>
        </div>
      </div>

      {/* SECCIÓN TRABAJOS / MANO DE OBRA */}
      <div className="space-y-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Servicios y Mano de Obra Recomendados
          </span>
          <button
            type="button"
            onClick={handleAddTrabajo}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950 text-[#3498db] border border-blue-200 dark:border-blue-900 hover:bg-blue-100 transition-colors"
          >
            + Agregar Servicio
          </button>
        </div>

        {trabajos.map((t, idx) => {
          const isAccepted = t.estado === 'COTIZADO';
          return (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border transition-all flex flex-col md:flex-row items-stretch md:items-center gap-2.5 ${
                isAccepted
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-500/30 opacity-80'
              }`}
            >
              <div className="flex-1">
                <AutocompleteInput
                  placeholder="Descripción del trabajo (ej: Mantenimiento Preventivo, Reballing)"
                  value={t.descripcion}
                  onChange={(val) => {
                    const newT = [...trabajos];
                    newT[idx].descripcion = val;
                    setTrabajos(newT);
                  }}
                  onSelect={(item) => {
                    const newT = [...trabajos];
                    newT[idx].descripcion = item.texto;
                    newT[idx].costo = item.precio ?? 0;
                    setTrabajos(newT);
                  }}
                  fetchSuggestions={api.getAutocompleteManoObra}
                />
              </div>

              <div className="w-full md:w-32">
                <NumericInput
                  placeholder="Precio cliente"
                  value={t.costo}
                  onChange={(val) => {
                    const newT = [...trabajos];
                    newT[idx].costo = val;
                    setTrabajos(newT);
                  }}
                  leftIcon={<DollarSign className="w-3.5 h-3.5" />}
                  className="font-bold text-xs"
                />
              </div>

              {/* Segmented Option: Aceptado vs Rechazado */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (!isAccepted) handleToggleEstadoTrabajo(idx);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isAccepted
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Aceptado</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isAccepted) handleToggleEstadoTrabajo(idx);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    !isAccepted
                      ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Rechazado</span>
                </button>
              </div>

              {trabajos.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveTrabajo(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 self-center transition-colors"
                  title="Eliminar fila"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* SECCIÓN REPUESTOS / PARTES */}
      <div className="space-y-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-[#3498db]" />
            <span>Repuestos & Componentes Utilizados</span>
          </span>
          <button
            type="button"
            onClick={handleAddRepuesto}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950 text-[#3498db] border border-blue-200 dark:border-blue-900 hover:bg-blue-100 transition-colors"
          >
            + Agregar Repuesto
          </button>
        </div>

        {repuestos.map((r, idx) => {
          const isAccepted = r.estado === 'COTIZADO';
          return (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border transition-all flex flex-col md:flex-row items-stretch md:items-center gap-2.5 ${
                isAccepted
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-500/30 opacity-80'
              }`}
            >
              <div className="flex-1">
                <AutocompleteInput
                  placeholder="Nombre del repuesto (ej: Pantalla LED, Pasta Térmica, Batería)"
                  value={r.nombre_repuesto}
                  onChange={(val) => {
                    const newR = [...repuestos];
                    newR[idx].nombre_repuesto = val;
                    setRepuestos(newR);
                  }}
                  onSelect={(item) => handleRepuestoSelect(idx, item)}
                  fetchSuggestions={api.getAutocompleteRepuestos}
                />
              </div>

              <div className="w-20">
                <input
                  type="number"
                  min="1"
                  value={r.cantidad}
                  onChange={(e) => {
                    const newR = [...repuestos];
                    newR[idx].cantidad = Math.max(1, parseInt(e.target.value) || 1);
                    setRepuestos(newR);
                  }}
                  placeholder="Cant"
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-center font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3498db]/40"
                  title="Cantidad de piezas"
                />
              </div>

              <div className="w-full md:w-32">
                <NumericInput
                  placeholder="Precio Unitario"
                  value={r.precio_unitario}
                  onChange={(val) => {
                    const newR = [...repuestos];
                    newR[idx].precio_unitario = val;
                    setRepuestos(newR);
                  }}
                  leftIcon={<DollarSign className="w-3.5 h-3.5" />}
                  className="font-bold text-xs"
                />
              </div>

              {/* Segmented Option: Aceptado vs Rechazado */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (!isAccepted) handleToggleEstadoRepuesto(idx);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isAccepted
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Aceptado</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isAccepted) handleToggleEstadoRepuesto(idx);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    !isAccepted
                      ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Rechazado</span>
                </button>
              </div>

              {repuestos.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveRepuesto(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 self-center transition-colors"
                  title="Eliminar fila"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
