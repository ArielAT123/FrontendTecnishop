import axios from 'axios';
import { Producto } from '../types';

export interface ProductLookupResult {
  found: boolean;
  source: 'local' | 'upcdatabase' | 'openproductsfacts' | 'openfoodfacts' | 'upcitemdb' | 'gs1_prefix' | 'none';
  codigo: string;
  nombre: string;
  marca?: string;
  categoria?: string;
  costo_compra?: number;
  precio_venta_sugerido?: number;
  imagen_url?: string;
}

const UPCDATABASE_API_KEY = 'F8049AAA0BE2CEF0FEE18B6BF5CDC843';

/**
 * Positive scanner beep audio feedback using Web Audio API
 */
export function playScannerBeep() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2200, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (err) {
    // Audio context may be blocked by browser policy until user interacts
  }
}

/**
 * Cleans and normalizes a barcode string
 */
export function sanitizeBarcode(code: string): string {
  return (code || '').trim().replace(/[\r\n\t]/g, '');
}

/**
 * Detects known manufacturer prefixes from GS1 standard
 */
function identifyManufacturerByPrefix(barcode: string): { brand?: string; label?: string } | null {
  if (barcode.startsWith('69341777') || barcode.startsWith('6934177')) {
    return { brand: 'Xiaomi', label: 'Xiaomi Communications Co. (Accesorio / Dispositivo)' };
  }
  if (barcode.startsWith('690') || barcode.startsWith('691') || barcode.startsWith('692') || barcode.startsWith('693') || barcode.startsWith('694') || barcode.startsWith('695')) {
    return { brand: 'Importado (China)', label: 'Dispositivo / Accesorio GS1 China' };
  }
  if (barcode.startsWith('786')) {
    return { brand: 'Nacional', label: 'Producto Registrado GS1 Ecuador' };
  }
  if (barcode.startsWith('880')) {
    return { brand: 'Samsung / LG / Corea', label: 'Dispositivo Registrado GS1 Corea del Sur' };
  }
  if (barcode.startsWith('49') || barcode.startsWith('45')) {
    return { brand: 'Sony / Japón', label: 'Dispositivo Registrado GS1 Japón' };
  }
  return null;
}

/**
 * Searches worldwide public product databases and local catalog for a barcode
 */
