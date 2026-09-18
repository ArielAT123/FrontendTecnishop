import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { api } from '../../api/client';
import { Producto } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { QRCodeSVG } from 'qrcode.react';
import {
  lookupProductByBarcode,
  playScannerBeep,
  sanitizeBarcode,
} from '../../services/productLookupService';
import { scannerSubject, BarcodeScanEvent } from '../../services/scannerObserver';
import {
  Package,
  PlusCircle,
  Search,
  Upload,
  AlertCircle,
  CheckCircle2,
  Tag,
  Hash,
  Barcode,
  Keyboard,
  Smartphone,
  Sparkles,
  Globe,
  Wifi,
  Copy,
  Check,
  RefreshCw,
  Zap,
  TrendingUp,
} from 'lucide-react';

export const ProductosPage: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Scanner & Mode State
  const [scanMode, setScanMode] = useState<'manual' | 'pistola' | 'celular'>('pistola');
  const [pistolaInput, setPistolaInput] = useState('');
  const [isSearchingWorldwide, setIsSearchingWorldwide] = useState(false);
  const [lookupFeedback, setLookupFeedback] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
    source?: string;
    imageUrl?: string;
  } | null>(null);

  // Mobile Scanner Server State
  const [serverUrl, setServerUrl] = useState('https://192.168.18.55:5051');
  const [httpUrl, setHttpUrl] = useState('http://192.168.18.55:5050');
  const [httpsUrl, setHttpsUrl] = useState('https://192.168.18.55:5051');
  const [useHttps, setUseHttps] = useState(true);
  const [isServerActive, setIsServerActive] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Producto>>({
    codigo: '',
    nombre: '',
    cantidad: 0,
    costo_compra: 0,
    precio_venta_sugerido: 0,
    precio_venta_recomendado: 0,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { data: productos = [], isLoading, isSyncing } = useCachedQuery<Producto[]>({
    queryKey: ['productos'],
    queryFn: api.getProductos,
    keyField: 'codigo',
  });

  // Check mobile scanner server info on mount or modal open
  useEffect(() => {
    if (!isModalOpen) return;

    fetch('http://localhost:5050/api/info')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.url) setHttpUrl(data.url);
          if (data.httpsUrl) setHttpsUrl(data.httpsUrl);
          setServerUrl(data.httpsUrl || data.url);
          setIsServerActive(true);
        }
      })
      .catch(() => {
        setIsServerActive(false);
      });
  }, [isModalOpen]);

  // PATRÓN DE DISEÑO OBSERVER: Suscribir este componente como Observador al ScannerSubject
  useEffect(() => {
    if (!isModalOpen) return;

    const unsubscribe = scannerSubject.subscribe({
      onBarcodeScanned: (event: BarcodeScanEvent) => {
        handleBarcodeReceived(event.barcode, 'celular');
      },
      onConnectionChange: (connected: boolean) => {
        setIsServerActive(connected);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [isModalOpen, productos]);

  // Handle Barcode Search & Auto-Fill
  const handleBarcodeReceived = async (code: string, sourceOrigin: 'pistola' | 'celular' | 'manual') => {
    const clean = sanitizeBarcode(code);
    if (!clean) return;

    playScannerBeep();
    setLastScannedCode(clean);
    setIsSearchingWorldwide(true);
    setLookupFeedback(null);
    setFormError(null);

    // Immediate fill of codigo field
    setFormData((prev) => ({ ...prev, codigo: clean }));

    try {
      const result = await lookupProductByBarcode(clean, productos);

      if (result.found && result.nombre) {
        setFormData((prev) => ({
          ...prev,
          codigo: clean,
          nombre: result.nombre,
          costo_compra: result.costo_compra ?? prev.costo_compra,
          precio_venta_sugerido: result.precio_venta_sugerido ?? prev.precio_venta_sugerido,
        }));

        let sourceLabel = 'Catálogo Mundial';
        if (result.source === 'upcdatabase') sourceLabel = 'UPC Database (API Oficial)';
        if (result.source === 'openproductsfacts') sourceLabel = 'Open Products Facts';
        if (result.source === 'openfoodfacts') sourceLabel = 'Open Food Facts';
        if (result.source === 'upcitemdb') sourceLabel = 'UPCitemdb';
        if (result.source === 'gs1_prefix') sourceLabel = `Registro GS1 (${result.marca || 'Fabricante'})`;
        if (result.source === 'local') sourceLabel = 'Inventario Local Tecnishop';

        setLookupFeedback({
          type: 'success',
          message: `Producto identificado: "${result.nombre}"`,
          source: sourceLabel,
          imageUrl: result.imagen_url,
        });
      } else {
        setLookupFeedback({
          type: 'info',
          message: `Código ${clean} detectado. No se encontró en catálogos mundiales; completa el nombre y precio para registrarlo.`,
        });
      }
    } catch (err) {
      setLookupFeedback({
        type: 'info',
        message: `Código ${clean} capturado correctamente. Ingresa los datos del producto.`,
      });
    } finally {
      setIsSearchingWorldwide(false);
      setPistolaInput('');
    }
  };

  // Keyboard listener for USB/Bluetooth barcode guns (typing rapid characters ending in Enter)
  useEffect(() => {
    if (!isModalOpen || scanMode !== 'pistola') return;

    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in regular inputs
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const activeId = document.activeElement?.id;
      if (activeTag === 'input' && activeId !== 'pistolaInput') {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 150) {
        buffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          e.preventDefault();
          handleBarcodeReceived(buffer, 'pistola');
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, scanMode, productos]);

  const createMutation = useMutation({
    mutationFn: api.createProducto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Error al guardar el producto');
    },
  });

  const excelMutation = useMutation({
    mutationFn: (file: File) => api.uploadExcel(file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      setUploadStatus({
        type: 'success',
        message: `Importación exitosa: ${data.productos_creados} creados, ${data.productos_actualizados} actualizados.`,
      });
    },
    onError: (err: any) => {
      setUploadStatus({
        type: 'error',
        message: err?.response?.data?.error || err.message || 'Error al procesar el archivo Excel',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      cantidad: 0,
      costo_compra: 0,
      precio_venta_sugerido: 0,
      precio_venta_recomendado: 0,
    });
    setFormError(null);
    setLookupFeedback(null);
    setLastScannedCode(null);
    setPistolaInput('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadStatus(null);
      excelMutation.mutate(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.codigo?.trim() || !formData.nombre?.trim()) {
      setFormError('El código y el nombre del producto son obligatorios');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(serverUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Profit margin calculation
  const costo = Number(formData.costo_compra) || 0;
  const pvp = Number(formData.precio_venta_sugerido) || 0;
  const ganancia = pvp > costo ? pvp - costo : 0;
  const margenPorcentaje = pvp > 0 ? ((ganancia / pvp) * 100).toFixed(1) : '0.0';

  const filteredProductos = productos.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.codigo?.toLowerCase().includes(term) ||
      p.nombre?.toLowerCase().includes(term) ||
      p.descripcion?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Header with Search and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Buscar por código o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls"
            className="hidden"
          />
          <Button
            variant="outline"
            leftIcon={<Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            onClick={() => fileInputRef.current?.click()}
            isLoading={excelMutation.isPending}
            className="border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
          >
            Importar Excel
          </Button>

          <Button
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="shadow-sm"
          >
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Upload Notification Banner */}
      {uploadStatus && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium animate-fadeIn ${
            uploadStatus.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {uploadStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{uploadStatus.message}</span>
          </div>
          <button
            onClick={() => setUploadStatus(null)}
            className="text-xs font-bold underline hover:opacity-80"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Products Table Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Inventario ({filteredProductos.length} artículos)</span>
            {isSyncing && (
              <span className="text-[10px] font-normal text-[#3498db] animate-pulse bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                Sincronizando en segundo plano...
              </span>
            )}
          </h3>
        </div>

        {isLoading && filteredProductos.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">Cargando inventario...</div>
        ) : filteredProductos.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            {searchTerm ? 'No se encontraron productos coincidentes.' : 'El catálogo está vacío.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="pb-3 pl-2">Código</th>
                  <th className="pb-3">Descripción / Artículo</th>
                  <th className="pb-3 text-center">Stock</th>
                  <th className="pb-3 text-right">Costo</th>
                  <th className="pb-3 text-right">PVP Sugerido</th>
                  <th className="pb-3 pr-2 text-right">PVP Recomendado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredProductos.map((prod) => (
                  <tr key={prod.id || prod.codigo} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 pl-2 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {prod.codigo}
                    </td>
                    <td className="py-3 text-slate-900 dark:text-slate-100 font-semibold">
                      {prod.nombre}
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          prod.cantidad > 5
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : prod.cantidad > 0
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                        }`}
                      >
                        {prod.cantidad} uds
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      ${Number(prod.costo_compra || 0).toFixed(2)}
                    </td>
                    <td className="py-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                      ${Number(prod.precio_venta_sugerido || 0).toFixed(2)}
                    </td>
                    <td className="py-3 pr-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ${Number(prod.precio_venta_recomendado || prod.precio_venta_sugerido || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Crear Producto - AMPLIADO A 2XL CON ACCIONABLE DE ESCÁNER */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Artículo en Inventario"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {/* ACCIONABLE PERSONALIZADO ARRIBA / ABAJO DEL TÍTULO: SELECTOR DE MODO DE ESCÁNER */}
          <div className="bg-slate-100 dark:bg-slate-800/70 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setScanMode('manual');
                setLookupFeedback(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                scanMode === 'manual'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              <span>Modo Manual</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setScanMode('pistola');
                setLookupFeedback(null);
                setTimeout(() => barcodeInputRef.current?.focus(), 100);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                scanMode === 'pistola'
                  ? 'bg-crimson-600 text-white shadow-md shadow-crimson-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Barcode className="w-4 h-4" />
              <span>Pistola Láser USB/BT</span>
              <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            <button
              type="button"
              onClick={() => {
                setScanMode('celular');
                setLookupFeedback(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                scanMode === 'celular'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Escanear con Celular</span>
            </button>
          </div>

          {/* PANEL SEGÚN EL MODO SELECCIONADO */}
          {scanMode === 'pistola' && (
            <div className="p-3.5 rounded-2xl bg-crimson-500/10 border border-crimson-500/30 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-crimson-600 dark:text-crimson-400 text-xs font-bold">
                  <Zap className="w-4 h-4 animate-bounce" />
                  <span>Escáner Láser Listo: Apunta la pistola al código de barras</span>
                </div>
                {isSearchingWorldwide && (
                  <span className="text-[11px] font-semibold text-crimson-600 dark:text-crimson-400 flex items-center gap-1.5 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Buscando en API mundial...
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="pistolaInput"
                    ref={barcodeInputRef}
                    placeholder="Escanea con la pistola o digita el código..."
                    value={pistolaInput}
                    onChange={(e) => setPistolaInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleBarcodeReceived(pistolaInput, 'pistola');
                      }
                    }}
                    leftIcon={<Barcode className="w-4 h-4 text-crimson-500" />}
                    autoFocus
                    className="font-mono text-sm border-crimson-500/30 focus:border-crimson-500"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => handleBarcodeReceived(pistolaInput, 'pistola')}
                  disabled={!pistolaInput.trim() || isSearchingWorldwide}
                  isLoading={isSearchingWorldwide}
                  className="bg-crimson-600 hover:bg-crimson-700 text-white font-bold text-xs shrink-0"
                >
                  <Globe className="w-4 h-4 mr-1.5" />
                  Consultar API
                </Button>
              </div>
            </div>
          )}

          {scanMode === 'celular' && (
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold">
                  <Wifi className="w-4 h-4 animate-pulse" />
                  <span>Conecta tu celular como pistola inalámbrica</span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono font-bold">
                  Puerto 5050 Activo
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-blue-500/20">
                {/* QR Code Container */}
                <div className="bg-white p-2.5 rounded-xl shadow-md shrink-0">
                  <QRCodeSVG value={serverUrl} size={110} level="M" />
                </div>

                <div className="space-y-2 text-xs flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      type="button"
                      onClick={() => {
                        setUseHttps(true);
                        setServerUrl(httpsUrl);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        useHttps
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      🔒 HTTPS (5051)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUseHttps(false);
                        setServerUrl(httpUrl);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        !useHttps
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      🌐 HTTP (5050)
                    </button>
                    <span className="text-[10px] text-slate-400 italic">
                      {useHttps ? 'Permite cámara en Chrome/Safari' : 'Sin certificado'}
                    </span>
                  </div>

                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    1. Escanea este código QR con la cámara de tu teléfono móvil.
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    2. O abre esta dirección en el navegador de tu celular (misma red WiFi):
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-blue-600 dark:text-blue-400 font-mono font-bold text-xs select-all">
                      {serverUrl}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1"
                      title="Copiar enlace"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {lastScannedCode && (
                    <div className="pt-1 text-[11px] text-emerald-500 font-mono font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Último escaneo recibido del celular: {lastScannedCode}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* LOOKUP FEEDBACK BANNER */}
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
                onClick={() => setLookupFeedback(null)}
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

          {/* FORMULARIO DE REGISTRO EN DOS SECCIONES AMPLIAS */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* SECCIÓN 1: IDENTIFICACIÓN DEL PRODUCTO */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>Identificación del Artículo</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Código de Barras *
                  </label>
                  <Input
                    placeholder="Ej: 7861024600018"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    leftIcon={<Hash className="w-4 h-4" />}
                    className="font-mono"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Nombre / Descripción del Artículo *
                  </label>
                  <Input
                    placeholder="Ej: Memoria RAM Kingston Fury 8GB DDR4 3200MHz"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    leftIcon={<Tag className="w-4 h-4" />}
                    required
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: CONTROL DE PRECIOS Y STOCK */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Control de Inventario y Precios</span>
                </h4>

                {pvp > 0 && costo > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold">
                    <span>Margen: +{margenPorcentaje}%</span>
                    <span>(+${ganancia.toFixed(2)})</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Stock Inicial (Uds)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.cantidad}
                    onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Costo Compra ($)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.costo_compra}
                    onChange={(e) => setFormData({ ...formData, costo_compra: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    PVP Venta Sugerido ($) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.precio_venta_sugerido}
                    onChange={(e) => setFormData({ ...formData, precio_venta_sugerido: parseFloat(e.target.value) || 0 })}
                    className="font-bold text-emerald-600 dark:text-emerald-400"
                    required
                  />
                </div>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={createMutation.isPending}
                className="px-6 shadow-sm"
              >
                Guardar Artículo
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

