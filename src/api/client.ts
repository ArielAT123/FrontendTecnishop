import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  LoginResponse,
  DashboardStats,
  Cliente,
  Equipo,
  Orden,
  OrdenesPaginadasResponse,
  Producto,
  Reporte,
  Venta,
  CreateVentaPayload,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

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
  createObservaciones: async (equipoId: string, obs: any) => {
    const { data } = await apiClient.post(`/equipos/${equipoId}/observaciones/crear/`, obs);
    return data;
  },
  createProblema: async (equipoId: string, problema: { problema: string }) => {
    const { data } = await apiClient.post(`/equipos/${equipoId}/problemas/crear/`, problema);
    return data;
  },
  getEquipoCompleto: async (id: string): Promise<Equipo> => {
    const { data } = await apiClient.get<Equipo>(`/equipos/${id}/completo/`);
    return data;
  },

  // Ordenes
  getOrdenes: async (inicio = 0, fin = 50): Promise<OrdenesPaginadasResponse> => {
    const { data } = await apiClient.get<OrdenesPaginadasResponse>(`/ordenes/${inicio}/${fin}`);
    return data;
  },
  createOrden: async (orden: Partial<Orden>): Promise<Orden> => {
    const { data } = await apiClient.post<Orden>('/ordenes/crear/', orden);
    return data;
  },
  updateOrdenStatus: async (ordenId: string, status: string): Promise<boolean> => {
    const { data } = await apiClient.put(`/ordenes/${ordenId}/status/`, { status });
    return data.success;
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
  getReporteByOrderId: async (ordenId: string): Promise<Reporte> => {
    const { data } = await apiClient.get<{ success: boolean; data: Reporte }>(`/reportes/orden/${ordenId}/`);
    return data.data;
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
