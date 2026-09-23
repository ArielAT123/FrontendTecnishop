import React from 'react';
import { Mail, Send, FileText } from 'lucide-react';
import { WhatsAppIcon } from '../common/WhatsAppIcon';
import { Button } from '../ui/Button';
import { sampleData, emailSubjects } from './templateConstants';

export interface TemplatePreviewSimulatorProps {
  previewChannel: 'whatsapp' | 'email';
  setPreviewChannel: (channel: 'whatsapp' | 'email') => void;
  selectedType: string;
  previewText: string;
  testPhone: string;
  setTestPhone: (phone: string) => void;
  isTesting: boolean;
  testSuccess: string | null;
  onSendTest: () => void;
}

export const TemplatePreviewSimulator: React.FC<TemplatePreviewSimulatorProps> = ({
  previewChannel,
  setPreviewChannel,
  selectedType,
  previewText,
  testPhone,
  setTestPhone,
  isTesting,
  testSuccess,
  onSendTest,
}) => {
  return (
    <div className="space-y-3 lg:col-span-5 animate-fadeIn">
      {/* Preview Toolbar: Channel Switcher (WhatsApp vs Email) */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium">
          <button
            type="button"
            onClick={() => setPreviewChannel('whatsapp')}
            className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
              previewChannel === 'whatsapp'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <WhatsAppIcon className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => setPreviewChannel('email')}
            className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
              previewChannel === 'email'
                ? 'bg-white dark:bg-slate-700 text-[#3498db] shadow-xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>Correo Electrónico</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-500 font-medium">
          Datos: {sampleData.cliente_nombre}
        </span>
      </div>

      {/* CHANNEL 1: WHATSAPP SIMULATOR */}
      {previewChannel === 'whatsapp' && (
        <div className="rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-[#efeae2] dark:bg-[#0b141a] p-4 min-h-[380px] flex flex-col justify-between shadow-lg relative overflow-hidden animate-fadeIn">
          {/* WhatsApp Chat Header */}
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-black/10 dark:border-white/10">
            <div className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center text-white text-[11px] font-bold">
              T
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Tecnishop Oficial</p>
              <p className="text-[10px] text-[#25D366] font-medium">En línea</p>
            </div>
          </div>

          {/* Chat Bubble */}
          <div className="space-y-2 flex-1">
            <div className="max-w-[94%] bg-white dark:bg-[#202c33] text-slate-900 dark:text-slate-100 p-3.5 rounded-2xl rounded-tl-none shadow-sm space-y-2 border border-slate-200/50 dark:border-none">
              {/* PDF Attachment representation */}
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-100 dark:bg-[#111b21] border border-slate-200 dark:border-slate-700 text-xs">
                <div className="p-1.5 rounded-md bg-rose-500 text-white">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[11px] truncate">
                    {selectedType.toLowerCase()}_{sampleData.factura_numero || sampleData.orden_id}.pdf
                  </p>
                  <p className="text-[9px] text-slate-400">Documento Oficial &bull; PDF</p>
                </div>
              </div>

              {/* Rendered Text */}
              <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-line break-words text-slate-800 dark:text-slate-100">
                {previewText || 'El mensaje aparecerá aquí en tiempo real mientras escribes...'}
              </p>

              <div className="text-right">
                <span className="text-[10px] text-slate-400">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          {/* Test Send to Real Phone - Only WhatsApp elements are green */}
          <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center gap-2">
            <div className="flex items-center gap-1.5 w-full sm:w-auto flex-1">
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium shrink-0">
                Probar envío a:
              </span>
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="0990939856"
                className="w-full px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#25D366] font-mono"
              />
            </div>

            <Button
              size="sm"
              onClick={onSendTest}
              disabled={isTesting || !testPhone}
              className="w-full sm:w-auto bg-[#25D366] hover:bg-[#20ba59] text-white text-xs gap-1.5 shrink-0 shadow-sm"
            >
              <Send className="w-3.5 h-3.5 text-white" />
              <span>{isTesting ? 'Enviando...' : 'Enviar Prueba'}</span>
            </Button>
          </div>

          {testSuccess && (
            <p
              className={`text-[11px] mt-1 text-center font-medium ${
                testSuccess.startsWith('Error') ? 'text-rose-500' : 'text-[#25D366]'
              }`}
            >
              {testSuccess}
            </p>
          )}
        </div>
      )}

      {/* CHANNEL 2: EMAIL CLIENT SIMULATOR */}
      {previewChannel === 'email' && (
        <div className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 p-3 min-h-[380px] flex flex-col justify-between shadow-lg relative overflow-hidden animate-fadeIn">
          {/* Email Client Top Bar */}
          <div className="space-y-1.5 pb-2.5 mb-2.5 border-b border-slate-200 dark:border-slate-800 text-[11px]">
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Asunto:
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[240px]">
                {emailSubjects[selectedType] || 'Notificación Oficial Tecnishop'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-500 text-[10px]">
              <span>De: <strong className="text-slate-700 dark:text-slate-300">Tecnishop Taller</strong> &lt;notificaciones@tecnishop.com&gt;</span>
              <span>Para: <strong className="text-slate-700 dark:text-slate-300">{sampleData.cliente_nombre}</strong></span>
            </div>
          </div>

          {/* Email Body Card */}
          <div className="flex-1 bg-white dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-xs shadow-xs space-y-3.5">
            {/* Email Brand Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#3498db] text-white flex items-center justify-center font-bold text-xs">
                  T
                </div>
                <span className="font-extrabold text-sm tracking-wider text-slate-900 dark:text-slate-100">
                  TECNISHOP
                </span>
              </div>
              <span className="text-[10px] text-slate-400">
                {new Date().toLocaleDateString('es-EC')}
              </span>
            </div>

            {/* Rendered Email Content */}
            <div className="space-y-2 text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line text-xs">
              {previewText || 'El contenido del correo electrónico se generará aquí en tiempo real...'}
            </div>

            {/* Attached PDF Card */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-md bg-rose-500 text-white shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[11px] text-slate-800 dark:text-slate-200 truncate">
                    {selectedType.toLowerCase()}_{sampleData.factura_numero || sampleData.orden_id}.pdf
                  </p>
                  <p className="text-[10px] text-slate-400">Comprobante Adjunto (142 KB)</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#3498db] border border-[#3498db]/30 px-2 py-1 rounded bg-[#3498db]/10 shrink-0">
                Descargar PDF
              </span>
            </div>

            {/* Footer Notice */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 text-center">
              Este es un correo automático oficial emitido por Tecnishop Taller Especializado.
            </div>
          </div>

          <div className="mt-2 text-center text-[10px] text-slate-400">
            Vista previa de plantilla para canal de correo SMTP
          </div>
        </div>
      )}
    </div>
  );
};
