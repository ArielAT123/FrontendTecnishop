import React from 'react';
import {
  Phone,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Clock,
  Wrench,
  CheckCircle2,
  Loader2,
  Printer,
  Eye,
  FileCheck,
  FileText,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Orden, Cliente, Equipo } from '../../types';
import { NavSection } from '../layout/Sidebar';

export interface ClientGroup {
  clientKey: string;
  cliente: {
    ci?: string;
    nombre?: string;
    apellido?: string;
    telefono?: string;
    correo?: string;
  };
  ordenes: Orden[];
  counts: {
    total: number;
    pendientes: number;
    enProceso: number;
    completadas: number;
    cobradas: number;
    canceladas: number;
  };
}

export interface OrdenesClientesViewProps {
  groupedByClient: ClientGroup[];
  filteredOrdenes: Orden[];
  expandedClients: Record<string, boolean>;
  toggleClient: (key: string) => void;
  toggleAllClients: (expand: boolean) => void;
  isLoading: boolean;
  isSyncing: boolean;
  searchTerm: string;
  selectedStatus: string;
  updatingOrderIds: string[];
  getOrdenEquipo: (orden: Orden) => Equipo | null;
  onUpdateStatus: (ordenId: string, status: string) => void;
  onPrintOrden: (orden: Orden) => void;
  onViewOrden: (orden: Orden) => void;
  onNavigate?: (section: NavSection) => void;
  onSelectOrderForReport?: (orden: Orden) => void;
}

