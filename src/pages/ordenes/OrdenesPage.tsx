import React from 'react';
import { Orden } from '../../types';
import { NavSection } from '../../components/layout/Sidebar';
import { OrdenPrintModal } from '../../components/print/OrdenPrintModal';
import { RegistrarEquipoModal } from '../../components/equipos/RegistrarEquipoModal';
import { OrdenesHeader } from '../../components/ordenes/OrdenesHeader';
import { OrdenesTableView } from '../../components/ordenes/OrdenesTableView';
import { OrdenesClientesView } from '../../components/ordenes/OrdenesClientesView';
import { NuevaOrdenModal } from '../../components/ordenes/NuevaOrdenModal';
import { DetalleOrdenModal } from '../../components/ordenes/DetalleOrdenModal';
import { useOrdenesLogic } from './useOrdenesLogic';

interface OrdenesPageProps {
  onNavigate?: (section: NavSection) => void;
  onSelectOrderForReport?: (orden: Orden) => void;
}

export const OrdenesPage: React.FC<OrdenesPageProps> = ({
  onNavigate,
  onSelectOrderForReport,
}) => {
  const {
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
  } = useOrdenesLogic();

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Header with Search, Filter & New Button */}
      <OrdenesHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        viewMode={viewMode}
        setViewMode={setViewMode}
        clientsCount={groupedByClient.length}
        onNewOrder={() => {
          resetForm();
          setIsCreateOpen(true);
        }}
      />

      {/* Orders View: Flat Table OR Grouped by Client */}
      {viewMode === 'tabla' ? (
        <OrdenesTableView
          filteredOrdenes={filteredOrdenes}
          isLoading={isLoading}
          isSyncing={isSyncing}
          searchTerm={searchTerm}
          selectedStatus={selectedStatus}
          updatingOrderIds={updatingOrderIds}
          getOrdenCliente={getOrdenCliente}
          getOrdenEquipo={getOrdenEquipo}
          onUpdateStatus={(ordenId, status) =>
            updateStatusMutation.mutate({ ordenId, status })
          }
          onPrintOrden={(orden) => setPrintOrden(orden)}
          onViewOrden={(orden) => setViewingOrden(orden)}
          onNavigate={onNavigate}
          onSelectOrderForReport={onSelectOrderForReport}
        />
      ) : (
        <OrdenesClientesView
          groupedByClient={groupedByClient}
          filteredOrdenes={filteredOrdenes}
          expandedClients={expandedClients}
          toggleClient={toggleClient}
          toggleAllClients={toggleAllClients}
          isLoading={isLoading}
          isSyncing={isSyncing}
          searchTerm={searchTerm}
          selectedStatus={selectedStatus}
          updatingOrderIds={updatingOrderIds}
          getOrdenEquipo={getOrdenEquipo}
          onUpdateStatus={(ordenId, status) =>
            updateStatusMutation.mutate({ ordenId, status })
          }
          onPrintOrden={(orden) => setPrintOrden(orden)}
          onViewOrden={(orden) => setViewingOrden(orden)}
          onNavigate={onNavigate}
          onSelectOrderForReport={onSelectOrderForReport}
        />
      )}

      {/* Modal: Crear Nueva Orden */}
      <NuevaOrdenModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          resetForm();
        }}
        formError={formError}
        clientSearch={clientSearch}
        setClientSearch={setClientSearch}
        selectedCliente={selectedCliente}
        setSelectedCliente={setSelectedCliente}
        filteredClients={filteredClients}
        clientEquipos={clientEquipos}
        formData={formData}
        setFormData={setFormData}
        onOpenAddEquipo={() => {
          setFormError(null);
          setIsAddEquipoOpen(true);
        }}
        onSubmit={handleCreateSubmit}
        isSubmitting={createMutation.isPending}
      />

      {/* Modal: Registrar Equipo Nuevo para el Cliente */}
      <RegistrarEquipoModal
        isOpen={isAddEquipoOpen}
        onClose={() => setIsAddEquipoOpen(false)}
        clienteCi={selectedCliente?.ci}
        clienteNombre={
          selectedCliente
            ? `${selectedCliente.nombre} ${selectedCliente.apellido || ''}`.trim()
            : undefined
        }
        onEquipoCreated={(newEquipo) => {
          setFormData((prev) => ({ ...prev, equipo: newEquipo.id }));
          setIsAddEquipoOpen(false);
        }}
      />

      {/* Modal: Ver Detalle de Orden */}
      <DetalleOrdenModal
        orden={viewingOrden}
        onClose={() => setViewingOrden(null)}
        onPrint={(orden) => setPrintOrden(orden)}
      />

      {/* Modal: Impresión Oficial A4 Dual */}
      <OrdenPrintModal
        orden={printOrden}
        isOpen={!!printOrden}
        onClose={() => setPrintOrden(null)}
      />
    </div>
  );
};
