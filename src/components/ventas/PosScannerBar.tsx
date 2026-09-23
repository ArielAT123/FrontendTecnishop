import React from 'react';
import {
  Barcode,
  Search,
  CheckCircle,
  AlertCircle,
  Settings,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Producto } from '../../types';
import { getProductPrice } from '../../utils/productUtils';

export interface PosScannerBarProps {
  scannerMode: string;
  isServerOnline: boolean;
  barcodeInput: string;
  setBarcodeInput: (val: string) => void;
  barcodeInputRef: React.RefObject<HTMLInputElement | null>;
  handleBarcodeSubmit: (e: React.FormEvent) => void;
  scanStatusMessage: string | null;
  scanError: string | null;
  setScanError: (val: string | null) => void;
  searchManual: string;
  setSearchManual: (val: string) => void;
  filteredManualProducts: Producto[];
  onSelectManualProduct: (p: Producto) => void;
  onNavigate?: (section: any) => void;
}

export const PosScannerBar: React.FC<PosScannerBarProps> = ({
  scannerMode,
  isServerOnline,
  barcodeInput,
  setBarcodeInput,
  barcodeInputRef,
  handleBarcodeSubmit,
  scanStatusMessage,
  scanError,
  setScanError,
  searchManual,
  setSearchManual,
  filteredManualProducts,
  onSelectManualProduct,
  onNavigate,
}) => {
  return (
    <Card className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
      {/* Alert if scannerMode === 'web' and !isServerOnline */}
      {scannerMode === 'web' && !isServerOnline && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 animate-fadeIn text-xs">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>
              Sin conexión con el escáner web. Conecta tu celular escaneando el QR en Configuración o utiliza modo USB.
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onNavigate?.('configuracion')}
            className="text-xs font-bold border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 shrink-0 flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Ir a Configuración</span>
          </Button>
        </div>
      )}

      <form onSubmit={handleBarcodeSubmit} className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                scannerMode === 'web'
                  ? isServerOnline
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-amber-500'
                  : 'bg-emerald-500 animate-ping'
              }`}
            />
            <span className="text-xs font-bold text-[#3498db] tracking-wider uppercase">
              {scannerMode === 'web'
                ? isServerOnline
                  ? 'Escáner Móvil WiFi Sincronizado'
                  : 'Escáner Móvil Desconectado'
                : 'Lector de Código de Barras Activo'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            {scannerMode === 'web'
              ? 'Dispara desde la cámara de tu celular'
              : 'Pistola USB / Bluetooth o Teclado + Enter'}
          </span>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#3498db]">
            <Barcode className="w-6 h-6" />
          </div>
          <input
            ref={barcodeInputRef as any}
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder={
              scannerMode === 'web'
                ? 'Esperando escaneo desde el celular o ingresa código manualmente...'
                : 'Dispara el escáner o escribe el código de barras aquí y presiona Enter...'
            }
            className="w-full pl-12 pr-28 py-3.5 bg-white dark:bg-slate-950 border-2 border-[#3498db]/60 focus:border-[#3498db] rounded-xl text-slate-900 dark:text-white font-mono text-sm shadow-inner focus:outline-none focus:ring-4 focus:ring-[#3498db]/20 transition-all placeholder:text-slate-400"
            autoFocus
          />
          <button
            type="submit"
            className="absolute inset-y-1.5 right-1.5 px-4 bg-[#3498db] hover:bg-[#2980b9] text-white font-bold text-xs rounded-lg transition-colors shadow-md flex items-center gap-1.5"
          >
            <span>Agregar</span>
          </button>
        </div>
      </form>

      {/* Status / Alerts */}
      {scanStatusMessage && (
        <div className="mt-2.5 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-400 text-xs font-semibold animate-fadeIn">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{scanStatusMessage}</span>
        </div>
      )}

      {scanError && (
        <div className="mt-2.5 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-rose-400 text-xs font-semibold animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{scanError}</span>
          </div>
          <button
            onClick={() => setScanError(null)}
            className="text-rose-300 hover:text-white text-xs underline"
          >
            Entendido
          </button>
        </div>
      )}

      {/* Manual search helper accordion */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-750 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex-1 w-full relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchManual}
            onChange={(e) => setSearchManual(e.target.value)}
            placeholder="Búsqueda manual por nombre o código..."
            className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3498db]/40 focus:border-[#3498db]"
          />
        </div>
        {searchManual && (
          <button
            type="button"
            onClick={() => setSearchManual('')}
            className="text-[11px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white whitespace-nowrap"
          >
            Limpiar búsqueda
          </button>
        )}
      </div>

      {/* Quick Results Drawer */}
      {searchManual.trim().length > 0 && filteredManualProducts.length > 0 && (
        <div className="mt-2 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1 animate-fadeIn shadow-lg">
          <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 px-2">
            Resultados coincidentes:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {filteredManualProducts.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectManualProduct(p)}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-blue-50/70 dark:bg-slate-800 dark:hover:bg-slate-700 text-left transition-colors border border-slate-200 dark:border-slate-700/60"
              >
                <div className="truncate pr-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {p.nombre}
                    </p>
                    {p.tipo === 'SERVICIO' && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30">
                        Servicio
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {p.codigo} &bull;{' '}
                    {p.tipo === 'SERVICIO' ? (
                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                        {p.tiempo_estimado_minutos
                          ? `Est: ${p.tiempo_estimado_minutos} min`
                          : 'Mano de obra'}
                      </span>
                    ) : (
                      <>
                        Stock:{' '}
                        <b
                          className={
                            p.cantidad <= 2
                              ? 'text-amber-500'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }
                        >
                          {p.cantidad}
                        </b>
                      </>
                    )}
                  </p>
                </div>
                <span className="font-mono font-bold text-xs text-[#3498db] whitespace-nowrap">
                  ${getProductPrice(p).toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
