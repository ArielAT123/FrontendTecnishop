import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Building, Palette, ShieldCheck, CheckCircle2, ChevronDown } from 'lucide-react';

export interface ConfigTallerSectionProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const ConfigTallerSection: React.FC<ConfigTallerSectionProps> = ({
  isOpen,
  onToggle,
}) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [tallerName, setTallerName] = useState(
    () => localStorage.getItem('taller_name') || 'Tecnishop Soluciones Tecnológicas'
  );
  const [tallerPhone, setTallerPhone] = useState(
    () => localStorage.getItem('taller_phone') || '0991234567'
  );
  const [tallerAddress, setTallerAddress] = useState(
    () => localStorage.getItem('taller_address') || 'Av. Principal #123, Guayaquil, Ecuador'
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveTaller = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('taller_name', tallerName);
    localStorage.setItem('taller_phone', tallerPhone);
    localStorage.setItem('taller_address', tallerAddress);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Datos del taller guardados exitosamente.</span>
        </div>
      )}

      {/* Datos del Taller */}
      <Card
        className={`p-6 transition-all duration-200 ${
          isOpen ? 'space-y-4' : 'hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        <div
          onClick={onToggle}
          className={`flex items-center justify-between gap-3 cursor-pointer select-none ${
            isOpen ? 'border-b border-slate-200 dark:border-slate-800 pb-4' : ''
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#3498db] dark:text-[#3498db] shadow-sm shrink-0">
              <Building className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Datos del Taller (Impresión en Comprobantes)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nombre comercial, teléfono y dirección del local impresos en los comprobantes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={onToggle}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isOpen ? 'Ocultar sección' : 'Expandir sección'}
            >
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {isOpen && (
          <form onSubmit={handleSaveTaller} className="space-y-4 pt-1 animate-fadeIn">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Nombre Comercial
              </label>
              <Input
                value={tallerName}
                onChange={(e) => setTallerName(e.target.value)}
                placeholder="Tecnishop"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Teléfono de Contacto
                </label>
                <Input
                  value={tallerPhone}
                  onChange={(e) => setTallerPhone(e.target.value)}
                  placeholder="0991234567"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Dirección / Sucursal
                </label>
                <Input
                  value={tallerAddress}
                  onChange={(e) => setTallerAddress(e.target.value)}
                  placeholder="Dirección del local"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit">Guardar Datos del Taller</Button>
            </div>
          </form>
        )}
      </Card>

      {/* Preferencias de Interfaz */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Apariencia y Tema
          </h3>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Modo Oscuro / Modo Claro
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Actualmente activo: <span className="font-bold uppercase">{theme}</span>
            </p>
          </div>
          <Button variant="secondary" onClick={toggleTheme}>
            Alternar a {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
          </Button>
        </div>
      </Card>

      {/* Sesión Actual */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Sesión y Seguridad
          </h3>
        </div>

        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
          <p>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Usuario Activo:</span>{' '}
            {user?.username} ({user?.email || 'Sin correo asociado'})
          </p>
          <p>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Rol:</span>{' '}
            {user?.is_superuser ? 'Super Administrador' : user?.is_staff ? 'Personal Técnico' : 'Operador'}
          </p>
          <p>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Renovación de Token:</span>{' '}
            Automática y transparente mediante interceptores de refresco JWT SimpleJWT.
          </p>
        </div>
      </Card>
    </div>
  );
};
