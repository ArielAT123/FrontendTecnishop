import React from 'react';
import { CheckSquare, Wrench, Printer } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Orden } from '../../types';

export interface DetalleOrdenModalProps {
  orden: Orden | null;
  onClose: () => void;
  onPrint: (orden: Orden) => void;
}

export const DetalleOrdenModal: React.FC<DetalleOrdenModalProps> = ({
  orden,
  onClose,
  onPrint,
}) => {
  if (!orden) return null;

  const displayNumero =
    orden.numero_orden && orden.numero_orden !== 'ORD-2025'
      ? orden.numero_orden
      : orden.id.slice(0, 8);

  const obsList = orden.observaciones || orden.equipo?.observaciones;
  const obs = Array.isArray(obsList) && obsList.length > 0 ? obsList[0] : null;

  const probs = orden.problemas || orden.equipo?.problemas;
  const probList = Array.isArray(probs) ? probs : [];

  return (
    <Modal
      isOpen={!!orden}
      onClose={onClose}
      title={`Detalle de Orden #${displayNumero}`}
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80">
          <div>
            <p className="text-slate-400 font-semibold uppercase">Estado Actual</p>
            <div className="mt-1">
              <Badge status={orden.estado}>{orden.estado}</Badge>
            </div>
          </div>
          <div>
            <p className="text-slate-400 font-semibold uppercase">Fecha Recepción</p>
            <p className="mt-1 font-bold text-slate-800 dark:text-slate-200">{orden.fecha}</p>
          </div>
          <div>
            <p className="text-slate-400 font-semibold uppercase">Técnico Asignado</p>
            <p className="mt-1 font-bold text-slate-800 dark:text-slate-200">
              {orden.realiza_orden || 'No asignado'}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-semibold uppercase">Propietario</p>
            <p className="mt-1 font-bold text-slate-800 dark:text-slate-200">
              {orden.equipo?.cliente?.nombre} {orden.equipo?.cliente?.apellido || ''} (
              {orden.equipo?.cliente?.ci})
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2">Información del Dispositivo</h4>
          <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
            <p>
              <span className="text-slate-400">Tipo:</span> {orden.equipo?.nombre || 'N/A'}
            </p>
            <p>
              <span className="text-slate-400">Marca:</span> {orden.equipo?.marca || 'N/A'}
            </p>
            <p>
              <span className="text-slate-400">Modelo:</span> {orden.equipo?.modelo || 'N/A'}
            </p>
            <p>
              <span className="text-slate-400">Serie:</span> {orden.equipo?.numero_serie || 'N/A'}
            </p>
          </div>
        </div>

        {/* Observaciones / Accesorios de la Orden */}
        {obs && (
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1.5 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-[#3498db]" />
              <span>Accesorios Recibidos</span>
            </h4>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span
                className={`px-2 py-0.5 rounded-md font-medium ${
                  obs.cargador
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}
              >
                Cargador: {obs.cargador ? 'SÍ' : 'NO'}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md font-medium ${
                  obs.bateria
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}
              >
                Batería: {obs.bateria ? 'SÍ' : 'NO'}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md font-medium ${
                  obs.cable_poder
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}
              >
                Cable Poder: {obs.cable_poder ? 'SÍ' : 'NO'}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md font-medium ${
                  obs.cable_datos
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}
              >
                Cable Datos: {obs.cable_datos ? 'SÍ' : 'NO'}
              </span>
              {obs.otros && (
                <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-[#3498db] border border-blue-500/20 font-medium">
                  Otros: {obs.otros}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Falla o Problema Reportado */}
        {probList.length > 0 && (
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-[#3498db]" />
              <span>Falla o Problema Reportado</span>
            </h4>
            <p className="text-slate-700 dark:text-slate-300 italic">
              {probList.map((p: any) => (typeof p === 'string' ? p : p.problema)).join(' | ')}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="secondary"
            onClick={() => onPrint(orden)}
            className="flex items-center gap-1.5 text-[#3498db] border-[#3498db]/30 hover:bg-[#3498db]/10"
          >
            <Printer className="w-4 h-4" />
            Imprimir Orden
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
