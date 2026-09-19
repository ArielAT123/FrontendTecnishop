import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { api } from '../../api/client';
import { Reporte, Orden, TrabajoRealizado, RepuestoUtilizado, OrdenesPaginadasResponse, CATALOGO_ESTADOS_ORDEN } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
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
} from 'lucide-react';

interface ReportesPageProps {
  selectedOrder?: Orden | null;
  onClearSelectedOrder?: () => void;
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

  // Debounced suggestion fetch
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

  // Click outside listener
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

export const ReportesPage: React.FC<ReportesPageProps> = ({ selectedOrder, onClearSelectedOrder }) => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingReporte, setViewingReporte] = useState<Reporte | null>(null);

  // Main Page View & Search State
  const [viewMode, setViewMode] = useState<'tabla' | 'equipos'>('tabla');
  const [reportesSearch, setReportesSearch] = useState('');
  const [expandedEquipos, setExpandedEquipos] = useState<Record<string, boolean>>({});

  // Form State
  const [ordenId, setOrdenId] = useState<string>('');
  const [personaACargo, setPersonaACargo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [trabajos, setTrabajos] = useState<TrabajoRealizado[]>([
    { descripcion: '', costo: 0 },
  ]);
  const [repuestos, setRepuestos] = useState<RepuestoUtilizado[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Order Search & Filter State
  type DatePreset = 'TODAS' | 'HOY' | 'SEMANA' | 'MES' | 'SEMESTRE' | 'ANIO' | 'PERSONALIZADA';
  const [ordenSearch, setOrdenSearch] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('TODAS');
  const [datePreset, setDatePreset] = useState<DatePreset>('TODAS');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [soloSinInforme, setSoloSinInforme] = useState(true);

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
    } else if (preset === 'PERSONALIZADA') {
      // Mantiene las fechas actuales o permite configurarlas
    }
  };

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

  // Set of Order IDs that already have an emitted report (1:1 rule)
  const reportedOrderIds = useMemo(() => {
    const ids = new Set<string>();
    reportes.forEach((r: any) => {
      const oid = r.orden_id?.id || r.orden?.id || r.orden_id;
      if (oid) ids.add(String(oid));
    });
    return ids;
  }, [reportes]);

  // Helper to normalize text for search (ignoring accents, uppercase and whitespace)
  const normalizeSearch = (text: string) =>
    (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const getReporteEquipo = (rep: Reporte) => {
    return rep.orden?.equipo;
  };

  const getReporteCliente = (rep: Reporte) => {
    const eq = rep.orden?.equipo;
    if (eq?.cliente) return eq.cliente;
    if ((eq as any)?.cliente_ci && typeof (eq as any).cliente_ci === 'object') {
      return (eq as any).cliente_ci;
    }
    return undefined;
  };

  // Filtrado de reportes por buscador universal
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
          cli?.correo,
          rep.orden?.numero_orden,
          rep.persona_a_cargo,
          rep.observaciones,
          rep.id,
        ]
          .filter(Boolean)
          .join(' ')
      );

      return searchTokens.every((token) => searchableBlob.includes(token));
    });
  }, [reportes, reportesSearch]);

  // Agrupamiento de reportes por equipo físico
  const groupedByEquipo = useMemo(() => {
    const map = new Map<
      string,
      {
        equipoKey: string;
        equipo: {
          id?: string;
          nombre?: string;
          marca?: string;
          modelo?: string;
          numero_serie?: string;
        };
        cliente: {
          ci?: string;
          nombre?: string;
          apellido?: string;
          telefono?: string;
          correo?: string;
        };
        reportes: Reporte[];
        counts: {
          totalReportes: number;
          totalGeneral: number;
          totalTrabajos: number;
          totalRepuestos: number;
        };
      }
    >();

    filteredReportes.forEach((rep) => {
      const eq = getReporteEquipo(rep);
      const cli = getReporteCliente(rep);

      const eqKey = eq?.id
        ? String(eq.id)
        : eq?.numero_serie
        ? `sn_${eq.numero_serie}`
        : eq?.nombre || eq?.marca || eq?.modelo
        ? `model_${eq.nombre || ''}_${eq.marca || ''}_${eq.modelo || ''}`
        : `sin_equipo_${rep.id}`;

      if (!map.has(eqKey)) {
        map.set(eqKey, {
          equipoKey: eqKey,
          equipo: {
            id: eq?.id,
            nombre: eq?.nombre || 'Equipo / Dispositivo',
            marca: eq?.marca || '',
            modelo: eq?.modelo || '',
            numero_serie: eq?.numero_serie || '',
          },
          cliente: {
            ci: cli?.ci ? String(cli.ci) : undefined,
            nombre: cli?.nombre || 'Cliente Mostrador / Sin Asignar',
            apellido: cli?.apellido || '',
            telefono: cli?.telefono || '',
            correo: cli?.correo || '',
          },
          reportes: [],
          counts: {
            totalReportes: 0,
            totalGeneral: 0,
            totalTrabajos: 0,
            totalRepuestos: 0,
          },
        });
      }

      const group = map.get(eqKey)!;
      group.reportes.push(rep);
      group.counts.totalReportes += 1;
      group.counts.totalTrabajos += Number(rep.total_trabajos || 0);
      group.counts.totalRepuestos += Number(rep.total_repuestos || 0);
      group.counts.totalGeneral += Number(rep.total_general || 0);
    });

    return Array.from(map.values()).sort((a, b) => {
      if (b.counts.totalReportes !== a.counts.totalReportes) {
        return b.counts.totalReportes - a.counts.totalReportes;
      }
      return (a.equipo.nombre || '').localeCompare(b.equipo.nombre || '');
    });
  }, [filteredReportes]);

  const toggleEquipo = (equipoKey: string) => {
    setExpandedEquipos((prev) => ({
      ...prev,
      [equipoKey]: prev[equipoKey] === undefined ? false : !prev[equipoKey],
    }));
  };

  const toggleAllEquipos = (expand: boolean) => {
    const next: Record<string, boolean> = {};
    groupedByEquipo.forEach((g) => {
      next[g.equipoKey] = expand;
    });
    setExpandedEquipos(next);
  };

  // If selectedOrder was provided from props, initialize and clear
  useEffect(() => {
    if (selectedOrder) {
      setOrdenId(selectedOrder.id);
      if (selectedOrder.realiza_orden) {
        setPersonaACargo(selectedOrder.realiza_orden);
      }
      setIsCreateOpen(true);
      onClearSelectedOrder?.();
    }
  }, [selectedOrder, onClearSelectedOrder]);

  // Asegurar re-obtención de órdenes frescas al abrir el modal
  useEffect(() => {
    if (isCreateOpen) {
      refetchOrdenes();
    }
  }, [isCreateOpen, refetchOrdenes]);

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.createReporte(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
      queryClient.invalidateQueries({ queryKey: ['ordenes'] });
      queryClient.invalidateQueries({ queryKey: ['ordenes-for-reports'] });
      setIsCreateOpen(false);
      resetForm();
      setViewingReporte(data);
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.errors || err.message || 'Error al crear el informe');
    },
  });

  const resetForm = () => {
    setOrdenId('');
    setPersonaACargo('');
    setObservaciones('');
    setTrabajos([{ descripcion: '', costo: 0 }]);
    setRepuestos([]);
    setFormError(null);
    setOrdenSearch('');
    setEstadoFiltro('TODAS');
    setDatePreset('TODAS');
    setFechaDesde('');
    setFechaHasta('');
    setSoloSinInforme(true);
  };

  // Find currently selected order object
  const currentSelectedOrden = useMemo(() => {
    if (!ordenId) return null;
    return (ordenesData?.ordenes || []).find((o) => o.id === ordenId) || null;
  }, [ordenId, ordenesData]);

  // Tolerant order status matching based on official catalog
  const matchEstadoOrden = (ordenEstado: string | undefined, filtro: string) => {
    if (filtro === 'TODAS' || !filtro) return true;
    const oe = (ordenEstado || '').trim().toUpperCase();
    const f = filtro.trim().toUpperCase();
    if (oe === f) return true;
    if ((f === 'COMPLETADO' || f === 'COMPLETADA') && (oe === 'COMPLETADO' || oe === 'COMPLETADA')) return true;
    if ((f === 'COBRADO' || f === 'COBRADA') && (oe === 'COBRADO' || oe === 'COBRADA')) return true;
    if ((f === 'CANCELADO' || f === 'CANCELADA') && (oe === 'CANCELADO' || oe === 'CANCELADA')) return true;
    if ((f === 'EN_PROCESO' || f === 'EN PROCESO') && (oe === 'EN_PROCESO' || oe === 'EN PROCESO')) return true;
    return false;
  };

  // Filtered orders list for the modal selector
  const availableFilteredOrdenes = useMemo(() => {
    const list = ordenesData?.ordenes || [];
    return list.filter((o) => {
      const hasReport = Boolean(o.tiene_ficha_tecnica || reportedOrderIds.has(o.id));
      if (soloSinInforme && hasReport) return false;

      if (!matchEstadoOrden(o.estado, estadoFiltro)) return false;

      if (fechaDesde && o.fecha < fechaDesde) return false;
      if (fechaHasta && o.fecha > fechaHasta) return false;

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
  }, [ordenesData, reportedOrderIds, soloSinInforme, estadoFiltro, fechaDesde, fechaHasta, ordenSearch]);

  // Math totals
  const totalTrabajos = trabajos.reduce((sum, t) => sum + (parseFloat(String(t.costo)) || 0), 0);
  const totalRepuestos = repuestos.reduce(
    (sum, r) => sum + (parseInt(String(r.cantidad)) || 0) * (parseFloat(String(r.precio_unitario)) || 0),
    0
  );
  const totalGeneral = totalTrabajos + totalRepuestos;

  const handleSelectOrden = (o: Orden) => {
    setOrdenId(o.id);
    if (o.realiza_orden) {
      setPersonaACargo(o.realiza_orden);
    }
    setFormError(null);
  };

  const handleAddTrabajo = () => {
    setTrabajos([...trabajos, { descripcion: '', costo: 0 }]);
  };

  const handleRemoveTrabajo = (idx: number) => {
    setTrabajos(trabajos.filter((_, i) => i !== idx));
  };

  const handleAddRepuesto = () => {
    setRepuestos([...repuestos, { nombre_repuesto: '', cantidad: 1, precio_unitario: 0 }]);
  };

  const handleRemoveRepuesto = (idx: number) => {
    setRepuestos(repuestos.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ordenId) {
      setFormError('Debes seleccionar una orden de trabajo para generar el informe');
      return;
    }

    const validTrabajos = trabajos.filter((t) => t.descripcion.trim().length > 0);
    const validRepuestos = repuestos.filter((r) => r.nombre_repuesto.trim().length > 0);

    createMutation.mutate({
      orden_id: ordenId,
      persona_a_cargo: personaACargo,
      observaciones,
      trabajos_realizados: validTrabajos,
      repuestos_utilizados: validRepuestos,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Informes Técnicos</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Liquidación de mano de obra y repuestos aplicados por orden de servicio
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Universal Search Bar */}
          <div className="w-full sm:w-80">
            <Input
              placeholder="Buscar por equipo, modelo, cliente, CI, cel..."
              value={reportesSearch}
              onChange={(e) => setReportesSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Segmented View Mode Switcher */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-inner">
            <button
              type="button"
              onClick={() => setViewMode('tabla')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'tabla'
                  ? 'bg-white dark:bg-slate-900 text-[#3498db] shadow-sm border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Ver en tabla plana clásica"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Tabla Plana</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('equipos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'equipos'
                  ? 'bg-white dark:bg-slate-900 text-[#3498db] shadow-sm border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Agrupar informes por equipo"
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Por Equipos</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/10 text-[#3498db] font-bold">
                {groupedByEquipo.length}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#3498db] hover:bg-[#2980b9] text-white shadow-md shadow-[#3498db]/30 transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nuevo Informe Técnico</span>
          </button>
        </div>
      </div>

      {/* Main View: Flat Table OR Grouped by Equipment */}
      {viewMode === 'tabla' ? (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-[#3498db]" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Informes Emitidos ({filteredReportes.length})
            </h3>
          </div>

          {isLoading && filteredReportes.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">Cargando informes técnicos...</div>
          ) : filteredReportes.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              {reportesSearch
                ? 'No se encontraron informes que coincidan con la búsqueda.'
                : 'No se han generado informes técnicos todavía.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="pb-3 pl-2">Fecha</th>
                    <th className="pb-3">Nº Orden</th>
                    <th className="pb-3">Cliente</th>
                    <th className="pb-3">Técnico a Cargo</th>
                    <th className="pb-3 text-right">Mano de Obra</th>
                    <th className="pb-3 text-right">Repuestos</th>
                    <th className="pb-3 text-right">Total General</th>
                    <th className="pb-3 pr-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredReportes.map((rep) => {
                    const numOrden = rep.orden?.numero_orden || (rep.orden_id ? String(rep.orden_id).slice(0, 8) : 'S/N');
                    const clienteNombre = rep.orden?.equipo?.cliente
                      ? `${rep.orden.equipo.cliente.nombre} ${rep.orden.equipo.cliente.apellido || ''}`
                      : 'N/A';
                    return (
                      <tr
                        key={rep.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3 pl-2 text-slate-500 dark:text-slate-400">
                          {new Date(rep.fecha_creacion).toLocaleDateString()}
                        </td>
                        <td className="py-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                          #{numOrden}
                        </td>
                        <td className="py-3 font-medium text-slate-900 dark:text-slate-100">
                          {clienteNombre}
                        </td>
                        <td className="py-3 text-slate-600 dark:text-slate-300">
                          {rep.persona_a_cargo || 'Sin asignar'}
                        </td>
                        <td className="py-3 text-right font-mono text-slate-600 dark:text-slate-300">
                          ${Number(rep.total_trabajos || 0).toFixed(2)}
                        </td>
                        <td className="py-3 text-right font-mono text-slate-600 dark:text-slate-300">
                          ${Number(rep.total_repuestos || 0).toFixed(2)}
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-[#3498db]">
                          ${Number(rep.total_general || 0).toFixed(2)}
                        </td>
                        <td className="py-3 pr-2 text-right">
                          <button
                            type="button"
                            onClick={() => setViewingReporte(rep)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver / Imprimir</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (
        /* Vista Agrupada por Equipos */
        <div className="space-y-4">
          {/* Toolbar de Vista por Equipos */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-slate-100">{groupedByEquipo.length}</span>{' '}
              {groupedByEquipo.length === 1 ? 'Equipo con' : 'Equipos con'}{' '}
              <span className="font-bold text-slate-800 dark:text-slate-100">{filteredReportes.length}</span>{' '}
              {filteredReportes.length === 1 ? 'informe técnico' : 'informes técnicos'}
            </div>

            {groupedByEquipo.length > 0 && (
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => toggleAllEquipos(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3498db] hover:underline"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Expandir Todos</span>
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => toggleAllEquipos(false)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:underline"
                >
                  <Minimize2 className="w-3 h-3" />
                  <span>Colapsar Todos</span>
                </button>
              </div>
            )}
          </div>

          {isLoading && filteredReportes.length === 0 ? (
            <Card className="p-12 text-center text-xs text-slate-400">Cargando equipos e informes...</Card>
          ) : filteredReportes.length === 0 ? (
            <Card className="p-12 text-center text-xs text-slate-400">
              {reportesSearch
                ? 'No se encontraron equipos ni informes que coincidan con la búsqueda.'
                : 'No hay informes técnicos registrados aún.'}
            </Card>
          ) : (
            <div className="space-y-3">
              {groupedByEquipo.map((group) => {
                const isExpanded = expandedEquipos[group.equipoKey] ?? true;

                return (
                  <div
                    key={group.equipoKey}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                  >
                    {/* Header Bar (Clickable) */}
                    <div
                      onClick={() => toggleEquipo(group.equipoKey)}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer bg-gradient-to-r from-slate-50/70 via-white to-slate-50/40 dark:from-slate-850/80 dark:via-slate-900 dark:to-slate-850/80 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 select-none transition-colors"
                    >
                      {/* Left: Device Icon & Equipment/Client Info */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#3498db] to-[#2980b9] text-white flex items-center justify-center shadow-md shadow-[#3498db]/25 shrink-0">
                          <Laptop className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                              {group.equipo.nombre}
                              {group.equipo.marca ? ` • ${group.equipo.marca}` : ''}
                              {group.equipo.modelo ? ` ${group.equipo.modelo}` : ''}
                            </h4>
                            {group.equipo.numero_serie && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                S/N: {group.equipo.numero_serie}
                              </span>
                            )}
                          </div>

                          {/* Client / Owner details */}
                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                            <div className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                              <User className="w-3.5 h-3.5 text-[#3498db]" />
                              <span>{group.cliente.nombre} {group.cliente.apellido}</span>
                            </div>
                            {group.cliente.ci && (
                              <span className="font-mono text-[11px] text-slate-500">
                                CI: {group.cliente.ci}
                              </span>
                            )}
                            {group.cliente.telefono && (
                              <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{group.cliente.telefono}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Badges & Chevron */}
                      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold">
                          {group.counts.totalReportes} {group.counts.totalReportes === 1 ? 'Informe' : 'Informes'}
                        </span>

                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>${group.counts.totalGeneral.toFixed(2)} Facturado</span>
                        </span>

                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 ml-1">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Subtable of Equipment Reports */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 dark:border-slate-800 overflow-x-auto bg-slate-50/30 dark:bg-slate-900/30">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50/80 dark:bg-slate-850/60 border-b border-slate-200/70 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                            <tr>
                              <th className="py-2.5 px-4 whitespace-nowrap min-w-[120px]">Fecha</th>
                              <th className="py-2.5 px-3 whitespace-nowrap min-w-[180px]">Nº Orden</th>
                              <th className="py-2.5 px-3 min-w-[150px]">Técnico a Cargo</th>
                              <th className="py-2.5 px-3 text-right whitespace-nowrap min-w-[110px]">Mano de Obra</th>
                              <th className="py-2.5 px-3 text-right whitespace-nowrap min-w-[110px]">Repuestos</th>
                              <th className="py-2.5 px-3 text-right whitespace-nowrap min-w-[110px]">Total General</th>
                              <th className="py-2.5 px-4 text-right whitespace-nowrap min-w-[110px]">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium bg-white dark:bg-slate-900">
                            {group.reportes.map((rep) => {
                              const numOrden = rep.orden?.numero_orden || (rep.orden_id ? String(rep.orden_id).slice(0, 8) : 'S/N');
                              return (
                                <tr
                                  key={rep.id}
                                  className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                                >
                                  <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                    {new Date(rep.fecha_creacion).toLocaleDateString()}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                    #{numOrden}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                                    {rep.persona_a_cargo || 'Sin asignar'}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                                    ${Number(rep.total_trabajos || 0).toFixed(2)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                                    ${Number(rep.total_repuestos || 0).toFixed(2)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-[#3498db]">
                                    ${Number(rep.total_general || 0).toFixed(2)}
                                  </td>
                                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => setViewingReporte(rep)}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Ver / Imprimir</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: GENERAR NUEVO INFORME TÉCNICO                      */}
      {/* ========================================================= */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          resetForm();
        }}
        title="Generar Nuevo Informe Técnico"
        maxWidth="3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* SELECCIÓN Y FILTRADO AVANZADO DE ÓRDENES                  */}
          {/* ========================================================= */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#3498db]" />
                <span>Orden de Trabajo / Ficha Técnica (1:1) *</span>
              </label>

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
              /* Tarjeta de Orden Seleccionada */
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-500/30 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#3498db]">
                      #{currentSelectedOrden.numero_orden || currentSelectedOrden.id.slice(0, 8)}
                    </span>
                    <span className="text-xs text-slate-400">
                      Fecha: {currentSelectedOrden.fecha}
                    </span>
                  </div>
                  <Badge status={currentSelectedOrden.estado} className="text-[10px] py-0.5 px-2 font-bold">
                    {currentSelectedOrden.estado}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border-t border-slate-100 dark:border-slate-800 pt-2">
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-semibold">Cliente:</p>
                    <p className="font-bold text-slate-800 dark:text-slate-100">
                      {currentSelectedOrden.equipo?.cliente?.nombre}{' '}
                      {currentSelectedOrden.equipo?.cliente?.apellido || ''}
                    </p>
                    <p className="text-slate-500 font-mono text-[11px]">
                      Tel: {currentSelectedOrden.equipo?.cliente?.telefono || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-semibold">Dispositivo / Equipo:</p>
                    <p className="font-bold text-slate-800 dark:text-slate-100">
                      {currentSelectedOrden.equipo?.nombre} ({currentSelectedOrden.equipo?.marca}{' '}
                      {currentSelectedOrden.equipo?.modelo || ''})
                    </p>
                    <p className="text-slate-500 font-mono text-[11px]">
                      Serie: {currentSelectedOrden.equipo?.numero_serie || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Panel de Búsqueda y Filtros de Órdenes */
              <div className="space-y-3">
                {/* Search & Selectable Dropdowns Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Buscar orden por número, cliente o equipo..."
                      value={ordenSearch}
                      onChange={(e) => setOrdenSearch(e.target.value)}
                      leftIcon={<Search className="w-4 h-4" />}
                    />
                  </div>

                  {/* Selectable de Estado */}
                  <select
                    value={estadoFiltro}
                    onChange={(e) => setEstadoFiltro(e.target.value)}
                    className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs py-2.5 px-3 font-semibold focus:outline-none focus:ring-2 focus:ring-[#3498db]/40 cursor-pointer shadow-sm"
                  >
                    <option value="TODAS">Todos los Estados</option>
                    {CATALOGO_ESTADOS_ORDEN.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.label}
                      </option>
                    ))}
                  </select>

                  {/* Selectable de Período */}
                  <select
                    value={datePreset}
                    onChange={(e) => handleDatePreset(e.target.value as DatePreset)}
                    className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs py-2.5 px-3 font-semibold focus:outline-none focus:ring-2 focus:ring-[#3498db]/40 cursor-pointer shadow-sm"
                  >
                    <option value="TODAS">Todas las fechas</option>
                    <option value="HOY">Último día (Hoy)</option>
                    <option value="SEMANA">Última semana</option>
                    <option value="MES">Mes actual</option>
                    <option value="SEMESTRE">Semestre</option>
                    <option value="ANIO">Año</option>
                    <option value="PERSONALIZADA">Configurar fecha...</option>
                  </select>
                </div>

                {/* Sub-bar: Checkbox & Count */}
                <div className="flex items-center justify-between gap-2 px-1 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 text-xs select-none">
                    <input
                      type="checkbox"
                      checked={soloSinInforme}
                      onChange={(e) => setSoloSinInforme(e.target.checked)}
                      className="rounded border-slate-400 text-[#3498db] focus:ring-[#3498db]"
                    />
                    <span className="font-medium">Solo órdenes sin informe emitido</span>
                  </label>

                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                    {availableFilteredOrdenes.length} orden{availableFilteredOrdenes.length === 1 ? '' : 'es'} disponible{availableFilteredOrdenes.length === 1 ? '' : 's'}
                  </span>
                </div>

                {/* Panel Configurar Fecha Personalizada */}
                {datePreset === 'PERSONALIZADA' && (
                  <div className="flex flex-wrap items-center gap-2.5 p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-xs animate-fadeIn">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-[#3498db]" />
                      <span>Desde:</span>
                    </div>
                    <input
                      type="date"
                      value={fechaDesde}
                      onChange={(e) => setFechaDesde(e.target.value)}
                      className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#3498db]/40"
                    />
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      <span>Hasta:</span>
                    </div>
                    <input
                      type="date"
                      value={fechaHasta}
                      onChange={(e) => setFechaHasta(e.target.value)}
                      className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#3498db]/40"
                    />
                    {(fechaDesde || fechaHasta) && (
                      <button
                        type="button"
                        onClick={() => {
                          setFechaDesde('');
                          setFechaHasta('');
                        }}
                        className="px-2 py-0.5 rounded-md text-[11px] text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors font-semibold flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        <span>Limpiar</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Available Orders List */}
                <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700/80 divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {availableFilteredOrdenes.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No se encontraron órdenes con los filtros seleccionados.
                    </div>
                  ) : (
                    availableFilteredOrdenes.map((o) => {
                      const hasReport = Boolean(o.tiene_ficha_tecnica || reportedOrderIds.has(o.id));
                      return (
                        <div
                          key={o.id}
                          className={`p-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                            hasReport ? 'opacity-70 bg-slate-50/50 dark:bg-slate-900/50 border-l-2 border-emerald-500' : ''
                          }`}
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
                              {hasReport && (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                  Ficha Técnica Lista
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-800 dark:text-slate-200 truncate">
                              <span className="font-bold">
                                {o.equipo?.cliente?.nombre || (o.equipo as any)?.cliente_ci?.nombre} {o.equipo?.cliente?.apellido || (o.equipo as any)?.cliente_ci?.apellido || ''}
                              </span>{' '}
                              &bull; {o.equipo?.marca} {o.equipo?.modelo || o.equipo?.nombre}
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={hasReport}
                            onClick={() => handleSelectOrden(o)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                              hasReport
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                                : 'bg-[#3498db] hover:bg-[#2980b9] text-white shadow-sm'
                            }`}
                          >
                            {hasReport ? 'Con Informe' : 'Seleccionar'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Técnico a Cargo (Auto-filled from order, but editable) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Técnico Responsable / A Cargo
            </label>
            <Input
              placeholder="Nombre del técnico responsable"
              value={personaACargo}
              onChange={(e) => setPersonaACargo(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
            />
          </div>

          {/* ========================================================= */}
          {/* SECCIÓN 1: TRABAJOS REALIZADOS CON AUTOCOMPLETADO         */}
          {/* ========================================================= */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  1. Trabajos Realizados / Mano de Obra
                </h4>
                <p className="text-[10px] text-slate-400">
                  Escribe para ver sugerencias automáticas de trabajos y costos frecuentes
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddTrabajo}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[#3498db] hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                + Agregar Trabajo
              </button>
            </div>

            {trabajos.map((t, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <AutocompleteInput
                  placeholder="Descripción del trabajo (ej. Limpieza y cambio de pasta térmica)"
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

                <div className="w-28">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Costo"
                    value={t.costo}
                    onChange={(e) => {
                      const newT = [...trabajos];
                      newT[idx].costo = parseFloat(e.target.value) || 0;
                      setTrabajos(newT);
                    }}
                    leftIcon={<DollarSign className="w-3.5 h-3.5" />}
                  />
                </div>

                {trabajos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTrabajo(idx)}
                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                    title="Eliminar fila"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            <div className="text-right text-xs font-bold text-slate-600 dark:text-slate-300">
              Subtotal Mano de Obra: <span className="font-mono text-[#3498db]">${totalTrabajos.toFixed(2)}</span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECCIÓN 2: REPUESTOS UTILIZADOS CON AUTOCOMPLETADO        */}
          {/* ========================================================= */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  2. Repuestos Utilizados
                </h4>
                <p className="text-[10px] text-slate-400">
                  Autocompletado de componentes instalados y último precio registrado
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddRepuesto}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[#3498db] hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                + Agregar Repuesto
              </button>
            </div>

            {repuestos.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No se agregaron repuestos a este informe.</p>
            ) : (
              repuestos.map((r, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <AutocompleteInput
                    placeholder="Repuesto o componente utilizado (ej. Disco SSD 480GB)"
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

                  <div className="w-20">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Cant."
                      value={r.cantidad}
                      onChange={(e) => {
                        const newR = [...repuestos];
                        newR[idx].cantidad = parseInt(e.target.value) || 1;
                        setRepuestos(newR);
                      }}
                    />
                  </div>

                  <div className="w-28">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="P. Unit"
                      value={r.precio_unitario}
                      onChange={(e) => {
                        const newR = [...repuestos];
                        newR[idx].precio_unitario = parseFloat(e.target.value) || 0;
                        setRepuestos(newR);
                      }}
                      leftIcon={<DollarSign className="w-3.5 h-3.5" />}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveRepuesto(idx)}
                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                    title="Eliminar repuesto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}

            {repuestos.length > 0 && (
              <div className="text-right text-xs font-bold text-slate-600 dark:text-slate-300">
                Subtotal Repuestos: <span className="font-mono text-[#3498db]">${totalRepuestos.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Observaciones / Garantía
            </label>
            <Input
              placeholder="Ej. Garantía de 30 días sobre componentes reemplazados"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </div>

          {/* Total Summary Box */}
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
            <span className="text-sm font-bold text-[#3498db]">TOTAL GENERAL A COBRAR:</span>
            <span className="text-xl font-black font-mono text-[#3498db]">
              ${totalGeneral.toFixed(2)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsCreateOpen(false);
                resetForm();
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#3498db] hover:bg-[#2980b9] shadow-md shadow-[#3498db]/30 transition-all disabled:opacity-50"
            >
              {createMutation.isPending ? 'Guardando...' : 'Guardar y Emitir Informe'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL DE IMPRESIÓN DEL COMPROBANTE TÉCNICO                */}
      {/* ========================================================= */}
      <Modal
        isOpen={!!viewingReporte}
        onClose={() => setViewingReporte(null)}
        title="Comprobante Técnico de Entrega"
        maxWidth="3xl"
      >
        {viewingReporte && (
          <div className="space-y-6">
            {/* Printable Area */}
            <div id="print-area" className="bg-white text-black p-8 rounded-xl border border-slate-300 space-y-6 text-xs font-sans">
              {/* Header */}
              <div className="border-b-2 border-black pb-4 flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-black tracking-tight">TECNISHOP</h1>
                  <p className="font-semibold text-gray-700">SERVICIO TÉCNICO ESPECIALIZADO</p>
                  <p className="text-[10px] text-gray-500">Reparación de Laptops, Computadoras y Equipos Electrónicos</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black font-mono">INFORME TÉCNICO</p>
                  <p className="text-xs font-bold text-gray-800">
                    Orden: #{viewingReporte.orden?.numero_orden || (viewingReporte.orden_id ? String(viewingReporte.orden_id).slice(0, 8) : 'S/N')}
                  </p>
                  <p className="text-[10px] text-gray-600">
                    Fecha: {new Date(viewingReporte.fecha_creacion).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Client & Device Info */}
              <div className="grid grid-cols-2 gap-4 border p-3 rounded border-gray-300 text-[11px]">
                <div>
                  <p className="font-bold text-gray-900 uppercase">Datos del Cliente:</p>
                  <p><span className="font-semibold">Nombre:</span> {viewingReporte.orden?.equipo?.cliente?.nombre} {viewingReporte.orden?.equipo?.cliente?.apellido}</p>
                  <p><span className="font-semibold">Cédula / RUC:</span> {viewingReporte.orden?.equipo?.cliente?.ci}</p>
                  <p><span className="font-semibold">Teléfono:</span> {viewingReporte.orden?.equipo?.cliente?.telefono || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900 uppercase">Datos del Equipo:</p>
                  <p><span className="font-semibold">Dispositivo:</span> {viewingReporte.orden?.equipo?.nombre}</p>
                  <p><span className="font-semibold">Marca / Modelo:</span> {viewingReporte.orden?.equipo?.marca} {viewingReporte.orden?.equipo?.modelo}</p>
                  <p><span className="font-semibold">Nº Serie:</span> {viewingReporte.orden?.equipo?.numero_serie || 'N/A'}</p>
                </div>
              </div>

              {/* Labor Tasks */}
              <div>
                <p className="font-bold text-gray-900 uppercase mb-1">Mano de Obra y Servicios Realizados:</p>
                <table className="w-full border-collapse border border-gray-300 text-[11px]">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-1.5 text-left">Descripción del Trabajo</th>
                      <th className="border border-gray-300 p-1.5 text-right w-24">Costo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingReporte.trabajos_realizados?.map((t, idx) => (
                      <tr key={idx}>
                        <td className="border border-gray-300 p-1.5">{t.descripcion}</td>
                        <td className="border border-gray-300 p-1.5 text-right font-mono">${Number(t.costo).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Spare Parts */}
              {viewingReporte.repuestos_utilizados && viewingReporte.repuestos_utilizados.length > 0 && (
                <div>
                  <p className="font-bold text-gray-900 uppercase mb-1">Repuestos y Componentes Instalados:</p>
                  <table className="w-full border-collapse border border-gray-300 text-[11px]">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-1.5 text-left">Repuesto</th>
                        <th className="border border-gray-300 p-1.5 text-center w-16">Cant.</th>
                        <th className="border border-gray-300 p-1.5 text-right w-24">P. Unit</th>
                        <th className="border border-gray-300 p-1.5 text-right w-24">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingReporte.repuestos_utilizados.map((r, idx) => (
                        <tr key={idx}>
                          <td className="border border-gray-300 p-1.5">{r.nombre_repuesto}</td>
                          <td className="border border-gray-300 p-1.5 text-center">{r.cantidad}</td>
                          <td className="border border-gray-300 p-1.5 text-right font-mono">${Number(r.precio_unitario).toFixed(2)}</td>
                          <td className="border border-gray-300 p-1.5 text-right font-mono font-semibold">
                            ${(Number(r.cantidad) * Number(r.precio_unitario)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Total Box */}
              <div className="flex justify-end">
                <div className="w-64 border border-black p-3 space-y-1 text-right text-[11px]">
                  <p className="flex justify-between">
                    <span>Mano de Obra:</span>
                    <span className="font-mono">${Number(viewingReporte.total_trabajos || 0).toFixed(2)}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Repuestos:</span>
                    <span className="font-mono">${Number(viewingReporte.total_repuestos || 0).toFixed(2)}</span>
                  </p>
                  <p className="flex justify-between font-bold text-sm border-t border-black pt-1">
                    <span>TOTAL GENERAL:</span>
                    <span className="font-mono">${Number(viewingReporte.total_general || 0).toFixed(2)}</span>
                  </p>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-12 grid grid-cols-2 gap-12 text-center text-[10px]">
                <div>
                  <div className="border-t border-black w-48 mx-auto" />
                  <p className="mt-1 font-bold">Firma Técnico Responsable</p>
                  <p className="text-gray-500">{viewingReporte.persona_a_cargo || 'Tecnishop'}</p>
                </div>
                <div>
                  <div className="border-t border-black w-48 mx-auto" />
                  <p className="mt-1 font-bold">Firma Conforme del Cliente</p>
                  <p className="text-gray-500">Recibí a entera satisfacción</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setViewingReporte(null)}>
                Cerrar
              </Button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#3498db] hover:bg-[#2980b9] shadow-md shadow-[#3498db]/30 transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Comprobante</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
