import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useScannerConfig } from '../../context/ScannerContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  Barcode,
  Smartphone,
  Wifi,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
} from 'lucide-react';

export interface ConfigScannerSectionProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const ConfigScannerSection: React.FC<ConfigScannerSectionProps> = ({
  isOpen,
  onToggle,
}) => {
  const {
    scannerMode,
    setScannerMode,
    isServerOnline,
    isCheckingServer,
    checkServerStatus,
    getQrUrl,
    lastScan,
  } = useScannerConfig();

  const [useHttps, setUseHttps] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [usbTestInput, setUsbTestInput] = useState('');
  const [usbLastScanned, setUsbLastScanned] = useState<string | null>(null);

  const currentQrUrl = getQrUrl(useHttps);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentQrUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <Card
      className={`p-6 border-2 border-[#3498db]/30 dark:border-[#3498db]/30 shadow-md transition-all duration-200 ${
        isOpen ? 'space-y-5' : 'hover:border-[#3498db]/50'
      }`}
    >
      <div
        onClick={onToggle}
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none ${
          isOpen ? 'border-b border-slate-200 dark:border-slate-800 pb-4' : ''
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-[#3498db] text-white shadow-md shadow-[#3498db]/30 shrink-0">
            <Barcode className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Escáner de Códigos de Barra
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selecciona el método de lectura para Punto de Venta y Registro de Inventario
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              isServerOnline
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isServerOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span>{isServerOnline ? 'Servicio Móvil Online' : 'Servicio Móvil Desconectado'}</span>
          </span>

          <button
            type="button"
            onClick={() => checkServerStatus()}
            disabled={isCheckingServer}
            title="Comprobar estado del servidor"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingServer ? 'animate-spin text-[#3498db]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onToggle}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
            title={isOpen ? 'Ocultar sección' : 'Expandir sección'}
          >
            <ChevronDown
              className={`w-5 h-5 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="space-y-5 animate-fadeIn">
          {/* Modo Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Opción 1: Pistola Físico */}
            <button
              type="button"
              onClick={() => setScannerMode('usb')}
              className={`p-4 rounded-2xl border text-left transition-all relative ${
                scannerMode === 'usb'
                  ? 'border-[#3498db] bg-blue-50/70 dark:bg-blue-950/30 ring-2 ring-[#3498db]/40 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
              }`}
            >
              {scannerMode === 'usb' && (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-[#3498db] text-white text-[10px] font-bold">
                  Activo
                </span>
              )}
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`p-2.5 rounded-xl ${
                    scannerMode === 'usb'
                      ? 'bg-[#3498db] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Barcode className="w-5 h-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Pistola / Escáner USB
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Emulación de teclado físico (HID)
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Lectura directa mediante cable USB o receptor inalámbrico 2.4GHz. No requiere red local ni WiFi.
              </p>
            </button>

            {/* Opción 2: Celular WiFi */}
            <button
              type="button"
              onClick={() => setScannerMode('web')}
              className={`p-4 rounded-2xl border text-left transition-all relative ${
                scannerMode === 'web'
                  ? 'border-[#3498db] bg-blue-50/70 dark:bg-blue-950/30 ring-2 ring-[#3498db]/40 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
              }`}
            >
              {scannerMode === 'web' && (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-[#3498db] text-white text-[10px] font-bold">
                  Activo
                </span>
              )}
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`p-2.5 rounded-xl ${
                    scannerMode === 'web'
                      ? 'bg-[#3498db] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Celular WiFi / Escáner Web
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Cámara de smartphone vinculada por QR
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Convierte cualquier teléfono móvil en pistola inalámbrica mediante lectura de cámara y conexión segura cifrada.
              </p>
            </button>
          </div>

          {/* Panel de Configuración cuando está seleccionado Celular WiFi */}
          {scannerMode === 'web' && (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-blue-200/80 dark:border-blue-900/40 space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Wifi className="w-4 h-4 text-[#3498db]" />
                  <span>Vincular Celular como Pistola de Códigos</span>
                </div>

                {/* Protocol Toggle (HTTPS vs HTTP) */}
                <div className="flex bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-bold self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setUseHttps(true)}
                    className={`px-3 py-1 rounded-md transition-all ${
                      useHttps
                        ? 'bg-[#3498db] text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    HTTPS (Puerto 5051)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseHttps(false)}
                    className={`px-3 py-1 rounded-md transition-all ${
                      !useHttps
                        ? 'bg-[#3498db] text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    HTTP (Puerto 5050)
                  </button>
                </div>
              </div>

              {!isServerOnline && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Servidor de Escáner Móvil no detectado</p>
                    <p className="text-[11px] text-rose-500/90 mt-0.5">
                      El servicio scanner-web no está respondiendo en el puerto 5050/5051. Asegúrate de iniciar el proceso con <code>node scanner-web/server.js</code>.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row items-center gap-5 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                {/* QR Code Container */}
                <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-200 shrink-0">
                  <QRCodeSVG
                    value={currentQrUrl}
                    size={140}
                    level="M"
                    includeMargin={false}
                  />
                </div>

                {/* Instructions & Link */}
                <div className="space-y-3 flex-1 text-xs">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      1. Escanea este código QR con la cámara de tu teléfono móvil
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Tanto la computadora como el teléfono deben estar conectados a la misma red WiFi o local.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      2. O abre esta dirección directamente en el navegador del teléfono:
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={currentQrUrl}
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-[11px] text-slate-700 dark:text-slate-300 select-all"
                      />
                      <button
                        type="button"
                        onClick={handleCopyUrl}
                        className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shrink-0 transition-colors"
                      >
                        {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedUrl ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                    <ShieldCheck className="w-4 h-4 text-[#3498db] shrink-0" />
                    <span>
                      Conexión segura activa: El QR incluye tu token de sesión para autenticar el dispositivo sin requerir contraseña.
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Scan Test Monitor */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Monitor de Lectura en Vivo:
                  </span>
                  {lastScan ? (
                    <span className="font-mono font-bold text-xs text-[#3498db] bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                      {lastScan.barcode}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      Esperando escaneos desde el celular...
                    </span>
                  )}
                </div>
                {lastScan && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(lastScan.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Panel de Prueba cuando está seleccionada la Pistola USB */}
          {scannerMode === 'usb' && (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Barcode className="w-4 h-4 text-[#3498db]" />
                  <span>Prueba de Lector Físico / USB</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  Dispara el lector para verificar la lectura
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  placeholder="Haz clic aquí y dispara tu pistola lectora de código de barras..."
                  value={usbTestInput}
                  onChange={(e) => setUsbTestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (usbTestInput.trim()) {
                        setUsbLastScanned(usbTestInput.trim());
                        setUsbTestInput('');
                      }
                    }
                  }}
                  leftIcon={<Barcode className="w-4 h-4 text-[#3498db]" />}
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (usbTestInput.trim()) {
                      setUsbLastScanned(usbTestInput.trim());
                      setUsbTestInput('');
                    }
                  }}
                  disabled={!usbTestInput.trim()}
                >
                  Probar
                </Button>
              </div>

              {usbLastScanned && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs animate-fadeIn">
                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Código de barras leído con éxito:</span>
                    <strong className="font-mono text-slate-900 dark:text-white px-2 py-0.5 rounded bg-emerald-500/20">
                      {usbLastScanned}
                    </strong>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
