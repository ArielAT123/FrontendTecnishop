import React from 'react';
import { Button } from '../ui/Button';
import { WhatsAppIcon } from '../common/WhatsAppIcon';
import { Reporte } from '../../types';
import { FileText, ClipboardList, ChevronDown } from 'lucide-react';

export interface WhatsAppOptionsDropdownProps {
  reporte: Reporte;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  dropdownRef: any;
  isSendingCotizacion: boolean;
  isSendingInforme: boolean;
  onSendCotizacion: (reporte: Reporte) => Promise<void>;
  onSendInforme: (reporte: Reporte) => Promise<void>;
}

export const WhatsAppOptionsDropdown: React.FC<WhatsAppOptionsDropdownProps> = ({
  reporte,
  isOpen,
  onToggle,
  onClose,
  dropdownRef,
  isSendingCotizacion,
  isSendingInforme,
  onSendCotizacion,
  onSendInforme,
}) => {
  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        type="button"
        onClick={onToggle}
        disabled={isSendingCotizacion || isSendingInforme}
        className="bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] text-white font-semibold text-xs flex items-center gap-2 px-3.5 py-2 rounded-xl shadow-md shadow-[#25D366]/25 transition-all"
        title="Opciones de envío por WhatsApp"
      >
        <WhatsAppIcon className="w-4 h-4 text-white" />
        <span>
          {isSendingCotizacion
            ? 'Enviando...'
            : isSendingInforme
            ? 'Enviando...'
            : 'WhatsApp'}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-white transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </Button>

      {/* Menú Desplegable Flotante (Alineado a la izquierda sin cortes y compatible con modo claro/oscuro) */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
          <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-white">
              <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
              <span>Opciones de WhatsApp</span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Cliente</span>
          </div>

          <div className="p-1.5 space-y-1">
            {/* Opción 1: Enviar Cotización */}
            <button
              type="button"
              disabled={isSendingCotizacion}
              onClick={() => {
                onClose();
                onSendCotizacion(reporte);
              }}
              className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/90 active:bg-slate-100 dark:active:bg-slate-800 transition flex items-start gap-2.5 group"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>Enviar Cotización</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200/60 dark:border-transparent">Link</span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                  Enlace seguro interactivo para que el cliente autorice ítems.
                </p>
              </div>
            </button>

            {/* Opción 2: Enviar Informe Técnico */}
            <button
              type="button"
              disabled={isSendingInforme}
              onClick={() => {
                onClose();
                onSendInforme(reporte);
              }}
              className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/90 active:bg-slate-100 dark:active:bg-slate-800 transition flex items-start gap-2.5 group"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <ClipboardList className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center justify-between">
                  <span>Enviar Informe Técnico</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-medium border border-blue-200/60 dark:border-transparent">PDF</span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                  Documento PDF formal con diagnóstico y trabajos realizados.
                </p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
