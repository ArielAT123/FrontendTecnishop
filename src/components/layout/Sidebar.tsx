import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Users,
  Laptop,
  Package,
  FileText,
  Settings,
  Wrench,
} from 'lucide-react';

export type NavSection = 'dashboard' | 'ventas' | 'ordenes' | 'clientes' | 'equipos' | 'productos' | 'reportes' | 'configuracion';

interface SidebarProps {
  currentSection: NavSection;
  onNavigate: (section: NavSection) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentSection, onNavigate }) => {
  const menuItems: Array<{ id: NavSection; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'ventas', label: 'Punto de Venta (POS)', icon: <ShoppingCart className="w-5 h-5" /> },
    { id: 'ordenes', label: 'Órdenes de Servicio', icon: <ClipboardList className="w-5 h-5" /> },
    { id: 'clientes', label: 'Clientes', icon: <Users className="w-5 h-5" /> },
    { id: 'equipos', label: 'Equipos', icon: <Laptop className="w-5 h-5" /> },
    { id: 'productos', label: 'Inventario / Repuestos', icon: <Package className="w-5 h-5" /> },
    { id: 'reportes', label: 'Informes Técnicos', icon: <FileText className="w-5 h-5" /> },
    { id: 'configuracion', label: 'Configuración', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-gradient-to-b from-[#2c3e50] via-[#2f4356] to-[#34495e] text-white border-r border-[#1a252f] flex flex-col shrink-0 h-screen select-none shadow-xl z-20">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10 bg-black/15">
        <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center p-1.5 shadow-md shrink-0">
          <img src="/tecnishopicon.png" alt="Tecnishop" className="w-full h-full object-contain drop-shadow" />
        </div>
        <div className="overflow-hidden">
          <h1 className="font-black text-lg tracking-wider text-white leading-tight">
            Tecni<span className="text-[#3498db]">shop</span>
          </h1>
          <p className="text-[10px] font-semibold tracking-wider text-blue-200 uppercase truncate">Taller Especializado</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-[#3498db] text-white shadow-lg shadow-[#3498db]/35 font-semibold'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`${isActive ? 'text-white' : 'text-blue-200/80'}`}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                  isActive ? 'bg-white text-[#2980b9]' : 'bg-emerald-500/90 text-white'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* App Version Info */}
      <div className="p-4 border-t border-white/10 bg-black/15">
        <div className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
          <p className="text-[11px] font-medium text-slate-300">Tecnishop Desktop v2.0</p>
          <p className="text-[10px] text-emerald-300 font-semibold mt-0.5 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Sistema Activo
          </p>
        </div>
      </div>
    </aside>
  );
};
