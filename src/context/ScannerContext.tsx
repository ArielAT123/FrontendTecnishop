import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { scannerSubject, BarcodeScanEvent } from '../services/scannerObserver';

export type ScannerMode = 'usb' | 'web';

export interface ServerInfo {
  ip: string;
  port: number;
  portHttps: number;
  url: string;
  httpsUrl: string;
  connectedClients?: number;
}

export interface ScannerContextType {
  scannerMode: ScannerMode;
  setScannerMode: (mode: ScannerMode) => void;
  serverUrl: string;
  setServerUrl: (url: string) => void;
  isServerOnline: boolean;
  isCheckingServer: boolean;
  serverInfo: ServerInfo | null;
  checkServerStatus: () => Promise<boolean>;
  getQrUrl: (preferHttps?: boolean) => string;
  lastScan: BarcodeScanEvent | null;
  recentScans: BarcodeScanEvent[];
}

const ScannerContext = createContext<ScannerContextType | undefined>(undefined);

export const ScannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scannerMode, setScannerModeState] = useState<ScannerMode>(() => {
    const saved = localStorage.getItem('scanner_mode');
    return saved === 'web' || saved === 'usb' ? saved : 'usb';
  });

  const [serverUrl, setServerUrlState] = useState<string>(() => {
    return localStorage.getItem('scanner_server_url') || 'http://localhost:5050';
  });

  const [isServerOnline, setIsServerOnline] = useState<boolean>(false);
  const [isCheckingServer, setIsCheckingServer] = useState<boolean>(false);
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [lastScan, setLastScan] = useState<BarcodeScanEvent | null>(null);
  const [recentScans, setRecentScans] = useState<BarcodeScanEvent[]>([]);

  // Check connectivity to scanner-web server
  const checkServerStatus = useCallback(async (): Promise<boolean> => {
    setIsCheckingServer(true);
    try {
      const base = serverUrl.replace(/\/+$/, '');
      const response = await fetch(`${base}/api/info`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(3000),
      });

      if (response.ok) {
        const data = await response.json();
        setIsServerOnline(true);
        setServerInfo({
          ip: data.ip || '127.0.0.1',
          port: data.port || 5050,
          portHttps: data.portHttps || 5051,
          url: data.url || `${base}`,
          httpsUrl: data.httpsUrl || `https://${data.ip || '127.0.0.1'}:5051`,
          connectedClients: data.connectedClients || 0,
        });
        return true;
      } else {
        setIsServerOnline(false);
        return false;
      }
    } catch {
      setIsServerOnline(false);
      return false;
    } finally {
      setIsCheckingServer(false);
    }
  }, [serverUrl]);

  // Set Scanner Mode (Single Active Channel)
  const setScannerMode = useCallback((mode: ScannerMode) => {
    setScannerModeState(mode);
    localStorage.setItem('scanner_mode', mode);

    if (mode === 'web') {
      scannerSubject.setEnabled(true);
      scannerSubject.connect(serverUrl);
    } else {
      // In USB mode, disable web SSE listeners to prevent cross-channel conflicts
      scannerSubject.setEnabled(false);
    }
  }, [serverUrl]);

  // Set Server URL
  const setServerUrl = useCallback((url: string) => {
    const cleanUrl = url.trim().replace(/\/+$/, '');
    setServerUrlState(cleanUrl);
    localStorage.setItem('scanner_server_url', cleanUrl);

    if (scannerMode === 'web') {
      scannerSubject.connect(cleanUrl);
    }
  }, [scannerMode]);

  // Generates safe QR URL embedding the session JWT token
  const getQrUrl = useCallback((preferHttps = true): string => {
    const token = localStorage.getItem('accessToken') || '';
    const ip = serverInfo?.ip || '127.0.0.1';
    const port = preferHttps ? (serverInfo?.portHttps || 5051) : (serverInfo?.port || 5050);
    const protocol = preferHttps ? 'https' : 'http';
    const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${protocol}://${ip}:${port}/${tokenQuery}`;
  }, [serverInfo]);

  // Global scan listener when in web mode
  useEffect(() => {
    const unsubscribe = scannerSubject.subscribe({
      onBarcodeScanned: (event) => {
        setLastScan(event);
        setRecentScans((prev) => [event, ...prev.slice(0, 9)]);
      },
      onConnectionChange: (connected) => {
        if (connected) setIsServerOnline(true);
      },
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Initial synchronization on mount
  useEffect(() => {
    if (scannerMode === 'web') {
      scannerSubject.setEnabled(true);
      scannerSubject.connect(serverUrl);
    } else {
      scannerSubject.setEnabled(false);
    }

    checkServerStatus();

    const interval = setInterval(() => {
      checkServerStatus();
    }, 15000);

    return () => clearInterval(interval);
  }, [scannerMode, serverUrl, checkServerStatus]);

  return (
    <ScannerContext.Provider
      value={{
        scannerMode,
        setScannerMode,
        serverUrl,
        setServerUrl,
        isServerOnline,
        isCheckingServer,
        serverInfo,
        checkServerStatus,
        getQrUrl,
        lastScan,
        recentScans,
      }}
    >
      {children}
    </ScannerContext.Provider>
  );
};

export const useScannerConfig = (): ScannerContextType => {
  const context = useContext(ScannerContext);
  if (!context) {
    throw new Error('useScannerConfig debe ser utilizado dentro de un ScannerProvider');
  }
  return context;
};
