import React from 'react';
import { Package, Clock } from 'lucide-react';
import { Producto } from '../../types';
import { Card } from '../ui/Card';
import { getProductPrice } from '../../utils/productUtils';

export interface ProductosTableProps {
  isService: boolean;
  filteredProductos: Producto[];
  isLoading: boolean;
  isSyncing: boolean;
  searchTerm: string;
  formatMinutes: (minutes?: number) => string;
}

export const ProductosTable: React.FC<ProductosTableProps> = ({
  isService,
  filteredProductos,
  isLoading,
  isSyncing,
  searchTerm,
  formatMinutes,
}) => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        {isService ? (
          <Clock className="w-5 h-5 text-amber-500" />
        ) : (
          <Package className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        )}
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span>
            {isService ? 'Servicios de Taller & Mano de Obra' : 'Inventario de Repuestos'} ({filteredProductos.length}{' '}
            {isService ? 'servicios' : 'artículos'})
          </span>
          {isSyncing && (
            <span className="text-[10px] font-normal text-[#3498db] animate-pulse bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
              Sincronizando en segundo plano...
            </span>
          )}
        </h3>
      </div>

      {isLoading && filteredProductos.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400">
          {isService ? 'Cargando servicios técnicos...' : 'Cargando inventario...'}
        </div>
      ) : filteredProductos.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400">
          {searchTerm
            ? `No se encontraron ${isService ? 'servicios' : 'productos'} coincidentes.`
            : `No hay ${isService ? 'servicios de taller' : 'productos'} registrados aún.`}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="pb-3 pl-2">Código</th>
                <th className="pb-3">{isService ? 'Servicio / Mano de Obra' : 'Descripción / Artículo'}</th>
                <th className="pb-3 text-center">{isService ? 'Tiempo Estimado' : 'Stock'}</th>
                <th className="pb-3 text-right">{isService ? 'Costo Mano de Obra' : 'Costo'}</th>
                <th className="pb-3 pr-2 text-right">{isService ? 'Tarifa al Cliente' : 'PVP (Precio de Venta)'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredProductos.map((prod) => (
                <tr key={prod.id || prod.codigo} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 pl-2 font-mono font-bold text-brand-600 dark:text-brand-400">
                    {prod.codigo}
                  </td>
                  <td className="py-3 text-slate-900 dark:text-slate-100 font-semibold">
                    {prod.nombre}
                    {prod.descripcion && (
                      <span className="block text-[11px] font-normal text-slate-500 dark:text-slate-400 line-clamp-1">
                        {prod.descripcion}
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-center">
                    {isService ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <Clock className="w-3.5 h-3.5" />
                        {formatMinutes(prod.tiempo_estimado_minutos)}
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          prod.cantidad > 5
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : prod.cantidad > 0
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                        }`}
                      >
                        {prod.cantidad} uds
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right font-mono text-slate-600 dark:text-slate-400">
                    ${Number(prod.costo_compra || 0).toFixed(2)}
                  </td>
                  <td className="py-3 pr-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ${getProductPrice(prod).toFixed(2)}
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
