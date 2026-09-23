import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useWhatsAppStatus } from '../../context/WhatsAppStatusContext';
import { WhatsAppIcon } from '../common/WhatsAppIcon';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CheckCircle2, AlertCircle, RefreshCw, ChevronDown } from 'lucide-react';

export interface ConfigWhatsAppSectionProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const ConfigWhatsAppSection: React.FC<ConfigWhatsAppSectionProps> = ({
  isOpen,
  onToggle,
}) => {
  const {
    isConnected,
    isChecking,
    qrData,
    isLoadingQr,
    checkStatus,
    fetchQrCode,
    disconnectWhatsApp,
  } = useWhatsAppStatus();

  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    if (!isConnected && !qrData && !isLoadingQr) {
      fetchQrCode();
    }
  }, [isConnected, qrData, isLoadingQr, fetchQrCode]);

  // Auto-refresh QR code every 18 seconds to ensure WhatsApp never receives an expired QR
  useEffect(() => {
    if (isConnected) return;
    const interval = setInterval(() => {
      fetchQrCode();
    }, 18000);
    return () => clearInterval(interval);
  }, [isConnected, fetchQrCode]);

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    await disconnectWhatsApp();
    setIsDisconnecting(false);
  };

  return (
    <Card
      id="whatsapp-config"
      className={`p-6 border-2 border-emerald-500/30 dark:border-emerald-500/30 shadow-md scroll-mt-6 transition-all duration-300 ${
        isOpen ? 'space-y-4' : 'hover:border-emerald-500/50'
      }`}
    >
      <div
        onClick={onToggle}
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none ${
          isOpen ? 'border-b border-slate-200 dark:border-slate-800 pb-4' : ''
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/30 shrink-0">
            <WhatsAppIcon className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              WhatsApp
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isConnected
                ? 'Conexión activa con Evolution API'
                : 'Escanear para establecer conexión con WhatsApp'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              checkStatus();
              if (!isConnected) fetchQrCode();
            }}
            disabled={isChecking || isLoadingQr}
            title="Actualizar estado de conexión"
            className="p-2 h-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking || isLoadingQr ? 'animate-spin' : ''}`} />
          </Button>

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
        <div className="space-y-4 animate-fadeIn">
          {isConnected ? (
            <div className="p-5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    WhatsApp conectado y listo
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Listo para enviar comprobantes de facturación, órdenes de servicio e informes técnicos.
                  </p>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/30 shrink-0"
              >
                {isDisconnecting ? 'Desconectando...' : 'Desconectar'}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Escanear para establecer conexión con WhatsApp
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Abre WhatsApp en tu teléfono &gt; Dispositivos vinculados &gt; Vincular un dispositivo
                </p>
              </div>

              {/* QR Container */}
              <div className="relative p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-lg flex flex-col items-center justify-center min-w-[240px] min-h-[240px]">
                {isLoadingQr ? (
                  <div className="flex flex-col items-center justify-center gap-2 p-8 text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                    <span className="text-xs font-medium">Generando código QR...</span>
                  </div>
                ) : qrData?.base64 ? (
                  <img
                    src={qrData.base64.startsWith('data:') ? qrData.base64 : `data:image/png;base64,${qrData.base64}`}
                    alt="QR WhatsApp"
                    className="w-56 h-56 object-contain rounded-lg"
                  />
                ) : qrData?.code ? (
                  <div className="p-2 bg-white rounded-lg">
                    <QRCodeSVG value={qrData.code} size={210} level="M" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
                    <AlertCircle className="w-8 h-8 text-amber-500" />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {qrData?.error || 'No se pudo obtener el código QR'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Verifica que el servicio Evolution API esté activo en el puerto 8080.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fetchQrCode()}
                      className="text-xs gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Reintentar
                    </Button>
                  </div>
                )}
              </div>

              {/* Refresh QR button */}
              {(qrData?.base64 || qrData?.code) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchQrCode()}
                  disabled={isLoadingQr}
                  className="text-xs text-slate-600 dark:text-slate-300 gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQr ? 'animate-spin' : ''}`} />
                  Actualizar código QR
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
