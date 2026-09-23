import React, { useState, useEffect } from 'react';
import { ConfigScannerSection } from '../../components/configuracion/ConfigScannerSection';
import { ConfigWhatsAppSection } from '../../components/configuracion/ConfigWhatsAppSection';
import { TemplateConfigSection } from '../../components/configuracion/TemplateConfigSection';
import { ConfigEmailSection } from '../../components/configuracion/ConfigEmailSection';
import { ConfigTallerSection } from '../../components/configuracion/ConfigTallerSection';

export const ConfiguracionPage: React.FC = () => {
  // Collapsible sections state (default hidden for cleaner UI)
  const [openSections, setOpenSections] = useState({
    barcode: false,
    whatsapp: false,
    templates: false,
    email: false,
    taller: false,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (window.location.hash === '#whatsapp-config') {
      setOpenSections((prev) => ({ ...prev, whatsapp: true }));
    }
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn select-none">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Configuración del Sistema</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Personaliza los datos del taller, escáner de códigos de barras, mensajería y aspecto visual
        </p>
      </div>

      {/* Escáner de Códigos de Barra */}
      <ConfigScannerSection
        isOpen={openSections.barcode}
        onToggle={() => toggleSection('barcode')}
      />

      {/* WhatsApp (Evolution API) */}
      <ConfigWhatsAppSection
        isOpen={openSections.whatsapp}
        onToggle={() => toggleSection('whatsapp')}
      />

      {/* Plantillas de Mensajes Automatizados */}
      <TemplateConfigSection
        isOpen={openSections.templates}
        onToggle={() => toggleSection('templates')}
      />

      {/* Correo Electrónico (SMTP) */}
      <ConfigEmailSection
        isOpen={openSections.email}
        onToggle={() => toggleSection('email')}
      />

      {/* Datos del Taller, Tema y Sesión */}
      <ConfigTallerSection
        isOpen={openSections.taller}
        onToggle={() => toggleSection('taller')}
      />
    </div>
  );
};
