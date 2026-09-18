import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { api } from '../../api/client';
import { Orden, OrdenEstado, Equipo, Cliente, OrdenesPaginadasResponse } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  ClipboardList,
  PlusCircle,
  Search,
  Eye,
  FileText,
  AlertCircle,
  Calendar,
  UserCheck,
  Printer,
  Users,
  User,
  Laptop,
  Check,
  CheckSquare,
  Hash,
  Loader2,
  Table,
  ChevronDown,
  ChevronUp,
  Phone,
  Layers,
  FolderKanban,
  Maximize2,
  Minimize2,
  Clock,
  CheckCircle2,
  Wrench,
} from 'lucide-react';
import { NavSection } from '../../components/layout/Sidebar';
import { OrdenPrintModal } from '../../components/print/OrdenPrintModal';
import { saveToCache } from '../../utils/cacheManager';

interface OrdenesPageProps {
  onNavigate?: (section: NavSection) => void;
  onSelectOrderForReport?: (orden: Orden) => void;
}

export const OrdenesPage: React.FC<OrdenesPageProps> = ({ onNavigate, onSelectOrderForReport }) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [updatingOrderIds, setUpdatingOrderIds] = useState<string[]>([]);

  // View Mode: 'tabla' (default) | 'clientes'
  const [viewMode, setViewMode] = useState<'tabla' | 'clientes'>('tabla');
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({});

  // Modals State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAddEquipoOpen, setIsAddEquipoOpen] = useState(false);
  const [viewingOrden, setViewingOrden] = useState<Orden | null>(null);
  const [printOrden, setPrintOrden] = useState<Orden | null>(null);

  // Client Selection & Filter State for New Order
  const [clientSearch, setClientSearch] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  // New Equipment Form State
  const [newEquipoData, setNewEquipoData] = useState({
    nombre: '',
    marca: '',
    modelo: '',
    numero_serie: '',
    cargador: false,
    bateria: false,
    cable_poder: false,
    cable_datos: false,
    otros: '',
    problema: '',
  });
  const [newEquipoError, setNewEquipoError] = useState<string | null>(null);

  // New Order Form State
  const [formData, setFormData] = useState({
    equipo: '',
    fecha: new Date().toISOString().split('T')[0],
    realiza_orden: '',
    estado: 'PENDIENTE' as OrdenEstado,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { data: ordenesData, isLoading, isSyncing } = useCachedQuery<OrdenesPaginadasResponse>({
    queryKey: ['ordenes'],
    queryFn: () => api.getOrdenes(0, 100),
    keyField: 'id',
    nestedArrayKey: 'ordenes',
  });

  const { data: equipos = [] } = useCachedQuery<Equipo[]>({
    queryKey: ['equipos'],
    queryFn: api.getEquipos,
    keyField: 'id',
  });

  const { data: clientes = [] } = useCachedQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: api.getClientes,
    keyField: 'ci',
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createOrden(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Error al crear la orden de servicio');
    },
  });

  const createEquipoMutation = useMutation({
    mutationFn: async (data: typeof newEquipoData) => {
      if (!selectedCliente) throw new Error('Debes seleccionar un cliente primero');
      if (!data.nombre.trim()) throw new Error('El tipo o nombre del equipo es obligatorio');

      const equipo = await api.createEquipo({
        nombre: data.nombre.trim(),
        marca: data.marca.trim(),
        modelo: data.modelo.trim(),
        numero_serie: data.numero_serie.trim(),
        cliente_ci: selectedCliente.ci,
      });

      await api.createObservaciones(equipo.id, {
        cargador: data.cargador,
        bateria: data.bateria,
        cable_poder: data.cable_poder,
        cable_datos: data.cable_datos,
        otros: data.otros,
      });

      if (data.problema.trim()) {
        await api.createProblema(equipo.id, { problema: data.problema.trim() });
      }

      return equipo;
    },
    onSuccess: (nuevoEquipo) => {
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      setFormData((prev) => ({ ...prev, equipo: nuevoEquipo.id }));
      setIsAddEquipoOpen(false);
      resetNewEquipoForm();
    },
    onError: (err: any) => {
      setNewEquipoError(err?.response?.data?.error || err.message || 'Error al registrar el equipo');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ ordenId, status }: { ordenId: string; status: string }) =>
      api.updateOrdenStatus(ordenId, status),
    onMutate: async ({ ordenId, status }) => {
      // 1. Bloquear la celda de esta orden inmediatamente
      setUpdatingOrderIds((prev) => [...prev, ordenId]);

      // 2. Cancelar consultas salientes
      await queryClient.cancelQueries({ queryKey: ['ordenes'] });

      // 3. Capturar estado previo de la caché para posible rollback
      const previousOrdenes = queryClient.getQueryData<OrdenesPaginadasResponse>(['ordenes']);

      // 4. Actualizar inmediatamente la caché (optimistic update)
      if (previousOrdenes?.ordenes) {
        const optimistic: OrdenesPaginadasResponse = {
          ...previousOrdenes,
          ordenes: previousOrdenes.ordenes.map((o) =>
            o.id === ordenId ? { ...o, estado: status as OrdenEstado } : o
          ),
        };
        queryClient.setQueryData(['ordenes'], optimistic);
        saveToCache('ordenes', optimistic);
      }

      return { previousOrdenes, ordenId };
    },
    onError: (_err, _vars, context) => {
      // Revertir a la versión previa si ocurre error en el servidor
      if (context?.previousOrdenes) {
        queryClient.setQueryData(['ordenes'], context.previousOrdenes);
        saveToCache('ordenes', context.previousOrdenes);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-ordenes'] });
    },
    onSettled: (_data, _error, variables) => {
      // 5. Desbloquear la celda al recibir la respuesta del servidor (OK o error)
      setUpdatingOrderIds((prev) => prev.filter((id) => id !== variables.ordenId));
    },
  });

  const resetForm = () => {
    setFormData({
      equipo: '',
      fecha: new Date().toISOString().split('T')[0],
      realiza_orden: '',
      estado: 'PENDIENTE',
    });
    setSelectedCliente(null);
    setClientSearch('');
    setFormError(null);
  };

  const resetNewEquipoForm = () => {
    setNewEquipoData({
      nombre: '',
      marca: '',
      modelo: '',
      numero_serie: '',
      cargador: false,
      bateria: false,
      cable_poder: false,
      cable_datos: false,
      otros: '',
      problema: '',
    });
    setNewEquipoError(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.equipo) {
      setFormError('Debes seleccionar o registrar un equipo para la orden');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleCreateEquipoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCliente) {
      setNewEquipoError('Selecciona un cliente primero');
      return;
    }
    if (!newEquipoData.nombre.trim()) {
      setNewEquipoError('El tipo o nombre del equipo es obligatorio (ej. Laptop, PC)');
      return;
    }
    createEquipoMutation.mutate(newEquipoData);
  };

  // Filtrado de clientes para el buscador
  const filteredClients = clientes.filter((c) => {
    const q = clientSearch.toLowerCase().trim();
    if (!q) return false;
    return (
      c.ci?.toLowerCase().includes(q) ||
      c.nombre?.toLowerCase().includes(q) ||
      c.apellido?.toLowerCase().includes(q) ||
      c.telefono?.toLowerCase().includes(q)
    );
  });

  // Equipos asociados al cliente seleccionado
  const clientEquipos = selectedCliente
    ? equipos.filter((eq) => String(eq.cliente_ci).trim() === String(selectedCliente.ci).trim())
    : [];

  const ordenes = ordenesData?.ordenes || [];

  // Helper to normalize text for search (ignoring accents, uppercase and whitespace)
  const normalizeSearch = (text: string) =>
    (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  // Helper to resolve equipment object for an order (nested or via cached equipos list)
  const getOrdenEquipo = React.useCallback(
    (o: Orden) => {
      if (o.equipo && typeof o.equipo === 'object') return o.equipo;
      return equipos.find((e) => String(e.id) === String(o.equipo));
    },
    [equipos]
  );

  // Helper to resolve client object for an order (nested in equipo or via cached clientes list)
  const getOrdenCliente = React.useCallback(
    (o: Orden) => {
      const eq = getOrdenEquipo(o);
      if (eq?.cliente) return eq.cliente;
      const ci = eq?.cliente_ci;
      if (!ci) return undefined;
      return clientes.find((c) => String(c.ci).trim() === String(ci).trim());
    },
    [getOrdenEquipo, clientes]
  );

  // Space-enabled multi-token reactive search algorithm
  const filteredOrdenes = React.useMemo(() => {
    const rawTerm = searchTerm.trim();
    const searchTokens = normalizeSearch(rawTerm)
      .split(/\s+/)
      .filter(Boolean);

    return ordenes.filter((o) => {
      // 1. Status Filter
      const matchesStatus =
        selectedStatus === 'ALL' || o.estado?.toUpperCase() === selectedStatus.toUpperCase();
      if (!matchesStatus) return false;

      // If no search term, pass through
      if (searchTokens.length === 0) return true;

      // 2. Resolve Equipment and Client Information
      const eq = getOrdenEquipo(o);
      const cli = getOrdenCliente(o);

      const cliNombre = cli?.nombre || '';
      const cliApellido = cli?.apellido || '';
      const cliFullName = `${cliNombre} ${cliApellido}`.trim();
      const cliInverseName = `${cliApellido} ${cliNombre}`.trim();

      // 3. Assemble unified searchable blob
      const searchableBlob = normalizeSearch(
        [
          o.numero_orden,
          o.id,
          eq?.nombre,
          eq?.marca,
          eq?.modelo,
          eq?.numero_serie,
          cliNombre,
          cliApellido,
          cliFullName,
          cliInverseName,
          cli?.ci,
          cli?.telefono,
          cli?.correo,
          o.realiza_orden,
          o.estado,
          o.fecha,
        ]
          .filter(Boolean)
          .join(' ')
      );

      // 4. Check that EVERY word/token entered matches somewhere in the order/client text
      return searchTokens.every((token) => searchableBlob.includes(token));
    });
  }, [ordenes, searchTerm, selectedStatus, getOrdenEquipo, getOrdenCliente]);

  // Group filtered orders by client for Client Grouped View
  const groupedByClient = React.useMemo(() => {
    const map = new Map<
      string,
      {
        clientKey: string;
        cliente: {
          ci?: string;
          nombre?: string;
          apellido?: string;
          telefono?: string;
          correo?: string;
        };
        ordenes: Orden[];
        counts: {
          total: number;
          pendientes: number;
          enProceso: number;
          completadas: number;
          cobradas: number;
          canceladas: number;
        };
      }
    >();

    filteredOrdenes.forEach((orden) => {
      const eq = getOrdenEquipo(orden);
      const cli = getOrdenCliente(orden);
      const ci = cli?.ci
        ? String(cli.ci).trim()
        : eq?.cliente_ci
        ? String(eq.cliente_ci).trim()
        : '';
      const fullName = `${cli?.nombre || ''} ${cli?.apellido || ''}`.trim();
      const clientKey = ci || (fullName ? `name_${fullName.toLowerCase()}` : 'sin_cliente');

      if (!map.has(clientKey)) {
        map.set(clientKey, {
          clientKey,
          cliente: {
            ci: ci || cli?.ci,
            nombre: cli?.nombre || (ci ? `Cliente (CI: ${ci})` : 'Cliente Mostrador / Sin Asignar'),
            apellido: cli?.apellido || '',
            telefono: cli?.telefono || '',
            correo: cli?.correo || '',
          },
          ordenes: [],
          counts: {
            total: 0,
            pendientes: 0,
            enProceso: 0,
            completadas: 0,
            cobradas: 0,
            canceladas: 0,
          },
        });
      }

      const group = map.get(clientKey)!;
      group.ordenes.push(orden);
      group.counts.total += 1;

      const st = (orden.estado || '').toUpperCase();
      if (st === 'PENDIENTE') group.counts.pendientes += 1;
      else if (st === 'EN_PROCESO') group.counts.enProceso += 1;
      else if (st === 'COMPLETADO') group.counts.completadas += 1;
      else if (st === 'COBRADO') group.counts.cobradas += 1;
      else if (st === 'CANCELADO') group.counts.canceladas += 1;
    });

    return Array.from(map.values()).sort((a, b) => {
      const aUrgent = a.counts.pendientes + a.counts.enProceso;
      const bUrgent = b.counts.pendientes + b.counts.enProceso;
      if (bUrgent !== aUrgent) return bUrgent - aUrgent;
      return (a.cliente.nombre || '').localeCompare(b.cliente.nombre || '');
    });
  }, [filteredOrdenes, getOrdenEquipo, getOrdenCliente]);

  const toggleClient = (clientKey: string) => {
    setExpandedClients((prev) => ({
      ...prev,
      [clientKey]: prev[clientKey] === undefined ? false : !prev[clientKey],
    }));
  };

  const toggleAllClients = (expand: boolean) => {
    const next: Record<string, boolean> = {};
    groupedByClient.forEach((g) => {
      next[g.clientKey] = expand;
    });
    setExpandedClients(next);
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="w-full sm:w-72">
            <Input
              placeholder="Buscar orden, cliente o equipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs py-2 px-3 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="PENDIENTE">PENDIENTE</option>
            <option value="EN_PROCESO">EN PROCESO</option>
            <option value="COMPLETADO">COMPLETADO</option>
            <option value="COBRADO">COBRADO</option>
            <option value="CANCELADO">CANCELADO</option>
          </select>

          {/* Segmented View Mode Switcher */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-inner">
            <button
              type="button"
              onClick={() => setViewMode('tabla')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'tabla'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Ver en formato tabla clásica"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Tabla Plana</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('clientes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'clientes'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Agrupar órdenes por cliente"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Por Clientes</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold">
                {groupedByClient.length}
              </span>
            </button>
          </div>
        </div>

        <Button
          leftIcon={<PlusCircle className="w-4 h-4" />}
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
          className="shadow-sm shrink-0"
        >
          Nueva Orden
        </Button>
      </div>

      {/* Orders View: Flat Table OR Grouped by Client */}
      {viewMode === 'tabla' ? (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Órdenes de Servicio ({filteredOrdenes.length})</span>
              {isSyncing && (
                <span className="text-[10px] font-normal text-[#3498db] animate-pulse bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                  Sincronizando en segundo plano...
                </span>
              )}
            </h3>
          </div>

          {isLoading && filteredOrdenes.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">Cargando órdenes de servicio...</div>
          ) : filteredOrdenes.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              {searchTerm || selectedStatus !== 'ALL'
                ? 'No se encontraron órdenes para este filtro.'
                : 'No hay órdenes registradas aún.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 whitespace-nowrap min-w-[200px]">Nº Orden</th>
                    <th className="py-3 px-3 whitespace-nowrap min-w-[110px]">Fecha</th>
                    <th className="py-3 px-3 min-w-[170px]">Cliente</th>
                    <th className="py-3 px-3 min-w-[180px]">Equipo</th>
                    <th className="py-3 px-3 min-w-[140px]">Técnico Asignado</th>
                    <th className="py-3 px-3 min-w-[160px]">Estado</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap min-w-[120px]">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredOrdenes.map((orden) => {
                    const isBlocked = updatingOrderIds.includes(orden.id);
                    const displayNumero =
                      orden.numero_orden && orden.numero_orden !== 'ORD-2025'
                        ? orden.numero_orden
                        : orden.fecha
                        ? `ORD-${orden.fecha}-${orden.id.slice(0, 4).toUpperCase()}`
                        : orden.id.slice(0, 8);

                    const cli = getOrdenCliente(orden);
                    const eq = getOrdenEquipo(orden);
                    const clientName = cli
                      ? `${cli.nombre} ${cli.apellido || ''}`.trim()
                      : 'Cliente Mostrador';

                    return (
                      <tr key={orden.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap tracking-tight">
                          {displayNumero}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{orden.fecha}</td>
                        <td className="py-3.5 px-3 text-slate-900 dark:text-slate-100 font-bold">
                          {clientName}
                        </td>
                        <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300">
                          <span className="font-semibold">{eq?.marca || ''}</span>{' '}
                          {eq?.modelo || eq?.nombre || 'Equipo'}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400 font-medium">
                          {orden.realiza_orden || 'Sin asignar'}
                        </td>
                        <td
                          className={`py-3.5 px-3 transition-colors ${
                            isBlocked
                              ? 'bg-slate-200/80 dark:bg-slate-800/90 pointer-events-none select-none rounded-lg'
                              : ''
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <select
                              value={orden.estado}
                              disabled={isBlocked}
                              onChange={(e) =>
                                updateStatusMutation.mutate({ ordenId: orden.id, status: e.target.value })
                              }
                              className={`rounded-full px-2.5 py-1 text-[11px] font-bold border transition-all ${
                                isBlocked
                                  ? 'bg-slate-300/80 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-400/50 cursor-not-allowed shadow-none'
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 cursor-pointer focus:outline-none text-slate-800 dark:text-slate-200 shadow-sm hover:border-slate-300'
                              }`}
                            >
                              <option value="PENDIENTE">PENDIENTE</option>
                              <option value="EN_PROCESO">EN PROCESO</option>
                              <option value="COMPLETADO">COMPLETADO</option>
                              <option value="COBRADO">COBRADO</option>
                              <option value="CANCELADO">CANCELADO</option>
                            </select>
                            {isBlocked && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-semibold animate-pulse">
                                <Loader2 className="w-3 h-3 animate-spin text-slate-500" />
                                <span className="hidden sm:inline">Guardando...</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setPrintOrden(orden)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Imprimir Orden Oficial (A4 Dual)"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setViewingOrden(orden)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Ver Detalle"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {onNavigate && (
                              <button
                                onClick={() => {
                                  if (onSelectOrderForReport) onSelectOrderForReport(orden);
                                  onNavigate('reportes');
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Generar Reporte Técnico"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            )}
                          </div>
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
        /* Vista Agrupada por Clientes */
        <div className="space-y-4">
          {/* Client Group View Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-slate-100">{groupedByClient.length}</span>{' '}
              {groupedByClient.length === 1 ? 'Cliente con' : 'Clientes con'}{' '}
              <span className="font-bold text-slate-800 dark:text-slate-100">{filteredOrdenes.length}</span>{' '}
              {filteredOrdenes.length === 1 ? 'orden' : 'órdenes'}
              {isSyncing && (
                <span className="text-[10px] font-normal text-[#3498db] animate-pulse bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 ml-1">
                  Sincronizando...
                </span>
              )}
            </div>
            {groupedByClient.length > 0 && (
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => toggleAllClients(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Expandir Todos</span>
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => toggleAllClients(false)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:underline"
                >
                  <Minimize2 className="w-3 h-3" />
                  <span>Colapsar Todos</span>
                </button>
              </div>
            )}
          </div>

          {isLoading && filteredOrdenes.length === 0 ? (
            <Card className="p-12 text-center text-xs text-slate-400">Cargando clientes y órdenes...</Card>
          ) : filteredOrdenes.length === 0 ? (
            <Card className="p-12 text-center text-xs text-slate-400">
              {searchTerm || selectedStatus !== 'ALL'
                ? 'No se encontraron clientes ni órdenes para este filtro.'
                : 'No hay órdenes registradas aún.'}
            </Card>
          ) : (
            <div className="space-y-3">
              {groupedByClient.map((group) => {
                const isExpanded = expandedClients[group.clientKey] ?? true;
                const initials = `${(group.cliente.nombre || '')[0] || 'C'}${(group.cliente.apellido || '')[0] || ''}`.toUpperCase();

                return (
                  <div
                    key={group.clientKey}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                  >
                    {/* Header Bar (Clickable) */}
                    <div
                      onClick={() => toggleClient(group.clientKey)}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer bg-gradient-to-r from-slate-50/70 via-white to-slate-50/40 dark:from-slate-850/80 dark:via-slate-900 dark:to-slate-850/80 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 select-none transition-colors"
                    >
                      {/* Left: Avatar & Contact Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3498db] to-[#2980b9] text-white flex items-center justify-center font-black text-sm shadow-md shadow-[#3498db]/20 shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                              {group.cliente.nombre} {group.cliente.apellido}
                            </h4>
                            {group.cliente.ci && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                CI: {group.cliente.ci}
                              </span>
                            )}
                          </div>
                          {group.cliente.telefono && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{group.cliente.telefono}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Badges & Chevron */}
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold">
                          {group.counts.total} {group.counts.total === 1 ? 'Orden' : 'Órdenes'}
                        </span>

                        {group.counts.pendientes > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-bold">
                            <Clock className="w-3 h-3" />
                            <span>{group.counts.pendientes} Pendiente{group.counts.pendientes > 1 ? 's' : ''}</span>
                          </span>
                        )}

                        {group.counts.enProceso > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-400 text-[11px] font-bold">
                            <Wrench className="w-3 h-3" />
                            <span>{group.counts.enProceso} En Proceso</span>
                          </span>
                        )}

                        {group.counts.completadas > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{group.counts.completadas} Completada{group.counts.completadas > 1 ? 's' : ''}</span>
                          </span>
                        )}

                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 ml-1">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Subtable of Client Orders */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 dark:border-slate-800 overflow-x-auto bg-slate-50/30 dark:bg-slate-900/30">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50/80 dark:bg-slate-850/60 border-b border-slate-200/70 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                            <tr>
                              <th className="py-2.5 px-4 whitespace-nowrap min-w-[190px]">Nº Orden</th>
                              <th className="py-2.5 px-3 whitespace-nowrap min-w-[100px]">Fecha</th>
                              <th className="py-2.5 px-3 min-w-[180px]">Equipo / Modelo</th>
                              <th className="py-2.5 px-3 min-w-[140px]">Técnico Asignado</th>
                              <th className="py-2.5 px-3 min-w-[160px]">Estado</th>
                              <th className="py-2.5 px-4 text-right whitespace-nowrap min-w-[110px]">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium bg-white dark:bg-slate-900">
                            {group.ordenes.map((orden) => {
                              const isBlocked = updatingOrderIds.includes(orden.id);
                              const displayNumero =
                                orden.numero_orden && orden.numero_orden !== 'ORD-2025'
                                  ? orden.numero_orden
                                  : orden.fecha
                                  ? `ORD-${orden.fecha}-${orden.id.slice(0, 4).toUpperCase()}`
                                  : orden.id.slice(0, 8);

                              const eq = getOrdenEquipo(orden);

                              return (
                                <tr key={orden.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                  <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap tracking-tight">
                                    {displayNumero}
                                  </td>
                                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{orden.fecha}</td>
                                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                                    <span className="font-semibold text-slate-900 dark:text-slate-100">{eq?.marca || ''}</span>{' '}
                                    {eq?.modelo || eq?.nombre || 'Equipo'}
                                    {eq?.numero_serie && (
                                      <span className="block text-[10px] text-slate-400 font-mono">S/N: {eq.numero_serie}</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                                    {orden.realiza_orden || 'Sin asignar'}
                                  </td>
                                  <td
                                    className={`py-3 px-3 transition-colors ${
                                      isBlocked
                                        ? 'bg-slate-200/80 dark:bg-slate-800/90 pointer-events-none select-none rounded-lg'
                                        : ''
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <select
                                        value={orden.estado}
                                        disabled={isBlocked}
                                        onChange={(e) =>
                                          updateStatusMutation.mutate({ ordenId: orden.id, status: e.target.value })
                                        }
                                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold border transition-all ${
                                          isBlocked
                                            ? 'bg-slate-300/80 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-400/50 cursor-not-allowed shadow-none'
                                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 cursor-pointer focus:outline-none text-slate-800 dark:text-slate-200 shadow-sm hover:border-slate-300'
                                        }`}
                                      >
                                        <option value="PENDIENTE">PENDIENTE</option>
                                        <option value="EN_PROCESO">EN PROCESO</option>
                                        <option value="COMPLETADO">COMPLETADO</option>
                                        <option value="COBRADO">COBRADO</option>
                                        <option value="CANCELADO">CANCELADO</option>
                                      </select>
                                      {isBlocked && (
                                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-semibold animate-pulse">
                                          <Loader2 className="w-3 h-3 animate-spin text-slate-500" />
                                          <span className="hidden sm:inline">Guardando...</span>
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        onClick={() => setPrintOrden(orden)}
                                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        title="Imprimir Orden Oficial (A4 Dual)"
                                      >
                                        <Printer className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => setViewingOrden(orden)}
                                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        title="Ver Detalle"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                      {onNavigate && (
                                        <button
                                          onClick={() => {
                                            if (onSelectOrderForReport) onSelectOrderForReport(orden);
                                            onNavigate('reportes');
                                          }}
                                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                          title="Generar Reporte Técnico"
                                        >
                                          <FileText className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
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

      {/* Modal Crear Nueva Orden */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          resetForm();
        }}
        title="Crear Nueva Orden de Servicio"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-500 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* 1. SELECCIÓN O FILTRADO DE CLIENTE */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#3498db]" />
                1. Cliente Solicitante *
              </label>
              {selectedCliente && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCliente(null);
                    setFormData((prev) => ({ ...prev, equipo: '' }));
                    setClientSearch('');
                  }}
                  className="text-xs text-rose-500 hover:text-rose-600 font-semibold transition-colors"
                >
                  Cambiar Cliente
                </button>
              )}
            </div>

            {!selectedCliente ? (
              <div className="space-y-2">
                <Input
                  placeholder="Escribe la Cédula (CI) o Nombre del cliente..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                />

                {clientSearch.trim() && (
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 shadow-md divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredClients.length > 0 ? (
                      filteredClients.map((c) => (
                        <button
                          key={c.ci}
                          type="button"
                          onClick={() => {
                            setSelectedCliente(c);
                            setClientSearch('');
                            setFormData((prev) => ({ ...prev, equipo: '' }));
                          }}
                          className="w-full text-left p-3 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 flex items-center justify-between transition-colors"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {c.nombre} {c.apellido || ''}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              CI: {c.ci} {c.telefono ? `• Tel: ${c.telefono}` : ''}
                            </p>
                          </div>
                          <span className="text-[11px] font-bold text-[#3498db] bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                            Seleccionar
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-400">
                        No se encontró ningún cliente con "{clientSearch}".
                      </div>
                    )}
                  </div>
                )}
                <p className="text-[11px] text-slate-400">
                  Ingresa la cédula o nombre para listar y filtrar los equipos de ese cliente.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#3498db] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {selectedCliente.nombre} {selectedCliente.apellido || ''}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      CI: {selectedCliente.ci} {selectedCliente.telefono ? `• Tel: ${selectedCliente.telefono}` : ''}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Cliente Listo
                </span>
              </div>
            )}
          </div>

          {/* 2. EQUIPOS DEL CLIENTE Y AGREGAR EQUIPO NUEVO */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-[#3498db]" />
                2. Equipo a Reparar *
              </label>

              {/* Botón Opción 2: Agregar Equipo Nuevo */}
              <Button
                type="button"
                size="sm"
                variant="outline"
                leftIcon={<PlusCircle className="w-3.5 h-3.5 text-[#3498db]" />}
                onClick={() => {
                  setFormError(null);
                  setIsAddEquipoOpen(true);
                }}
                className="text-xs border-[#3498db]/40 text-[#3498db] hover:bg-[#3498db]/10"
              >
                + Agregar Equipo Nuevo
              </Button>
            </div>

            {selectedCliente ? (
              clientEquipos.length > 0 ? (
                <div className="space-y-2 mt-2 max-h-52 overflow-y-auto pr-1">
                  {clientEquipos.map((eq) => {
                    const isSelected = formData.equipo === eq.id;
                    return (
                      <div
                        key={eq.id}
                        onClick={() => setFormData((prev) => ({ ...prev, equipo: eq.id }))}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                          isSelected
                            ? 'border-[#3498db] bg-blue-50/90 dark:bg-blue-950/70 ring-2 ring-[#3498db]/30 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-[#3498db] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}>
                            <Laptop className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                              {eq.nombre || 'Dispositivo'} {eq.marca ? `• ${eq.marca}` : ''} {eq.modelo || ''}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              Serie: {eq.numero_serie || 'S/N'}
                            </p>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-[#3498db] bg-[#3498db] text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/30 text-center space-y-2">
                  <Laptop className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Este cliente aún no tiene equipos registrados en la base de datos.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    leftIcon={<PlusCircle className="w-4 h-4" />}
                    onClick={() => {
                      setFormError(null);
                      setIsAddEquipoOpen(true);
                    }}
                    className="mx-auto shadow-sm"
                  >
                    Registrar Primer Equipo
                  </Button>
                </div>
              )
            ) : (
              <div className="p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/20 text-center text-xs text-slate-400">
                Selecciona un cliente arriba para ver sus equipos registrados o agregar uno nuevo.
              </div>
            )}
          </div>

          {/* 3. FECHA, ESTADO Y TÉCNICO */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Fecha de Ingreso *
              </label>
              <Input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                leftIcon={<Calendar className="w-4 h-4" />}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Estado Inicial
              </label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value as OrdenEstado })}
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2 px-3 focus:outline-none"
              >
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="EN_PROCESO">EN PROCESO</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Técnico Asignado
            </label>
            <Input
              placeholder="Nombre del técnico responsable"
              value={formData.realiza_orden}
              onChange={(e) => setFormData({ ...formData, realiza_orden: e.target.value })}
              leftIcon={<UserCheck className="w-4 h-4" />}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsCreateOpen(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending}
              disabled={!formData.equipo}
            >
              Crear Orden de Servicio
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Agregar Equipo Nuevo para el Cliente */}
      <Modal
        isOpen={isAddEquipoOpen}
        onClose={() => {
          setIsAddEquipoOpen(false);
          resetNewEquipoForm();
        }}
        title={`Registrar Nuevo Equipo ${selectedCliente ? `(${selectedCliente.nombre})` : ''}`}
        maxWidth="lg"
      >
        <form onSubmit={handleCreateEquipoSubmit} className="space-y-4">
          {newEquipoError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-500 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{newEquipoError}</span>
            </div>
          )}

          {!selectedCliente ? (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Cliente Asociado *
              </label>
              <select
                onChange={(e) => {
                  const c = clientes.find((item) => item.ci === e.target.value);
                  if (c) setSelectedCliente(c);
                }}
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2 px-3 focus:outline-none"
              >
                <option value="">-- Selecciona el cliente para este equipo --</option>
                {clientes.map((c) => (
                  <option key={c.ci} value={c.ci}>
                    {c.nombre} {c.apellido || ''} (CI: {c.ci})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">Cliente Asociado:</span>{' '}
                {selectedCliente.nombre} {selectedCliente.apellido || ''} (CI: {selectedCliente.ci})
              </div>
              <button
                type="button"
                onClick={() => setSelectedCliente(null)}
                className="text-[11px] text-rose-500 hover:underline font-semibold ml-2 shrink-0"
              >
                Cambiar
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Tipo / Nombre *
              </label>
              <Input
                placeholder="Laptop, PC, Impresora, Celular..."
                value={newEquipoData.nombre}
                onChange={(e) => setNewEquipoData({ ...newEquipoData, nombre: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Marca
              </label>
              <Input
                placeholder="Dell, HP, Lenovo, Asus..."
                value={newEquipoData.marca}
                onChange={(e) => setNewEquipoData({ ...newEquipoData, marca: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Modelo
              </label>
              <Input
                placeholder="Inspiron 15, Q405U..."
                value={newEquipoData.modelo}
                onChange={(e) => setNewEquipoData({ ...newEquipoData, modelo: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Número de Serie
              </label>
              <Input
                placeholder="ABC123XYZ..."
                value={newEquipoData.numero_serie}
                onChange={(e) => setNewEquipoData({ ...newEquipoData, numero_serie: e.target.value })}
                leftIcon={<Hash className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* Accesorios y Condiciones */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-[#3498db]" />
              Accesorios Recibidos
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'cargador', label: 'Cargador' },
                { key: 'bateria', label: 'Batería' },
                { key: 'cable_poder', label: 'Cable Poder' },
                { key: 'cable_datos', label: 'Cable Datos' },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 cursor-pointer text-xs font-medium"
                >
                  <input
                    type="checkbox"
                    checked={(newEquipoData as any)[key]}
                    onChange={(e) => setNewEquipoData({ ...newEquipoData, [key]: e.target.checked })}
                    className="rounded text-[#3498db] focus:ring-[#3498db]"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Falla o Problema Reportado
            </label>
            <Input
              placeholder="No enciende, pantalla rota, formateo..."
              value={newEquipoData.problema}
              onChange={(e) => setNewEquipoData({ ...newEquipoData, problema: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsAddEquipoOpen(false);
                resetNewEquipoForm();
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={createEquipoMutation.isPending}>
              Guardar y Seleccionar Equipo
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Ver Detalle de Orden */}
      <Modal
        isOpen={!!viewingOrden}
        onClose={() => setViewingOrden(null)}
        title={`Detalle de Orden #${viewingOrden?.numero_orden || viewingOrden?.id.slice(0, 8)}`}
        maxWidth="lg"
      >
        {viewingOrden && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80">
              <div>
                <p className="text-slate-400 font-semibold uppercase">Estado Actual</p>
                <div className="mt-1">
                  <Badge status={viewingOrden.estado}>{viewingOrden.estado}</Badge>
                </div>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase">Fecha Recepción</p>
                <p className="mt-1 font-bold text-slate-800 dark:text-slate-200">{viewingOrden.fecha}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase">Técnico Asignado</p>
                <p className="mt-1 font-bold text-slate-800 dark:text-slate-200">
                  {viewingOrden.realiza_orden || 'No asignado'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase">Propietario</p>
                <p className="mt-1 font-bold text-slate-800 dark:text-slate-200">
                  {viewingOrden.equipo?.cliente?.nombre} {viewingOrden.equipo?.cliente?.apellido || ''} (
                  {viewingOrden.equipo?.cliente?.ci})
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2">Información del Dispositivo</h4>
              <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                <p>
                  <span className="text-slate-400">Tipo:</span> {viewingOrden.equipo?.nombre || 'N/A'}
                </p>
                <p>
                  <span className="text-slate-400">Marca:</span> {viewingOrden.equipo?.marca || 'N/A'}
                </p>
                <p>
                  <span className="text-slate-400">Modelo:</span> {viewingOrden.equipo?.modelo || 'N/A'}
                </p>
                <p>
                  <span className="text-slate-400">Serie:</span> {viewingOrden.equipo?.numero_serie || 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setPrintOrden(viewingOrden);
                }}
                className="flex items-center gap-1.5 text-[#3498db] border-[#3498db]/30 hover:bg-[#3498db]/10"
              >
                <Printer className="w-4 h-4" />
                Imprimir Orden
              </Button>
              <Button variant="secondary" onClick={() => setViewingOrden(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Impresión Oficial A4 Dual */}
      <OrdenPrintModal
        orden={printOrden}
        isOpen={!!printOrden}
        onClose={() => setPrintOrden(null)}
      />
    </div>
  );
};
