import React from 'react';
import {
  FileText,
  Wrench,
  ClipboardList,
  Undo2,
  Redo2,
  Save,
  Check,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { ObjectCategory } from './templateConstants';
import { TemplateVariablesSelector } from './TemplateVariablesSelector';

export interface TemplateEditorAreaProps {
  selectedType: string;
  setSelectedType: (type: string) => void;
  currentTemplate: string;
  historyIndex: number;
  historyLength: number;
  onUndo: () => void;
  onRedo: () => void;
  editorRef: React.RefObject<any>;
  onEditorInput: () => void;
  onEditorKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onEditorClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  visibleCategories: ObjectCategory[];
  selectedObjectId: string;
  onSelectObjectId: (id: string) => void;
  activeCategory: ObjectCategory;
  onInsertTag: (tag: string) => void;
  isSaving: boolean;
  saveSuccess: boolean;
  onSave: () => void;
  onReset: () => void;
  showPreview: boolean;
}

export const TemplateEditorArea: React.FC<TemplateEditorAreaProps> = ({
  selectedType,
  setSelectedType,
  currentTemplate,
  historyIndex,
  historyLength,
  onUndo,
  onRedo,
  editorRef,
  onEditorInput,
  onEditorKeyDown,
  onEditorClick,
  visibleCategories,
  selectedObjectId,
  onSelectObjectId,
  activeCategory,
  onInsertTag,
  isSaving,
  saveSuccess,
  onSave,
  onReset,
  showPreview,
}) => {
  return (
    <div className={`space-y-4 ${showPreview ? 'lg:col-span-7' : 'w-full'}`}>
      {/* Editor Header: Title + Undo / Redo controls + Character count */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Plantilla Interactiva con Tags ({selectedType})
          </label>

          {/* Undo / Redo Buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onUndo}
              disabled={historyIndex <= 0}
              className="p-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Deshacer (Ctrl + Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={historyIndex >= historyLength - 1}
              className="p-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Rehacer (Ctrl + Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <span className="text-[11px] text-slate-400 font-mono">
          {currentTemplate.length} caracteres
        </span>
      </div>

      {/* ATOMIC TAG CONTENTEDITABLE CANVAS: Backspace removes entire tag, supports typing and Ctrl+Z / Ctrl+Y */}
      <div className="space-y-1">
        <div
          ref={editorRef}
          contentEditable
          onInput={onEditorInput}
          onKeyDown={onEditorKeyDown}
          onClick={onEditorClick}
          data-placeholder="Escribe tu mensaje aquí o haz clic en las variables de los objetos inferiores para insertarlas..."
          className="w-full p-4 rounded-xl min-h-[160px] max-h-[250px] overflow-y-auto bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs sm:text-sm leading-relaxed shadow-inner focus:outline-none focus:border-[#3498db] transition-all cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:italic"
        />
        <p className="text-[11px] text-slate-400 flex items-center justify-between">
          <span>Puedes escribir libremente. Presionar <strong>Backspace</strong> en una variable la borrará de forma completa.</span>
          <span className="font-mono text-[10px]">Ctrl+Z / Ctrl+Y</span>
        </p>
      </div>

      {/* OBJECT-BASED MATCH VARIABLES SECTION - Filtered strictly by document type */}
      <TemplateVariablesSelector
        selectedType={selectedType}
        visibleCategories={visibleCategories}
        selectedObjectId={selectedObjectId}
        onSelectObjectId={onSelectObjectId}
        activeCategory={activeCategory}
        onInsertTag={onInsertTag}
        showPreview={showPreview}
      />

      {/* Actions Bar */}
      <div className="flex items-center gap-3 pt-1">
        <Button
          onClick={onSave}
          disabled={isSaving}
          className="bg-[#3498db] hover:bg-[#2980b9] text-white font-semibold text-xs gap-1.5 shadow-md shadow-[#3498db]/20"
        >
          {saveSuccess ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>Plantilla Guardada con Éxito</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-white" />
              <span>{isSaving ? 'Guardando...' : 'Guardar Plantilla'}</span>
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="text-xs gap-1 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Restablecer</span>
        </Button>
      </div>
    </div>
  );
};
