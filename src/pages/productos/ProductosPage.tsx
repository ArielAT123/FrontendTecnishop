import React from 'react';
import { Lock, KeyRound } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { AdminAuthModal } from '../../components/auth/AdminAuthModal';
import { ProveedoresModal } from '../../components/proveedores/ProveedoresModal';
import { useProductosLogic, UseProductosLogicProps } from './useProductosLogic';
import { ProductosHeader } from '../../components/productos/ProductosHeader';
import { ProductosTable } from '../../components/productos/ProductosTable';
import { NuevoProductoModal } from '../../components/productos/NuevoProductoModal';

export const ProductosPage: React.FC<UseProductosLogicProps> = ({
  activeTipo = 'PRODUCTO',
  onNavigate,
}) => {
  const {
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
    formData,
    setFormData,
    formError,
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
  } = useProductosLogic({ activeTipo, onNavigate });

  const formatMinutes = (minutes?: number) => {
    const m = Number(minutes) || 0;
    if (m <= 0) return 'Inmediato';
    const hrs = Math.floor(m / 60);
    const rem = m % 60;
    if (hrs > 0 && rem > 0) return `${hrs}h ${rem}m (${m} min)`;
    if (hrs > 0) return `${hrs}h (${m} min)`;
    return `${m} min`;
  };

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] p-6 text-center animate-fadeIn max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-[#3498db]/15 border border-[#3498db]/30 flex items-center justify-center text-[#3498db] mb-4 shadow-lg shadow-[#3498db]/15">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Catálogo & Tarifas Protegido
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          Esta sección contiene la gestión de inventario, {isService ? 'servicios técnicos' : 'productos y repuestos'} y tarifas de precios. Para evitar modificaciones no autorizadas por parte de empleados, ingresa la clave de administrador para acceder:
        </p>
        <Button
          onClick={() => setAuthModalOpen(true)}
          className="mt-6 bg-[#3498db] hover:bg-[#2980b9] text-white font-bold flex items-center gap-2 px-6 py-2.5 rounded-xl shadow-lg shadow-[#3498db]/25"
        >
          <KeyRound className="w-4 h-4" />
          <span>Ingresar Clave de Administrador</span>
        </Button>

        <AdminAuthModal
          isOpen={authModalOpen}
          onClose={() => {
            setAuthModalOpen(false);
            if (onNavigate) onNavigate('dashboard');
          }}
          onSuccess={() => {
            setIsUnlocked(true);
            setAuthModalOpen(false);
          }}
          targetSectionName={isService ? 'Servicios Técnicos' : 'Productos y Repuestos'}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Header with Search and Actions */}
      <ProductosHeader
        isService={isService}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onLockCatalog={() => {
          sessionStorage.removeItem('catalogo_admin_unlocked');
          setIsUnlocked(false);
          if (onNavigate) onNavigate('dashboard');
        }}
        fileInputRef={fileInputRef}
        onFileChange={handleFileChange}
        isUploadingExcel={excelMutation.isPending}
        proveedoresCount={proveedores.length}
        onOpenProveedoresModal={() => setIsProveedoresModalOpen(true)}
        onOpenCreateModal={() => {
          resetForm();
          setIsModalOpen(true);
        }}
        globalScannerMode={globalScannerMode}
        isServerOnline={isServerOnline}
        onNavigate={onNavigate}
        uploadStatus={uploadStatus}
        onDismissUploadStatus={() => setUploadStatus(null)}
      />

      {/* Products Table Card */}
      <ProductosTable
        isService={isService}
        filteredProductos={filteredProductos}
        isLoading={isLoading}
        isSyncing={isSyncing}
        searchTerm={searchTerm}
        formatMinutes={formatMinutes}
      />

      {/* Modal Crear Producto / Servicio */}
      <NuevoProductoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isService={isService}
        scanMode={scanMode}
        setScanMode={setScanMode}
        globalScannerMode={globalScannerMode}
        isServerOnline={isServerOnline}
        onNavigate={onNavigate}
        barcodeInputRef={barcodeInputRef}
        pistolaInput={pistolaInput}
        setPistolaInput={setPistolaInput}
        isSearchingWorldwide={isSearchingWorldwide}
        onBarcodeSubmit={(code) => handleBarcodeReceived(code, 'pistola')}
        lookupFeedback={lookupFeedback}
        onClearLookupFeedback={() => setLookupFeedback(null)}
        formError={formError}
        formData={formData}
        setFormData={setFormData}
        costo={costo}
        pvp={pvp}
        ganancia={ganancia}
        margenPorcentaje={margenPorcentaje}
        proveedores={proveedores}
        onOpenProveedoresModal={() => setIsProveedoresModalOpen(true)}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending}
        formatMinutes={formatMinutes}
      />

      {/* Modal de Proveedores */}
      <ProveedoresModal
        isOpen={isProveedoresModalOpen}
        onClose={() => setIsProveedoresModalOpen(false)}
        onSelectProveedor={(prov) => {
          setFormData((prev) => ({ ...prev, proveedor: prov.id }));
        }}
      />
    </div>
  );
};
