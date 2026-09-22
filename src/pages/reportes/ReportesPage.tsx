import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { api } from '../../api/client';
import {
  Reporte,
  Orden,
  TrabajoRealizado,
  RepuestoUtilizado,
  OrdenesPaginadasResponse,
  CATALOGO_ESTADOS_ORDEN,
  Producto,
  Proveedor,
  Venta,
} from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, NumericInput } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { FacturaPrintModal } from '../../components/print/FacturaPrintModal';
import {
  FileText,
  PlusCircle,
  Printer,
  Trash2,
  DollarSign,
  ClipboardList,
  User,
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  Laptop,
  ArrowRight,
  Filter,
  X,
  Eye,
  Table,
  ChevronDown,
  ChevronUp,
  Phone,
  Maximize2,
  Minimize2,
  Check,
  AlertTriangle,
  ShoppingCart,
  Wrench,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Edit2,
  Truck,
  Layers,
  Cpu,
  Receipt,
  Plus,
  Calculator,
} from 'lucide-react';
import { WhatsAppIcon } from '../../components/common/WhatsAppIcon';
import { documentNotificationService } from '../../services/documentNotificationService';

interface ReportesPageProps {
  selectedOrder?: Orden | null;
  onClearSelectedOrder?: () => void;
  onNavigate?: (section: any) => void;
}

interface AutocompleteItem {
  texto: string;
  precio: number;
  frecuencia?: number;
}

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: AutocompleteItem) => void;
  fetchSuggestions: (query: string) => Promise<AutocompleteItem[]>;
  placeholder?: string;
  className?: string;
}

/**
 * Autocomplete Input with floating Trie-based suggestion panel
 */
