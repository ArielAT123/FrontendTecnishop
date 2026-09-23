import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Info, CheckCircle2, AlertTriangle, ShoppingCart, Save } from 'lucide-react';
import { Reporte, Proveedor } from '../../types';
import { NavSection } from '../layout/Sidebar';
import { CotizacionRepuestosSection } from './CotizacionRepuestosSection';
import { CotizacionTrabajosSection } from './CotizacionTrabajosSection';

export interface EditableRepuesto {
  id: string;
  nombre_repuesto: string;
  cantidad: number;
  precio_unitario: number;
  costo_unitario_proveedor: number;
  proveedor_id: string;
  crear_en_catalogo: boolean;
  codigo_catalogo: string;
}

export interface EditableTrabajo {
  id: string;
  descripcion: string;
  costo: number;
  costo_proveedor: number;
  proveedor_id: string;
}

export interface CotizacionEditorModalProps {
  selectedReporte: Reporte | null;
  onClose: () => void;
  feedback: { type: 'success' | 'error'; message: string } | null;
  editRepuestos: EditableRepuesto[];
  setEditRepuestos: React.Dispatch<React.SetStateAction<EditableRepuesto[]>>;
  editTrabajos: EditableTrabajo[];
  setEditTrabajos: React.Dispatch<React.SetStateAction<EditableTrabajo[]>>;
  proveedores: Proveedor[];
  handleOpenNuevoProveedor: (index: number, type: 'repuesto' | 'trabajo') => void;
  isSaving: boolean;
  onSave: () => void;
  onNavigate?: (section: NavSection) => void;
}

export const CotizacionEditorModal: React.FC<CotizacionEditorModalProps> = ({
  selectedReporte,
  onClose,
  feedback,
  editRepuestos,
  setEditRepuestos,
  editTrabajos,
  setEditTrabajos,
  proveedores,
  handleOpenNuevoProveedor,
  isSaving,
  onSave,
  onNavigate,
}) => {
  if (!selectedReporte) return null;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Completar y Validar Cotización"
      maxWidth="4xl"
    >
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
        {/* Header Context Info */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-850/60 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-medium text-slate-500">Orden: </span>
            <strong className="text-slate-900 dark:text-white font-mono">
              {selectedReporte.orden?.numero_orden || 'S/N'}
            </strong>
            <span className="mx-2 text-slate-300">•</span>
            <span className="font-medium text-slate-500">Equipo: </span>
            <strong className="text-slate-900 dark:text-white">
              {selectedReporte.orden?.equipo?.marca} {selectedReporte.orden?.equipo?.modelo}
            </strong>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <Info className="w-4 h-4 text-[#3498db]" />
            <span>Asigna proveedor y costo unitario a los repuestos para habilitar la factura.</span>
          </div>
        </div>

        {/* Notification / Feedback */}
        {feedback && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
        )}

        {/* SECTION 1: REPUESTOS */}
        <CotizacionRepuestosSection
          editRepuestos={editRepuestos}
          setEditRepuestos={setEditRepuestos}
          proveedores={proveedores}
          handleOpenNuevoProveedor={handleOpenNuevoProveedor}
        />

        {/* SECTION 2: TRABAJOS */}
        <CotizacionTrabajosSection
          editTrabajos={editTrabajos}
          setEditTrabajos={setEditTrabajos}
          proveedores={proveedores}
          handleOpenNuevoProveedor={handleOpenNuevoProveedor}
        />
      </div>

      {/* Footer Modal Actions */}
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
          Cerrar
        </Button>

        <div className="flex items-center gap-2">
          {feedback?.type === 'success' && onNavigate && (
            <Button
              onClick={() => {
                onClose();
                onNavigate('reportes');
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Proceder a Facturar en Informe</span>
            </Button>
          )}

          <Button
            onClick={onSave}
            disabled={isSaving}
            className="bg-[#3498db] hover:bg-[#2980b9] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Guardando...' : 'Guardar y Validar Cotización'}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
