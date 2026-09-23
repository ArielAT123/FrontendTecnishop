import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { FichaTecnicaOrdenSection } from './FichaTecnicaOrdenSection';
import { FichaTecnicaDiagnosticoSection } from './FichaTecnicaDiagnosticoSection';
import { FichaTecnicaItemsSection, TrabajoRow, RepuestoRow } from './FichaTecnicaItemsSection';
import { Orden, Producto } from '../../types';
import {
  CheckCircle2,
  AlertTriangle,
  User,
  ShoppingCart,
  AlertCircle,
} from 'lucide-react';

export interface FichaTecnicaModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingReporteId: string | null;
  formError: string | null;
  currentSelectedOrden: Orden | null;
  setOrdenId: (id: string) => void;
  ordenSearch: string;
  setOrdenSearch: (s: string) => void;
  availableFilteredOrdenes: Orden[];
  handleSelectOrden: (o: Orden) => void;
  diagnosticoProblemasList: string[];
  problemaInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  handleProblemaChange: (idx: number, val: string) => void;
  handleProblemaKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => void;
  handleRemoveProblema: (idx: number) => void;
  handleAddProblema: () => void;
  tipoChequeoId: string;
  handleSelectChequeo: (id: string) => void;
  chequeos: Producto[];
  precioChequeo: string | number;
  setPrecioChequeo: (val: any) => void;
  trabajos: TrabajoRow[];
  setTrabajos: React.Dispatch<React.SetStateAction<TrabajoRow[]>>;
  handleAddTrabajo: () => void;
  handleRemoveTrabajo: (idx: number) => void;
  handleToggleEstadoTrabajo: (idx: number) => void;
  repuestos: RepuestoRow[];
  setRepuestos: React.Dispatch<React.SetStateAction<RepuestoRow[]>>;
  handleAddRepuesto: () => void;
  handleRemoveRepuesto: (idx: number) => void;
  handleToggleEstadoRepuesto: (idx: number) => void;
  handleRepuestoSelect: (idx: number, item: any) => void;
  productosCatalogo: Producto[];
  personaACargo: string;
  setPersonaACargo: (val: string) => void;
  observaciones: string;
  setObservaciones: (val: string) => void;
  totalAceptado: number;
  totalRechazado: number;
  isSaving: boolean;
  onSave: () => void;
  onProcederAFacturacion: () => void;
}

