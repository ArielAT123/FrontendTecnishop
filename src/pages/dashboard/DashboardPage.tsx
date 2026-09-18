import React from 'react';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { api } from '../../api/client';
import { DashboardStats, OrdenesPaginadasResponse } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Users,
  Laptop,
  Clock,
  CheckCircle2,
  PlusCircle,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { NavSection } from '../../components/layout/Sidebar';

interface DashboardPageProps {
  onNavigate: (section: NavSection) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { data: stats, isLoading: isLoadingStats } = useCachedQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: api.getDashboardStats,
  });

  const { data: ordenesData, isLoading: isLoadingOrdenes, isSyncing: isSyncingOrdenes } = useCachedQuery<OrdenesPaginadasResponse>({
    queryKey: ['recent-ordenes'],
    queryFn: () => api.getOrdenes(0, 5),
    keyField: 'id',
    nestedArrayKey: 'ordenes',
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#2c3e50] dark:bg-slate-850 border border-slate-700/50 p-6 sm:p-8 text-white shadow-md">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Control de Órdenes y Taller Técnico
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
            Supervisa el estado de reparaciones de clientes, dispositivos en diagnóstico y stock de repuestos en tiempo real.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-5">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<PlusCircle className="w-4 h-4 text-slate-700" />}
              onClick={() => onNavigate('ordenes')}
              className="bg-white text-slate-800 hover:bg-slate-100 font-bold border border-slate-200"
            >
              Nueva Orden de Servicio
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FileSpreadsheet className="w-4 h-4 text-slate-300" />}
              onClick={() => onNavigate('productos')}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cargar Inventario Excel
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Clientes Registrados"
          value={isLoadingStats ? '...' : stats?.clientes_registrados ?? 0}
          icon={<Users className="w-6 h-6 text-slate-600 dark:text-slate-300" />}
          gradient=""
          description="Total en cartera activa"
        />
        <StatCard
          title="Equipos en Taller"
          value={isLoadingStats ? '...' : stats?.equipos_registrados ?? 0}
          icon={<Laptop className="w-6 h-6 text-slate-600 dark:text-slate-300" />}
          gradient=""
          description="Hardware registrado"
        />
        <StatCard
          title="Órdenes Activas"
          value={isLoadingStats ? '...' : stats?.ordenes_activas ?? 0}
          icon={<Clock className="w-6 h-6 text-slate-600 dark:text-slate-300" />}
          gradient=""
          description="Pendientes o en proceso"
        />
        <StatCard
          title="Órdenes Completadas"
          value={isLoadingStats ? '...' : stats?.ordenes_completadas ?? 0}
          icon={<CheckCircle2 className="w-6 h-6 text-slate-600 dark:text-slate-300" />}
          gradient=""
          description="Listas o facturadas"
        />
      </div>

      {/* Recent Orders Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Órdenes Recientes</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Últimas reparaciones recepcionadas</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={() => onNavigate('ordenes')}
            className="text-brand-600 dark:text-brand-400 font-semibold"
          >
            Ver Todas
          </Button>
        </div>

        {isLoadingOrdenes && !ordenesData?.ordenes?.length ? (
          <div className="py-12 text-center text-xs text-slate-400">Cargando órdenes recientes...</div>
        ) : !ordenesData?.ordenes?.length ? (
          <div className="py-12 text-center text-xs text-slate-400">No hay órdenes registradas aún.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap min-w-[200px]">Nº Orden</th>
                  <th className="py-3 px-3 whitespace-nowrap min-w-[110px]">Fecha</th>
                  <th className="py-3 px-3 min-w-[170px]">Cliente</th>
                  <th className="py-3 px-3 min-w-[180px]">Dispositivo</th>
                  <th className="py-3 px-3 min-w-[130px]">Técnico</th>
                  <th className="py-3 px-4 pr-3 text-right min-w-[120px]">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {ordenesData.ordenes.map((orden) => {
                  const displayNumero =
                    orden.numero_orden && orden.numero_orden !== 'ORD-2025'
                      ? orden.numero_orden
                      : orden.fecha
                        ? `ORD-${orden.fecha}-${orden.id.slice(0, 4).toUpperCase()}`
                        : orden.id.slice(0, 8);

                  return (
                    <tr key={orden.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap tracking-tight">
                        {displayNumero}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{orden.fecha}</td>
                      <td className="py-3.5 px-3 text-slate-900 dark:text-slate-100 font-semibold">
                        {orden.equipo?.cliente?.nombre || 'Cliente'} {orden.equipo?.cliente?.apellido || ''}
                      </td>
                      <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300">
                        {orden.equipo?.marca || ''} {orden.equipo?.modelo || orden.equipo?.nombre || 'Dispositivo'}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">{orden.realiza_orden || 'No asignado'}</td>
                      <td className="py-3.5 px-4 pr-3 text-right">
                        <Badge status={orden.estado}>{orden.estado}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
