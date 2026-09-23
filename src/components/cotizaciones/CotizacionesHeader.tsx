import React from 'react';
import { Calculator, RefreshCw, Search } from 'lucide-react';
import { Button } from '../ui/Button';

export interface CotizacionesHeaderProps {
  loading: boolean;
  onRefresh: () => void;
  tabEstado: 'PENDIENTES' | 'LISTAS' | 'TODAS';
  setTabEstado: (tab: 'PENDIENTES' | 'LISTAS' | 'TODAS') => void;
  search: string;
  setSearch: (search: string) => void;
}

export const CotizacionesHeader: React.FC<CotizacionesHeaderProps> = ({
  loading,
  onRefresh,
  tabEstado,
  setTabEstado,
  search,
  setSearch,
}) => {
  return (
    <div className="space-y-4">
      {/* Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#3498db]/15 border border-[#3498db]/30 flex items-center justify-center text-[#3498db]">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Cotizaciones y Costos
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Valida proveedores y costos de repuestos de las fichas técnicas para habilitar su facturación
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </Button>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTabEstado('PENDIENTES')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              tabEstado === 'PENDIENTES'
                ? 'bg-[#3498db] text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Pendientes de Completar
          </button>
          <button
            type="button"
            onClick={() => setTabEstado('LISTAS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              tabEstado === 'LISTAS'
                ? 'bg-[#3498db] text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Listas para Facturar
          </button>
          <button
            type="button"
            onClick={() => setTabEstado('TODAS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              tabEstado === 'TODAS'
                ? 'bg-[#3498db] text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Todas
          </button>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, CI u orden..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3498db]/40"
          />
        </div>
      </div>
    </div>
  );
};
