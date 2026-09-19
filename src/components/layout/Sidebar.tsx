import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Users,
  Laptop,
  Package,
  Wrench,
  FileText,
  Settings,
  ChevronDown,
} from 'lucide-react';

export type NavSection =
  | 'dashboard'
  | 'ventas'
  | 'ordenes'
  | 'clientes'
  | 'equipos'
  | 'productos'
  | 'servicios'
  | 'reportes'
  | 'configuracion';

interface SidebarProps {
  currentSection: NavSection;
  onNavigate: (section: NavSection) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentSection, onNavigate }) => {
  const isTallerActive = currentSection === 'clientes' || currentSection === 'equipos';
  const isServicioTecnicoActive = currentSection === 'ordenes' || currentSection === 'reportes';
  const isCatalogoActive = currentSection === 'productos' || currentSection === 'servicios';

  const [tallerOpen, setTallerOpen] = useState(true);
  const [servicioTecnicoOpen, setServicioTecnicoOpen] = useState(true);
  const [catalogoOpen, setCatalogoOpen] = useState(true);

  // Auto-expand group if current section is inside that group
  useEffect(() => {
    if (isTallerActive) setTallerOpen(true);
    if (isServicioTecnicoActive) setServicioTecnicoOpen(true);
    if (isCatalogoActive) setCatalogoOpen(true);
  }, [isTallerActive, isServicioTecnicoActive, isCatalogoActive]);

  return (
    <aside className="w-64 bg-gradient-to-b from-[#243342] via-[#2c3e50] to-[#34495e] text-white border-r border-[#1a252f] flex flex-col shrink-0 h-screen select-none shadow-2xl z-20">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center p-1.5 shadow-md shrink-0">
          <img src="/tecnishopicon.png" alt="Tecnishop" className="w-full h-full object-contain drop-shadow" />
        </div>
        <div className="overflow-hidden">
          <h1 className="font-black text-lg tracking-wider text-white leading-tight">
            Tecni<span className="text-[#3498db]">shop</span>
          </h1>
          <p className="text-[10px] font-semibold tracking-wider text-slate-300 uppercase truncate">
            Taller Especializado
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-3 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        {/* Direct Links */}
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group ${
            currentSection === 'dashboard'
              ? 'bg-[#3498db] text-white shadow-lg shadow-[#3498db]/35 font-semibold'
              : 'text-slate-200 hover:bg-white/10 hover:text-white'
          }`}
        >
          <LayoutDashboard
            className={`w-5 h-5 transition-colors ${
              currentSection === 'dashboard' ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
            }`}
          />
          <span>Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('ventas')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group ${
            currentSection === 'ventas'
              ? 'bg-[#3498db] text-white shadow-lg shadow-[#3498db]/35 font-semibold'
              : 'text-slate-200 hover:bg-white/10 hover:text-white'
          }`}
        >
          <ShoppingCart
            className={`w-5 h-5 transition-colors ${
              currentSection === 'ventas' ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
            }`}
          />
          <span>Punto de Venta (POS)</span>
        </button>

        {/* ======================================================== */}
        {/* COLLAPSIBLE GROUP 1: Gestión de Taller                   */}
        {/* ======================================================== */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setTallerOpen(!tallerOpen)}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
              isTallerActive
                ? 'text-white bg-white/10 font-semibold'
                : 'text-slate-200 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users
                className={`w-5 h-5 transition-colors ${
                  isTallerActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              <span>Gestión de Clientes</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 ${
                tallerOpen ? 'rotate-180 text-blue-300' : ''
              }`}
            />
          </button>

          {tallerOpen && (
            <div className="ml-5 pl-3 border-l-2 border-slate-700/60 space-y-1 py-1.5">
              <button
                type="button"
                onClick={() => onNavigate('clientes')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group ${
                  currentSection === 'clientes'
                    ? 'bg-[#3498db] text-white font-semibold shadow-md shadow-[#3498db]/30'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Users
                  className={`w-4 h-4 transition-colors ${
                    currentSection === 'clientes' ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span>Directorio de Clientes</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('equipos')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group ${
                  currentSection === 'equipos'
                    ? 'bg-[#3498db] text-white font-semibold shadow-md shadow-[#3498db]/30'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Laptop
                  className={`w-4 h-4 transition-colors ${
                    currentSection === 'equipos' ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span>Equipos y Dispositivos</span>
              </button>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* COLLAPSIBLE GROUP 2: Servicio Técnico                    */}
        {/* ======================================================== */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setServicioTecnicoOpen(!servicioTecnicoOpen)}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
              isServicioTecnicoActive
                ? 'text-white bg-white/10 font-semibold'
                : 'text-slate-200 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <ClipboardList
                className={`w-5 h-5 transition-colors ${
                  isServicioTecnicoActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              <span>Servicio Técnico</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 ${
                servicioTecnicoOpen ? 'rotate-180 text-blue-300' : ''
              }`}
            />
          </button>

          {servicioTecnicoOpen && (
            <div className="ml-5 pl-3 border-l-2 border-slate-700/60 space-y-1 py-1.5">
              <button
                type="button"
                onClick={() => onNavigate('ordenes')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group ${
                  currentSection === 'ordenes'
                    ? 'bg-[#3498db] text-white font-semibold shadow-md shadow-[#3498db]/30'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <ClipboardList
                  className={`w-4 h-4 transition-colors ${
                    currentSection === 'ordenes' ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span>Órdenes de Trabajo</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('reportes')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group ${
                  currentSection === 'reportes'
                    ? 'bg-[#3498db] text-white font-semibold shadow-md shadow-[#3498db]/30'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <FileText
                  className={`w-4 h-4 transition-colors ${
                    currentSection === 'reportes' ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span>Informes Técnicos</span>
              </button>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* COLLAPSIBLE GROUP 3: Catálogo y Tarifas                  */}
        {/* ======================================================== */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setCatalogoOpen(!catalogoOpen)}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
              isCatalogoActive
                ? 'text-white bg-white/10 font-semibold'
                : 'text-slate-200 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Package
                className={`w-5 h-5 transition-colors ${
                  isCatalogoActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              <span>Catálogo & Tarifas</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 ${
                catalogoOpen ? 'rotate-180 text-blue-300' : ''
              }`}
            />
          </button>

          {catalogoOpen && (
            <div className="ml-5 pl-3 border-l-2 border-slate-700/60 space-y-1 py-1.5">
              <button
                type="button"
                onClick={() => onNavigate('productos')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group ${
                  currentSection === 'productos'
                    ? 'bg-[#3498db] text-white font-semibold shadow-md shadow-[#3498db]/30'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Package
                  className={`w-4 h-4 transition-colors ${
                    currentSection === 'productos' ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span>Productos y Repuestos</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('servicios')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group ${
                  currentSection === 'servicios'
                    ? 'bg-[#3498db] text-white font-semibold shadow-md shadow-[#3498db]/30'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Wrench
                  className={`w-4 h-4 transition-colors ${
                    currentSection === 'servicios' ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span>Servicios Técnicos</span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom Direct Links */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => onNavigate('configuracion')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group ${
              currentSection === 'configuracion'
                ? 'bg-[#3498db] text-white shadow-lg shadow-[#3498db]/35 font-semibold'
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Settings
              className={`w-5 h-5 transition-colors ${
                currentSection === 'configuracion' ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
              }`}
            />
            <span>Configuración</span>
          </button>
        </div>
      </div>

      {/* App Version Info */}
      <div className="p-4 border-t border-white/10 bg-black/15">
        <div className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
          <p className="text-[11px] font-medium text-slate-300">Tecnishop Desktop v2.0</p>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Sistema Activo
          </p>
        </div>
      </div>
    </aside>
  );
};
