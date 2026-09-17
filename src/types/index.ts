export interface User {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  success: boolean;
  tokens: AuthTokens;
  user: User;
  error?: string;
}

export interface Cliente {
  ci: string;
  nombre: string;
  apellido?: string;
  telefono?: string;
  correo?: string;
}

export interface Observaciones {
  id?: string;
  equipo?: string;
  cargador: boolean;
  bateria: boolean;
  cable_poder: boolean;
  cable_datos: boolean;
  otros?: string;
}

export interface ProblemaEquipo {
  id?: string;
  equipo?: string;
  problema: string;
}

export interface Equipo {
  id: string;
  nombre?: string;
  marca?: string;
  modelo?: string;
  numero_serie?: string;
  cliente_ci: string;
  cliente?: Cliente;
  observaciones?: Observaciones[];
  problemas?: ProblemaEquipo[];
}

export type OrdenEstado = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'COBRADO' | 'CANCELADO';

export interface Orden {
  id: string;
  numero_orden?: string;
  fecha: string;
  realiza_orden?: string;
  estado: OrdenEstado | string;
  equipo: Equipo;
}

export interface OrdenesPaginadasResponse {
  total_registros: number;
  inicio: number;
  fin: number;
  cantidad_actual: number;
  siguiente_lote: string | null;
  lote_anterior: string | null;
  ordenes: Orden[];
}

export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  costo_compra?: number;
  porcentaje_ganancia?: number;
  impuesto?: number;
  cantidad: number;
  precio_venta_sugerido?: number;
  precio_venta_recomendado?: number;
  estado?: string;
  imagen_base64?: string;
}

export interface TrabajoRealizado {
  id?: string;
  descripcion: string;
  costo: number | string;
}

export interface RepuestoUtilizado {
  id?: string;
  nombre_repuesto: string;
  cantidad: number;
  precio_unitario: number | string;
  subtotal?: number | string;
}

export interface Reporte {
  id: string;
  orden_id: string;
  orden?: Orden;
  fecha_creacion: string;
  persona_a_cargo?: string;
  observaciones?: string;
  trabajos_realizados: TrabajoRealizado[];
  repuestos_utilizados: RepuestoUtilizado[];
  total_trabajos?: number;
  total_repuestos?: number;
  total_general?: number;
}

export interface DashboardStats {
  clientes_registrados: number;
  equipos_registrados: number;
  ordenes_activas: number;
  ordenes_completadas: number;
}

export interface DetalleVenta {
  id?: string;
  producto?: string;
  codigo_producto: string;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number | string;
  impuesto_porcentaje?: number | string;
  subtotal: number | string;
}

export interface Venta {
  id: string;
  numero_factura: string;
  fecha: string;
  cliente?: Cliente | null;
  cliente_nombre: string;
  cliente_identificacion: string;
  cliente_telefono?: string;
  cliente_direccion?: string;
  subtotal: number | string;
  iva: number | string;
  total: number | string;
  metodo_pago: string;
  usuario?: string;
  estado: string;
  detalles?: DetalleVenta[];
}

export interface CreateVentaItem {
  producto_id?: string;
  codigo: string;
  cantidad: number;
  precio_unitario: number;
}

export interface CreateVentaPayload {
  cliente_ci?: string;
  cliente_nombre: string;
  cliente_identificacion: string;
  cliente_telefono?: string;
  cliente_direccion?: string;
  metodo_pago: string;
  items: CreateVentaItem[];
}

