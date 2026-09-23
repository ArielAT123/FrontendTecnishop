import React from 'react';
import { Button } from '../ui/Button';
import { Reporte } from '../../types';
import { Eye, Edit2, Printer, ShoppingCart, Receipt, AlertTriangle } from 'lucide-react';

export interface ReportesTableViewProps {
  filteredReportes: Reporte[];
  getReporteEquipo: (r: Reporte) => any;
  getReporteCliente: (r: Reporte) => any;
  setViewingReporte: (r: Reporte) => void;
  handleEditReporte: (r: Reporte) => void;
  handleOpenFacturaPrint: (factura: any, repId: string) => void;
  handleFacturarDesdeVista: (rep: Reporte) => void;
  onNavigate?: (section: any) => void;
}

export const ReportesTableView: React.FC<ReportesTableViewProps> = ({
  filteredReportes,
  getReporteEquipo,
  getReporteCliente,
  setViewingReporte,
  handleEditReporte,
  handleOpenFacturaPrint,
  handleFacturarDesdeVista,
  onNavigate,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
          <tr>
            <th className="pb-3 px-3">Orden / Fecha</th>
            <th className="pb-3 px-3">Cliente</th>
            <th className="pb-3 px-3">Equipo</th>
            <th className="pb-3 px-3">Diagnóstico Real</th>
            <th className="pb-3 px-3">Cotización</th>
            <th className="pb-3 px-3">Técnico</th>
            <th className="pb-3 px-3 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredReportes.map((rep) => {
            const eq = getReporteEquipo(rep);
            const cli = getReporteCliente(rep);
            const totAceptado = Number(rep.total_aceptado ?? rep.total_general ?? 0);
            const totRechazado = Number(rep.total_rechazado || 0);

            return (
              <tr key={rep.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-3 px-3">
                  <span className="font-mono font-bold text-[#3498db]">
                    #{rep.orden?.numero_orden || (rep.orden_id ? String(rep.orden_id).slice(0, 8) : 'S/N')}
                  </span>
                  <div className="text-[10px] text-slate-400">
                    {new Date(rep.fecha_creacion).toLocaleDateString()}
                  </div>
                </td>

                <td className="py-3 px-3">
                  <div className="font-bold text-slate-800 dark:text-slate-100">
                    {cli ? `${cli.nombre} ${cli.apellido || ''}`.trim() : 'N/A'}
                  </div>
                  {cli?.telefono && (
                    <div className="text-[10px] text-slate-400 font-mono">
                      Tel: {cli.telefono}
                    </div>
                  )}
                </td>

                <td className="py-3 px-3">
                  <div className="font-medium text-slate-800 dark:text-slate-200">
                    {eq?.nombre || 'Equipo'} ({eq?.marca} {eq?.modelo})
                  </div>
                  {eq?.numero_serie && (
                    <div className="text-[10px] text-slate-400 font-mono">
                      S/N: {eq.numero_serie}
                    </div>
                  )}
                </td>

                <td className="py-3 px-3 max-w-xs">
                  <p className="truncate text-slate-600 dark:text-slate-300 font-medium">
                    {rep.diagnostico_problemas || (
                      <span className="text-slate-400 italic">Sin diagnóstico especificado</span>
                    )}
                  </p>
                </td>

                <td className="py-3 px-3">
                  {totAceptado > 0 ? (
                    <div>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ${totAceptado.toFixed(2)}
                      </span>
                      <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-semibold">
                        Aceptado
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        Chequeo: ${Number(rep.precio_chequeo || 10).toFixed(2)}
                      </span>
                      <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-600 font-semibold">
                        Rechazado
                      </span>
                    </div>
                  )}
                  {totRechazado > 0 && totAceptado > 0 && (
                    <div className="text-[10px] text-slate-400">
                      Rechazado: ${totRechazado.toFixed(2)}
                    </div>
                  )}
                  {(rep.esta_facturado || rep.factura) && (
                    <div className="mt-1 flex items-center">
                      <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                        <Receipt className="w-3 h-3 mr-1 text-blue-600 dark:text-blue-400" />
                        {rep.factura?.numero_factura || 'Factura Emitida'}
                      </span>
                    </div>
                  )}
                </td>

                <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                  {rep.persona_a_cargo || 'Tecnishop'}
                </td>

                <td className="py-3 px-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViewingReporte(rep)}
                      className="h-7 px-2 text-xs"
                      title="Ver e Imprimir Ficha Técnica"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Ver
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
