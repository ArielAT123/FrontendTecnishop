import React, { useState, useMemo } from 'react';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { api } from '../../api/client';
import { Equipo } from '../../types';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { RegistrarEquipoModal } from '../../components/equipos/RegistrarEquipoModal';
import {
  Laptop,
  PlusCircle,
  Search,
  User,
  X,
} from 'lucide-react';

export const EquiposPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTipo, setSelectedTipo] = useState<string>('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: equipos = [], isLoading, isSyncing } = useCachedQuery<Equipo[]>({
    queryKey: ['equipos'],
    queryFn: api.getEquipos,
    keyField: 'id',
  });

  // Fetch unique equipment types indexed by Trie / Catalogo
  const { data: uniqueTipos = [] } = useCachedQuery<{ tipo: string; total: number }[]>({
    queryKey: ['equipos-tipos'],
    queryFn: api.getUniqueTiposEquipo,
    keyField: 'tipo',
  });

  // Helper to match equipment against canonical types
  const matchTipoEquipo = (nombre: string | undefined, filtro: string) => {
    if (filtro === 'TODOS' || !filtro) return true;
    const n = (nombre || '').trim().toUpperCase();
    if (filtro === 'LAPTOP' && (n.includes('LAPTO') || n.includes('LALPTOP'))) return true;
    if (filtro === 'IMPRESORA' && (n.includes('IMPRES') || n.includes('IM PRES') || n.includes('I MPRES') || n.includes('IMORES'))) return true;
    if (filtro === 'CPU' && (n === 'CPU' || n.includes('CPU') || n === '2 CP')) return true;
    if (filtro === 'TODO EN UNO' && (n.includes('ALL IN ONE') || n.includes('COMPUTADORA') || n.includes('TODO EN UNO'))) return true;
    if (filtro === 'MINI MAC' && n.includes('MINI MAC')) return true;
    if (filtro === 'MONITOR' && (n.includes('MONITOR') || n.includes('PANTALLA'))) return true;
    if (filtro === 'TABLET' && (n.includes('TABLET') || n.includes('IPAD'))) return true;
    if (filtro === 'TELEFONO MOVIL' && (n.includes('TELEFONO') || n.includes('CELULAR') || n.includes('MOVIL'))) return true;
    if (filtro === 'CAMARA' && n.includes('CAMARA')) return true;
    return n === filtro;
  };

  // Filtered equipments based on Unique Types and Search Input
  const filteredEquipos = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return equipos.filter((eq) => {
      // 1. Tipo de equipo filter
      if (!matchTipoEquipo(eq.nombre, selectedTipo)) return false;

      // 2. Search query filter
      if (term) {
        const matchesNombre = eq.nombre?.toLowerCase().includes(term);
        const matchesMarca = eq.marca?.toLowerCase().includes(term);
        const matchesModelo = eq.modelo?.toLowerCase().includes(term);
        const matchesSerie = eq.numero_serie?.toLowerCase().includes(term);
        const matchesCi = eq.cliente_ci?.toLowerCase().includes(term);
        const matchesCliente = `${eq.cliente?.nombre || ''} ${eq.cliente?.apellido || ''}`.toLowerCase().includes(term);

        if (!matchesNombre && !matchesMarca && !matchesModelo && !matchesSerie && !matchesCi && !matchesCliente) {
          return false;
        }
      }

      return true;
    });
  }, [equipos, selectedTipo, searchTerm]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Buscar por marca, modelo, serie o CI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#3498db] hover:bg-[#2980b9] text-white shadow-md shadow-[#3498db]/30 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Registrar Dispositivo</span>
        </button>
      </div>

      {/* Trie-Indexed Unique Types Quick Filter Pills */}
      {uniqueTipos.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => setSelectedTipo('TODOS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all shrink-0 select-none ${
              selectedTipo === 'TODOS'
                ? 'bg-[#3498db] text-white font-bold shadow-md shadow-[#3498db]/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold'
            }`}
          >
            <span>Todos los Tipos</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedTipo === 'TODOS'
                  ? 'bg-white/20 text-white font-mono font-bold'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono'
              }`}
            >
              {equipos.length}
            </span>
          </button>

          {uniqueTipos.map((item) => (
            <button
              key={item.tipo}
              type="button"
              onClick={() => setSelectedTipo(item.tipo)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all shrink-0 select-none ${
                selectedTipo === item.tipo
                  ? 'bg-[#3498db] text-white font-bold shadow-md shadow-[#3498db]/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold'
              }`}
            >
              <span>{item.tipo}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  selectedTipo === item.tipo
                    ? 'bg-white/20 text-white font-mono font-bold'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono'
                }`}
              >
                {item.total}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Equipment Table */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Laptop className="w-5 h-5 text-[#3498db]" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Dispositivos Registrados ({filteredEquipos.length})</span>
              {isSyncing && (
                <span className="text-[10px] font-normal text-[#3498db] animate-pulse bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                  Sincronizando...
                </span>
              )}
            </h3>
          </div>

          {selectedTipo !== 'TODOS' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Filtro activo: <strong className="text-[#3498db]">{selectedTipo}</strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedTipo('TODOS')}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Limpiar filtro"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {isLoading && equipos.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <div className="animate-spin w-8 h-8 border-2 border-[#3498db] border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm">Cargando dispositivos...</p>
          </div>
        ) : filteredEquipos.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500">
            <Laptop className="w-12 h-12 mx-auto mb-3 stroke-1 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold">No se encontraron dispositivos</p>
            <p className="text-xs mt-1">
              {searchTerm || selectedTipo !== 'TODOS'
                ? 'Prueba modificando los filtros de búsqueda'
                : 'Comienza registrando un nuevo dispositivo'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-y border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                <tr>
                  <th className="py-3 px-4">Dispositivo</th>
                  <th className="py-3 px-4">Marca & Modelo</th>
                  <th className="py-3 px-4">Número de Serie</th>
                  <th className="py-3 px-4">Cliente Propietario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEquipos.map((eq) => (
                  <tr
                    key={eq.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-100 text-xs">
                        {eq.nombre || 'Dispositivo'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-700 dark:text-slate-200 text-xs">
                        {eq.marca || '—'} {eq.modelo ? `• ${eq.modelo}` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {eq.numero_serie ? (
                        <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {eq.numero_serie}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {eq.cliente ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium">
                            {eq.cliente.nombre} {eq.cliente.apellido || ''}
                          </span>
                          <span className="text-slate-400 font-mono text-[10px]">
                            ({eq.cliente.ci})
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {eq.cliente_ci}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ========================================================= */}
      {/* MODAL REGISTRAR NUEVO DISPOSITIVO (ÁRBOL JERÁRQUICO Y AMPLIO) */}
      {/* ========================================================= */}
      <RegistrarEquipoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
