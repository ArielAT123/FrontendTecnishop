/**
 * ============================================================================
 * PATRÓN DE DISEÑO OBSERVER (Cliente Frontend - Tecnishop)
 * ============================================================================
 * Subject reactivo que mantiene la escucha en el puerto del servidor de escáner (SSE),
 * recibe los eventos emitidos por el celular o pistola y notifica automáticamente
 * a todos los componentes observadores suscritos en la interfaz.
 */

export interface BarcodeScanEvent {
  type: 'barcode_scanned';
  barcode: string;
  format?: string;
  timestamp: string;
  device?: string;
}

export interface IScannerObserver {
  id?: string;
  onBarcodeScanned: (event: BarcodeScanEvent) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: any) => void;
}

class ScannerClientSubject {
  private observers: Set<IScannerObserver> = new Set();
  private eventSource: EventSource | null = null;
  private isConnected: boolean = false;
  private isEnabled: boolean = true;
  private serverUrl: string = 'http://localhost:5050';
  private reconnectTimer: any = null;
  private retryCount: number = 0;

  constructor() {
    // Inicialización con preferencia almacenada si existe
    const savedMode = localStorage.getItem('scanner_mode');
    if (savedMode === 'usb') {
      this.isEnabled = false;
    }
    const savedUrl = localStorage.getItem('scanner_server_url');
    if (savedUrl) {
      this.serverUrl = savedUrl;
    }
  }

  /**
   * Habilita o deshabilita la conexión SSE según la configuración activa (USB vs Web)
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.disconnect();
    } else if (this.observers.size > 0 && !this.eventSource) {
      this.connect(this.serverUrl);
    }
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public getServerUrl(): string {
    return this.serverUrl;
  }

  /**
   * Registra un nuevo observador en el Subject.
   * Si es el primer observador y el modo web está habilitado, abre automáticamente el canal de escucha.
   * @returns Función de desuscripción limpia
   */
  public subscribe(observer: IScannerObserver): () => void {
    this.observers.add(observer);
    console.log(`[OBSERVER PATTERN CLIENTE] Observador suscrito. Total observadores: ${this.observers.size}`);

    // Si ya estamos conectados, notificar al nuevo observador
    if (observer.onConnectionChange) {
      observer.onConnectionChange(this.isConnected);
    }

    // Asegurar que la conexión al puerto/url esté abierta solo si está habilitado
    if (!this.eventSource && this.isEnabled) {
      this.connect();
    }

    return () => {
      this.unsubscribe(observer);
    };
  }

  /**
   * Desuscribe un observador
   */
  public unsubscribe(observer: IScannerObserver): void {
    this.observers.delete(observer);
    console.log(`[OBSERVER PATTERN CLIENTE] Observador desuscrito. Restantes: ${this.observers.size}`);

    // Si no quedan observadores activos, cerrar el canal para ahorrar recursos
    if (this.observers.size === 0) {
      this.disconnect();
    }
  }

  /**
   * Notifica a todos los observadores registrados cuando llega un código
   */
  public notify(event: BarcodeScanEvent): void {
    console.log(`[OBSERVER PATTERN CLIENTE] Notificando a ${this.observers.size} observadores de código: ${event.barcode}`);
    for (const observer of this.observers) {
      try {
        observer.onBarcodeScanned(event);
      } catch (err) {
        console.error('[OBSERVER PATTERN CLIENTE] Error en observador:', err);
      }
    }
  }

  /**
   * Notifica a los observadores sobre cambios de estado de la conexión
   */
  private notifyConnection(connected: boolean): void {
    this.isConnected = connected;
    for (const observer of this.observers) {
      if (observer.onConnectionChange) {
        try {
          observer.onConnectionChange(connected);
        } catch (err) {
          console.error(err);
        }
      }
    }
  }

  /**
   * Establece conexión SSE con el servidor de escáner en el puerto correspondiente
   */
  public connect(url: string = this.serverUrl): void {
    this.serverUrl = url;

    if (this.eventSource) {
      this.disconnect();
    }

    try {
      const sseUrl = `${this.serverUrl}/api/events`;
      console.log(`[OBSERVER PATTERN] Conectando manejador de eventos a: ${sseUrl}`);
      this.eventSource = new EventSource(sseUrl);

      this.eventSource.onopen = () => {
        console.log('[OBSERVER PATTERN] Canal de eventos SSE conectado exitosamente');
        this.retryCount = 0;
        this.notifyConnection(true);
      };

      this.eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'barcode_scanned' && data.barcode) {
            this.notify(data as BarcodeScanEvent);
          }
        } catch (err) {
          console.warn('[OBSERVER PATTERN] Error al procesar mensaje de evento:', err);
        }
      };

      this.eventSource.onerror = (err) => {
        this.notifyConnection(false);
        this.disconnect();

        // Reintento automático con retroceso exponencial
        const delay = Math.min(1000 * Math.pow(1.5, this.retryCount), 8000);
        this.retryCount++;
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          if (this.observers.size > 0 && this.isEnabled) {
            this.connect(this.serverUrl);
          }
        }, delay);
      };
    } catch (err) {
      console.error('[OBSERVER PATTERN] Error al iniciar EventSource:', err);
      this.notifyConnection(false);
    }
  }

  /**
   * Cierra el canal SSE
   */
  public disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    clearTimeout(this.reconnectTimer);
    this.notifyConnection(false);
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }
}

// Instancia singleton del Sujeto para toda la aplicación
export const scannerSubject = new ScannerClientSubject();
