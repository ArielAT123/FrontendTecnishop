import React from 'react';
import { Receipt, Printer } from 'lucide-react';
import { Card } from '../ui/Card';
import { Venta } from '../../types';

export interface VentasHistoryTableProps {
  ventasHistorial: Venta[];
  isLoadingVentas: boolean;
  isSyncingVentas: boolean;
  onPrintFactura: (venta: Venta) => void;
}

export const VentasHistoryTable: React.FC<VentasHistoryTableProps> = ({
  ventasHistorial,
  isLoadingVentas,
  isSyncingVentas,
  onPrintFactura,
}) => {
  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
          <Receipt className="w-4 h-4 text-[#3498db]" />
          <span>Registro de Facturas Emitidas</span>
          {isSyncingVentas && (
            <span className="text-[10px] font-normal text-[#3498db] animate-pulse bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
              Sincronizando...
            </span>
          )}
        </h3>
        <span className="text-xs text-slate-400">
          Total facturas registradas: <b>{ventasHistorial.length}</b>
        </span>
      </div>

      {isLoadingVentas && ventasHistorial.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs">Cargando facturas...</div>
      ) : ventasHistorial.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          No hay facturas emitidas todavía.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/50 text-slate-500 font-semibold">
                <th className="py-3 px-4">N° Factura</th>
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Método Pago</th>
                <th className="py-3 px-4">Atendido Por</th>
                <th className="py-3 px-4 text-right">Total Facturado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {ventasHistorial.map((v) => (
                <tr
                  key={v.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-3 px-4 font-mono font-bold text-[#3498db]">
                    {v.numero_factura}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {new Date(v.fecha).toLocaleString('es-EC', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      {v.cliente_nombre}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {v.cliente_identificacion}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {v.metodo_pago}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{v.usuario || 'admin'}</td>
                  <td className="py-3 px-4 text-right font-mono font-black text-slate-900 dark:text-white text-sm">
                    ${Number(v.total).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onPrintFactura(v)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-[#3498db] hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                      title="Visualizar e Imprimir Factura"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
