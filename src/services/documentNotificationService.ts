import { apiClient } from '../api/client';
import { Venta } from '../types';

export interface DispatchDocumentResponse {
  success: boolean;
  message?: string;
  error?: string;
  eventId?: string;
  messageId?: string;
  renderedMessage?: string;
  link?: string;
  data?: any;
}

/**
 * Service to dispatch documents (Factura, Orden, Informe) to WhatsApp.
 * Calls Django backend endpoints where:
 * 1. ReportLab generates the PDF in memory.
 * 2. Django obtains the URL (Cloudinary or Base64 fallback).
 * 3. Django dispatches to message_event_server with the PDF attachment and template data.
 * 4. Evolution API delivers the document to WhatsApp.
 */
export const documentNotificationService = {
  /**
   * Dispatches a Sales Invoice (Factura) notification to client
   */
  async sendFactura(venta: Venta, phoneOverride?: string): Promise<DispatchDocumentResponse> {
    try {
      const response = await apiClient.post(`/productos/ventas/${venta.id}/enviar-whatsapp/`, {
        telefono: phoneOverride || undefined,
      });

      const resData = response.data || {};
      const innerData = resData.data || {};

      return {
        success: true,
        message: '¡Factura enviada exitosamente por WhatsApp!',
        eventId: innerData.eventId,
        messageId: innerData.messageId,
        renderedMessage: innerData.renderedMessage,
        data: innerData,
      };
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Error al enviar la factura por WhatsApp';
      return {
        success: false,
        error: errorMsg,
      };
    }
  },

  /**
   * Dispatches a Work Order (Orden de Trabajo) notification to client
   */
  async sendOrden(orden: any, phoneOverride?: string): Promise<DispatchDocumentResponse> {
    try {
      const response = await apiClient.post(`/ordenes/${orden.id}/enviar-whatsapp/`, {
        telefono: phoneOverride || undefined,
      });

      const resData = response.data || {};
      const innerData = resData.data || {};

      return {
        success: true,
        message: '¡Orden de trabajo enviada exitosamente por WhatsApp!',
        eventId: innerData.eventId,
        messageId: innerData.messageId,
        renderedMessage: innerData.renderedMessage,
        data: innerData,
      };
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Error al enviar la orden de trabajo por WhatsApp';
      return {
        success: false,
        error: errorMsg,
      };
    }
  },

  /**
   * Dispatches a Technical Report (Informe Técnico) notification to client
   */
  async sendInforme(reporte: any, phoneOverride?: string): Promise<DispatchDocumentResponse> {
    try {
      const response = await apiClient.post(`/reportes/${reporte.id}/enviar-whatsapp/`, {
        telefono: phoneOverride || undefined,
      });

      const resData = response.data || {};
      const innerData = resData.data || {};

      return {
        success: true,
        message: '¡Informe técnico enviado exitosamente por WhatsApp!',
        eventId: innerData.eventId,
        messageId: innerData.messageId,
        renderedMessage: innerData.renderedMessage,
        data: innerData,
      };
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Error al enviar el informe técnico por WhatsApp';
      return {
        success: false,
        error: errorMsg,
      };
    }
  },

  /**
   * Dispatches a Quotation Approval link notification to client via WhatsApp
   */
  async sendCotizacion(reporte: any, phoneOverride?: string): Promise<DispatchDocumentResponse> {
    try {
      const response = await apiClient.post(`/reportes/${reporte.id}/enviar-cotizacion-whatsapp/`, {
        telefono: phoneOverride || undefined,
      });

      const resData = response.data || {};
      const innerData = resData.data || {};

      return {
        success: true,
        message: '¡Enlace de cotización enviado por WhatsApp al cliente!',
        link: resData.link,
        eventId: innerData.eventId,
        messageId: innerData.messageId,
        renderedMessage: innerData.renderedMessage || resData.text,
        data: innerData,
      };
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Error al enviar la cotización por WhatsApp';
      return {
        success: false,
        error: errorMsg,
      };
    }
  },
};