export async function lookupProductByBarcode(
  barcode: string,
  localProductos: Producto[] = []
): Promise<ProductLookupResult> {
  const cleanCode = sanitizeBarcode(barcode);
  if (!cleanCode) {
    return { found: false, source: 'none', codigo: '', nombre: '' };
  }

  // 1. Check local catalog first
  const existingLocal = localProductos.find(
    (p) => p.codigo?.toLowerCase() === cleanCode.toLowerCase()
  );
  if (existingLocal) {
    return {
      found: true,
      source: 'local',
      codigo: existingLocal.codigo,
      nombre: existingLocal.nombre,
      costo_compra: Number(existingLocal.costo_compra) || 0,
      precio_venta_sugerido: Number(existingLocal.precio_venta_sugerido) || 0,
    };
  }

  // Helper with timeout
  const fetchWithTimeout = async (url: string, headers: Record<string, string> = {}, timeoutMs = 3500) => {
    try {
      const resp = await axios.get(url, {
        timeout: timeoutMs,
        headers: {
          'User-Agent': 'Tecnishop/2.0 (tecnishop-inventory-app)',
          Accept: 'application/json',
          ...headers,
        },
      });
      return resp.data;
    } catch {
      return null;
    }
  };

  // 2. Query upcdatabase.org via local scanner server proxy or direct proxy with user's API Key
  try {
    // A) Try via local scanner server proxy (running on port 5050)
    const localProxyData = await fetchWithTimeout(
      `http://127.0.0.1:5050/api/lookup?barcode=${encodeURIComponent(cleanCode)}`,
      {},
      2500
    );
    const upcData = localProxyData?.data || null;

    if (upcData && upcData.success && upcData.title) {
      const title = upcData.title.trim();
      const brand = upcData.brand || upcData.manufacturer || '';
      const msrp = parseFloat(upcData.msrp || '0');
      const img = upcData.images && upcData.images.length > 0 ? upcData.images[0] : undefined;

      return {
        found: true,
        source: 'upcdatabase',
        codigo: cleanCode,
        nombre: title,
        marca: brand,
        categoria: upcData.category || '',
        precio_venta_sugerido: msrp > 0 ? msrp : undefined,
        imagen_url: img,
      };
    }
  } catch {
    // Continue to next source
  }

  // B) Try upcdatabase via Vite proxy fallback
  try {
    const viteProxyData = await fetchWithTimeout(
      `/upcdatabase-proxy/product/${cleanCode}?apikey=${UPCDATABASE_API_KEY}`,
      { Authorization: `Bearer ${UPCDATABASE_API_KEY}` },
      2500
    );
    if (viteProxyData && viteProxyData.success && viteProxyData.title) {
      const title = viteProxyData.title.trim();
      const brand = viteProxyData.brand || viteProxyData.manufacturer || '';
      const msrp = parseFloat(viteProxyData.msrp || '0');
      const img = viteProxyData.images && viteProxyData.images.length > 0 ? viteProxyData.images[0] : undefined;

      return {
        found: true,
        source: 'upcdatabase',
        codigo: cleanCode,
        nombre: title,
        marca: brand,
        categoria: viteProxyData.category || '',
        precio_venta_sugerido: msrp > 0 ? msrp : undefined,
        imagen_url: img,
      };
    }
  } catch {
    // Continue to next source
  }

  // 3. Try Open Products Facts (electronics, hardware, office, consumer goods)
  try {
    const opfData = await fetchWithTimeout(
      `https://world.openproductsfacts.org/api/v2/product/${cleanCode}.json`
    );
    if (opfData && opfData.status === 1 && opfData.product) {
      const p = opfData.product;
      const brand = p.brands || p.brand_owner || '';
      const name = p.product_name || p.product_name_es || p.product_name_en || '';
      const fullName = brand && !name.toLowerCase().includes(brand.toLowerCase())
        ? `${brand} - ${name}`
        : name;

      if (fullName) {
        return {
          found: true,
          source: 'openproductsfacts',
          codigo: cleanCode,
          nombre: fullName.trim(),
          marca: brand,
          categoria: p.categories || '',
          imagen_url: p.image_front_url || p.image_url || '',
        };
      }
    }
  } catch {
    // Continue to next source
  }

  // 4. Try Open Food Facts (broad coverage for standard EAN/UPC barcoded items)
  try {
    const offData = await fetchWithTimeout(
      `https://world.openfoodfacts.org/api/v2/product/${cleanCode}.json`
    );
    if (offData && offData.status === 1 && offData.product) {
      const p = offData.product;
      const brand = p.brands || p.brand_owner || '';
      const name = p.product_name || p.product_name_es || p.product_name_en || '';
      const fullName = brand && !name.toLowerCase().includes(brand.toLowerCase())
        ? `${brand} - ${name}`
        : name;

      if (fullName) {
        return {
          found: true,
          source: 'openfoodfacts',
          codigo: cleanCode,
          nombre: fullName.trim(),
          marca: brand,
          categoria: p.categories || '',
          imagen_url: p.image_front_url || p.image_url || '',
        };
      }
    }
  } catch {
    // Continue to next source
  }

  // 5. Try UPCitemdb public trial endpoint
  try {
    const upcData = await fetchWithTimeout(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${cleanCode}`
    );
    if (upcData && upcData.items && upcData.items.length > 0) {
      const item = upcData.items[0];
      const title = item.title || item.description || '';
      const brand = item.brand || '';
      const suggestedPrice = item.lowest_recorded_price || item.highest_recorded_price || 0;

      if (title) {
        return {
          found: true,
          source: 'upcitemdb',
          codigo: cleanCode,
          nombre: title.trim(),
          marca: brand,
          categoria: item.category || '',
          precio_venta_sugerido: suggestedPrice > 0 ? Number(suggestedPrice.toFixed(2)) : undefined,
          imagen_url: item.images && item.images.length > 0 ? item.images[0] : undefined,
        };
      }
    }
  } catch {
    // End of external APIs
  }

  // 6. GS1 Manufacturer Prefix detection (e.g. Xiaomi 6934177...)
  const prefixMatch = identifyManufacturerByPrefix(cleanCode);
  if (prefixMatch) {
    return {
      found: true,
      source: 'gs1_prefix',
      codigo: cleanCode,
      nombre: prefixMatch.label || `Artículo ${prefixMatch.brand}`,
      marca: prefixMatch.brand,
      categoria: 'Electrónica / Accesorios',
    };
  }

  // If not found in external databases, return clean result with the scanned code
  return {
    found: false,
    source: 'none',
    codigo: cleanCode,
    nombre: '',
  };
}
