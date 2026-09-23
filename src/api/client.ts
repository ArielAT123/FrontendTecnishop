import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  LoginResponse,
  DashboardStats,
  Cliente,
  Equipo,
  Orden,
  OrdenesPaginadasResponse,
  Producto,
  Proveedor,
  Reporte,
  Venta,
  CreateVentaPayload,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && window.location.port === '5173'
    ? 'http://127.0.0.1:8000/api'
    : '/api'
);

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach JWT Bearer token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Auto JWT Refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/login/') || originalRequest.url?.includes('/refresh/')) {
        return Promise.reject(error);
      }

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.clear();
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${API_URL}/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = data.access;
        localStorage.setItem('accessToken', newAccessToken);
        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError);
        localStorage.clear();
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// API Service Methods
export const api = {
  // Auth
  login: async (credentials: { username: string; password: string }): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/login/', credentials);
    return data;
  },
  verifyToken: async () => {
    const { data } = await apiClient.get('/verify/');
    return data;
  },
  verifyAdminPassword: async (password: string): Promise<{ valid: boolean; message?: string }> => {
    const { data } = await apiClient.post<{ valid: boolean; message?: string }>('/verify-admin-password/', { password });
    return data;
  },
  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) {
        await apiClient.post('/logout/', { refresh: refreshToken });
      }
    } finally {
      localStorage.clear();
    }
  },

  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get<{ success: boolean; data: DashboardStats }>('/dashboard/stats/');
    return data.data;
  },

  // Clientes
  getClientes: async (): Promise<Cliente[]> => {
    const { data } = await apiClient.get<Cliente[]>('/clientes/');
    return Array.isArray(data) ? data : [];
  },
  createCliente: async (cliente: Cliente): Promise<Cliente> => {
    const { data } = await apiClient.post<Cliente>('/clientes/crear/', cliente);
    return data;
  },
  updateCliente: async (ci: string, cliente: Partial<Cliente>): Promise<Cliente> => {
    const { data } = await apiClient.put<Cliente>(`/clientes/${ci}/`, cliente);
    return data;
  },
  deleteCliente: async (ci: string): Promise<void> => {
    await apiClient.delete(`/clientes/${ci}/`);
  },

  // Equipos
  getEquipos: async (): Promise<Equipo[]> => {
    const { data } = await apiClient.get<Equipo[]>('/equipos/');
    return Array.isArray(data) ? data : [];
  },
  createEquipo: async (equipo: Partial<Equipo>): Promise<Equipo> => {
    const { data } = await apiClient.post<Equipo>('/equipos/crear/', equipo);
    return data;
  },
  deleteEquipo: async (id: string): Promise<void> => {
    await apiClient.delete(`/equipos/${id}/`);
  },
  createObservaciones: async (equipoId: string, obs: any) => {
    const { data } = await apiClient.post(`/equipos/${equipoId}/observaciones/crear/`, {
      equipo: equipoId,
      ...obs,
    });
    return data;
  },
  createProblema: async (equipoId: string, problema: { problema: string; equipo?: string }) => {
    const { data } = await apiClient.post(`/equipos/${equipoId}/problemas/crear/`, {
      equipo: equipoId,
      ...problema,
    });
    return data;
  },
  getEquipoCompleto: async (id: string): Promise<Equipo> => {
    const { data } = await apiClient.get<Equipo>(`/equipos/${id}/completo/`);
    return data;
  },
  getUniqueTiposEquipo: async (): Promise<{ tipo: string; total: number }[]> => {
    const { data } = await apiClient.get<{ success: boolean; tipos: { tipo: string; total: number }[] }>('/equipos/tipos/');
    return data.tipos || [];
  },
  getAutocompleteTiposEquipo: async (q: string): Promise<{ texto: string; frecuencia: number }[]> => {
    const { data } = await apiClient.get<{ success: boolean; sugerencias: { texto: string; frecuencia: number }[] }>('/equipos/autocomplete/tipos/', {
      params: { q },
    });
    return data.sugerencias || [];
  },
  getAutocompleteMarcasEquipo: async (q: string): Promise<{ texto: string; frecuencia: number }[]> => {
    const { data } = await apiClient.get<{ success: boolean; sugerencias: { texto: string; frecuencia: number }[] }>('/equipos/autocomplete/marcas/', {
      params: { q },
    });
    return data.sugerencias || [];
  },
  getCatalogoTipos: async (q = ''): Promise<{ tipo: string; total: number; marcas_count?: number }[]> => {
    const { data } = await apiClient.get<{ success: boolean; tipos: { tipo: string; total: number; marcas_count?: number }[] }>('/equipos/catalogo/tipos/', {
      params: { q },
    });
    return data.tipos || [];
  },
  getCatalogoMarcas: async (tipo = '', q = ''): Promise<{ texto: string; frecuencia: number }[]> => {
    const { data } = await apiClient.get<{ success: boolean; marcas: { texto: string; frecuencia: number }[] }>('/equipos/catalogo/marcas/', {
      params: { tipo, q },
    });
    return data.marcas || [];
  },
  getCatalogoModelos: async (tipo = '', marca = '', q = ''): Promise<{ texto: string; frecuencia: number; marca: string; tipo: string }[]> => {
    const { data } = await apiClient.get<{ success: boolean; modelos: { texto: string; frecuencia: number; marca: string; tipo: string }[] }>('/equipos/catalogo/modelos/', {
      params: { tipo, marca, q },
    });
    return data.modelos || [];
  },

  // Ordenes
  getOrdenes: async (inicio = 0, fin = 50): Promise<OrdenesPaginadasResponse> => {
    const { data } = await apiClient.get<OrdenesPaginadasResponse>(`/ordenes/${inicio}/${fin}`);
    return data;
  },
  createOrden: async (orden: Partial<Orden> & {
    cargador?: boolean;
    bateria?: boolean;
    cable_poder?: boolean;
    cable_datos?: boolean;
    otros?: string;
    problema?: string;
  }): Promise<Orden> => {
    const { data } = await apiClient.post<Orden>('/ordenes/crear/', orden);
    return data;
  },
  updateOrdenStatus: async (ordenId: string, status: string): Promise<boolean> => {
    const { data } = await apiClient.put(`/ordenes/${ordenId}/status/`, { status });
    return data.success;
  },
  getEstadosOrden: async (): Promise<{ id: string; nombre: string }[]> => {
    const { data } = await apiClient.get<{ success: boolean; estados: { id: string; nombre: string }[] }>('/ordenes/estados/');
    return data.estados || [];
  },
  getOrdenDetail: async (id: string): Promise<Orden> => {
    const { data } = await apiClient.get<Orden>(`/ordenes/${id}/`);
    return data;
  },

  // Productos
  getProductos: async (): Promise<Producto[]> => {
    const { data } = await apiClient.get<Producto[]>('/productos/');
    return Array.isArray(data) ? data : [];
  },
  createProducto: async (producto: Partial<Producto>): Promise<Producto> => {
    const { data } = await apiClient.post<Producto>('/productos/crear/', producto);
    return data;
  },
  updateProducto: async (codigo: string, producto: Partial<Producto>): Promise<Producto> => {
    const { data } = await apiClient.put<Producto>(`/productos/${codigo}/`, producto);
    return data;
  },
  deleteProducto: async (codigo: string): Promise<void> => {
    await apiClient.delete(`/productos/${codigo}/`);
  },
  getProveedores: async (): Promise<Proveedor[]> => {
    const { data } = await apiClient.get<Proveedor[]>('/productos/proveedores/');
    return Array.isArray(data) ? data : [];
  },
  createProveedor: async (proveedor: Partial<Proveedor>): Promise<Proveedor> => {
    const { data } = await apiClient.post<Proveedor>('/productos/proveedores/', proveedor);
    return data;
  },
  updateProveedor: async (id: string, proveedor: Partial<Proveedor>): Promise<Proveedor> => {
    const { data } = await apiClient.put<Proveedor>(`/productos/proveedores/${id}/`, proveedor);
    return data;
  },
  deleteProveedor: async (id: string): Promise<void> => {
    await apiClient.delete(`/productos/proveedores/${id}/`);
  },
  getChequeos: async (): Promise<Producto[]> => {
    const { data } = await apiClient.get<Producto[]>('/productos/chequeos/');
    return Array.isArray(data) ? data : [];
  },
  uploadExcel: async (file: File) => {
    const formData = new FormData();
    formData.append('archivo', file);
    const { data } = await apiClient.post('/productos/cargar/xlsx/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  // Reportes
  getReportes: async (): Promise<Reporte[]> => {
    const { data } = await apiClient.get<{ success: boolean; data: Reporte[] }>('/reportes/');
    return data.data || [];
  },
  createReporte: async (reporte: any): Promise<Reporte> => {
    const { data } = await apiClient.post<{ success: boolean; data: Reporte }>('/reportes/create/', reporte);
    return data.data;
  },
  updateReporte: async (reporteId: string, reporte: any): Promise<Reporte> => {
    const { data } = await apiClient.put<{ success: boolean; data: Reporte }>(`/reportes/${reporteId}/`, reporte);
    return data.data;
  },
  getReporteByOrderId: async (ordenId: string): Promise<Reporte> => {
    const { data } = await apiClient.get<{ success: boolean; data: Reporte }>(`/reportes/orden/${ordenId}/`);
    return data.data;
  },
  getAutocompleteManoObra: async (query: string): Promise<Array<{ texto: string; precio: number; frecuencia: number }>> => {
    const { data } = await apiClient.get<{ success: boolean; data: any[] }>(`/reportes/autocomplete/mano-obra/?q=${encodeURIComponent(query)}`);
    return data.data || [];
  },
  getAutocompleteRepuestos: async (query: string): Promise<Array<{ texto: string; precio: number; frecuencia: number }>> => {
    const { data } = await apiClient.get<{ success: boolean; data: any[] }>(`/reportes/autocomplete/repuestos/?q=${encodeURIComponent(query)}`);
    return data.data || [];
  },
  getCotizaciones: async (estado: string = 'PENDIENTES', search: string = ''): Promise<Reporte[]> => {
    const params = new URLSearchParams();
    if (estado) params.append('estado', estado);
    if (search) params.append('search', search);
    const { data } = await apiClient.get<{ success: boolean; data: Reporte[] }>(`/reportes/cotizaciones/?${params.toString()}`);
    return data.data || [];
  },
  guardarCotizacionItems: async (reporteId: string, payload: { repuestos?: any[]; trabajos?: any[] }): Promise<{ success: boolean; message: string; cotizacion_completada: boolean; reporte: Reporte }> => {
    const { data } = await apiClient.post<{ success: boolean; message: string; cotizacion_completada: boolean; reporte: Reporte }>(`/reportes/cotizaciones/${reporteId}/guardar/`, payload);
    return data;
  },

  // Ventas y POS
  getProductoByCodigo: async (codigo: string): Promise<Producto> => {
    const { data } = await apiClient.get<Producto>(`/productos/${codigo}/`);
    return data;
  },
  getVentas: async (): Promise<Venta[]> => {
    const { data } = await apiClient.get<Venta[]>('/productos/ventas/');
    return Array.isArray(data) ? data : [];
  },
  getVentaDetail: async (id: string): Promise<Venta> => {
    const { data } = await apiClient.get<Venta>(`/productos/ventas/${id}/`);
    return data;
  },
  createVenta: async (payload: CreateVentaPayload): Promise<Venta> => {
    const { data } = await apiClient.post<Venta>('/productos/ventas/', payload);
    return data;
  },
};
