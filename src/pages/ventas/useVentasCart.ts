import { useState, useEffect, useMemo, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Producto, Cliente, Venta, CreateVentaPayload } from '../../types';
import { getProductPrice, getProductTaxRate } from '../../utils/productUtils';
import { CartItem } from '../../components/ventas/PosCartTable';
import { useScannerListener } from './useScannerListener';
import { validateCartItems } from './ventasUtils';

export interface PosPrefillData {
  ordenId?: string;
  reporteId?: string;
  numeroOrden?: string;
  clienteCi?: string;
  clienteNombre?: string;
  clienteTelefono?: string;
  items?: CartItem[];
}

export interface UseVentasCartOptions {
  productos: Producto[];
  clientes: Cliente[];
  scannerMode: string;
  activeTab: 'pos' | 'history';
}

export const useVentasCart = ({
  productos,
  clientes,
  scannerMode,
  activeTab,
}: UseVentasCartOptions) => {
  const queryClient = useQueryClient();

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [posPrefill, setPosPrefill] = useState<PosPrefillData | null>(null);
  const [incompleteCartModal, setIncompleteCartModal] = useState<string[] | null>(null);

  // Checkout State
  const [clienteTipo, setClienteTipo] = useState<'consumidor_final' | 'registrado'>(
    'consumidor_final'
  );
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [clienteSearch, setClienteSearch] = useState('');
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA'>('EFECTIVO');
  const [montoRecibido, setMontoRecibido] = useState<string>('');

  // Invoice Print Modal State
  const [emittedVenta, setEmittedVenta] = useState<Venta | null>(null);
  const [isFacturaModalOpen, setIsFacturaModalOpen] = useState(false);

  // Add Product to Cart helper
  const addProductToCart = useCallback(
    (prod: Producto, qtyToAdd = 1) => {
      const isService = prod.tipo === 'SERVICIO';
      const unitPrice = getProductPrice(prod);
      const taxRate = getProductTaxRate(prod);

      setCart((prevCart) => {
        const existingIndex = prevCart.findIndex(
          (item) => item.producto.codigo === prod.codigo
        );
        const currentCartQty = existingIndex >= 0 ? prevCart[existingIndex].cantidad : 0;
        const requestedTotal = currentCartQty + qtyToAdd;

        if (!isService && requestedTotal > prod.cantidad) {
          scanner.setScanError(
            `¡Stock insuficiente para "${prod.nombre}"! Disponible: ${prod.cantidad}, en carrito: ${currentCartQty}`
          );
          return prevCart;
        }

        scanner.setScanError(null);
        if (existingIndex >= 0) {
          const updated = [...prevCart];
          updated[existingIndex].cantidad = requestedTotal;
          updated[existingIndex].subtotal =
            requestedTotal * updated[existingIndex].precio_unitario;
          return updated;
        } else {
          return [
            ...prevCart,
            {
              producto: prod,
              cantidad: qtyToAdd,
              precio_unitario: unitPrice,
              impuesto_porcentaje: taxRate,
              subtotal: qtyToAdd * unitPrice,
            },
          ];
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Scanner listener hook
  const scanner = useScannerListener({
    productos,
    scannerMode,
    activeTab,
    onAddProduct: addProductToCart,
  });

  // Load Prefill from Ficha Técnica
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('tecnishop_pos_prefill');
      if (raw) {
        sessionStorage.removeItem('tecnishop_pos_prefill');
        const data: PosPrefillData = JSON.parse(raw);
        setPosPrefill(data);
        if (data.items && data.items.length > 0) {
          setCart(data.items);
        }
      }
    } catch (e) {
      console.error('Error al cargar datos precargados de ficha técnica', e);
    }
  }, []);

  // Preseleccionar cliente cuando los clientes estén disponibles
  useEffect(() => {
    if (posPrefill?.clienteCi && clientes.length > 0) {
      const found = clientes.find((c) => c.ci === posPrefill.clienteCi);
      if (found) {
        setSelectedCliente(found);
        setClienteTipo('registrado');
      }
    }
  }, [posPrefill, clientes]);

  // Update item quantity
  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeItem(index);
      return;
    }
    const item = cart[index];
    if (item.producto.tipo !== 'SERVICIO' && newQty > item.producto.cantidad) {
      scanner.setScanError(
        `Stock máximo alcanzado para ${item.producto.nombre}: ${item.producto.cantidad}`
      );
      return;
    }
    scanner.setScanError(null);
    const updated = [...cart];
    updated[index].cantidad = newQty;
    updated[index].subtotal = newQty * item.precio_unitario;
    setCart(updated);
  };

  const updateUnitPrice = (index: number, newPrice: number) => {
    const safePrice = Math.max(0, isNaN(newPrice) ? 0 : newPrice);
    const updated = [...cart];
    updated[index].precio_unitario = safePrice;
    updated[index].subtotal = updated[index].cantidad * safePrice;
    setCart(updated);
  };

  const updateItemTax = (index: number, newTax: number) => {
    const safeTax = Math.max(0, isNaN(newTax) ? 0 : newTax);
    const updated = [...cart];
    updated[index].impuesto_porcentaje = safeTax;
    setCart(updated);
  };

  const removeItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setPosPrefill(null);
    setSelectedCliente(null);
    setClienteTipo('consumidor_final');
    setClienteSearch('');
    setMontoRecibido('');
    scanner.setScanError(null);
    sessionStorage.removeItem('tecnishop_pos_prefill');
  };

  // Calculations
  const subtotalTotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.subtotal, 0),
    [cart]
  );
  const ivaTotal = useMemo(
    () =>
      cart.reduce((acc, item) => {
        const rate = (item.impuesto_porcentaje ?? 15) / 100;
        return acc + item.subtotal * rate;
      }, 0),
    [cart]
  );
  const totalPagar = subtotalTotal + ivaTotal;

  const subtotal15 = useMemo(
    () =>
      cart
        .filter((item) => (item.impuesto_porcentaje ?? 15) > 0)
        .reduce((acc, item) => acc + item.subtotal, 0),
    [cart]
  );

  const subtotal0 = useMemo(
    () =>
      cart
        .filter((item) => (item.impuesto_porcentaje ?? 15) === 0)
        .reduce((acc, item) => acc + item.subtotal, 0),
    [cart]
  );

  const montoRecibidoNum = parseFloat(montoRecibido) || 0;
  const cambio = montoRecibidoNum > totalPagar ? montoRecibidoNum - totalPagar : 0;

  // Checkout Mutation
  const createSaleMutation = useMutation({
    mutationFn: (payload: CreateVentaPayload) => api.createVenta(payload),
    onSuccess: (ventaCreada) => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['ventas'] });
      queryClient.invalidateQueries({ queryKey: ['ordenes'] });
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

      sessionStorage.removeItem('tecnishop_pos_prefill');
      setPosPrefill(null);

      setEmittedVenta(ventaCreada);
      setIsFacturaModalOpen(true);
      clearCart();
    },
    onError: (err: any) => {
      scanner.setScanError(
        err?.response?.data?.error || err.message || 'Error al procesar la venta'
      );
    },
  });

  const handleFinalizarVenta = () => {
    if (cart.length === 0) {
      scanner.setScanError('El carrito de compras está vacío.');
      return;
    }

    const incompleteCartItems = validateCartItems(cart);
    if (incompleteCartItems.length > 0) {
      setIncompleteCartModal(incompleteCartItems);
      return;
    }

    const payload: CreateVentaPayload = {
      cliente_ci:
        clienteTipo === 'registrado' && selectedCliente
          ? selectedCliente.ci
          : posPrefill?.clienteCi,
      cliente_nombre:
        clienteTipo === 'registrado' && selectedCliente
          ? `${selectedCliente.nombre} ${selectedCliente.apellido || ''}`.trim()
          : posPrefill?.clienteNombre || 'CONSUMIDOR FINAL',
      cliente_identificacion:
        clienteTipo === 'registrado' && selectedCliente
          ? selectedCliente.ci
          : posPrefill?.clienteCi || '9999999999999',
      cliente_telefono:
        clienteTipo === 'registrado' && selectedCliente
          ? selectedCliente.telefono
          : posPrefill?.clienteTelefono,
      cliente_direccion: undefined,
      metodo_pago: metodoPago,
      orden_id: posPrefill?.ordenId,
      reporte_id: posPrefill?.reporteId,
      items: cart.map((item) => ({
        producto_id: item.producto.id,
        codigo: item.producto.codigo,
        nombre: item.producto.nombre,
        nombre_producto: item.producto.nombre,
        tipo: item.producto.tipo,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        impuesto_porcentaje: item.impuesto_porcentaje,
      })),
    };

    createSaleMutation.mutate(payload);
  };

  // Filtered products for quick-picker
  const filteredManualProducts = useMemo(() => {
    if (!scanner.searchManual.trim()) return [];
    return productos
      .filter(
        (p) =>
          p.nombre.toLowerCase().includes(scanner.searchManual.toLowerCase()) ||
          p.codigo.toLowerCase().includes(scanner.searchManual.toLowerCase())
      )
      .slice(0, 8);
  }, [productos, scanner.searchManual]);

  // Filtered clients for selector
  const filteredClientes = useMemo(() => {
    if (!clienteSearch.trim()) return [];
    return clientes
      .filter(
        (c) =>
          c.nombre.toLowerCase().includes(clienteSearch.toLowerCase()) ||
          (c.apellido && c.apellido.toLowerCase().includes(clienteSearch.toLowerCase())) ||
          c.ci.includes(clienteSearch)
      )
      .slice(0, 5);
  }, [clientes, clienteSearch]);

  return {
    barcodeInput: scanner.barcodeInput,
    setBarcodeInput: scanner.setBarcodeInput,
    searchManual: scanner.searchManual,
    setSearchManual: scanner.setSearchManual,
    scanStatusMessage: scanner.scanStatusMessage,
    scanError: scanner.scanError,
    setScanError: scanner.setScanError,
    incompleteCartModal,
    setIncompleteCartModal,
    barcodeInputRef: scanner.barcodeInputRef,
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
    handleBarcodeSubmit: scanner.handleBarcodeSubmit,
    updateQuantity,
    updateUnitPrice,
    updateItemTax,
    removeItem,
    clearCart,
    handleFinalizarVenta,
    filteredManualProducts,
    filteredClientes,
    ensureScannerFocused: scanner.ensureScannerFocused,
  };
};
