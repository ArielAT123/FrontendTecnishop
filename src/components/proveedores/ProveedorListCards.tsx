import React from 'react';
import {
  Search,
  X,
  Building,
  Hash,
  Phone,
  User,
  CreditCard,
  Edit2,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { Proveedor } from '../../types';
import { Button } from '../ui/Button';

export interface ProveedorListCardsProps {
  proveedores: Proveedor[];
  trieFilteredProveedores: Proveedor[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeQuickFilter: 'all' | 'with_ruc' | 'with_account' | 'with_contact';
  setActiveQuickFilter: (filter: 'all' | 'with_ruc' | 'with_account' | 'with_contact') => void;
  onEdit: (prov: Proveedor) => void;
  onDelete: (id: string) => void;
  onSelectProveedor?: (proveedor: Proveedor) => void;
  copiedId: string | null;
  onCopyAccount: (text: string, id: string) => void;
}

export const ProveedorListCards: React.FC<ProveedorListCardsProps> = ({
  proveedores,
  trieFilteredProveedores,
  searchTerm,
  setSearchTerm,
  activeQuickFilter,
  setActiveQuickFilter,
  onEdit,
  onDelete,
  onSelectProveedor,
  copiedId,
  onCopyAccount,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Proveedores Registrados ({trieFilteredProveedores.length}
            {trieFilteredProveedores.length !== proveedores.length && ` de ${proveedores.length}`})
          </h4>
        </div>

        {/* BARRA DE BÚSQUEDA DEL ÁRBOL */}
        <div className="w-full lg:w-96 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, RUC, teléfono, contacto, cuenta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3498db]/40 focus:border-[#3498db] shadow-inner transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] text-slate-400 mr-1 font-medium">Filtrar:</span>
        <button
          type="button"
          onClick={() => setActiveQuickFilter('all')}
          className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
            activeQuickFilter === 'all'
              ? 'bg-[#3498db] text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750'
          }`}
        >
          Todos ({proveedores.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveQuickFilter('with_ruc')}
          className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
            activeQuickFilter === 'with_ruc'
              ? 'bg-[#3498db] text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750'
          }`}
        >
          Con RUC
        </button>
        <button
          type="button"
          onClick={() => setActiveQuickFilter('with_account')}
          className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
            activeQuickFilter === 'with_account'
              ? 'bg-[#3498db] text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750'
          }`}
        >
          Con Cuenta Bancaria
        </button>
        <button
          type="button"
          onClick={() => setActiveQuickFilter('with_contact')}
          className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
            activeQuickFilter === 'with_contact'
              ? 'bg-[#3498db] text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750'
          }`}
        >
          Con Contacto
        </button>
      </div>

      {/* LISTADO EN CARDS DE ALTA VISIBILIDAD */}
      <div className="max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
        {trieFilteredProveedores.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            {searchTerm
              ? 'No se encontraron proveedores que coincidan con la búsqueda.'
              : 'No hay proveedores registrados aún.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {trieFilteredProveedores.map((prov) => (
              <div
                key={prov.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="p-1.5 rounded-lg bg-[#3498db]/10 text-[#3498db] shrink-0">
                      <Building className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {prov.nombre_o_razon_social}
                      </h5>
                      {prov.ruc_cedula && (
                        <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Hash className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>RUC: {prov.ruc_cedula}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {onSelectProveedor && (
                    <Button
                      size="sm"
                      onClick={() => onSelectProveedor(prov)}
                      className="text-xs h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Seleccionar
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  {prov.telefono && (
                    <div className="flex items-center gap-1 truncate font-mono">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{prov.telefono}</span>
                    </div>
                  )}
                  {prov.nombre_contacto && (
                    <div className="flex items-center gap-1 truncate">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{prov.nombre_contacto}</span>
                    </div>
                  )}
                </div>

                {prov.numero_cuenta && (
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 min-w-0 font-mono text-slate-700 dark:text-slate-300">
                      <CreditCard className="w-3.5 h-3.5 text-[#3498db] shrink-0" />
                      <span className="truncate">{prov.numero_cuenta}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onCopyAccount(prov.numero_cuenta!, prov.id)}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded shrink-0 transition-colors"
                      title="Copiar datos de cuenta"
                    >
                      {copiedId === prov.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-end gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => onEdit(prov)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#3498db] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Editar proveedor"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`¿Estás seguro de eliminar al proveedor "${prov.nombre_o_razon_social}"?`)) {
                        onDelete(prov.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Eliminar proveedor"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
