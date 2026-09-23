import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { FileText, PlusCircle, Search, Table, Laptop } from 'lucide-react';

export interface ReportesHeaderProps {
  reportesSearch: string;
  setReportesSearch: (s: string) => void;
  viewMode: 'tabla' | 'equipos';
  setViewMode: (m: 'tabla' | 'equipos') => void;
  onNewReporte: () => void;
}

export const ReportesHeader: React.FC<ReportesHeaderProps> = ({
  reportesSearch,
  setReportesSearch,
  viewMode,
  setViewMode,
  onNewReporte,
}) => {
  return (
    <div className="space-y-4">
      {/* Page Title & New Report Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#3498db]" />
            <span>Fichas Técnicas & Cotizaciones de Taller</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Diagnósticos reales post-revisión, cotización interactiva con clientes y pase a facturación
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={onNewReporte}
            className="bg-[#3498db] hover:bg-[#2980b9] text-white shadow-sm font-bold text-xs"
          >
            Nueva Ficha Técnica
          </Button>
        </div>
      </div>

      {/* Main Search Bar and View Mode Switcher */}
      <Card className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1">
            <Input
              placeholder="Buscar por cliente, dispositivo, número de orden, diagnóstico..."
              value={reportesSearch}
              onChange={(e) => setReportesSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              className="text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('tabla')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'tabla'
                  ? 'bg-[#3498db] text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Listado General</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('equipos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'equipos'
                  ? 'bg-[#3498db] text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Por Equipo</span>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
