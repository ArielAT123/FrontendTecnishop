import React, { useState } from 'react';
import {
  FileText,
  Wrench,
  ClipboardList,
  Sliders,
  Eye,
  EyeOff,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { objectCategories, allowedObjectsByDocType } from './templateConstants';
import { useTemplateLogic } from './useTemplateLogic';
import { TemplateEditorArea } from './TemplateEditorArea';
import { TemplatePreviewSimulator } from './TemplatePreviewSimulator';

export interface TemplateConfigSectionProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export const TemplateConfigSection: React.FC<TemplateConfigSectionProps> = ({
  isOpen: controlledIsOpen,
  onToggle: controlledOnToggle,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isSectionOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const toggleSection = controlledOnToggle || (() => setInternalIsOpen((v) => !v));

  const {
    selectedType,
    setSelectedType,
    currentTemplate,
    previewText,
    selectedObjectId,
    setSelectedObjectId,
    history,
    historyIndex,
    showPreview,
    setShowPreview,
    previewChannel,
    setPreviewChannel,
    isLoading,
    isSaving,
    isTesting,
    saveSuccess,
    testSuccess,
    testPhone,
    setTestPhone,
    editorRef,
    handleUndo,
    handleRedo,
    handleEditorKeyDown,
    handleEditorInput,
    handleEditorClick,
    handleInsertTag,
    fetchTemplates,
    handleSave,
    handleReset,
    handleSendTest,
  } = useTemplateLogic();

  const currentAllowedObjects = allowedObjectsByDocType[selectedType] || ['cliente', 'factura'];
  const visibleCategories = objectCategories.filter((cat) => currentAllowedObjects.includes(cat.id));
  const activeCategory =
    visibleCategories.find((cat) => cat.id === selectedObjectId) || visibleCategories[0] || objectCategories[0];

  return (
    <Card
      className={`p-6 border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 transition-all duration-200 ${
        isSectionOpen ? 'space-y-6' : 'hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Top Header */}
      <div
        onClick={toggleSection}
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none transition-colors ${
          isSectionOpen ? 'border-b border-slate-200 dark:border-slate-800 pb-4' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#3498db] text-white flex items-center justify-center shadow-md shadow-[#3498db]/20 shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Plantillas de Mensajes Automatizados
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
                Notificaciones Oficiales
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personaliza el texto y las variables dinámicas de los mensajes enviados a los clientes.
            </p>
          </div>
        </div>

        {/* Header Controls: Toggle Preview, Refresh & Accordion Chevron */}
        <div className="flex items-center gap-2 self-start sm:self-auto" onClick={(e) => e.stopPropagation()}>
          {isSectionOpen && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className={`text-xs gap-1.5 border-slate-200 dark:border-slate-700 transition-colors ${
                  showPreview
                    ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    : 'bg-sky-50 dark:bg-sky-950/40 text-[#3498db] border-[#3498db]/40 font-semibold'
                }`}
                title={showPreview ? 'Ocultar panel de vista previa' : 'Mostrar panel de vista previa'}
              >
                {showPreview ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                    <span>Ocultar Vista Previa</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-[#3498db]" />
                    <span>Mostrar Vista Previa</span>
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchTemplates}
                disabled={isLoading}
                className="text-xs gap-1.5 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Recargar</span>
              </Button>
            </>
          )}

          <button
            type="button"
            onClick={toggleSection}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
            title={isSectionOpen ? 'Ocultar sección' : 'Expandir sección'}
          >
            <ChevronDown
              className={`w-5 h-5 transition-transform duration-200 ${
                isSectionOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Body Content - Hidden by default */}
      <div style={{ display: isSectionOpen ? 'block' : 'none' }} className="space-y-6 animate-fadeIn">
        {/* Document Type Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => setSelectedType('FACTURA')}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
              selectedType === 'FACTURA'
                ? 'bg-[#3498db] text-white border-[#3498db] shadow-md shadow-[#3498db]/20 font-semibold'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#3498db]/40'
            }`}
          >
            <div
              className={`p-2 rounded-lg ${
                selectedType === 'FACTURA'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}
            >
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider opacity-80">Facturación</p>
              <p className="text-sm font-bold">Factura de Venta</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedType('ORDEN_TRABAJO')}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
              selectedType === 'ORDEN_TRABAJO'
                ? 'bg-[#3498db] text-white border-[#3498db] shadow-md shadow-[#3498db]/20 font-semibold'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#3498db]/40'
            }`}
          >
            <div
              className={`p-2 rounded-lg ${
                selectedType === 'ORDEN_TRABAJO'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}
            >
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider opacity-80">Taller / Recepción</p>
              <p className="text-sm font-bold">Orden de Trabajo</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedType('INFORME_TECNICO')}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
              selectedType === 'INFORME_TECNICO'
                ? 'bg-[#3498db] text-white border-[#3498db] shadow-md shadow-[#3498db]/20 font-semibold'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#3498db]/40'
            }`}
          >
            <div
              className={`p-2 rounded-lg ${
                selectedType === 'INFORME_TECNICO'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider opacity-80">Diagnóstico</p>
              <p className="text-sm font-bold">Informe Técnico</p>
            </div>
          </button>
        </div>

        {/* Main Grid: Dynamically switches between 1 column (Full Width) or 2 columns (Split) */}
        <div className={`grid grid-cols-1 ${showPreview ? 'lg:grid-cols-12 gap-6' : 'gap-6'}`}>
          <TemplateEditorArea
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            currentTemplate={currentTemplate}
            historyIndex={historyIndex}
            historyLength={history.length}
            onUndo={handleUndo}
            onRedo={handleRedo}
            editorRef={editorRef}
            onEditorInput={handleEditorInput}
            onEditorKeyDown={handleEditorKeyDown}
            onEditorClick={handleEditorClick}
            visibleCategories={visibleCategories}
            selectedObjectId={selectedObjectId}
            onSelectObjectId={setSelectedObjectId}
            activeCategory={activeCategory}
            onInsertTag={handleInsertTag}
            isSaving={isSaving}
            saveSuccess={saveSuccess}
            onSave={handleSave}
            onReset={handleReset}
            showPreview={showPreview}
          />

          {showPreview && (
            <TemplatePreviewSimulator
              previewChannel={previewChannel}
              setPreviewChannel={setPreviewChannel}
              selectedType={selectedType}
              previewText={previewText}
              testPhone={testPhone}
              setTestPhone={setTestPhone}
              isTesting={isTesting}
              testSuccess={testSuccess}
              onSendTest={handleSendTest}
            />
          )}
        </div>
      </div>
    </Card>
  );
};
