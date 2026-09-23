import { useState, useMemo, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { api } from '../../api/client';
import { saveToCache } from '../../utils/cacheManager';
import {
  Orden,
  OrdenEstado,
  Equipo,
  Cliente,
  OrdenesPaginadasResponse,
} from '../../types';
import { ClientGroup } from '../../components/ordenes/OrdenesClientesView';
import { normalizeSearch, resolveOrdenEquipo, resolveOrdenCliente } from './ordenesUtils';

export const useOrdenesLogic = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [updatingOrderIds, setUpdatingOrderIds] = useState<string[]>([]);

  // View Mode: 'tabla' | 'clientes'
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

  // New Order Form State
  const [formData, setFormData] = useState({
    equipo: '',
    fecha: new Date().toISOString().split('T')[0],
    realiza_orden: '',
    estado: 'PENDIENTE' as OrdenEstado,
    cargador: false,
    bateria: false,
    cable_poder: false,
    cable_datos: false,
    otros: '',
    problema: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Queries
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

  const ordenes: Orden[] = useMemo(() => {
    if (!ordenesData) return [];
    if (Array.isArray(ordenesData)) return ordenesData;
    return ordenesData.ordenes || [];
  }, [ordenesData]);

  // Resolvers
  const getOrdenEquipo = useCallback(
    (orden: Orden) => resolveOrdenEquipo(orden, equipos),
    [equipos]
  );

  const getOrdenCliente = useCallback(
    (orden: Orden) => resolveOrdenCliente(orden, equipos, clientes),
    [equipos, clientes]
  );

  // Status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ ordenId, status }: { ordenId: string; status: string }) => {
      setUpdatingOrderIds((prev) => [...prev, ordenId]);
      await api.updateOrdenStatus(ordenId, status);
      return { ordenId, status };
    },
    onSuccess: ({ ordenId, status }) => {
      queryClient.setQueryData<OrdenesPaginadasResponse | Orden[]>(
        ['ordenes'],
        (oldData: any) => {
          if (!oldData) return oldData;
          if (Array.isArray(oldData)) {
            const next = oldData.map((o: Orden) =>
              o.id === ordenId ? { ...o, estado: status as OrdenEstado } : o
            );
            saveToCache('ordenes', next);
            return next;
          }
          if (oldData.ordenes) {
            const nextList = oldData.ordenes.map((o: Orden) =>
              o.id === ordenId ? { ...o, estado: status as OrdenEstado } : o
            );
            const nextObj = { ...oldData, ordenes: nextList };
            saveToCache('ordenes', nextObj);
            return nextObj;
          }
          return oldData;
        }
      );
      queryClient.invalidateQueries({ queryKey: ['ordenes'] });
      setUpdatingOrderIds((prev) => prev.filter((id) => id !== ordenId));
    },
    onError: (_err, variables) => {
      setUpdatingOrderIds((prev) => prev.filter((id) => id !== variables.ordenId));
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (newOrder: typeof formData) => api.createOrden(newOrder as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes'] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          'Error al crear la orden de servicio. Revisa los campos requeridos.'
      );
    },
  });

  const resetForm = () => {
    setFormData({
      equipo: '',
      fecha: new Date().toISOString().split('T')[0],
      realiza_orden: '',
      estado: 'PENDIENTE',
      cargador: false,
      bateria: false,
      cable_poder: false,
      cable_datos: false,
      otros: '',
      problema: '',
    });
    setSelectedCliente(null);
    setClientSearch('');
    setFormError(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.equipo) {
      setFormError('Debes seleccionar un equipo a reparar.');
      return;
    }
    createMutation.mutate(formData);
  };



  // Filtered orders
  const filteredOrdenes = useMemo(() => {
    const cleanSearch = normalizeSearch(searchTerm);
    const searchTokens = cleanSearch.split(' ').filter(Boolean);

    return ordenes.filter((o) => {
      const matchesStatus =
        selectedStatus === 'ALL' || o.estado?.toUpperCase() === selectedStatus.toUpperCase();
      if (!matchesStatus) return false;
      if (searchTokens.length === 0) return true;

      const eq = getOrdenEquipo(o);
      const cli = getOrdenCliente(o);

      const cliNombre = cli?.nombre || '';
      const cliApellido = cli?.apellido || '';
      const cliFullName = `${cliNombre} ${cliApellido}`.trim();
      const cliInverseName = `${cliApellido} ${cliNombre}`.trim();

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

      return searchTokens.every((token) => searchableBlob.includes(token));
    });
  }, [ordenes, searchTerm, selectedStatus, getOrdenEquipo, getOrdenCliente]);

  // Grouped by client
  const groupedByClient: ClientGroup[] = useMemo(() => {
    const map = new Map<string, ClientGroup>();

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

      const st = orden.estado?.toUpperCase();
      if (st === 'PENDIENTE') group.counts.pendientes += 1;
      else if (st === 'EN_PROCESO') group.counts.enProceso += 1;
      else if (st === 'COMPLETADO') group.counts.completadas += 1;
      else if (st === 'COBRADO') group.counts.cobradas += 1;
      else if (st === 'CANCELADO') group.counts.canceladas += 1;
    });

    return Array.from(map.values()).sort((a, b) => b.counts.total - a.counts.total);
  }, [filteredOrdenes, getOrdenEquipo, getOrdenCliente]);

  // Filtered clients for modal search
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return [];
    const q = clientSearch.toLowerCase().trim();
    return clientes
      .filter((c) => {
        const full = `${c.nombre} ${c.apellido || ''}`.toLowerCase();
        const ci = String(c.ci || '').toLowerCase();
        const tel = String(c.telefono || '').toLowerCase();
        return full.includes(q) || ci.includes(q) || tel.includes(q);
      })
      .slice(0, 10);
  }, [clientes, clientSearch]);

  // Equipment of selected client
  const clientEquipos = useMemo(() => {
    if (!selectedCliente) return [];
    return equipos.filter(
      (e) =>
        e.cliente_ci === selectedCliente.ci ||
        (e.cliente && String(e.cliente.ci).trim() === String(selectedCliente.ci).trim())
    );
  }, [selectedCliente, equipos]);

  const toggleClient = (clientKey: string) => {
    setExpandedClients((prev) => ({
      ...prev,
      [clientKey]: !(prev[clientKey] ?? true),
    }));
  };

  const toggleAllClients = (expand: boolean) => {
    const newState: Record<string, boolean> = {};
    groupedByClient.forEach((g) => {
      newState[g.clientKey] = expand;
    });
    setExpandedClients(newState);
  };

  return {
    searchTerm,
    setSearchTerm,
    selectedStatus,
    setSelectedStatus,
    updatingOrderIds,
    viewMode,
    setViewMode,
    expandedClients,
    toggleClient,
    toggleAllClients,
    isCreateOpen,
    setIsCreateOpen,
    isAddEquipoOpen,
    setIsAddEquipoOpen,
    viewingOrden,
    setViewingOrden,
    printOrden,
    setPrintOrden,
    clientSearch,
    setClientSearch,
    selectedCliente,
    setSelectedCliente,
    formData,
    setFormData,
    formError,
    setFormError,
    isLoading,
    isSyncing,
    filteredOrdenes,
    groupedByClient,
    filteredClients,
    clientEquipos,
    getOrdenEquipo,
    getOrdenCliente,
    updateStatusMutation,
    createMutation,
    handleCreateSubmit,
    resetForm,
  };
};
