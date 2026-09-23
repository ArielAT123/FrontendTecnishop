import React, { useState, useMemo } from 'react';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { api } from '../../api/client';
import { Reporte, Orden, Producto, Venta } from '../../types';
import { FacturaPrintModal } from '../../components/print/FacturaPrintModal';
import { ReportesHeader } from '../../components/reportes/ReportesHeader';
import { ReportesTable } from '../../components/reportes/ReportesTable';
import { FichaTecnicaModal } from '../../components/reportes/FichaTecnicaModal';
import { VerFichaTecnicaModal } from '../../components/reportes/VerFichaTecnicaModal';
import { IncompleteItemsModal } from '../../components/reportes/IncompleteItemsModal';
import { useReportesForm } from './useReportesForm';
import { useReportesWhatsApp } from './useReportesWhatsApp';
import { checkIncompleteCotizacion, preparePosPrefill } from './reportesPosUtils';

export interface ReportesPageProps {
  selectedOrder?: Orden | null;
  onClearSelectedOrder?: () => void;
  onNavigate?: (section: any) => void;
}

export const ReportesPage: React.FC<ReportesPageProps> = ({
  selectedOrder,
  onClearSelectedOrder,
  onNavigate,
}) => {
  // Page view & search states
  const [viewMode, setViewMode] = useState<'tabla' | 'equipos'>('tabla');
  const [reportesSearch, setReportesSearch] = useState('');
  const [viewingReporte, setViewingReporte] = useState<Reporte | null>(null);

  // Factura & Print states
  const [facturaParaImprimir, setFacturaParaImprimir] = useState<Venta | null>(null);
  const [isFacturaModalOpen, setIsFacturaModalOpen] = useState(false);
  const [incompleteItemsError, setIncompleteItemsError] = useState<string[] | null>(null);

  // WhatsApp Hook
  const wa = useReportesWhatsApp();

  // Queries
  const { data: reportes = [], isLoading } = useCachedQuery<Reporte[]>({
    queryKey: ['reportes'],
    queryFn: () => api.getReportes(),
    keyField: 'id',
  });

  const { data: ordenesData } = useCachedQuery<any>({
    queryKey: ['ordenes'],
    queryFn: () => api.getOrdenes(0, 200),
    keyField: 'id',
    nestedArrayKey: 'ordenes',
  });

  const ordenes: Orden[] = useMemo(() => {
    if (Array.isArray(ordenesData)) return ordenesData;
    return ordenesData?.ordenes || [];
  }, [ordenesData]);

  const { data: productosInventario = [] } = useCachedQuery<Producto[]>({
    queryKey: ['productos'],
    queryFn: () => api.getProductos(),
    keyField: 'codigo',
  });

  const { data: chequeos = [] } = useCachedQuery<Producto[]>({
    queryKey: ['chequeos'],
    queryFn: () => api.getChequeos(),
    keyField: 'codigo',
  });

  // Entity resolver helpers
  const getReporteEquipo = (rep: Reporte) => {
    if (rep.orden?.equipo) return rep.orden.equipo;
    const ord = ordenes.find((o) => o.id === rep.orden_id);
    return ord?.equipo || (rep as any).equipo || null;
  };

  const getReporteCliente = (rep: Reporte) => {
    const eq = getReporteEquipo(rep);
    return eq?.cliente || (eq as any)?.cliente_ci || null;
  };

  // Pos navigation & checkup
  const handleFacturarDesdeVista = (rep: Reporte) => {
    const totAceptado = Number(rep.total_aceptado ?? rep.total_general ?? 0);
    if (totAceptado > 0 && !rep.cotizacion_completada) {
      const issues = checkIncompleteCotizacion(
        rep.trabajos_realizados || [],
        rep.repuestos_utilizados || []
      );
      if (issues.length > 0) {
        setIncompleteItemsError(issues);
        return;
      }
    }

    const cli = getReporteCliente(rep);
    const prefillData = preparePosPrefill(rep, productosInventario, chequeos, cli);
    sessionStorage.setItem('tecnishop_pos_prefill', JSON.stringify(prefillData));

    setViewingReporte(null);
    onNavigate?.('ventas');
  };

  // Form custom hook
  const form = useReportesForm({
    chequeos,
    onSuccess: () => {},
  });

  React.useEffect(() => {
    if (selectedOrder) {
      form.setOrdenId(selectedOrder.id);
      form.setIsCreateOpen(true);
      onClearSelectedOrder?.();
    }
  }, [selectedOrder]);

  const handleProcederAFacturacion = () => {
    form.saveMutation.mutate(undefined, {
      onSuccess: (data: any) => {
        if (data) {
          handleFacturarDesdeVista(data);
        }
      },
    });
  };

  // Factura detail fetching
  const handleOpenFacturaPrint = async (factura?: Venta | null, reporteId?: string) => {
    if (factura?.detalles && factura.detalles.length > 0) {
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
      } catch {
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
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Filtered queries
  const filteredReportes = useMemo(() => {
    return reportes.filter((r) => {
      const q = reportesSearch.toLowerCase().trim();
      if (!q) return true;
      const eq = getReporteEquipo(r);
      const cli = getReporteCliente(r);
      const numOrd = (r.orden?.numero_orden || '').toLowerCase();
      const cliNom = `${cli?.nombre || ''} ${cli?.apellido || ''}`.toLowerCase();
      const eqDesc = `${eq?.nombre || ''} ${eq?.marca || ''} ${eq?.modelo || ''}`.toLowerCase();
      const diag = (r.diagnostico_problemas || '').toLowerCase();
      return numOrd.includes(q) || cliNom.includes(q) || eqDesc.includes(q) || diag.includes(q);
    });
  }, [reportes, reportesSearch, ordenes]);

  const reportesPorEquipo = useMemo(() => {
    const map = new Map<string, any>();
    filteredReportes.forEach((rep) => {
      const eq = getReporteEquipo(rep);
      const cli = getReporteCliente(rep);
      const eqKey = eq?.numero_serie
        ? `sn-${eq.numero_serie}`
        : eq?.id
        ? `id-${eq.id}`
        : `eq-${eq?.marca || ''}-${eq?.modelo || ''}`;

      if (!map.has(eqKey)) {
        map.set(eqKey, {
          equipoKey: eqKey,
          equipo: eq,
          cliente: cli,
          reportes: [],
          totalAceptadoAcumulado: 0,
        });
      }
      const grp = map.get(eqKey);
      grp.reportes.push(rep);
      grp.totalAceptadoAcumulado += Number(rep.total_aceptado ?? rep.total_general ?? 0);
    });
    return Array.from(map.values());
  }, [filteredReportes]);

  const availableFilteredOrdenes = useMemo(() => {
    return ordenes.filter((o) => {
      const q = form.ordenSearch.toLowerCase().trim();
      if (!q) return true;
      const num = (o.numero_orden || '').toLowerCase();
      const cli = `${o.equipo?.cliente?.nombre || ''} ${o.equipo?.cliente?.apellido || ''}`.toLowerCase();
      const eq = `${o.equipo?.marca || ''} ${o.equipo?.modelo || ''}`.toLowerCase();
      return num.includes(q) || cli.includes(q) || eq.includes(q);
    });
  }, [ordenes, form.ordenSearch]);

  const currentSelectedOrden = useMemo(() => {
    if (!form.ordenId) return null;
    return ordenes.find((o) => o.id === form.ordenId) || null;
  }, [ordenes, form.ordenId]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Header with Search and New Button */}
      <ReportesHeader
        reportesSearch={reportesSearch}
        setReportesSearch={setReportesSearch}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onNewReporte={() => {
          form.resetForm();
          form.setIsCreateOpen(true);
        }}
      />

      {/* Main Reports Table / Groups */}
      <ReportesTable
        filteredReportes={filteredReportes}
        reportesPorEquipo={reportesPorEquipo}
        viewMode={viewMode}
        isLoading={isLoading}
        getReporteEquipo={getReporteEquipo}
        getReporteCliente={getReporteCliente}
        setViewingReporte={setViewingReporte}
        handleEditReporte={form.handleEditReporte}
        handleOpenFacturaPrint={handleOpenFacturaPrint}
        handleFacturarDesdeVista={handleFacturarDesdeVista}
        onNavigate={onNavigate}
      />

      {/* Modal: Crear / Editar Ficha Técnica & Cotización */}
      <FichaTecnicaModal
        isOpen={form.isCreateOpen}
        onClose={() => {
          form.setIsCreateOpen(false);
          form.resetForm();
        }}
        editingReporteId={form.editingReporteId}
        formError={form.formError}
        currentSelectedOrden={currentSelectedOrden}
        setOrdenId={form.setOrdenId}
        ordenSearch={form.ordenSearch}
        setOrdenSearch={form.setOrdenSearch}
        availableFilteredOrdenes={availableFilteredOrdenes}
        handleSelectOrden={(orden) => form.setOrdenId(orden.id)}
        diagnosticoProblemasList={form.diagnosticoProblemasList}
        problemaInputRefs={form.problemaInputRefs}
        handleProblemaChange={form.handleProblemaChange}
        handleProblemaKeyDown={form.handleProblemaKeyDown}
        handleRemoveProblema={form.handleRemoveProblema}
        handleAddProblema={form.handleAddProblema}
        tipoChequeoId={form.tipoChequeoId}
        handleSelectChequeo={form.handleSelectChequeo}
        chequeos={chequeos}
        precioChequeo={form.precioChequeo}
        setPrecioChequeo={form.setPrecioChequeo}
        trabajos={form.trabajos}
        setTrabajos={form.setTrabajos}
        handleAddTrabajo={form.handleAddTrabajo}
        handleRemoveTrabajo={form.handleRemoveTrabajo}
        handleToggleEstadoTrabajo={form.handleToggleEstadoTrabajo}
        repuestos={form.repuestos}
        setRepuestos={form.setRepuestos}
        handleAddRepuesto={form.handleAddRepuesto}
        handleRemoveRepuesto={form.handleRemoveRepuesto}
        handleToggleEstadoRepuesto={form.handleToggleEstadoRepuesto}
        handleRepuestoSelect={form.handleRepuestoSelect}
        productosCatalogo={productosInventario}
        personaACargo={form.personaACargo}
        setPersonaACargo={form.setPersonaACargo}
        observaciones={form.observaciones}
        setObservaciones={form.setObservaciones}
        totalAceptado={form.totalAceptado}
        totalRechazado={form.totalRechazado}
        isSaving={form.saveMutation.isPending}
        onSave={() => form.saveMutation.mutate()}
        onProcederAFacturacion={handleProcederAFacturacion}
      />

      {/* Modal: Ver / Imprimir Ficha Técnica Oficial */}
      <VerFichaTecnicaModal
        isOpen={!!viewingReporte}
        onClose={() => setViewingReporte(null)}
        reporte={viewingReporte}
        getReporteCliente={getReporteCliente}
        getReporteEquipo={getReporteEquipo}
        onNavigate={onNavigate}
        handleOpenFacturaPrint={handleOpenFacturaPrint}
        handleFacturarDesdeVista={handleFacturarDesdeVista}
        handleSendCotizacionWhatsApp={wa.handleSendCotizacionWhatsApp}
        handleSendInformeWhatsApp={wa.handleSendInformeWhatsApp}
        sendingCotizacionWhatsApp={wa.sendingCotizacionWhatsApp}
        sendingInformeWhatsApp={wa.sendingInformeWhatsApp}
        informeWhatsAppFeedback={wa.informeWhatsAppFeedback}
        isWhatsAppDropdownOpen={wa.isWhatsAppDropdownOpen}
        setIsWhatsAppDropdownOpen={wa.setIsWhatsAppDropdownOpen}
        whatsAppDropdownRef={wa.whatsAppDropdownRef}
      />

      {/* Modal: Alerta Ítems Incompletos */}
      <IncompleteItemsModal
        errorList={incompleteItemsError}
        onClose={() => setIncompleteItemsError(null)}
        onNavigate={onNavigate}
      />

      {/* Modal: Impresión de Factura */}
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