const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChange,
  onSelect,
  fetchSuggestions,
  placeholder,
  className,
}) => {
  const [suggestions, setSuggestions] = useState<AutocompleteItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await fetchSuggestions(value);
        if (active) {
          setSuggestions(results);
        }
      } catch (err) {
        if (active) setSuggestions([]);
      } finally {
        if (active) setIsLoading(false);
      }
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [value, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative flex-1 ${className || ''}`}>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />

      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onSelect(item);
                setIsOpen(false);
              }}
              className="w-full text-left px-3.5 py-2 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center justify-between group transition-colors"
            >
              <div className="truncate pr-2">
                <span className="text-xs font-medium text-slate-800 dark:text-slate-100 group-hover:text-[#3498db] transition-colors">
                  {item.texto}
                </span>
                {item.frecuencia && item.frecuencia > 1 ? (
                  <span className="ml-2 text-[10px] text-slate-400">
                    ({item.frecuencia} usos)
                  </span>
                ) : null}
              </div>
              <span className="text-xs font-bold font-mono text-[#3498db] bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded shrink-0">
                ${Number(item.precio).toFixed(2)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const ReportesPage: React.FC<ReportesPageProps> = ({
  selectedOrder,
  onClearSelectedOrder,
  onNavigate,
}) => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingReporte, setViewingReporte] = useState<Reporte | null>(null);
  const [editingReporteId, setEditingReporteId] = useState<string | null>(null);
  const [facturaParaImprimir, setFacturaParaImprimir] = useState<Venta | null>(null);
  const [isFacturaModalOpen, setIsFacturaModalOpen] = useState<boolean>(false);

  const handleOpenFacturaPrint = async (factura?: Venta | null, reporteId?: string) => {
    if (factura && factura.detalles && factura.detalles.length > 0) {
      setFacturaParaImprimir(factura);
      setIsFacturaModalOpen(true);
      return;
    }
    if (factura?.id) {
      try {
        const fullVenta = await api.getVentaDetail(factura.id);
        setFacturaParaImprimir(fullVenta);
        setIsFacturaModalOpen(true);
        return;
      } catch (err) {
        console.error('Error al obtener detalle de venta:', err);
        setFacturaParaImprimir(factura);
        setIsFacturaModalOpen(true);
        return;
      }
    }
    if (reporteId) {
      try {
        const ventas = await api.getVentas();
        const v = ventas.find(
          (x: any) =>
            x.reporte === reporteId ||
            x.reporte_id === reporteId ||
            (typeof x.reporte === 'object' && x.reporte?.id === reporteId)
        );
        if (v) {
          const full = await api.getVentaDetail(v.id);
          setFacturaParaImprimir(full);
          setIsFacturaModalOpen(true);
          return;
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Main Page View & Search State
  const [viewMode, setViewMode] = useState<'tabla' | 'equipos'>('tabla');
  const [reportesSearch, setReportesSearch] = useState('');
  const [expandedEquipos, setExpandedEquipos] = useState<Record<string, boolean>>({});

  // WhatsApp Notification State
  const [sendingInformeWhatsApp, setSendingInformeWhatsApp] = useState(false);
  const [informeWhatsAppFeedback, setInformeWhatsAppFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleSendInformeWhatsApp = async (rep: any) => {
    if (!rep) return;
    setSendingInformeWhatsApp(true);
    setInformeWhatsAppFeedback(null);
    try {
      const res = await documentNotificationService.sendInforme(rep);
      if (res.success) {
        setInformeWhatsAppFeedback({
          type: 'success',
          message: '¡Informe técnico enviado con éxito al WhatsApp del cliente!',
        });
        setTimeout(() => setInformeWhatsAppFeedback(null), 5000);
      } else {
        setInformeWhatsAppFeedback({
          type: 'error',
          message: res.error || 'Error al enviar por WhatsApp',
        });
        setTimeout(() => setInformeWhatsAppFeedback(null), 6000);
      }
    } catch (err: any) {
      setInformeWhatsAppFeedback({
        type: 'error',
        message: err.message || 'Error de comunicación con el servidor de mensajería',
      });
      setTimeout(() => setInformeWhatsAppFeedback(null), 6000);
    } finally {
      setSendingInformeWhatsApp(false);
    }
  };

  // Ficha Técnica Form State
  const [ordenId, setOrdenId] = useState<string>('');
  const [personaACargo, setPersonaACargo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [diagnosticoProblemas, setDiagnosticoProblemas] = useState('');
  const [diagnosticoProblemasList, setDiagnosticoProblemasList] = useState<string[]>(['']);
  const problemaInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleProblemaChange = (index: number, value: string) => {
    const updated = [...diagnosticoProblemasList];
    updated[index] = value;
    setDiagnosticoProblemasList(updated);
    setDiagnosticoProblemas(updated.filter((p) => p.trim()).join('\n'));
  };

  const handleAddProblema = (atIndex?: number) => {
    const targetIdx = atIndex !== undefined ? atIndex + 1 : diagnosticoProblemasList.length;
    const updated = [...diagnosticoProblemasList];
    updated.splice(targetIdx, 0, '');
    setDiagnosticoProblemasList(updated);
    setDiagnosticoProblemas(updated.filter((p) => p.trim()).join('\n'));
    setTimeout(() => {
      problemaInputRefs.current[targetIdx]?.focus();
    }, 30);
  };

  const handleRemoveProblema = (index: number) => {
    if (diagnosticoProblemasList.length <= 1) {
      setDiagnosticoProblemasList(['']);
      setDiagnosticoProblemas('');
      problemaInputRefs.current[0]?.focus();
      return;
    }
    const updated = diagnosticoProblemasList.filter((_, i) => i !== index);
    setDiagnosticoProblemasList(updated);
    setDiagnosticoProblemas(updated.filter((p) => p.trim()).join('\n'));
    const prevIdx = Math.max(0, index - 1);
    setTimeout(() => {
      problemaInputRefs.current[prevIdx]?.focus();
    }, 30);
  };

  const handleProblemaKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddProblema(index);
    } else if (
      e.key === 'Backspace' &&
      !diagnosticoProblemasList[index] &&
      diagnosticoProblemasList.length > 1
    ) {
      e.preventDefault();
      handleRemoveProblema(index);
    } else if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      problemaInputRefs.current[index - 1]?.focus();
    } else if (
      e.key === 'ArrowDown' &&
      index < diagnosticoProblemasList.length - 1
    ) {
      e.preventDefault();
      problemaInputRefs.current[index + 1]?.focus();
    }
  };
  const [tipoChequeoId, setTipoChequeoId] = useState('');
  const [precioChequeo, setPrecioChequeo] = useState<number>(10);

  const [trabajos, setTrabajos] = useState<TrabajoRealizado[]>([
    { descripcion: '', costo: 0, costo_proveedor: 0, estado: 'COTIZADO' },
  ]);
  const [repuestos, setRepuestos] = useState<RepuestoUtilizado[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [incompleteItemsError, setIncompleteItemsError] = useState<string[] | null>(null);

  const checkIncompleteCotizacion = (
    trabajosList: TrabajoRealizado[],
    repuestosList: RepuestoUtilizado[]
  ): string[] => {
    const issues: string[] = [];

    // Trabajos aceptados
    const acceptedTrabajos = trabajosList.filter((t) => t.estado === 'COTIZADO');
    acceptedTrabajos.forEach((t, idx) => {
      if (!t.descripcion || !t.descripcion.trim()) {
        issues.push(`Servicio #${idx + 1}: Falta ingresar la descripción del servicio técnico.`);
      }
      if (isNaN(Number(t.costo)) || Number(t.costo) <= 0) {
        issues.push(`Servicio #${idx + 1} (${t.descripcion || 'Sin descripción'}): El precio para el cliente debe ser mayor a $0.00.`);
      }
    });

    // Repuestos aceptados
    const acceptedRepuestos = repuestosList.filter((r) => r.estado === 'COTIZADO');
    acceptedRepuestos.forEach((r, idx) => {
      if (!r.nombre_repuesto || !r.nombre_repuesto.trim()) {
        issues.push(`Repuesto #${idx + 1}: Falta ingresar el nombre o descripción del componente/repuesto.`);
      }
      if (isNaN(Number(r.precio_unitario)) || Number(r.precio_unitario) <= 0) {
        issues.push(`Repuesto #${idx + 1} (${r.nombre_repuesto || 'Sin nombre'}): El precio unitario debe ser mayor a $0.00.`);
      }
      if (isNaN(Number(r.cantidad)) || Number(r.cantidad) <= 0) {
        issues.push(`Repuesto #${idx + 1} (${r.nombre_repuesto || 'Sin nombre'}): La cantidad debe ser al menos 1 unidad.`);
      }
    });

    return issues;
  };

  // Order Search & Filter State inside modal
  type DatePreset = 'TODAS' | 'HOY' | 'SEMANA' | 'MES' | 'SEMESTRE' | 'ANIO' | 'PERSONALIZADA';
  const [ordenSearch, setOrdenSearch] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('TODAS');
  const [datePreset, setDatePreset] = useState<DatePreset>('TODAS');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [soloSinInforme, setSoloSinInforme] = useState(false);

  const formatDateToISO = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDatePreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const now = new Date();
    const todayStr = formatDateToISO(now);

    if (preset === 'TODAS') {
      setFechaDesde('');
      setFechaHasta('');
    } else if (preset === 'HOY') {
      setFechaDesde(todayStr);
      setFechaHasta(todayStr);
    } else if (preset === 'SEMANA') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setFechaDesde(formatDateToISO(d));
      setFechaHasta(todayStr);
    } else if (preset === 'MES') {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      setFechaDesde(formatDateToISO(d));
      setFechaHasta(todayStr);
    } else if (preset === 'SEMESTRE') {
      const d = new Date();
      d.setMonth(d.getMonth() - 6);
      setFechaDesde(formatDateToISO(d));
      setFechaHasta(todayStr);
    } else if (preset === 'ANIO') {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 1);
      setFechaDesde(formatDateToISO(d));
      setFechaHasta(todayStr);
    }
  };

  // Queries
  const { data: reportes = [], isLoading } = useCachedQuery<Reporte[]>({
    queryKey: ['reportes'],
    queryFn: api.getReportes,
    keyField: 'id',
  });

  const { data: ordenesData, refetch: refetchOrdenes } = useCachedQuery<OrdenesPaginadasResponse>({
    queryKey: ['ordenes'],
    queryFn: () => api.getOrdenes(0, 200),
    keyField: 'id',
    nestedArrayKey: 'ordenes',
  });

  const { data: chequeos = [] } = useCachedQuery<Producto[]>({
    queryKey: ['chequeos'],
    queryFn: api.getChequeos,
    keyField: 'codigo',
  });

  const { data: productosInventario = [] } = useCachedQuery<Producto[]>({
    queryKey: ['productos'],
    queryFn: api.getProductos,
    keyField: 'id',
  });

  const { data: proveedores = [] } = useCachedQuery<Proveedor[]>({
    queryKey: ['proveedores'],
    queryFn: api.getProveedores,
    keyField: 'id',
  });

  // Set default chequeo if available
  useEffect(() => {
    if (chequeos.length > 0 && !tipoChequeoId) {
      setTipoChequeoId(chequeos[0].id);
      setPrecioChequeo(Number(chequeos[0].precio_venta_sugerido || 10));
    }
  }, [chequeos, tipoChequeoId]);

  const handleSelectChequeo = (chkId: string) => {
    setTipoChequeoId(chkId);
    const found = chequeos.find((c) => c.id === chkId || c.codigo === chkId);
    if (found) {
      setPrecioChequeo(Number(found.precio_venta_sugerido || found.precio_venta_recomendado || 10));
    }
  };

  // Set of Order IDs that already have an emitted report
  const reportedOrderIds = useMemo(() => {
    const ids = new Set<string>();
    reportes.forEach((r: any) => {
      const oid = r.orden_id?.id || r.orden?.id || r.orden_id;
      if (oid) ids.add(String(oid));
    });
    return ids;
  }, [reportes]);

  const normalizeSearch = (text: string) =>
    (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const getReporteEquipo = (rep: Reporte) => rep.orden?.equipo;

  const getReporteCliente = (rep: Reporte) => {
    const eq = rep.orden?.equipo;
    if (eq?.cliente) return eq.cliente;
    if ((eq as any)?.cliente_ci && typeof (eq as any).cliente_ci === 'object') {
      return (eq as any).cliente_ci;
    }
    return undefined;
  };

  // Filtrado de reportes
  const filteredReportes = useMemo(() => {
    const rawTerm = reportesSearch.trim();
    if (!rawTerm) return reportes;

    const searchTokens = normalizeSearch(rawTerm)
      .split(/\s+/)
      .filter(Boolean);

    return reportes.filter((rep) => {
      const eq = getReporteEquipo(rep);
      const cli = getReporteCliente(rep);
      const searchableBlob = normalizeSearch(
        [
          eq?.nombre,
          eq?.marca,
          eq?.modelo,
          eq?.numero_serie,
          cli?.nombre,
          cli?.apellido,
          cli?.ci,
          cli?.telefono,
          rep.orden?.numero_orden,
          rep.persona_a_cargo,
          rep.observaciones,
          rep.diagnostico_problemas,
          rep.id,
        ]
          .filter(Boolean)
          .join(' ')
      );

      return searchTokens.every((token) => searchableBlob.includes(token));
    });
  }, [reportes, reportesSearch]);

  // Agrupamiento por equipo real (mismo cliente y mismo equipo/dispositivo)
  const reportesPorEquipo = useMemo(() => {
    const groupsMap = new Map<
      string,
      {
        equipoKey: string;
        equipo: any;
        cliente: any;
        reportes: Reporte[];
        totalAceptadoAcumulado: number;
      }
    >();

    filteredReportes.forEach((rep) => {
      const eq = getReporteEquipo(rep);
      const cli = getReporteCliente(rep);

      const cliKey = cli?.ci
        ? String(cli.ci).trim()
        : cli?.id
        ? String(cli.id)
        : cli?.nombre
        ? String(cli.nombre).toLowerCase().trim()
        : 'sin-cliente';
      const nombreEq = (eq?.nombre || '').toLowerCase().trim();
      const marcaEq = (eq?.marca || '').toLowerCase().trim();
      const modeloEq = (eq?.modelo || '').toLowerCase().trim();
      const serieEq = (eq?.numero_serie || '').toLowerCase().trim();

      // Si tiene número de serie lo incluimos; si no, agrupamos por cliente + nombre + marca + modelo
      const equipoKey = serieEq
        ? `${cliKey}_${nombreEq}_${marcaEq}_${modeloEq}_${serieEq}`
        : `${cliKey}_${nombreEq}_${marcaEq}_${modeloEq}`;

      const finalKey = nombreEq || marcaEq || modeloEq ? equipoKey : eq?.id ? String(eq.id) : `rep-${rep.id}`;

      if (!groupsMap.has(finalKey)) {
        groupsMap.set(finalKey, {
          equipoKey: finalKey,
          equipo: eq,
          cliente: cli,
          reportes: [],
          totalAceptadoAcumulado: 0,
        });
      }

      const grp = groupsMap.get(finalKey)!;
      grp.reportes.push(rep);

      const totAceptado = Number(rep.total_aceptado ?? rep.total_general ?? 0);
      grp.totalAceptadoAcumulado += totAceptado > 0 ? totAceptado : Number(rep.precio_chequeo || 10);
    });

    const result = Array.from(groupsMap.values());
    result.forEach((g) => {
      g.reportes.sort(
        (a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime()
      );
    });

    return result;
  }, [filteredReportes]);

  // If selectedOrder was provided from props, initialize and open
  useEffect(() => {
    if (selectedOrder) {
      resetForm();
      setOrdenId(selectedOrder.id);
      if (selectedOrder.realiza_orden) {
        setPersonaACargo(selectedOrder.realiza_orden);
      }
      setIsCreateOpen(true);
      onClearSelectedOrder?.();
    }
  }, [selectedOrder, onClearSelectedOrder]);

  useEffect(() => {
    if (isCreateOpen) {
      refetchOrdenes();
    }
  }, [isCreateOpen, refetchOrdenes]);

  const resetForm = () => {
    setEditingReporteId(null);
    setOrdenId('');
    setPersonaACargo('');
    setObservaciones('');
    setDiagnosticoProblemas('');
    setDiagnosticoProblemasList(['']);
    if (chequeos.length > 0) {
      setTipoChequeoId(chequeos[0].id);
      setPrecioChequeo(Number(chequeos[0].precio_venta_sugerido || 10));
    }
    setTrabajos([{ descripcion: '', costo: 0, costo_proveedor: 0, estado: 'COTIZADO' }]);
    setRepuestos([]);
    setFormError(null);
    setOrdenSearch('');
    setEstadoFiltro('TODAS');
    setDatePreset('TODAS');
    setFechaDesde('');
    setFechaHasta('');
    setSoloSinInforme(false);
  };

  const handleEditReporte = (rep: Reporte) => {
    setEditingReporteId(rep.id);
    setOrdenId(rep.orden_id);
    setPersonaACargo(rep.persona_a_cargo || '');
    setObservaciones(rep.observaciones || '');
    setDiagnosticoProblemas(rep.diagnostico_problemas || '');
    const loadedProbs = (rep.diagnostico_problemas || '')
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);
    setDiagnosticoProblemasList(loadedProbs.length > 0 ? loadedProbs : ['']);
    setTipoChequeoId(rep.tipo_chequeo || (chequeos[0]?.id || ''));
    setPrecioChequeo(Number(rep.precio_chequeo || 10));
    setTrabajos(
      rep.trabajos_realizados && rep.trabajos_realizados.length > 0
        ? rep.trabajos_realizados.map((t) => ({
            descripcion: t.descripcion,
            costo: Number(t.costo || 0),
            costo_proveedor: Number(t.costo_proveedor || 0),
            proveedor: t.proveedor,
            estado: t.estado || 'COTIZADO',
          }))
        : [{ descripcion: '', costo: 0, costo_proveedor: 0, estado: 'COTIZADO' }]
    );
    setRepuestos(
      rep.repuestos_utilizados && rep.repuestos_utilizados.length > 0
        ? rep.repuestos_utilizados.map((r) => ({
            nombre_repuesto: r.nombre_repuesto,
            cantidad: r.cantidad || 1,
            precio_unitario: Number(r.precio_unitario || 0),
            costo_unitario_proveedor: Number(r.costo_unitario_proveedor || 0),
            proveedor: r.proveedor,
            estado: r.estado || 'COTIZADO',
          }))
        : []
    );
    setIsCreateOpen(true);
  };

  // Find currently selected order object
  const currentSelectedOrden = useMemo(() => {
    if (!ordenId) return null;
    return (ordenesData?.ordenes || []).find((o) => o.id === ordenId) || null;
  }, [ordenId, ordenesData]);

  // Order selection list in modal
  const availableFilteredOrdenes = useMemo(() => {
    const list = ordenesData?.ordenes || [];
    return list.filter((o) => {
      const hasReport = Boolean(o.tiene_ficha_tecnica || reportedOrderIds.has(o.id));
      if (soloSinInforme && hasReport && o.id !== ordenId) return false;

      if (ordenSearch.trim()) {
        const q = ordenSearch.toLowerCase().trim();
        const num = (o.numero_orden || o.id).toLowerCase();
        const cliName = `${o.equipo?.cliente?.nombre || (o.equipo as any)?.cliente_ci?.nombre || ''} ${o.equipo?.cliente?.apellido || (o.equipo as any)?.cliente_ci?.apellido || ''}`.toLowerCase();
        const dev = `${o.equipo?.nombre || ''} ${o.equipo?.marca || ''} ${o.equipo?.modelo || ''}`.toLowerCase();
        if (!num.includes(q) && !cliName.includes(q) && !dev.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [ordenesData, reportedOrderIds, soloSinInforme, ordenSearch, ordenId]);

  // Calculations for quote approval/rejection
  const totalTrabajosAceptados = useMemo(() => {
    return trabajos
      .filter((t) => t.estado === 'COTIZADO')
      .reduce((sum, t) => sum + (parseFloat(String(t.costo)) || 0), 0);
  }, [trabajos]);

  const totalRepuestosAceptados = useMemo(() => {
    return repuestos
      .filter((r) => r.estado === 'COTIZADO')
      .reduce(
        (sum, r) => sum + (parseInt(String(r.cantidad)) || 1) * (parseFloat(String(r.precio_unitario)) || 0),
        0
      );
  }, [repuestos]);

  const totalAceptado = totalTrabajosAceptados + totalRepuestosAceptados;

  const totalTrabajosRechazados = useMemo(() => {
    return trabajos
      .filter((t) => t.estado === 'RECHAZADO')
      .reduce((sum, t) => sum + (parseFloat(String(t.costo)) || 0), 0);
  }, [trabajos]);

  const totalRepuestosRechazados = useMemo(() => {
    return repuestos
      .filter((r) => r.estado === 'RECHAZADO')
      .reduce(
        (sum, r) => sum + (parseInt(String(r.cantidad)) || 1) * (parseFloat(String(r.precio_unitario)) || 0),
        0
      );
  }, [repuestos]);

  const totalRechazado = totalTrabajosRechazados + totalRepuestosRechazados;
  const totalGeneralCotizado = totalAceptado + totalRechazado;

  // Has items in quote
  const hasItems = trabajos.some((t) => t.descripcion.trim()) || repuestos.some((r) => r.nombre_repuesto.trim());
  const isRechazoTotal = hasItems && totalAceptado === 0;

  const handleSelectOrden = (o: Orden) => {
    setOrdenId(o.id);
    if (o.realiza_orden) {
      setPersonaACargo(o.realiza_orden);
    }
    setFormError(null);
  };

  const handleAddTrabajo = () => {
    setTrabajos([...trabajos, { descripcion: '', costo: 0, costo_proveedor: 0, estado: 'COTIZADO' }]);
  };

  const handleRemoveTrabajo = (idx: number) => {
    setTrabajos(trabajos.filter((_, i) => i !== idx));
  };

  const handleToggleEstadoTrabajo = (idx: number) => {
    const newT = [...trabajos];
    newT[idx].estado = newT[idx].estado === 'COTIZADO' ? 'RECHAZADO' : 'COTIZADO';
    setTrabajos(newT);
  };

  const handleAddRepuesto = () => {
    setRepuestos([...repuestos, { nombre_repuesto: '', cantidad: 1, precio_unitario: 0, costo_unitario_proveedor: 0, estado: 'COTIZADO' }]);
  };

  const handleRemoveRepuesto = (idx: number) => {
    setRepuestos(repuestos.filter((_, i) => i !== idx));
  };

  const handleToggleEstadoRepuesto = (idx: number) => {
    const newR = [...repuestos];
    newR[idx].estado = newR[idx].estado === 'COTIZADO' ? 'RECHAZADO' : 'COTIZADO';
    setRepuestos(newR);
  };

  // Save report payload helper
  const buildReportePayload = () => {
    if (!ordenId) throw new Error('Por favor selecciona una orden de trabajo');
    return {
      orden_id: ordenId,
      persona_a_cargo: personaACargo,
      observaciones: observaciones,
      diagnostico_problemas: diagnosticoProblemas,
      tipo_chequeo: tipoChequeoId || undefined,
      precio_chequeo: precioChequeo,
      estado_cotizacion: isRechazoTotal ? 'RECHAZADO' : totalAceptado > 0 ? 'ACEPTADO' : 'PENDIENTE',
      trabajos_realizados: trabajos
        .filter((t) => t.descripcion.trim())
        .map((t) => ({
          descripcion: t.descripcion,
          costo: parseFloat(String(t.costo)) || 0,
          costo_proveedor: parseFloat(String(t.costo_proveedor)) || 0,
          proveedor: t.proveedor || undefined,
          estado: t.estado || 'COTIZADO',
        })),
      repuestos_utilizados: repuestos
        .filter((r) => r.nombre_repuesto.trim())
        .map((r) => ({
          nombre_repuesto: r.nombre_repuesto,
          cantidad: parseInt(String(r.cantidad)) || 1,
          precio_unitario: parseFloat(String(r.precio_unitario)) || 0,
          costo_unitario_proveedor: parseFloat(String(r.costo_unitario_proveedor)) || 0,
          proveedor: r.proveedor || undefined,
          estado: r.estado || 'COTIZADO',
        })),
    };
  };

  // Solo Guardar Ficha Técnica
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = buildReportePayload();
      if (editingReporteId) {
        return await api.updateReporte(editingReporteId, payload);
      } else {
        return await api.createReporte(payload);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
      queryClient.invalidateQueries({ queryKey: ['ordenes'] });
      setIsCreateOpen(false);
      resetForm();
      setViewingReporte(data);
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.errors || err.message || 'Error al guardar la ficha técnica');
    },
  });

  // Guardar y Proceder a Facturación
  const handleProcederAFacturacion = async () => {
    try {
      setFormError(null);

      // Validar que no existan ítems incompletos o pendientes de rellenar en la cotización aceptada
      if (totalAceptado > 0 || trabajos.some((t) => t.estado === 'COTIZADO') || repuestos.some((r) => r.estado === 'COTIZADO')) {
        const issues = checkIncompleteCotizacion(trabajos, repuestos);
        if (issues.length > 0) {
          setIncompleteItemsError(issues);
          return;
        }
      }

      const payload = buildReportePayload();
      let savedRep: Reporte;
      if (editingReporteId) {
        savedRep = await api.updateReporte(editingReporteId, payload);
      } else {
        savedRep = await api.createReporte(payload);
      }

      queryClient.invalidateQueries({ queryKey: ['reportes'] });
      queryClient.invalidateQueries({ queryKey: ['ordenes'] });

      const ordenObj = currentSelectedOrden;
      const cli = ordenObj?.equipo?.cliente || (ordenObj?.equipo as any)?.cliente_ci;
      const clienteNombre = cli ? `${cli.nombre} ${cli.apellido || ''}`.trim() : 'CONSUMIDOR FINAL';

      let itemsParaPOS = [];

      if (totalAceptado > 0) {
        // Escenario Aceptado: Cargar servicios y repuestos aceptados. Chequeo es $0 / Bonificado
        const acceptedTrabajos = trabajos
          .filter((t) => t.estado === 'COTIZADO' && t.descripcion.trim())
          .map((t, idx) => {
            const match = productosInventario.find(
              (p) => p.nombre.trim().toLowerCase() === t.descripcion.trim().toLowerCase()
            );
            return {
              producto: {
                id: match ? match.id : 'srv-' + (t.id || idx),
                codigo: match ? match.codigo : `COT-SRV-${String(idx + 1).padStart(3, '0')}-${Date.now().toString().slice(-4)}`,
                nombre: t.descripcion,
                tipo: 'SERVICIO' as const,
                precio_venta_sugerido: Number(t.costo),
                precio_venta_recomendado: Number(t.costo),
                costo_compra: Number(t.costo_proveedor || 0),
                cantidad: 9999,
                impuesto: 15,
              },
              cantidad: 1,
              precio_unitario: Number(t.costo),
              impuesto_porcentaje: 15,
              subtotal: Number(t.costo),
            };
          });

        const acceptedRepuestos = repuestos
          .filter((r) => r.estado === 'COTIZADO' && r.nombre_repuesto.trim())
          .map((r, idx) => {
            const match = productosInventario.find(
              (p) => p.nombre.trim().toLowerCase() === r.nombre_repuesto.trim().toLowerCase()
            );
            return {
              producto: {
                id: match ? match.id : 'rep-' + (r.id || idx),
                codigo: match ? match.codigo : `COT-REP-${String(idx + 1).padStart(3, '0')}-${Date.now().toString().slice(-4)}`,
                nombre: r.nombre_repuesto,
                tipo: 'PRODUCTO' as const,
                precio_venta_sugerido: Number(r.precio_unitario),
                precio_venta_recomendado: Number(r.precio_unitario),
                costo_compra: Number(r.costo_unitario_proveedor || 0),
                cantidad: match ? match.cantidad : 9999,
                impuesto: 15,
              },
              cantidad: Number(r.cantidad || 1),
              precio_unitario: Number(r.precio_unitario),
              impuesto_porcentaje: 15,
              subtotal: Number(r.cantidad || 1) * Number(r.precio_unitario),
            };
          });

        itemsParaPOS = [...acceptedTrabajos, ...acceptedRepuestos];
      } else {
        // Escenario Rechazo Total: Facturar únicamente el Servicio de Chequeo Técnico
        const selChk = chequeos.find((c) => c.id === tipoChequeoId || c.codigo === tipoChequeoId) || chequeos[0];
        itemsParaPOS = [
          {
            producto: {
              id: selChk?.id || 'chk-srv',
              codigo: selChk?.codigo || 'CHK-TEC',
              nombre: selChk?.nombre || 'Servicio de Chequeo Técnico',
              tipo: 'SERVICIO' as const,
              precio_venta_sugerido: Number(precioChequeo),
              precio_venta_recomendado: Number(precioChequeo),
              costo_compra: 0,
              cantidad: 9999,
              impuesto: 15,
              es_chequeo: true,
            },
            cantidad: 1,
            precio_unitario: Number(precioChequeo),
            impuesto_porcentaje: 15,
            subtotal: Number(precioChequeo),
          },
        ];
      }

      sessionStorage.setItem(
        'tecnishop_pos_prefill',
        JSON.stringify({
          ordenId: ordenObj?.id,
          reporteId: savedRep.id,
          numeroOrden: ordenObj?.numero_orden || ordenObj?.id?.slice(0, 8),
          clienteCi: cli?.ci,
          clienteNombre,
          clienteTelefono: cli?.telefono,
          items: itemsParaPOS,
        })
      );

      setIsCreateOpen(false);
      resetForm();
      onNavigate?.('ventas');
    } catch (err: any) {
      setFormError(err?.response?.data?.errors || err.message || 'Error al procesar la facturación');
    }
  };

  // Helper para facturar desde la vista previa de un reporte ya guardado
  const handleFacturarDesdeVista = (rep: Reporte) => {
    // Si ya cuenta con factura emitida, no permitir facturar de nuevo; abrir factura asociada
    if (rep.esta_facturado || rep.factura) {
      handleOpenFacturaPrint(rep.factura, rep.id);
      return;
    }

    const totAceptado = Number(rep.total_aceptado || 0);

    // Validar si la cotización tiene campos faltantes que el admin debe completar
    if (totAceptado > 0 && !rep.cotizacion_completada) {
      setIncompleteItemsError([
        'Admin debe llenar campos faltantes en cotización: Debes asignar proveedor y costo de compra a todos los repuestos cotizados antes de emitir la factura.'
      ]);
      return;
    }

    // Validar completitud de ítems antes de proceder
    if (totAceptado > 0 || (rep.trabajos_realizados || []).some((t) => t.estado === 'COTIZADO') || (rep.repuestos_utilizados || []).some((r) => r.estado === 'COTIZADO')) {
      const issues = checkIncompleteCotizacion(rep.trabajos_realizados || [], rep.repuestos_utilizados || []);
      if (issues.length > 0) {
        setIncompleteItemsError(issues);
        return;
      }
    }

    const ordenObj = rep.orden;
    const cli = getReporteCliente(rep);
    const clienteNombre = cli ? `${cli.nombre} ${cli.apellido || ''}`.trim() : 'CONSUMIDOR FINAL';

    let itemsParaPOS = [];

    if (totAceptado > 0) {
      const trabajosAcc = (rep.trabajos_realizados || [])
        .filter((t) => t.estado === 'COTIZADO' && t.descripcion?.trim())
        .map((t, idx) => {
          const match = productosInventario.find(
            (p) => p.nombre.trim().toLowerCase() === t.descripcion.trim().toLowerCase()
          );
          return {
            producto: {
              id: match ? match.id : 'srv-' + idx,
              codigo: match ? match.codigo : `COT-SRV-${String(idx + 1).padStart(3, '0')}-${Date.now().toString().slice(-4)}`,
              nombre: t.descripcion,
              tipo: 'SERVICIO' as const,
              precio_venta_sugerido: Number(t.costo),
              precio_venta_recomendado: Number(t.costo),
              costo_compra: Number(t.costo_proveedor || 0),
              cantidad: 9999,
              impuesto: 15,
            },
            cantidad: 1,
            precio_unitario: Number(t.costo),
            impuesto_porcentaje: 15,
            subtotal: Number(t.costo),
          };
        });

      const repuestosAcc = (rep.repuestos_utilizados || [])
        .filter((r) => r.estado === 'COTIZADO' && r.nombre_repuesto?.trim())
        .map((r, idx) => {
          const match = productosInventario.find(
            (p) => p.nombre.trim().toLowerCase() === r.nombre_repuesto.trim().toLowerCase()
          );
          return {
            producto: {
              id: match ? match.id : 'rep-' + idx,
              codigo: match ? match.codigo : `COT-REP-${String(idx + 1).padStart(3, '0')}-${Date.now().toString().slice(-4)}`,
              nombre: r.nombre_repuesto,
              tipo: 'PRODUCTO' as const,
              precio_venta_sugerido: Number(r.precio_unitario),
              precio_venta_recomendado: Number(r.precio_unitario),
              costo_compra: Number(r.costo_unitario_proveedor || 0),
              cantidad: match ? match.cantidad : 9999,
              impuesto: 15,
            },
            cantidad: Number(r.cantidad || 1),
            precio_unitario: Number(r.precio_unitario),
            impuesto_porcentaje: 15,
            subtotal: Number(r.cantidad || 1) * Number(r.precio_unitario),
          };
        });

      itemsParaPOS = [...trabajosAcc, ...repuestosAcc];
    } else {
      const selChk = rep.tipo_chequeo_detalle || chequeos[0];
      itemsParaPOS = [
        {
          producto: {
            id: selChk?.id || 'chk-srv',
            codigo: selChk?.codigo || 'CHK-TEC',
            nombre: selChk?.nombre || 'Servicio de Chequeo Técnico',
            tipo: 'SERVICIO' as const,
            precio_venta_sugerido: Number(rep.precio_chequeo || 10),
            precio_venta_recomendado: Number(rep.precio_chequeo || 10),
            costo_compra: 0,
            cantidad: 9999,
            impuesto: 15,
            es_chequeo: true,
          },
          cantidad: 1,
          precio_unitario: Number(rep.precio_chequeo || 10),
          impuesto_porcentaje: 15,
          subtotal: Number(rep.precio_chequeo || 10),
        },
      ];
    }

    sessionStorage.setItem(
      'tecnishop_pos_prefill',
      JSON.stringify({
        ordenId: rep.orden_id,
        reporteId: rep.id,
        numeroOrden: ordenObj?.numero_orden || (typeof rep.orden_id === 'string' ? rep.orden_id.slice(0, 8) : ''),
        clienteCi: cli?.ci,
        clienteNombre,
        clienteTelefono: cli?.telefono,
        items: itemsParaPOS,
      })
    );

    setViewingReporte(null);
    onNavigate?.('ventas');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Header with Search and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#3498db]" />
            <span>Fichas Técnicas & Cotizaciones de Taller</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Diagnósticos reales post-revisión, cotización interactiva con clientes y pase a facturación
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            className="bg-[#3498db] hover:bg-[#2980b9] text-white shadow-sm font-bold text-xs"
          >
            Nueva Ficha Técnica
          </Button>
        </div>
      </div>

      {/* Main Search Bar and View Mode Switcher */}
      <Card className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1">
            <Input
              placeholder="Buscar por cliente, dispositivo, número de orden, diagnóstico..."
              value={reportesSearch}
              onChange={(e) => setReportesSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              className="text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('tabla')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'tabla'
                  ? 'bg-[#3498db] text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Listado General</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('equipos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'equipos'
                  ? 'bg-[#3498db] text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Por Equipo</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Reports Table or Groups */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-[#3498db]" />
            <span>
              {viewMode === 'tabla'
                ? `Fichas Técnicas Emitidas (${filteredReportes.length})`
                : `Equipos con Historial Técnico (${reportesPorEquipo.length} ${
                    reportesPorEquipo.length === 1 ? 'Equipo' : 'Equipos'
                  } • ${filteredReportes.length} ${
                    filteredReportes.length === 1 ? 'Ficha' : 'Fichas'
                  })`}
            </span>
          </h3>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Cargando fichas técnicas...
          </div>
        ) : filteredReportes.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No se encontraron fichas técnicas registradas.
          </div>
        ) : viewMode === 'tabla' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="pb-3 px-3">Orden / Fecha</th>
                  <th className="pb-3 px-3">Cliente</th>
                  <th className="pb-3 px-3">Equipo</th>
                  <th className="pb-3 px-3">Diagnóstico Real</th>
                  <th className="pb-3 px-3">Cotización</th>
                  <th className="pb-3 px-3">Técnico</th>
                  <th className="pb-3 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredReportes.map((rep) => {
                  const eq = getReporteEquipo(rep);
                  const cli = getReporteCliente(rep);
                  const totAceptado = Number(rep.total_aceptado ?? rep.total_general ?? 0);
                  const totRechazado = Number(rep.total_rechazado || 0);

                  return (
                    <tr key={rep.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-[#3498db]">
                          #{rep.orden?.numero_orden || (rep.orden_id ? String(rep.orden_id).slice(0, 8) : 'S/N')}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {new Date(rep.fecha_creacion).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800 dark:text-slate-100">
                          {cli ? `${cli.nombre} ${cli.apellido || ''}`.trim() : 'N/A'}
                        </div>
                        {cli?.telefono && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Tel: {cli.telefono}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {eq?.nombre || 'Equipo'} ({eq?.marca} {eq?.modelo})
                        </div>
                        {eq?.numero_serie && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            S/N: {eq.numero_serie}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 max-w-xs">
                        <p className="truncate text-slate-600 dark:text-slate-300 font-medium">
                          {rep.diagnostico_problemas || (
                            <span className="text-slate-400 italic">Sin diagnóstico especificado</span>
                          )}
                        </p>
                      </td>

                      <td className="py-3 px-3">
                        {totAceptado > 0 ? (
                          <div>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              ${totAceptado.toFixed(2)}
                            </span>
                            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-semibold">
                              Aceptado
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                              Chequeo: ${Number(rep.precio_chequeo || 10).toFixed(2)}
                            </span>
                            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-600 font-semibold">
                              Rechazado
                            </span>
                          </div>
                        )}
                        {totRechazado > 0 && totAceptado > 0 && (
                          <div className="text-[10px] text-slate-400">
                            Rechazado: ${totRechazado.toFixed(2)}
                          </div>
                        )}
                        {(rep.esta_facturado || rep.factura) && (
                          <div className="mt-1 flex items-center">
                            <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                              <Receipt className="w-3 h-3 mr-1 text-blue-600 dark:text-blue-400" />
                              {rep.factura?.numero_factura || 'Factura Emitida'}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        {rep.persona_a_cargo || 'Tecnishop'}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewingReporte(rep)}
                            className="h-7 px-2 text-xs"
                            title="Ver e Imprimir Ficha Técnica"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Ver
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditReporte(rep)}
                            className="h-7 px-2 text-xs border-blue-300 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                            title="Editar Diagnóstico y Cotización"
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-1" />
                            Editar
                          </Button>

                          {rep.esta_facturado || rep.factura ? (
                            <Button
                              size="sm"
                              onClick={() => handleOpenFacturaPrint(rep.factura, rep.id)}
                              className="h-7 px-2.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                              title="Imprimir Factura Emitida"
                            >
                              <Printer className="w-3.5 h-3.5 mr-1" />
                              Imprimir Factura
                            </Button>
                          ) : Number(rep.total_aceptado || 0) > 0 && !rep.cotizacion_completada ? (
                            <Button
                              size="sm"
                              onClick={() => onNavigate && onNavigate('cotizaciones')}
                              className="h-7 w-7 p-0 bg-amber-500 hover:bg-amber-600 text-white rounded-lg flex items-center justify-center shadow-sm"
                              title="Admin debe llenar campos faltantes en cotización"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleFacturarDesdeVista(rep)}
                              className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                              title="Facturar en Punto de Venta"
                            >
                              <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                              Facturar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grouped by Device View */
          <div className="space-y-5">
            {reportesPorEquipo.map((grp) => (
              <div
                key={grp.equipoKey}
                className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
              >
                {/* Cabecera del Equipo */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#3498db] border border-blue-200 dark:border-blue-900 shrink-0">
                      <Laptop className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                          {grp.equipo?.nombre || 'Equipo'} &bull; {grp.equipo?.marca} {grp.equipo?.modelo}
                        </h4>
                        {grp.equipo?.numero_serie && (
                          <span className="text-[11px] font-mono text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            S/N: {grp.equipo.numero_serie}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Cliente: <span className="font-semibold text-slate-700 dark:text-slate-300">{grp.cliente ? `${grp.cliente.nombre} ${grp.cliente.apellido || ''}`.trim() : 'N/A'}</span>
                        {grp.cliente?.telefono && (
                          <span className="ml-2 font-mono text-slate-400">&bull; Tel: {grp.cliente.telefono}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Resumen de totales por equipo */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Informes</span>
                      <span className="text-xs font-extrabold text-[#3498db]">
                        {grp.reportes.length} {grp.reportes.length === 1 ? 'Ficha' : 'Fichas'}
                      </span>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Cotizado</span>
                      <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                        ${grp.totalAceptadoAcumulado.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lista de Órdenes e Informes para este Equipo */}
                <div className="space-y-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 pl-1">
                    <FileText className="w-3.5 h-3.5 text-[#3498db]" />
                    <span>Historial de Órdenes y Fichas Técnicas ({grp.reportes.length}):</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {grp.reportes.map((rep) => {
                      const totAceptado = Number(rep.total_aceptado ?? rep.total_general ?? 0);
                      const isAceptado = totAceptado > 0;
                      const totFinal = isAceptado ? totAceptado : Number(rep.precio_chequeo || 10);

                      return (
                        <div
                          key={rep.id}
                          className="p-3.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs text-[#3498db] font-bold bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/60">
                                #{rep.orden?.numero_orden || (rep.orden_id ? String(rep.orden_id).slice(0, 8) : 'S/N')}
                              </span>
                              <span className="text-xs text-slate-400">
                                &bull; Fecha: <strong className="text-slate-600 dark:text-slate-300">{new Date(rep.fecha_creacion).toLocaleDateString()}</strong>
                              </span>
                              <span className="text-xs text-slate-400">
                                &bull; Técnico: <strong className="text-slate-600 dark:text-slate-300">{rep.persona_a_cargo || 'Tecnishop'}</strong>
                              </span>
                            </div>

                            {rep.diagnostico_problemas ? (
                              <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200/60 dark:border-slate-750">
                                <strong className="text-[#3498db] block mb-1">Diagnóstico Técnico:</strong>
                                <div className="whitespace-pre-line pl-1">{rep.diagnostico_problemas}</div>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 italic">Sin diagnóstico especificado</p>
                            )}
                          </div>

                          {/* Total y Acciones para esta orden */}
                          <div className="flex items-center gap-3 self-end md:self-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-700/50 w-full md:w-auto justify-between md:justify-end">
                            <div className="text-right">
                              <p className="text-[10px] uppercase font-semibold">
                                {rep.esta_facturado || rep.factura ? (
                                  <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center justify-end gap-1">
                                    <Receipt className="w-3 h-3" />
                                    Factura: {rep.factura?.numero_factura || 'Emitida'}
                                  </span>
                                ) : isAceptado ? (
                                  <span className="text-slate-400">Cotización Aceptada</span>
                                ) : (
                                  <span className="text-slate-400">Tarifa Chequeo (Rechazado)</span>
                                )}
                              </p>
                              <p className={`text-sm font-black font-mono ${rep.esta_facturado || rep.factura ? 'text-blue-600 dark:text-blue-400' : isAceptado ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                ${totFinal.toFixed(2)}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setViewingReporte(rep)}
                                className="h-7 px-2 text-xs"
                                title="Ver Ficha Técnica"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" />
                                Ver Ficha
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditReporte(rep)}
                                className="h-7 px-2 text-xs border-blue-300 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                title="Editar Diagnóstico y Cotización"
                              >
                                <Edit2 className="w-3.5 h-3.5 mr-1" />
                                Editar
                              </Button>
                              {rep.esta_facturado || rep.factura ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenFacturaPrint(rep.factura, rep.id)}
                                  className="h-7 px-2.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                                  title="Imprimir Factura Emitida"
                                >
                                  <Printer className="w-3.5 h-3.5 mr-1" />
                                  Imprimir Factura
                                </Button>
                              ) : Number(rep.total_aceptado || 0) > 0 && !rep.cotizacion_completada ? (
                                <Button
                                  size="sm"
                                  onClick={() => onNavigate && onNavigate('cotizaciones')}
                                  className="h-7 w-7 p-0 bg-amber-500 hover:bg-amber-600 text-white rounded-lg flex items-center justify-center shadow-sm"
                                  title="Admin debe llenar campos faltantes en cotización"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => handleFacturarDesdeVista(rep)}
                                  className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                                  title="Facturar en Punto de Venta"
                                >
                                  <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                                  Facturar
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ========================================================= */}
      {/* MODAL: FICHA TÉCNICA Y COTIZACIÓN (REDISEÑO TOTAL)         */}
      {/* ========================================================= */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          resetForm();
        }}
        title={editingReporteId ? 'Editar Ficha Técnica & Cotización' : 'Nueva Ficha Técnica & Diagnóstico'}
        maxWidth="4xl"
      >
        <div className="space-y-6">
          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* BLOQUE 1: INFORMACIÓN DE LA ORDEN & DETALLE DEL EQUIPO    */}
          {/* ========================================================= */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#3498db]" />
                <span>1. Detalle del Equipo & Orden de Trabajo</span>
              </h4>

              {currentSelectedOrden && (
                <button
                  type="button"
                  onClick={() => setOrdenId('')}
                  className="text-xs font-semibold text-[#3498db] hover:underline"
                >
                  Cambiar Orden
                </button>
              )}
            </div>

            {currentSelectedOrden ? (
              /* Ficha Informativa Completa del Equipo Recibido */
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-blue-500/30 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-black font-mono text-[#3498db]">
                      Orden #{currentSelectedOrden.numero_orden || currentSelectedOrden.id.slice(0, 8)}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {currentSelectedOrden.fecha}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge status={currentSelectedOrden.estado} className="text-xs py-0.5 px-2.5 font-bold">
                      {currentSelectedOrden.estado}
                    </Badge>
                    {currentSelectedOrden.estado === 'PENDIENTE' && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-500/30">
                        Pasará automáticamente a EN PROCESO
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  {/* Datos de Cliente */}
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Cliente:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {currentSelectedOrden.equipo?.cliente?.nombre || (currentSelectedOrden.equipo as any)?.cliente_ci?.nombre}{' '}
                      {currentSelectedOrden.equipo?.cliente?.apellido || (currentSelectedOrden.equipo as any)?.cliente_ci?.apellido || ''}
                    </p>
                    <p className="text-slate-500 text-[11px] font-mono">
                      C.I: {currentSelectedOrden.equipo?.cliente?.ci || (currentSelectedOrden.equipo as any)?.cliente_ci?.ci}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Tel: {currentSelectedOrden.equipo?.cliente?.telefono || (currentSelectedOrden.equipo as any)?.cliente_ci?.telefono || 'N/A'}
                    </p>
                  </div>

                  {/* Datos de Equipo */}
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Equipo / Dispositivo:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {currentSelectedOrden.equipo?.nombre} ({currentSelectedOrden.equipo?.marca} {currentSelectedOrden.equipo?.modelo})
                    </p>
                    <p className="text-slate-500 text-[11px] font-mono">
                      S/N: {currentSelectedOrden.equipo?.numero_serie || 'No especificado'}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Recepción por: {currentSelectedOrden.realiza_orden || 'Técnico'}
                    </p>
                  </div>

                  {/* Accesorios Físicos Recibidos */}
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Accesorios Recibidos:</span>
                    <div className="flex flex-wrap gap-1">
                      {currentSelectedOrden.observaciones?.[0]?.cargador && (
                        <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-[#3498db] text-[10px] font-bold">
                          Cargador
                        </span>
                      )}
                      {currentSelectedOrden.observaciones?.[0]?.bateria && (
                        <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-[#3498db] text-[10px] font-bold">
                          Batería
                        </span>
                      )}
                      {currentSelectedOrden.observaciones?.[0]?.cable_poder && (
                        <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-[#3498db] text-[10px] font-bold">
                          Cable Poder
                        </span>
                      )}
                      {currentSelectedOrden.observaciones?.[0]?.cable_datos && (
                        <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-[#3498db] text-[10px] font-bold">
                          Cable Datos
                        </span>
                      )}
                      {currentSelectedOrden.observaciones?.[0]?.otros && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]">
                          {currentSelectedOrden.observaciones[0].otros}
                        </span>
                      )}
                      {!currentSelectedOrden.observaciones?.[0]?.cargador &&
                        !currentSelectedOrden.observaciones?.[0]?.bateria &&
                        !currentSelectedOrden.observaciones?.[0]?.cable_poder &&
                        !currentSelectedOrden.observaciones?.[0]?.cable_datos &&
                        !currentSelectedOrden.observaciones?.[0]?.otros && (
                          <span className="text-slate-400 text-[10px] italic">Sin accesorios adicionales</span>
                        )}
                    </div>
                  </div>
                </div>

                {/* Problemas manifestados por el cliente al entregar el equipo */}
                <div className="mt-2 p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs">
                  <span className="font-bold text-amber-700 dark:text-amber-400 uppercase text-[10px] block mb-0.5">
                    Problema Inicial Reportado por el Cliente (Recepción):
                  </span>
                  <p className="text-slate-700 dark:text-slate-200">
                    {currentSelectedOrden.problemas?.[0]?.problema || 'No se detalló problema específico en la recepción'}
                  </p>
                </div>
              </div>
            ) : (
              /* Selector de Orden con Búsqueda */
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Buscar orden por número, cliente o equipo..."
                    value={ordenSearch}
                    onChange={(e) => setOrdenSearch(e.target.value)}
                    leftIcon={<Search className="w-4 h-4" />}
                    className="text-xs"
                  />
                </div>

                <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {availableFilteredOrdenes.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No se encontraron órdenes disponibles.
                    </div>
                  ) : (
                    availableFilteredOrdenes.map((o) => (
                      <div
                        key={o.id}
                        className="p-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="truncate pr-3 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-[#3498db]">
                              #{o.numero_orden || o.id.slice(0, 8)}
                            </span>
                            <span className="text-[10px] text-slate-400">{o.fecha}</span>
                            <Badge status={o.estado} className="text-[9px] py-0 px-1.5 font-bold">
                              {o.estado}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-800 dark:text-slate-200 truncate">
                            <span className="font-bold">
                              {o.equipo?.cliente?.nombre || (o.equipo as any)?.cliente_ci?.nombre} {o.equipo?.cliente?.apellido || (o.equipo as any)?.cliente_ci?.apellido || ''}
                            </span>{' '}
                            &bull; {o.equipo?.marca} {o.equipo?.modelo || o.equipo?.nombre}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleSelectOrden(o)}
                          className="bg-[#3498db] hover:bg-[#2980b9] text-white text-xs h-7 px-3"
                        >
                          Seleccionar
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* BLOQUE 2: DIAGNÓSTICO TÉCNICO REAL & TIPO DE CHEQUEO      */}
          {/* ========================================================= */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-500" />
              <span>2. Diagnóstico Técnico Real & Chequeo de Respaldo</span>
            </h4>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Problemas Reales Detectados por el Técnico (Post-Chequeo) *
                  </label>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    Presiona <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-mono font-bold">Enter ↵</kbd> para agregar otro
                  </span>
                </div>

                <div className="space-y-2">
                  {diagnosticoProblemasList.map((prob, idx) => (
                    <div key={idx} className="flex items-center gap-2 group">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        ref={(el) => (problemaInputRefs.current[idx] = el)}
                        type="text"
                        value={prob}
                        onChange={(e) => handleProblemaChange(idx, e.target.value)}
                        onKeyDown={(e) => handleProblemaKeyDown(e, idx)}
                        placeholder={
                          idx === 0
                            ? "Escribe el problema real (ej: Corto en línea principal de 19V)..."
                            : idx === 1
                            ? "Ej: Celda de batería degradada al 40%..."
                            : idx === 2
                            ? "Ej: Pasta térmica petrificada..."
                            : "Escribe otro problema detectado..."
                        }
                        className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3498db]/40 shadow-sm transition-all"
                      />
                      {diagnosticoProblemasList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveProblema(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors shrink-0"
                          title="Eliminar este renglón"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  <div className="pt-1 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleAddProblema()}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3498db] hover:text-[#2980b9] dark:hover:text-blue-400 transition-colors py-1 px-2.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar otro problema</span>
                    </button>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {diagnosticoProblemasList.filter((p) => p.trim()).length} problema(s) especificado(s)
                    </span>
                  </div>
                </div>
              </div>

              {/* Selector de Chequeo de Respaldo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Chequeo / Tarifa de Diagnóstico *
                  </label>
                  <select
                    value={tipoChequeoId}
                    onChange={(e) => handleSelectChequeo(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-[#3498db]/40"
                  >
                    {chequeos.map((chk) => (
                      <option key={chk.id} value={chk.id}>
                        {chk.nombre} - ${Number(chk.precio_venta_sugerido || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Precio Chequeo (Editable para Casos Especiales) ($)
                  </label>
                  <NumericInput
                    value={precioChequeo}
                    onChange={(val) => setPrecioChequeo(val)}
                    placeholder="0.00"
                    leftIcon={<DollarSign className="w-3.5 h-3.5" />}
                    className="font-bold text-xs"
                  />
                </div>

                <div className="sm:col-span-2 text-[11px] text-blue-800 dark:text-blue-300 flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>
                    <strong>Regla de negocio:</strong> Este valor (${Number(precioChequeo).toFixed(2)}) se cobrará <u>ÚNICAMENTE</u> si el cliente rechaza toda la cotización. Si aprueba cualquier servicio o repuesto cotizado, el chequeo será <strong>$0.00 (GRATIS)</strong>.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* BLOQUE 3: COTIZACIÓN (RECOMENDACIÓN SERVICIOS & REPUESTOS)  */}
          {/* ========================================================= */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-[#3498db]" />
                  <span>3. Cotización de Reparación (Recomendaciones del Técnico)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Usa los switches para marcar cada ítem como <strong>Cotizado (Aceptado)</strong> o <strong>Rechazado por el cliente</strong>
                </p>
              </div>
            </div>

            {/* SECCIÓN TRABAJOS / MANO DE OBRA */}
            <div className="space-y-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Servicios y Mano de Obra Recomendados
                </span>
                <button
                  type="button"
                  onClick={handleAddTrabajo}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950 text-[#3498db] border border-blue-200 dark:border-blue-900 hover:bg-blue-100 transition-colors"
                >
                  + Agregar Servicio
                </button>
              </div>

              {trabajos.map((t, idx) => {
                const isAccepted = t.estado === 'COTIZADO';
                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border transition-all flex flex-col md:flex-row items-stretch md:items-center gap-2.5 ${
                      isAccepted
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/30'
                        : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-500/30 opacity-80'
                    }`}
                  >
                    <div className="flex-1">
                      <AutocompleteInput
                        placeholder="Descripción del trabajo (ej: Mantenimiento Preventivo, Reballing)"
                        value={t.descripcion}
                        onChange={(val) => {
                          const newT = [...trabajos];
                          newT[idx].descripcion = val;
                          setTrabajos(newT);
                        }}
                        onSelect={(item) => {
                          const newT = [...trabajos];
                          newT[idx].descripcion = item.texto;
                          newT[idx].costo = item.precio;
                          setTrabajos(newT);
                        }}
                        fetchSuggestions={api.getAutocompleteManoObra}
                      />
                    </div>

                    <div className="w-full md:w-32">
                      <NumericInput
                        placeholder="Precio cliente"
                        value={t.costo}
                        onChange={(val) => {
                          const newT = [...trabajos];
                          newT[idx].costo = val;
                          setTrabajos(newT);
                        }}
                        leftIcon={<DollarSign className="w-3.5 h-3.5" />}
                        className="font-bold text-xs"
                      />
                    </div>

                    {/* Segmented Option: Aceptado vs Rechazado */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (!isAccepted) handleToggleEstadoTrabajo(idx);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isAccepted
                            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Aceptado</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (isAccepted) handleToggleEstadoTrabajo(idx);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          !isAccepted
                            ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Rechazado</span>
                      </button>
                    </div>

                    {trabajos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTrabajo(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 self-center transition-colors"
                        title="Eliminar fila"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* SECCIÓN REPUESTOS / PIEZAS */}
            <div className="space-y-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Repuestos y Componentes Recomendados
                </span>
                <button
                  type="button"
                  onClick={handleAddRepuesto}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950 text-[#3498db] border border-blue-200 dark:border-blue-900 hover:bg-blue-100 transition-colors"
                >
                  + Agregar Repuesto
                </button>
              </div>

              {repuestos.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-1">
                  No se han agregado repuestos a esta cotización.
                </p>
              ) : (
                repuestos.map((r, idx) => {
                  const isAccepted = r.estado === 'COTIZADO';
                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border transition-all flex flex-col md:flex-row items-stretch md:items-center gap-2.5 ${
                        isAccepted
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/30'
                          : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-500/30 opacity-80'
                      }`}
                    >
                      <div className="flex-1">
                        <AutocompleteInput
                          placeholder="Repuesto necesario (ej: Disco SSD 512GB, Batería A1466)"
                          value={r.nombre_repuesto}
                          onChange={(val) => {
                            const newR = [...repuestos];
                            newR[idx].nombre_repuesto = val;
                            setRepuestos(newR);
                          }}
                          onSelect={(item) => {
                            const newR = [...repuestos];
                            newR[idx].nombre_repuesto = item.texto;
                            newR[idx].precio_unitario = item.precio;
                            setRepuestos(newR);
                          }}
                          fetchSuggestions={api.getAutocompleteRepuestos}
                        />
                      </div>

                      <div className="w-full md:w-20">
                        <NumericInput
                          allowDecimals={false}
                          min={1}
                          placeholder="1"
                          value={r.cantidad}
                          onChange={(val) => {
                            const newR = [...repuestos];
                            newR[idx].cantidad = val || 1;
                            setRepuestos(newR);
                          }}
                          className="text-xs font-bold text-center"
                        />
                      </div>

                      <div className="w-full md:w-28">
                        <NumericInput
                          placeholder="0.00"
                          value={r.precio_unitario}
                          onChange={(val) => {
                            const newR = [...repuestos];
                            newR[idx].precio_unitario = val;
                            setRepuestos(newR);
                          }}
                          leftIcon={<DollarSign className="w-3.5 h-3.5" />}
                          className="font-bold text-xs"
                        />
                      </div>

                      {/* Segmented Option: Aceptado vs Rechazado */}
                      <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (!isAccepted) handleToggleEstadoRepuesto(idx);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isAccepted
                              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Aceptado</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (isAccepted) handleToggleEstadoRepuesto(idx);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            !isAccepted
                              ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Rechazado</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveRepuesto(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 self-center transition-colors"
                        title="Eliminar repuesto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* BLOQUE 4: RESUMEN FINANCIERO Y ESCENARIO DE FACTURACIÓN   */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Resumen de Valores */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Servicios Aceptados:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  ${totalTrabajosAceptados.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Repuestos Aceptados:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  ${totalRepuestosAceptados.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-1.5">
                <span>Ítems Rechazados por Cliente:</span>
                <span className="font-mono text-rose-500 font-semibold">
                  ${totalRechazado.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-slate-200 dark:border-slate-800 pt-2 text-[#3498db]">
                <span>Total Reparación Aceptada:</span>
                <span className="font-mono font-black text-base">
                  ${totalAceptado.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Escenario de Facturación Dinámico */}
            <div
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                totalAceptado > 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-950/30 border-amber-500/40 text-amber-800 dark:text-amber-300'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-black text-sm">
                  {totalAceptado > 0 ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span>Cotización Aceptada (Total o Parcial)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      <span>Cotización Rechazada por el Cliente</span>
                    </>
                  )}
                </div>

                <p className="text-xs font-medium">
                  {totalAceptado > 0 ? (
                    <span>
                      El cliente autorizó reparación por <strong>${totalAceptado.toFixed(2)}</strong>. Por regla del taller, el servicio de chequeo queda <strong>BONIFICADO ($0.00 GRATIS)</strong>.
                    </span>
                  ) : (
                    <span>
                      Al no aceptar ningún ítem de cotización, se facturará únicamente el <strong>Servicio de Chequeo Técnico (${Number(precioChequeo).toFixed(2)})</strong>.
                    </span>
                  )}
                </p>
              </div>

              <div className="pt-2 border-t border-current/10 flex items-center justify-between">
                <span className="font-bold text-xs">Monto que pasará a Factura:</span>
                <span className="font-black font-mono text-lg">
                  ${(totalAceptado > 0 ? totalAceptado : Number(precioChequeo)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Técnico Responsable & Observaciones Generales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Técnico Responsable / A Cargo
              </label>
              <Input
                placeholder="Nombre del técnico"
                value={personaACargo}
                onChange={(e) => setPersonaACargo(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Observaciones Adicionales / Garantía
              </label>
              <Input
                placeholder="Ej. Garantía 30 días, equipo probado con carga continua"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          {/* ========================================================= */}
          {/* BOTONES PRINCIPALES DE ACCIÓN                              */}
          {/* ========================================================= */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsCreateOpen(false);
                resetForm();
              }}
              className="w-full sm:w-auto text-xs"
            >
              Cancelar
            </Button>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                isLoading={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
                className="flex-1 sm:flex-none text-xs border-slate-300 text-slate-700 dark:text-slate-300"
              >
                Solo Guardar Ficha
              </Button>

              <Button
                type="button"
                onClick={handleProcederAFacturacion}
                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-5 shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>
                  Proceder a Facturación ($
                  {(totalAceptado > 0 ? totalAceptado : Number(precioChequeo)).toFixed(2)})
                </span>
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL: VER / IMPRIMIR FICHA TÉCNICA OFICIAL               */}
      {/* ========================================================= */}
      <Modal
        isOpen={!!viewingReporte}
        onClose={() => setViewingReporte(null)}
        title="Ficha Técnica & Comprobante de Taller"
        maxWidth="3xl"
      >
        {viewingReporte && (
          <div className="space-y-6">
            <div id="ficha-tecnica-imprimible" className="p-6 bg-white text-slate-900 rounded-xl border border-slate-200 space-y-5">
              {/* Header Comprobante */}
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h3 className="font-black text-lg text-slate-900 tracking-wide">
                    TECNISHOP - FICHA TÉCNICA
                  </h3>
                  <p className="text-xs text-slate-500">Taller Especializado en Reparación & Soporte</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-base text-[#3498db]">
                    Orden: #{viewingReporte.orden?.numero_orden || (viewingReporte.orden_id ? String(viewingReporte.orden_id).slice(0, 8) : 'S/N')}
                  </p>
                  <p className="text-xs text-slate-400">
                    Fecha: {new Date(viewingReporte.fecha_creacion).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Banner de Factura Emitida si ya existe */}
              {(viewingReporte.esta_facturado || viewingReporte.factura) && (
                <div className="p-3.5 bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                        Factura Emitida: {viewingReporte.factura?.numero_factura || 'Comprobante Registrado'}
                        <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 font-bold rounded">PAGADA</span>
                      </p>
                      <p className="text-[11px] text-blue-700 dark:text-blue-300">
                        Total facturado: ${Number(viewingReporte.factura?.total || viewingReporte.total_aceptado || 0).toFixed(2)} &bull; Registrado en ventas
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      const f = viewingReporte.factura;
                      const repId = viewingReporte.id;
                      setViewingReporte(null);
                      handleOpenFacturaPrint(f, repId);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 px-3 flex items-center gap-1 font-semibold"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Imprimir Factura
                  </Button>
                </div>
              )}

              {/* Alerta de Cotización Incompleta (Admin) */}
              {!viewingReporte.esta_facturado && !viewingReporte.factura && Number(viewingReporte.total_aceptado || 0) > 0 && !viewingReporte.cotizacion_completada && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div>
                      <p className="font-bold text-amber-950 dark:text-amber-200">
                        Admin debe llenar campos faltantes en cotización
                      </p>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300">
                        Debes asignar proveedor y costo de adquisición a los repuestos cotizados antes de poder facturar este informe.
                      </p>
                    </div>
                  </div>
                  {onNavigate && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setViewingReporte(null);
                        onNavigate('cotizaciones');
                      }}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-sm"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      <span>Ir a Cotizaciones</span>
                    </Button>
                  )}
                </div>
              )}

              {/* Datos de Cliente y Equipo */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg">
                <div>
                  <p className="font-bold text-slate-700 mb-1">DATOS DEL CLIENTE:</p>
                  <p><span className="font-semibold">Nombre:</span> {getReporteCliente(viewingReporte)?.nombre} {getReporteCliente(viewingReporte)?.apellido || ''}</p>
                  <p><span className="font-semibold">Cédula/RUC:</span> {getReporteCliente(viewingReporte)?.ci || 'N/A'}</p>
                  <p><span className="font-semibold">Teléfono:</span> {getReporteCliente(viewingReporte)?.telefono || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-700 mb-1">DATOS DEL DISPOSITIVO:</p>
                  <p><span className="font-semibold">Dispositivo:</span> {getReporteEquipo(viewingReporte)?.nombre}</p>
                  <p><span className="font-semibold">Marca / Modelo:</span> {getReporteEquipo(viewingReporte)?.marca} {getReporteEquipo(viewingReporte)?.modelo}</p>
                  <p><span className="font-semibold">Nº Serie:</span> {getReporteEquipo(viewingReporte)?.numero_serie || 'N/A'}</p>
                </div>
              </div>

              {/* Diagnóstico Técnico Real */}
              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 text-xs space-y-1">
                <p className="font-bold text-blue-900 uppercase">Diagnóstico Técnico Detectado:</p>
                <p className="text-slate-800 whitespace-pre-line">
                  {viewingReporte.diagnostico_problemas || 'Revisión general efectuada sin anomalías críticas adicionales.'}
                </p>
              </div>

              {/* Detalle de Cotización */}
              <div className="space-y-3">
                <p className="font-bold text-xs uppercase text-slate-700">Detalle de Cotización & Servicios:</p>
                <table className="w-full text-xs text-left border border-slate-200">
                  <thead className="bg-slate-100 text-slate-600 font-bold border-b">
                    <tr>
                      <th className="p-2">Concepto / Descripción</th>
                      <th className="p-2">Tipo</th>
                      <th className="p-2">Estado</th>
                      <th className="p-2 text-right">Precio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(viewingReporte.trabajos_realizados || []).map((t, idx) => (
                      <tr key={'t-' + idx}>
                        <td className="p-2 font-medium">{t.descripcion}</td>
                        <td className="p-2 text-slate-500">Mano de Obra</td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            t.estado === 'COTIZADO' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {t.estado === 'COTIZADO' ? 'Aceptado' : 'Rechazado'}
                          </span>
                        </td>
                        <td className="p-2 text-right font-mono font-bold">${Number(t.costo).toFixed(2)}</td>
                      </tr>
                    ))}
                    {(viewingReporte.repuestos_utilizados || []).map((r, idx) => (
                      <tr key={'r-' + idx}>
                        <td className="p-2 font-medium">{r.nombre_repuesto} (x{r.cantidad})</td>
                        <td className="p-2 text-slate-500">Repuesto</td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            r.estado === 'COTIZADO' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {r.estado === 'COTIZADO' ? 'Aceptado' : 'Rechazado'}
                          </span>
                        </td>
                        <td className="p-2 text-right font-mono font-bold">
                          ${(Number(r.cantidad || 1) * Number(r.precio_unitario || 0)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Chequeo de Respaldo */}
              <div className="p-2.5 rounded-lg bg-slate-100 text-xs flex justify-between items-center">
                <span>
                  <strong>Servicio de Chequeo Técnico:</strong>{' '}
                  {Number(viewingReporte.total_aceptado || 0) > 0 ? 'BONIFICADO (Cliente aprobó cotización)' : 'Aplicable por rechazo'}
                </span>
                <span className="font-mono font-bold">
                  {Number(viewingReporte.total_aceptado || 0) > 0 ? '$0.00' : `$${Number(viewingReporte.precio_chequeo || 10).toFixed(2)}`}
                </span>
              </div>

              {/* Totales */}
              <div className="text-right space-y-1 text-xs border-t pt-3">
                <p>
                  Total Aprobado por Cliente:{' '}
                  <span className="font-bold font-mono text-emerald-600 text-sm">
                    ${Number(viewingReporte.total_aceptado || 0).toFixed(2)}
                  </span>
                </p>
                {Number(viewingReporte.total_rechazado || 0) > 0 && (
                  <p className="text-rose-500">
                    Total Rechazado: <span className="font-mono">${Number(viewingReporte.total_rechazado).toFixed(2)}</span>
                  </p>
                )}
              </div>

              {/* Firmas */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                <div>
                  <div className="border-t border-slate-300 pt-1">
                    <p className="font-bold">{viewingReporte.persona_a_cargo || 'Técnico Responsable'}</p>
                    <p className="text-slate-400">Técnico Especialista</p>
                  </div>
                </div>
                <div>
                  <div className="border-t border-slate-300 pt-1">
                    <p className="font-bold">{getReporteCliente(viewingReporte)?.nombre || 'Cliente'}</p>
                    <p className="text-slate-400">Conformidad de Servicio</p>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp Feedback Banner */}
            {informeWhatsAppFeedback && (
              <div
                className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  informeWhatsAppFeedback.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {informeWhatsAppFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{informeWhatsAppFeedback.message}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setViewingReporte(null)}
                className="text-xs"
              >
                Cerrar
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleSendInformeWhatsApp(viewingReporte)}
                  disabled={sendingInformeWhatsApp}
                  className="bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-[#25D366]/20 transition-all"
                  title="Enviar informe técnico al WhatsApp del cliente"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 text-white" />
                  <span>{sendingInformeWhatsApp ? 'Enviando...' : 'Enviar por WhatsApp'}</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    const el = document.getElementById('ficha-tecnica-imprimible');
                    if (el) {
                      window.print();
                    }
                  }}
                  className="text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Ficha</span>
                </Button>

                {viewingReporte.esta_facturado || viewingReporte.factura ? (
                  <Button
                    onClick={() => {
                      const f = viewingReporte.factura;
                      const repId = viewingReporte.id;
                      setViewingReporte(null);
                      handleOpenFacturaPrint(f, repId);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                  >
                    <Printer className="w-4 h-4" />
                    <span>
                      Imprimir Factura ({viewingReporte.factura?.numero_factura || 'Emitida'})
                    </span>
                  </Button>
                ) : Number(viewingReporte.total_aceptado || 0) > 0 && !viewingReporte.cotizacion_completada ? (
                  <Button
                    onClick={() => {
                      if (onNavigate) {
                        setViewingReporte(null);
                        onNavigate('cotizaciones');
                      }
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                    title="Admin debe llenar campos faltantes en cotización"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Admin debe llenar campos faltantes en cotización</span>
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleFacturarDesdeVista(viewingReporte)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Proceder a Facturación</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Bloqueante de Validación: Productos / Servicios Incompletos */}
      {incompleteItemsError && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800/60 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn">
            <div className="p-6 bg-gradient-to-b from-amber-50 dark:from-amber-950/20 to-transparent border-b border-amber-100 dark:border-amber-900/40">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    No se puede emitir esta factura si hay productos o servicios que faltan por completar
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Se detectaron los siguientes ítems de la cotización aceptada pendientes de rellenar o completar:
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 max-h-72 overflow-y-auto space-y-2.5">
              {incompleteItemsError.map((errText, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200"
                >
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="font-medium leading-relaxed">{errText}</span>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              {onNavigate ? (
                <Button
                  onClick={() => {
                    setIncompleteItemsError(null);
                    onNavigate('cotizaciones');
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-1.5"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Ir a Cotizaciones (Admin)</span>
                </Button>
              ) : <div />}
              <Button
                onClick={() => setIncompleteItemsError(null)}
                variant="outline"
                className="text-xs px-5 py-2 rounded-xl"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Impresión de Factura Asociada */}
      <FacturaPrintModal
        isOpen={isFacturaModalOpen}
        venta={facturaParaImprimir}
        onClose={() => {
          setIsFacturaModalOpen(false);
          setFacturaParaImprimir(null);
        }}
      />
    </div>
  );
};
