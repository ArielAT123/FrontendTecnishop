import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Moon,
  Sun,
  LogOut,
  User as UserIcon,
  Maximize2,
  Minimize2,
  ChevronDown,
  ShieldCheck,
  X,
} from 'lucide-react';
import { NavSection } from './Sidebar';

interface NavbarProps {
  currentSection: NavSection;
}

export const Navbar: React.FC<NavbarProps> = ({ currentSection }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isConfirmLogoutOpen, setIsConfirmLogoutOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const handleConfirmLogout = () => {
    setIsConfirmLogoutOpen(false);
    logout();
  };

  const sectionTitles: Record<NavSection, string> = {
    dashboard: 'Panel Principal',
    ventas: 'Punto de Venta / Facturación',
    ordenes: 'Gestión de Órdenes de Servicio',
    clientes: 'Directorio de Clientes',
    equipos: 'Dispositivos Técnicos',
    productos: 'Inventario y Repuestos',
    servicios: 'Catálogo de Servicios Técnicos',
    reportes: 'Informes Técnicos & Facturación',
    cotizaciones: 'Cotizaciones y Costos de Servicio',
    configuracion: 'Ajustes del Sistema',
  };

  return (
    <>
      <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {sectionTitles[currentSection]}
          </h2>
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

          {/* Interactive User Profile Dropdown Component */}
          <div className="relative pl-3 border-l border-slate-200 dark:border-slate-800" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              aria-expanded={isUserMenuOpen}
              className={`flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl transition-all duration-150 border cursor-pointer ${
                isUserMenuOpen
                  ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 shadow-sm'
                  : 'border-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700'
              }`}
              title="Opciones de usuario"
            >
              <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs border border-brand-200 dark:border-brand-800 shrink-0">
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
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ml-0.5 ${
                  isUserMenuOpen ? 'rotate-180 text-brand-600 dark:text-brand-400' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-fadeIn">
                {/* User Summary Header */}
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm border border-brand-200 dark:border-brand-800 shrink-0">
                      {user?.username ? user.username.charAt(0).toUpperCase() : <UserIcon className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {user?.username || 'Usuario'}
                      </p>
                      <p className="text-xs text-brand-600 dark:text-brand-400 font-medium flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {user?.is_superuser ? 'Administrador del Sistema' : 'Técnico Especialista'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dropdown Options */}
                <div className="p-1.5">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsConfirmLogoutOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modal de Confirmación de Cierre de Sesión (Doble Factor de Confirmación) */}
      {isConfirmLogoutOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
            {/* Overlay backdrop click to close */}
            <div
              className="fixed inset-0"
              onClick={() => setIsConfirmLogoutOpen(false)}
              aria-hidden="true"
            />

            <div className="relative z-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scaleIn">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      ¿Estás seguro de cerrar la sesión?
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                      Tu sesión de trabajo actual finalizará y deberás ingresar tus credenciales para volver a acceder al sistema.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsConfirmLogoutOpen(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsConfirmLogoutOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    No, cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmLogout}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors"
                  >
                    Sí, cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
