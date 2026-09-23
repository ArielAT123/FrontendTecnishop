import React from 'react';
import {
  Search,
  Lock,
  Upload,
  Truck,
  PlusCircle,
  Wrench,
  AlertCircle,
  Settings,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export interface ProductosHeaderProps {
  isService: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onLockCatalog: () => void;
  fileInputRef: React.RefObject<any>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingExcel: boolean;
  proveedoresCount: number;
  onOpenProveedoresModal: () => void;
  onOpenCreateModal: () => void;
  globalScannerMode: string;
  isServerOnline: boolean;
  onNavigate?: (section: any) => void;
  uploadStatus: { type: 'success' | 'error'; message: string } | null;
  onDismissUploadStatus: () => void;
}

export const ProductosHeader: React.FC<ProductosHeaderProps> = ({
  isService,
  searchTerm,
  setSearchTerm,
  onLockCatalog,
  fileInputRef,
  onFileChange,
  isUploadingExcel,
  proveedoresCount,
  onOpenProveedoresModal,
  onOpenCreateModal,
  globalScannerMode,
  isServerOnline,
  onNavigate,
  uploadStatus,
  onDismissUploadStatus,
}) => {
  return (
    <div className="space-y-4">
      {/* Header with Search and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <Input
            placeholder={`Buscar ${isService ? 'servicio por nombre o código' : 'producto por código o nombre'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onLockCatalog}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
            title="Cerrar sesión de administrador y bloquear catálogo"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span>Bloquear Catálogo</span>
          </button>

          {!isService && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={onFileChange}
                accept=".xlsx, .xls"
                className="hidden"
              />
              <Button
                variant="outline"
                leftIcon={<Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                onClick={() => fileInputRef.current?.click()}
                isLoading={isUploadingExcel}
                className="border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
              >
                Importar Excel
              </Button>
            </>
          )}

          <Button
            variant="outline"
            leftIcon={<Truck className="w-4 h-4 text-[#3498db]" />}
            onClick={onOpenProveedoresModal}
            className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
          >
            Proveedores ({proveedoresCount})
          </Button>

          <Button
            leftIcon={isService ? <Wrench className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
            onClick={onOpenCreateModal}
            className="shadow-sm"
          >
            {isService ? 'Nuevo Servicio' : 'Nuevo Producto'}
          </Button>
        </div>
      </div>

      {/* Scanner Offline Alert Banner */}
      {!isService && globalScannerMode === 'web' && !isServerOnline && (
        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-fadeIn">
          <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="font-bold">Sin conexión con el escáner web</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                El escáner de códigos de barra está configurado en modo WiFi/Web pero el servicio no responde.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigate?.('configuracion')}
            className="text-xs font-bold border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 shrink-0 flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configurar Escáner</span>
          </Button>
        </div>
      )}

      {/* Upload Notification Banner */}
      {uploadStatus && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium animate-fadeIn ${
            uploadStatus.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {uploadStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{uploadStatus.message}</span>
          </div>
          <button
            onClick={onDismissUploadStatus}
            className="text-xs font-bold underline hover:opacity-80"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
};
