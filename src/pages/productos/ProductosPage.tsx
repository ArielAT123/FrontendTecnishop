import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { api } from '../../api/client';
import { Producto } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import {
  Package,
  PlusCircle,
  FileSpreadsheet,
  Search,
  Upload,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Tag,
  Hash,
} from 'lucide-react';

export const ProductosPage: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Producto>>({
    codigo: '',
    nombre: '',
    cantidad: 0,
    costo_compra: 0,
    precio_venta_sugerido: 0,
    precio_venta_recomendado: 0,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { data: productos = [], isLoading, isSyncing } = useCachedQuery<Producto[]>({
    queryKey: ['productos'],
    queryFn: api.getProductos,
    keyField: 'codigo',
  });

  const createMutation = useMutation({
    mutationFn: api.createProducto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Error al guardar el producto');
    },
  });

  const excelMutation = useMutation({
    mutationFn: (file: File) => api.uploadExcel(file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      setUploadStatus({
        type: 'success',
        message: `Importación exitosa: ${data.productos_creados} creados, ${data.productos_actualizados} actualizados.`,
      });
    },
    onError: (err: any) => {
      setUploadStatus({
        type: 'error',
        message: err?.response?.data?.error || err.message || 'Error al procesar el archivo Excel',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      cantidad: 0,
      costo_compra: 0,
      precio_venta_sugerido: 0,
      precio_venta_recomendado: 0,
    });
    setFormError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadStatus(null);
      excelMutation.mutate(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.codigo?.trim() || !formData.nombre?.trim()) {
      setFormError('El código y el nombre del producto son obligatorios');
      return;
    }
    createMutation.mutate(formData);
  };

  const filteredProductos = productos.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.codigo?.toLowerCase().includes(term) ||
      p.nombre?.toLowerCase().includes(term) ||
      p.descripcion?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Header with Search and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Buscar por código o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls"
            className="hidden"
          />
          <Button
            variant="outline"
            leftIcon={<Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            onClick={() => fileInputRef.current?.click()}
            isLoading={excelMutation.isPending}
            className="border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
          >
            Importar Excel
          </Button>

          <Button
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="shadow-sm"
          >
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Upload Notification Banner */}
      {uploadStatus && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium animate-fadeIn ${
            uploadStatus.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {uploadStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{uploadStatus.message}</span>
          </div>
          <button
            onClick={() => setUploadStatus(null)}
            className="text-xs font-bold underline hover:opacity-80"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Products Table Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Inventario ({filteredProductos.length} artículos)</span>
            {isSyncing && (
              <span className="text-[10px] font-normal text-[#3498db] animate-pulse bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                Sincronizando en segundo plano...
              </span>
            )}
          </h3>
        </div>

        {isLoading && filteredProductos.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">Cargando inventario...</div>
        ) : filteredProductos.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            {searchTerm ? 'No se encontraron productos coincidentes.' : 'El catálogo está vacío.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="pb-3 pl-2">Código</th>
                  <th className="pb-3">Descripción / Artículo</th>
                  <th className="pb-3 text-center">Stock</th>
                  <th className="pb-3 text-right">Costo</th>
                  <th className="pb-3 text-right">PVP Sugerido</th>
                  <th className="pb-3 pr-2 text-right">PVP Recomendado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredProductos.map((prod) => (
                  <tr key={prod.id || prod.codigo} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 pl-2 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {prod.codigo}
                    </td>
                    <td className="py-3 text-slate-900 dark:text-slate-100 font-semibold">
                      {prod.nombre}
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          prod.cantidad > 5
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : prod.cantidad > 0
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                        }`}
                      >
                        {prod.cantidad} uds
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      ${Number(prod.costo_compra || 0).toFixed(2)}
                    </td>
                    <td className="py-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                      ${Number(prod.precio_venta_sugerido || 0).toFixed(2)}
                    </td>
                    <td className="py-3 pr-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ${Number(prod.precio_venta_recomendado || prod.precio_venta_sugerido || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Crear Producto */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Artículo en Inventario"
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
              Código Único *
            </label>
            <Input
              placeholder="MEM-DDR4-8GB"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              leftIcon={<Hash className="w-4 h-4" />}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Nombre / Descripción *
            </label>
            <Input
              placeholder="Memoria RAM Kingston 8GB 3200MHz"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              leftIcon={<Tag className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Stock Inicial
              </label>
              <Input
                type="number"
                min="0"
                value={formData.cantidad}
                onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Costo Compra ($)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.costo_compra}
                onChange={(e) => setFormData({ ...formData, costo_compra: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                PVP Venta ($)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.precio_venta_sugerido}
                onChange={(e) => setFormData({ ...formData, precio_venta_sugerido: parseFloat(e.target.value) || 0 })}
              />
            </div>
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
              Guardar Artículo
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
