import React, { useState, useEffect, useRef } from 'react';
import {
  TemplateItem,
  MESSAGE_SERVER_URL,
  sampleData,
  tagMetadataMap,
  allowedObjectsByDocType,
  templateToHtml,
  domToTemplate,
} from './templateConstants';

export const useTemplateLogic = () => {
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

  // Client-side instant live preview simulation
  const renderPreview = (text: string) => {
    if (!text) {
      setPreviewText('');
      return;
    }
    const rendered = text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
      const cleanKey = key.trim();
      return sampleData[cleanKey] !== undefined ? String(sampleData[cleanKey]) : `[${cleanKey}]`;
    });
    setPreviewText(rendered);
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

  // Undo (Ctrl+Z)
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

  // Redo (Ctrl+Y)
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

    const validObjects = allowedObjectsByDocType[selectedType] || ['cliente'];
    if (!validObjects.includes(selectedObjectId)) {
      setSelectedObjectId(validObjects[validObjects.length - 1] || validObjects[0]);
    }
  }, [selectedType, templates]);

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

  // Reset template to backend default
  const handleReset = () => {
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

  return {
    templates,
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
  };
};
