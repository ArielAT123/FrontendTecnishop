import React, { useState, useEffect } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Moon, Sun, LogOut, User as UserIcon, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import { NavSection } from './Sidebar';

interface NavbarProps {
  currentSection: NavSection;
}

export const Navbar: React.FC<NavbarProps> = ({ currentSection }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isFetching = useIsFetching();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  const handleToggleFullscreen = async () => {
    if ((window as any).electronAPI?.toggleFullScreen) {
      const isFS = await (window as any).electronAPI.toggleFullScreen();
      setIsFullscreen(isFS);
    } else {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen().catch(() => {});
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const sectionTitles: Record<NavSection, string> = {
    dashboard: 'Panel Principal',
    ventas: 'Punto de Venta / Facturación',
    ordenes: 'Gestión de Órdenes de Servicio',
    clientes: 'Directorio de Clientes',
    equipos: 'Dispositivos Técnicos',
    productos: 'Inventario y Repuestos',
    reportes: 'Informes Técnicos & Facturación',
    configuracion: 'Ajustes del Sistema',
  };

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 transition-colors duration-200">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {sectionTitles[currentSection]}
        </h2>

        {/* Background Sync Badge */}
        {isFetching > 0 ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#3498db] text-[11px] font-semibold animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin text-[#3498db]" />
            <span className="hidden sm:inline">Actualizando en segundo plano...</span>
            <span className="sm:hidden">Sincronizando...</span>
          </div>
        ) : (
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Caché Activa &bull; En línea</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Fullscreen Toggle Button */}
        <button
          onClick={handleToggleFullscreen}
          title={isFullscreen ? 'Salir de Pantalla Completa' : 'Ajustar a Pantalla Completa'}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title="Cambiar Modo de Color"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs border border-brand-200 dark:border-brand-800">
            {user?.username ? user.username.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
              {user?.username || 'Usuario'}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              {user?.is_superuser ? 'Administrador' : 'Técnico'}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="Cerrar Sesión"
          className="p-2 ml-1 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
