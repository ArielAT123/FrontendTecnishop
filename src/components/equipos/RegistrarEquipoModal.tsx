import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { api } from '../../api/client';
import { Equipo, Cliente } from '../../types';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { User, Hash, AlertCircle, Layers } from 'lucide-react';
import { TreeField } from './TreeField';

export interface RegistrarEquipoModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteCi?: string;
  clienteNombre?: string;
  onEquipoCreated?: (equipo: Equipo) => void;
}

export const RegistrarEquipoModal: React.FC<RegistrarEquipoModalProps> = ({
  isOpen,
  onClose,
  clienteCi,
  clienteNombre,
  onEquipoCreated,
}) => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    cliente_ci: clienteCi || '',
    nombre: '',
    marca: '',
    modelo: '',
    numero_serie: '',
  });

  const [formError, setFormError] = useState<string | null>(null);

  // If clienteCi was passed via props, keep it synchronized
  useEffect(() => {
    if (clienteCi) {
      setFormData((prev) => ({ ...prev, cliente_ci: clienteCi }));
    }
  }, [clienteCi]);

  const { data: clientes = [] } = useCachedQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: api.getClientes,
    keyField: 'ci',
  });

  const resetForm = () => {
    setFormData({
      cliente_ci: clienteCi || '',
      nombre: '',
      marca: '',
      modelo: '',
      numero_serie: '',
    });
    setFormError(null);
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await api.createEquipo({
        nombre: data.nombre.trim().toUpperCase(),
        marca: data.marca.trim().toUpperCase(),
        modelo: data.modelo.trim(),
        numero_serie: data.numero_serie.trim(),
        cliente_ci: data.cliente_ci,
      });
    },
    onSuccess: (newEquipo) => {
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      queryClient.invalidateQueries({ queryKey: ['equipos-tipos'] });
      if (onEquipoCreated) {
        onEquipoCreated(newEquipo);
      }
      onClose();
      resetForm();
    },
    onError: (err: any) => {
      const data = err?.response?.data;
      if (data) {
        if (typeof data === 'string') {
          setFormError(data);
          return;
        }
        if (data.error) {
          setFormError(data.error);
          return;
        }
        const fieldErrors = Object.entries(data)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join(' | ');
        if (fieldErrors) {
          setFormError(fieldErrors);
          return;
        }
      }
      setFormError(err.message || 'Error al registrar el equipo');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cliente_ci) {
      setFormError('Debes seleccionar o asociar un cliente');
      return;
    }
    if (!formData.nombre.trim() && !formData.modelo.trim()) {
      setFormError('Ingresa el tipo/nombre o modelo del equipo');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        resetForm();
      }}
      title={clienteNombre ? `Registrar Nuevo Dispositivo (${clienteNombre})` : 'Registrar Nuevo Dispositivo'}
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-500 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Cliente Propietario (Si viene fijado por props o seleccionable) */}
        {clienteNombre && clienteCi ? (
          <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#3498db]" />
              <div className="text-xs">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Cliente Asociado: </span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{clienteNombre}</span>
                <span className="ml-1 text-slate-400 font-mono">({clienteCi})</span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-[#3498db]">Fijado</span>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#3498db]" />
              <span>Cliente Propietario *</span>
            </label>
            <select
              value={formData.cliente_ci}
              onChange={(e) => setFormData({ ...formData, cliente_ci: e.target.value })}
              className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#3498db]/40"
            >
              <option value="">Selecciona un cliente...</option>
              {clientes.map((c) => (
                <option key={c.ci} value={c.ci}>
                  {c.nombre} {c.apellido || ''} ({c.ci})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Especificaciones del Dispositivo en Cascada con Árbol Jerárquico */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#3498db]" />
              <span>Árbol Jerárquico de Especificaciones</span>
            </p>
            <span className="text-[10px] text-[#3498db] font-semibold">
              Tipo &rarr; Marca &rarr; Modelo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nivel 1: Tipo de Dispositivo */}
            <TreeField
              label="Tipo de Dispositivo"
              required
              placeholder="Laptop, Impresora, CPU..."
              value={formData.nombre}
              onChange={(val) => setFormData({ ...formData, nombre: val })}
              onSelect={(val) => setFormData({ ...formData, nombre: val })}
              fetchSuggestions={async (q) => {
                const res = await api.getCatalogoTipos(q);
                return res.map((item) => ({
                  texto: item.tipo,
                  frecuencia: item.total,
                }));
              }}
              helperBadge="Nivel 1"
            />

            {/* Nivel 2: Marca (Filtrada por Tipo) */}
            <TreeField
              label="Marca"
              placeholder="HP, Dell, Lenovo, Epson..."
              value={formData.marca}
              onChange={(val) => setFormData({ ...formData, marca: val })}
              onSelect={(val) => setFormData({ ...formData, marca: val })}
              fetchSuggestions={async (q) => {
                const res = await api.getCatalogoMarcas(formData.nombre, q);
                return res.map((item) => ({
                  texto: item.texto,
                  frecuencia: item.frecuencia,
                }));
              }}
              helperBadge={formData.nombre ? `Filtrada por ${formData.nombre}` : 'Nivel 2'}
            />

            {/* Nivel 3: Modelo (Filtrado por Tipo + Marca) */}
            <TreeField
              label="Modelo"
              placeholder="Inspiron 15, EcoTank L375..."
              value={formData.modelo}
              onChange={(val) => setFormData({ ...formData, modelo: val })}
              onSelect={(val) => setFormData({ ...formData, modelo: val })}
              fetchSuggestions={async (q) => {
                const res = await api.getCatalogoModelos(formData.nombre, formData.marca, q);
                return res.map((item) => ({
                  texto: item.texto,
                  frecuencia: item.frecuencia,
                  tipo: item.tipo,
                  marca: item.marca,
                }));
              }}
              helperBadge={formData.marca ? `Filtrado por ${formData.marca}` : 'Nivel 3'}
            />

            {/* Nivel 4: Número de Serie */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Número de Serie
                </label>
                <span className="text-[10px] text-slate-400">Opcional / S/N</span>
              </div>
              <Input
                placeholder="ABC123XYZ o S/N"
                value={formData.numero_serie}
                onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
                leftIcon={<Hash className="w-4 h-4" />}
              />
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#3498db] hover:bg-[#2980b9] shadow-md shadow-[#3498db]/30 transition-all disabled:opacity-50"
          >
            {createMutation.isPending ? 'Guardando...' : 'Guardar y Seleccionar Equipo'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
