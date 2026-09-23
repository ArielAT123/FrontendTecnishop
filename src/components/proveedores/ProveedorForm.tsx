import React from 'react';
import {
  Truck,
  Building,
  Hash,
  Phone,
  User,
  CreditCard,
  AlertCircle,
  X,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export interface ProveedorFormProps {
  isEditing: boolean;
  onCancelEdit: () => void;
  formError: string | null;
  formData: {
    nombre_o_razon_social: string;
    ruc_cedula: string;
    telefono: string;
    nombre_contacto: string;
    numero_cuenta: string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      nombre_o_razon_social: string;
      ruc_cedula: string;
      telefono: string;
      nombre_contacto: string;
      numero_cuenta: string;
    }>
  >;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export const ProveedorForm: React.FC<ProveedorFormProps> = ({
  isEditing,
  onCancelEdit,
  formError,
  formData,
  setFormData,
  onSubmit,
  isPending,
}) => {
  return (
    <form
      onSubmit={onSubmit}
      className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/70 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#3498db]/15 text-[#3498db] flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {isEditing ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Los datos del proveedor son estrictamente confidenciales y nunca se imprimen en facturas del cliente
            </p>
          </div>
        </div>

        {isEditing && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-xs font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Cancelar edición
          </button>
        )}
      </div>

      {formError && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Grid de campos más amplio y cómodo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-[#3498db]" />
            <span>Nombre o Razón Social *</span>
          </label>
          <Input
            placeholder="Ej. Distribuidora Tech S.A."
            value={formData.nombre_o_razon_social}
            onChange={(e) =>
              setFormData({ ...formData, nombre_o_razon_social: e.target.value })
            }
            required
            className="h-10 text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-slate-400" />
            <span>RUC / Cédula</span>
          </label>
          <Input
            placeholder="0999999999001"
            value={formData.ruc_cedula}
            onChange={(e) => setFormData({ ...formData, ruc_cedula: e.target.value })}
            className="h-10 text-xs font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>Teléfono / Celular</span>
          </label>
          <Input
            placeholder="0991234567 / 042123456"
            value={formData.telefono}
            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            className="h-10 text-xs font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>Nombre de Contacto</span>
          </label>
          <Input
            placeholder="Ej. Ing. Carlos Gómez / Vendedor"
            value={formData.nombre_contacto}
            onChange={(e) => setFormData({ ...formData, nombre_contacto: e.target.value })}
            className="h-10 text-xs"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-[#3498db]" />
            <span>Número de Cuenta Bancaria / Datos de Pago</span>
          </label>
          <Input
            placeholder="Ej. Banco Pichincha Cta Corriente 2100... / Banco Guayaquil Ahorros..."
            value={formData.numero_cuenta}
            onChange={(e) => setFormData({ ...formData, numero_cuenta: e.target.value })}
            className="h-10 text-xs font-mono"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        {isEditing && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancelEdit}
            size="sm"
            className="text-xs h-9"
          >
            Descartar
          </Button>
        )}
        <Button
          type="submit"
          disabled={isPending}
          className="bg-[#3498db] hover:bg-[#2980b9] text-white text-xs h-9 px-5 font-semibold shadow-md shadow-[#3498db]/20"
        >
          {isEditing ? 'Actualizar Proveedor' : 'Guardar Proveedor'}
        </Button>
      </div>
    </form>
  );
};
