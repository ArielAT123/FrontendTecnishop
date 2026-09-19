import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { api } from '../../api/client';
import { Producto } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useScannerConfig } from '../../context/ScannerContext';
import {
  lookupProductByBarcode,
  playScannerBeep,
  sanitizeBarcode,
} from '../../services/productLookupService';
import { getProductPrice } from '../../utils/productUtils';
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
  RefreshCw,
  Zap,
  TrendingUp,
  Clock,
  Wrench,
  Settings,
} from 'lucide-react';

export interface ProductosPageProps {
  activeTipo?: 'PRODUCTO' | 'SERVICIO';
  onNavigate?: (section: any) => void;
}

export const ProductosPage: React.FC<ProductosPageProps> = ({
  activeTipo = 'PRODUCTO',
  onNavigate,
}) => {
  const queryClient = useQueryClient();
  const isService = activeTipo === 'SERVICIO';
  const { scannerMode: globalScannerMode, isServerOnline } = useScannerConfig();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Scanner & Mode State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [scanMode, setScanMode] = useState<'manual' | 'pistola'>('manual');
  const [pistolaInput, setPistolaInput] = useState('');
  const [isSearchingWorldwide, setIsSearchingWorldwide] = useState(false);
  const [lookupFeedback, setLookupFeedback] = useState<{
    found?: boolean;
    type?: 'success' | 'info' | 'error';
    source?: string;
    productName?: string;
    message?: string;
    imageUrl?: string;
  } | null>(null);

  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Producto>>({
    codigo: '',
    nombre: '',
    cantidad: isService ? 9999 : 0,
    costo_compra: 0,
    precio_venta_sugerido: 0,
    precio_venta_recomendado: 0,
    impuesto: 15,
    tipo: activeTipo,
    tiempo_estimado_minutos: isService ? 60 : 0,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { data: productos = [], isLoading, isSyncing } = useCachedQuery<Producto[]>({
    queryKey: ['productos'],
    queryFn: api.getProductos,
    keyField: 'codigo',
  });

  // PATRÓN DE DISEÑO OBSERVER: Suscribir este componente como Observador al ScannerSubject
  useEffect(() => {
    if (!isModalOpen) return;

    const unsubscribe = scannerSubject.subscribe({
      onBarcodeScanned: (event: BarcodeScanEvent) => {
        handleBarcodeReceived(event.barcode, 'celular');
      },
    });

    return () => {
      unsubscribe();
    };
  }, [isModalOpen, productos]);

  // Handle Barcode Search & Auto-Fillll
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
        setFormData((prev) => {
          const resolvedPvp = result.precio_venta_sugerido ?? prev.precio_venta_sugerido ?? 0;
          return {
            ...prev,
            codigo: clean,
            nombre: result.nombre,
            costo_compra: result.costo_compra ?? prev.costo_compra,
            precio_venta_sugerido: resolvedPvp,
            precio_venta_recomendado: resolvedPvp,
          };
        });

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
      const respData = err?.response?.data;
      let msg = 'Error al guardar el producto';
      if (respData && typeof respData === 'object') {
        const errors = Object.entries(respData)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join(' | ');
        if (errors) msg = errors;
      } else if (err.message) {
        msg = err.message;
      }
      setFormError(msg);
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

  const formatMinutes = (minutes?: number) => {
    const m = Number(minutes) || 0;
    if (m <= 0) return 'Inmediato';
    const hrs = Math.floor(m / 60);
    const rem = m % 60;
    if (hrs > 0 && rem > 0) return `${hrs}h ${rem}m (${m} min)`;
    if (hrs > 0) return `${hrs}h (${m} min)`;
    return `${m} min`;
  };

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      cantidad: isService ? 9999 : 0,
      costo_compra: 0,
      precio_venta_sugerido: 0,
      precio_venta_recomendado: 0,
      impuesto: 15,
      tipo: activeTipo,
      tiempo_estimado_minutos: isService ? 60 : 0,
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
      setFormError(`El código y el nombre del ${isService ? 'servicio' : 'producto'} son obligatorios`);
      return;
    }
    const pvp = Number(formData.precio_venta_sugerido || formData.precio_venta_recomendado || 0);
    createMutation.mutate({
      ...formData,
      tipo: activeTipo,
      cantidad: isService ? 9999 : formData.cantidad,
      precio_venta_sugerido: pvp,
      precio_venta_recomendado: pvp,
    });
  };

  // Profit margin calculation
  const costo = Number(formData.costo_compra) || 0;
  const pvp = Number(formData.precio_venta_sugerido) || 0;
  const ganancia = pvp > costo ? pvp - costo : 0;
  const margenPorcentaje = pvp > 0 ? ((ganancia / pvp) * 100).toFixed(1) : '0.0';

  const filteredProductos = productos.filter((p) => {
    const itemTipo = p.tipo || 'PRODUCTO';
    if (isService && itemTipo !== 'SERVICIO') return false;
    if (!isService && itemTipo === 'SERVICIO') return false;

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
            placeholder={`Buscar ${isService ? 'servicio por nombre o código' : 'producto por código o nombre'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-3">
          {!isService && (
            <>
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
            </>
          )}

          <Button
            leftIcon={isService ? <Wrench className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="shadow-sm"
          >
            {isService ? 'Nuevo Servicio' : 'Nuevo Producto'}
          </Button>
        </div>
      </div>

      {/* Scanner Offline Alert Banner */}
      {!isService && globalScannerMode === 'web' && !isServerOnline && (
        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-fadeIn">
          <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="font-bold">Sin conexión con el escáner web</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                El escáner de códigos de barra está configurado en modo WiFi/Web pero el servicio no responde.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigate?.('configuracion')}
            className="text-xs font-bold border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 shrink-0 flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configurar Escáner</span>
          </Button>
        </div>
      )}

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
          {isService ? (
            <Clock className="w-5 h-5 text-amber-500" />
          ) : (
            <Package className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          )}
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>
              {isService ? 'Servicios de Taller & Mano de Obra' : 'Inventario de Repuestos'} ({filteredProductos.length}{' '}
              {isService ? 'servicios' : 'artículos'})
            </span>
            {isSyncing && (
              <span className="text-[10px] font-normal text-[#3498db] animate-pulse bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                Sincronizando en segundo plano...
              </span>
            )}
          </h3>
        </div>

        {isLoading && filteredProductos.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            {isService ? 'Cargando servicios técnicos...' : 'Cargando inventario...'}
          </div>
        ) : filteredProductos.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            {searchTerm
              ? `No se encontraron ${isService ? 'servicios' : 'productos'} coincidentes.`
              : `No hay ${isService ? 'servicios de taller' : 'productos'} registrados aún.`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="pb-3 pl-2">Código</th>
                  <th className="pb-3">{isService ? 'Servicio / Mano de Obra' : 'Descripción / Artículo'}</th>
                  <th className="pb-3 text-center">{isService ? 'Tiempo Estimado' : 'Stock'}</th>
                  <th className="pb-3 text-right">{isService ? 'Costo Mano de Obra' : 'Costo'}</th>
                  <th className="pb-3 pr-2 text-right">{isService ? 'Tarifa al Cliente' : 'PVP (Precio de Venta)'}</th>
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
                      {prod.descripcion && (
                        <span className="block text-[11px] font-normal text-slate-500 dark:text-slate-400 line-clamp-1">
                          {prod.descripcion}
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {isService ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <Clock className="w-3.5 h-3.5" />
                          {formatMinutes(prod.tiempo_estimado_minutos)}
                        </span>
                      ) : (
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
                      )}
                    </td>
                    <td className="py-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      ${Number(prod.costo_compra || 0).toFixed(2)}
                    </td>
                    <td className="py-3 pr-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ${getProductPrice(prod).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Crear Producto / Servicio - AMPLIADO A 2XL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isService ? 'Registrar Servicio de Taller / Mano de Obra' : 'Registrar Artículo en Inventario'}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {/* ACCIONABLE PERSONALIZADO ARRIBA / ABAJO DEL TÍTULO: SELECTOR DE MODO DE ESCÁNER */}
          {!isService && (
            <div className="bg-slate-100 dark:bg-slate-800/70 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setScanMode('manual');
                  setLookupFeedback(null);
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
                  setLookupFeedback(null);
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

          {/* ALERTA DE CONEXIÓN ESCÁNER WEB SI NO ESTÁ ONLINE */}
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
                  setIsModalOpen(false);
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
                      handleBarcodeReceived(pistolaInput, 'pistola');
                    }
                  }}
                  leftIcon={<Barcode className="w-4 h-4 text-[#3498db]" />}
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  onClick={() => handleBarcodeReceived(pistolaInput, 'pistola')}
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
            {/* SECCIÓN 1: IDENTIFICACIÓN DEL PRODUCTO / SERVICIO */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>{isService ? 'Identificación del Servicio' : 'Identificación del Artículo'}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    {isService ? 'Código de Servicio *' : 'Código de Barras *'}
                  </label>
                  <Input
                    placeholder={isService ? 'Ej: SERV-MANT' : 'Ej: 7861024600018'}
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    leftIcon={<Hash className="w-4 h-4" />}
                    className="font-mono"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    {isService ? 'Nombre del Servicio Técnico *' : 'Nombre / Descripción del Artículo *'}
                  </label>
                  <Input
                    placeholder={
                      isService
                        ? 'Ej: Mantenimiento Preventivo y Limpieza de Pasta Térmica'
                        : 'Ej: Memoria RAM Kingston Fury 8GB DDR4 3200MHz'
                    }
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    leftIcon={isService ? <Wrench className="w-4 h-4 text-amber-500" /> : <Tag className="w-4 h-4" />}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Descripción Detallada {isService ? '(Qué incluye el servicio)' : '(Opcional)'}
                </label>
                <textarea
                  rows={2}
                  placeholder={
                    isService
                      ? 'Describe el procedimiento, garantía y alcances técnicos del servicio...'
                      : 'Especificaciones adicionales del repuesto...'
                  }
                  value={formData.descripcion || ''}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* SECCIÓN 2: CONTROL DE PRECIOS, TIEMPO O STOCK */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{isService ? 'Tarifas y Duración Estimada' : 'Control de Inventario y Precios'}</span>
                </h4>

                {pvp > 0 && costo > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold">
                    <span>Margen: +{margenPorcentaje}%</span>
                    <span>(+${ganancia.toFixed(2)})</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {isService ? (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>Tiempo Estimado *</span>
                      <span className="text-amber-500 font-mono font-bold">
                        {formatMinutes(formData.tiempo_estimado_minutos)}
                      </span>
                    </label>
                    <Input
                      type="number"
                      min="5"
                      step="5"
                      placeholder="60"
                      value={formData.tiempo_estimado_minutos || 60}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tiempo_estimado_minutos: parseInt(e.target.value) || 0,
                        })
                      }
                      leftIcon={<Clock className="w-4 h-4 text-amber-500" />}
                      required
                    />
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {[30, 45, 60, 90, 120].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setFormData({ ...formData, tiempo_estimado_minutos: mins })}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition-all ${
                            formData.tiempo_estimado_minutos === mins
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'bg-slate-200 dark:bg-slate-750 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                          }`}
                        >
                          {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
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
                )}

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    {isService ? 'Costo Insumos / Base ($)' : 'Costo Compra ($)'}
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
                    {isService ? 'Tarifa al Cliente ($) *' : 'Precio de Venta al Público (PVP) ($) *'}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.precio_venta_sugerido}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setFormData({
                        ...formData,
                        precio_venta_sugerido: val,
                        precio_venta_recomendado: val,
                      });
                    }}
                    className="font-bold text-emerald-600 dark:text-emerald-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Tarifa de IVA (%)
                  </label>
                  <select
                    value={formData.impuesto !== undefined && formData.impuesto !== null ? String(formData.impuesto) : '15'}
                    onChange={(e) => setFormData({ ...formData, impuesto: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs py-2 px-3 font-semibold focus:outline-none focus:ring-2 focus:ring-[#3498db]/40 shadow-sm"
                  >
                    <option value="15">15% (Tarifa General)</option>
                    <option value="0">0% (Tarifa 0% / Exento)</option>
                    <option value="5">5% (Materiales)</option>
                    <option value="8">8% (Turismo)</option>
                  </select>
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
                {isService ? 'Guardar Servicio' : 'Guardar Artículo'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

