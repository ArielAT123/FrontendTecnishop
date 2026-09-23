import React from 'react';
import { AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { Card } from '../ui/Card';

export interface CotizacionesStatsCardsProps {
  pendientes: number;
  listas: number;
  total: number;
}

export const CotizacionesStatsCards: React.FC<CotizacionesStatsCardsProps> = ({
  pendientes,
  listas,
  total,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card className="p-4 flex items-center gap-4 border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Pendientes de Datos
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            {pendientes}
          </p>
          <p className="text-[11px] text-slate-400">
            Falta proveedor o costo de compra
          </p>
        </div>
      </Card>

      <Card className="p-4 flex items-center gap-4 border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Listas para Facturar
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            {listas}
          </p>
          <p className="text-[11px] text-slate-400">
            100% validadas y habilitadas
          </p>
        </div>
      </Card>

      <Card className="p-4 flex items-center gap-4 border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="w-11 h-11 rounded-xl bg-[#3498db]/10 border border-[#3498db]/20 flex items-center justify-center text-[#3498db] shrink-0">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Evaluadas
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            {total}
          </p>
          <p className="text-[11px] text-slate-400">
            Informes con ítems cotizados
          </p>
        </div>
      </Card>
    </div>
  );
};
