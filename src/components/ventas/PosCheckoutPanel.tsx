import React from 'react';
import {
  User,
  CreditCard,
  Banknote,
  ArrowRightLeft,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Cliente } from '../../types';

export interface PosCheckoutPanelProps {
  clienteTipo: 'consumidor_final' | 'registrado';
  setClienteTipo: (tipo: 'consumidor_final' | 'registrado') => void;
  selectedCliente: Cliente | null;
  setSelectedCliente: (c: Cliente | null) => void;
  clienteSearch: string;
  setClienteSearch: (search: string) => void;
  filteredClientes: Cliente[];
  metodoPago: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';
  setMetodoPago: (metodo: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA') => void;
  montoRecibido: string;
  setMontoRecibido: (val: string) => void;
  cambio: number;
  cartLength: number;
  subtotal0: number;
  subtotal15: number;
  subtotalTotal: number;
  ivaTotal: number;
  totalPagar: number;
  onFinalizarVenta: () => void;
  isProcessing: boolean;
}

export const PosCheckoutPanel: React.FC<PosCheckoutPanelProps> = ({
  clienteTipo,
  setClienteTipo,
  selectedCliente,
  setSelectedCliente,
  clienteSearch,
  setClienteSearch,
  filteredClientes,
  metodoPago,
  setMetodoPago,
  montoRecibido,
  setMontoRecibido,
  cambio,
  cartLength,
  subtotal0,
  subtotal15,
  subtotalTotal,
  ivaTotal,
  totalPagar,
  onFinalizarVenta,
  isProcessing,
}) => {
  const montoRecibidoNum = parseFloat(montoRecibido) || 0;

  return (
    <div className="space-y-4">
      {/* CLIENT SELECTION CARD */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <User className="w-4 h-4 text-[#3498db]" />
            Datos del Cliente
          </span>
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
            <button
              type="button"
              onClick={() => {
                setClienteTipo('consumidor_final');
                setSelectedCliente(null);
              }}
              className={`px-2.5 py-1 rounded transition-colors ${
                clienteTipo === 'consumidor_final'
                  ? 'bg-[#3498db] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Final
            </button>
            <button
              type="button"
              onClick={() => setClienteTipo('registrado')}
              className={`px-2.5 py-1 rounded transition-colors ${
                clienteTipo === 'registrado'
                  ? 'bg-[#3498db] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Registrado
            </button>
          </div>
        </div>

        {clienteTipo === 'consumidor_final' ? (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs space-y-1 border border-slate-200/80 dark:border-slate-800/80">
            <p className="font-bold text-slate-800 dark:text-slate-200">CONSUMIDOR FINAL</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              R.U.C./C.I.: 9999999999999
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              value={clienteSearch}
              onChange={(e) => setClienteSearch(e.target.value)}
              placeholder="Buscar cliente por C.I. o nombre..."
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3498db]/40 focus:border-[#3498db]"
            />

            {filteredClientes.length > 0 && !selectedCliente && (
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 shadow-lg">
                {filteredClientes.map((c) => (
                  <button
                    key={c.ci}
                    type="button"
                    onClick={() => {
                      setSelectedCliente(c);
                      setClienteSearch('');
                    }}
                    className="w-full p-2.5 text-left hover:bg-blue-50/70 dark:hover:bg-slate-800 text-xs transition-colors"
                  >
                    <p className="font-bold text-slate-900 dark:text-white">
                      {c.nombre} {c.apellido || ''}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {c.ci}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {selectedCliente && (
              <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-[#3498db]/40 rounded-xl flex items-center justify-between text-xs shadow-sm transition-colors">
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {selectedCliente.nombre} {selectedCliente.apellido || ''}
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-mono mt-0.5">
                    C.I.: {selectedCliente.ci}{' '}
                    {selectedCliente.telefono && `• ${selectedCliente.telefono}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCliente(null)}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:underline px-2 py-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors ml-2"
                >
                  Cambiar
                </button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* PAYMENT METHOD CARD */}
      <Card className="p-4 space-y-3">
        <span className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
          <CreditCard className="w-4 h-4 text-[#3498db]" />
          Forma de Pago
        </span>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setMetodoPago('EFECTIVO')}
            className={`p-2.5 rounded-xl border text-center transition-all ${
              metodoPago === 'EFECTIVO'
                ? 'bg-[#3498db] text-white border-[#3498db] shadow-md shadow-[#3498db]/30 font-bold'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Banknote className="w-5 h-5 mx-auto mb-1" />
            <span className="text-[11px]">Efectivo</span>
          </button>

          <button
            type="button"
            onClick={() => setMetodoPago('TARJETA')}
            className={`p-2.5 rounded-xl border text-center transition-all ${
              metodoPago === 'TARJETA'
                ? 'bg-[#3498db] text-white border-[#3498db] shadow-md shadow-[#3498db]/30 font-bold'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-5 h-5 mx-auto mb-1" />
            <span className="text-[11px]">Tarjeta</span>
          </button>

          <button
            type="button"
            onClick={() => setMetodoPago('TRANSFERENCIA')}
            className={`p-2.5 rounded-xl border text-center transition-all ${
              metodoPago === 'TRANSFERENCIA'
                ? 'bg-[#3498db] text-white border-[#3498db] shadow-md shadow-[#3498db]/30 font-bold'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ArrowRightLeft className="w-5 h-5 mx-auto mb-1" />
            <span className="text-[11px]">Transferencia</span>
          </button>
        </div>

        {/* Cash change calculator */}
        {metodoPago === 'EFECTIVO' && cartLength > 0 && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-750 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                Efectivo Recibido ($):
              </span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={montoRecibido}
                onChange={(e) => setMontoRecibido(e.target.value)}
                className="w-24 px-2 py-1 text-right font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-[#3498db]"
              />
            </div>
            {montoRecibidoNum > 0 && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 text-xs">
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  Cambio / Vuelto:
                </span>
                <span className="font-mono font-black text-emerald-800 dark:text-emerald-300 text-sm">
                  ${cambio.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* TOTALS & CHECKOUT BUTTON */}
      <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="space-y-2 text-xs">
          {subtotal0 > 0 && (
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal Tarifa 0%:</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                ${subtotal0.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>
              {subtotal0 > 0 ? 'Subtotal Gravado (15%):' : 'Subtotal Sin Impuestos:'}
            </span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
              ${(subtotal0 > 0 ? subtotal15 : subtotalTotal).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>I.V.A.:</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
              ${ivaTotal.toFixed(2)}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
            <span className="text-sm font-black text-slate-900 dark:text-white">TOTAL:</span>
            <span className="text-2xl font-black text-[#3498db] font-mono">
              ${totalPagar.toFixed(2)}
            </span>
          </div>
        </div>

        <Button
          onClick={onFinalizarVenta}
          disabled={cartLength === 0 || isProcessing}
          isLoading={isProcessing}
          className="w-full py-4 text-sm font-black bg-[#3498db] hover:bg-[#2980b9] text-white shadow-xl shadow-[#3498db]/30 rounded-xl"
        >
          Cobrar y Emitir Factura
        </Button>
      </Card>
    </div>
  );
};
