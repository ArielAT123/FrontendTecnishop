import { Reporte, Producto, TrabajoRealizado, RepuestoUtilizado } from '../../types';

export const checkIncompleteCotizacion = (
  trabajosList: TrabajoRealizado[],
  repuestosList: RepuestoUtilizado[]
): string[] => {
  const issues: string[] = [];

  trabajosList
    .filter((t) => t.estado === 'COTIZADO')
    .forEach((t, idx) => {
      if (!t.descripcion || !t.descripcion.trim()) {
        issues.push(`Servicio #${idx + 1}: Falta ingresar la descripción del servicio técnico.`);
      }
      if (isNaN(Number(t.costo)) || Number(t.costo) <= 0) {
        issues.push(
          `Servicio #${idx + 1} (${t.descripcion || 'Sin descripción'}): El precio debe ser mayor a $0.00.`
        );
      }
    });

  repuestosList
    .filter((r) => r.estado === 'COTIZADO')
    .forEach((r, idx) => {
      if (!r.nombre_repuesto || !r.nombre_repuesto.trim()) {
        issues.push(`Repuesto #${idx + 1}: Falta ingresar el nombre del repuesto.`);
      }
      if (isNaN(Number(r.precio_unitario)) || Number(r.precio_unitario) <= 0) {
        issues.push(
          `Repuesto #${idx + 1} (${r.nombre_repuesto || 'Sin nombre'}): El precio unitario debe ser mayor a $0.00.`
        );
      }
    });

  return issues;
};

export const preparePosPrefill = (
  rep: Reporte,
  productosInventario: Producto[],
  chequeos: Producto[],
  cli: any
) => {
  const totAceptado = Number(rep.total_aceptado ?? rep.total_general ?? 0);
  const clienteNombre = cli ? `${cli.nombre} ${cli.apellido || ''}`.trim() : 'CONSUMIDOR FINAL';

  let itemsParaPOS: any[] = [];

  if (totAceptado > 0) {
    const trabajosAcc = (rep.trabajos_realizados || [])
      .filter((t) => t.estado === 'COTIZADO' && t.descripcion?.trim())
      .map((t, idx) => {
        const match = productosInventario.find(
          (p) => p.nombre.trim().toLowerCase() === t.descripcion.trim().toLowerCase()
        );
        return {
          producto: {
            id: match ? match.id : 'srv-' + idx,
            codigo: match
              ? match.codigo
              : `COT-SRV-${String(idx + 1).padStart(3, '0')}-${Date.now().toString().slice(-4)}`,
            nombre: t.descripcion,
            tipo: 'SERVICIO' as const,
            precio_venta_sugerido: Number(t.costo),
            precio_venta_recomendado: Number(t.costo),
            costo_compra: Number(t.costo_proveedor || 0),
            cantidad: 9999,
            impuesto: 15,
          },
          cantidad: 1,
          precio_unitario: Number(t.costo),
          impuesto_porcentaje: 15,
          subtotal: Number(t.costo),
        };
      });

    const repuestosAcc = (rep.repuestos_utilizados || [])
      .filter((r) => r.estado === 'COTIZADO' && r.nombre_repuesto?.trim())
      .map((r, idx) => {
        const match = productosInventario.find(
          (p) => p.nombre.trim().toLowerCase() === r.nombre_repuesto.trim().toLowerCase()
        );
        return {
          producto: {
            id: match ? match.id : 'rep-' + idx,
            codigo: match
              ? match.codigo
              : `COT-REP-${String(idx + 1).padStart(3, '0')}-${Date.now().toString().slice(-4)}`,
            nombre: r.nombre_repuesto,
            tipo: 'PRODUCTO' as const,
            precio_venta_sugerido: Number(r.precio_unitario),
            precio_venta_recomendado: Number(r.precio_unitario),
            costo_compra: Number(r.costo_unitario_proveedor || 0),
            cantidad: match ? match.cantidad : 9999,
            impuesto: 15,
          },
          cantidad: Number(r.cantidad || 1),
          precio_unitario: Number(r.precio_unitario),
          impuesto_porcentaje: 15,
          subtotal: Number(r.cantidad || 1) * Number(r.precio_unitario),
        };
      });

    itemsParaPOS = [...trabajosAcc, ...repuestosAcc];
  } else {
    const selChk = rep.tipo_chequeo_detalle || chequeos[0];
    itemsParaPOS = [
      {
        producto: {
          id: selChk?.id || 'chk-srv',
          codigo: selChk?.codigo || 'CHK-TEC',
          nombre: selChk?.nombre || 'Servicio de Chequeo Técnico',
          tipo: 'SERVICIO' as const,
          precio_venta_sugerido: Number(rep.precio_chequeo || 10),
          precio_venta_recomendado: Number(rep.precio_chequeo || 10),
          costo_compra: 0,
          cantidad: 9999,
          impuesto: 15,
          es_chequeo: true,
        },
        cantidad: 1,
        precio_unitario: Number(rep.precio_chequeo || 10),
        impuesto_porcentaje: 15,
        subtotal: Number(rep.precio_chequeo || 10),
      },
    ];
  }

  return {
    ordenId: rep.orden_id,
    reporteId: rep.id,
    numeroOrden:
      rep.orden?.numero_orden || (typeof rep.orden_id === 'string' ? rep.orden_id.slice(0, 8) : ''),
    clienteCi: cli?.ci,
    clienteNombre,
    clienteTelefono: cli?.telefono,
    items: itemsParaPOS,
  };
};
