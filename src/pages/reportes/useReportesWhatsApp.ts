import { useState, useRef, useEffect } from 'react';
import { documentNotificationService } from '../../services/documentNotificationService';

export const useReportesWhatsApp = () => {
  const [sendingInformeWhatsApp, setSendingInformeWhatsApp] = useState(false);
  const [sendingCotizacionWhatsApp, setSendingCotizacionWhatsApp] = useState(false);
  const [isWhatsAppDropdownOpen, setIsWhatsAppDropdownOpen] = useState(false);
  const whatsAppDropdownRef = useRef<HTMLDivElement>(null);
  const [informeWhatsAppFeedback, setInformeWhatsAppFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        whatsAppDropdownRef.current &&
        !whatsAppDropdownRef.current.contains(event.target as Node)
      ) {
        setIsWhatsAppDropdownOpen(false);
      }
    };
    if (isWhatsAppDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isWhatsAppDropdownOpen]);

  const handleSendInformeWhatsApp = async (rep: any) => {
    if (!rep) return;
    setSendingInformeWhatsApp(true);
    setInformeWhatsAppFeedback(null);
    try {
      const res = await documentNotificationService.sendInforme(rep);
      if (res.success) {
        setInformeWhatsAppFeedback({
          type: 'success',
          message: '¡Informe técnico enviado con éxito al WhatsApp del cliente!',
        });
        setTimeout(() => setInformeWhatsAppFeedback(null), 5000);
      } else {
        setInformeWhatsAppFeedback({
          type: 'error',
          message: res.error || 'Error al enviar por WhatsApp',
        });
        setTimeout(() => setInformeWhatsAppFeedback(null), 6000);
      }
    } catch (err: any) {
      setInformeWhatsAppFeedback({
        type: 'error',
        message: err.message || 'Error de comunicación con el servidor de mensajería',
      });
      setTimeout(() => setInformeWhatsAppFeedback(null), 6000);
    } finally {
      setSendingInformeWhatsApp(false);
    }
  };

  const handleSendCotizacionWhatsApp = async (rep: any) => {
    if (!rep) return;
    setSendingCotizacionWhatsApp(true);
    setInformeWhatsAppFeedback(null);
    try {
      const res = await documentNotificationService.sendCotizacion(rep);
      if (res.success) {
        setInformeWhatsAppFeedback({
          type: 'success',
          message: '¡Enlace de cotización interactiva enviado con éxito al WhatsApp del cliente!',
        });
        setTimeout(() => setInformeWhatsAppFeedback(null), 6000);
      } else {
        setInformeWhatsAppFeedback({
          type: 'error',
          message: res.error || 'Error al enviar cotización por WhatsApp',
        });
        setTimeout(() => setInformeWhatsAppFeedback(null), 6000);
      }
    } catch (err: any) {
      setInformeWhatsAppFeedback({
        type: 'error',
        message: err.message || 'Error de comunicación con el servidor de mensajería',
      });
      setTimeout(() => setInformeWhatsAppFeedback(null), 6000);
    } finally {
      setSendingCotizacionWhatsApp(false);
    }
  };

  return {
    sendingInformeWhatsApp,
    sendingCotizacionWhatsApp,
    isWhatsAppDropdownOpen,
    setIsWhatsAppDropdownOpen,
    whatsAppDropdownRef,
    informeWhatsAppFeedback,
    handleSendInformeWhatsApp,
    handleSendCotizacionWhatsApp,
  };
};
