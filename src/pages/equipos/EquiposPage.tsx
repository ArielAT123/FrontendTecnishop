import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { api } from '../../api/client';
import { Equipo, Cliente } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import {
  Laptop,
  PlusCircle,
  Search,
  User,
  Hash,
  AlertCircle,
  CheckSquare,
} from 'lucide-react';

export const EquiposPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    nombre: '',
    marca: '',
    modelo: '',
    numero_serie: '',
    cliente_ci: '',
    cargador: false,
    bateria: false,
    cable_poder: false,
    cable_datos: false,
    otros: '',
    problema: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { data: equipos = [], isLoading, isSyncing } = useCachedQuery<Equipo[]>({
    queryKey: ['equipos'],
    queryFn: api.getEquipos,
    keyField: 'id',
  });

  const { data: clientes = [] } = useCachedQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: api.getClientes,
    keyField: 'ci',
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // 1. Create equipment
      const equipo = await api.createEquipo({
        nombre: data.nombre,
        marca: data.marca,
        modelo: data.modelo,
        numero_serie: data.numero_serie,
        cliente_ci: data.cliente_ci,
      });

      // 2. Create physical observations
      await api.createObservaciones(equipo.id, {
        cargador: data.cargador,
        bateria: data.bateria,
        cable_poder: data.cable_poder,
        cable_datos: data.cable_datos,
        otros: data.otros,
      });

      // 3. Create reported problem
      if (data.problema.trim()) {
        await api.createProblema(equipo.id, { problema: data.problema });
      }

      return equipo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.error || err.message || 'Error al registrar el equipo');
    },
  });

  const resetForm = () => {
    setFormData({
      nombre: '',
      marca: '',
      modelo: '',
      numero_serie: '',
      cliente_ci: '',
      cargador: false,
      bateria: false,
      cable_poder: false,
      cable_datos: false,
      otros: '',
      problema: '',
    });
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cliente_ci) {
      setFormError('Debes seleccionar un cliente');
      return;
    }
    if (!formData.nombre && !formData.modelo) {
      setFormError('Ingresa el nombre o modelo del equipo');
      return;
    }
    createMutation.mutate(formData);
  };

  const filteredEquipos = equipos.filter((eq) => {
    const term = searchTerm.toLowerCase();
    return (
      eq.nombre?.toLowerCase().includes(term) ||
      eq.marca?.toLowerCase().includes(term) ||
      eq.modelo?.toLowerCase().includes(term) ||
      eq.numero_serie?.toLowerCase().includes(term) ||
      eq.cliente_ci?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Buscar por marca, modelo, serie o CI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <Button
          leftIcon={<PlusCircle className="w-4 h-4" />}
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="shadow-sm"
        >
          Registrar Dispositivo
        </Button>
      </div>

      {/* Equipment Table */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Laptop className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Dispositivos Registrados ({filteredEquipos.length})</span>
            {isSyncing && (
              <span className="text-[10px] font-normal text-[#3498db] animate-pulse bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                Sincronizando en segundo plano...
              </span>
            )}
          </h3>
        </div>

        {isLoading && filteredEquipos.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">Cargando dispositivos...</div>
        ) : filteredEquipos.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            {searchTerm ? 'No se encontraron equipos para esta búsqueda.' : 'No hay equipos registrados aún.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="pb-3 pl-2">Equipo / Tipo</th>
                  <th className="pb-3">Marca y Modelo</th>
                  <th className="pb-3">Número de Serie</th>
                  <th className="pb-3">Propietario (CI)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredEquipos.map((eq) => (
                  <tr key={eq.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 pl-2 font-bold text-slate-900 dark:text-slate-100">
                      {eq.nombre || 'Dispositivo'}
                    </td>
                    <td className="py-3 text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-brand-600 dark:text-brand-400">{eq.marca || 'Genérica'}</span>{' '}
                      {eq.modelo || ''}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400 font-mono">
                      {eq.numero_serie || 'S/N'}
                    </td>
                    <td className="py-3 text-slate-800 dark:text-slate-200">
                      <span className="inline-flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {eq.cliente_ci}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Registrar Dispositivo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Nuevo Dispositivo"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-500 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Cliente Propietario *
            </label>
            <select
              value={formData.cliente_ci}
              onChange={(e) => setFormData({ ...formData, cliente_ci: e.target.value })}
              className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            >
              <option value="">Selecciona un cliente...</option>
              {clientes.map((c) => (
                <option key={c.ci} value={c.ci}>
                  {c.nombre} {c.apellido || ''} ({c.ci})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Tipo / Nombre *
              </label>
              <Input
                placeholder="Laptop, CPU, Impresora..."
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Marca
              </label>
              <Input
                placeholder="Dell, HP, Lenovo..."
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Modelo
              </label>
              <Input
                placeholder="Inspiron 15 3520"
                value={formData.modelo}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Número de Serie
              </label>
              <Input
                placeholder="ABC123XYZ"
                value={formData.numero_serie}
                onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
                leftIcon={<Hash className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* Accesorios y Condiciones */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              Accesorios Recibidos
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'cargador', label: 'Cargador' },
                { key: 'bateria', label: 'Batería' },
                { key: 'cable_poder', label: 'Cable Poder' },
                { key: 'cable_datos', label: 'Cable Datos' },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 cursor-pointer text-xs font-medium"
                >
                  <input
                    type="checkbox"
                    checked={(formData as any)[key]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Falla o Problema Reportado
            </label>
            <Input
              placeholder="No enciende, pantalla azul, mantenimiento preventivo..."
              value={formData.problema}
              onChange={(e) => setFormData({ ...formData, problema: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Registrar Equipo
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
