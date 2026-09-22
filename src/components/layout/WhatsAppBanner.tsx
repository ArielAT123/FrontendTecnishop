import React from 'react';
import { useWhatsAppStatus } from '../../context/WhatsAppStatusContext';
import { AlertTriangle, ArrowRight, X } from 'lucide-react';
import { WhatsAppIcon } from '../common/WhatsAppIcon';

interface WhatsAppBannerProps {
  onNavigateToWhatsApp: () => void;
}

export const WhatsAppBanner: React.FC<WhatsAppBannerProps> = ({ onNavigateToWhatsApp }) => {
  const { isConnected, isDismissed, dismissNotification } = useWhatsAppStatus();

  // If connected or dismissed by user for this session, do not render
  if (isConnected || isDismissed) {
    return null;
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    dismissNotification();
  };

  return (
    <div
      role="alert"
      onClick={onNavigateToWhatsApp}
      className="relative z-30 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/15 dark:from-amber-500/20 dark:via-amber-500/10 dark:to-amber-500/20 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-2.5 transition-all duration-200 shadow-sm cursor-pointer hover:bg-amber-500/25 dark:hover:bg-amber-500/30 group select-none"
      title="Hacer clic para ir a Configuración de WhatsApp"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left Side: Icon and Message */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="relative flex items-center justify-center p-1.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
            <WhatsAppIcon className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500" />
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs sm:text-sm font-semibold truncate">
            <span className="text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wide">
              NO ESTÁ CONECTADO CON WHATSAPP
            </span>
            <span className="text-amber-700 dark:text-amber-400 font-normal hidden sm:inline">
              —
            </span>
            <span className="inline-flex items-center gap-1 text-amber-900 dark:text-amber-100 underline decoration-amber-500/50 hover:decoration-amber-500 font-medium group-hover:translate-x-0.5 transition-transform">
              Dar clic para conectar
              <ArrowRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </span>
          </div>
        </div>

        {/* Right Side: Small Dismiss 'X' Button */}
        <button
          type="button"
          onClick={handleDismiss}
          title="Cerrar notificación"
          className="p-1 rounded-md text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-100 hover:bg-amber-500/20 transition-colors shrink-0"
          aria-label="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
