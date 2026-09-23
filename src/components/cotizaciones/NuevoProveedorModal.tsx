import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export interface NuevoProveedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: {
    nombre_o_razon_social: string;
    ruc_cedula: string;
    telefono: string;
    nombre_contacto: string;
  };
  setForm: React.Dispatch<
    React.SetStateAction<{
      nombre_o_razon_social: string;
      ruc_cedula: string;
      telefono: string;
      nombre_contacto: string;
    }>
  >;
  onSubmit: (e?: React.FormEvent) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const NuevoProveedorModal: React.FC<NuevoProveedorModalProps> = ({
  isOpen,
  onClose,
  form,
  setForm,
  onSubmit,
  isLoading,
  error,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Nuevo Proveedor"
      maxWidth="md"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Registra el nuevo proveedor para asignarlo directamente a la cotización y guardarlo en el directorio.
        </p>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Nombre o Razón Social <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            autoFocus
            placeholder="Ej. Distribuidora Electrónica S.A."
            value={form.nombre_o_razon_social}
            onChange={(e) =>
              setForm({ ...form, nombre_o_razon_social: e.target.value })
            }
            className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#3498db]/40"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              RUC / Cédula
            </label>
            <input
              type="text"
              placeholder="Ej. 1790012345001"
              value={form.ruc_cedula}
              onChange={(e) =>
                setForm({ ...form, ruc_cedula: e.target.value })
              }
              className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#3498db]/40"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Teléfono
            </label>
            <input
              type="text"
              placeholder="Ej. 0991234567"
              value={form.telefono}
              onChange={(e) =>
                setForm({ ...form, telefono: e.target.value })
              }
              className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#3498db]/40"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Contacto o Vendedor
          </label>
          <input
            type="text"
            placeholder="Ej. Juan Pérez"
            value={form.nombre_contacto}
            onChange={(e) =>
              setForm({ ...form, nombre_contacto: e.target.value })
            }
            className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#3498db]/40"
          />
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-[#3498db] hover:bg-[#2980b9] text-white text-xs font-semibold px-4 py-2"
          >
            {isLoading ? 'Guardando...' : 'Guardar Proveedor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
