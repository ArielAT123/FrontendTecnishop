import { Orden, Equipo, Cliente } from '../../types';

export const normalizeSearch = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const resolveOrdenEquipo = (orden: Orden, equipos: Equipo[]): Equipo | null => {
  if (orden.equipo && typeof orden.equipo === 'object') return orden.equipo;
  const eqId =
    typeof orden.equipo === 'string'
      ? orden.equipo
      : (orden as any).equipo_id || (orden as any).dispositivo_id;
  return equipos.find((e) => e.id === eqId) || null;
};

export const resolveOrdenCliente = (
  orden: Orden,
  equipos: Equipo[],
  clientes: Cliente[]
): Cliente | null => {
  const eq = resolveOrdenEquipo(orden, equipos);
  if (eq?.cliente && typeof eq.cliente === 'object') return eq.cliente;
  const ci = eq?.cliente_ci || (orden as any).cliente_ci;
  if (ci) {
    return clientes.find((c) => String(c.ci).trim() === String(ci).trim()) || null;
  }
  return null;
};
