import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { WhatsAppIcon } from '../common/WhatsAppIcon';
import { WhatsAppOptionsDropdown } from './WhatsAppOptionsDropdown';
import { Reporte } from '../../types';
import {
  Printer,
  Receipt,
  AlertTriangle,
  Calculator,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  FileText,
  ClipboardList,
  ChevronDown,
} from 'lucide-react';

export interface VerFichaTecnicaModalProps {
  isOpen: boolean;
  onClose: () => void;
  reporte: Reporte | null;
  getReporteCliente: (r: Reporte) => any;
  getReporteEquipo: (r: Reporte) => any;
  onNavigate?: (section: any) => void;
  handleOpenFacturaPrint: (factura: any, reporteId: string) => void;
  handleFacturarDesdeVista: (reporte: Reporte) => void;
  handleSendCotizacionWhatsApp: (reporte: Reporte) => Promise<void>;
  handleSendInformeWhatsApp: (reporte: Reporte) => Promise<void>;
  sendingCotizacionWhatsApp: boolean;
  sendingInformeWhatsApp: boolean;
  informeWhatsAppFeedback: { type: 'success' | 'error'; message: string } | null;
  isWhatsAppDropdownOpen: boolean;
  setIsWhatsAppDropdownOpen: any;
  whatsAppDropdownRef: any;
}

