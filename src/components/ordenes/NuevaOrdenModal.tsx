import React from 'react';
import {
  Users,
  Search,
  User,
  Laptop,
  PlusCircle,
  Check,
  CheckSquare,
  Wrench,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Cliente, Equipo } from '../../types';

export interface NuevaOrdenModalProps {
  isOpen: boolean;
  onClose: () => void;
  formError: string | null;
  clientSearch: string;
  setClientSearch: (val: string) => void;
  selectedCliente: Cliente | null;
  setSelectedCliente: (c: Cliente | null) => void;
  filteredClients: Cliente[];
  clientEquipos: Equipo[];
  formData: {
    equipo: string;
    fecha: string;
    realiza_orden: string;
    estado: string;
    cargador: boolean;
    bateria: boolean;
    cable_poder: boolean;
    cable_datos: boolean;
    otros: string;
    problema: string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      equipo: string;
      fecha: string;
      realiza_orden: string;
      estado: any;
      cargador: boolean;
      bateria: boolean;
      cable_poder: boolean;
      cable_datos: boolean;
      otros: string;
      problema: string;
    }>
  >;
  onOpenAddEquipo: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export const NuevaOrdenModal: React.FC<NuevaOrdenModalProps> = ({
  isOpen,
  onClose,
  formError,
  clientSearch,
  setClientSearch,
  selectedCliente,
  setSelectedCliente,
  filteredClients,
  clientEquipos,
  formData,
  setFormData,
  onOpenAddEquipo,
  onSubmit,
  isSubmitting,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Nueva Orden de Servicio"
      maxWidth="2xl"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-500 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* 1. SELECCIÓN O FILTRADO DE CLIENTE */}
        <div className="space-y-2 p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#3498db]" />
              1. Cliente Solicitante *
            </label>
            {selectedCliente && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCliente(null);
                  setFormData((prev) => ({ ...prev, equipo: '' }));
                  setClientSearch('');
                }}
                className="text-xs text-rose-500 hover:text-rose-600 font-semibold transition-colors"
              >
                Cambiar Cliente
              </button>
            )}
          </div>

          {!selectedCliente ? (
            <div className="space-y-2">
              <Input
                placeholder="Escribe la Cédula (CI) o Nombre del cliente..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              />

              {clientSearch.trim() && (
                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 shadow-md divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredClients.length > 0 ? (
                    filteredClients.map((c) => (
                      <button
                        key={c.ci}
                        type="button"
                        onClick={() => {
                          setSelectedCliente(c);
                          setClientSearch('');
                          setFormData((prev) => ({ ...prev, equipo: '' }));
                        }}
                        className="w-full text-left p-3 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 flex items-center justify-between transition-colors"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {c.nombre} {c.apellido || ''}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            CI: {c.ci} {c.telefono ? `• Tel: ${c.telefono}` : ''}
                          </p>
                        </div>
                        <span className="text-[11px] font-bold text-[#3498db] bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                          Seleccionar
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-400">
                      No se encontró ningún cliente con "{clientSearch}".
                    </div>
                  )}
                </div>
              )}
              <p className="text-[11px] text-slate-400">
                Ingresa la cédula o nombre para listar y filtrar los equipos de ese cliente.
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#3498db] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {selectedCliente.nombre} {selectedCliente.apellido || ''}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    CI: {selectedCliente.ci} {selectedCliente.telefono ? `• Tel: ${selectedCliente.telefono}` : ''}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Cliente Listo
              </span>
            </div>
          )}
        </div>

        {/* 2. EQUIPOS DEL CLIENTE Y AGREGAR EQUIPO NUEVO */}
        <div className="space-y-2 p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Laptop className="w-4 h-4 text-[#3498db]" />
              2. Equipo a Reparar *
            </label>

            <Button
              type="button"
              size="sm"
              variant="outline"
              leftIcon={<PlusCircle className="w-3.5 h-3.5 text-[#3498db]" />}
              onClick={onOpenAddEquipo}
              className="text-xs border-[#3498db]/40 text-[#3498db] hover:bg-[#3498db]/10"
            >
              + Agregar Equipo Nuevo
            </Button>
          </div>

          {selectedCliente ? (
            clientEquipos.length > 0 ? (
              <div className="space-y-2 mt-2 max-h-52 overflow-y-auto pr-1">
                {clientEquipos.map((eq) => {
                  const isSelected = formData.equipo === eq.id;
                  return (
                    <div
                      key={eq.id}
                      onClick={() => setFormData((prev) => ({ ...prev, equipo: eq.id }))}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                        isSelected
                          ? 'border-[#3498db] bg-blue-50/90 dark:bg-blue-950/70 ring-2 ring-[#3498db]/30 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isSelected
                              ? 'bg-[#3498db] text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          <Laptop className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                            {eq.nombre || 'Dispositivo'} {eq.marca ? `• ${eq.marca}` : ''} {eq.modelo || ''}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            Serie: {eq.numero_serie || 'S/N'}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-[#3498db] bg-[#3498db] text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/30 text-center space-y-2">
                <Laptop className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Este cliente aún no tiene equipos registrados en la base de datos.
                </p>
                <Button
                  type="button"
                  size="sm"
                  leftIcon={<PlusCircle className="w-4 h-4" />}
                  onClick={onOpenAddEquipo}
                  className="mx-auto shadow-sm"
                >
                  Registrar Primer Equipo
                </Button>
              </div>
            )
          ) : (
            <div className="p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/20 text-center text-xs text-slate-400">
              Selecciona un cliente arriba para ver sus equipos registrados o agregar uno nuevo.
            </div>
          )}
        </div>

        {/* 3. ACCESORIOS RECIBIDOS CON EL EQUIPO */}
        <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-[#3498db]" />
              3. Accesorios Recibidos
            </label>
            <span className="text-[10px] text-slate-400">Lo que deja el cliente para esta orden</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { key: 'cargador', label: 'Cargador' },
              { key: 'bateria', label: 'Batería' },
              { key: 'cable_poder', label: 'Cable Poder' },
              { key: 'cable_datos', label: 'Cable Datos' },
            ].map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer text-xs font-medium hover:border-[#3498db]/60 transition-colors select-none"
              >
                <input
                  type="checkbox"
                  checked={(formData as any)[key]}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                  className="rounded text-[#3498db] focus:ring-[#3498db]"
                />
                <span className="text-slate-700 dark:text-slate-200 font-semibold">{label}</span>
              </label>
            ))}
          </div>
          <div>
            <Input
              placeholder="Otros accesorios (ej. Mouse, funda protectora, mochila, memoria USB)..."
              value={formData.otros}
              onChange={(e) => setFormData({ ...formData, otros: e.target.value })}
              className="text-xs"
            />
          </div>
        </div>

        {/* 4. FALLA O PROBLEMA REPORTADO */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Wrench className="w-4 h-4 text-[#3498db]" />
            4. Falla o Problema Reportado
          </label>
          <textarea
            rows={2}
            placeholder="Describe el problema o trabajo solicitado para esta orden..."
            value={formData.problema}
            onChange={(e) => setFormData({ ...formData, problema: e.target.value })}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs p-3 focus:outline-none focus:ring-2 focus:ring-[#3498db]/40 placeholder:text-slate-400"
          />
        </div>

        {/* 5. TÉCNICO ASIGNADO */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-[#3498db]" />
            5. Técnico Asignado (Opcional)
          </label>
          <Input
            placeholder="Nombre del técnico responsable"
            value={formData.realiza_orden}
            onChange={(e) => setFormData({ ...formData, realiza_orden: e.target.value })}
            leftIcon={<UserCheck className="w-4 h-4" />}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={!formData.equipo}>
            Crear Orden de Servicio
          </Button>
        </div>
      </form>
    </Modal>
  );
};
