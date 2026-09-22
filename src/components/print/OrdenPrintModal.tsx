import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, FileText, Scissors, CheckCircle, AlertCircle } from 'lucide-react';
import { Orden } from '../../types';
import { Button } from '../ui/Button';
import { WhatsAppIcon } from '../common/WhatsAppIcon';
import { documentNotificationService } from '../../services/documentNotificationService';

interface OrdenPrintModalProps {
  orden: Orden | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrdenPrintModal: React.FC<OrdenPrintModalProps> = ({
  orden,
  isOpen,
  onClose,
}) => {
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [whatsAppSuccess, setWhatsAppSuccess] = useState<string | null>(null);
  const [whatsAppError, setWhatsAppError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !orden) return null;

  const handleSendWhatsApp = async () => {
    setSendingWhatsApp(true);
    setWhatsAppSuccess(null);
    setWhatsAppError(null);
    try {
      const res = await documentNotificationService.sendOrden(orden);
      if (res.success) {
        setWhatsAppSuccess('¡Orden de trabajo enviada exitosamente por WhatsApp!');
        setTimeout(() => setWhatsAppSuccess(null), 5000);
      } else {
        setWhatsAppError(res.error || 'No se pudo enviar la orden por WhatsApp');
        setTimeout(() => setWhatsAppError(null), 6000);
      }
    } catch (err: any) {
      setWhatsAppError(err.message || 'Error de conexión con el servicio de mensajería');
      setTimeout(() => setWhatsAppError(null), 6000);
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper to extract nested equipment details
  const equipo = orden.equipo as any;
  const cliente = equipo?.cliente;
  const clienteNombre = cliente
    ? `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim() || cliente.ci
    : 'Consumidor Final';
  const clienteCi = cliente?.ci || 'S/N';
  const clienteTelefono = cliente?.telefono || 'N/A';
  const clienteCorreo = cliente?.correo || 'N/A';

  const equipoNombre = equipo?.nombre || 'Equipo Técnico';
  const equipoMarca = equipo?.marca || 'N/A';
  const equipoModelo = equipo?.modelo || 'N/A';
  const equipoSerie = equipo?.numero_serie || 'S/N';

  // Observaciones & accessories: prioritize orden.observaciones, fallback to equipo.observaciones
  const ordenObsList = (orden as any)?.observaciones;
  const equipoObsList = equipo?.observaciones;
  const obs = Array.isArray(ordenObsList) && ordenObsList.length > 0
    ? ordenObsList[0]
    : Array.isArray(equipoObsList) && equipoObsList.length > 0
    ? equipoObsList[0]
    : null;

  const cargador = obs?.cargador ? 'SÍ' : 'NO';
  const bateria = obs?.bateria ? 'SÍ' : 'NO';
  const cablePoder = obs?.cable_poder ? 'SÍ' : 'NO';
  const cableDatos = obs?.cable_datos ? 'SÍ' : 'NO';
  const otrosObs = obs?.otros || 'Ninguna observación adicional reportada.';

  // Problemas reportados: prioritize orden.problemas, fallback to equipo.problemas
  const problemasList: string[] = [];
  const ordenProbs = (orden as any)?.problemas;
  const equipoProbs = equipo?.problemas;
  const sourceProbs = Array.isArray(ordenProbs) && ordenProbs.length > 0
    ? ordenProbs
    : Array.isArray(equipoProbs)
    ? equipoProbs
    : [];

  sourceProbs.forEach((p: any) => {
    if (typeof p === 'string') problemasList.push(p);
    else if (p?.problema) problemasList.push(p.problema);
  });

  const numeroOrden = orden.numero_orden || (typeof orden.id === 'string' ? orden.id.substring(0, 8).toUpperCase() : 'ORD-000');
  const fechaOrden = orden.fecha || new Date().toISOString().split('T')[0];

  // Render individual voucher section (for Client or Workshop)
  const renderVoucher = (tipoCopia: 'ORIGINAL - CLIENTE' | 'COPIA - TALLER') => (
    <div className="border-2 border-black bg-white text-black p-3 text-[10px] leading-tight font-sans flex flex-col justify-between h-[135mm] box-border">
      {/* Header */}
      <div>
        <div className="flex justify-between items-stretch border-b border-black pb-1.5 mb-1.5">
          <div className="w-[58%] pr-2 border-r border-black">
            <div className="flex items-center gap-1.5 mb-0.5">
              <img src="/tecnishopicon.png" alt="Tecnishop" className="w-4 h-4 object-contain shrink-0" />
              <span className="font-black text-sm tracking-wider">TECNISHOP</span>
              <span className="text-[9px] bg-slate-100 px-1 py-0.5 border border-slate-300 font-bold ml-1">{tipoCopia}</span>
            </div>
            <p className="text-[8px] text-slate-700">R.U.C. 0917526758001 &bull; www.tecnishop.com</p>
            <p className="text-[8px] text-slate-700">Cdla. Cóndor Mz. G Villa 13 Locales #1 y #2</p>
            <p className="text-[8px] text-slate-700">WhatsApp: 0999339586 &bull; Email: tecnishop.imp@gmail.com</p>
          </div>
          <div className="w-[42%] pl-2 flex flex-col justify-center text-center">
            <span className="text-[10px] uppercase font-bold text-slate-600">Orden de Servicio</span>
            <span className="text-sm font-black text-blue-900 tracking-wide">N° {numeroOrden}</span>
            <span className="text-[9px] font-semibold text-slate-800 mt-0.5">Fecha: {fechaOrden}</span>
            <span className="text-[8px] uppercase font-bold text-emerald-700">Estado: {orden.estado}</span>
          </div>
        </div>

        {/* Client Info Table */}
        <table className="w-full border-collapse border border-black mb-1.5 text-[9px]">
          <tbody>
            <tr>
              <td className="border border-black bg-slate-100 p-1 font-bold w-[15%]">CLIENTE:</td>
              <td className="border border-black p-1 w-[45%] font-medium uppercase">{clienteNombre}</td>
              <td className="border border-black bg-slate-100 p-1 font-bold w-[15%]">C.I./R.U.C.:</td>
              <td className="border border-black p-1 w-[25%] font-mono">{clienteCi}</td>
            </tr>
            <tr>
              <td className="border border-black bg-slate-100 p-1 font-bold">TELÉFONO:</td>
              <td className="border border-black p-1">{clienteTelefono}</td>
              <td className="border border-black bg-slate-100 p-1 font-bold">EMAIL:</td>
              <td className="border border-black p-1 truncate">{clienteCorreo}</td>
            </tr>
          </tbody>
        </table>

        {/* Equipment & Problems Table */}
        <table className="w-full border-collapse border border-black mb-1.5 text-[9px]">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-black p-1 text-center font-bold">ARTÍCULO</th>
              <th className="border border-black p-1 text-center font-bold">MARCA</th>
              <th className="border border-black p-1 text-center font-bold">MODELO</th>
              <th className="border border-black p-1 text-center font-bold">N° SERIE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-1 text-center font-medium">{equipoNombre}</td>
              <td className="border border-black p-1 text-center">{equipoMarca}</td>
              <td className="border border-black p-1 text-center">{equipoModelo}</td>
              <td className="border border-black p-1 text-center font-mono">{equipoSerie}</td>
            </tr>
            <tr>
              <td colSpan={4} className="border border-black p-1.5 bg-slate-50">
                <span className="font-bold block text-[8px] text-slate-700 uppercase mb-0.5">Fallas / Problemas Reportados por el Cliente:</span>
                <p className="text-[9px] font-medium whitespace-pre-line text-rose-900">
                  {problemasList.length > 0 ? problemasList.map(p => `• ${p}`).join('\n') : 'Revisión técnica general requerida.'}
                </p>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Accessories / Observaciones */}
        <table className="w-full border-collapse border border-black mb-1.5 text-[8px]">
          <tbody>
            <tr>
              <td className="border border-black bg-slate-100 p-0.5 font-bold text-center w-[20%]">ACCESORIOS:</td>
              <td className="border border-black p-0.5 text-center w-[20%]">Cargador: <b>{cargador}</b></td>
              <td className="border border-black p-0.5 text-center w-[20%]">Batería: <b>{bateria}</b></td>
              <td className="border border-black p-0.5 text-center w-[20%]">Cable Poder: <b>{cablePoder}</b></td>
              <td className="border border-black p-0.5 text-center w-[20%]">Cable Datos: <b>{cableDatos}</b></td>
            </tr>
            <tr>
              <td className="border border-black bg-slate-100 p-0.5 font-bold text-center">NOTAS:</td>
              <td colSpan={4} className="border border-black p-0.5 italic">{otrosObs}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Conditions & Signatures */}
      <div>
        <div className="border border-black bg-slate-50 p-1 mb-2 text-[7px] text-slate-700 leading-tight">
          <b>CONDICIONES:</b> 1. Todo equipo no retirado en 30 días generará costo de bodegaje. Transcurridos 90 días será declarado en abandono. 2. El cliente es responsable de haber respaldado su información; el taller no responde por pérdida de datos de software. 3. Para retirar el equipo es indispensable la presentación de esta orden física.
        </div>

        <div className="grid grid-cols-2 gap-8 pt-4 pb-1">
          <div className="border-t border-black text-center text-[8px]">
            <span className="font-bold">FIRMA DEL CLIENTE</span>
            <p className="text-[7px] text-slate-500">Acepto diagnóstico y condiciones</p>
          </div>
          <div className="border-t border-black text-center text-[8px]">
            <span className="font-bold">RECIBIDO POR TECNISHOP</span>
            <p className="text-[7px] text-slate-500">Taller Autorizado</p>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 overflow-y-auto">
      {/* Modal Container */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* Modal Toolbar (hidden in print) */}
        <div className="h-16 px-6 bg-slate-800 border-b border-slate-700 flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#3498db] flex items-center justify-center text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Vista Previa de Orden de Servicio
              </h3>
              <p className="text-xs text-slate-400">
                Formato A4 Dual Oficial (Original Cliente y Copia Taller)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSendWhatsApp}
              disabled={sendingWhatsApp}
              size="md"
              className="bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center gap-2 shadow-lg shadow-[#25D366]/20 font-medium transition-all"
              title="Enviar notificación al WhatsApp del cliente"
            >
              <WhatsAppIcon className="w-4 h-4 text-white" />
              <span>{sendingWhatsApp ? 'Enviando...' : 'Enviar WhatsApp'}</span>
            </Button>

            <Button
              onClick={handlePrint}
              size="md"
              className="bg-[#3498db] hover:bg-[#2980b9] text-white flex items-center gap-2 shadow-lg shadow-[#3498db]/30"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Orden (A4)</span>
            </Button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {whatsAppSuccess && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 px-6 py-2 flex items-center gap-2 text-emerald-300 text-xs font-medium animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{whatsAppSuccess}</span>
          </div>
        )}
        {whatsAppError && (
          <div className="bg-rose-500/20 border-b border-rose-500/30 px-6 py-2 flex items-center gap-2 text-rose-300 text-xs font-medium animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{whatsAppError}</span>
          </div>
        )}

        {/* Modal Content / Printable Page */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/80 flex justify-center">
          <div
            ref={printRef}
            id="orden-print-container"
            className="w-[210mm] min-h-[297mm] bg-white text-black p-3 shadow-2xl flex flex-col justify-between box-border rounded-sm"
          >
            {/* 1. ORIGINAL - CLIENTE */}
            {renderVoucher('ORIGINAL - CLIENTE')}

            {/* Scissor Divider */}
            <div className="py-2 flex items-center justify-center text-slate-500 text-[8px] font-mono select-none">
              <span className="border-b border-dashed border-slate-400 flex-1" />
              <span className="px-3 flex items-center gap-1.5">
                <Scissors className="w-2.5 h-2.5" /> LÍNEA DE CORTE <Scissors className="w-2.5 h-2.5" />
              </span>
              <span className="border-b border-dashed border-slate-400 flex-1" />
            </div>

            {/* 2. COPIA - TALLER */}
            {renderVoucher('COPIA - TALLER')}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
