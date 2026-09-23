import React from 'react';
import { Plus } from 'lucide-react';
import { ObjectCategory } from './templateConstants';

export interface TemplateVariablesSelectorProps {
  selectedType: string;
  visibleCategories: ObjectCategory[];
  selectedObjectId: string;
  onSelectObjectId: (id: string) => void;
  activeCategory: ObjectCategory;
  onInsertTag: (tag: string) => void;
  showPreview: boolean;
}

export const TemplateVariablesSelector: React.FC<TemplateVariablesSelectorProps> = ({
  selectedType,
  visibleCategories,
  selectedObjectId,
  onSelectObjectId,
  activeCategory,
  onInsertTag,
  showPreview,
}) => {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Objetos de Datos Disponibles para{' '}
            {selectedType === 'FACTURA'
              ? 'Facturación'
              : selectedType === 'ORDEN_TRABAJO'
              ? 'Órdenes de Trabajo'
              : 'Informes Técnicos'}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Solo se muestran los objetos que hacen match con este documento:
          </p>
        </div>
        <span className="text-[10px] font-semibold uppercase px-2.5 py-1 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 self-start sm:self-auto shrink-0">
          Objeto Activo: {activeCategory.name}
        </span>
      </div>

      {/* Object Selection Pills - Responsive flex-wrap so names NEVER truncate, filtered by document */}
      <div className="flex flex-wrap items-center gap-2">
        {visibleCategories.map((cat) => {
          const IconComponent = cat.icon;
          const isSelected = cat.id === selectedObjectId;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectObjectId(cat.id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-white dark:bg-slate-800 border-[#3498db] shadow-sm ring-2 ring-[#3498db]/30 font-semibold'
                  : 'bg-white/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${cat.iconBg} ${cat.iconColor} shrink-0 shadow-xs`}>
                <IconComponent className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-[#3498db]' : 'text-slate-700 dark:text-slate-300'}`}>
                  {cat.name}
                </p>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {cat.variables.length} atributos
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Match Variables of the Active Object */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span>Atributos de {activeCategory.name}</span>
            <span className="text-[10px] font-normal text-slate-400">
              ({activeCategory.subtitle})
            </span>
          </span>
          <span className="text-[10px] text-slate-400">Clic en + para insertar</span>
        </div>

        {/* Dynamic Grid: 2 columns when preview is open, 3 or 4 columns when preview is hidden */}
        <div
          className={`grid gap-2 max-h-56 overflow-y-auto pr-1 ${
            showPreview ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
          }`}
        >
          {activeCategory.variables.map((v, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onInsertTag(v.tag)}
              title={`Insertar ${v.tag}: ${v.description}`}
              className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 hover:border-[#3498db] hover:bg-sky-50/30 dark:hover:bg-slate-800 text-left transition-all group shadow-xs"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-mono text-xs font-bold text-[#3498db] truncate">
                    {v.tag}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {v.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  Ej: {v.example}
                </p>
              </div>
              <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-400 group-hover:text-[#3498db] group-hover:bg-[#3498db]/10 transition-colors shrink-0">
                <Plus className="w-3.5 h-3.5" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
