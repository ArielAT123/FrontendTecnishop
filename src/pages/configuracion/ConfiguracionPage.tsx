import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useScannerConfig } from '../../context/ScannerContext';
import { useWhatsAppStatus } from '../../context/WhatsAppStatusContext';
import { WhatsAppIcon } from '../../components/common/WhatsAppIcon';
import { TemplateConfigSection } from '../../components/configuracion/TemplateConfigSection';
import { QRCodeSVG } from 'qrcode.react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  Barcode,
  Smartphone,
  Wifi,
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Palette,
  ExternalLink,
  Mail,
  Send,
  Eye,
  EyeOff,
  ChevronDown,
} from 'lucide-react';

export const ConfiguracionPage: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    scannerMode,
    setScannerMode,
    isServerOnline,
    isCheckingServer,
    serverInfo,
    checkServerStatus,
    getQrUrl,
    lastScan,
  } = useScannerConfig();

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

  // Collapsible sections state (default hidden for cleaner UI)
  const [openSections, setOpenSections] = useState({
    barcode: false,
    whatsapp: false,
    templates: false,
    email: false,
    taller: false,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (window.location.hash === '#whatsapp-config') {
      setOpenSections((prev) => ({ ...prev, whatsapp: true }));
    }
  }, []);

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

  // Email / SMTP Configuration State
  const [emailConfig, setEmailConfig] = useState({
    enabled: false,
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    from: 'Tecnishop <no-reply@tecnishop.com>',
    hasPassword: false,
  });
  const [isLoadingEmailConfig, setIsLoadingEmailConfig] = useState(false);
  const [isSavingEmailConfig, setIsSavingEmailConfig] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [emailFeedback, setEmailFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchEmailConfig = async () => {
    setIsLoadingEmailConfig(true);
    try {
      const res = await fetch('http://localhost:5052/api/v1/config/email');
      if (res.ok) {
        const data = await res.json();
        setEmailConfig({
          enabled: Boolean(data.enabled),
          host: data.host || 'smtp.gmail.com',
          port: data.port || 587,
          secure: Boolean(data.secure),
          user: data.user || '',
          pass: '',
          from: data.from || 'Tecnishop <no-reply@tecnishop.com>',
          hasPassword: Boolean(data.hasPassword),
        });
      }
    } catch {
      // Ignored
    } finally {
      setIsLoadingEmailConfig(false);
    }
  };

  useEffect(() => {
    fetchEmailConfig();
  }, []);

  const handleSaveEmailConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEmailConfig(true);
    setEmailFeedback(null);
    try {
      const res = await fetch('http://localhost:5052/api/v1/config/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailConfig),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailFeedback({ type: 'success', message: 'Configuración de correo guardada exitosamente.' });
        if (emailConfig.pass) {
          setEmailConfig((prev) => ({ ...prev, pass: '', hasPassword: true }));
        }
      } else {
        setEmailFeedback({ type: 'error', message: data.error || 'Error al guardar la configuración.' });
      }
    } catch (err: any) {
      setEmailFeedback({ type: 'error', message: `No se pudo conectar con el servidor: ${err.message}` });
    } finally {
      setIsSavingEmailConfig(false);
      setTimeout(() => setEmailFeedback(null), 6000);
    }
  };

  const handleTestEmailConnection = async () => {
    setIsTestingEmail(true);
    setEmailFeedback(null);
    try {
      const res = await fetch('http://localhost:5052/api/v1/config/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...emailConfig,
          testRecipient: testEmailRecipient.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailFeedback({ type: 'success', message: data.message || 'Conexión SMTP exitosa.' });
      } else {
        setEmailFeedback({ type: 'error', message: data.error || 'Falló la prueba SMTP.' });
      }
    } catch (err: any) {
      setEmailFeedback({ type: 'error', message: `Error de conexión: ${err.message}` });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const [useHttps, setUseHttps] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [usbTestInput, setUsbTestInput] = useState('');
  const [usbLastScanned, setUsbLastScanned] = useState<string | null>(null);

  const [tallerName, setTallerName] = useState(
    () => localStorage.getItem('taller_name') || 'Tecnishop Soluciones Tecnológicas'
  );
  const [tallerPhone, setTallerPhone] = useState(
    () => localStorage.getItem('taller_phone') || '0991234567'
  );
  const [tallerAddress, setTallerAddress] = useState(
    () => localStorage.getItem('taller_address') || 'Av. Principal #123, Guayaquil, Ecuador'
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveTaller = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('taller_name', tallerName);
    localStorage.setItem('taller_phone', tallerPhone);
    localStorage.setItem('taller_address', tallerAddress);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const currentQrUrl = getQrUrl(useHttps);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentQrUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn select-none">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Configuración del Sistema</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Personaliza los datos del taller, escáner de códigos de barras y aspecto visual
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Configuración guardada exitosamente.</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* CONFIGURACIÓN DEL ESCÁNER DE CÓDIGOS DE BARRA */}
      {/* ========================================================= */}
      <Card
        className={`p-6 border-2 border-[#3498db]/30 dark:border-[#3498db]/30 shadow-md transition-all duration-200 ${
          openSections.barcode ? 'space-y-5' : 'hover:border-[#3498db]/50'
        }`}
      >
        <div
          onClick={() => toggleSection('barcode')}
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none ${
            openSections.barcode ? 'border-b border-slate-200 dark:border-slate-800 pb-4' : ''
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
              onClick={() => toggleSection('barcode')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
              title={openSections.barcode ? 'Ocultar sección' : 'Expandir sección'}
            >
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-200 ${
                  openSections.barcode ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {openSections.barcode && (
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

      {/* ========================================================= */}
      {/* CONFIGURACIÓN DE WHATSAPP (EVOLUTION API) */}
      {/* ========================================================= */}
      <Card
        id="whatsapp-config"
        className={`p-6 border-2 border-emerald-500/30 dark:border-emerald-500/30 shadow-md scroll-mt-6 transition-all duration-300 ${
          openSections.whatsapp ? 'space-y-4' : 'hover:border-emerald-500/50'
        }`}
      >
        <div
          onClick={() => toggleSection('whatsapp')}
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none ${
            openSections.whatsapp ? 'border-b border-slate-200 dark:border-slate-800 pb-4' : ''
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
              onClick={() => toggleSection('whatsapp')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
              title={openSections.whatsapp ? 'Ocultar sección' : 'Expandir sección'}
            >
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-200 ${
                  openSections.whatsapp ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {openSections.whatsapp && (
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

      {/* ========================================================= */}
      {/* GESTIÓN DE PLANTILLAS DE MENSAJES (WHATSAPP & CORREO)     */}
      {/* ========================================================= */}
      <TemplateConfigSection
        isOpen={openSections.templates}
        onToggle={() => toggleSection('templates')}
      />

      {/* ========================================================= */}
      {/* CONFIGURACIÓN DE CORREO ELECTRÓNICO (SMTP) */}
      {/* ========================================================= */}
      <Card
        className={`p-6 border-2 border-sky-500/30 dark:border-sky-500/30 shadow-md transition-all duration-200 ${
          openSections.email ? 'space-y-5' : 'hover:border-sky-500/50'
        }`}
      >
        <div
          onClick={() => toggleSection('email')}
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none ${
            openSections.email ? 'border-b border-slate-200 dark:border-slate-800 pb-4' : ''
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-sky-500 text-white shadow-md shadow-sky-500/30 shrink-0">
              <Mail className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Correo Electrónico (SMTP)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Envío de facturas, órdenes de servicio e informes técnicos a las casillas de clientes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                emailConfig.enabled
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  emailConfig.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              {emailConfig.enabled ? 'Canal Activo' : 'Canal Desactivado'}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchEmailConfig}
              disabled={isLoadingEmailConfig}
              title="Recargar configuración de correo"
              className="p-2 h-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEmailConfig ? 'animate-spin' : ''}`} />
            </Button>

            <button
              type="button"
              onClick={() => toggleSection('email')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
              title={openSections.email ? 'Ocultar sección' : 'Expandir sección'}
            >
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-200 ${
                  openSections.email ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {openSections.email && (
          <div className="space-y-4 pt-1 animate-fadeIn">
            {/* Feedback Alert */}
            {emailFeedback && (
              <div
                className={`p-4 rounded-xl flex items-center gap-2 text-xs font-semibold animate-fadeIn ${
                  emailFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400'
                }`}
              >
                {emailFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{emailFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSaveEmailConfig} className="space-y-4">
              {/* Toggle Enable Channel */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div>
                  <label htmlFor="email-channel-enabled" className="text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                    Habilitar canal de correo electrónico
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Al activar esta opción, los clientes que tengan email registrado podrán recibir sus comprobantes por correo.
                  </p>
                </div>
                <input
                  id="email-channel-enabled"
                  type="checkbox"
                  checked={emailConfig.enabled}
                  onChange={(e) => setEmailConfig({ ...emailConfig, enabled: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Host */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Servidor SMTP (Host)
                  </label>
                  <Input
                    value={emailConfig.host}
                    onChange={(e) => setEmailConfig({ ...emailConfig, host: e.target.value })}
                    placeholder="smtp.gmail.com"
                    required={emailConfig.enabled}
                  />
                </div>

                {/* Port */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Puerto
                  </label>
                  <Input
                    type="number"
                    value={emailConfig.port}
                    onChange={(e) => setEmailConfig({ ...emailConfig, port: parseInt(e.target.value, 10) || 587 })}
                    placeholder="587"
                    required={emailConfig.enabled}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* User / Email */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Usuario / Correo Electrónico
                  </label>
                  <Input
                    type="email"
                    value={emailConfig.user}
                    onChange={(e) => setEmailConfig({ ...emailConfig, user: e.target.value })}
                    placeholder="notificaciones@tecnishop.com"
                    required={emailConfig.enabled}
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Contraseña o Token de Aplicación
                    </label>
                    {emailConfig.hasPassword && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        (Configurada)
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      type={showEmailPassword ? 'text' : 'password'}
                      value={emailConfig.pass}
                      onChange={(e) => setEmailConfig({ ...emailConfig, pass: e.target.value })}
                      placeholder={emailConfig.hasPassword ? '•••••••••••• (Conservar actual)' : 'Ingresar contraseña'}
                      required={emailConfig.enabled && !emailConfig.hasPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmailPassword(!showEmailPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showEmailPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* From Header */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Nombre de Remitente (From)
                  </label>
                  <Input
                    value={emailConfig.from}
                    onChange={(e) => setEmailConfig({ ...emailConfig, from: e.target.value })}
                    placeholder='Tecnishop <no-reply@tecnishop.com>'
                  />
                </div>

                {/* Security */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Seguridad de Conexión
                  </label>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="smtp_security"
                        checked={!emailConfig.secure}
                        onChange={() => setEmailConfig({ ...emailConfig, secure: false, port: 587 })}
                        className="text-sky-600 focus:ring-sky-500"
                      />
                      <span>STARTTLS (Recomendado, Puerto 587)</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="smtp_security"
                        checked={emailConfig.secure}
                        onChange={() => setEmailConfig({ ...emailConfig, secure: true, port: 465 })}
                        className="text-sky-600 focus:ring-sky-500"
                      />
                      <span>SSL / TLS (Puerto 465)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Test & Save Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <Input
                    type="email"
                    value={testEmailRecipient}
                    onChange={(e) => setTestEmailRecipient(e.target.value)}
                    placeholder="Enviar prueba a (opcional)..."
                    className="text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTestEmailConnection}
                    disabled={isTestingEmail || (!emailConfig.user && !emailConfig.host)}
                    className="text-xs shrink-0 gap-1.5"
                  >
                    <Send className={`w-3.5 h-3.5 ${isTestingEmail ? 'animate-spin' : ''}`} />
                    {isTestingEmail ? 'Probando...' : 'Probar Conexión'}
                  </Button>
                </div>

                <Button
                  type="submit"
                  disabled={isSavingEmailConfig}
                  className="bg-sky-600 hover:bg-sky-700 text-white text-xs gap-1.5 shrink-0 shadow-md shadow-sky-600/20"
                >
                  <Check className="w-4 h-4" />
                  {isSavingEmailConfig ? 'Guardando...' : 'Guardar Configuración de Correo'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </Card>

      {/* Datos del Taller */}
      <Card
        className={`p-6 transition-all duration-200 ${
          openSections.taller ? 'space-y-4' : 'hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        <div
          onClick={() => toggleSection('taller')}
          className={`flex items-center justify-between gap-3 cursor-pointer select-none ${
            openSections.taller ? 'border-b border-slate-200 dark:border-slate-800 pb-4' : ''
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#3498db] dark:text-[#3498db] shadow-sm shrink-0">
              <Building className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Datos del Taller (Impresión en Comprobantes)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nombre comercial, teléfono y dirección del local impresos en los comprobantes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => toggleSection('taller')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={openSections.taller ? 'Ocultar sección' : 'Expandir sección'}
            >
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-200 ${
                  openSections.taller ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {openSections.taller && (
          <form onSubmit={handleSaveTaller} className="space-y-4 pt-1 animate-fadeIn">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Nombre Comercial
              </label>
              <Input
                value={tallerName}
                onChange={(e) => setTallerName(e.target.value)}
                placeholder="Tecnishop"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Teléfono de Contacto
                </label>
                <Input
                  value={tallerPhone}
                  onChange={(e) => setTallerPhone(e.target.value)}
                  placeholder="0991234567"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Dirección / Sucursal
                </label>
                <Input
                  value={tallerAddress}
                  onChange={(e) => setTallerAddress(e.target.value)}
                  placeholder="Dirección del local"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit">Guardar Datos del Taller</Button>
            </div>
          </form>
        )}
      </Card>

      {/* Preferencias de Interfaz */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Apariencia y Tema
          </h3>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Modo Oscuro / Modo Claro
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Actualmente activo: <span className="font-bold uppercase">{theme}</span>
            </p>
          </div>
          <Button variant="secondary" onClick={toggleTheme}>
            Alternar a {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
          </Button>
        </div>
      </Card>

      {/* Sesión Actual */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Sesión y Seguridad
          </h3>
        </div>

        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
          <p>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Usuario Activo:</span>{' '}
            {user?.username} ({user?.email || 'Sin correo asociado'})
          </p>
          <p>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Rol:</span>{' '}
            {user?.is_superuser ? 'Super Administrador' : user?.is_staff ? 'Personal Técnico' : 'Operador'}
          </p>
          <p>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Renovación de Token:</span>{' '}
            Automática y transparente mediante interceptores de refresco JWT SimpleJWT.
          </p>
        </div>
      </Card>
    </div>
  );
};
