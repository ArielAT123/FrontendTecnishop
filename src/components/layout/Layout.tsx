import React, { useState } from 'react';
import { Sidebar, NavSection } from './Sidebar';
import { Navbar } from './Navbar';
import { WhatsAppBanner } from './WhatsAppBanner';

interface LayoutProps {
  children: (section: NavSection, onNavigate: (section: NavSection) => void) => React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [currentSection, setCurrentSection] = useState<NavSection>('dashboard');

  const handleNavigateToWhatsApp = () => {
    setCurrentSection('configuracion');
    setTimeout(() => {
      const el = document.getElementById('whatsapp-config');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        el.classList.add('ring-2', 'ring-emerald-500');
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-emerald-500');
        }, 2500);
      }
    }, 150);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Sidebar currentSection={currentSection} onNavigate={setCurrentSection} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar currentSection={currentSection} />
        <WhatsAppBanner onNavigateToWhatsApp={handleNavigateToWhatsApp} />
        <main className="flex-1 overflow-y-auto p-6">
          {children(currentSection, setCurrentSection)}
        </main>
      </div>
    </div>
  );
};