export const OrdenesClientesView: React.FC<OrdenesClientesViewProps> = ({
  groupedByClient,
  filteredOrdenes,
  expandedClients,
  toggleClient,
  toggleAllClients,
  isLoading,
  isSyncing,
  searchTerm,
  selectedStatus,
  updatingOrderIds,
  getOrdenEquipo,
  onUpdateStatus,
  onPrintOrden,
  onViewOrden,
  onNavigate,
  onSelectOrderForReport,
}) => {
  return (
    <div className="space-y-4">
      {/* Client Group View Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 dark:text-slate-100">
            {groupedByClient.length}
          </span>{' '}
          {groupedByClient.length === 1 ? 'Cliente con' : 'Clientes con'}{' '}
          <span className="font-bold text-slate-800 dark:text-slate-100">
            {filteredOrdenes.length}
          </span>{' '}
          {filteredOrdenes.length === 1 ? 'orden' : 'órdenes'}
          {isSyncing && (
            <span className="text-[10px] font-normal text-[#3498db] animate-pulse bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 ml-1">
              Sincronizando...
            </span>
          )}
        </div>
        {groupedByClient.length > 0 && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => toggleAllClients(true)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Expandir Todos</span>
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => toggleAllClients(false)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:underline"
            >
              <Minimize2 className="w-3 h-3" />
              <span>Colapsar Todos</span>
            </button>
          </div>
        )}
      </div>

      {isLoading && filteredOrdenes.length === 0 ? (
        <Card className="p-12 text-center text-xs text-slate-400">
          Cargando clientes y órdenes...
        </Card>
      ) : filteredOrdenes.length === 0 ? (
        <Card className="p-12 text-center text-xs text-slate-400">
          {searchTerm || selectedStatus !== 'ALL'
            ? 'No se encontraron clientes ni órdenes para este filtro.'
            : 'No hay órdenes registradas aún.'}
        </Card>
      ) : (
        <div className="space-y-3">
          {groupedByClient.map((group) => {
            const isExpanded = expandedClients[group.clientKey] ?? true;
            const initials = `${(group.cliente.nombre || '')[0] || 'C'}${
              (group.cliente.apellido || '')[0] || ''
            }`.toUpperCase();

            return (
              <div
                key={group.clientKey}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {/* Header Bar (Clickable) */}
                <div
                  onClick={() => toggleClient(group.clientKey)}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer bg-gradient-to-r from-slate-50/70 via-white to-slate-50/40 dark:from-slate-850/80 dark:via-slate-900 dark:to-slate-850/80 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 select-none transition-colors"
                >
                  {/* Left: Avatar & Contact Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3498db] to-[#2980b9] text-white flex items-center justify-center font-black text-sm shadow-md shadow-[#3498db]/20 shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                          {group.cliente.nombre} {group.cliente.apellido}
                        </h4>
                        {group.cliente.ci && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            CI: {group.cliente.ci}
                          </span>
                        )}
                      </div>
                      {group.cliente.telefono && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{group.cliente.telefono}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Badges & Chevron */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold">
                      {group.counts.total} {group.counts.total === 1 ? 'Orden' : 'Órdenes'}
                    </span>

                    {group.counts.pendientes > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-bold">
                        <Clock className="w-3 h-3" />
                        <span>
                          {group.counts.pendientes} Pendiente
                          {group.counts.pendientes > 1 ? 's' : ''}
                        </span>
                      </span>
                    )}

                    {group.counts.enProceso > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-400 text-[11px] font-bold">
                        <Wrench className="w-3 h-3" />
                        <span>{group.counts.enProceso} En Proceso</span>
                      </span>
                    )}

                    {group.counts.completadas > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>
                          {group.counts.completadas} Completada
                          {group.counts.completadas > 1 ? 's' : ''}
                        </span>
                      </span>
                    )}

                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 ml-1">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Subtable of Client Orders */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800 overflow-x-auto bg-slate-50/30 dark:bg-slate-900/30">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/80 dark:bg-slate-850/60 border-b border-slate-200/70 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-2.5 px-4 whitespace-nowrap min-w-[190px]">Nº Orden</th>
                          <th className="py-2.5 px-3 whitespace-nowrap min-w-[100px]">Fecha</th>
                          <th className="py-2.5 px-3 min-w-[180px]">Equipo / Modelo</th>
                          <th className="py-2.5 px-3 min-w-[140px]">Técnico Asignado</th>
                          <th className="py-2.5 px-3 min-w-[160px]">Estado</th>
                          <th className="py-2.5 px-4 text-right whitespace-nowrap min-w-[110px]">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium bg-white dark:bg-slate-900">
                        {group.ordenes.map((orden) => {
                          const isBlocked = updatingOrderIds.includes(orden.id);
                          const displayNumero =
                            orden.numero_orden && orden.numero_orden !== 'ORD-2025'
                              ? orden.numero_orden
                              : orden.fecha
                              ? `ORD-${orden.fecha}-${orden.id.slice(0, 4).toUpperCase()}`
                              : orden.id.slice(0, 8);
                          const eq = getOrdenEquipo(orden);

                          return (
                            <tr
                              key={orden.id}
                              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                            >
                              <td className="py-2.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                {displayNumero}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                {orden.fecha}
                              </td>
                              <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                                <span className="font-semibold">{eq?.marca || ''}</span>{' '}
                                {eq?.modelo || eq?.nombre || 'Equipo'}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-medium">
                                {orden.realiza_orden || 'Sin asignar'}
                              </td>
                              <td
                                className={`py-2 px-3 transition-colors ${
                                  isBlocked
                                    ? 'bg-slate-200/80 dark:bg-slate-800/90 pointer-events-none select-none rounded-lg'
                                    : ''
                                }`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <select
                                    value={orden.estado}
                                    disabled={isBlocked}
                                    onChange={(e) => onUpdateStatus(orden.id, e.target.value)}
                                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border transition-all ${
                                      isBlocked
                                        ? 'bg-slate-300/80 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-400/50 cursor-not-allowed shadow-none'
                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 cursor-pointer focus:outline-none text-slate-800 dark:text-slate-200 shadow-sm hover:border-slate-300'
                                    }`}
                                  >
                                    <option value="PENDIENTE">PENDIENTE</option>
                                    <option value="EN_PROCESO">EN PROCESO</option>
                                    <option value="COMPLETADO">COMPLETADO</option>
                                    <option value="COBRADO">COBRADO</option>
                                    <option value="CANCELADO">CANCELADO</option>
                                  </select>
                                  {isBlocked && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-semibold animate-pulse">
                                      <Loader2 className="w-3 h-3 animate-spin text-slate-500" />
                                      <span className="hidden sm:inline">Guardando...</span>
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 px-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => onPrintOrden(orden)}
                                    className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    title="Imprimir Orden Oficial"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => onViewOrden(orden)}
                                    className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    title="Ver Detalle"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  {onNavigate &&
                                    (orden.tiene_ficha_tecnica ? (
                                      <button
                                        onClick={() => onNavigate('reportes')}
                                        className="p-1 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                                        title="Ficha técnica ya emitida (Ver informes)"
                                      >
                                        <FileCheck className="w-3.5 h-3.5" />
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          if (onSelectOrderForReport)
                                            onSelectOrderForReport(orden);
                                          onNavigate('reportes');
                                        }}
                                        className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        title="Generar Reporte Técnico"
                                      >
                                        <FileText className="w-3.5 h-3.5" />
                                      </button>
                                    ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
