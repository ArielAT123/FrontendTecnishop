import { CartItem } from '../../components/ventas/PosCartTable';

export const validateCartItems = (cart: CartItem[]): string[] => {
  const issues: string[] = [];
  cart.forEach((item, idx) => {
    const nom = item.producto.nombre || item.producto.codigo || `Ítem #${idx + 1}`;
    if (!item.producto.nombre || !item.producto.nombre.trim()) {
      issues.push(
        `Ítem #${idx + 1}: Falta ingresar la descripción o nombre del producto/servicio.`
      );
    }
    if (!item.producto.codigo || !item.producto.codigo.trim()) {
      issues.push(
        `Ítem #${idx + 1} (${nom}): Falta asignar un código identificador.`
      );
    }
    if (isNaN(Number(item.precio_unitario)) || Number(item.precio_unitario) < 0) {
      issues.push(`Ítem #${idx + 1} (${nom}): El precio unitario es inválido.`);
    }
    if (isNaN(Number(item.cantidad)) || Number(item.cantidad) <= 0) {
      issues.push(
        `Ítem #${idx + 1} (${nom}): La cantidad debe ser al menos 1 unidad.`
      );
    }
  });
  return issues;
};
