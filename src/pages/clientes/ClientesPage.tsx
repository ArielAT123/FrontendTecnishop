import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { api } from '../../api/client';
import { Cliente } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  CreditCard,
  Edit2,
  Trash2,
  AlertCircle,
} from 'lucide-react';

export const ClientesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  // Form State
  const [formData, setFormData] = useState<Cliente>({
    ci: '',
    nombre: '',
    apellido: '',
    telefono: '',
    correo: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { data: clientes = [], isLoading, isSyncing } = useCachedQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: api.getClientes,
    keyField: 'ci',
  });

  const createMutation = useMutation({
    mutationFn: api.createCliente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.ci?.[0] || err.message || 'Error al guardar el cliente');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ ci, data }: { ci: string; data: Partial<Cliente> }) => api.updateCliente(ci, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Error al actualizar el cliente');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteCliente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });

  const resetForm = () => {
    setFormData({ ci: '', nombre: '', apellido: '', telefono: '', correo: '' });
    setEditingCliente(null);
    setFormError(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({ ...cliente });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCi = formData.ci.replace(/[\s,\.]/g, '').trim();
    if (!cleanCi || !formData.nombre.trim()) {
      setFormError('La Cédula/RUC y el Nombre son obligatorios');
      return;
    }

    let cleanPhone = formData.telefono ? formData.telefono.replace(/[\s\-\(\)\.]/g, '').trim() : '';
    const digits = cleanPhone.replace(/\D/g, '');
    if (digits.startsWith('9') && digits.length < 10) {
      cleanPhone = '0' + digits;
    }

    const payload: Partial<Cliente> = {
      ...formData,
      ci: cleanCi.length === 9 && /^\d+$/.test(cleanCi) ? cleanCi.padStart(10, '0') : cleanCi,
      telefono: cleanPhone || '',
      nombre: formData.nombre.trim(),
      apellido: formData.apellido ? formData.apellido.trim() : '',
    };

    if (editingCliente) {
      updateMutation.mutate({ ci: editingCliente.ci, data: payload });
    } else {
      createMutation.mutate(payload as Cliente);
    }
  };

  const handleDelete = (ci: string, nombre: string) => {
    if (window.confirm(`¿Estás seguro de eliminar al cliente ${nombre}?`)) {
      deleteMutation.mutate(ci);
    }
  };

  const filteredClientes = clientes.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.nombre?.toLowerCase().includes(term) ||
      c.apellido?.toLowerCase().includes(term) ||
      c.ci?.toLowerCase().includes(term) ||
      c.telefono?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Header with Search & New Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Buscar por cédula, nombre o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <Button
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={openCreateModal}
          className="shadow-sm"
        >
          Nuevo Cliente
        </Button>
      </div>

      {/* Clients Table Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Clientes ({filteredClientes.length})</span>
            {isSyncing && (
              <span className="text-[10px] font-normal text-[#3498db] animate-pulse bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                Sincronizando en segundo plano...
              </span>
            )}
          </h3>
        </div>

        {isLoading && filteredClientes.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">Cargando directorio de clientes...</div>
        ) : filteredClientes.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            {searchTerm ? 'No se encontraron clientes con ese criterio.' : 'No hay clientes registrados.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="pb-3 pl-2">CI / RUC</th>
                  <th className="pb-3">Nombre Completo</th>
                  <th className="pb-3">Teléfono</th>
                  <th className="pb-3">Correo Electrónico</th>
                  <th className="pb-3 pr-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredClientes.map((c) => (
                  <tr key={c.ci} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 pl-2 font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {c.ci}
                    </td>
                    <td className="py-3 text-slate-900 dark:text-slate-100 font-bold">
                      {c.nombre} {c.apellido || ''}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">
                      {c.telefono ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {c.telefono}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">
                      {c.correo ? (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {c.correo}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 pr-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.ci, c.nombre)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Creación / Edición */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCliente ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
        maxWidth="md"
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
              Cédula / RUC *
            </label>
            <Input
              placeholder="0912345678"
              value={formData.ci}
              disabled={!!editingCliente}
              onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
              leftIcon={<CreditCard className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Nombre *
              </label>
              <Input
                placeholder="Juan"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Apellido
              </label>
              <Input
                placeholder="Pérez"
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Teléfono / WhatsApp
            </label>
            <Input
              placeholder="0991234567"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              leftIcon={<Phone className="w-4 h-4" />}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Correo Electrónico
            </label>
            <Input
              type="email"
              placeholder="cliente@ejemplo.com"
              value={formData.correo}
              onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
              leftIcon={<Mail className="w-4 h-4" />}
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
            <Button
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingCliente ? 'Guardar Cambios' : 'Registrar Cliente'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
