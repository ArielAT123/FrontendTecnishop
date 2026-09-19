import { Producto } from '../types';

/**
 * Robust helper to extract the active selling price of a product or service.
 * Handles Decimal strings from DRF ('0.00', '2.50'), null, undefined, and numbers.
 * Prioritizes positive selling prices over zero or default values.
 */
export const getProductPrice = (prod: Producto | Partial<Producto> | null | undefined): number => {
  if (!prod) return 0;
  const pSug = parseFloat(String(prod.precio_venta_sugerido ?? ''));
  const pRec = parseFloat(String(prod.precio_venta_recomendado ?? ''));
  const pCost = parseFloat(String(prod.costo_compra ?? ''));

  if (!isNaN(pSug) && pSug > 0) return pSug;
  if (!isNaN(pRec) && pRec > 0) return pRec;
  if (!isNaN(pCost) && pCost > 0) return pCost;
  return 0;
};

/**
 * Extract product IVA rate. Defaults to 15% (standard in Ecuador) if not explicitly set.
 */
export const getProductTaxRate = (prod: Producto | Partial<Producto> | null | undefined): number => {
  if (!prod) return 15;
  if (prod.impuesto !== null && prod.impuesto !== undefined && String(prod.impuesto).trim() !== '') {
    const tax = parseFloat(String(prod.impuesto));
    if (!isNaN(tax)) return tax;
  }
  return 15;
};
