import { useState, useRef, useMemo, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Producto, Reporte } from '../../types';
import { TrabajoRow, RepuestoRow } from '../../components/reportes/FichaTecnicaItemsSection';

export interface UseReportesFormOptions {
  chequeos: Producto[];
  onSuccess: (data?: any) => void;
}

export const useReportesForm = ({ chequeos, onSuccess }: UseReportesFormOptions) => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingReporteId, setEditingReporteId] = useState<string | null>(null);

  const [ordenId, setOrdenId] = useState<string>('');
  const [personaACargo, setPersonaACargo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [diagnosticoProblemas, setDiagnosticoProblemas] = useState('');
  const [diagnosticoProblemasList, setDiagnosticoProblemasList] = useState<string[]>(['']);
  const problemaInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [tipoChequeoId, setTipoChequeoId] = useState('');
  const [precioChequeo, setPrecioChequeo] = useState<number>(10);

  const [trabajos, setTrabajos] = useState<TrabajoRow[]>([
    { descripcion: '', costo: 0, estado: 'COTIZADO' },
  ]);
  const [repuestos, setRepuestos] = useState<RepuestoRow[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [ordenSearch, setOrdenSearch] = useState('');

  useEffect(() => {
    if (chequeos.length > 0 && !tipoChequeoId) {
      setTipoChequeoId(chequeos[0].id);
      setPrecioChequeo(Number(chequeos[0].precio_venta_sugerido || 10));
    }
  }, [chequeos, tipoChequeoId]);

  const handleSelectChequeo = (id: string) => {
    setTipoChequeoId(id);
    const found = chequeos.find((c) => c.id === id);
    if (found) {
      setPrecioChequeo(Number(found.precio_venta_sugerido || 10));
    }
  };

  const handleProblemaChange = (index: number, value: string) => {
    const updated = [...diagnosticoProblemasList];
    updated[index] = value;
    setDiagnosticoProblemasList(updated);
    setDiagnosticoProblemas(updated.filter((p) => p.trim()).join('\n'));
  };

  const handleAddProblema = (atIndex?: number) => {
    const targetIdx = atIndex !== undefined ? atIndex + 1 : diagnosticoProblemasList.length;
    const updated = [...diagnosticoProblemasList];
    updated.splice(targetIdx, 0, '');
    setDiagnosticoProblemasList(updated);
    setDiagnosticoProblemas(updated.filter((p) => p.trim()).join('\n'));
    setTimeout(() => {
      problemaInputRefs.current[targetIdx]?.focus();
    }, 30);
  };

  const handleRemoveProblema = (index: number) => {
    if (diagnosticoProblemasList.length <= 1) {
      setDiagnosticoProblemasList(['']);
      setDiagnosticoProblemas('');
      problemaInputRefs.current[0]?.focus();
      return;
    }
    const updated = diagnosticoProblemasList.filter((_, i) => i !== index);
    setDiagnosticoProblemasList(updated);
    setDiagnosticoProblemas(updated.filter((p) => p.trim()).join('\n'));
    const prevIdx = Math.max(0, index - 1);
    setTimeout(() => {
      problemaInputRefs.current[prevIdx]?.focus();
    }, 30);
  };

  const handleProblemaKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddProblema(index);
    } else if (
      e.key === 'Backspace' &&
      !diagnosticoProblemasList[index] &&
      diagnosticoProblemasList.length > 1
    ) {
      e.preventDefault();
      handleRemoveProblema(index);
    } else if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      problemaInputRefs.current[index - 1]?.focus();
    } else if (
      e.key === 'ArrowDown' &&
      index < diagnosticoProblemasList.length - 1
    ) {
      e.preventDefault();
      problemaInputRefs.current[index + 1]?.focus();
    }
  };

  const resetForm = () => {
    setEditingReporteId(null);
    setOrdenId('');
    setPersonaACargo('');
    setObservaciones('');
    setDiagnosticoProblemas('');
    setDiagnosticoProblemasList(['']);
    if (chequeos.length > 0) {
      setTipoChequeoId(chequeos[0].id);
      setPrecioChequeo(Number(chequeos[0].precio_venta_sugerido || 10));
    }
    setTrabajos([{ descripcion: '', costo: 0, estado: 'COTIZADO' }]);
    setRepuestos([]);
    setFormError(null);
  };

  const handleAddTrabajo = () => {
    setTrabajos([...trabajos, { descripcion: '', costo: 0, estado: 'COTIZADO' }]);
  };

  const handleRemoveTrabajo = (idx: number) => {
    setTrabajos(trabajos.filter((_, i) => i !== idx));
  };

  const handleToggleEstadoTrabajo = (idx: number) => {
    const updated = [...trabajos];
    updated[idx].estado = updated[idx].estado === 'COTIZADO' ? 'RECHAZADO' : 'COTIZADO';
    setTrabajos(updated);
  };

  const handleAddRepuesto = () => {
    setRepuestos([
      ...repuestos,
      { nombre_repuesto: '', cantidad: 1, precio_unitario: 0, estado: 'COTIZADO' },
    ]);
  };

  const handleRemoveRepuesto = (idx: number) => {
    setRepuestos(repuestos.filter((_, i) => i !== idx));
  };

  const handleToggleEstadoRepuesto = (idx: number) => {
    const updated = [...repuestos];
    updated[idx].estado = updated[idx].estado === 'COTIZADO' ? 'RECHAZADO' : 'COTIZADO';
    setRepuestos(updated);
  };

  const handleRepuestoSelect = (idx: number, item: any) => {
    const updated = [...repuestos];
    updated[idx] = {
      ...updated[idx],
      producto_id: item.id || undefined,
      nombre_repuesto: item.texto,
      precio_unitario: item.precio || 0,
      categoria: item.categoria || undefined,
    };
    setRepuestos(updated);
  };

  const handleEditReporte = (reporte: Reporte) => {
    setEditingReporteId(reporte.id);
    const ordId =
      reporte.orden?.id ||
      (typeof reporte.orden_id === 'object' && (reporte.orden_id as any)?.id) ||
      (typeof reporte.orden_id === 'string' ? reporte.orden_id : '');
    setOrdenId(ordId);
    setPersonaACargo(reporte.persona_a_cargo || '');
    setObservaciones(reporte.observaciones || '');
    setDiagnosticoProblemas(reporte.diagnostico_problemas || '');
    const lines = (reporte.diagnostico_problemas || '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    setDiagnosticoProblemasList(lines.length > 0 ? lines : ['']);
    setTipoChequeoId(reporte.tipo_chequeo || (chequeos[0]?.id ?? ''));
    setPrecioChequeo(Number(reporte.precio_chequeo || 10));

    if (reporte.trabajos_realizados && reporte.trabajos_realizados.length > 0) {
      setTrabajos(
        reporte.trabajos_realizados.map((t) => ({
          descripcion: t.descripcion,
          costo: t.costo,
          estado: t.estado || 'COTIZADO',
        }))
      );
    } else {
      setTrabajos([{ descripcion: '', costo: 0, estado: 'COTIZADO' }]);
    }

    if (reporte.repuestos_utilizados && reporte.repuestos_utilizados.length > 0) {
      setRepuestos(
        reporte.repuestos_utilizados.map((r) => ({
          producto_id: (r as any).producto || (r as any).producto_id,
          nombre_repuesto: r.nombre_repuesto,
          cantidad: r.cantidad,
          precio_unitario: r.precio_unitario,
          estado: r.estado || 'COTIZADO',
        }))
      );
    } else {
      setRepuestos([]);
    }

    setIsCreateOpen(true);
  };

  const totalAceptado = useMemo(() => {
    const totalTrabajos = trabajos
      .filter((t) => t.estado === 'COTIZADO')
      .reduce((acc, t) => acc + (Number(t.costo) || 0), 0);
    const totalRepuestos = repuestos
      .filter((r) => r.estado === 'COTIZADO')
      .reduce((acc, r) => acc + (Number(r.precio_unitario) || 0) * (r.cantidad || 1), 0);
    return totalTrabajos + totalRepuestos;
  }, [trabajos, repuestos]);

  const totalRechazado = useMemo(() => {
    const totalTrabajos = trabajos
      .filter((t) => t.estado === 'RECHAZADO')
      .reduce((acc, t) => acc + (Number(t.costo) || 0), 0);
    const totalRepuestos = repuestos
      .filter((r) => r.estado === 'RECHAZADO')
      .reduce((acc, r) => acc + (Number(r.precio_unitario) || 0) * (r.cantidad || 1), 0);
    return totalTrabajos + totalRepuestos;
  }, [trabajos, repuestos]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!ordenId) throw new Error('Debes seleccionar una orden de trabajo.');
      const finalDiag = diagnosticoProblemasList.filter((p) => p.trim()).join('\n');
      if (!finalDiag) throw new Error('Debes ingresar al menos un problema detectado en el diagnóstico.');

      const payload = {
        orden_id: ordenId,
        persona_a_cargo: personaACargo,
        observaciones,
        diagnostico_problemas: finalDiag,
        tipo_chequeo: tipoChequeoId || undefined,
        precio_chequeo: Number(precioChequeo),
        trabajos: trabajos
          .filter((t) => t.descripcion.trim())
          .map((t) => ({
            descripcion: t.descripcion.trim(),
            costo: Number(t.costo) || 0,
            estado: t.estado,
          })),
        repuestos: repuestos
          .filter((r) => r.nombre_repuesto.trim())
          .map((r) => ({
            producto_id: r.producto_id || undefined,
            nombre_repuesto: r.nombre_repuesto.trim(),
            cantidad: Number(r.cantidad) || 1,
            precio_unitario: Number(r.precio_unitario) || 0,
            estado: r.estado,
          })),
      };

      if (editingReporteId) {
        return api.updateReporte(editingReporteId, payload);
      }
      return api.createReporte(payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
      queryClient.invalidateQueries({ queryKey: ['ordenes'] });
      setIsCreateOpen(false);
      resetForm();
      onSuccess(data);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error || err.message || 'Error al guardar la ficha técnica.');
    },
  });

  return {
    isCreateOpen,
    setIsCreateOpen,
    editingReporteId,
    ordenId,
    setOrdenId,
    personaACargo,
    setPersonaACargo,
    observaciones,
    setObservaciones,
    diagnosticoProblemas,
    diagnosticoProblemasList,
    problemaInputRefs,
    tipoChequeoId,
    precioChequeo,
    setPrecioChequeo,
    trabajos,
    setTrabajos,
    repuestos,
    setRepuestos,
    formError,
    ordenSearch,
    setOrdenSearch,
    totalAceptado,
    totalRechazado,
    saveMutation,
    handleSelectChequeo,
    handleProblemaChange,
    handleAddProblema,
    handleRemoveProblema,
    handleProblemaKeyDown,
    resetForm,
    handleAddTrabajo,
    handleRemoveTrabajo,
    handleToggleEstadoTrabajo,
    handleAddRepuesto,
    handleRemoveRepuesto,
    handleToggleEstadoRepuesto,
    handleRepuestoSelect,
    handleEditReporte,
  };
};
