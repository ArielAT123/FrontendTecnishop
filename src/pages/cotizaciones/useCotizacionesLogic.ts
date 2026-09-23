import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../api/client';
import { Reporte, Proveedor } from '../../types';
import {
  EditableRepuesto,
  EditableTrabajo,
} from '../../components/cotizaciones/CotizacionEditorModal';

export const useCotizacionesLogic = (isAdminUnlocked: boolean) => {
  // Data states
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabEstado, setTabEstado] = useState<'PENDIENTES' | 'LISTAS' | 'TODAS'>('PENDIENTES');
  const [search, setSearch] = useState('');

  // Selected report for editing modal
  const [selectedReporte, setSelectedReporte] = useState<Reporte | null>(null);
  const [editRepuestos, setEditRepuestos] = useState<EditableRepuesto[]>([]);
  const [editTrabajos, setEditTrabajos] = useState<EditableTrabajo[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // State for creating new provider inline
  const [nuevoProveedorModalOpen, setNuevoProveedorModalOpen] = useState(false);
  const [targetItemForNewProvider, setTargetItemForNewProvider] = useState<{
    index: number;
    type: 'repuesto' | 'trabajo';
  } | null>(null);
  const [nuevoProvForm, setNuevoProvForm] = useState({
    nombre_o_razon_social: '',
    ruc_cedula: '',
    telefono: '',
    nombre_contacto: '',
  });
  const [creandoProveedor, setCreandoProveedor] = useState(false);
  const [errorNuevoProveedor, setErrorNuevoProveedor] = useState<string | null>(null);

  // Load suppliers
  const loadProveedores = useCallback(() => {
    api
      .getProveedores()
      .then((provs) => {
        setProveedores(provs.filter((p) => p.activo !== false));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadProveedores();
  }, [loadProveedores]);

  // Fetch quotes
  const fetchCotizaciones = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getCotizaciones(tabEstado, search);
      setReportes(data);
    } catch (err) {
      console.error('Error al cargar cotizaciones:', err);
    } finally {
      setLoading(false);
    }
  }, [tabEstado, search]);

  useEffect(() => {
    if (isAdminUnlocked) {
      fetchCotizaciones();
    }
  }, [tabEstado, search, isAdminUnlocked, fetchCotizaciones]);

  // Handle open editor
  const handleOpenEdit = (rep: Reporte) => {
    setSelectedReporte(rep);
    setFeedback(null);

    const repItems: EditableRepuesto[] = (rep.repuestos_utilizados || [])
      .filter((r) => r.estado === 'COTIZADO')
      .map((r, idx) => ({
        id: r.id || `temp-${idx}`,
        nombre_repuesto: r.nombre_repuesto,
        cantidad: Number(r.cantidad || 1),
        precio_unitario: Number(r.precio_unitario || 0),
        costo_unitario_proveedor: Number(r.costo_unitario_proveedor || 0),
        proveedor_id: r.proveedor || '',
        crear_en_catalogo: false,
        codigo_catalogo: `REP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      }));
    setEditRepuestos(repItems);

    const trabItems: EditableTrabajo[] = (rep.trabajos_realizados || [])
      .filter((t) => t.estado === 'COTIZADO')
      .map((t, idx) => ({
        id: t.id || `temp-${idx}`,
        descripcion: t.descripcion,
        costo: Number(t.costo || 0),
        costo_proveedor: Number(t.costo_proveedor || 0),
        proveedor_id: t.proveedor || '',
      }));
    setEditTrabajos(trabItems);
  };

  // Open New Provider modal from an item
  const handleOpenNuevoProveedor = (index: number, type: 'repuesto' | 'trabajo') => {
    setTargetItemForNewProvider({ index, type });
    setNuevoProvForm({
      nombre_o_razon_social: '',
      ruc_cedula: '',
      telefono: '',
      nombre_contacto: '',
    });
    setErrorNuevoProveedor(null);
    setNuevoProveedorModalOpen(true);
  };

  // Save new provider
  const handleCrearNuevoProveedor = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nuevoProvForm.nombre_o_razon_social.trim()) {
      setErrorNuevoProveedor('Ingresa el nombre o razón social del proveedor.');
      return;
    }

    setCreandoProveedor(true);
    setErrorNuevoProveedor(null);

    try {
      const nuevo = await api.createProveedor({
        nombre_o_razon_social: nuevoProvForm.nombre_o_razon_social.trim(),
        ruc_cedula: nuevoProvForm.ruc_cedula.trim() || undefined,
        telefono: nuevoProvForm.telefono.trim() || undefined,
        nombre_contacto: nuevoProvForm.nombre_contacto.trim() || undefined,
        activo: true,
      });

      setProveedores((prev) => [...prev, nuevo]);

      if (targetItemForNewProvider) {
        if (targetItemForNewProvider.type === 'repuesto') {
          setEditRepuestos((prev) =>
            prev.map((r, i) =>
              i === targetItemForNewProvider.index ? { ...r, proveedor_id: nuevo.id } : r
            )
          );
        } else {
          setEditTrabajos((prev) =>
            prev.map((t, i) =>
              i === targetItemForNewProvider.index ? { ...t, proveedor_id: nuevo.id } : t
            )
          );
        }
      }

      setNuevoProveedorModalOpen(false);
    } catch (err: any) {
      setErrorNuevoProveedor(
        err?.response?.data?.error ||
          err?.response?.data?.nombre_o_razon_social?.[0] ||
          'Error al registrar el proveedor.'
      );
    } finally {
      setCreandoProveedor(false);
    }
  };

  // Handle save items
  const handleSaveCotizacion = async () => {
    if (!selectedReporte) return;
    setIsSaving(true);
    setFeedback(null);

    try {
      const payload = {
        repuestos: editRepuestos.map((r) => ({
          id: r.id,
          costo_unitario_proveedor: r.costo_unitario_proveedor,
          precio_unitario: r.precio_unitario,
          proveedor_id: r.proveedor_id ? r.proveedor_id : null,
          crear_en_catalogo: r.crear_en_catalogo,
          codigo_catalogo: r.codigo_catalogo,
        })),
        trabajos: editTrabajos.map((t) => ({
          id: t.id,
          costo_proveedor: t.costo_proveedor,
          costo: t.costo,
          proveedor_id: t.proveedor_id ? t.proveedor_id : null,
        })),
      };

      const res = await api.guardarCotizacionItems(selectedReporte.id, payload);
      setFeedback({
        type: res.cotizacion_completada ? 'success' : 'error',
        message: res.message,
      });

      setReportes((prev) => prev.map((r) => (r.id === selectedReporte.id ? res.reporte : r)));
      setSelectedReporte(res.reporte);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.error || 'Error al guardar los datos de cotización.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Count stats
  const stats = useMemo(() => {
    let pendientes = 0;
    let listas = 0;
    reportes.forEach((rep) => {
      const repAceptados = (rep.repuestos_utilizados || []).filter((r) => r.estado === 'COTIZADO');
      const incompletos = repAceptados.filter(
        (r) => !r.proveedor || Number(r.costo_unitario_proveedor || 0) <= 0
      );
      if (incompletos.length > 0) {
        pendientes++;
      } else {
        listas++;
      }
    });
    return { pendientes, listas, total: reportes.length };
  }, [reportes]);

  const getReporteEquipo = (rep: Reporte) => rep.orden?.equipo;

  const getReporteCliente = (rep: Reporte) => {
    const eq = rep.orden?.equipo;
    if (eq?.cliente) return eq.cliente;
    if ((eq as any)?.cliente_ci && typeof (eq as any).cliente_ci === 'object') {
      return (eq as any).cliente_ci;
    }
    return undefined;
  };

  return {
    reportes,
    proveedores,
    loading,
    tabEstado,
    setTabEstado,
    search,
    setSearch,
    selectedReporte,
    setSelectedReporte,
    editRepuestos,
    setEditRepuestos,
    editTrabajos,
    setEditTrabajos,
    isSaving,
    feedback,
    nuevoProveedorModalOpen,
    setNuevoProveedorModalOpen,
    nuevoProvForm,
    setNuevoProvForm,
    creandoProveedor,
    errorNuevoProveedor,
    stats,
    fetchCotizaciones,
    handleOpenEdit,
    handleOpenNuevoProveedor,
    handleCrearNuevoProveedor,
    handleSaveCotizacion,
    getReporteEquipo,
    getReporteCliente,
  };
};
