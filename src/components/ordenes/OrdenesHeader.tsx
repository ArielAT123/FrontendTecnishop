import React from 'react';
import { Search, PlusCircle, Table, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export interface OrdenesHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  viewMode: 'tabla' | 'clientes';
  setViewMode: (mode: 'tabla' | 'clientes') => void;
  clientsCount: number;
  onNewOrder: () => void;
}

export const OrdenesHeader: React.FC<OrdenesHeaderProps> = ({
  searchTerm,
  setSearchTerm,
  selectedStatus,
  setSelectedStatus,
  viewMode,
  setViewMode,
  clientsCount,
  onNewOrder,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="w-full sm:max-w-md">
          <Input
            placeholder="Buscar por Nº Orden, CI, Nombre, Teléfono o Equipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            className="w-full"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs py-2 px-3 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/50"
        >
          <option value="ALL">Todos los Estados</option>
          <option value="PENDIENTE">PENDIENTE</option>
          <option value="EN_PROCESO">EN PROCESO</option>
          <option value="COMPLETADO">COMPLETADO</option>
          <option value="COBRADO">COBRADO</option>
          <option value="CANCELADO">CANCELADO</option>
        </select>

        {/* Segmented View Mode Switcher */}
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-inner">
          <button
            type="button"
            onClick={() => setViewMode('tabla')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'tabla'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Ver en formato tabla clásica"
          >
            <Table className="w-3.5 h-3.5" />
            <span>Tabla Plana</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('clientes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'clientes'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Agrupar órdenes por cliente"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Por Clientes</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold">
              {clientsCount}
            </span>
          </button>
        </div>
      </div>

      <Button
        leftIcon={<PlusCircle className="w-4 h-4" />}
        onClick={onNewOrder}
        className="shadow-sm shrink-0"
      >
        Nueva Orden
      </Button>
    </div>
  );
};
