import React from 'react';
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShoppingCart,
  User as UserIcon,
  Laptop,
  Calculator,
  ExternalLink,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Reporte } from '../../types';
import { NavSection } from '../layout/Sidebar';

export interface CotizacionesListProps {
  loading: boolean;
  reportes: Reporte[];
  tabEstado: 'PENDIENTES' | 'LISTAS' | 'TODAS';
  getReporteEquipo: (rep: Reporte) => any;
  getReporteCliente: (rep: Reporte) => any;
  onOpenEdit: (rep: Reporte) => void;
  onNavigate?: (section: NavSection) => void;
}

export const CotizacionesList: React.FC<CotizacionesListProps> = ({
  loading,
  reportes,
  tabEstado,
  getReporteEquipo,
  getReporteCliente,
  onOpenEdit,
  onNavigate,
}) => {
  if (loading) {
    return (
      <div className="py-16 text-center">
        <RefreshCw className="w-8 h-8 text-[#3498db] animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-medium">Cargando cotizaciones...</p>
      </div>
    );
  }

  if (reportes.length === 0) {
    return (
      <Card className="p-12 text-center border-dashed border-slate-300 dark:border-slate-800">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
          {tabEstado === 'PENDIENTES'
            ? 'No hay cotizaciones pendientes de completar'
            : 'No se encontraron cotizaciones para este filtro'}
        </p>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          {tabEstado === 'PENDIENTES'
            ? 'Todos los repuestos e ítems cotizados tienen asignados su proveedor y costo.'
            : 'Verifica los criterios de búsqueda o revisa las demás pestañas.'}
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {reportes.map((rep) => {
        const orden = rep.orden;
        const equipo = getReporteEquipo(rep);
        const cliente = getReporteCliente(rep);
        const repAceptados = (rep.repuestos_utilizados || []).filter(
          (r) => r.estado === 'COTIZADO'
        );
        const trabAceptados = (rep.trabajos_realizados || []).filter(
          (t) => t.estado === 'COTIZADO'
        );
        const repIncompletos = repAceptados.filter(
          (r) => !r.proveedor || Number(r.costo_unitario_proveedor || 0) <= 0
        );
        const estaCompleto = repIncompletos.length === 0;

        return (
          <Card
            key={rep.id}
            className="p-5 transition-all duration-200 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left Info */}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    {orden?.numero_orden || 'ORD-S/N'}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(rep.fecha_creacion).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>

                  {/* Status Badge */}
                  {estaCompleto ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Lista para Facturar</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span>{repIncompletos.length} repuesto(s) pendientes</span>
                    </span>
                  )}

                  {rep.esta_facturado && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/10 text-[#3498db] border border-[#3498db]/20">
                      <ShoppingCart className="w-3 h-3" />
                      <span>Facturado</span>
                    </span>
                  )}
                </div>

                {/* Client & Device Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <UserIcon className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-semibold">
                      {cliente
                        ? `${cliente.nombre} ${cliente.apellido || ''}`
                        : 'Consumidor Final'}
                    </span>
                    {cliente?.ci && (
                      <span className="text-slate-400">({cliente.ci})</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Laptop className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      {equipo ? `${equipo.marca} ${equipo.modelo}` : 'Equipo en taller'}
                    </span>
                  </div>
                </div>

                {/* Items Overview Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                    Repuestos:{' '}
                    <strong className="text-slate-900 dark:text-white">
                      {repAceptados.length}
                    </strong>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                    Servicios:{' '}
                    <strong className="text-slate-900 dark:text-white">
                      {trabAceptados.length}
                    </strong>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                    Total Cotizado:{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      ${Number(rep.total_aceptado || 0).toFixed(2)}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 lg:flex-col lg:items-end justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                <Button
                  onClick={() => onOpenEdit(rep)}
                  className="bg-[#3498db] hover:bg-[#2980b9] text-white text-xs font-semibold px-4 py-2 flex items-center gap-1.5 shadow-sm"
                >
                  <Calculator className="w-4 h-4" />
                  <span>
                    {estaCompleto ? 'Ver / Modificar Costos' : 'Completar Datos'}
                  </span>
                </Button>

                {estaCompleto && onNavigate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate('reportes')}
                    className="text-xs text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ir a Facturar</span>
                  </Button>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
