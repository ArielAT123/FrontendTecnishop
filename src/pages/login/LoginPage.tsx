import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Wrench, Lock, User as UserIcon, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  
  const savedUsername = localStorage.getItem('tecnishop_saved_username') || '';
  const initialRemember = localStorage.getItem('tecnishop_remember_user') === 'true';

  const [username, setUsername] = useState(savedUsername);
  const [password, setPassword] = useState('');
  const [rememberUser, setRememberUser] = useState(initialRemember);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    if (!cleanUser || !password.trim()) {
      setError('Por favor ingresa usuario y contraseña');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (rememberUser) {
        localStorage.setItem('tecnishop_saved_username', cleanUser);
        localStorage.setItem('tecnishop_remember_user', 'true');
      } else {
        localStorage.removeItem('tecnishop_saved_username');
        localStorage.removeItem('tecnishop_remember_user');
      }

      await login({ username: cleanUser, password });
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Credenciales inválidas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgetSavedUser = () => {
    localStorage.removeItem('tecnishop_saved_username');
    localStorage.removeItem('tecnishop_remember_user');
    setUsername('');
    setRememberUser(false);
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-[#1a252f] via-[#2c3e50] to-[#34495e] p-4 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#3498db]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#2980b9]/25 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white/10 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/80 rounded-2xl shadow-2xl p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center p-2.5 mx-auto shadow-xl shadow-black/25 mb-4 backdrop-blur-md">
            <img src="/tecnishopicon.png" alt="Tecnishop" className="w-full h-full object-contain drop-shadow-md" />
          </div>
          <h1 className="text-2xl font-black tracking-wider text-white">
            Tecni<span className="text-[#3498db]">shop</span>
          </h1>
          <p className="text-xs text-blue-200 mt-1 font-medium">
            Sistema de Gestión Integral de Taller Técnico
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-rose-300 text-xs font-medium animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {savedUsername && username === savedUsername && (
          <div className="mb-4 flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#3498db]/15 border border-[#3498db]/30 text-xs text-blue-200 animate-fadeIn">
            <span className="flex items-center gap-1.5 font-medium">
              <UserIcon className="w-3.5 h-3.5 text-[#3498db]" />
              Usuario guardado: <strong className="text-white">{savedUsername}</strong>
            </span>
            <button
              type="button"
              onClick={handleForgetSavedUser}
              className="text-[11px] text-slate-400 hover:text-rose-300 underline font-medium transition-colors"
            >
              Cambiar
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Usuario
            </label>
            <Input
              type="text"
              placeholder="Ingresa tu usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              leftIcon={<UserIcon className="w-4 h-4 text-slate-500" />}
              autoFocus={!savedUsername}
              className="bg-white !bg-white border-slate-300 text-black !text-black dark:text-black dark:!text-black dark:bg-white dark:!bg-white placeholder:text-slate-400 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Contraseña
            </label>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 text-slate-500" />}
              autoFocus={Boolean(savedUsername)}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-500 hover:text-slate-800 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              className="bg-white !bg-white border-slate-300 text-black !text-black dark:text-black dark:!text-black dark:bg-white dark:!bg-white placeholder:text-slate-400 font-medium"
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={rememberUser}
                onChange={(e) => setRememberUser(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900/60 text-[#3498db] focus:ring-[#3498db] focus:ring-offset-0 transition-colors cursor-pointer"
              />
              <span className="font-medium text-[11px] sm:text-xs">Recordar usuario en este equipo</span>
            </label>
          </div>

          <Button
            type="submit"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-2 font-semibold shadow-lg shadow-brand-600/30"
          >
            Iniciar Sesión
          </Button>
        </form>

        <div className="mt-8 text-center border-t border-slate-800/80 pt-4">
          <p className="text-[11px] text-slate-400">
            Tecnishop Desktop 2.0 &bull; Conexión Segura
          </p>
        </div>
      </div>
    </div>
  );
};
