import React from 'react';
import { Tag, Hash, Wrench, TrendingUp, Clock, PlusCircle } from 'lucide-react';
import { Producto, Proveedor } from '../../types';
import { Button } from '../ui/Button';
import { Input, NumericInput } from '../ui/Input';

export interface ProductoFormFieldsProps {
  isService: boolean;
  formData: Partial<Producto>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Producto>>>;
  costo: number;
  pvp: number;
  ganancia: number;
  margenPorcentaje: string;
  proveedores: Proveedor[];
  onOpenProveedoresModal: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isPending: boolean;
  formatMinutes: (minutes?: number) => string;
}

export const ProductoFormFields: React.FC<ProductoFormFieldsProps> = ({
  isService,
  formData,
  setFormData,
  costo,
  pvp,
  ganancia,
  margenPorcentaje,
  proveedores,
  onOpenProveedoresModal,
  onSubmit,
  onCancel,
  isPending,
  formatMinutes,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* SECCIÓN 1: Identificación */}
      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-[#3498db]" />
          <span>{isService ? 'Identificación del Servicio' : 'Identificación del Artículo'}</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              {isService ? 'Código de Servicio *' : 'Código de Barras *'}
            </label>
            <Input
              placeholder={isService ? 'Ej: SERV-MANT' : 'Ej: 7861024600018'}
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              leftIcon={<Hash className="w-4 h-4 text-slate-400" />}
              className="font-mono"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              {isService ? 'Nombre del Servicio Técnico *' : 'Nombre / Descripción del Artículo *'}
            </label>
            <Input
              placeholder={
                isService
                  ? 'Ej: Mantenimiento Preventivo y Limpieza de Pasta Térmica'
                  : 'Ej: Memoria RAM Kingston Fury 8GB DDR4 3200MHz'
              }
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              leftIcon={isService ? <Wrench className="w-4 h-4 text-[#3498db]" /> : <Tag className="w-4 h-4 text-[#3498db]" />}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
            Descripción Detallada {isService ? '(Qué incluye el servicio)' : '(Opcional)'}
          </label>
          <textarea
            rows={2}
            placeholder={
              isService
                ? 'Describe el procedimiento, garantía y alcances técnicos del servicio...'
                : 'Especificaciones adicionales del repuesto...'
            }
            value={formData.descripcion || ''}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3498db]"
          />
        </div>
      </div>

      {/* SECCIÓN 2: Tarifas, Tiempo o Stock */}
      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#3498db]" />
            <span>{isService ? 'Tarifas y Duración Estimada' : 'Control de Inventario y Precios'}</span>
          </h4>

          {pvp > 0 && costo > 0 && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#3498db]/10 border border-[#3498db]/30 text-[#3498db] font-mono text-[11px] font-bold">
              <span>Margen: +{margenPorcentaje}%</span>
              <span>(+${ganancia.toFixed(2)})</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {isService ? (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Tiempo Estimado *</span>
                <span className="text-[#3498db] font-mono font-bold">
                  {formatMinutes(formData.tiempo_estimado_minutos)}
                </span>
              </label>
              <NumericInput
                allowDecimals={false}
                min={5}
                placeholder="60"
                value={formData.tiempo_estimado_minutos || 60}
                onChange={(val) =>
                  setFormData({
                    ...formData,
                    tiempo_estimado_minutos: val || 60,
                  })
                }
                leftIcon={<Clock className="w-4 h-4 text-[#3498db]" />}
                required
              />
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                {[30, 45, 60, 90, 120].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setFormData({ ...formData, tiempo_estimado_minutos: mins })}
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition-all ${
                      formData.tiempo_estimado_minutos === mins
                        ? 'bg-[#3498db] text-white shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-750 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                    }`}
                  >
                    {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Stock Inicial (Uds)
              </label>
              <NumericInput
                allowDecimals={false}
                min={0}
                placeholder="0"
                value={formData.cantidad}
                onChange={(val) => setFormData({ ...formData, cantidad: val })}
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              {isService ? 'Costo Insumos / Base ($)' : 'Costo Compra ($)'}
            </label>
            <NumericInput
              placeholder="0.00"
              value={formData.costo_compra}
              onChange={(val) => setFormData({ ...formData, costo_compra: val })}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              {isService ? 'Tarifa al Cliente ($) *' : 'Precio de Venta al Público (PVP) ($) *'}
            </label>
            <NumericInput
              placeholder="0.00"
              value={formData.precio_venta_sugerido}
              onChange={(val) => {
                setFormData({
                  ...formData,
                  precio_venta_sugerido: val,
                  precio_venta_recomendado: val,
                });
              }}
              className="font-bold text-[#3498db]"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Tarifa de IVA (%)
            </label>
            <select
              value={formData.impuesto !== undefined && formData.impuesto !== null ? String(formData.impuesto) : '15'}
              onChange={(e) => setFormData({ ...formData, impuesto: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs py-2 px-3 font-semibold focus:outline-none focus:ring-2 focus:ring-[#3498db]/40 shadow-sm"
            >
              <option value="15">15% (Tarifa General)</option>
              <option value="0">0% (Tarifa 0% / Exento)</option>
              <option value="5">5% (Materiales)</option>
              <option value="8">8% (Turismo)</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>{isService ? 'Proveedor / Taller Externo (Para Reventa/Tercerización)' : 'Proveedor del Artículo'}</span>
              <button
                type="button"
                onClick={onOpenProveedoresModal}
                className="text-[10px] text-[#3498db] hover:underline flex items-center gap-1 font-bold"
              >
                <PlusCircle className="w-3 h-3" /> Nuevo Proveedor
              </button>
            </label>
            <select
              value={formData.proveedor || ''}
              onChange={(e) => setFormData({ ...formData, proveedor: e.target.value || undefined })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs py-2 px-3 font-semibold focus:outline-none focus:ring-2 focus:ring-[#3498db]/40 shadow-sm"
            >
              <option value="">-- Sin Proveedor Asignado / Servicio Interno Directo --</option>
              {proveedores.map((prov) => (
                <option key={prov.id} value={prov.id}>
                  {prov.nombre_o_razon_social} {prov.ruc_cedula ? `(${prov.ruc_cedula})` : ''}
                </option>
              ))}
            </select>
          </div>

          {isService && (
            <div className="sm:col-span-3 flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                id="es_chequeo"
                checked={Boolean(formData.es_chequeo)}
                onChange={(e) => setFormData({ ...formData, es_chequeo: e.target.checked })}
                className="w-4 h-4 rounded text-[#3498db] focus:ring-[#3498db] border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <label htmlFor="es_chequeo" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                ¿Este servicio corresponde a un tipo de chequeo técnico / revisión diagnóstica?
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          isLoading={isPending}
          className="px-6 shadow-sm"
        >
          {isService ? 'Guardar Servicio' : 'Guardar Artículo'}
        </Button>
      </div>
    </form>
  );
};
