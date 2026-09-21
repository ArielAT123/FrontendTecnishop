import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, KeyRound, X } from 'lucide-react';
import { api } from '../../api/client';
import { Button } from '../ui/Button';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetSectionName?: string;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetSectionName = 'Catálogo & Tarifas',
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password.trim()) {
      setError('Por favor ingresa la contraseña de administrador.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.verifyAdminPassword(password);
      if (res.valid) {
        // Guardar desbloqueo en la sesión actual
        sessionStorage.setItem('catalogo_admin_unlocked', 'true');
        setPassword('');
        setError(null);
        onSuccess();
      } else {
        setError('Contraseña incorrecta. Acceso restringido.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Contraseña de administrador incorrecta.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
        {/* Header con acento de seguridad */}
        <div className="relative p-6 pb-4 bg-gradient-to-b from-blue-50/50 dark:from-blue-950/20 to-transparent border-b border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#3498db]/15 border border-[#3498db]/30 flex items-center justify-center text-[#3498db] shadow-inner">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Acceso Restringido</span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-[#3498db]/10 text-[#3498db] border border-[#3498db]/20">
                  Admin
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {targetSectionName}
              </p>
            </div>
          </div>
        </div>

        {/* Contenido del Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Para acceder al catálogo y modificar precios o tarifas de productos y servicios, debes autenticarte con la <strong>clave de administrador</strong>:
          </p>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2.5 text-rose-600 dark:text-rose-400 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#3498db]" />
              <span>Contraseña de Administrador</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa la clave maestra o de administrador..."
                className="w-full px-3.5 py-2.5 pr-11 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3498db]/40 focus:border-[#3498db] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <Button
              type="submit"
              size="sm"
              isLoading={isLoading}
              className="bg-[#3498db] hover:bg-[#2980b9] text-white font-bold flex items-center gap-2 px-5 py-2 rounded-xl shadow-lg shadow-[#3498db]/25"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Desbloquear Catálogo</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
