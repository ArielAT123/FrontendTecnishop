import React from 'react';
import { Card } from '../ui/Card';
import { Reporte } from '../../types';
import { ReportesTableView } from './ReportesTableView';
import { ReportesEquiposView } from './ReportesEquiposView';
import { ClipboardList } from 'lucide-react';

export interface ReporteEquipoGroup {
  equipoKey: string;
  equipo: any;
  cliente: any;
  reportes: Reporte[];
  totalAceptadoAcumulado: number;
}

export interface ReportesTableProps {
  filteredReportes: Reporte[];
  reportesPorEquipo: ReporteEquipoGroup[];
  viewMode: 'tabla' | 'equipos';
  isLoading: boolean;
  getReporteEquipo: (r: Reporte) => any;
  getReporteCliente: (r: Reporte) => any;
  setViewingReporte: (r: Reporte) => void;
  handleEditReporte: (r: Reporte) => void;
  handleOpenFacturaPrint: (factura: any, repId: string) => void;
  handleFacturarDesdeVista: (rep: Reporte) => void;
  onNavigate?: (section: any) => void;
}

export const ReportesTable: React.FC<ReportesTableProps> = ({
  filteredReportes,
  reportesPorEquipo,
  viewMode,
  isLoading,
  getReporteEquipo,
  getReporteCliente,
  setViewingReporte,
  handleEditReporte,
  handleOpenFacturaPrint,
  handleFacturarDesdeVista,
  onNavigate,
}) => {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-[#3498db]" />
          <span>
            {viewMode === 'tabla'
              ? `Fichas Técnicas Emitidas (${filteredReportes.length})`
              : `Equipos con Historial Técnico (${reportesPorEquipo.length} ${
                  reportesPorEquipo.length === 1 ? 'Equipo' : 'Equipos'
                } • ${filteredReportes.length} ${
                  filteredReportes.length === 1 ? 'Ficha' : 'Fichas'
                })`}
          </span>
        </h3>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-400">
          Cargando fichas técnicas...
        </div>
      ) : filteredReportes.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400">
          No se encontraron fichas técnicas registradas.
        </div>
      ) : viewMode === 'tabla' ? (
        <ReportesTableView
          filteredReportes={filteredReportes}
          getReporteEquipo={getReporteEquipo}
          getReporteCliente={getReporteCliente}
          setViewingReporte={setViewingReporte}
          handleEditReporte={handleEditReporte}
          handleOpenFacturaPrint={handleOpenFacturaPrint}
          handleFacturarDesdeVista={handleFacturarDesdeVista}
          onNavigate={onNavigate}
        />
      ) : (
        <ReportesEquiposView
          reportesPorEquipo={reportesPorEquipo}
          setViewingReporte={setViewingReporte}
          handleEditReporte={handleEditReporte}
          handleOpenFacturaPrint={handleOpenFacturaPrint}
          handleFacturarDesdeVista={handleFacturarDesdeVista}
          onNavigate={onNavigate}
        />
      )}
    </Card>
  );
};
