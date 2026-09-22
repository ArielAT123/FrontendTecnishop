import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Laptop,
  Wrench,
  ClipboardList,
  Receipt,
  Save,
  RotateCcw,
  Check,
  RefreshCw,
  Send,
  FileText,
  Sliders,
  Plus,
  Eye,
  EyeOff,
  Mail,
  Undo2,
  Redo2,
  Lock,
  ChevronDown,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { WhatsAppIcon } from '../common/WhatsAppIcon';

interface VariableItem {
  tag: string;
  name: string;
  description: string;
  example: string;
}

interface ObjectCategory {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  tagColorClass: string;
  variables: VariableItem[];
}

interface TemplateItem {
  id: string;
  eventType: string;
  channel: string;
  title: string;
  description: string | null;
  subject: string | null;
  bodyTemplate: string;
  isActive: boolean;
}

const MESSAGE_SERVER_URL =
  (import.meta as any).env?.VITE_MESSAGE_SERVER_URL || 'http://localhost:5052';

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

  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selectedType, setSelectedType] = useState<string>('FACTURA');
  const [currentTemplate, setCurrentTemplate] = useState<string>('');
  const [previewText, setPreviewText] = useState<string>('');
  const [selectedObjectId, setSelectedObjectId] = useState<string>('factura');

  // History for Undo (Ctrl+Z) and Redo (Ctrl+Y)
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // View states
  const [showPreview, setShowPreview] = useState<boolean>(true);
  const [previewChannel, setPreviewChannel] = useState<'whatsapp' | 'email'>('whatsapp');

  // Network states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState<string>('0990939856');

  // Ref to the ContentEditable visual editor
  const editorRef = useRef<HTMLDivElement>(null);

  // Sample data dictionary for rendering live previews
  const sampleData: Record<string, any> = {
    cliente_nombre: 'Ariel Arias',
    cliente_cedula: '0932665565',
    cliente_telefono: '0990939856',
    cliente_correo: 'ariel.arias@gmail.com',
    cliente_direccion: 'Cdla. Cóndor Mz. G Villa 13',
    factura_numero: 'FAC-000006',
    orden_id: 'ORD-2026-09-20-0001',
    costo_estimado: '25.00',
    estado_orden: 'LISTO PARA ENTREGA',
    equipo_marca: 'HP',
    equipo_modelo: 'Pro Model',
    maquina_modelo: 'Pro Model',
    equipo_serie: 'L12-123lKAF',
    problema_reportado: 'Mantenimiento preventivo y formateo',
    diagnostico: 'Cabezal tapado y cable de alimentación defectuoso',
    solucion: 'Limpieza ultrasónica de inyectores y reemplazo de cable AC',
    persona_a_cargo: 'Ing. Técnico Especialista',
    precio_chequeo: '10.00',
    total: '45.00',
    subtotal: '40.18',
    iva: '4.82',
    fecha: new Date().toLocaleDateString('es-EC'),
  };

  // Structured Objects with distinct icon colors to differentiate them
  const objectCategories: ObjectCategory[] = [
    {
      id: 'cliente',
      name: 'Cliente',
      subtitle: 'Datos de la persona o empresa',
      icon: User,
      iconColor: 'text-sky-500',
      iconBg: 'bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/50',
      tagColorClass:
        'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800',
      variables: [
        {
          tag: '{{cliente_nombre}}',
          name: 'Nombre Completo',
          description: 'Nombre y apellido o razón social registrada',
          example: 'Ariel Arias',
        },
        {
          tag: '{{cliente_cedula}}',
          name: 'Cédula / RUC',
          description: 'Documento de identidad o RUC',
          example: '0932665565',
        },
        {
          tag: '{{cliente_telefono}}',
          name: 'Teléfono / WhatsApp',
          description: 'Número de contacto principal',
          example: '0990939856',
        },
        {
          tag: '{{cliente_correo}}',
          name: 'Correo Electrónico',
          description: 'Dirección de correo electrónico',
          example: 'ariel.arias@gmail.com',
        },
        {
          tag: '{{cliente_direccion}}',
          name: 'Dirección',
          description: 'Domicilio o ubicación registrada',
          example: 'Cdla. Cóndor Mz. G Villa 13',
        },
      ],
    },
    {
      id: 'equipo',
      name: 'Equipo',
      subtitle: 'Dispositivo y especificaciones',
      icon: Laptop,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50',
      tagColorClass:
        'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      variables: [
        {
          tag: '{{equipo_marca}}',
          name: 'Marca del Equipo',
          description: 'Fabricante del dispositivo (HP, Epson, etc.)',
          example: 'HP',
        },
        {
          tag: '{{equipo_modelo}}',
          name: 'Modelo de Máquina',
          description: 'Modelo o referencia del equipo',
          example: 'Pro Model',
        },
        {
          tag: '{{equipo_serie}}',
          name: 'Número de Serie',
          description: 'Serial identificativo único de fábrica',
          example: 'L12-123lKAF',
        },
        {
          tag: '{{problema_reportado}}',
          name: 'Problema Reportado',
          description: 'Falla o motivo manifestado por el cliente',
          example: 'Mantenimiento preventivo y formateo',
        },
      ],
    },
    {
      id: 'orden',
      name: 'Orden de Trabajo',
      subtitle: 'Recepción y estado de taller',
      icon: Wrench,
      iconColor: 'text-indigo-500',
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50',
      tagColorClass:
        'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
      variables: [
        {
          tag: '{{orden_id}}',
          name: 'Número de Orden',
          description: 'Identificador secuencial de la orden de servicio',
          example: 'ORD-2026-09-20-0001',
        },
        {
          tag: '{{costo_estimado}}',
          name: 'Presupuesto Inicial',
          description: 'Monto preliminar estimado de reparación',
          example: '25.00',
        },
        {
          tag: '{{estado_orden}}',
          name: 'Estado de la Orden',
          description: 'Estado actual del equipo en taller',
          example: 'LISTO PARA ENTREGA',
        },
        {
          tag: '{{fecha}}',
          name: 'Fecha de Recepción',
          description: 'Fecha en la que ingresó el equipo',
          example: '22/09/2026',
        },
      ],
    },
    {
      id: 'ficha',
      name: 'Ficha Técnica',
      subtitle: 'Diagnóstico y trabajos realizados',
      icon: ClipboardList,
      iconColor: 'text-teal-500',
      iconBg: 'bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/50',
      tagColorClass:
        'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-800',
      variables: [
        {
          tag: '{{diagnostico}}',
          name: 'Diagnóstico Técnico',
          description: 'Resultado de la revisión de componentes y fallas',
          example: 'Cabezal tapado y cable de alimentación defectuoso',
        },
        {
          tag: '{{solucion}}',
          name: 'Solución Aplicada',
          description: 'Detalle de servicios, limpiezas o repuestos cambiados',
          example: 'Limpieza ultrasónica de inyectores y reemplazo de cable AC',
        },
        {
          tag: '{{persona_a_cargo}}',
          name: 'Técnico Especialista',
          description: 'Nombre del técnico que realizó la revisión',
          example: 'Ing. Técnico Especialista',
        },
        {
          tag: '{{precio_chequeo}}',
          name: 'Precio de Chequeo',
          description: 'Valor del servicio de diagnóstico técnico',
          example: '10.00',
        },
        {
          tag: '{{total}}',
          name: 'Total Liquidado',
          description: 'Monto final acumulado de la ficha técnica',
          example: '45.00',
        },
      ],
    },
    {
      id: 'factura',
      name: 'Factura',
      subtitle: 'Comprobante y valores de cobro',
      icon: Receipt,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50',
      tagColorClass:
        'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800',
      variables: [
        {
          tag: '{{factura_numero}}',
          name: 'Número de Factura',
          description: 'Número secuencial oficial del comprobante',
          example: 'FAC-000006',
        },
        {
          tag: '{{total}}',
          name: 'Total a Pagar',
          description: 'Monto total final cobrado al cliente',
          example: '45.00',
        },
        {
          tag: '{{subtotal}}',
          name: 'Subtotal',
          description: 'Base imponible antes de impuestos',
          example: '40.18',
        },
        {
          tag: '{{iva}}',
          name: 'Impuesto IVA',
          description: 'Valor correspondiente al impuesto',
          example: '4.82',
        },
        {
          tag: '{{fecha}}',
          name: 'Fecha de Emisión',
          description: 'Fecha oficial de emisión de la factura',
          example: '22/09/2026',
        },
      ],
    },
  ];

  // Map: tag -> metadata for fast lookup
  const tagMetadataMap: Record<
    string,
    { objectName: string; variableName: string; tagColorClass: string; icon: React.ComponentType<{ className?: string }> }
  > = {};

  objectCategories.forEach((cat) => {
    cat.variables.forEach((v) => {
      tagMetadataMap[v.tag] = {
        objectName: cat.name,
        variableName: v.name,
        tagColorClass: cat.tagColorClass,
        icon: cat.icon,
      };
    });
  });
  tagMetadataMap['{{maquina_modelo}}'] = {
    objectName: 'Equipo',
    variableName: 'Modelo de Máquina',
    tagColorClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    icon: Laptop,
  };

  // STRICT FILTER: Objects allowed per document type to avoid backend mismatch errors
  const allowedObjectsByDocType: Record<string, string[]> = {
    FACTURA: ['cliente', 'factura'],
    ORDEN_TRABAJO: ['cliente', 'equipo', 'orden'],
    INFORME_TECNICO: ['cliente', 'equipo', 'orden', 'ficha'],
  };

  const currentAllowedObjects = allowedObjectsByDocType[selectedType] || ['cliente', 'factura'];
  const visibleCategories = objectCategories.filter((cat) => currentAllowedObjects.includes(cat.id));

  // Helper: Convert template string to ContentEditable HTML with atomic tags
  const templateToHtml = (template: string): string => {
    if (!template) return '';
    const parts = template.split(/(\{\{[\w.]+\}\})/g);
    return parts
      .map((part) => {
        if (part.startsWith('{{') && part.endsWith('}}')) {
          const meta = tagMetadataMap[part];
          const objName = meta?.objectName || 'Variable';
          const varName = meta?.variableName || part.replace(/[{}]/g, '');
          const colorClass = meta?.tagColorClass || 'bg-slate-100 text-slate-700 border-slate-300';
          return `<span contenteditable="false" data-tag="${part}" class="inline-flex items-center gap-1 px-2.5 py-0.5 mx-1 my-0.5 rounded-md text-xs font-semibold border select-none ${colorClass}" style="vertical-align: middle;">
            <span class="font-bold">${objName}:</span>
            <span>${varName}</span>
            <span role="button" tabindex="0" data-remove-tag="true" class="ml-1 text-slate-400 hover:text-rose-600 font-bold cursor-pointer" title="Eliminar variable">&times;</span>
          </span>`;
        }
        return part
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>');
      })
      .join('');
  };

  // Helper: Parse ContentEditable DOM back to canonical template string
  const domToTemplate = (el: HTMLElement): string => {
    let result = '';
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent || '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const elem = node as HTMLElement;
        if (elem.dataset && elem.dataset.tag) {
          result += elem.dataset.tag;
        } else if (elem.tagName === 'BR') {
          result += '\n';
        } else if (elem.tagName === 'DIV' || elem.tagName === 'P') {
          if (result.length > 0 && !result.endsWith('\n')) {
            result += '\n';
          }
          elem.childNodes.forEach(walk);
        } else {
          elem.childNodes.forEach(walk);
        }
      }
    };
    el.childNodes.forEach(walk);
    return result;
  };

  // Push new template state to Undo/Redo history
  const pushHistory = (newVal: string) => {
    setHistory((prev) => {
      if (historyIndex >= 0 && prev[historyIndex] === newVal) return prev;
      const sliced = prev.slice(0, historyIndex + 1);
      const updated = [...sliced, newVal];
      setHistoryIndex(updated.length - 1);
      return updated;
    });
  };

  // Perform Undo (Ctrl+Z)
  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      const targetVal = history[nextIndex];
      setHistoryIndex(nextIndex);
      setCurrentTemplate(targetVal);
      renderPreview(targetVal);
      if (editorRef.current) {
        editorRef.current.innerHTML = templateToHtml(targetVal);
      }
    }
  };

  // Perform Redo (Ctrl+Y)
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const targetVal = history[nextIndex];
      setHistoryIndex(nextIndex);
      setCurrentTemplate(targetVal);
      renderPreview(targetVal);
      if (editorRef.current) {
        editorRef.current.innerHTML = templateToHtml(targetVal);
      }
    }
  };

  // Intercept keyboard events for Ctrl+Z and Ctrl+Y
  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        handleRedo();
        return;
      }
    }
  };

  // Handle direct text changes inside the ContentEditable box
  const handleEditorInput = () => {
    if (!editorRef.current) return;
    const newTemplate = domToTemplate(editorRef.current);
    setCurrentTemplate(newTemplate);
    renderPreview(newTemplate);
    pushHistory(newTemplate);
  };

  // Handle click on delete "×" icon inside tags
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target && target.dataset && target.dataset.removeTag) {
      const tagSpan = target.closest('[data-tag]');
      if (tagSpan) {
        tagSpan.remove();
        handleEditorInput();
      }
    }
  };

  // Insert tag at current cursor position (or append)
  const handleInsertTag = (tag: string) => {
    const meta = tagMetadataMap[tag];
    const objName = meta?.objectName || 'Variable';
    const varName = meta?.variableName || tag.replace(/[{}]/g, '');
    const colorClass = meta?.tagColorClass || 'bg-slate-100 text-slate-700 border-slate-300';

    const tagSpan = document.createElement('span');
    tagSpan.contentEditable = 'false';
    tagSpan.dataset.tag = tag;
    tagSpan.className = `inline-flex items-center gap-1 px-2.5 py-0.5 mx-1 my-0.5 rounded-md text-xs font-semibold border select-none ${colorClass}`;
    tagSpan.style.verticalAlign = 'middle';
    tagSpan.innerHTML = `<span class="font-bold">${objName}:</span><span>${varName}</span><span role="button" tabindex="0" data-remove-tag="true" class="ml-1 text-slate-400 hover:text-rose-600 font-bold cursor-pointer" title="Eliminar variable">&times;</span>`;

    const el = editorRef.current;
    if (!el) return;

    el.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(tagSpan);

      // Trailing space for continued typing
      const space = document.createTextNode(' ');
      range.setStartAfter(tagSpan);
      range.insertNode(space);
      range.setStartAfter(space);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      el.appendChild(tagSpan);
      el.appendChild(document.createTextNode(' '));
    }

    handleEditorInput();
  };

  // Fetch templates from message_event_server
  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${MESSAGE_SERVER_URL}/api/v1/templates`);
      if (res.ok) {
        const data = await res.json();
        if (data.templates && Array.isArray(data.templates)) {
          setTemplates(data.templates);
          const initial = data.templates.find((t: TemplateItem) => t.eventType === selectedType);
          if (initial) {
            setCurrentTemplate(initial.bodyTemplate);
            renderPreview(initial.bodyTemplate);
            setHistory([initial.bodyTemplate]);
            setHistoryIndex(0);
            if (editorRef.current) {
              editorRef.current.innerHTML = templateToHtml(initial.bodyTemplate);
            }
          }
        }
      }
    } catch (err) {
      console.error('[TEMPLATES LOAD ERROR]', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Update editor and auto-select valid object when user changes document type
  useEffect(() => {
    const tpl = templates.find((t) => t.eventType === selectedType);
    if (tpl) {
      setCurrentTemplate(tpl.bodyTemplate);
      renderPreview(tpl.bodyTemplate);
      setHistory([tpl.bodyTemplate]);
      setHistoryIndex(0);
      if (editorRef.current) {
        editorRef.current.innerHTML = templateToHtml(tpl.bodyTemplate);
      }
    }

    // Auto-select valid object for this document type
    const validObjects = allowedObjectsByDocType[selectedType] || ['cliente'];
    if (!validObjects.includes(selectedObjectId)) {
      setSelectedObjectId(validObjects[validObjects.length - 1] || validObjects[0]);
    }
  }, [selectedType, templates]);

  // Client-side instant live preview simulation
  const renderPreview = (text: string) => {
    if (!text) {
      setPreviewText('');
      return;
    }
    let rendered = text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
      const cleanKey = key.trim();
      return sampleData[cleanKey] !== undefined ? String(sampleData[cleanKey]) : `[${cleanKey}]`;
    });
    setPreviewText(rendered);
  };

  // Save template to message_event_server
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`${MESSAGE_SERVER_URL}/api/v1/templates/${selectedType}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bodyTemplate: currentTemplate }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        setTemplates((prev) =>
          prev.map((t) => (t.eventType === selectedType ? { ...t, bodyTemplate: currentTemplate } : t))
        );
      }
    } catch (err) {
      console.error('[TEMPLATE SAVE ERROR]', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Send real live test to phone
  const handleSendTest = async () => {
    setIsTesting(true);
    setTestSuccess(null);
    try {
      const res = await fetch(`${MESSAGE_SERVER_URL}/api/v1/documents/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          recipient: testPhone,
          data: sampleData,
        }),
      });
      if (res.ok) {
        setTestSuccess(`Mensaje enviado exitosamente a WhatsApp (+593 ${testPhone.slice(1)})`);
        setTimeout(() => setTestSuccess(null), 4000);
      } else {
        const err = await res.json().catch(() => ({}));
        setTestSuccess(`Error: ${err.error || 'No se pudo enviar el mensaje de prueba'}`);
      }
    } catch (err: any) {
      setTestSuccess(`Error de conexión: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  // Active category (strictly guaranteed to be visible in current document)
  const activeCategory =
    visibleCategories.find((cat) => cat.id === selectedObjectId) || visibleCategories[0] || objectCategories[0];

  // Subject title for Email Preview
  const emailSubjects: Record<string, string> = {
    FACTURA: `Factura de Venta Tecnishop ${sampleData.factura_numero}`,
    ORDEN_TRABAJO: `Comprobante de Orden de Servicio ${sampleData.orden_id} - Tecnishop`,
    INFORME_TECNICO: `Informe Técnico Oficial - Equipo ${sampleData.equipo_marca} ${sampleData.equipo_modelo}`,
  };

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

      {/* Document Type Selector Tabs (Celeste claro del proyecto #3498db) */}
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
        {/* Left Column: Visual Tag Editor & Contextual Object Variables */}
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
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="p-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Deshacer (Ctrl + Z)"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
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
              onInput={handleEditorInput}
              onKeyDown={handleEditorKeyDown}
              onClick={handleEditorClick}
              data-placeholder="Escribe tu mensaje aquí o haz clic en las variables de los objetos inferiores para insertarlas..."
              className="w-full p-4 rounded-xl min-h-[160px] max-h-[250px] overflow-y-auto bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs sm:text-sm leading-relaxed shadow-inner focus:outline-none focus:border-[#3498db] transition-all cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:italic"
            />
            <p className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Puedes escribir libremente. Presionar <strong>Backspace</strong> en una variable la borrará de forma completa.</span>
              <span className="font-mono text-[10px]">Ctrl+Z / Ctrl+Y</span>
            </p>
          </div>

          {/* OBJECT-BASED MATCH VARIABLES SECTION - Filtered strictly by document type */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Objetos de Datos Disponibles para {selectedType === 'FACTURA' ? 'Facturación' : selectedType === 'ORDEN_TRABAJO' ? 'Órdenes de Trabajo' : 'Informes Técnicos'}
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
                    onClick={() => setSelectedObjectId(cat.id)}
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
                    onClick={() => handleInsertTag(v.tag)}
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

          {/* Actions Bar */}
          <div className="flex items-center gap-3 pt-1">
            <Button
              onClick={handleSave}
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
              onClick={() => {
                const def = templates.find((t) => t.eventType === selectedType);
                if (def) {
                  setCurrentTemplate(def.bodyTemplate);
                  renderPreview(def.bodyTemplate);
                  setHistory([def.bodyTemplate]);
                  setHistoryIndex(0);
                  if (editorRef.current) {
                    editorRef.current.innerHTML = templateToHtml(def.bodyTemplate);
                  }
                }
              }}
              className="text-xs gap-1 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Restablecer</span>
            </Button>
          </div>
        </div>

        {/* Right Column: Multi-Channel Live Preview (WhatsApp & Correo Electrónico) */}
        {showPreview && (
          <div className="space-y-3 lg:col-span-5 animate-fadeIn">
            {/* Preview Toolbar: Channel Switcher (WhatsApp vs Email) */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setPreviewChannel('whatsapp')}
                  className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
                    previewChannel === 'whatsapp'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewChannel('email')}
                  className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
                    previewChannel === 'email'
                      ? 'bg-white dark:bg-slate-700 text-[#3498db] shadow-xs font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Correo Electrónico</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-500 font-medium">
                Datos: {sampleData.cliente_nombre}
              </span>
            </div>

            {/* CHANNEL 1: WHATSAPP SIMULATOR */}
            {previewChannel === 'whatsapp' && (
              <div className="rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-[#efeae2] dark:bg-[#0b141a] p-4 min-h-[380px] flex flex-col justify-between shadow-lg relative overflow-hidden animate-fadeIn">
                {/* WhatsApp Chat Header */}
                <div className="flex items-center gap-2 pb-3 mb-3 border-b border-black/10 dark:border-white/10">
                  <div className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center text-white text-[11px] font-bold">
                    T
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Tecnishop Oficial</p>
                    <p className="text-[10px] text-[#25D366] font-medium">En línea</p>
                  </div>
                </div>

                {/* Chat Bubble */}
                <div className="space-y-2 flex-1">
                  <div className="max-w-[94%] bg-white dark:bg-[#202c33] text-slate-900 dark:text-slate-100 p-3.5 rounded-2xl rounded-tl-none shadow-sm space-y-2 border border-slate-200/50 dark:border-none">
                    {/* PDF Attachment representation */}
                    <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-100 dark:bg-[#111b21] border border-slate-200 dark:border-slate-700 text-xs">
                      <div className="p-1.5 rounded-md bg-rose-500 text-white">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[11px] truncate">
                          {selectedType.toLowerCase()}_{sampleData.factura_numero || sampleData.orden_id}.pdf
                        </p>
                        <p className="text-[9px] text-slate-400">Documento Oficial &bull; PDF</p>
                      </div>
                    </div>

                    {/* Rendered Text */}
                    <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-line break-words text-slate-800 dark:text-slate-100">
                      {previewText || 'El mensaje aparecerá aquí en tiempo real mientras escribes...'}
                    </p>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Test Send to Real Phone - Only WhatsApp elements are green */}
                <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center gap-2">
                  <div className="flex items-center gap-1.5 w-full sm:w-auto flex-1">
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium shrink-0">
                      Probar envío a:
                    </span>
                    <input
                      type="text"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="0990939856"
                      className="w-full px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#25D366] font-mono"
                    />
                  </div>

                  <Button
                    size="sm"
                    onClick={handleSendTest}
                    disabled={isTesting || !testPhone}
                    className="w-full sm:w-auto bg-[#25D366] hover:bg-[#20ba59] text-white text-xs gap-1.5 shrink-0 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5 text-white" />
                    <span>{isTesting ? 'Enviando...' : 'Enviar Prueba'}</span>
                  </Button>
                </div>

                {testSuccess && (
                  <p
                    className={`text-[11px] mt-1 text-center font-medium ${
                      testSuccess.startsWith('Error') ? 'text-rose-500' : 'text-[#25D366]'
                    }`}
                  >
                    {testSuccess}
                  </p>
                )}
              </div>
            )}

            {/* CHANNEL 2: EMAIL CLIENT SIMULATOR */}
            {previewChannel === 'email' && (
              <div className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 p-3 min-h-[380px] flex flex-col justify-between shadow-lg relative overflow-hidden animate-fadeIn">
                {/* Email Client Top Bar */}
                <div className="space-y-1.5 pb-2.5 mb-2.5 border-b border-slate-200 dark:border-slate-800 text-[11px]">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Asunto:
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[240px]">
                      {emailSubjects[selectedType] || 'Notificación Oficial Tecnishop'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 text-[10px]">
                    <span>De: <strong className="text-slate-700 dark:text-slate-300">Tecnishop Taller</strong> &lt;notificaciones@tecnishop.com&gt;</span>
                    <span>Para: <strong className="text-slate-700 dark:text-slate-300">{sampleData.cliente_nombre}</strong></span>
                  </div>
                </div>

                {/* Email Body Card */}
                <div className="flex-1 bg-white dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-xs shadow-xs space-y-3.5">
                  {/* Email Brand Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[#3498db] text-white flex items-center justify-center font-bold text-xs">
                        T
                      </div>
                      <span className="font-extrabold text-sm tracking-wider text-slate-900 dark:text-slate-100">
                        TECNISHOP
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date().toLocaleDateString('es-EC')}
                    </span>
                  </div>

                  {/* Rendered Email Content */}
                  <div className="space-y-2 text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line text-xs">
                    {previewText || 'El contenido del correo electrónico se generará aquí en tiempo real...'}
                  </div>

                  {/* Attached PDF Card */}
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-md bg-rose-500 text-white shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[11px] text-slate-800 dark:text-slate-200 truncate">
                          {selectedType.toLowerCase()}_{sampleData.factura_numero || sampleData.orden_id}.pdf
                        </p>
                        <p className="text-[10px] text-slate-400">Comprobante Adjunto (142 KB)</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#3498db] border border-[#3498db]/30 px-2 py-1 rounded bg-[#3498db]/10 shrink-0">
                      Descargar PDF
                    </span>
                  </div>

                  {/* Footer Notice */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 text-center">
                    Este es un correo automático oficial emitido por Tecnishop Taller Especializado.
                  </div>
                </div>

                <div className="mt-2 text-center text-[10px] text-slate-400">
                  Vista previa de plantilla para canal de correo SMTP
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </Card>
  );
};
