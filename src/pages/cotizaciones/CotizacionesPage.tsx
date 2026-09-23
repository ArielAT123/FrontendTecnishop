import React, { useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AdminAuthModal } from '../../components/auth/AdminAuthModal';
import { useAuth } from '../../context/AuthContext';
import { NavSection } from '../../components/layout/Sidebar';
import { CotizacionesHeader } from '../../components/cotizaciones/CotizacionesHeader';
import { CotizacionesStatsCards } from '../../components/cotizaciones/CotizacionesStatsCards';
import { CotizacionesList } from '../../components/cotizaciones/CotizacionesList';
import { CotizacionEditorModal } from '../../components/cotizaciones/CotizacionEditorModal';
import { NuevoProveedorModal } from '../../components/cotizaciones/NuevoProveedorModal';
import { useCotizacionesLogic } from './useCotizacionesLogic';

interface CotizacionesPageProps {
  onNavigate?: (section: NavSection) => void;
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

  const {
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
  } = useCotizacionesLogic(isAdminUnlocked);

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
      {/* Header with Search and Tabs */}
      <CotizacionesHeader
        loading={loading}
        onRefresh={fetchCotizaciones}
        tabEstado={tabEstado}
        setTabEstado={setTabEstado}
        search={search}
        setSearch={setSearch}
      />

      {/* Stats Cards */}
      <CotizacionesStatsCards
        pendientes={stats.pendientes}
        listas={stats.listas}
        total={stats.total}
      />

      {/* Quote Reports List */}
      <CotizacionesList
        loading={loading}
        reportes={reportes}
        tabEstado={tabEstado}
        getReporteEquipo={getReporteEquipo}
        getReporteCliente={getReporteCliente}
        onOpenEdit={handleOpenEdit}
        onNavigate={onNavigate}
      />

      {/* Modal: Editar y Validar Cotización */}
      <CotizacionEditorModal
        selectedReporte={selectedReporte}
        onClose={() => setSelectedReporte(null)}
        feedback={feedback}
        editRepuestos={editRepuestos}
        setEditRepuestos={setEditRepuestos}
        editTrabajos={editTrabajos}
        setEditTrabajos={setEditTrabajos}
        proveedores={proveedores}
        handleOpenNuevoProveedor={handleOpenNuevoProveedor}
        isSaving={isSaving}
        onSave={handleSaveCotizacion}
        onNavigate={onNavigate}
      />

      {/* Modal: Registrar Nuevo Proveedor */}
      <NuevoProveedorModal
        isOpen={nuevoProveedorModalOpen}
        onClose={() => setNuevoProveedorModalOpen(false)}
        form={nuevoProvForm}
        setForm={setNuevoProvForm}
        onSubmit={handleCrearNuevoProveedor}
        isLoading={creandoProveedor}
        error={errorNuevoProveedor}
      />
    </div>
  );
};
