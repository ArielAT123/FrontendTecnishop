import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { api } from '../../api/client';
import { Producto, Proveedor } from '../../types';
import { useScannerConfig } from '../../context/ScannerContext';
import {
  lookupProductByBarcode,
  playScannerBeep,
  sanitizeBarcode,
} from '../../services/productLookupService';
import { scannerSubject, BarcodeScanEvent } from '../../services/scannerObserver';

export interface UseProductosLogicProps {
  activeTipo?: 'PRODUCTO' | 'SERVICIO';
  onNavigate?: (section: any) => void;
}

export const useProductosLogic = ({
  activeTipo = 'PRODUCTO',
  onNavigate,
}: UseProductosLogicProps) => {
  const queryClient = useQueryClient();
  const isService = activeTipo === 'SERVICIO';
  const { scannerMode: globalScannerMode, isServerOnline } = useScannerConfig();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProveedoresModalOpen, setIsProveedoresModalOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem('catalogo_admin_unlocked') === 'true';
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
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
    proveedor: '',
    es_chequeo: false,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { data: productos = [], isLoading, isSyncing } = useCachedQuery<Producto[]>({
    queryKey: ['productos'],
    queryFn: api.getProductos,
    keyField: 'codigo',
  });

  const { data: proveedores = [] } = useCachedQuery<Proveedor[]>({
    queryKey: ['proveedores'],
    queryFn: api.getProveedores,
    keyField: 'id',
  });

  // Handle Barcode Search & Auto-Fill
  const handleBarcodeReceived = async (code: string, _sourceOrigin: 'pistola' | 'celular' | 'manual') => {
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
    } catch {
      setLookupFeedback({
        type: 'info',
        message: `Código ${clean} capturado correctamente. Ingresa los datos del producto.`,
      });
    } finally {
      setIsSearchingWorldwide(false);
      setPistolaInput('');
    }
  };

  // Observer Pattern: Subscribe to ScannerSubject
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

  // Keyboard listener for USB barcode scanners
  useEffect(() => {
    if (!isModalOpen || scanMode !== 'pistola') return;

    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
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
      proveedor: '',
      es_chequeo: false,
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
    const pvpValue = Number(formData.precio_venta_sugerido || formData.precio_venta_recomendado || 0);
    createMutation.mutate({
      ...formData,
      tipo: activeTipo,
      cantidad: isService ? 9999 : formData.cantidad,
      precio_venta_sugerido: pvpValue,
      precio_venta_recomendado: pvpValue,
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

  return {
    isService,
    globalScannerMode,
    isServerOnline,
    searchTerm,
    setSearchTerm,
    isModalOpen,
    setIsModalOpen,
    isProveedoresModalOpen,
    setIsProveedoresModalOpen,
    isUnlocked,
    setIsUnlocked,
    authModalOpen,
    setAuthModalOpen,
    uploadStatus,
    setUploadStatus,
    fileInputRef,
    barcodeInputRef,
    scanMode,
    setScanMode,
    pistolaInput,
    setPistolaInput,
    isSearchingWorldwide,
    lookupFeedback,
    setLookupFeedback,
    lastScannedCode,
    formData,
    setFormData,
    formError,
    productos,
    proveedores,
    isLoading,
    isSyncing,
    createMutation,
    excelMutation,
    resetForm,
    handleFileChange,
    handleSubmit,
    costo,
    pvp,
    ganancia,
    margenPorcentaje,
    filteredProductos,
    handleBarcodeReceived,
    onNavigate,
  };
};
