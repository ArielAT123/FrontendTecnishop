import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { api } from '../../api/client';
import { Reporte, Orden, TrabajoRealizado, RepuestoUtilizado, OrdenesPaginadasResponse } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import {
  FileText,
  PlusCircle,
  Printer,
  Trash2,
  DollarSign,
  User,
  Calendar,
  AlertCircle,
  Eye,
  CheckCircle2,
} from 'lucide-react';

interface ReportesPageProps {
  selectedOrder?: Orden | null;
}

export const ReportesPage: React.FC<ReportesPageProps> = ({ selectedOrder }) => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(!!selectedOrder);
  const [viewingReporte, setViewingReporte] = useState<Reporte | null>(null);

  // Form State
  const [ordenId, setOrdenId] = useState<string>(selectedOrder?.id || '');
  const [personaACargo, setPersonaACargo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [trabajos, setTrabajos] = useState<TrabajoRealizado[]>([
    { descripcion: '', costo: 0 },
  ]);
  const [repuestos, setRepuestos] = useState<RepuestoUtilizado[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: reportes = [], isLoading, isSyncing } = useCachedQuery<Reporte[]>({
    queryKey: ['reportes'],
    queryFn: api.getReportes,
    keyField: 'id',
  });

  const { data: ordenesData } = useCachedQuery<OrdenesPaginadasResponse>({
    queryKey: ['ordenes-for-reports'],
    queryFn: () => api.getOrdenes(0, 100),
    keyField: 'id',
    nestedArrayKey: 'ordenes',
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.createReporte(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
      setIsCreateOpen(false);
      resetForm();
      setViewingReporte(data);
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.errors || err.message || 'Error al crear el informe');
    },
  });

  const resetForm = () => {
    setOrdenId('');
    setPersonaACargo('');
    setObservaciones('');
    setTrabajos([{ descripcion: '', costo: 0 }]);
    setRepuestos([]);
    setFormError(null);
  };

  // Math totals
  const totalTrabajos = trabajos.reduce((sum, t) => sum + (parseFloat(String(t.costo)) || 0), 0);
  const totalRepuestos = repuestos.reduce(
    (sum, r) => sum + (parseInt(String(r.cantidad)) || 0) * (parseFloat(String(r.precio_unitario)) || 0),
    0
  );
  const totalGeneral = totalTrabajos + totalRepuestos;

  const handleAddTrabajo = () => {
    setTrabajos([...trabajos, { descripcion: '', costo: 0 }]);
  };

  const handleRemoveTrabajo = (idx: number) => {
    setTrabajos(trabajos.filter((_, i) => i !== idx));
  };

  const handleAddRepuesto = () => {
    setRepuestos([...repuestos, { nombre_repuesto: '', cantidad: 1, precio_unitario: 0 }]);
  };

  const handleRemoveRepuesto = (idx: number) => {
    setRepuestos(repuestos.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ordenId) {
      setFormError('Debes seleccionar una orden');
      return;
    }

    const validTrabajos = trabajos.filter((t) => t.descripcion.trim().length > 0);
    const validRepuestos = repuestos.filter((r) => r.nombre_repuesto.trim().length > 0);

    createMutation.mutate({
      orden_id: ordenId,
      persona_a_cargo: personaACargo,
      observaciones,
      trabajos_realizados: validTrabajos,
      repuestos_utilizados: validRepuestos,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Informes Técnicos & Facturación</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Liquidación de mano de obra y repuestos aplicados por orden
          </p>
        </div>

        <Button
          leftIcon={<PlusCircle className="w-4 h-4" />}
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
          className="shadow-sm"
        >
          Nuevo Informe Técnico
        </Button>
      </div>

      {/* Reports Table Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Informes Emitidos ({reportes.length})</span>
            {isSyncing && (
              <span className="text-[10px] font-normal text-[#3498db] animate-pulse bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                Sincronizando en segundo plano...
              </span>
            )}
          </h3>
        </div>

        {isLoading && reportes.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">Cargando informes técnicos...</div>
        ) : reportes.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No se han generado informes técnicos todavía.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="pb-3 pl-2">Fecha</th>
                  <th className="pb-3">Nº Orden</th>
                  <th className="pb-3">Cliente</th>
                  <th className="pb-3">Técnico a Cargo</th>
                  <th className="pb-3 text-right">Mano de Obra</th>
                  <th className="pb-3 text-right">Repuestos</th>
                  <th className="pb-3 text-right">Total General</th>
                  <th className="pb-3 pr-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {reportes.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 pl-2 text-slate-600 dark:text-slate-400">
                      {rep.fecha_creacion ? new Date(rep.fecha_creacion).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {rep.orden?.numero_orden || rep.orden_id?.slice(0, 8)}
                    </td>
                    <td className="py-3 text-slate-900 dark:text-slate-100 font-semibold">
                      {rep.orden?.equipo?.cliente?.nombre || 'Cliente'}{' '}
                      {rep.orden?.equipo?.cliente?.apellido || ''}
                    </td>
                    <td className="py-3 text-slate-700 dark:text-slate-300">
                      {rep.persona_a_cargo || '—'}
                    </td>
                    <td className="py-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      ${Number(rep.total_trabajos || 0).toFixed(2)}
                    </td>
                    <td className="py-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      ${Number(rep.total_repuestos || 0).toFixed(2)}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ${Number(rep.total_general || 0).toFixed(2)}
                    </td>
                    <td className="py-3 pr-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingReporte(rep)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Ver Comprobante"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setViewingReporte(rep);
                            setTimeout(() => window.print(), 300);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                          title="Imprimir"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Crear Informe Técnico */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Generar Nuevo Informe Técnico"
        maxWidth="3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-500 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Orden de Servicio *
              </label>
              <select
                value={ordenId}
                onChange={(e) => setOrdenId(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              >
                <option value="">Selecciona la orden...</option>
                {ordenesData?.ordenes?.map((o) => (
                  <option key={o.id} value={o.id}>
                    #{o.numero_orden || o.id.slice(0, 8)} - {o.equipo?.cliente?.nombre} ({o.equipo?.marca}{' '}
                    {o.equipo?.modelo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Técnico a Cargo
              </label>
              <Input
                placeholder="Nombre del técnico"
                value={personaACargo}
                onChange={(e) => setPersonaACargo(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* Trabajos Realizados Section */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                1. Trabajos Realizados / Mano de Obra
              </h4>
              <Button type="button" size="sm" variant="ghost" onClick={handleAddTrabajo}>
                + Agregar Trabajo
              </Button>
            </div>

            {trabajos.map((t, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Descripción del trabajo (ej. Limpieza y cambio de pasta térmica)"
                    value={t.descripcion}
                    onChange={(e) => {
                      const newT = [...trabajos];
                      newT[idx].descripcion = e.target.value;
                      setTrabajos(newT);
                    }}
                  />
                </div>
                <div className="w-28">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Costo"
                    value={t.costo}
                    onChange={(e) => {
                      const newT = [...trabajos];
                      newT[idx].costo = parseFloat(e.target.value) || 0;
                      setTrabajos(newT);
                    }}
                    leftIcon={<DollarSign className="w-3.5 h-3.5" />}
                  />
                </div>
                {trabajos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTrabajo(idx)}
                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            <div className="text-right text-xs font-bold text-slate-600 dark:text-slate-300">
              Subtotal Mano de Obra: <span className="font-mono">${totalTrabajos.toFixed(2)}</span>
            </div>
          </div>

          {/* Repuestos Utilizados Section */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                2. Repuestos Utilizados
              </h4>
              <Button type="button" size="sm" variant="ghost" onClick={handleAddRepuesto}>
                + Agregar Repuesto
              </Button>
            </div>

            {repuestos.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No se agregaron repuestos a este informe.</p>
            ) : (
              repuestos.map((r, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Repuesto o componente utilizado"
                      value={r.nombre_repuesto}
                      onChange={(e) => {
                        const newR = [...repuestos];
                        newR[idx].nombre_repuesto = e.target.value;
                        setRepuestos(newR);
                      }}
                    />
                  </div>
                  <div className="w-20">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Cant."
                      value={r.cantidad}
                      onChange={(e) => {
                        const newR = [...repuestos];
                        newR[idx].cantidad = parseInt(e.target.value) || 1;
                        setRepuestos(newR);
                      }}
                    />
                  </div>
                  <div className="w-28">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="P. Unit"
                      value={r.precio_unitario}
                      onChange={(e) => {
                        const newR = [...repuestos];
                        newR[idx].precio_unitario = parseFloat(e.target.value) || 0;
                        setRepuestos(newR);
                      }}
                      leftIcon={<DollarSign className="w-3.5 h-3.5" />}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveRepuesto(idx)}
                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}

            {repuestos.length > 0 && (
              <div className="text-right text-xs font-bold text-slate-600 dark:text-slate-300">
                Subtotal Repuestos: <span className="font-mono">${totalRepuestos.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Observaciones / Garantía
            </label>
            <Input
              placeholder="Ej. Garantía de 30 días sobre componentes reemplazados"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </div>

          {/* Summary Total */}
          <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-between">
            <span className="text-sm font-bold text-brand-700 dark:text-brand-300">TOTAL GENERAL A COBRAR:</span>
            <span className="text-xl font-black font-mono text-brand-700 dark:text-brand-300">
              ${totalGeneral.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Guardar y Emitir Informe
            </Button>
          </div>
        </form>
      </Modal>

      {/* Printable Receipt Modal */}
      <Modal
        isOpen={!!viewingReporte}
        onClose={() => setViewingReporte(null)}
        title="Comprobante Técnico de Entrega"
        maxWidth="3xl"
      >
        {viewingReporte && (
          <div className="space-y-6">
            {/* Printable Area */}
            <div id="print-area" className="bg-white text-black p-8 rounded-xl border border-slate-300 space-y-6 text-xs font-sans">
              {/* Header */}
              <div className="border-b-2 border-black pb-4 flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-black tracking-tight">TECNISHOP</h1>
                  <p className="font-semibold text-gray-700">SERVICIO TÉCNICO ESPECIALIZADO</p>
                  <p className="text-[10px] text-gray-500">Reparación de Laptops, Computadoras y Equipos Electrónicos</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black font-mono">INFORME TÉCNICO</p>
                  <p className="text-xs font-bold text-gray-800">
                    Orden: #{viewingReporte.orden?.numero_orden || viewingReporte.orden_id?.slice(0, 8)}
                  </p>
                  <p className="text-[10px] text-gray-600">
                    Fecha: {new Date(viewingReporte.fecha_creacion).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Client & Device Info */}
              <div className="grid grid-cols-2 gap-4 border p-3 rounded border-gray-300 text-[11px]">
                <div>
                  <p className="font-bold text-gray-900 uppercase">Datos del Cliente:</p>
                  <p><span className="font-semibold">Nombre:</span> {viewingReporte.orden?.equipo?.cliente?.nombre} {viewingReporte.orden?.equipo?.cliente?.apellido}</p>
                  <p><span className="font-semibold">Cédula / RUC:</span> {viewingReporte.orden?.equipo?.cliente?.ci}</p>
                  <p><span className="font-semibold">Teléfono:</span> {viewingReporte.orden?.equipo?.cliente?.telefono || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900 uppercase">Datos del Equipo:</p>
                  <p><span className="font-semibold">Dispositivo:</span> {viewingReporte.orden?.equipo?.nombre}</p>
                  <p><span className="font-semibold">Marca / Modelo:</span> {viewingReporte.orden?.equipo?.marca} {viewingReporte.orden?.equipo?.modelo}</p>
                  <p><span className="font-semibold">Nº Serie:</span> {viewingReporte.orden?.equipo?.numero_serie || 'N/A'}</p>
                </div>
              </div>

              {/* Labor Tasks */}
              <div>
                <p className="font-bold text-gray-900 uppercase mb-1">Mano de Obra y Servicios Realizados:</p>
                <table className="w-full border-collapse border border-gray-300 text-[11px]">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-1.5 text-left">Descripción del Trabajo</th>
                      <th className="border border-gray-300 p-1.5 text-right w-24">Costo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingReporte.trabajos_realizados?.map((t, idx) => (
                      <tr key={idx}>
                        <td className="border border-gray-300 p-1.5">{t.descripcion}</td>
                        <td className="border border-gray-300 p-1.5 text-right font-mono">${Number(t.costo).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Spare Parts */}
              {viewingReporte.repuestos_utilizados && viewingReporte.repuestos_utilizados.length > 0 && (
                <div>
                  <p className="font-bold text-gray-900 uppercase mb-1">Repuestos y Componentes Instalados:</p>
                  <table className="w-full border-collapse border border-gray-300 text-[11px]">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-1.5 text-left">Repuesto</th>
                        <th className="border border-gray-300 p-1.5 text-center w-16">Cant.</th>
                        <th className="border border-gray-300 p-1.5 text-right w-24">P. Unit</th>
                        <th className="border border-gray-300 p-1.5 text-right w-24">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingReporte.repuestos_utilizados.map((r, idx) => (
                        <tr key={idx}>
                          <td className="border border-gray-300 p-1.5">{r.nombre_repuesto}</td>
                          <td className="border border-gray-300 p-1.5 text-center">{r.cantidad}</td>
                          <td className="border border-gray-300 p-1.5 text-right font-mono">${Number(r.precio_unitario).toFixed(2)}</td>
                          <td className="border border-gray-300 p-1.5 text-right font-mono font-semibold">
                            ${(Number(r.cantidad) * Number(r.precio_unitario)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Total Box */}
              <div className="flex justify-end">
                <div className="w-64 border border-black p-3 space-y-1 text-right text-[11px]">
                  <p className="flex justify-between">
                    <span>Mano de Obra:</span>
                    <span className="font-mono">${Number(viewingReporte.total_trabajos || 0).toFixed(2)}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Repuestos:</span>
                    <span className="font-mono">${Number(viewingReporte.total_repuestos || 0).toFixed(2)}</span>
                  </p>
                  <p className="flex justify-between font-bold text-sm border-t border-black pt-1">
                    <span>TOTAL GENERAL:</span>
                    <span className="font-mono">${Number(viewingReporte.total_general || 0).toFixed(2)}</span>
                  </p>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-12 grid grid-cols-2 gap-12 text-center text-[10px]">
                <div>
                  <div className="border-t border-black w-48 mx-auto" />
                  <p className="mt-1 font-bold">Firma Técnico Responsable</p>
                  <p className="text-gray-500">{viewingReporte.persona_a_cargo || 'Tecnishop'}</p>
                </div>
                <div>
                  <div className="border-t border-black w-48 mx-auto" />
                  <p className="mt-1 font-bold">Firma Conforme del Cliente</p>
                  <p className="text-gray-500">Recibí a entera satisfacción</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setViewingReporte(null)}>
                Cerrar
              </Button>
              <Button leftIcon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
                Imprimir Comprobante
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
