import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, Receipt, CheckCircle, Smartphone } from 'lucide-react';
import { Venta } from '../../types';
import { Button } from '../ui/Button';

interface FacturaPrintModalProps {
  venta: Venta | null;
  isOpen: boolean;
  onClose: () => void;
  onNewSale?: () => void;
}

export const FacturaPrintModal: React.FC<FacturaPrintModalProps> = ({
  venta,
  isOpen,
  onClose,
  onNewSale,
}) => {
  const [printFormat, setPrintFormat] = useState<'a4' | 'ticket'>('a4');
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !venta) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(venta.fecha).toLocaleString('es-EC', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const subtotalNum = Number(venta.subtotal) || 0;
  const ivaNum = Number(venta.iva) || 0;
  const totalNum = Number(venta.total) || 0;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* Header Toolbar (no-print) */}
        <div className="h-16 px-6 bg-slate-800 border-b border-slate-700 flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Venta Realizada &bull; Factura {venta.numero_factura}
              </h3>
              <p className="text-xs text-slate-400">
                Inventario descontado con éxito en la base de datos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Format toggle */}
            <div className="flex items-center bg-slate-700/80 p-0.5 rounded-lg text-xs font-semibold text-slate-300 mr-2 border border-slate-600">
              <button
                onClick={() => setPrintFormat('a4')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  printFormat === 'a4' ? 'bg-[#3498db] text-white' : 'hover:text-white'
                }`}
              >
                Factura A4
              </button>
              <button
                onClick={() => setPrintFormat('ticket')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  printFormat === 'ticket' ? 'bg-[#3498db] text-white' : 'hover:text-white'
                }`}
              >
                Ticket 80mm
              </button>
            </div>

            <Button
              onClick={handlePrint}
              size="sm"
              className="bg-[#3498db] hover:bg-[#2980b9] text-white flex items-center gap-2 shadow-lg shadow-[#3498db]/30"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </Button>

            {onNewSale && (
              <Button
                onClick={() => {
                  onClose();
                  onNewSale();
                }}
                size="sm"
                variant="secondary"
                className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/30"
              >
                Nueva Venta
              </Button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Printable Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/90 flex justify-center">
          {printFormat === 'a4' ? (
            /* =================== FORMATO FACTURA A4 / MEDIA CARTA =================== */
            <div
              ref={printRef}
              id="factura-print-container"
              className="w-[190mm] bg-white text-black p-6 shadow-2xl rounded-sm font-sans text-xs border border-slate-300"
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <img src="/tecnishopicon.png" alt="Tecnishop" className="w-6 h-6 object-contain" />
                    <h1 className="text-xl font-black tracking-wider text-slate-900">
                      Tecni<span className="text-[#3498db]">shop</span>
                    </h1>
                  </div>
                  <p className="text-[11px] font-bold text-slate-700">SERVICIO TÉCNICO & VENTA DE REPUESTOS</p>
                  <p className="text-[10px] text-slate-600 mt-1">R.U.C.: 0917526758001</p>
                  <p className="text-[10px] text-slate-600">Cdla. Cóndor Mz. G Villa 13 Locales #1 y #2</p>
                  <p className="text-[10px] text-slate-600">WhatsApp: 0999339586 &bull; tecnishop.imp@gmail.com</p>
                </div>
                <div className="text-right">
                  <div className="border-2 border-black p-2 bg-slate-50 inline-block min-w-[200px] text-center">
                    <p className="text-[10px] uppercase font-bold text-slate-700 tracking-wider">COMPROBANTE DE VENTA</p>
                    <p className="text-base font-black text-blue-900 mt-0.5">{venta.numero_factura}</p>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-2 font-medium">
                    <b>Fecha:</b> {formattedDate}
                  </p>
                  <p className="text-[10px] text-slate-600 font-medium">
                    <b>Estado:</b> <span className="text-emerald-700 font-bold">{venta.estado}</span>
                  </p>
                </div>
              </div>

              {/* Client Info */}
              <div className="border border-black rounded-sm p-3 mb-4 bg-slate-50 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <p>
                    <b className="text-slate-700">CLIENTE:</b>{' '}
                    <span className="uppercase font-semibold">{venta.cliente_nombre}</span>
                  </p>
                  <p className="mt-1">
                    <b className="text-slate-700">C.I./R.U.C.:</b>{' '}
                    <span className="font-mono font-semibold">{venta.cliente_identificacion}</span>
                  </p>
                </div>
                <div>
                  <p>
                    <b className="text-slate-700">FORMA DE PAGO:</b>{' '}
                    <span className="font-bold text-blue-900">{venta.metodo_pago}</span>
                  </p>
                  <p className="mt-1">
                    <b className="text-slate-700">ATENDIDO POR:</b>{' '}
                    <span className="font-medium">{venta.usuario || 'Cajero Tecnishop'}</span>
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full border-collapse border border-black mb-4 text-[11px]">
                <thead>
                  <tr className="bg-slate-200">
                    <th className="border border-black p-2 text-center w-[12%] font-bold">CÓDIGO</th>
                    <th className="border border-black p-2 text-center w-[10%] font-bold">CANT.</th>
                    <th className="border border-black p-2 text-left w-[48%] font-bold">DESCRIPCIÓN DEL ARTÍCULO</th>
                    <th className="border border-black p-2 text-right w-[15%] font-bold">P. UNIT</th>
                    <th className="border border-black p-2 text-right w-[15%] font-bold">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {venta.detalles && venta.detalles.length > 0 ? (
                    venta.detalles.map((det, idx) => (
                      <tr key={idx} className="border-b border-black">
                        <td className="border border-black p-1.5 text-center font-mono text-[10px]">{det.codigo_producto}</td>
                        <td className="border border-black p-1.5 text-center font-bold">{det.cantidad}</td>
                        <td className="border border-black p-1.5 font-medium">{det.nombre_producto}</td>
                        <td className="border border-black p-1.5 text-right font-mono">${Number(det.precio_unitario).toFixed(2)}</td>
                        <td className="border border-black p-1.5 text-right font-mono font-bold">${Number(det.subtotal).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-500 italic">Sin detalles registrados</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Totals Breakdown */}
              <div className="flex justify-end mb-6">
                <div className="w-[45%] border border-black text-[11px]">
                  <div className="flex justify-between p-1.5 border-b border-black">
                    <span className="font-semibold text-slate-700">SUBTOTAL:</span>
                    <span className="font-mono font-bold">${subtotalNum.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between p-1.5 border-b border-black">
                    <span className="font-semibold text-slate-700">IVA (15%):</span>
                    <span className="font-mono font-bold">${ivaNum.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-100 text-sm">
                    <span className="font-black text-slate-900">TOTAL A PAGAR:</span>
                    <span className="font-mono font-black text-blue-900 text-base">${totalNum.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Terms & Footer */}
              <div className="border-t border-dashed border-slate-400 pt-3 text-[9px] text-slate-500 text-center space-y-0.5">
                <p className="font-bold text-slate-700 uppercase">¡GRACIAS POR SU COMPRA EN TECNISHOP!</p>
                <p>Conserve este documento para reclamos o devoluciones dentro del plazo de garantía (30 días en repuestos instalados).</p>
                <p>Comprobante generado electrónicamente por Tecnishop POS System 2.0</p>
              </div>
            </div>
          ) : (
            /* =================== FORMATO TICKET TÉRMICO 80mm =================== */
            <div
              ref={printRef}
              id="factura-print-container"
              className="w-[80mm] bg-white text-black p-4 shadow-2xl rounded-sm font-mono text-[10px] leading-tight border border-slate-300"
            >
              <div className="text-center pb-2 border-b border-dashed border-black mb-2">
                <div className="flex justify-center items-center gap-1.5 mb-1">
                  <img src="/tecnishopicon.png" alt="Tecnishop" className="w-5 h-5 object-contain" />
                  <p className="text-sm font-black tracking-wider">TECNISHOP</p>
                </div>
                <p className="text-[9px]">R.U.C. 0917526758001</p>
                <p className="text-[8px] text-slate-600">Cdla. Cóndor Mz. G Villa 13 Locales #1 y #2</p>
                <p className="text-[8px] text-slate-600">WhatsApp: 0999339586</p>
                <p className="text-[11px] font-bold mt-1">VENTA #{venta.numero_factura}</p>
                <p className="text-[8px]">{formattedDate}</p>
              </div>

              <div className="pb-2 border-b border-dashed border-black mb-2 text-[9px]">
                <p><b>CLI:</b> {venta.cliente_nombre}</p>
                <p><b>RUC:</b> {venta.cliente_identificacion}</p>
                <p><b>PAGO:</b> {venta.metodo_pago}</p>
              </div>

              {/* Items */}
              <div className="pb-2 border-b border-dashed border-black mb-2">
                <div className="flex justify-between font-bold text-[8px] border-b border-black pb-0.5 mb-1">
                  <span>DESCRIPCIÓN</span>
                  <span>TOTAL</span>
                </div>
                {venta.detalles?.map((d, i) => (
                  <div key={i} className="mb-1 text-[9px]">
                    <div className="flex justify-between font-medium">
                      <span>{d.nombre_producto}</span>
                      <span className="font-bold">${Number(d.subtotal).toFixed(2)}</span>
                    </div>
                    <div className="text-[8px] text-slate-600">
                      {d.cantidad} x ${Number(d.precio_unitario).toFixed(2)} ({d.codigo_producto})
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="pb-2 border-b-2 border-black mb-2 text-[10px]">
                <div className="flex justify-between">
                  <span>SUBTOTAL:</span>
                  <span>${subtotalNum.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA 15%:</span>
                  <span>${ivaNum.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-xs pt-1 border-t border-black mt-1">
                  <span>TOTAL:</span>
                  <span>${totalNum.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center text-[8px] text-slate-600 pt-1">
                <p className="font-bold">¡GRACIAS POR SU PREFERENCIA!</p>
                <p>www.tecnishop.com</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
