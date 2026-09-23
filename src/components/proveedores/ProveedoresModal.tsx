import React, { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { api } from '../../api/client';
import { Proveedor } from '../../types';
import { Modal } from '../ui/Modal';
import { ProveedorSearchTrie } from './proveedorSearchTrie';
import { ProveedorForm } from './ProveedorForm';
import { ProveedorListCards } from './ProveedorListCards';

export interface ProveedoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProveedor?: (proveedor: Proveedor) => void;
}

export const ProveedoresModal: React.FC<ProveedoresModalProps> = ({
  isOpen,
  onClose,
  onSelectProveedor,
}) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeQuickFilter, setActiveQuickFilter] = useState<'all' | 'with_ruc' | 'with_account' | 'with_contact'>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nombre_o_razon_social: '',
    ruc_cedula: '',
    telefono: '',
    nombre_contacto: '',
    numero_cuenta: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { data: proveedores = [] } = useCachedQuery<Proveedor[]>({
    queryKey: ['proveedores'],
    queryFn: api.getProveedores,
    keyField: 'id',
  });

  // Instancia memorizada del Árbol de Búsqueda (Trie)
  const searchTrie = useMemo(() => {
    const trie = new ProveedorSearchTrie();
    trie.build(proveedores);
    return trie;
  }, [proveedores]);

  // Resultados indexados por el árbol de búsqueda
  const trieFilteredProveedores = useMemo(() => {
    const results = searchTrie.search(searchTerm);

    if (activeQuickFilter === 'with_ruc') {
      return results.filter((p) => p.ruc_cedula && p.ruc_cedula.trim() !== '');
    }
    if (activeQuickFilter === 'with_account') {
      return results.filter((p) => p.numero_cuenta && p.numero_cuenta.trim() !== '');
    }
    if (activeQuickFilter === 'with_contact') {
      return results.filter((p) => p.nombre_contacto && p.nombre_contacto.trim() !== '');
    }

    return results;
  }, [searchTrie, searchTerm, activeQuickFilter]);

  const resetForm = () => {
    setFormData({
      nombre_o_razon_social: '',
      ruc_cedula: '',
      telefono: '',
      nombre_contacto: '',
      numero_cuenta: '',
    });
    setFormError(null);
    setIsEditing(false);
    setEditingId(null);
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createProveedor(data),
    onSuccess: (newProv) => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      resetForm();
      if (onSelectProveedor) {
        onSelectProveedor(newProv);
      }
    },
    onError: (err: any) => {
      setFormError(err.message || 'Error al guardar proveedor');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateProveedor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Error al actualizar proveedor');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteProveedor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
    },
  });

  const handleEdit = (prov: Proveedor) => {
    setIsEditing(true);
    setEditingId(prov.id);
    setFormData({
      nombre_o_razon_social: prov.nombre_o_razon_social,
      ruc_cedula: prov.ruc_cedula || '',
      telefono: prov.telefono || '',
      nombre_contacto: prov.nombre_contacto || '',
      numero_cuenta: prov.numero_cuenta || '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre_o_razon_social.trim()) {
      setFormError('El nombre o razón social es obligatorio');
      return;
    }

    if (isEditing && editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestión y Catálogo de Proveedores"
      maxWidth="5xl"
    >
      <div className="space-y-6 animate-fadeIn">
        {/* Formulario de Alta / Edición */}
        <ProveedorForm
          isEditing={isEditing}
          onCancelEdit={resetForm}
          formError={formError}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          isPending={createMutation.isPending || updateMutation.isPending}
        />

        {/* Árbol de Búsqueda y Listado */}
        <ProveedorListCards
          proveedores={proveedores}
          trieFilteredProveedores={trieFilteredProveedores}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeQuickFilter={activeQuickFilter}
          setActiveQuickFilter={setActiveQuickFilter}
          onEdit={handleEdit}
          onDelete={(id) => deleteMutation.mutate(id)}
          onSelectProveedor={onSelectProveedor}
          copiedId={copiedId}
          onCopyAccount={copyToClipboard}
        />
      </div>
    </Modal>
  );
};
