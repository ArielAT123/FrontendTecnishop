import React from 'react';
import {
  Keyboard,
  Barcode,
  AlertCircle,
  Settings,
  Search,
  Sparkles,
} from 'lucide-react';
import { Producto, Proveedor } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ProductoFormFields } from './ProductoFormFields';

export interface NuevoProductoModalProps {
  isOpen: boolean;
  onClose: () => void;
  isService: boolean;
  scanMode: 'manual' | 'pistola';
  setScanMode: (mode: 'manual' | 'pistola') => void;
  globalScannerMode: string;
  isServerOnline: boolean;
  onNavigate?: (section: any) => void;
  barcodeInputRef: React.RefObject<any>;
  pistolaInput: string;
  setPistolaInput: (val: string) => void;
  isSearchingWorldwide: boolean;
  onBarcodeSubmit: (code: string) => void;
  lookupFeedback: {
    found?: boolean;
    type?: 'success' | 'info' | 'error';
    source?: string;
    productName?: string;
    message?: string;
    imageUrl?: string;
  } | null;
  onClearLookupFeedback: () => void;
  formError: string | null;
  formData: Partial<Producto>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Producto>>>;
  costo: number;
  pvp: number;
  ganancia: number;
  margenPorcentaje: string;
  proveedores: Proveedor[];
  onOpenProveedoresModal: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  formatMinutes: (minutes?: number) => string;
}

export const NuevoProductoModal: React.FC<NuevoProductoModalProps> = ({
  isOpen,
  onClose,
  isService,
  scanMode,
  setScanMode,
  globalScannerMode,
  isServerOnline,
  onNavigate,
  barcodeInputRef,
  pistolaInput,
  setPistolaInput,
  isSearchingWorldwide,
  onBarcodeSubmit,
  lookupFeedback,
  onClearLookupFeedback,
  formError,
  formData,
  setFormData,
  costo,
  pvp,
  ganancia,
  margenPorcentaje,
  proveedores,
  onOpenProveedoresModal,
  onSubmit,
  isPending,
  formatMinutes,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isService ? 'Registrar Servicio de Taller / Mano de Obra' : 'Registrar Artículo en Inventario'}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Selector de modo de escáner */}
        {!isService && (
          <div className="bg-slate-100 dark:bg-slate-800/70 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setScanMode('manual');
                onClearLookupFeedback();
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                scanMode === 'manual'
                  ? 'bg-[#3498db] text-white shadow-md shadow-[#3498db]/30 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 font-semibold'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              <span>Modo Manual</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setScanMode('pistola');
                onClearLookupFeedback();
                setTimeout(() => barcodeInputRef.current?.focus(), 100);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                scanMode === 'pistola'
                  ? 'bg-[#3498db] text-white shadow-md shadow-[#3498db]/30 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 font-semibold'
              }`}
            >
              <Barcode className="w-4 h-4" />
              <span>Pistola / Escáner</span>
            </button>
          </div>
        )}

        {/* Alerta de conexión escáner web si no está online */}
        {!isService && globalScannerMode === 'web' && !isServerOnline && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
              <div>
                <p className="font-bold">Sin conexión con el escáner web</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                  El modo configurado es escáner web/WiFi pero el servidor no responde. Puedes configurar el escáner o usar modo pistola/manual.
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                onClose();
                onNavigate?.('configuracion');
              }}
              className="text-xs font-bold border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 shrink-0 flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configurar Escáner</span>
            </Button>
          </div>
        )}

        {!isService && scanMode === 'pistola' && (
          <div className="p-4 rounded-2xl bg-[#3498db]/10 border border-[#3498db]/30 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#3498db] uppercase tracking-wider flex items-center gap-1.5">
                <Barcode className="w-4 h-4" />
                <span>Escáner Físico Listo</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Presiona Enter al disparar
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                ref={barcodeInputRef}
                placeholder="Dispara la pistola lectora o escribe el código aquí..."
                value={pistolaInput}
                onChange={(e) => setPistolaInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onBarcodeSubmit(pistolaInput);
                  }
                }}
                leftIcon={<Barcode className="w-4 h-4 text-[#3498db]" />}
                className="font-mono text-xs"
              />
              <Button
                type="button"
                onClick={() => onBarcodeSubmit(pistolaInput)}
                disabled={!pistolaInput.trim() || isSearchingWorldwide}
                isLoading={isSearchingWorldwide}
                className="bg-[#3498db] hover:bg-[#2980b9] text-white font-bold text-xs shrink-0"
              >
                <Search className="w-4 h-4 mr-1.5" />
                Consultar API
              </Button>
            </div>
          </div>
        )}

        {/* Lookup Feedback Banner */}
        {lookupFeedback && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 animate-fadeIn ${
              lookupFeedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {lookupFeedback.imageUrl ? (
                <img
                  src={lookupFeedback.imageUrl}
                  alt="Producto"
                  className="w-8 h-8 rounded-lg object-cover border border-emerald-500/40 bg-white"
                />
              ) : (
                <Sparkles className="w-4 h-4 shrink-0 text-emerald-500" />
              )}
              <div>
                <p className="font-bold">{lookupFeedback.message}</p>
                {lookupFeedback.source && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    Fuente: {lookupFeedback.source}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClearLookupFeedback}
              className="text-[11px] font-bold underline opacity-70 hover:opacity-100"
            >
              Ocultar
            </button>
          </div>
        )}

        {formError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-500 text-xs font-medium animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Formulario de registro */}
        <ProductoFormFields
          isService={isService}
          formData={formData}
          setFormData={setFormData}
          costo={costo}
          pvp={pvp}
          ganancia={ganancia}
          margenPorcentaje={margenPorcentaje}
          proveedores={proveedores}
          onOpenProveedoresModal={onOpenProveedoresModal}
          onSubmit={onSubmit}
          onCancel={onClose}
          isPending={isPending}
          formatMinutes={formatMinutes}
        />
      </div>
    </Modal>
  );
};
