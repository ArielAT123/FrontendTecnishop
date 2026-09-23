import React from 'react';
import { ClipboardList, Loader2, Printer, Eye, FileCheck, FileText } from 'lucide-react';
import { Card } from '../ui/Card';
import { Orden, Cliente, Equipo } from '../../types';
import { NavSection } from '../layout/Sidebar';

export interface OrdenesTableViewProps {
  filteredOrdenes: Orden[];
  isLoading: boolean;
  isSyncing: boolean;
  searchTerm: string;
  selectedStatus: string;
  updatingOrderIds: string[];
  getOrdenCliente: (orden: Orden) => Cliente | null;
  getOrdenEquipo: (orden: Orden) => Equipo | null;
  onUpdateStatus: (ordenId: string, status: string) => void;
  onPrintOrden: (orden: Orden) => void;
  onViewOrden: (orden: Orden) => void;
  onNavigate?: (section: NavSection) => void;
  onSelectOrderForReport?: (orden: Orden) => void;
}

export const OrdenesTableView: React.FC<OrdenesTableViewProps> = ({
  filteredOrdenes,
  isLoading,
  isSyncing,
  searchTerm,
  selectedStatus,
  updatingOrderIds,
  getOrdenCliente,
  getOrdenEquipo,
  onUpdateStatus,
  onPrintOrden,
  onViewOrden,
  onNavigate,
  onSelectOrderForReport,
}) => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <ClipboardList className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span>Órdenes de Servicio ({filteredOrdenes.length})</span>
          {isSyncing && (
            <span className="text-[10px] font-normal text-[#3498db] animate-pulse bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
              Sincronizando en segundo plano...
            </span>
          )}
        </h3>
      </div>

      {isLoading && filteredOrdenes.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400">
          Cargando órdenes de servicio...
        </div>
      ) : filteredOrdenes.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400">
          {searchTerm || selectedStatus !== 'ALL'
            ? 'No se encontraron órdenes para este filtro.'
            : 'No hay órdenes registradas aún.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap min-w-[200px]">Nº Orden</th>
                <th className="py-3 px-3 whitespace-nowrap min-w-[110px]">Fecha</th>
                <th className="py-3 px-3 min-w-[170px]">Cliente</th>
                <th className="py-3 px-3 min-w-[180px]">Equipo</th>
                <th className="py-3 px-3 min-w-[140px]">Técnico Asignado</th>
                <th className="py-3 px-3 min-w-[160px]">Estado</th>
                <th className="py-3 px-4 text-right whitespace-nowrap min-w-[120px]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredOrdenes.map((orden) => {
                const isBlocked = updatingOrderIds.includes(orden.id);
                const displayNumero =
                  orden.numero_orden && orden.numero_orden !== 'ORD-2025'
                    ? orden.numero_orden
                    : orden.fecha
                    ? `ORD-${orden.fecha}-${orden.id.slice(0, 4).toUpperCase()}`
                    : orden.id.slice(0, 8);

                const cli = getOrdenCliente(orden);
                const eq = getOrdenEquipo(orden);
                const clientName = cli
                  ? `${cli.nombre} ${cli.apellido || ''}`.trim()
                  : 'Cliente Mostrador';

                return (
                  <tr
                    key={orden.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap tracking-tight">
                      {displayNumero}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {orden.fecha}
                    </td>
                    <td className="py-3.5 px-3 text-slate-900 dark:text-slate-100 font-bold">
                      {clientName}
                    </td>
                    <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300">
                      <span className="font-semibold">{eq?.marca || ''}</span>{' '}
                      {eq?.modelo || eq?.nombre || 'Equipo'}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400 font-medium">
                      {orden.realiza_orden || 'Sin asignar'}
                    </td>
                    <td
                      className={`py-3.5 px-3 transition-colors ${
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
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold border transition-all ${
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
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onPrintOrden(orden)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Imprimir Orden Oficial (A4 Dual)"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onViewOrden(orden)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Ver Detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {onNavigate &&
                          (orden.tiene_ficha_tecnica ? (
                            <button
                              onClick={() => onNavigate('reportes')}
                              className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                              title="Ficha técnica ya emitida (Ver informes)"
                            >
                              <FileCheck className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (onSelectOrderForReport) onSelectOrderForReport(orden);
                                onNavigate('reportes');
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Generar Reporte Técnico"
                            >
                              <FileText className="w-4 h-4" />
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
    </Card>
  );
};
