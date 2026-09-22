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
  orden?: string;
  equipo?: string;
  cargador: boolean;
  bateria: boolean;
  cable_poder: boolean;
  cable_datos: boolean;
  otros?: string;
}

export interface ProblemaEquipo {
  id?: string;
  orden?: string;
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

export interface EstadoOrdenItem {
  id: OrdenEstado;
  label: string;
}

export const CATALOGO_ESTADOS_ORDEN: readonly EstadoOrdenItem[] = [
  { id: 'PENDIENTE', label: 'Pendiente' },
  { id: 'EN_PROCESO', label: 'En Proceso' },
  { id: 'COMPLETADO', label: 'Completado' },
  { id: 'COBRADO', label: 'Cobrado' },
  { id: 'CANCELADO', label: 'Cancelado' },
] as const;

export interface Orden {
  id: string;
  numero_orden?: string;
  fecha: string;
  realiza_orden?: string;
  estado: OrdenEstado | string;
  equipo: Equipo;
  observaciones?: Observaciones[];
  problemas?: ProblemaEquipo[];
  tiene_ficha_tecnica?: boolean;
  reporte_id?: string | null;
  esta_facturado?: boolean;
  factura?: Venta | null;
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

export interface Proveedor {
  id: string;
  nombre_o_razon_social: string;
  ruc_cedula?: string;
  telefono?: string;
  nombre_contacto?: string;
  numero_cuenta?: string;
  activo?: boolean;
  fecha_registro?: string;
}

export type ItemTipo = 'PRODUCTO' | 'SERVICIO';

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
  tipo?: ItemTipo;
  tiempo_estimado_minutos?: number;
  proveedor?: string;
  proveedor_detalle?: Proveedor;
  es_chequeo?: boolean;
}

export type CotizacionItemEstado = 'COTIZADO' | 'RECHAZADO';

export interface TrabajoRealizado {
  id?: string;
  descripcion: string;
  costo: number | string;
  costo_proveedor?: number | string;
  proveedor?: string;
  proveedor_detalle?: Proveedor;
  estado?: CotizacionItemEstado;
}

export interface RepuestoUtilizado {
  id?: string;
  nombre_repuesto: string;
  cantidad: number;
  precio_unitario: number | string;
  subtotal?: number | string;
  costo_unitario_proveedor?: number | string;
  proveedor?: string;
  proveedor_detalle?: Proveedor;
  estado?: CotizacionItemEstado;
}

export type EstadoCotizacion = 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO';

export interface Reporte {
  id: string;
  orden_id: string;
  orden?: Orden;
  fecha_creacion: string;
  persona_a_cargo?: string;
  observaciones?: string;
  diagnostico_problemas?: string;
  tipo_chequeo?: string;
  tipo_chequeo_detalle?: Producto;
  precio_chequeo?: number | string;
  estado_cotizacion?: EstadoCotizacion;
  trabajos_realizados: TrabajoRealizado[];
  repuestos_utilizados: RepuestoUtilizado[];
  total_trabajos?: number;
  total_repuestos?: number;
  total_general?: number;
  total_aceptado?: number;
  total_rechazado?: number;
  esta_facturado?: boolean;
  factura?: Venta | null;
  cotizacion_completada?: boolean;
  items_incompletos_count?: number;
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
  orden?: string | Orden;
  reporte?: string | Reporte;
  detalles?: DetalleVenta[];
}

export interface CreateVentaItem {
  producto_id?: string;
  codigo: string;
  nombre?: string;
  nombre_producto?: string;
  tipo?: 'PRODUCTO' | 'SERVICIO';
  cantidad: number;
  precio_unitario: number;
  impuesto_porcentaje?: number;
}

export interface CreateVentaPayload {
  cliente_ci?: string;
  cliente_nombre: string;
  cliente_identificacion: string;
  cliente_telefono?: string;
  cliente_direccion?: string;
  metodo_pago: string;
  orden_id?: string;
  reporte_id?: string;
  items: CreateVentaItem[];
}