export const FichaTecnicaModal: React.FC<FichaTecnicaModalProps> = ({
  isOpen,
  onClose,
  editingReporteId,
  formError,
  currentSelectedOrden,
  setOrdenId,
  ordenSearch,
  setOrdenSearch,
  availableFilteredOrdenes,
  handleSelectOrden,
  diagnosticoProblemasList,
  problemaInputRefs,
  handleProblemaChange,
  handleProblemaKeyDown,
  handleRemoveProblema,
  handleAddProblema,
  tipoChequeoId,
  handleSelectChequeo,
  chequeos,
  precioChequeo,
  setPrecioChequeo,
  trabajos,
  setTrabajos,
  handleAddTrabajo,
  handleRemoveTrabajo,
  handleToggleEstadoTrabajo,
  repuestos,
  setRepuestos,
  handleAddRepuesto,
  handleRemoveRepuesto,
  handleToggleEstadoRepuesto,
  handleRepuestoSelect,
  productosCatalogo,
  personaACargo,
  setPersonaACargo,
  observaciones,
  setObservaciones,
  totalAceptado,
  isSaving,
  onSave,
  onProcederAFacturacion,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingReporteId ? 'Editar Ficha Técnica & Cotización' : 'Nueva Ficha Técnica & Diagnóstico'}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {formError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* 1. INFORMACIÓN DE LA ORDEN & DETALLE DEL EQUIPO */}
        <FichaTecnicaOrdenSection
          currentSelectedOrden={currentSelectedOrden}
          setOrdenId={setOrdenId}
          ordenSearch={ordenSearch}
          setOrdenSearch={setOrdenSearch}
          availableFilteredOrdenes={availableFilteredOrdenes}
          handleSelectOrden={handleSelectOrden}
        />

        {/* 2. DIAGNÓSTICO TÉCNICO REAL & TIPO DE CHEQUEO */}
        <FichaTecnicaDiagnosticoSection
          diagnosticoProblemasList={diagnosticoProblemasList}
          problemaInputRefs={problemaInputRefs}
          handleProblemaChange={handleProblemaChange}
          handleProblemaKeyDown={handleProblemaKeyDown}
          handleRemoveProblema={handleRemoveProblema}
          handleAddProblema={handleAddProblema}
          tipoChequeoId={tipoChequeoId}
          handleSelectChequeo={handleSelectChequeo}
          chequeos={chequeos}
          precioChequeo={precioChequeo}
          setPrecioChequeo={setPrecioChequeo}
        />

        {/* 3. COTIZACIÓN (MANO DE OBRA Y REPUESTOS) */}
        <FichaTecnicaItemsSection
          trabajos={trabajos}
          setTrabajos={setTrabajos}
          handleAddTrabajo={handleAddTrabajo}
          handleRemoveTrabajo={handleRemoveTrabajo}
          handleToggleEstadoTrabajo={handleToggleEstadoTrabajo}
          repuestos={repuestos}
          setRepuestos={setRepuestos}
          handleAddRepuesto={handleAddRepuesto}
          handleRemoveRepuesto={handleRemoveRepuesto}
          handleToggleEstadoRepuesto={handleToggleEstadoRepuesto}
          handleRepuestoSelect={handleRepuestoSelect}
          productosCatalogo={productosCatalogo}
        />

        {/* 4. RESUMEN FINANCIERO Y DECISIÓN DE COTIZACIÓN */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-800/60 dark:to-blue-950/20 border border-slate-200 dark:border-slate-800 space-y-3">
          <div
            className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              totalAceptado > 0
                ? 'bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                : 'bg-amber-500/10 dark:bg-amber-950/30 border-amber-500/30 text-amber-900 dark:text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs">
              {totalAceptado > 0 ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span>Cotización Aceptada (Total o Parcial)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span>Cotización Rechazada por el Cliente</span>
                </>
              )}
            </div>

            <p className="text-xs font-medium">
              {totalAceptado > 0 ? (
                <span>
                  El cliente autorizó reparación por <strong>${totalAceptado.toFixed(2)}</strong>. Por regla del taller, el servicio de chequeo queda <strong>BONIFICADO ($0.00 GRATIS)</strong>.
                </span>
              ) : (
                <span>
                  Al no aceptar ningún ítem de cotización, se facturará únicamente el <strong>Servicio de Chequeo Técnico (${Number(precioChequeo).toFixed(2)})</strong>.
                </span>
              )}
            </p>
          </div>

          <div className="pt-2 border-t border-current/10 flex items-center justify-between">
            <span className="font-bold text-xs">Monto que pasará a Factura:</span>
            <span className="font-black font-mono text-lg">
              ${(totalAceptado > 0 ? totalAceptado : Number(precioChequeo)).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Técnico Responsable & Observaciones Generales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Técnico Responsable / A Cargo
            </label>
            <Input
              placeholder="Nombre del técnico"
              value={personaACargo}
              onChange={(e) => setPersonaACargo(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observaciones Adicionales / Garantía
            </label>
            <Input
              placeholder="Ej. Garantía 30 días, equipo probado con carga continua"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>

        {/* BOTONES PRINCIPALES DE ACCIÓN */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="w-full sm:w-auto text-xs"
          >
            Cancelar
          </Button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              isLoading={isSaving}
              onClick={onSave}
              className="flex-1 sm:flex-none text-xs border-slate-300 text-slate-700 dark:text-slate-300"
            >
              Solo Guardar Ficha
            </Button>

            <Button
              type="button"
              onClick={onProcederAFacturacion}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-5 shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>
                Proceder a Facturación ($
                {(totalAceptado > 0 ? totalAceptado : Number(precioChequeo)).toFixed(2)})
              </span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
