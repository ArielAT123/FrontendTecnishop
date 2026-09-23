import React, { useState } from 'react';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { api } from '../../api/client';
import { Producto, Cliente, Venta } from '../../types';
import { Button } from '../../components/ui/Button';
import { FacturaPrintModal } from '../../components/print/FacturaPrintModal';
import { Receipt, Sparkles } from 'lucide-react';
import { useScannerConfig } from '../../context/ScannerContext';
import { PosScannerBar } from '../../components/ventas/PosScannerBar';
import { PosCartTable } from '../../components/ventas/PosCartTable';
import { PosCheckoutPanel } from '../../components/ventas/PosCheckoutPanel';
import { VentasHistoryTable } from '../../components/ventas/VentasHistoryTable';
import { IncompleteCartModal } from '../../components/ventas/IncompleteCartModal';
import { useVentasCart } from './useVentasCart';

export interface VentasPageProps {
  onNavigate?: (section: any) => void;
}

export const VentasPage: React.FC<VentasPageProps> = ({ onNavigate }) => {
  const { scannerMode, isServerOnline } = useScannerConfig();
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');

  // Queries
  const { data: productos = [] } = useCachedQuery<Producto[]>({
    queryKey: ['productos'],
    queryFn: () => api.getProductos(),
    keyField: 'codigo',
  });

  const { data: clientes = [] } = useCachedQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: () => api.getClientes(),
    keyField: 'ci',
  });

  const {
    data: ventasHistorial = [],
    isLoading: isLoadingVentas,
    isSyncing: isSyncingVentas,
  } = useCachedQuery<Venta[]>({
    queryKey: ['ventas'],
    queryFn: () => api.getVentas(),
    keyField: 'id',
  });

  // Custom Cart Hook
  const {
    barcodeInput,
    setBarcodeInput,
    searchManual,
    setSearchManual,
    scanStatusMessage,
    scanError,
    setScanError,
    incompleteCartModal,
    setIncompleteCartModal,
    barcodeInputRef,
    cart,
    posPrefill,
    clienteTipo,
    setClienteTipo,
    selectedCliente,
    setSelectedCliente,
    clienteSearch,
    setClienteSearch,
    metodoPago,
    setMetodoPago,
    montoRecibido,
    setMontoRecibido,
    emittedVenta,
    setEmittedVenta,
    isFacturaModalOpen,
    setIsFacturaModalOpen,
    subtotalTotal,
    ivaTotal,
    totalPagar,
    subtotal15,
    subtotal0,
    cambio,
    createSaleMutation,
    addProductToCart,
    handleBarcodeSubmit,
    updateQuantity,
    updateUnitPrice,
    updateItemTax,
    removeItem,
    clearCart,
    handleFinalizarVenta,
    filteredManualProducts,
    filteredClientes,
    ensureScannerFocused,
  } = useVentasCart({
    productos,
    clientes,
    scannerMode,
    activeTab,
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-fadeIn">
      {/* Top Bar with Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#3498db]" />
            <span>Punto de Venta (POS) & Facturación</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {activeTab === 'pos'
              ? 'Emite notas de venta o facturas comerciales a clientes'
              : 'Consulta facturas emitidas, reimprime comprobantes y audita totales'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'pos'
                ? 'bg-[#3498db] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Facturar (POS)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-[#3498db] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Historial de Facturas</span>
            <span className="ml-1 px-1.5 py-0.2 bg-slate-900/30 text-[10px] rounded-full">
              {ventasHistorial.length}
            </span>
          </button>
        </div>
      </div>

      {/* Banner de Facturación desde Ficha Técnica */}
      {posPrefill && activeTab === 'pos' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-blue-500/15 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">
                Facturación de Orden #{posPrefill.numeroOrden || posPrefill.ordenId?.slice(0, 8)} (Ficha Técnica)
              </p>
              <p className="text-xs text-blue-100">
                Cliente: <span className="font-semibold text-white">{posPrefill.clienteNombre}</span> &bull;{' '}
                {cart.length} ítem(s) cargados para facturar
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onNavigate?.('reportes');
              }}
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-xs font-bold h-9"
            >
              ← Volver a Ficha Técnica
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'pos' ? (
        /* Vista POS / Nueva Venta */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: SCANNER & CART (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <PosScannerBar
              scannerMode={scannerMode}
              isServerOnline={isServerOnline}
              barcodeInput={barcodeInput}
              setBarcodeInput={setBarcodeInput}
              barcodeInputRef={barcodeInputRef}
              handleBarcodeSubmit={handleBarcodeSubmit}
              scanStatusMessage={scanStatusMessage}
              scanError={scanError}
              setScanError={setScanError}
              searchManual={searchManual}
              setSearchManual={setSearchManual}
              filteredManualProducts={filteredManualProducts}
              onSelectManualProduct={(p) => {
                addProductToCart(p);
                setSearchManual('');
                ensureScannerFocused();
              }}
              onNavigate={onNavigate}
            />

            <PosCartTable
              cart={cart}
              onUpdateQuantity={updateQuantity}
              onUpdateUnitPrice={updateUnitPrice}
              onUpdateItemTax={updateItemTax}
              onRemoveItem={removeItem}
              onClearCart={clearCart}
            />
          </div>

          {/* RIGHT: CHECKOUT & PAYMENT PANEL (4 cols) */}
          <div className="lg:col-span-4">
            <PosCheckoutPanel
              clienteTipo={clienteTipo}
              setClienteTipo={setClienteTipo}
              selectedCliente={selectedCliente}
              setSelectedCliente={setSelectedCliente}
              clienteSearch={clienteSearch}
              setClienteSearch={setClienteSearch}
              filteredClientes={filteredClientes}
              metodoPago={metodoPago}
              setMetodoPago={setMetodoPago}
              montoRecibido={montoRecibido}
              setMontoRecibido={setMontoRecibido}
              cambio={cambio}
              cartLength={cart.length}
              subtotal0={subtotal0}
              subtotal15={subtotal15}
              subtotalTotal={subtotalTotal}
              ivaTotal={ivaTotal}
              totalPagar={totalPagar}
              onFinalizarVenta={handleFinalizarVenta}
              isProcessing={createSaleMutation.isPending}
            />
          </div>
        </div>
      ) : (
        /* Historial de Facturas */
        <VentasHistoryTable
          ventasHistorial={ventasHistorial}
          isLoadingVentas={isLoadingVentas}
          isSyncingVentas={isSyncingVentas}
          onPrintFactura={(v) => {
            setEmittedVenta(v);
            setIsFacturaModalOpen(true);
          }}
        />
      )}

      {/* Modal: Factura Print & Preview */}
      <FacturaPrintModal
        venta={emittedVenta}
        isOpen={isFacturaModalOpen}
        onClose={() => setIsFacturaModalOpen(false)}
        onNewSale={() => {
          setActiveTab('pos');
          ensureScannerFocused();
        }}
      />

      {/* Modal Bloqueante: Productos o Servicios Incompletos al Facturar */}
      <IncompleteCartModal
        errors={incompleteCartModal}
        onClose={() => setIncompleteCartModal(null)}
      />
    </div>
  );
};