export const VerFichaTecnicaModal: React.FC<VerFichaTecnicaModalProps> = ({
  isOpen,
  onClose,
  reporte,
  getReporteCliente,
  getReporteEquipo,
  onNavigate,
  handleOpenFacturaPrint,
  handleFacturarDesdeVista,
  handleSendCotizacionWhatsApp,
  handleSendInformeWhatsApp,
  sendingCotizacionWhatsApp,
  sendingInformeWhatsApp,
  informeWhatsAppFeedback,
  isWhatsAppDropdownOpen,
  setIsWhatsAppDropdownOpen,
  whatsAppDropdownRef,
}) => {
  if (!reporte) return null;

  const cliente = getReporteCliente(reporte);
  const equipo = getReporteEquipo(reporte);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ficha Técnica & Comprobante de Taller"
      maxWidth="3xl"
    >
      <div className="space-y-6">
        <div id="ficha-tecnica-imprimible" className="p-6 bg-white text-slate-900 rounded-xl border border-slate-200 space-y-5">
          {/* Header Comprobante */}
          <div className="flex justify-between items-start border-b pb-4">
            <div>
              <h3 className="font-black text-lg text-slate-900 tracking-wide">
                TECNISHOP - FICHA TÉCNICA
              </h3>
              <p className="text-xs text-slate-500">Taller Especializado en Reparación & Soporte</p>
            </div>
            <div className="text-right">
              <p className="font-mono font-bold text-base text-[#3498db]">
                Orden: #{reporte.orden?.numero_orden || (reporte.orden_id ? String(reporte.orden_id).slice(0, 8) : 'S/N')}
              </p>
              <p className="text-xs text-slate-400">
                Fecha: {new Date(reporte.fecha_creacion).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Banner de Factura Emitida si ya existe */}
          {(reporte.esta_facturado || reporte.factura) && (
            <div className="p-3.5 bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    Factura Emitida: {reporte.factura?.numero_factura || 'Comprobante Registrado'}
                    <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 font-bold rounded">PAGADA</span>
                  </p>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300">
                    Total facturado: ${Number(reporte.factura?.total || reporte.total_aceptado || 0).toFixed(2)} &bull; Registrado en ventas
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  const f = reporte.factura;
                  const repId = reporte.id;
                  onClose();
                  handleOpenFacturaPrint(f, repId);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 px-3 flex items-center gap-1 font-semibold"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Factura
              </Button>
            </div>
          )}

          {/* Alerta de Cotización Incompleta (Admin) */}
          {!reporte.esta_facturado && !reporte.factura && Number(reporte.total_aceptado || 0) > 0 && !reporte.cotizacion_completada && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 shadow-sm">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <p className="font-bold text-amber-950 dark:text-amber-200">
                    Admin debe llenar campos faltantes en cotización
                  </p>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    Debes asignar proveedor y costo de adquisición a los repuestos cotizados antes de poder facturar este informe.
                  </p>
                </div>
              </div>
              {onNavigate && (
                <Button
                  size="sm"
                  onClick={() => {
                    onClose();
                    onNavigate('cotizaciones');
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-sm"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Ir a Cotizaciones</span>
                </Button>
              )}
            </div>
          )}

          {/* Datos de Cliente y Equipo */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg">
            <div>
              <p className="font-bold text-slate-700 mb-1">DATOS DEL CLIENTE:</p>
              <p><span className="font-semibold">Nombre:</span> {cliente?.nombre} {cliente?.apellido || ''}</p>
              <p><span className="font-semibold">Cédula/RUC:</span> {cliente?.ci || 'N/A'}</p>
              <p><span className="font-semibold">Teléfono:</span> {cliente?.telefono || 'N/A'}</p>
            </div>
            <div>
              <p className="font-bold text-slate-700 mb-1">DATOS DEL DISPOSITIVO:</p>
              <p><span className="font-semibold">Dispositivo:</span> {equipo?.nombre}</p>
              <p><span className="font-semibold">Marca / Modelo:</span> {equipo?.marca} {equipo?.modelo}</p>
              <p><span className="font-semibold">Nº Serie:</span> {equipo?.numero_serie || 'N/A'}</p>
            </div>
          </div>

          {/* Diagnóstico Técnico Real */}
          <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 text-xs space-y-1">
            <p className="font-bold text-blue-900 uppercase">Diagnóstico Técnico Detectado:</p>
            <p className="text-slate-800 whitespace-pre-line">
              {reporte.diagnostico_problemas || 'Revisión general efectuada sin anomalías críticas adicionales.'}
            </p>
          </div>

          {/* Detalle de Cotización */}
          <div className="space-y-3">
            <p className="font-bold text-xs uppercase text-slate-700">Detalle de Cotización & Servicios:</p>
            <table className="w-full text-xs text-left border border-slate-200">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b">
                <tr>
                  <th className="p-2">Concepto / Descripción</th>
                  <th className="p-2">Tipo</th>
                  <th className="p-2">Estado</th>
                  <th className="p-2 text-right">Precio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(reporte.trabajos_realizados || []).map((t, idx) => (
                  <tr key={'t-' + idx}>
                    <td className="p-2 font-medium">{t.descripcion}</td>
                    <td className="p-2 text-slate-500">Mano de Obra</td>
                    <td className="p-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        t.estado === 'COTIZADO' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {t.estado === 'COTIZADO' ? 'Aceptado' : 'Rechazado'}
                      </span>
                    </td>
                    <td className="p-2 text-right font-mono font-bold">${Number(t.costo).toFixed(2)}</td>
                  </tr>
                ))}
                {(reporte.repuestos_utilizados || []).map((r, idx) => (
                  <tr key={'r-' + idx}>
                    <td className="p-2 font-medium">{r.nombre_repuesto} (x{r.cantidad})</td>
                    <td className="p-2 text-slate-500">Repuesto</td>
                    <td className="p-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        r.estado === 'COTIZADO' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {r.estado === 'COTIZADO' ? 'Aceptado' : 'Rechazado'}
                      </span>
                    </td>
                    <td className="p-2 text-right font-mono font-bold">
                      ${(Number(r.cantidad || 1) * Number(r.precio_unitario || 0)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Chequeo de Respaldo */}
          <div className="p-2.5 rounded-lg bg-slate-100 text-xs flex justify-between items-center">
            <span>
              <strong>Servicio de Chequeo Técnico:</strong>{' '}
              {Number(reporte.total_aceptado || 0) > 0 ? 'BONIFICADO (Cliente aprobó cotización)' : 'Aplicable por rechazo'}
            </span>
            <span className="font-mono font-bold">
              {Number(reporte.total_aceptado || 0) > 0 ? '$0.00' : `$${Number(reporte.precio_chequeo || 10).toFixed(2)}`}
            </span>
          </div>

          {/* Totales */}
          <div className="text-right space-y-1 text-xs border-t pt-3">
            <p>
              Total Aprobado por Cliente:{' '}
              <span className="font-bold font-mono text-emerald-600 text-sm">
                ${Number(reporte.total_aceptado || 0).toFixed(2)}
              </span>
            </p>
            {Number(reporte.total_rechazado || 0) > 0 && (
              <p className="text-rose-500">
                Total Rechazado: <span className="font-mono">${Number(reporte.total_rechazado).toFixed(2)}</span>
              </p>
            )}
          </div>

          {/* Firmas */}
          <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
            <div>
              <div className="border-t border-slate-300 pt-1">
                <p className="font-bold">{reporte.persona_a_cargo || 'Técnico Responsable'}</p>
                <p className="text-slate-400">Técnico Especialista</p>
              </div>
            </div>
            <div>
              <div className="border-t border-slate-300 pt-1">
                <p className="font-bold">{cliente?.nombre || 'Cliente'}</p>
                <p className="text-slate-400">Conformidad de Servicio</p>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp Feedback Banner */}
        {informeWhatsAppFeedback && (
          <div
            className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
              informeWhatsAppFeedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                : 'bg-rose-50 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
            }`}
          >
            {informeWhatsAppFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{informeWhatsAppFeedback.message}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={() => {
              onClose();
              setIsWhatsAppDropdownOpen(false);
            }}
            className="text-xs"
          >
            Cerrar
          </Button>

          <div className="flex items-center gap-2">
            {/* Botón Viñeta Desplegable WhatsApp */}
            <WhatsAppOptionsDropdown
              reporte={reporte}
              isOpen={isWhatsAppDropdownOpen}
              onToggle={() => setIsWhatsAppDropdownOpen((prev: boolean) => !prev)}
              onClose={() => setIsWhatsAppDropdownOpen(false)}
              dropdownRef={whatsAppDropdownRef}
              isSendingCotizacion={sendingCotizacionWhatsApp}
              isSendingInforme={sendingInformeWhatsApp}
              onSendCotizacion={handleSendCotizacionWhatsApp}
              onSendInforme={handleSendInformeWhatsApp}
            />

            <Button
              variant="outline"
              onClick={() => {
                const el = document.getElementById('ficha-tecnica-imprimible');
                if (el) {
                  window.print();
                }
              }}
              className="text-xs flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Ficha</span>
            </Button>

            {reporte.esta_facturado || reporte.factura ? (
              <Button
                onClick={() => {
                  const f = reporte.factura;
                  const repId = reporte.id;
                  onClose();
                  handleOpenFacturaPrint(f, repId);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20"
              >
                <Printer className="w-4 h-4" />
                <span>
                  Imprimir Factura ({reporte.factura?.numero_factura || 'Emitida'})
                </span>
              </Button>
            ) : Number(reporte.total_aceptado || 0) > 0 && !reporte.cotizacion_completada ? (
              <Button
                onClick={() => {
                  if (onNavigate) {
                    onClose();
                    onNavigate('cotizaciones');
                  }
                }}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                title="Admin debe llenar campos faltantes en cotización"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Admin debe llenar campos faltantes en cotización</span>
              </Button>
            ) : (
              <Button
                onClick={() => handleFacturarDesdeVista(reporte)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Proceder a Facturación</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
