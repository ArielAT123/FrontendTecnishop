import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  Mail,
  Send,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';

export interface ConfigEmailSectionProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const ConfigEmailSection: React.FC<ConfigEmailSectionProps> = ({
  isOpen,
  onToggle,
}) => {
  const [emailConfig, setEmailConfig] = useState({
    enabled: false,
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    from: 'Tecnishop <no-reply@tecnishop.com>',
    hasPassword: false,
  });
  const [isLoadingEmailConfig, setIsLoadingEmailConfig] = useState(false);
  const [isSavingEmailConfig, setIsSavingEmailConfig] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [emailFeedback, setEmailFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const MESSAGE_SERVER_URL =
    (import.meta as any).env?.VITE_MESSAGE_SERVER_URL || (
      typeof window !== 'undefined' && window.location.port === '5173'
        ? 'http://localhost:5052'
        : '/message-api'
    );

  const fetchEmailConfig = async () => {
    setIsLoadingEmailConfig(true);
    try {
      const res = await fetch(`${MESSAGE_SERVER_URL}/api/v1/config/email`);
      if (res.ok) {
        const data = await res.json();
        setEmailConfig({
          enabled: Boolean(data.enabled),
          host: data.host || 'smtp.gmail.com',
          port: data.port || 587,
          secure: Boolean(data.secure),
          user: data.user || '',
          pass: '',
          from: data.from || 'Tecnishop <no-reply@tecnishop.com>',
          hasPassword: Boolean(data.hasPassword),
        });
      }
    } catch {
      // Ignored
    } finally {
      setIsLoadingEmailConfig(false);
    }
  };

  useEffect(() => {
    fetchEmailConfig();
  }, []);

  const handleSaveEmailConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEmailConfig(true);
    setEmailFeedback(null);
    try {
      const res = await fetch(`${MESSAGE_SERVER_URL}/api/v1/config/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailConfig),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailFeedback({ type: 'success', message: 'Configuración de correo guardada exitosamente.' });
        if (emailConfig.pass) {
          setEmailConfig((prev) => ({ ...prev, pass: '', hasPassword: true }));
        }
      } else {
        setEmailFeedback({ type: 'error', message: data.error || 'Error al guardar la configuración.' });
      }
    } catch (err: any) {
      setEmailFeedback({ type: 'error', message: `No se pudo conectar con el servidor: ${err.message}` });
    } finally {
      setIsSavingEmailConfig(false);
      setTimeout(() => setEmailFeedback(null), 6000);
    }
  };

  const handleTestEmailConnection = async () => {
    setIsTestingEmail(true);
    setEmailFeedback(null);
    try {
      const res = await fetch(`${MESSAGE_SERVER_URL}/api/v1/config/email/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...emailConfig,
          testRecipient: testEmailRecipient.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailFeedback({ type: 'success', message: data.message || 'Conexión SMTP exitosa.' });
      } else {
        setEmailFeedback({ type: 'error', message: data.error || 'Falló la prueba SMTP.' });
      }
    } catch (err: any) {
      setEmailFeedback({ type: 'error', message: `Error de conexión: ${err.message}` });
    } finally {
      setIsTestingEmail(false);
    }
  };

  return (
    <Card
      className={`p-6 border-2 border-sky-500/30 dark:border-sky-500/30 shadow-md transition-all duration-200 ${
        isOpen ? 'space-y-5' : 'hover:border-sky-500/50'
      }`}
    >
      <div
        onClick={onToggle}
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none ${
          isOpen ? 'border-b border-slate-200 dark:border-slate-800 pb-4' : ''
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-sky-500 text-white shadow-md shadow-sky-500/30 shrink-0">
            <Mail className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Correo Electrónico (SMTP)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Envío de facturas, órdenes de servicio e informes técnicos a las casillas de clientes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              emailConfig.enabled
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                emailConfig.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            {emailConfig.enabled ? 'Canal Activo' : 'Canal Desactivado'}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchEmailConfig}
            disabled={isLoadingEmailConfig}
            title="Recargar configuración de correo"
            className="p-2 h-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEmailConfig ? 'animate-spin' : ''}`} />
          </Button>

          <button
            type="button"
            onClick={onToggle}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
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
        <div className="space-y-4 pt-1 animate-fadeIn">
          {/* Feedback Alert */}
          {emailFeedback && (
            <div
              className={`p-4 rounded-xl flex items-center gap-2 text-xs font-semibold animate-fadeIn ${
                emailFeedback.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400'
              }`}
            >
              {emailFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{emailFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handleSaveEmailConfig} className="space-y-4">
            {/* Toggle Enable Channel */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div>
                <label htmlFor="email-channel-enabled" className="text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                  Habilitar canal de correo electrónico
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Al activar esta opción, los clientes que tengan email registrado podrán recibir sus comprobantes por correo.
                </p>
              </div>
              <input
                id="email-channel-enabled"
                type="checkbox"
                checked={emailConfig.enabled}
                onChange={(e) => setEmailConfig({ ...emailConfig, enabled: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Host */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Servidor SMTP (Host)
                </label>
                <Input
                  value={emailConfig.host}
                  onChange={(e) => setEmailConfig({ ...emailConfig, host: e.target.value })}
                  placeholder="smtp.gmail.com"
                  required={emailConfig.enabled}
                />
              </div>

              {/* Port */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Puerto
                </label>
                <Input
                  type="number"
                  value={emailConfig.port}
                  onChange={(e) => setEmailConfig({ ...emailConfig, port: parseInt(e.target.value, 10) || 587 })}
                  placeholder="587"
                  required={emailConfig.enabled}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* User / Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Usuario / Correo Electrónico
                </label>
                <Input
                  type="email"
                  value={emailConfig.user}
                  onChange={(e) => setEmailConfig({ ...emailConfig, user: e.target.value })}
                  placeholder="notificaciones@tecnishop.com"
                  required={emailConfig.enabled}
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Contraseña o Token de Aplicación
                  </label>
                  {emailConfig.hasPassword && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      (Configurada)
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type={showEmailPassword ? 'text' : 'password'}
                    value={emailConfig.pass}
                    onChange={(e) => setEmailConfig({ ...emailConfig, pass: e.target.value })}
                    placeholder={emailConfig.hasPassword ? '•••••••••••• (Conservar actual)' : 'Ingresar contraseña'}
                    required={emailConfig.enabled && !emailConfig.hasPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmailPassword(!showEmailPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showEmailPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* From Header */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Nombre de Remitente (From)
                </label>
                <Input
                  value={emailConfig.from}
                  onChange={(e) => setEmailConfig({ ...emailConfig, from: e.target.value })}
                  placeholder='Tecnishop <no-reply@tecnishop.com>'
                />
              </div>

              {/* Security */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Seguridad de Conexión
                </label>
                <div className="flex items-center gap-4 mt-2">
                  <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="smtp_security"
                      checked={!emailConfig.secure}
                      onChange={() => setEmailConfig({ ...emailConfig, secure: false, port: 587 })}
                      className="text-sky-600 focus:ring-sky-500"
                    />
                    <span>STARTTLS (Recomendado, Puerto 587)</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="smtp_security"
                      checked={emailConfig.secure}
                      onChange={() => setEmailConfig({ ...emailConfig, secure: true, port: 465 })}
                      className="text-sky-600 focus:ring-sky-500"
                    />
                    <span>SSL / TLS (Puerto 465)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Test & Save Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Input
                  type="email"
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                  placeholder="Enviar prueba a (opcional)..."
                  className="text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestEmailConnection}
                  disabled={isTestingEmail || (!emailConfig.user && !emailConfig.host)}
                  className="text-xs shrink-0 gap-1.5"
                >
                  <Send className={`w-3.5 h-3.5 ${isTestingEmail ? 'animate-spin' : ''}`} />
                  {isTestingEmail ? 'Probando...' : 'Probar Conexión'}
                </Button>
              </div>

              <Button
                type="submit"
                disabled={isSavingEmailConfig}
                className="bg-sky-600 hover:bg-sky-700 text-white text-xs gap-1.5 shrink-0 shadow-md shadow-sky-600/20"
              >
                <Check className="w-4 h-4" />
                {isSavingEmailConfig ? 'Guardando...' : 'Guardar Configuración de Correo'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </Card>
  );
};
