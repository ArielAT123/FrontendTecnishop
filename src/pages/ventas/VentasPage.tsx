import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { api } from '../../api/client';
import { Producto, Cliente, Venta, CreateVentaPayload } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { FacturaPrintModal } from '../../components/print/FacturaPrintModal';
import {
  Barcode,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  Search,
  User,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  Receipt,
  Printer,
  Eye,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface CartItem {
  producto: Producto;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export const VentasPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');

  // Scanner & Search State
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchManual, setSearchManual] = useState('');
  const [scanStatusMessage, setScanStatusMessage] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);

  // Checkout State
  const [clienteTipo, setClienteTipo] = useState<'consumidor_final' | 'registrado'>('consumidor_final');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [clienteSearch, setClienteSearch] = useState('');
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA'>('EFECTIVO');
  const [montoRecibido, setMontoRecibido] = useState<string>('');

  // Invoice Print Modal State
  const [emittedVenta, setEmittedVenta] = useState<Venta | null>(null);
  const [isFacturaModalOpen, setIsFacturaModalOpen] = useState(false);

  // Data queries
  const { data: productos = [], isSyncing: isSyncingProductos } = useCachedQuery<Producto[]>({
    queryKey: ['productos'],
    queryFn: () => api.getProductos(),
    keyField: 'codigo',
  });

  const { data: clientes = [], isSyncing: isSyncingClientes } = useCachedQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: () => api.getClientes(),
    keyField: 'ci',
  });

  const { data: ventasHistorial = [], isLoading: isLoadingVentas, isSyncing: isSyncingVentas } = useCachedQuery<Venta[]>({
    queryKey: ['ventas'],
    queryFn: () => api.getVentas(),
    keyField: 'id',
  });

  // Focus scanner input on mount and tab switch
  useEffect(() => {
    if (activeTab === 'pos') {
      barcodeInputRef.current?.focus();
    }
  }, [activeTab]);

  // Keep scanner focused automatically
  const ensureScannerFocused = () => {
    barcodeInputRef.current?.focus();
  };

  // Add Product to Cart helper
  const addProductToCart = (prod: Producto, qtyToAdd = 1) => {
    setScanError(null);

    // Check available stock
    const existingIndex = cart.findIndex((item) => item.producto.codigo === prod.codigo);
    const currentCartQty = existingIndex >= 0 ? cart[existingIndex].cantidad : 0;
    const requestedTotal = currentCartQty + qtyToAdd;

    if (requestedTotal > prod.cantidad) {
      setScanError(`¡Stock insuficiente para "${prod.nombre}"! Disponible: ${prod.cantidad}, en carrito: ${currentCartQty}`);
      return;
    }

    const unitPrice = Number(prod.precio_venta_recomendado || prod.precio_venta_sugerido || 0);

    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex].cantidad = requestedTotal;
      updated[existingIndex].subtotal = requestedTotal * unitPrice;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          producto: prod,
          cantidad: qtyToAdd,
          precio_unitario: unitPrice,
          subtotal: qtyToAdd * unitPrice,
        },
      ]);
    }

    setScanStatusMessage(`✓ Agregado: ${prod.nombre} (${prod.codigo})`);
    setTimeout(() => setScanStatusMessage(null), 3000);
  };

  // Handle Barcode Scanner submission
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    // Search in loaded products list (case-insensitive)
    const found = productos.find(
      (p) => p.codigo.trim().toLowerCase() === code.toLowerCase()
    );

    if (found) {
      addProductToCart(found);
      setBarcodeInput('');
    } else {
      // Fallback: try fetching directly from API
      api.getProductoByCodigo(code)
        .then((prod) => {
          addProductToCart(prod);
          setBarcodeInput('');
        })
        .catch(() => {
          setScanError(`No se encontró ningún producto con el código de barras: "${code}"`);
        });
    }
  };

  // Global scanner listener (handles fast keystrokes from USB/Bluetooth HID scanners)
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in regular text inputs (except barcode field)
      const target = e.target as HTMLElement;
      if (
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') &&
        target !== barcodeInputRef.current
      ) {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 100) {
        buffer = ''; // Reset if typing slowly
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length >= 2) {
          const scannedCode = buffer.trim();
          const prod = productos.find(
            (p) => p.codigo.trim().toLowerCase() === scannedCode.toLowerCase()
          );
          if (prod) {
            addProductToCart(prod);
          }
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [productos, cart]);

  // Update item quantity
  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeItem(index);
      return;
    }
    const item = cart[index];
    if (newQty > item.producto.cantidad) {
      setScanError(`Stock máximo alcanzado para ${item.producto.nombre}: ${item.producto.cantidad}`);
      return;
    }
    setScanError(null);
    const updated = [...cart];
    updated[index].cantidad = newQty;
    updated[index].subtotal = newQty * item.precio_unitario;
    setCart(updated);
  };

  // Remove item
  const removeItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setMontoRecibido('');
    setScanError(null);
    setScanStatusMessage(null);
  };

  // Calculation totals
  const subtotalTotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const ivaTotal = cart.reduce((acc, item) => {
    const taxRate = Number(item.producto.impuesto || 15) / 100;
    return acc + item.subtotal * taxRate;
  }, 0);
  const totalPagar = subtotalTotal + ivaTotal;

  const montoRecibidoNum = parseFloat(montoRecibido) || 0;
  const cambio = montoRecibidoNum > totalPagar ? montoRecibidoNum - totalPagar : 0;

  // Checkout Mutation
  const createSaleMutation = useMutation({
    mutationFn: (payload: CreateVentaPayload) => api.createVenta(payload),
    onSuccess: (ventaCreada) => {
      // Invalidate both products (stock updated) and sales history
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['ventas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

      setEmittedVenta(ventaCreada);
      setIsFacturaModalOpen(true);
      clearCart();
    },
    onError: (err: any) => {
      setScanError(err?.response?.data?.error || err.message || 'Error al procesar la venta');
    },
  });

  const handleFinalizarVenta = () => {
    if (cart.length === 0) {
      setScanError('El carrito de compras está vacío.');
      return;
    }

    const payload: CreateVentaPayload = {
      cliente_ci: clienteTipo === 'registrado' && selectedCliente ? selectedCliente.ci : undefined,
      cliente_nombre:
        clienteTipo === 'registrado' && selectedCliente
          ? `${selectedCliente.nombre} ${selectedCliente.apellido || ''}`.trim()
          : 'CONSUMIDOR FINAL',
      cliente_identificacion:
        clienteTipo === 'registrado' && selectedCliente ? selectedCliente.ci : '9999999999999',
      cliente_telefono:
        clienteTipo === 'registrado' && selectedCliente ? selectedCliente.telefono : undefined,
      cliente_direccion: undefined,
      metodo_pago: metodoPago,
      items: cart.map((item) => ({
        producto_id: item.producto.id,
        codigo: item.producto.codigo,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
      })),
    };

    createSaleMutation.mutate(payload);
  };

  // Filtered products for manual quick-picker
  const filteredManualProducts = searchManual.trim()
    ? productos
        .filter(
          (p) =>
            p.nombre.toLowerCase().includes(searchManual.toLowerCase()) ||
            p.codigo.toLowerCase().includes(searchManual.toLowerCase())
        )
        .slice(0, 6)
    : [];

  // Filtered clients for selector
  const filteredClientes = clienteSearch.trim()
    ? clientes
        .filter(
          (c) =>
            c.nombre.toLowerCase().includes(clienteSearch.toLowerCase()) ||
            (c.apellido && c.apellido.toLowerCase().includes(clienteSearch.toLowerCase())) ||
            c.ci.includes(clienteSearch)
        )
        .slice(0, 5)
    : [];

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      {/* Top Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5 tracking-tight">
            <span className="p-2 rounded-xl bg-[#3498db] text-white shadow-md shadow-[#3498db]/30">
              <ShoppingCart className="w-6 h-6" />
            </span>
            Punto de Venta (POS) & Facturación
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Escaneo de código de barras, cobro y descuento automático de inventario
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-200 dark:bg-slate-800/70 p-1 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700/60">
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'pos'
                ? 'bg-[#3498db] text-white shadow-md shadow-[#3498db]/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Barcode className="w-4 h-4" />
            <span>Nueva Venta</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'history'
                ? 'bg-[#3498db] text-white shadow-md shadow-[#3498db]/30'
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

      {activeTab === 'pos' ? (
        /* ======================== VISTA POS / NUEVA VENTA ======================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: SCANNER & CART (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* BARCODE SCANNER BOX */}
            <Card className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm">
              <form onSubmit={handleBarcodeSubmit} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold text-[#3498db] tracking-wider uppercase">
                      Lector de Código de Barras Activo
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Pistola USB / Bluetooth o Teclado + Enter
                  </span>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#3498db]">
                    <Barcode className="w-6 h-6" />
                  </div>
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Dispara el escáner o escribe el código de barras aquí y presiona Enter..."
                    className="w-full pl-12 pr-28 py-3.5 bg-white dark:bg-slate-950 border-2 border-[#3498db]/60 focus:border-[#3498db] rounded-xl text-slate-900 dark:text-white font-mono text-sm shadow-inner focus:outline-none focus:ring-4 focus:ring-[#3498db]/20 transition-all placeholder:text-slate-400"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="absolute inset-y-1.5 right-1.5 px-4 bg-[#3498db] hover:bg-[#2980b9] text-white font-bold text-xs rounded-lg transition-colors shadow-md flex items-center gap-1.5"
                  >
                    <span>Agregar</span>
                  </button>
                </div>
              </form>

              {/* Status / Alerts */}
              {scanStatusMessage && (
                <div className="mt-2.5 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-400 text-xs font-semibold animate-fadeIn">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{scanStatusMessage}</span>
                </div>
              )}

              {scanError && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-rose-400 text-xs font-semibold animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{scanError}</span>
                  </div>
                  <button
                    onClick={() => setScanError(null)}
                    className="text-rose-300 hover:text-white text-xs underline"
                  >
                    Entendido
                  </button>
                </div>
              )}

              {/* Manual search helper accordion */}
              <div className="pt-2 border-t border-slate-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex-1 w-full relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchManual}
                    onChange={(e) => setSearchManual(e.target.value)}
                    placeholder="Búsqueda manual por nombre o código..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#3498db]"
                  />
                </div>
                {searchManual && (
                  <button
                    onClick={() => setSearchManual('')}
                    className="text-[11px] text-slate-400 hover:text-white whitespace-nowrap"
                  >
                    Limpiar búsqueda
                  </button>
                )}
              </div>

              {/* Quick Results Drawer */}
              {filteredManualProducts.length > 0 && (
                <div className="mt-2 p-2 bg-slate-900 border border-slate-700 rounded-xl space-y-1 animate-fadeIn">
                  <p className="text-[10px] uppercase font-bold text-slate-400 px-2">Resultados coincidentes:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {filteredManualProducts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          addProductToCart(p);
                          setSearchManual('');
                          ensureScannerFocused();
                        }}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-left transition-colors border border-slate-700/60"
                      >
                        <div className="truncate pr-2">
                          <p className="text-xs font-bold text-white truncate">{p.nombre}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {p.codigo} &bull; Stock: <b className={p.cantidad <= 2 ? 'text-amber-400' : 'text-emerald-400'}>{p.cantidad}</b>
                          </p>
                        </div>
                        <span className="font-mono font-bold text-xs text-[#3498db] whitespace-nowrap">
                          ${Number(p.precio_venta_recomendado || p.precio_venta_sugerido || 0).toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* CART ITEMS TABLE */}
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Productos en la Venta ({cart.reduce((sum, item) => sum + item.cantidad, 0)} unidades)
                  </span>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Vaciar Carrito</span>
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <Barcode className="w-8 h-8 opacity-60" />
                  </div>
                  <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                    El carrito está vacío
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Apunta y escanea el código de barras de cualquier producto con tu pistola lectora para comenzar a facturar.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/50 text-slate-500">
                        <th className="py-2.5 px-4 font-semibold">Producto / Código</th>
                        <th className="py-2.5 px-2 font-semibold text-center w-28">Cantidad</th>
                        <th className="py-2.5 px-3 font-semibold text-right">P. Unitario</th>
                        <th className="py-2.5 px-3 font-semibold text-right">IVA</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Subtotal</th>
                        <th className="py-2.5 px-3 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {cart.map((item, index) => {
                        const taxRate = Number(item.producto.impuesto || 15);
                        return (
                          <tr
                            key={item.producto.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-900 dark:text-slate-100">{item.producto.nombre}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                Código: {item.producto.codigo} &bull; Disponible: {item.producto.cantidad}
                              </p>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <div className="inline-flex items-center border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden">
                                <button
                                  onClick={() => updateQuantity(index, item.cantidad - 1)}
                                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  max={item.producto.cantidad}
                                  value={item.cantidad}
                                  onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                                  className="w-12 text-center bg-transparent text-xs font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <button
                                  onClick={() => updateQuantity(index, item.cantidad + 1)}
                                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-medium">
                              ${item.precio_unitario.toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-[11px] text-slate-400">
                              {taxRate}%
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                              ${item.subtotal.toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => removeItem(index)}
                                className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
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
          </div>

          {/* RIGHT: CHECKOUT & PAYMENT PANEL (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* CLIENT SELECTION CARD */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#3498db]" />
                  Datos del Cliente
                </span>
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    onClick={() => {
                      setClienteTipo('consumidor_final');
                      setSelectedCliente(null);
                    }}
                    className={`px-2 py-1 rounded transition-colors ${
                      clienteTipo === 'consumidor_final'
                        ? 'bg-[#3498db] text-white'
                        : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    Final
                  </button>
                  <button
                    onClick={() => setClienteTipo('registrado')}
                    className={`px-2 py-1 rounded transition-colors ${
                      clienteTipo === 'registrado'
                        ? 'bg-[#3498db] text-white'
                        : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    Registrado
                  </button>
                </div>
              </div>

              {clienteTipo === 'consumidor_final' ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs space-y-1 border border-slate-200/80 dark:border-slate-800/80">
                  <p className="font-bold text-slate-800 dark:text-slate-200">CONSUMIDOR FINAL</p>
                  <p className="text-[11px] text-slate-400 font-mono">R.U.C./C.I.: 9999999999999</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={clienteSearch}
                    onChange={(e) => setClienteSearch(e.target.value)}
                    placeholder="Buscar cliente por C.I. o nombre..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:border-[#3498db]"
                  />

                  {filteredClientes.length > 0 && !selectedCliente && (
                    <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 divide-y divide-slate-800">
                      {filteredClientes.map((c) => (
                        <button
                          key={c.ci}
                          onClick={() => {
                            setSelectedCliente(c);
                            setClienteSearch('');
                          }}
                          className="w-full p-2 text-left hover:bg-slate-800 text-xs transition-colors"
                        >
                          <p className="font-bold text-white">{c.nombre} {c.apellido || ''}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{c.ci}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedCliente && (
                    <div className="p-2.5 bg-blue-950/30 border border-[#3498db]/40 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-white">{selectedCliente.nombre} {selectedCliente.apellido || ''}</p>
                        <p className="text-[10px] text-slate-400 font-mono">C.I.: {selectedCliente.ci} {selectedCliente.telefono && `• ${selectedCliente.telefono}`}</p>
                      </div>
                      <button
                        onClick={() => setSelectedCliente(null)}
                        className="text-xs text-rose-400 hover:text-rose-300 underline"
                      >
                        Cambiar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* PAYMENT METHOD CARD */}
            <Card className="p-4 space-y-3">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
                <CreditCard className="w-4 h-4 text-[#3498db]" />
                Forma de Pago
              </span>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMetodoPago('EFECTIVO')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    metodoPago === 'EFECTIVO'
                      ? 'bg-[#3498db] text-white border-[#3498db] shadow-md shadow-[#3498db]/30 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Banknote className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-[11px]">Efectivo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMetodoPago('TARJETA')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    metodoPago === 'TARJETA'
                      ? 'bg-[#3498db] text-white border-[#3498db] shadow-md shadow-[#3498db]/30 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-[11px]">Tarjeta</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMetodoPago('TRANSFERENCIA')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    metodoPago === 'TRANSFERENCIA'
                      ? 'bg-[#3498db] text-white border-[#3498db] shadow-md shadow-[#3498db]/30 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <ArrowRightLeft className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-[11px]">Transferencia</span>
                </button>
              </div>

              {/* Cash change calculator */}
              {metodoPago === 'EFECTIVO' && cart.length > 0 && (
                <div className="pt-2 border-t border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Efectivo Recibido ($):</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={montoRecibido}
                      onChange={(e) => setMontoRecibido(e.target.value)}
                      className="w-24 px-2 py-1 text-right font-mono font-bold bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-[#3498db]"
                    />
                  </div>
                  {montoRecibidoNum > 0 && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs">
                      <span className="text-emerald-400 font-bold">Cambio / Vuelto:</span>
                      <span className="font-mono font-black text-emerald-300 text-sm">
                        ${cambio.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* TOTALS & CHECKOUT BUTTON */}
            <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal Sin Impuestos:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    ${subtotalTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>I.V.A. (15%):</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    ${ivaTotal.toFixed(2)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
                  <span className="text-sm font-black text-slate-900 dark:text-white">TOTAL:</span>
                  <span className="text-2xl font-black text-[#3498db] font-mono">
                    ${totalPagar.toFixed(2)}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleFinalizarVenta}
                disabled={cart.length === 0 || createSaleMutation.isPending}
                isLoading={createSaleMutation.isPending}
                className="w-full py-4 text-sm font-black bg-[#3498db] hover:bg-[#2980b9] text-white shadow-xl shadow-[#3498db]/30 rounded-xl"
              >
                Cobrar y Emitir Factura
              </Button>
            </Card>
          </div>
        </div>
      ) : (
        /* ======================== HISTORIAL DE FACTURAS ======================== */
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#3498db]" />
              <span>Registro de Facturas Emitidas</span>
              {isSyncingVentas && (
                <span className="text-[10px] font-normal text-[#3498db] animate-pulse bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                  Sincronizando...
                </span>
              )}
            </h3>
            <span className="text-xs text-slate-400">
              Total facturas registradas: <b>{ventasHistorial.length}</b>
            </span>
          </div>

          {isLoadingVentas && ventasHistorial.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">Cargando facturas...</div>
          ) : ventasHistorial.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No hay facturas emitidas todavía.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/50 text-slate-500 font-semibold">
                    <th className="py-3 px-4">N° Factura</th>
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Método Pago</th>
                    <th className="py-3 px-4">Atendido Por</th>
                    <th className="py-3 px-4 text-right">Total Facturado</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {ventasHistorial.map((v) => (
                    <tr
                      key={v.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#3498db]">
                        {v.numero_factura}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {new Date(v.fecha).toLocaleString('es-EC', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{v.cliente_nombre}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{v.cliente_identificacion}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {v.metodo_pago}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{v.usuario || 'admin'}</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900 dark:text-white text-sm">
                        ${Number(v.total).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setEmittedVenta(v);
                            setIsFacturaModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#3498db] hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                          title="Visualizar e Imprimir Factura"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* FACTURA PRINT & PREVIEW MODAL */}
      <FacturaPrintModal
        venta={emittedVenta}
        isOpen={isFacturaModalOpen}
        onClose={() => setIsFacturaModalOpen(false)}
        onNewSale={() => {
          setActiveTab('pos');
          ensureScannerFocused();
        }}
      />
    </div>
  );
};
