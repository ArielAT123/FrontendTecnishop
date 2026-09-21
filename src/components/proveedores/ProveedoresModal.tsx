import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { api } from '../../api/client';
import { Proveedor } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  Truck,
  PlusCircle,
  Search,
  Building,
  Phone,
  User,
  CreditCard,
  Hash,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  GitBranch,
  Copy,
  Check,
} from 'lucide-react';

interface ProveedoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProveedor?: (proveedor: Proveedor) => void;
}

/**
 * Nodo para el Árbol de Búsqueda (Trie)
 */
class TrieNode {
  children: Map<string, TrieNode> = new Map();
  proveedorIds: Set<string> = new Set();
}

/**
 * Árbol de Búsqueda por Prefijos y Tokens (Trie Search Tree)
 * Indexa ultra-rápido los 5 campos del proveedor:
 * 1. Nombre o Razón Social
 * 2. RUC / Cédula
 * 3. Teléfono
 * 4. Nombre de Contacto
 * 5. Número de Cuenta Bancaria
 */
class ProveedorSearchTrie {
  private root: TrieNode = new TrieNode();
  private proveedoresMap: Map<string, Proveedor> = new Map();

  private normalize(str: string): string {
    return (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  public build(proveedores: Proveedor[]) {
    this.root = new TrieNode();
    this.proveedoresMap.clear();

    for (const prov of proveedores) {
      this.proveedoresMap.set(prov.id, prov);

      const fields = [
        prov.nombre_o_razon_social,
        prov.ruc_cedula || '',
        prov.telefono || '',
        prov.nombre_contacto || '',
        prov.numero_cuenta || '',
      ];

      for (const field of fields) {
        if (!field) continue;
        const norm = this.normalize(field);
        if (!norm) continue;

        // Indexa la frase completa
        this.insertWord(norm, prov.id);

        // Indexa cada palabra o token por separado
        const tokens = norm.split(/[\s,.\-_/\\]+/).filter(Boolean);
        for (const token of tokens) {
          this.insertWord(token, prov.id);
        }
      }
    }
  }

  private insertWord(word: string, id: string) {
    let curr = this.root;
    curr.proveedorIds.add(id);

    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      if (!curr.children.has(ch)) {
        curr.children.set(ch, new TrieNode());
      }
      curr = curr.children.get(ch)!;
      curr.proveedorIds.add(id);
    }
  }

  public search(query: string): Proveedor[] {
    const norm = this.normalize(query);
    if (!norm) {
      return Array.from(this.proveedoresMap.values());
    }

    const tokens = norm.split(/[\s,.\-_/\\]+/).filter(Boolean);
    if (tokens.length === 0) {
      return Array.from(this.proveedoresMap.values());
    }

    let resultIds: Set<string> | null = null;

    for (const token of tokens) {
      let curr: TrieNode | undefined = this.root;
      for (let i = 0; i < token.length; i++) {
        const ch = token[i];
        if (!curr || !curr.children.has(ch)) {
          curr = undefined;
          break;
        }
        curr = curr.children.get(ch);
      }

      const currentIds: Set<string> = curr ? curr.proveedorIds : new Set<string>();
      if (resultIds === null) {
        resultIds = new Set(currentIds);
      } else {
        const filtered: string[] = Array.from(resultIds).filter((id: string) => currentIds.has(id));
        resultIds = new Set(filtered);
      }

      if (resultIds.size === 0) break;
    }

    if (!resultIds || resultIds.size === 0) return [];

    return Array.from(resultIds)
      .map((id) => this.proveedoresMap.get(id)!)
      .filter(Boolean);
  }
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

  const { data: proveedores = [], isLoading } = useCachedQuery<Proveedor[]>({
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

    // Filtros rápidos opcionales
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
        {/* FORMULARIO DE ALTA / EDICIÓN EXPANDIDO */}
        <form
          onSubmit={handleSubmit}
          className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#3498db]/15 text-[#3498db] flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {isEditing ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Los datos del proveedor son estrictamente confidenciales y nunca se imprimen en facturas del cliente
                </p>
              </div>
            </div>

            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Cancelar edición
              </button>
            )}
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Grid de campos más amplio y cómodo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#3498db]" />
                <span>Nombre o Razón Social *</span>
              </label>
              <Input
                placeholder="Ej. Distribuidora Tech S.A."
                value={formData.nombre_o_razon_social}
                onChange={(e) =>
                  setFormData({ ...formData, nombre_o_razon_social: e.target.value })
                }
                required
                className="h-10 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                <span>RUC / Cédula</span>
              </label>
              <Input
                placeholder="0999999999001"
                value={formData.ruc_cedula}
                onChange={(e) => setFormData({ ...formData, ruc_cedula: e.target.value })}
                className="h-10 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Teléfono / Celular</span>
              </label>
              <Input
                placeholder="0991234567 / 042123456"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="h-10 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Nombre de Contacto</span>
              </label>
              <Input
                placeholder="Ej. Ing. Carlos Gómez / Vendedor"
                value={formData.nombre_contacto}
                onChange={(e) => setFormData({ ...formData, nombre_contacto: e.target.value })}
                className="h-10 text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#3498db]" />
                <span>Número de Cuenta Bancaria / Datos de Pago</span>
              </label>
              <Input
                placeholder="Ej. Banco Pichincha Cta Corriente 2100... / Banco Guayaquil Ahorros..."
                value={formData.numero_cuenta}
                onChange={(e) => setFormData({ ...formData, numero_cuenta: e.target.value })}
                className="h-10 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {isEditing && (
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                size="sm"
                className="text-xs h-9"
              >
                Descartar
              </Button>
            )}
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-[#3498db] hover:bg-[#2980b9] text-white text-xs h-9 px-5 font-semibold shadow-md shadow-[#3498db]/20"
            >
              {isEditing ? 'Actualizar Proveedor' : 'Guardar Proveedor'}
            </Button>
          </div>
        </form>

        {/* ÁRBOL DE BÚSQUEDA Y LISTADO EXPANDIDO */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Proveedores Registrados ({trieFilteredProveedores.length}
                {trieFilteredProveedores.length !== proveedores.length && ` de ${proveedores.length}`})
              </h4>
            </div>

            {/* BARRA DE BÚSQUEDA DEL ÁRBOL */}
            <div className="w-full lg:w-96 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, RUC, teléfono, contacto, cuenta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3498db]/40 focus:border-[#3498db] shadow-inner transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5 rounded-md"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] text-slate-400 mr-1 font-medium">Filtrar:</span>
            <button
              type="button"
              onClick={() => setActiveQuickFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${activeQuickFilter === 'all'
                  ? 'bg-[#3498db] text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750'
                }`}
            >
              Todos ({proveedores.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveQuickFilter('with_ruc')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${activeQuickFilter === 'with_ruc'
                  ? 'bg-[#3498db] text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750'
                }`}
            >
              Con RUC
            </button>
            <button
              type="button"
              onClick={() => setActiveQuickFilter('with_account')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${activeQuickFilter === 'with_account'
                  ? 'bg-[#3498db] text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750'
                }`}
            >
              Con Cuenta Bancaria
            </button>
            <button
              type="button"
              onClick={() => setActiveQuickFilter('with_contact')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${activeQuickFilter === 'with_contact'
                  ? 'bg-[#3498db] text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750'
                }`}
            >
              Con Contacto
            </button>
          </div>

          {/* LISTADO EN CARDS DE ALTA VISIBILIDAD (2 columnas en pantallas amplias) */}
          <div className="max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
            {trieFilteredProveedores.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                <Truck className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {searchTerm
                    ? `No se encontraron proveedores coincidentes con "${searchTerm}" en el árbol de búsqueda.`
                    : 'No hay proveedores registrados aún.'}
                </p>
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="text-xs text-[#3498db] hover:underline font-medium"
                  >
                    Limpiar búsqueda
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {trieFilteredProveedores.map((prov) => (
                  <div
                    key={prov.id}
                    className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-[#3498db]/50 dark:hover:border-[#3498db]/40 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div>
                      {/* Cabecera del proveedor */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h5 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-[#3498db] transition-colors">
                            {prov.nombre_o_razon_social}
                          </h5>
                          {prov.ruc_cedula && (
                            <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                              <Hash className="w-3 h-3 text-slate-400" />
                              <span>RUC: {prov.ruc_cedula}</span>
                            </div>
                          )}
                        </div>

                        {onSelectProveedor && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              onSelectProveedor(prov);
                              onClose();
                            }}
                            className="bg-[#3498db] hover:bg-[#2980b9] text-white text-xs h-8 px-3 shrink-0 shadow-sm font-semibold"
                          >
                            Seleccionar
                          </Button>
                        )}
                      </div>

                      {/* Detalles del proveedor */}
                      <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                        {prov.nombre_contacto && (
                          <div className="flex items-center gap-2 truncate">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">
                              Contacto: <b className="text-slate-800 dark:text-slate-200 font-semibold">{prov.nombre_contacto}</b>
                            </span>
                          </div>
                        )}

                        {prov.telefono && (
                          <div className="flex items-center gap-2 truncate font-mono">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{prov.telefono}</span>
                          </div>
                        )}

                        {prov.numero_cuenta && (
                          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                            <div className="flex items-center gap-1.5 truncate">
                              <CreditCard className="w-3.5 h-3.5 text-[#3498db] shrink-0" />
                              <span className="truncate">{prov.numero_cuenta}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(prov.numero_cuenta || '', prov.id)}
                              title="Copiar datos de cuenta"
                              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 shrink-0 transition-colors"
                            >
                              {copiedId === prov.id ? (
                                <Check className="w-3.5 h-3.5 text-[#3498db]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Acciones de edición / eliminación */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                      <span className="text-[10px] text-slate-400 font-mono">
                        ID: {prov.id.slice(0, 8)}...
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(prov)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#3498db] hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors flex items-center gap-1 text-[11px] font-semibold"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`¿Estás seguro de eliminar al proveedor "${prov.nombre_o_razon_social}"?`)) {
                              deleteMutation.mutate(prov.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Eliminar proveedor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
