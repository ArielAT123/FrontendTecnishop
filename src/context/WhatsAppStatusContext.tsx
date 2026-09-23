import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface QrData {
  base64?: string | null;
  code?: string | null;
  pairingCode?: string | null;
  error?: string | null;
}

export interface WhatsAppStatusContextType {
  isConnected: boolean;
  status: string;
  isChecking: boolean;
  isDismissed: boolean;
  qrData: QrData | null;
  isLoadingQr: boolean;
  checkStatus: () => Promise<boolean>;
  fetchQrCode: () => Promise<QrData | null>;
  disconnectWhatsApp: () => Promise<boolean>;
  dismissNotification: () => void;
  resetDismissal: () => void;
}

const MESSAGE_SERVER_URL =
  (import.meta as any).env?.VITE_MESSAGE_SERVER_URL || (
    typeof window !== 'undefined' && window.location.port === '5173'
      ? 'http://localhost:5052'
      : '/message-api'
  );

const WhatsAppStatusContext = createContext<WhatsAppStatusContextType | undefined>(undefined);

export const WhatsAppStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('checking');
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [qrData, setQrData] = useState<QrData | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState<boolean>(false);

  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('whatsapp_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  // Query WhatsApp connection status from message_event_server
  const checkStatus = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    try {
      const response = await fetch(`${MESSAGE_SERVER_URL}/api/v1/evolution/status`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(4000),
      });

      if (response.ok) {
        const data = await response.json();
        const connected = Boolean(data.connected);
        setIsConnected(connected);
        setStatus(data.state || (connected ? 'open' : 'close'));

        // If it transitioned to connected, reset QR data
        if (connected) {
          setQrData(null);
        }
        return connected;
      } else {
        setIsConnected(false);
        setStatus('unreachable');
        return false;
      }
    } catch {
      setIsConnected(false);
      setStatus('unreachable');
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Fetch QR Code from message_event_server
  const fetchQrCode = useCallback(async (): Promise<QrData | null> => {
    setIsLoadingQr(true);
    try {
      const response = await fetch(`${MESSAGE_SERVER_URL}/api/v1/evolution/qrcode`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.connected) {
          setIsConnected(true);
          setStatus('open');
          setQrData(null);
          return null;
        }

        const qrPayload: QrData = {
          base64: data.base64 || null,
          code: data.code || null,
          pairingCode: data.pairingCode || null,
          error: data.error || null,
        };

        setQrData(qrPayload);
        setIsConnected(false);
        setStatus(data.state || 'close');
        return qrPayload;
      } else {
        const errPayload: QrData = {
          base64: null,
          code: null,
          error: 'No se pudo generar el código QR. Verifica que el servidor de mensajería esté activo.',
        };
        setQrData(errPayload);
        return errPayload;
      }
    } catch (err: any) {
      const errPayload: QrData = {
        base64: null,
        code: null,
        error: `Servidor de mensajería no disponible (${err?.message || 'error de red'})`,
      };
      setQrData(errPayload);
      return errPayload;
    } finally {
      setIsLoadingQr(false);
    }
  }, []);

  // Disconnect WhatsApp session
  const disconnectWhatsApp = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${MESSAGE_SERVER_URL}/api/v1/evolution/logout`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        setIsConnected(false);
        setStatus('close');
        setQrData(null);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const dismissNotification = useCallback(() => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('whatsapp_banner_dismissed', 'true');
    } catch {
      // Ignored
    }
  }, []);

  const resetDismissal = useCallback(() => {
    setIsDismissed(false);
    try {
      sessionStorage.removeItem('whatsapp_banner_dismissed');
    } catch {
      // Ignored
    }
  }, []);

  // Initial check on mount
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Periodic heartbeat polling every 25 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkStatus();
    }, 25000);

    return () => clearInterval(interval);
  }, [checkStatus]);

  return (
    <WhatsAppStatusContext.Provider
      value={{
        isConnected,
        status,
        isChecking,
        isDismissed,
        qrData,
        isLoadingQr,
        checkStatus,
        fetchQrCode,
        disconnectWhatsApp,
        dismissNotification,
        resetDismissal,
      }}
    >
      {children}
    </WhatsAppStatusContext.Provider>
  );
};

export const useWhatsAppStatus = (): WhatsAppStatusContextType => {
  const context = useContext(WhatsAppStatusContext);
  if (!context) {
    throw new Error('useWhatsAppStatus must be used within a WhatsAppStatusProvider');
  }
  return context;
};
