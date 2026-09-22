import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ScannerProvider } from './context/ScannerContext';
import { WhatsAppStatusProvider } from './context/WhatsAppStatusContext';
import { LoginPage } from './pages/login/LoginPage';
import { Layout } from './components/layout/Layout';
import { NavSection } from './components/layout/Sidebar';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { VentasPage } from './pages/ventas/VentasPage';
import { OrdenesPage } from './pages/ordenes/OrdenesPage';
import { ClientesPage } from './pages/clientes/ClientesPage';
import { EquiposPage } from './pages/equipos/EquiposPage';
import { ProductosPage } from './pages/productos/ProductosPage';
import { ReportesPage } from './pages/reportes/ReportesPage';
import { CotizacionesPage } from './pages/cotizaciones/CotizacionesPage';
import { ConfiguracionPage } from './pages/configuracion/ConfiguracionPage';
import { Orden } from './types';
import { Wrench } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 3, // 3 minutes cache
    },
  },
});

const MainRouter: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedOrderForReport, setSelectedOrderForReport] = useState<Orden | null>(null);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#3498db] to-[#2980b9] flex items-center justify-center text-white shadow-xl shadow-[#3498db]/30 animate-pulse mb-4">
          <Wrench className="w-6 h-6" />
        </div>
        <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
          Iniciando Tecnishop...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Layout>
      {(section: NavSection, onNavigate: (sec: NavSection) => void) => {
        switch (section) {
          case 'dashboard':
            return <DashboardPage onNavigate={onNavigate} />;
          case 'ventas':
            return <VentasPage onNavigate={onNavigate} />;
          case 'ordenes':
            return (
              <OrdenesPage
                onNavigate={onNavigate}
                onSelectOrderForReport={(ord) => setSelectedOrderForReport(ord)}
              />
            );
          case 'clientes':
            return <ClientesPage />;
          case 'equipos':
            return <EquiposPage />;
          case 'productos':
            return <ProductosPage activeTipo="PRODUCTO" onNavigate={onNavigate} />;
          case 'servicios':
            return <ProductosPage activeTipo="SERVICIO" onNavigate={onNavigate} />;
          case 'reportes':
            return (
              <ReportesPage
                selectedOrder={selectedOrderForReport}
                onClearSelectedOrder={() => setSelectedOrderForReport(null)}
                onNavigate={onNavigate}
              />
            );
          case 'cotizaciones':
            return <CotizacionesPage onNavigate={onNavigate} />;
          case 'configuracion':
            return <ConfiguracionPage />;
          default:
            return <DashboardPage onNavigate={onNavigate} />;
        }
      }}
    </Layout>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ScannerProvider>
            <WhatsAppStatusProvider>
              <MainRouter />
            </WhatsAppStatusProvider>
          </ScannerProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
