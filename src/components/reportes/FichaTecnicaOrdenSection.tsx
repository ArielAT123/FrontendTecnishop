import React from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Orden } from '../../types';
import { ClipboardList, Calendar, Search } from 'lucide-react';

export interface FichaTecnicaOrdenSectionProps {
  currentSelectedOrden: Orden | null;
  setOrdenId: (id: string) => void;
  ordenSearch: string;
  setOrdenSearch: (s: string) => void;
  availableFilteredOrdenes: Orden[];
  handleSelectOrden: (o: Orden) => void;
}

export const FichaTecnicaOrdenSection: React.FC<FichaTecnicaOrdenSectionProps> = ({
  currentSelectedOrden,
  setOrdenId,
  ordenSearch,
  setOrdenSearch,
  availableFilteredOrdenes,
  handleSelectOrden,
}) => {
  return (
    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-[#3498db]" />
          <span>1. Detalle del Equipo & Orden de Trabajo</span>
        </h4>

        {currentSelectedOrden && (
          <button
            type="button"
            onClick={() => setOrdenId('')}
            className="text-xs font-semibold text-[#3498db] hover:underline"
          >
            Cambiar Orden
          </button>
        )}
      </div>

      {currentSelectedOrden ? (
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-blue-500/30 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div className="flex items-center gap-3">
              <span className="text-base font-black font-mono text-[#3498db]">
                Orden #{currentSelectedOrden.numero_orden || currentSelectedOrden.id.slice(0, 8)}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {currentSelectedOrden.fecha}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Badge status={currentSelectedOrden.estado} className="text-xs py-0.5 px-2.5 font-bold">
                {currentSelectedOrden.estado}
              </Badge>
              {currentSelectedOrden.estado === 'PENDIENTE' && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Pasará automáticamente a EN PROCESO
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Cliente:</span>
              <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                {currentSelectedOrden.equipo?.cliente?.nombre || (currentSelectedOrden.equipo as any)?.cliente_ci?.nombre}{' '}
                {currentSelectedOrden.equipo?.cliente?.apellido || (currentSelectedOrden.equipo as any)?.cliente_ci?.apellido || ''}
              </p>
              <p className="text-slate-500 text-[11px] font-mono">
                C.I: {currentSelectedOrden.equipo?.cliente?.ci || (currentSelectedOrden.equipo as any)?.cliente_ci?.ci}
              </p>
              <p className="text-slate-500 text-[11px]">
                Tel: {currentSelectedOrden.equipo?.cliente?.telefono || (currentSelectedOrden.equipo as any)?.cliente_ci?.telefono || 'N/A'}
              </p>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Equipo / Dispositivo:</span>
              <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                {currentSelectedOrden.equipo?.nombre} ({currentSelectedOrden.equipo?.marca} {currentSelectedOrden.equipo?.modelo})
              </p>
              <p className="text-slate-500 text-[11px] font-mono">
                S/N: {currentSelectedOrden.equipo?.numero_serie || 'No especificado'}
              </p>
              <p className="text-slate-500 text-[11px]">
                Recepción por: {currentSelectedOrden.realiza_orden || 'Técnico'}
              </p>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Accesorios Recibidos:</span>
              <div className="flex flex-wrap gap-1">
                {currentSelectedOrden.observaciones?.[0]?.cargador && (
                  <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-[#3498db] text-[10px] font-bold">
                    Cargador
                  </span>
                )}
                {currentSelectedOrden.observaciones?.[0]?.bateria && (
                  <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-[#3498db] text-[10px] font-bold">
                    Batería
                  </span>
                )}
                {currentSelectedOrden.observaciones?.[0]?.cable_poder && (
                  <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-[#3498db] text-[10px] font-bold">
                    Cable Poder
                  </span>
                )}
                {currentSelectedOrden.observaciones?.[0]?.cable_datos && (
                  <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-[#3498db] text-[10px] font-bold">
                    Cable Datos
                  </span>
                )}
                {currentSelectedOrden.observaciones?.[0]?.otros && (
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]">
                    {currentSelectedOrden.observaciones[0].otros}
                  </span>
                )}
                {!currentSelectedOrden.observaciones?.[0]?.cargador &&
                  !currentSelectedOrden.observaciones?.[0]?.bateria &&
                  !currentSelectedOrden.observaciones?.[0]?.cable_poder &&
                  !currentSelectedOrden.observaciones?.[0]?.cable_datos &&
                  !currentSelectedOrden.observaciones?.[0]?.otros && (
                    <span className="text-slate-400 text-[10px] italic">Sin accesorios adicionales</span>
                  )}
              </div>
            </div>
          </div>

          <div className="mt-2 p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs">
            <span className="font-bold text-amber-700 dark:text-amber-400 uppercase text-[10px] block mb-0.5">
              Problema Inicial Reportado por el Cliente (Recepción):
            </span>
            <p className="text-slate-700 dark:text-slate-200">
              {currentSelectedOrden.problemas?.[0]?.problema || 'No se detalló problema específico en la recepción'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Input
            placeholder="Buscar orden por número, cliente o equipo..."
            value={ordenSearch}
            onChange={(e) => setOrdenSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="text-xs"
          />

          <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {availableFilteredOrdenes.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No se encontraron órdenes disponibles.
              </div>
            ) : (
              availableFilteredOrdenes.map((o) => (
                <div
                  key={o.id}
                  className="p-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="truncate pr-3 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#3498db]">
                        #{o.numero_orden || o.id.slice(0, 8)}
                      </span>
                      <span className="text-[10px] text-slate-400">{o.fecha}</span>
                      <Badge status={o.estado} className="text-[9px] py-0 px-1.5 font-bold">
                        {o.estado}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 truncate">
                      <span className="font-bold">
                        {o.equipo?.cliente?.nombre || (o.equipo as any)?.cliente_ci?.nombre} {o.equipo?.cliente?.apellido || (o.equipo as any)?.cliente_ci?.apellido || ''}
                      </span>{' '}
                      &bull; {o.equipo?.marca} {o.equipo?.modelo || o.equipo?.nombre}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSelectOrden(o)}
                    className="bg-[#3498db] hover:bg-[#2980b9] text-white text-xs h-7 px-3"
                  >
                    Seleccionar
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
