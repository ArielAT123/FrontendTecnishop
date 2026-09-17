import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  Settings,
  Server,
  Palette,
  ShieldCheck,
  Building,
  CheckCircle2,
} from 'lucide-react';

export const ConfiguracionPage: React.FC = () => {
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
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Configuración del Sistema</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Personaliza los datos del taller, aspecto visual y conexiones del servidor
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>Configuración guardada exitosamente.</span>
        </div>
      )}

      {/* Datos del Taller */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Datos del Taller (Impresión en Comprobantes)
          </h3>
        </div>

        <form onSubmit={handleSaveTaller} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
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
