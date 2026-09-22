import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator,
  Search,
  CheckCircle2,
  AlertTriangle,
  Building2,
  TrendingUp,
  Package,
  Wrench,
  ShieldCheck,
  Lock,
  RefreshCw,
  ExternalLink,
  Info,
  Laptop,
  User as UserIcon,
  ShoppingCart,
  Save,
  Check,
  Plus,
  X,
} from 'lucide-react';
import { api } from '../../api/client';
import { Reporte, Proveedor } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { AdminAuthModal } from '../../components/auth/AdminAuthModal';
import { useAuth } from '../../context/AuthContext';
import { NavSection } from '../../components/layout/Sidebar';

interface CotizacionesPageProps {
  onNavigate?: (section: NavSection) => void;
}

interface EditableRepuesto {
  id: string;
  nombre_repuesto: string;
  cantidad: number;
  precio_unitario: number;
  costo_unitario_proveedor: number;
  proveedor_id: string;
  crear_en_catalogo: boolean;
  codigo_catalogo: string;
}

interface EditableTrabajo {
  id: string;
  descripcion: string;
  costo: number;
  costo_proveedor: number;
  proveedor_id: string;
}

export const CotizacionesPage: React.FC<CotizacionesPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    return (
      user?.is_superuser === true ||
      user?.is_staff === true ||
      sessionStorage.getItem('catalogo_admin_unlocked') === 'true'
    );
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);

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
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
  const loadProveedores = () => {
    api.getProveedores().then((provs) => {
      setProveedores(provs.filter((p) => p.activo !== false));
    }).catch(() => {});
  };

  useEffect(() => {
    loadProveedores();
  }, []);

  // Fetch quotes
  const fetchCotizaciones = async () => {
    setLoading(true);
    try {
      const data = await api.getCotizaciones(tabEstado, search);
      setReportes(data);
    } catch (err) {
      console.error('Error al cargar cotizaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminUnlocked) {
      fetchCotizaciones();
    }
  }, [tabEstado, search, isAdminUnlocked]);

  // Handle open editor
  const handleOpenEdit = (rep: Reporte) => {
    setSelectedReporte(rep);
    setFeedback(null);

    // Prepare repuestos
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

    // Prepare trabajos
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

      // Add to local state
      setProveedores((prev) => [...prev, nuevo]);

      // Assign to the specific item
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

      // Update in local state
      setReportes((prev) =>
        prev.map((r) => (r.id === selectedReporte.id ? res.reporte : r))
      );
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

  // Helper check if repuesto is complete
  const isRepuestoCompleto = (r: EditableRepuesto) => {
    return Boolean(r.proveedor_id && r.costo_unitario_proveedor > 0);
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

  // Auth gate if not admin
  if (!isAdminUnlocked) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[70vh]">
        <Card className="p-8 max-w-md w-full text-center border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-[#3498db]/10 border border-[#3498db]/20 flex items-center justify-center text-[#3498db] mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Módulo Protegido
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            La supervisión de costos de adquisición, asignación de proveedores y validación de cotizaciones para facturación requiere clave de administrador.
          </p>
          <Button
            onClick={() => setAuthModalOpen(true)}
            className="w-full bg-[#3498db] hover:bg-[#2980b9] text-white font-medium py-2.5 flex items-center justify-center gap-2 shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Ingresar Clave</span>
          </Button>
        </Card>

        <AdminAuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => {
            sessionStorage.setItem('catalogo_admin_unlocked', 'true');
            setIsAdminUnlocked(true);
            setAuthModalOpen(false);
          }}
          targetSectionName="Cotizaciones y Costos"
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#3498db]/15 border border-[#3498db]/30 flex items-center justify-center text-[#3498db]">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Cotizaciones y Costos
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Valida proveedores y costos de repuestos de las fichas técnicas para habilitar su facturación
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCotizaciones}
            disabled={loading}
            className="text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards (Clean & Harmonious) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4 border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pendientes de Datos
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {stats.pendientes}
            </p>
            <p className="text-[11px] text-slate-400">
              Falta proveedor o costo de compra
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Listas para Facturar
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {stats.listas}
            </p>
            <p className="text-[11px] text-slate-400">
              100% validadas y habilitadas
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="w-11 h-11 rounded-xl bg-[#3498db]/10 border border-[#3498db]/20 flex items-center justify-center text-[#3498db] shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Evaluadas
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {stats.total}
            </p>
            <p className="text-[11px] text-slate-400">
              Informes con ítems cotizados
            </p>
          </div>
        </Card>
      </div>

      {/* Tabs and Search Bar (Harmonious & Unified) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTabEstado('PENDIENTES')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              tabEstado === 'PENDIENTES'
                ? 'bg-[#3498db] text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Pendientes de Completar
          </button>
          <button
            type="button"
            onClick={() => setTabEstado('LISTAS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              tabEstado === 'LISTAS'
                ? 'bg-[#3498db] text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Listas para Facturar
          </button>
          <button
            type="button"
            onClick={() => setTabEstado('TODAS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              tabEstado === 'TODAS'
                ? 'bg-[#3498db] text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Todas
          </button>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, CI u orden..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3498db]/40"
          />
        </div>
      </div>

      {/* Quote Reports List */}
      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-8 h-8 text-[#3498db] animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Cargando cotizaciones...</p>
        </div>
      ) : reportes.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-300 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {tabEstado === 'PENDIENTES'
              ? 'No hay cotizaciones pendientes de completar'
              : 'No se encontraron cotizaciones para este filtro'}
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {tabEstado === 'PENDIENTES'
              ? 'Todos los repuestos e ítems cotizados tienen asignados su proveedor y costo.'
              : 'Verifica los criterios de búsqueda o revisa las demás pestañas.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {reportes.map((rep) => {
            const orden = rep.orden;
            const equipo = getReporteEquipo(rep);
            const cliente = getReporteCliente(rep);
            const repAceptados = (rep.repuestos_utilizados || []).filter((r) => r.estado === 'COTIZADO');
            const trabAceptados = (rep.trabajos_realizados || []).filter((t) => t.estado === 'COTIZADO');
            const repIncompletos = repAceptados.filter(
              (r) => !r.proveedor || Number(r.costo_unitario_proveedor || 0) <= 0
            );
            const estaCompleto = repIncompletos.length === 0;

            return (
              <Card
                key={rep.id}
                className="p-5 transition-all duration-200 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        {orden?.numero_orden || 'ORD-S/N'}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(rep.fecha_creacion).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>

                      {/* Status Badge (Tasteful & Non-Chillón) */}
                      {estaCompleto ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Lista para Facturar</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          <span>{repIncompletos.length} repuesto(s) pendientes</span>
                        </span>
                      )}

                      {rep.esta_facturado && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/10 text-[#3498db] border border-[#3498db]/20">
                          <ShoppingCart className="w-3 h-3" />
                          <span>Facturado</span>
                        </span>
                      )}
                    </div>

                    {/* Client & Device Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <UserIcon className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-semibold">
                          {cliente ? `${cliente.nombre} ${cliente.apellido || ''}` : 'Consumidor Final'}
                        </span>
                        {cliente?.ci && (
                          <span className="text-slate-400">({cliente.ci})</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <Laptop className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>
                          {equipo ? `${equipo.marca} ${equipo.modelo}` : 'Equipo en taller'}
                        </span>
                      </div>
                    </div>

                    {/* Items Overview Chips */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                        Repuestos: <strong className="text-slate-900 dark:text-white">{repAceptados.length}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                        Servicios: <strong className="text-slate-900 dark:text-white">{trabAceptados.length}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                        Total Cotizado: <strong className="text-emerald-600 dark:text-emerald-400">${Number(rep.total_aceptado || 0).toFixed(2)}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 lg:flex-col lg:items-end justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                    <Button
                      onClick={() => handleOpenEdit(rep)}
                      className="bg-[#3498db] hover:bg-[#2980b9] text-white text-xs font-semibold px-4 py-2 flex items-center gap-1.5 shadow-sm"
                    >
                      <Calculator className="w-4 h-4" />
                      <span>{estaCompleto ? 'Ver / Modificar Costos' : 'Completar Datos'}</span>
                    </Button>

                    {estaCompleto && onNavigate && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onNavigate('reportes')}
                        className="text-xs text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Ir a Facturar</span>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: COMPLETAR / EDITAR DATOS DE COTIZACIÓN Y PROVEEDOR   */}
      {/* ========================================================= */}
      {selectedReporte && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedReporte(null)}
          title="Completar y Validar Cotización"
          maxWidth="4xl"
        >
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
            {/* Header Context Info */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-medium text-slate-500">Orden: </span>
                <strong className="text-slate-900 dark:text-white font-mono">
                  {selectedReporte.orden?.numero_orden || 'S/N'}
                </strong>
                <span className="mx-2 text-slate-300">•</span>
                <span className="font-medium text-slate-500">Equipo: </span>
                <strong className="text-slate-900 dark:text-white">
                  {selectedReporte.orden?.equipo?.marca} {selectedReporte.orden?.equipo?.modelo}
                </strong>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <Info className="w-4 h-4 text-[#3498db]" />
                <span>Asigna proveedor y costo unitario a los repuestos para habilitar la factura.</span>
              </div>
            </div>

            {/* Notification / Feedback */}
            {feedback && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                )}
                <span className="font-medium">{feedback.message}</span>
              </div>
            )}

            {/* SECTION 1: REPUESTOS (PRODUCTOS) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#3498db]" />
                  <span>Repuestos Utilizados ({editRepuestos.length})</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  Campo requerido: Proveedor y Costo de compra
                </span>
              </div>

              {editRepuestos.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                  No hay repuestos cotizados en esta ficha técnica.
                </p>
              ) : (
                <div className="space-y-3">
                  {editRepuestos.map((item, idx) => {
                    const costoTotal = item.costo_unitario_proveedor * item.cantidad;
                    const ventaTotal = item.precio_unitario * item.cantidad;
                    const ganancia = ventaTotal - costoTotal;
                    const margenPct = ventaTotal > 0 ? (ganancia / ventaTotal) * 100 : 0;
                    const isComplete = isRepuestoCompleto(item);

                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-700/50">
                          <div>
                            <span className="font-semibold text-xs text-slate-900 dark:text-white">
                              {item.nombre_repuesto}
                            </span>
                            <span className="text-[11px] text-slate-500 ml-2">
                              Cant: {item.cantidad} un. | Precio Cotizado:{' '}
                              <strong className="text-slate-800 dark:text-slate-200">
                                ${item.precio_unitario.toFixed(2)} c/u
                              </strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isComplete ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                <Check className="w-3 h-3 text-emerald-500" />
                                Completo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                                Requiere datos
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Inputs Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                          {/* Proveedor with New Provider Option */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                Proveedor <span className="text-rose-500">*</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => handleOpenNuevoProveedor(idx, 'repuesto')}
                                className="text-[11px] text-[#3498db] hover:text-[#2980b9] font-medium transition-colors flex items-center gap-0.5"
                                title="Registrar un nuevo proveedor"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Nuevo</span>
                              </button>
                            </div>
                            <select
                              value={item.proveedor_id}
                              onChange={(e) => {
                                if (e.target.value === '__new__') {
                                  handleOpenNuevoProveedor(idx, 'repuesto');
                                } else {
                                  const newId = e.target.value;
                                  setEditRepuestos((prev) =>
                                    prev.map((r, i) =>
                                      i === idx ? { ...r, proveedor_id: newId } : r
                                    )
                                  );
                                }
                              }}
                              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-[#3498db]/40"
                            >
                              <option value="">-- Seleccionar Proveedor --</option>
                              {proveedores.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.nombre_o_razon_social}
                                </option>
                              ))}
                              <option value="__new__">+ Crear nuevo proveedor...</option>
                            </select>
                          </div>

                          {/* Costo Unitario de Compra */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Costo de Adquisición ($) <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                                $
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.costo_unitario_proveedor || ''}
                                placeholder="0.00"
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setEditRepuestos((prev) =>
                                    prev.map((r, i) =>
                                      i === idx
                                        ? { ...r, costo_unitario_proveedor: val }
                                        : r
                                    )
                                  );
                                }}
                                className="w-full pl-7 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#3498db]/40 font-mono font-medium"
                              />
                            </div>
                          </div>

                          {/* Margen Calculado */}
                          <div className="flex flex-col justify-center bg-white dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] uppercase font-semibold text-slate-400">
                              Margen Estimado
                            </span>
                            <div className="flex items-center justify-between mt-0.5">
                              <span
                                className={`text-xs font-mono font-bold ${
                                  ganancia >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                                }`}
                              >
                                ${ganancia.toFixed(2)} ({margenPct.toFixed(1)}%)
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Ganancia neta
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Checkbox: Guardar en Catálogo de Productos */}
                        <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center gap-3">
                          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                            <input
                              type="checkbox"
                              checked={item.crear_en_catalogo}
                              onChange={(e) => {
                                const chk = e.target.checked;
                                setEditRepuestos((prev) =>
                                  prev.map((r, i) =>
                                    i === idx ? { ...r, crear_en_catalogo: chk } : r
                                  )
                                );
                              }}
                              className="w-3.5 h-3.5 rounded text-[#3498db] focus:ring-[#3498db]/40"
                            />
                            <span className="font-medium">
                              Registrar como nuevo producto en el catálogo oficial
                            </span>
                          </label>

                          {item.crear_en_catalogo && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-[11px] text-slate-400">Código sugerido:</span>
                              <input
                                type="text"
                                value={item.codigo_catalogo}
                                onChange={(e) => {
                                  const code = e.target.value;
                                  setEditRepuestos((prev) =>
                                    prev.map((r, i) =>
                                      i === idx ? { ...r, codigo_catalogo: code } : r
                                    )
                                  );
                                }}
                                className="px-2 py-0.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECTION 2: TRABAJOS (SERVICIOS) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-[#3498db]" />
                  <span>Trabajos Realizados / Mano de Obra ({editTrabajos.length})</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  Mano de obra interna o servicios tercerizados
                </span>
              </div>

              {editTrabajos.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                  No hay trabajos cotizados en esta ficha técnica.
                </p>
              ) : (
                <div className="space-y-3">
                  {editTrabajos.map((item, idx) => {
                    const ganancia = item.costo - item.costo_proveedor;
                    const margenPct = item.costo > 0 ? (ganancia / item.costo) * 100 : 0;

                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
                          <span className="font-semibold text-xs text-slate-900 dark:text-white">
                            {item.descripcion}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Precio Cliente:{' '}
                            <strong className="text-slate-800 dark:text-slate-200">
                              ${item.costo.toFixed(2)}
                            </strong>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Proveedor / Tercerizado */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                Taller / Tercerizado (Opcional)
                              </label>
                              <button
                                type="button"
                                onClick={() => handleOpenNuevoProveedor(idx, 'trabajo')}
                                className="text-[11px] text-[#3498db] hover:text-[#2980b9] font-medium transition-colors flex items-center gap-0.5"
                                title="Registrar un nuevo proveedor"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Nuevo</span>
                              </button>
                            </div>
                            <select
                              value={item.proveedor_id}
                              onChange={(e) => {
                                if (e.target.value === '__new__') {
                                  handleOpenNuevoProveedor(idx, 'trabajo');
                                } else {
                                  const newId = e.target.value;
                                  setEditTrabajos((prev) =>
                                    prev.map((t, i) =>
                                      i === idx ? { ...t, proveedor_id: newId } : t
                                    )
                                  );
                                }
                              }}
                              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-[#3498db]/40"
                            >
                              <option value="">Interno (Tecnishop)</option>
                              {proveedores.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.nombre_o_razon_social}
                                </option>
                              ))}
                              <option value="__new__">+ Registrar nuevo proveedor...</option>
                            </select>
                          </div>

                          {/* Costo Mano de Obra */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Costo Tercerizado ($)
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                                $
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.costo_proveedor || ''}
                                placeholder="0.00"
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setEditTrabajos((prev) =>
                                    prev.map((t, i) =>
                                      i === idx ? { ...t, costo_proveedor: val } : t
                                    )
                                  );
                                }}
                                className="w-full pl-7 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#3498db]/40 font-mono"
                              />
                            </div>
                          </div>

                          {/* Margen */}
                          <div className="flex flex-col justify-center bg-white dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] uppercase font-semibold text-slate-400">
                              Margen Taller
                            </span>
                            <div className="flex items-center justify-between mt-0.5">
                              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                ${ganancia.toFixed(2)} ({margenPct.toFixed(1)}%)
                              </span>
                              <span className="text-[10px] text-slate-400">Rendimiento</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer Modal Actions */}
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedReporte(null)}
              className="text-xs"
            >
              Cerrar
            </Button>

            <div className="flex items-center gap-2">
              {feedback?.type === 'success' && onNavigate && (
                <Button
                  onClick={() => {
                    setSelectedReporte(null);
                    onNavigate('reportes');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Proceder a Facturar en Informe</span>
                </Button>
              )}

              <Button
                onClick={handleSaveCotizacion}
                disabled={isSaving}
                className="bg-[#3498db] hover:bg-[#2980b9] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Guardando...' : 'Guardar y Validar Cotización'}</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* MODAL SECUNDARIO: CREAR NUEVO PROVEEDOR                   */}
      {/* ========================================================= */}
      {nuevoProveedorModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setNuevoProveedorModalOpen(false)}
          title="Registrar Nuevo Proveedor"
          maxWidth="md"
        >
          <form onSubmit={handleCrearNuevoProveedor} className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Registra el nuevo proveedor para asignarlo directamente a la cotización y guardarlo en el directorio.
            </p>

            {errorNuevoProveedor && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                {errorNuevoProveedor}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nombre o Razón Social <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="Ej. Distribuidora Electrónica S.A."
                value={nuevoProvForm.nombre_o_razon_social}
                onChange={(e) =>
                  setNuevoProvForm({ ...nuevoProvForm, nombre_o_razon_social: e.target.value })
                }
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#3498db]/40"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  RUC / Cédula
                </label>
                <input
                  type="text"
                  placeholder="Ej. 1790012345001"
                  value={nuevoProvForm.ruc_cedula}
                  onChange={(e) =>
                    setNuevoProvForm({ ...nuevoProvForm, ruc_cedula: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#3498db]/40"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  placeholder="Ej. 0991234567"
                  value={nuevoProvForm.telefono}
                  onChange={(e) =>
                    setNuevoProvForm({ ...nuevoProvForm, telefono: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#3498db]/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Contacto o Vendedor
              </label>
              <input
                type="text"
                placeholder="Ej. Juan Pérez"
                value={nuevoProvForm.nombre_contacto}
                onChange={(e) =>
                  setNuevoProvForm({ ...nuevoProvForm, nombre_contacto: e.target.value })
                }
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#3498db]/40"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNuevoProveedorModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={creandoProveedor}
                className="bg-[#3498db] hover:bg-[#2980b9] text-white text-xs font-semibold px-4 py-2"
              >
                {creandoProveedor ? 'Guardando...' : 'Guardar Proveedor'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
