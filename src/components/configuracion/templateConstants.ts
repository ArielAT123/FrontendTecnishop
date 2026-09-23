import React from 'react';
import { User, Laptop, Wrench, ClipboardList, Receipt } from 'lucide-react';

export interface VariableItem {
  tag: string;
  name: string;
  description: string;
  example: string;
}

export interface ObjectCategory {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  tagColorClass: string;
  variables: VariableItem[];
}

export interface TemplateItem {
  id: string;
  eventType: string;
  channel: string;
  title: string;
  description: string | null;
  subject: string | null;
  bodyTemplate: string;
  isActive: boolean;
}

export const MESSAGE_SERVER_URL =
  (import.meta as any).env?.VITE_MESSAGE_SERVER_URL || (
    typeof window !== 'undefined' && window.location.port === '5173'
      ? 'http://localhost:5052'
      : '/message-api'
  );

// Sample data dictionary for rendering live previews
export const sampleData: Record<string, any> = {
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
export const objectCategories: ObjectCategory[] = [
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
export const tagMetadataMap: Record<
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
  tagColorClass:
    'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
  icon: Laptop,
};

// STRICT FILTER: Objects allowed per document type to avoid backend mismatch errors
export const allowedObjectsByDocType: Record<string, string[]> = {
  FACTURA: ['cliente', 'factura'],
  ORDEN_TRABAJO: ['cliente', 'equipo', 'orden'],
  INFORME_TECNICO: ['cliente', 'equipo', 'orden', 'ficha'],
};

// Subject title for Email Preview
export const emailSubjects: Record<string, string> = {
  FACTURA: `Factura de Venta Tecnishop ${sampleData.factura_numero}`,
  ORDEN_TRABAJO: `Comprobante de Orden de Servicio ${sampleData.orden_id} - Tecnishop`,
  INFORME_TECNICO: `Informe Técnico Oficial - Equipo ${sampleData.equipo_marca} ${sampleData.equipo_modelo}`,
};

// Helper: Convert template string to ContentEditable HTML with atomic tags
export const templateToHtml = (template: string): string => {
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
export const domToTemplate = (el: HTMLElement): string => {
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
