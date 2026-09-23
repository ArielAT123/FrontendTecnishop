import React from 'react';
import { Barcode, Trash2, Plus, Minus } from 'lucide-react';
import { Card } from '../ui/Card';
import { Producto } from '../../types';

export interface CartItem {
  producto: Producto;
  cantidad: number;
  precio_unitario: number;
  impuesto_porcentaje: number;
  subtotal: number;
}

export interface PosCartTableProps {
  cart: CartItem[];
  onUpdateQuantity: (index: number, newQty: number) => void;
  onUpdateUnitPrice: (index: number, newPrice: number) => void;
  onUpdateItemTax: (index: number, newTax: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
}

export const PosCartTable: React.FC<PosCartTableProps> = ({
  cart,
  onUpdateQuantity,
  onUpdateUnitPrice,
  onUpdateItemTax,
  onRemoveItem,
  onClearCart,
}) => {
  const totalUnits = cart.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
            Productos en la Venta ({totalUnits} unidades)
          </span>
        </div>
        {cart.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Vaciar Carrito</span>
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-850/60 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Barcode className="w-8 h-8 opacity-60" />
          </div>
          <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
            El carrito está vacío
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Apunta y escanea el código de barras de cualquier producto con tu pistola lectora para comenzar a facturar.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/50 text-slate-500">
                <th className="py-2.5 px-4 font-semibold">Producto / Código</th>
                <th className="py-2.5 px-2 font-semibold text-center w-28">Cantidad</th>
                <th className="py-2.5 px-3 font-semibold text-right">P. Unitario</th>
                <th className="py-2.5 px-3 font-semibold text-right">IVA</th>
                <th className="py-2.5 px-3 font-semibold text-right">Subtotal</th>
                <th className="py-2.5 px-3 text-center w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {cart.map((item, index) => {
                return (
                  <tr
                    key={item.producto.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          {item.producto.nombre}
                        </p>
                        {item.producto.tipo === 'SERVICIO' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20">
                            Servicio
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Código: {item.producto.codigo} &bull;{' '}
                        {item.producto.tipo === 'SERVICIO' ? (
                          item.producto.tiempo_estimado_minutos ? (
                            `Tiempo est: ${item.producto.tiempo_estimado_minutos} min`
                          ) : (
                            'Servicio técnico'
                          )
                        ) : (
                          `Disponible: ${item.producto.cantidad}`
                        )}
                      </p>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="inline-flex items-center border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden">
                        <button
                          onClick={() => onUpdateQuantity(index, item.cantidad - 1)}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="1"
                          value={item.cantidad === 0 ? '' : item.cantidad}
                          onChange={(e) => {
                            let raw = e.target.value.replace(/[^0-9]/g, '');
                            if (raw === '') {
                              onUpdateQuantity(index, 0);
                              return;
                            }
                            if (/^0+[0-9]/.test(raw)) {
                              raw = raw.replace(/^0+/, '');
                            }
                            const max =
                              item.producto.tipo === 'SERVICIO' ? 999 : item.producto.cantidad;
                            let val = parseInt(raw) || 0;
                            if (val > max) val = max;
                            onUpdateQuantity(index, val);
                          }}
                          onBlur={() => {
                            if (item.cantidad < 1) onUpdateQuantity(index, 1);
                          }}
                          className="w-12 text-center bg-transparent text-xs font-bold focus:outline-none"
                        />
                        <button
                          onClick={() => onUpdateQuantity(index, item.cantidad + 1)}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center justify-end border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-900 shadow-sm focus-within:ring-2 focus-within:ring-[#3498db]/40">
                        <span className="text-slate-400 font-mono text-xs font-semibold mr-1">$</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={item.precio_unitario === 0 ? '' : item.precio_unitario}
                          onChange={(e) => {
                            let raw = e.target.value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
                            const parts = raw.split('.');
                            if (parts.length > 2) {
                              raw = parts[0] + '.' + parts.slice(1).join('');
                            }
                            if (/^0+[0-9]/.test(raw)) {
                              raw = raw.replace(/^0+/, '');
                            }
                            if (raw === '') {
                              onUpdateUnitPrice(index, 0);
                              return;
                            }
                            const val = parseFloat(raw);
                            onUpdateUnitPrice(index, isNaN(val) ? 0 : val);
                          }}
                          className="w-16 text-right font-mono font-bold bg-transparent text-slate-900 dark:text-slate-100 text-xs focus:outline-none"
                          title="Precio unitario de venta (editable)"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <select
                        value={item.impuesto_porcentaje}
                        onChange={(e) =>
                          onUpdateItemTax(index, parseFloat(e.target.value) || 0)
                        }
                        className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs py-1 px-1.5 font-semibold focus:outline-none focus:ring-2 focus:ring-[#3498db]/40 cursor-pointer shadow-sm"
                        title="Porcentaje de IVA"
                      >
                        <option value="15">15%</option>
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="8">8%</option>
                      </select>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      ${item.subtotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onRemoveItem(index)}
                        className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
