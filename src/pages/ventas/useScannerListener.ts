import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';
import { Producto } from '../../types';
import { scannerSubject, BarcodeScanEvent } from '../../services/scannerObserver';
import { playScannerBeep } from '../../services/productLookupService';

export interface UseScannerListenerOptions {
  productos: Producto[];
  scannerMode: string;
  activeTab: 'pos' | 'history';
  onAddProduct: (prod: Producto, qty?: number) => void;
}

export const useScannerListener = ({
  productos,
  scannerMode: _scannerMode,
  activeTab,
  onAddProduct,
}: UseScannerListenerOptions) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchManual, setSearchManual] = useState('');
  const [scanStatusMessage, setScanStatusMessage] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Focus scanner input on mount and tab switch
  useEffect(() => {
    if (activeTab === 'pos') {
      barcodeInputRef.current?.focus();
    }
  }, [activeTab]);

  const ensureScannerFocused = () => {
    barcodeInputRef.current?.focus();
  };

  // Barcode Submit
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    const found = productos.find(
      (p) => p.codigo.trim().toLowerCase() === code.toLowerCase()
    );

    if (found) {
      onAddProduct(found);
      setBarcodeInput('');
    } else {
      api
        .getProductoByCodigo(code)
        .then((prod) => {
          onAddProduct(prod);
          setBarcodeInput('');
        })
        .catch(() => {
          setScanError(`No se encontró ningún producto con el código de barras: "${code}"`);
        });
    }
  };

  // Global scanner listener (USB/Bluetooth HID)
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') &&
        target !== barcodeInputRef.current
      ) {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 100) {
        buffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length >= 2) {
          const scannedCode = buffer.trim();
          const prod = productos.find(
            (p) => p.codigo.trim().toLowerCase() === scannedCode.toLowerCase()
          );
          if (prod) {
            onAddProduct(prod);
          }
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [productos, onAddProduct]);

  // Observer: Suscribirse a scannerSubject para escaneos desde el móvil WiFi
  useEffect(() => {
    if (activeTab !== 'pos') return;

    const unsubscribe = scannerSubject.subscribe({
      onBarcodeScanned: (event: BarcodeScanEvent) => {
        const code = event.barcode.trim();
        if (!code) return;

        playScannerBeep();
        const found = productos.find(
          (p) => p.codigo.trim().toLowerCase() === code.toLowerCase()
        );

        if (found) {
          onAddProduct(found);
          setScanStatusMessage(`Móvil: ${found.nombre} agregado al carrito`);
          setTimeout(() => setScanStatusMessage(null), 3000);
        } else {
          api
            .getProductoByCodigo(code)
            .then((prod) => {
              onAddProduct(prod);
              setScanStatusMessage(`Móvil: ${prod.nombre} agregado al carrito`);
              setTimeout(() => setScanStatusMessage(null), 3000);
            })
            .catch(() => {
              setScanError(`Móvil: No se encontró producto con el código "${code}"`);
            });
        }
      },
    });

    return () => {
      unsubscribe();
    };
  }, [activeTab, productos, onAddProduct]);

  return {
    barcodeInput,
    setBarcodeInput,
    searchManual,
    setSearchManual,
    scanStatusMessage,
    setScanStatusMessage,
    scanError,
    setScanError,
    barcodeInputRef,
    ensureScannerFocused,
    handleBarcodeSubmit,
  };
};
