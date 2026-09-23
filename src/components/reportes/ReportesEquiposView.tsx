import React from 'react';
import { Button } from '../ui/Button';
import { Reporte } from '../../types';
import { ReporteEquipoGroup } from './ReportesTable';
import { Laptop, FileText, Receipt, Eye, Edit2, Printer, ShoppingCart, AlertTriangle } from 'lucide-react';

export interface ReportesEquiposViewProps {
  reportesPorEquipo: ReporteEquipoGroup[];
  setViewingReporte: (r: Reporte) => void;
  handleEditReporte: (r: Reporte) => void;
  handleOpenFacturaPrint: (factura: any, repId: string) => void;
  handleFacturarDesdeVista: (rep: Reporte) => void;
  onNavigate?: (section: any) => void;
}

export const ReportesEquiposView: React.FC<ReportesEquiposViewProps> = ({
  reportesPorEquipo,
  setViewingReporte,
  handleEditReporte,
  handleOpenFacturaPrint,
  handleFacturarDesdeVista,
  onNavigate,
}) => {
  return (
    <div className="space-y-5">
      {reportesPorEquipo.map((grp) => (
        <div
          key={grp.equipoKey}
          className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
        >
          {/* Cabecera del Equipo */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#3498db] border border-blue-200 dark:border-blue-900 shrink-0">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    {grp.equipo?.nombre || 'Equipo'} &bull; {grp.equipo?.marca} {grp.equipo?.modelo}
                  </h4>
                  {grp.equipo?.numero_serie && (
                    <span className="text-[11px] font-mono text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      S/N: {grp.equipo.numero_serie}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cliente: <span className="font-semibold text-slate-700 dark:text-slate-300">{grp.cliente ? `${grp.cliente.nombre} ${grp.cliente.apellido || ''}`.trim() : 'N/A'}</span>
                  {grp.cliente?.telefono && (
                    <span className="ml-2 font-mono text-slate-400">&bull; Tel: {grp.cliente.telefono}</span>
                  )}
                </p>
              </div>
            </div>

            {/* Resumen de totales por equipo */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Informes</span>
                <span className="text-xs font-extrabold text-[#3498db]">
                  {grp.reportes.length} {grp.reportes.length === 1 ? 'Ficha' : 'Fichas'}
                </span>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Cotizado</span>
                <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                  ${grp.totalAceptadoAcumulado.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Lista de Órdenes e Informes para este Equipo */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 pl-1">
              <FileText className="w-3.5 h-3.5 text-[#3498db]" />
              <span>Historial de Órdenes y Fichas Técnicas ({grp.reportes.length}):</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {grp.reportes.map((rep) => {
                const totAceptado = Number(rep.total_aceptado ?? rep.total_general ?? 0);
                const isAceptado = totAceptado > 0;
                const totFinal = isAceptado ? totAceptado : Number(rep.precio_chequeo || 10);

                return (
                  <div
                    key={rep.id}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-[#3498db] font-bold bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/60">
                          #{rep.orden?.numero_orden || (rep.orden_id ? String(rep.orden_id).slice(0, 8) : 'S/N')}
                        </span>
                        <span className="text-xs text-slate-400">
                          &bull; Fecha: <strong className="text-slate-600 dark:text-slate-300">{new Date(rep.fecha_creacion).toLocaleDateString()}</strong>
                        </span>
                        <span className="text-xs text-slate-400">
                          &bull; Técnico: <strong className="text-slate-600 dark:text-slate-300">{rep.persona_a_cargo || 'Tecnishop'}</strong>
                        </span>
                      </div>

                      {rep.diagnostico_problemas ? (
                        <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200/60 dark:border-slate-750">
                          <strong className="text-[#3498db] block mb-1">Diagnóstico Técnico:</strong>
                          <div className="whitespace-pre-line pl-1">{rep.diagnostico_problemas}</div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Sin diagnóstico especificado</p>
                      )}
                    </div>

                    {/* Total y Acciones para esta orden */}
                    <div className="flex items-center gap-3 self-end md:self-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-700/50 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-semibold">
                          {rep.esta_facturado || rep.factura ? (
                            <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center justify-end gap-1">
                              <Receipt className="w-3 h-3" />
                              Factura: {rep.factura?.numero_factura || 'Emitida'}
                            </span>
                          ) : isAceptado ? (
                            <span className="text-slate-400">Cotización Aceptada</span>
                          ) : (
                            <span className="text-slate-400">Tarifa Chequeo (Rechazado)</span>
                          )}
                        </p>
                        <p className={`text-sm font-black font-mono ${rep.esta_facturado || rep.factura ? 'text-blue-600 dark:text-blue-400' : isAceptado ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          ${totFinal.toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewingReporte(rep)}
                          className="h-7 px-2 text-xs"
                          title="Ver Ficha Técnica"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Ver Ficha
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditReporte(rep)}
                          className="h-7 px-2 text-xs border-blue-300 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                          title="Editar Diagnóstico y Cotización"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Editar
                        </Button>
                        {rep.esta_facturado || rep.factura ? (
                          <Button
                            size="sm"
                            onClick={() => handleOpenFacturaPrint(rep.factura, rep.id)}
                            className="h-7 px-2.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                            title="Imprimir Factura Emitida"
                          >
                            <Printer className="w-3.5 h-3.5 mr-1" />
                            Imprimir Factura
                          </Button>
                        ) : Number(rep.total_aceptado || 0) > 0 && !rep.cotizacion_completada ? (
                          <Button
                            size="sm"
                            onClick={() => onNavigate && onNavigate('cotizaciones')}
                            className="h-7 w-7 p-0 bg-amber-500 hover:bg-amber-600 text-white rounded-lg flex items-center justify-center shadow-sm"
                            title="Admin debe llenar campos faltantes en cotización"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleFacturarDesdeVista(rep)}
                            className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                            title="Facturar en Punto de Venta"
                          >
                            <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                            Facturar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
