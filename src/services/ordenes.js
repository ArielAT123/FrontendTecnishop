(function () {
  // ========================================
  // ORDENES SERVICE
  // ========================================
  class OrdenesService {
    constructor() {
      this.clientes = [];
      this.equipos = [];
      this.isInitialized = false;
    }

    // ========================================
    // CONFIGURAR EVENT LISTENERS PARA TARJETAS DE ÓRDENES
    // ========================================
    setupOrdenCardListeners() {
      const viewButtons = document.querySelectorAll('.btn-view[data-orden-id]');

      viewButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          const ordenId = button.getAttribute('data-orden-id');
          this.verOrdenPorId(ordenId);
        });
      });
    }

    // ========================================
    // VER ORDEN POR ID
    // ========================================
    async verOrdenPorId(ordenId) {
      try {
        console.log('Buscando orden con ID:', ordenId);

        // Buscar la orden en los datos cargados o hacer nueva petición a la API
        const orden = await this.obtenerOrdenCompleta(ordenId);

        if (orden) {
          this.mostrarModalReporte(orden);
        } else {
          //showNotification('No se pudo cargar la información de la orden', 'error');
        }
      } catch (error) {
        console.error('Error al ver orden:', error);
        //showNotification('Error al cargar la orden', 'error');
      }
    }

    // ========================================
    // OBTENER ORDEN COMPLETA
    // ========================================
    async obtenerOrdenCompleta(ordenId) {
      try {
        const API_BASE_URL = window.API_BASE_URL || 'https://backendtecnishop.onrender.com/api';

        const response = await fetch(`${API_BASE_URL}/ordenes/${ordenId}/`, {
          method: 'GET',
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Error al obtener orden: ${response.status}`);
        }

        const ordenData = await response.json();

        // Transformar los datos al mismo formato que usamos en las tarjetas
        const equipo = ordenData.equipo || {};
        const observaciones = equipo.observaciones?.[0] || {};
        const problemas = equipo.problemas || [];

        // Obtener información del cliente
        let clienteNombre = `Cliente ${equipo.cliente_ci}`;
        let clienteInfo = null;

        try {
          if (equipo.cliente_ci) {
            clienteInfo = await this.obtenerInfoCliente(equipo.cliente_ci);
            if (clienteInfo) {
              clienteNombre = `${clienteInfo.nombre} ${clienteInfo.apellido || ''}`.trim();
            }
          }
        } catch (error) {
          console.log('No se pudo obtener info del cliente:', equipo.cliente_ci);
        }

        return {
          id: ordenData.id,
          numero_orden: ordenData.numero_orden,
          cliente_nombre: clienteNombre,
          cliente_ci: equipo.cliente_ci || 'N/A',
          cliente_telefono: clienteInfo?.telefono || '',
          cliente_correo: clienteInfo?.correo || '',
          equipo_nombre: equipo.nombre || 'N/A',
          equipo_marca: equipo.marca || 'N/A',
          equipo_modelo: equipo.modelo || 'N/A',
          numero_serie: equipo.numero_serie || 'N/A',
          fecha: ordenData.fecha,
          problemas: problemas.map(p => p.problema),
          realiza_orden: ordenData.realiza_orden || 'N/A',
          observaciones: {
            cargador: observaciones.cargador || false,
            bateria: observaciones.bateria || false,
            cable_poder: observaciones.cable_poder || false,
            cable_datos: observaciones.cable_datos || false,
            otros: observaciones.otros || ''
          }
        };

      } catch (error) {
        console.error('Error obteniendo orden completa:', error);
        return null;
      }
    }

    // ========================================
    // OBTENER INFORMACIÓN DEL CLIENTE
    // ========================================
    async obtenerInfoCliente(clienteCi) {
      try {
        // Verificar si ya tenemos la info en cache
        const clienteEnCache = this.clientes.find(c => c.ci === clienteCi);
        if (clienteEnCache) {
          return clienteEnCache;
        }

        // Si no está en cache, buscar en la API
        const API_BASE_URL = window.API_BASE_URL || 'https://backendtecnishop.onrender.com/api';
        const response = await fetch(`${API_BASE_URL}/clientes/${clienteCi}/`, {
          method: 'GET',
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        if (response.ok) {
          const clienteInfo = await response.json();
          return clienteInfo;
        }

        return null;
      } catch (error) {
        console.log('Error obteniendo info del cliente:', error);
        return null;
      }
    }

    // ========================================
    // FUNCIÓN DE DEBUG PARA VERIFICAR DATOS
    // ========================================
    debugOrdenesData(data) {
      console.group('🔍 DEBUG: Datos de órdenes recientes');
      console.log('Tipo de data:', typeof data);
      console.log('Es array:', Array.isArray(data));
      console.log('Contenido completo:', data);

      if (data) {
        console.log('Propiedades disponibles:', Object.keys(data));

        if (data.results) {
          console.log('data.results es array:', Array.isArray(data.results));
          console.log('data.results:', data.results);
        }

        if (data.data) {
          console.log('data.data es array:', Array.isArray(data.data));
          console.log('data.data:', data.data);
        }
      }

      console.groupEnd();
    }

    // ========================================
    // FUNCIÓN ALTERNATIVA PARA CARGAR ÓRDENES (PARA TESTING)
    // ========================================
    async cargarOrdenesManual() {
      console.log('🔧 Cargando órdenes manualmente para testing...');

      // Datos de prueba con diferentes formatos
      const testData = [
        {
          id: 1,
          numero_orden: '001',
          cliente_nombre: 'Juan Test',
          cliente_ci: '1234567890',
          equipo_nombre: 'Test Laptop',
          equipo_marca: 'HP',
          equipo_modelo: 'Test Model',
          fecha: new Date().toISOString().split('T')[0],
          problemas: 'No enciende correctamente',
          realiza_orden: 'Test Técnico',
          observaciones: {
            cargador: true,
            bateria: false,
            cable_poder: true,
            cable_datos: false,
            otros: 'Equipo de prueba'
          }
        }
      ];

      this.renderOrdenesRecientes(testData);
    }

    // ========================================
    // CARGAR ÓRDENES RECIENTES
    // ========================================
    async cargarOrdenesRecientes() {
      try {
        const API_BASE_URL = window.API_BASE_URL || 'https://backendtecnishop.onrender.com/api';

        // Obtener las últimas 10 órdenes
        const response = await fetch(`${API_BASE_URL}/ordenes/0/10`, {
          method: 'GET',
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Error al cargar órdenes: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Respuesta completa de la API:', responseData);

        // Extraer el array de órdenes según tu estructura específica
        const ordenesRecientes = responseData.ordenes || [];

        // Transformar los datos al formato que necesita el frontend
        const ordenesTransformadas = await Promise.all(ordenesRecientes.map(async (orden) => {
          // Extraer cliente info del equipo
          const equipo = orden.equipo || {};
          const observaciones = equipo.observaciones?.[0] || {};
          const problemas = equipo.problemas || [];


          // Intentar obtener el nombre del cliente
          let clienteNombre = `Cliente ${equipo.cliente_ci}`;
          try {
            if (equipo.cliente_ci) {
              const clienteInfo = await this.obtenerInfoCliente(equipo.cliente_ci);
              if (clienteInfo) {
                clienteNombre = `${clienteInfo.nombre} ${clienteInfo.apellido || ''}`.trim();
              }
            }
          } catch (error) {
            console.log('No se pudo obtener info del cliente:', equipo.cliente_ci);
          }

          return {
            id: orden.id,
            numero_orden: orden.numero_orden, // Usar parte del UUID como número
            cliente_nombre: clienteNombre,
            cliente_ci: equipo.cliente_ci || 'N/A',
            cliente_telefono: '', // No disponible en la API de órdenes
            cliente_correo: '', // No disponible en la API de órdenes
            equipo_nombre: equipo.nombre || 'N/A',
            equipo_marca: equipo.marca || 'N/A',
            equipo_modelo: equipo.modelo || 'N/A',
            numero_serie: equipo.numero_serie || 'N/A',
            fecha: orden.fecha,
            problemas: problemas.map(p => p.problema), // Array de strings
            realiza_orden: orden.realiza_orden || 'N/A',
            observaciones: {
              cargador: observaciones.cargador || false,
              bateria: observaciones.bateria || false,
              cable_poder: observaciones.cable_poder || false,
              cable_datos: observaciones.cable_datos || false,
              otros: observaciones.otros || ''
            }
          };
        }));

        localStorage.setItem("Ordenes", JSON.stringify(ordenesTransformadas));
        console.log("ORDENES TRNASFORMADAS", localStorage.getItem("Ordenes"));
        //console.log('Órdenes transformadas:', ordenesTransformadas);
        this.renderOrdenesRecientes(ordenesTransformadas);

      } catch (error) {
        console.error('Error al cargar órdenes recientes:', error);

        // Mostrar datos de ejemplo si no hay conexión a la API
        this.renderOrdenesRecientes([]);
      }
    }

    // ========================================
    // RENDERIZAR ÓRDENES RECIENTES
    // ========================================
    renderOrdenesRecientes(ordenes) {
      const container = document.getElementById('ordenes-recientes-container');
      if (!container) return;

      // Validar que ordenes sea un array
      if (!Array.isArray(ordenes)) {
        console.error('ordenes no es un array:', typeof ordenes, ordenes);
        container.innerHTML = '<p class="text-muted">Error al cargar órdenes recientes</p>';
        return;
      }

      if (ordenes.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay órdenes recientes</p>';
        return;
      }

      let html = '<div class="ordenes-grid">';

      ordenes.forEach(orden => {
        // Validar que orden sea un objeto válido
        if (!orden || typeof orden !== 'object') {
          console.warn('Orden inválida:', orden);
          return;
        }

        const problemasTexto = Array.isArray(orden.problemas) ?
          orden.problemas.join('\n') :
          (orden.problemas || 'Sin problemas especificados');

        html += `
          <div class="orden-card" data-orden-id="${orden.id}">
            <div class="orden-header">
              <div class="orden-numero">Orden #${orden.numero_orden}</div>
              <div class="orden-fecha">${this.formatDate(orden.fecha)}</div>
            </div>
            <div class="orden-cliente">
              <strong>${orden.cliente_nombre}</strong><br>
              <small>CI: ${orden.cliente_ci}</small>
            </div>
            <div class="orden-equipo">
              ${orden.equipo_nombre} ${orden.equipo_marca || ''} ${orden.equipo_modelo || ''}
            </div>
            <div class="orden-problema">
              <small><strong>Problema:</strong> ${problemasTexto.substring(0, 50)}${problemasTexto.length > 50 ? '...' : ''}</small>
            </div>
            <div class="orden-actions">
              <button class="btn-small btn-view" data-orden-id="${orden.id}">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" width="12" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
</svg>
 
              Ver Reporte
              </button>
            </div>
          </div>
        `;
      });

      html += '</div>';
      container.innerHTML = html;

      // Agregar event listeners después de insertar el HTML
      this.setupOrdenCardListeners();
    }

    // ========================================
    // FORMATEAR FECHA
    // ========================================
    formatDate(dateString) {
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-EC', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      } catch (error) {
        return dateString;
      }
    }
    // ========================================
    // VER ORDEN - MOSTRAR MODAL DE REPORTE
    // ========================================
    verOrden(ordenId, ordenData) {
      console.log('Ver orden:', ordenId, ordenData);
      this.mostrarModalReporte(ordenData);
    }

    // ========================================
    // MOSTRAR MODAL DE REPORTE
    // ========================================
    mostrarModalReporte(orden) {
      // Crear modal si no existe
      let modal = document.getElementById('reporte-modal');
      if (!modal) {
        modal = this.crearModalReporte();
      }

      // Guardar la orden seleccionada para poder descargar PDF
      this.ordenSeleccionada = orden;

      // Llenar datos del reporte
      this.llenarDatosReporte(orden);

      // Mostrar modal
      modal.style.display = 'flex';
    }

    // ========================================
    // CREAR MODAL DE REPORTE
    // ========================================
    crearModalReporte() {
      const modalHTML = `
        <div id="reporte-modal" class="reporte-modal" style="display: none;">
          <div class="reporte-modal-content">
            <div class="reporte-modal-header">
              <h3>Orden de Servicio</h3>
              <div class="reporte-modal-actions">
                <button id="descargar-pdf-orden-btn" class="btn btn-success" style="background: #10b981; margin-right: 5px;">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" width="18" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg> Descargar PDF</button>
                <button id="imprimir-reporte-btn" class="btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" width="18" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
                  </svg> Imprimir</button>
                <button id="cerrar-reporte-btn" class="btn btn-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" width=18 stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
              Cerrar</button>
              </div>
            </div>
            <div class="reporte-modal-body" id="reporte-content">
              <!-- El contenido se cargará dinámicamente -->
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHTML);

      const modal = document.getElementById('reporte-modal');

      // Event listeners
      document.getElementById('cerrar-reporte-btn').addEventListener('click', () => {
        modal.style.display = 'none';
      });

      document.getElementById('imprimir-reporte-btn').addEventListener('click', () => {
        this.imprimirReporte();
      });

      document.getElementById('descargar-pdf-orden-btn').addEventListener('click', () => {
        this.descargarPDFOrden();
      });

      // Cerrar al hacer clic fuera del modal
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      });

      return modal;
    }

    // ========================================
    // CARGAR TEMPLATE DEL REPORTE DESDE ARCHIVO
    // ========================================
    async cargarTemplateReporte() {
      try {
        const response = await fetch('./src/templates/reporte.html');
        if (!response.ok) {
          throw new Error(`Error al cargar template: ${response.status}`);
        }
        const htmlCompleto = await response.text();

        // Extraer solo el contenido del body para evitar que los estilos afecten la página principal
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlCompleto, 'text/html');
        const bodyContent = doc.body.innerHTML;

        // Retornar el contenido envuelto en un contenedor con estilos scoped
        return `
          <div class="reporte-preview-container" style="background: white; padding: 10px;">
            <style>
              .reporte-preview-container * {
                box-sizing: border-box;
              }
              .reporte-preview-container .page-container {
                width: 100%;
                max-width: 210mm;
                margin: 0 auto;
                font-family: Arial, sans-serif;
                font-size: 9px;
              }
              .reporte-preview-container .reporte-section {
                border: 1px solid #000;
                margin-bottom: 10px;
                padding: 5px;
              }
              .reporte-preview-container .copia-label {
                background: #f0f0f0;
                text-align: center;
                font-weight: bold;
                font-size: 10px;
                padding: 4px;
                border-bottom: 1px solid #000;
              }
              .reporte-preview-container table {
                width: 100%;
                border-collapse: collapse;
              }
              .reporte-preview-container td, .reporte-preview-container th {
                border: 1px solid #000;
                padding: 4px 6px;
                vertical-align: middle;
              }
              .reporte-preview-container .header-table td {
                border: none;
                border-bottom: 1px solid #000;
              }
              .reporte-preview-container .header-table .logo-cell {
                font-weight: bold;
                font-size: 14px;
                border-right: 1px solid #000;
              }
              .reporte-preview-container .header-table .orden-cell {
                font-weight: bold;
                font-size: 14px;
                text-align: center;
              }
              .reporte-preview-container .divider {
                text-align: center;
                padding: 5px;
                color: #666;
                font-size: 10px;
              }
              .reporte-preview-container .condiciones-firma-table td {
                font-size: 8px;
                vertical-align: top;
              }
              .reporte-preview-container .firma-cell {
                text-align: center;
                vertical-align: bottom;
              }
              .reporte-preview-container .firma-line {
                border-top: 1px solid #000;
                margin-top: 30px;
                padding-top: 5px;
                font-size: 10px;
                font-weight: bold;
              }
            </style>
            ${bodyContent}
          </div>
        `;
      } catch (error) {
        console.error('Error cargando template de reporte:', error);
        // Fallback template básico
        return this.getReporteTemplateFallback();
      }
    }

    // ========================================
    // MOSTRAR MODAL DE REPORTE (ACTUALIZADO)
    // ========================================
    async mostrarModalReporte(orden) {
      // Crear modal si no existe
      let modal = document.getElementById('reporte-modal');
      if (!modal) {
        modal = this.crearModalReporte();
      }

      // Cargar template del reporte
      const reporteContent = document.getElementById('reporte-content');
      if (reporteContent) {
        const template = await this.cargarTemplateReporte();
        reporteContent.innerHTML = template;
      }

      // Llenar datos del reporte
      this.llenarDatosReporte(orden);

      // Mostrar modal
      modal.style.display = 'flex';
    }

    // ========================================
    // TEMPLATE DEL REPORTE (FALLBACK REDUCIDO)
    // ========================================
    getReporteTemplateFallback() {
      return `
        <div class="reporte-page">
          <table>
            <tr>
              <td colspan="3" class="header">www.tecnishop.com</td>
              <td colspan="2" class="title">Orden<br><span id="reporte-numero"></span></td>
            </tr>
            <tr>
              <td colspan="3" class="subheader">
                CDLA. CONDOR MZ. G VILLA 13 LOCALES #1 Y #2<br>
                Teléfonos: 0999339586 (WhatsApp)<br>
                R.U.C. 0917526758001<br>
                Email: tecnishop.imp@gmail.com
              </td>
              <td colspan="2"><b>FECHA:</b> <span id="reporte-fecha"></span></td>
            </tr>
          </table>

          <table>
            <tr>
              <td><b>CLIENTE:</b></td>
              <td id="reporte-cliente-nombre"></td>
              <td><b>C.I./R.U.C.:</b></td>
              <td id="reporte-cliente-ci"></td>
            </tr>
            <tr>
              <td><b>TELÉFONO:</b></td>
              <td id="reporte-telefono"></td>
              <td><b>E-MAIL:</b></td>
              <td id="reporte-email"></td>
            </tr>
          </table>

          <table>
            <tr>
              <th>ARTICULO</th>
              <th>MARCA</th>
              <th>MODELO</th>
              <th>PROBLEMAS</th>
            </tr>
            <tr>
              <td id="reporte-articulo"></td>
              <td id="reporte-marca"></td>
              <td id="reporte-modelo"></td>
              <td id="reporte-problemas"></td>
            </tr>
          </table>

          <table>
            <tr>
              <td><b>OBSERVACIONES</b></td>
              <td><b>CARGADOR:</b> <span id="reporte-cargador"></span></td>
              <td><b>BATERIA:</b> <span id="reporte-bateria"></span></td>
              <td><b>OTROS:</b> <span id="reporte-otros"></span></td>
            </tr>
          </table>

          <p class="conditions">
            <b>CONDICIONES:</b> SI TRANSCURRIDOS 30 DÍAS POSTERIORES A LA EMISIÓN DE ESTA ORDEN EL ARTÍCULO REPARADO Y/O CHEQUEADO 
            NO HA SIDO RETIRADO, ESTE SERÁ DECLARADO EN ABANDONO...
          </p>
        </div>
      `;
    }

    // ========================================
    // LLENAR DATOS DEL REPORTE
    // ========================================
    llenarDatosReporte(orden) {
      // Datos básicos
      this.setElementContent('reporte-numero', orden.numero_orden || '');
      this.setElementContent('reporte-cliente-nombre', orden.cliente_nombre || `Cliente ${orden.cliente_ci}` || '');
      this.setElementContent('reporte-cliente-ci', orden.cliente_ci || '');
      this.setElementContent('reporte-fecha', this.formatDate(orden.fecha));
      this.setElementContent('reporte-telefono', orden.cliente_telefono || '');
      this.setElementContent('reporte-email', orden.cliente_correo || '');

      this.setElementContent('reporte-numero-2', orden.numero_orden || orden.id?.substring(0, 8) || '');
      this.setElementContent('reporte-cliente-nombre-2', orden.cliente_nombre || `Cliente ${orden.cliente_ci}` || '');
      this.setElementContent('reporte-cliente-ci-2', orden.cliente_ci || '');
      this.setElementContent('reporte-fecha-2', this.formatDate(orden.fecha));
      this.setElementContent('reporte-telefono-2', orden.cliente_telefono || '');
      this.setElementContent('reporte-email-2', orden.cliente_correo || '');

      // Datos del equipo
      this.setElementContent('reporte-articulo', orden.equipo_nombre || '');
      this.setElementContent('reporte-marca', orden.equipo_marca || '');
      this.setElementContent('reporte-modelo', orden.equipo_modelo || '');
      this.setElementContent('reporte-serie', orden.numero_serie || '');

      this.setElementContent('reporte-articulo-2', orden.equipo_nombre || '');
      this.setElementContent('reporte-marca-2', orden.equipo_marca || '');
      this.setElementContent('reporte-modelo-2', orden.equipo_modelo || '');
      this.setElementContent('reporte-serie-2', orden.numero_serie || '');

      // Problemas - manejar tanto array como string
      let problemasTexto = '';
      if (Array.isArray(orden.problemas)) {
        problemasTexto = orden.problemas.join('\n• ');
        if (problemasTexto) {
          problemasTexto = '• ' + problemasTexto;
        }
      } else {
        problemasTexto = orden.problemas || '';
      }
      this.setElementContent('reporte-problemas', problemasTexto);
      this.setElementContent('reporte-problemas-2', problemasTexto);

      // Observaciones
      const obs = orden.observaciones || {};
      this.setElementContent('reporte-cargador', obs.cargador ? 'SÍ' : 'NO');
      this.setElementContent('reporte-bateria', obs.bateria ? 'SÍ' : 'NO');
      this.setElementContent('reporte-cable-poder', obs.cable_poder ? 'SÍ' : 'NO');
      this.setElementContent('reporte-cable-datos', obs.cable_datos ? 'SÍ' : 'NO');
      this.setElementContent('reporte-otros', obs.otros || '');

      this.setElementContent('reporte-cargador-2', obs.cargador ? 'SÍ' : 'NO');
      this.setElementContent('reporte-bateria-2', obs.bateria ? 'SÍ' : 'NO');
      this.setElementContent('reporte-cable-poder-2', obs.cable_poder ? 'SÍ' : 'NO');
      this.setElementContent('reporte-cable-datos-2', obs.cable_datos ? 'SÍ' : 'NO');
      this.setElementContent('reporte-otros-2', obs.otros || '');
    }

    // ========================================
    // HELPER PARA ESTABLECER CONTENIDO
    // ========================================
    setElementContent(id, content) {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = content;
      }
    }

    // ========================================
    // DESCARGAR PDF DE ORDEN
    // ========================================
    descargarPDFOrden() {
      const reporteContent = document.getElementById('reporte-content');
      if (!reporteContent) {
        alert('No hay contenido para descargar');
        return;
      }

      const orden = this.ordenSeleccionada;
      const nombreArchivo = `Orden_${orden?.numero_orden || 'servicio'}.pdf`;

      // Verificar si html2pdf está disponible
      if (typeof html2pdf === 'undefined') {
        alert('La libreria html2pdf no esta disponible. El PDF no se puede generar.');
        return;
      }

      // Configuración para html2pdf
      const opciones = {
        margin: 5,
        filename: nombreArchivo,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait'
        }
      };

      // Generar y descargar el PDF
      html2pdf()
        .set(opciones)
        .from(reporteContent)
        .save()
        .then(() => {
          console.log('PDF descargado exitosamente:', nombreArchivo);
        })
        .catch((error) => {
          console.error('Error al generar PDF:', error);
          alert('Error al generar el PDF. Intente nuevamente.');
        });
    }

    // ========================================
    // IMPRIMIR REPORTE
    // ========================================
    imprimirReporte() {
      const reporteContent = document.getElementById('reporte-content');
      if (!reporteContent) return;

      // Crear ventana de impresión
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        
          ${reporteContent.innerHTML}
        
      `);

      printWindow.document.close();
      printWindow.focus();

      // Esperar a que cargue y luego imprimir
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }

    // ========================================
    // INICIALIZAR SECCIÓN DE ÓRDENES
    // ========================================
    async initialize() {
      try {
        // Evitar inicialización múltiple
        if (this.isInitialized) {
          console.log('OrdenesService ya está inicializado, limpiando eventos...');
          this.cleanup();
        }

        await this.loadData();
        this.setupEventListeners();
        this.handleOrdenForm();
        this.setCurrentDate();
        await this.cargarOrdenesRecientes();
        this.isInitialized = true;

        console.log('OrdenesService inicializado correctamente');
      } catch (error) {
        console.error('Error al inicializar órdenes:', error);
        //showNotification('Error al inicializar la sección de órdenes', 'error');
      }
    }

    // ========================================
    // CARGAR DATOS NECESARIOS
    // ========================================
    async loadData() {
      try {
        // Cargar clientes si está disponible la función
        if (typeof getClientes === 'function') {
          this.clientes = await getClientes();
        }

        this.populateClientesDropdown();
        console.log('Datos cargados:', {
          clientes: this.clientes.length
        });
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    }

    // ========================================
    // LIMPIAR EVENT LISTENERS PREVIOS
    // ========================================
    cleanup() {
      const form = document.getElementById('orden-form');
      if (form && this.formHandler) {
        form.removeEventListener('submit', this.formHandler);
      }

      const clienteSelect = document.getElementById('cliente-cedula');
      if (clienteSelect && this.clienteChangeHandler) {
        clienteSelect.removeEventListener('change', this.clienteChangeHandler);
      }

      const toggleBtn = document.getElementById('toggle-orden-form-button');
      if (toggleBtn && this.toggleHandler) {
        toggleBtn.removeEventListener('click', this.toggleHandler);
      }

      // Limpiar event listeners de las tarjetas de órdenes
      const viewButtons = document.querySelectorAll('.btn-view[data-orden-id]');
      viewButtons.forEach(button => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
      });
    }

    // ========================================
    // CONFIGURAR EVENT LISTENERS
    // ========================================
    setupEventListeners() {
      // Event listener para botón toggle del formulario
      this.setupToggleButton();

      // Event listener para cambio de cliente
      const clienteSelect = document.getElementById('cliente-cedula');
      if (clienteSelect) {
        this.clienteChangeHandler = (e) => {
          this.handleClienteChange(e.target.value);
        };

        clienteSelect.removeEventListener('change', this.clienteChangeHandler);
        clienteSelect.addEventListener('change', this.clienteChangeHandler);
      }
    }

    // ========================================
    // CONFIGURAR BOTÓN TOGGLE
    // ========================================
    setupToggleButton() {
      const toggleBtn = document.getElementById('toggle-orden-form-button');
      const formContainer = document.getElementById('orden-form-container');

      if (!toggleBtn || !formContainer) {
        console.error('No se encontraron los elementos del toggle');
        return;
      }

      // Almacenar la referencia del handler para poder removerlo después
      this.toggleHandler = () => {
        const isHidden = formContainer.style.display === 'none' ||
          formContainer.style.display === '' ||
          !formContainer.style.display;

        if (isHidden) {
          formContainer.style.display = 'block';
          toggleBtn.textContent = 'Ocultar Formulario';
          toggleBtn.style.background = '#e74c3c';
        } else {
          formContainer.style.display = 'none';
          toggleBtn.textContent = 'Crear Nueva Orden de Servicio';
          toggleBtn.style.background = '#27ae60';
        }
      };

      // Remover listener previo si existe
      toggleBtn.removeEventListener('click', this.toggleHandler);
      // Agregar nuevo listener
      toggleBtn.addEventListener('click', this.toggleHandler);

      // Asegurar que el formulario esté oculto inicialmente
      formContainer.style.display = 'none';
    }

    // ========================================
    // POBLAR DROPDOWN DE CLIENTES
    // ========================================
    populateClientesDropdown() {
      const datalist = document.getElementById('clientes-list');
      if (!datalist) return;

      datalist.innerHTML = '';

      this.clientes.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.ci;
        option.textContent = `${cliente.ci} - ${cliente.nombre} ${cliente.apellido || ''}`;
        option.dataset.clienteData = JSON.stringify(cliente);
        datalist.appendChild(option);
      });

      // Agregar evento para autocompletar datos cuando se selecciona
      const input = document.getElementById('cliente-cedula');
      input.addEventListener('input', (e) => {
        const selectedOption = Array.from(datalist.options).find(
          opt => opt.value === e.target.value
        );

        if (selectedOption && selectedOption.dataset.clienteData) {
          const clienteData = JSON.parse(selectedOption.dataset.clienteData);
          document.getElementById('cliente-nombre').value = clienteData.nombre || '';
          document.getElementById('cliente-telefono').value = clienteData.telefono || '';
          document.getElementById('cliente-correo').value = clienteData.correo || '';
        }
      });
    }
    // ========================================
    // MANEJAR CAMBIO DE CLIENTE
    // ========================================
    handleClienteChange(selectedValue) {
      const nombreInput = document.getElementById('cliente-nombre');
      const cedulaManualInput = document.getElementById('cedula-manual');
      const clienteSelect = document.getElementById('cliente-cedula');

      if (!nombreInput || !cedulaManualInput) return;

      if (selectedValue === 'nuevo') {
        // Habilitar campos para nuevo cliente
        nombreInput.value = '';
        cedulaManualInput.value = '';
        nombreInput.readOnly = false;
        cedulaManualInput.readOnly = false;
        cedulaManualInput.style.display = 'block';
        nombreInput.placeholder = 'Ingrese el nombre del cliente';
        cedulaManualInput.placeholder = 'Ingrese la cédula del cliente';
      } else if (selectedValue) {
        // Cliente existente seleccionado
        const selectedOption = clienteSelect.querySelector(`option[value="${selectedValue}"]`);
        if (selectedOption && selectedOption.dataset.clienteData) {
          const clienteData = JSON.parse(selectedOption.dataset.clienteData);
          nombreInput.value = `${clienteData.nombre} ${clienteData.apellido || ''}`.trim();
          cedulaManualInput.value = clienteData.ci;
          nombreInput.readOnly = true;
          cedulaManualInput.readOnly = true;
          cedulaManualInput.style.display = 'none';
        }
      } else {
        // Ningún cliente seleccionado
        nombreInput.value = '';
        cedulaManualInput.value = '';
        nombreInput.readOnly = false;
        cedulaManualInput.readOnly = false;
        cedulaManualInput.style.display = 'none';
      }
    }

    // ========================================
    // ESTABLECER FECHA ACTUAL
    // ========================================
    setCurrentDate() {
      const fechaInput = document.getElementById('fecha');
      if (fechaInput) {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        fechaInput.value = formattedDate;
      }
    }

    // ========================================
    // MANEJAR FORMULARIO DE ORDEN
    // ========================================
    handleOrdenForm() {
      const form = document.getElementById('orden-form');
      if (!form) {
        console.error('No se encontró el formulario de órdenes');
        return;
      }

      // Crear handler y almacenar referencia
      this.formHandler = async (e) => {
        e.preventDefault();

        const clienteSelect = document.getElementById('cliente-cedula');
        const isNewCliente = clienteSelect.value === 'nuevo';

        // Recopilar datos del formulario
        const formData = {
          // Datos del cliente
          cliente_ci: isNewCliente ?
            document.getElementById('cedula-manual').value.trim() :
            clienteSelect.value,
          cliente_nombre: document.getElementById('cliente-nombre').value.trim(),
          cliente_telefono: document.getElementById('cliente-telefono').value.trim(),
          cliente_correo: document.getElementById('cliente-correo').value.trim(),
          es_cliente_nuevo: isNewCliente,

          // Datos del equipo
          equipo_nombre: document.getElementById('equipo-nombre').value.trim(),
          equipo_marca: document.getElementById('equipo-marca').value.trim(),
          equipo_modelo: document.getElementById('equipo-modelo').value.trim(),
          numero_serie: document.getElementById('numero-serie').value.trim(),

          // Datos de la orden
          fecha: document.getElementById('fecha').value,
          realiza_orden: document.getElementById('realiza-orden').value.trim(),

          // Problemas (recopilar todos los campos de problemas)
          problemas: this.recopilarProblemas(),

          // Observaciones/Accesorios
          observaciones: {
            cargador: document.getElementById('cargador').checked,
            bateria: document.getElementById('bateria').checked,
            cable_poder: document.getElementById('cable-poder').checked,
            cable_datos: document.getElementById('cable-datos').checked,
            otros: document.getElementById('otros').value.trim(),
          }
        };

        // Validaciones
        const validationErrors = this.validateForm(formData);
        if (validationErrors.length > 0) {
          //showNotification(validationErrors[0], 'error');
          return;
        }

        try {
          console.log('Enviando datos de la orden:', formData);

          // Mostrar modal de carga
          this.showLoadingModal();

          await this.crearOrdenCompleta(formData);

          // Ocultar modal de carga
          this.hideLoadingModal();

          //showNotification('Orden creada exitosamente', 'success');
          form.reset();
          this.setCurrentDate();

          // Resetear selects y ocultar formulario
          if (clienteSelect) clienteSelect.value = '';
          this.handleClienteChange('');

          // Ocultar formulario después de crear la orden
          const formContainer = document.getElementById('orden-form-container');
          const toggleBtn = document.getElementById('toggle-orden-form-button');
          if (formContainer && toggleBtn) {
            formContainer.style.display = 'none';
            toggleBtn.textContent = 'Crear Nueva Orden de Servicio';
            toggleBtn.style.background = '#27ae60';
          }

        } catch (error) {
          console.error('Error al crear orden:', error);
          this.hideLoadingModal();
          //showNotification('Error al crear orden: ' + error.message, 'error');
        }
      };

      // Remover listener previo y agregar nuevo
      form.removeEventListener('submit', this.formHandler);
      form.addEventListener('submit', this.formHandler);
    }

    // ========================================
    // RECOPILAR PROBLEMAS DE TODOS LOS CAMPOS
    // ========================================
    recopilarProblemas() {
      const problemas = [];
      const problemaPrincipal = document.getElementById('problema-principal').value.trim();

      if (problemaPrincipal) {
        problemas.push(problemaPrincipal);
      }

      // Recopilar problemas adicionales
      for (let i = 1; i <= 3; i++) {
        const problemaAdicional = document.getElementById(`problema-adicional-${i}`);
        if (problemaAdicional && problemaAdicional.value.trim()) {
          problemas.push(problemaAdicional.value.trim());
        }
      }

      return problemas;
    }

    // ========================================
    // VALIDAR FORMULARIO
    // ========================================
    validateForm(formData) {
      const errors = [];

      // Validar datos del cliente
      if (!formData.cliente_ci) {
        errors.push('La cédula del cliente es obligatoria');
      }
      if (!formData.cliente_nombre) {
        errors.push('El nombre del cliente es obligatorio');
      }

      // Validar datos del equipo
      if (!formData.equipo_nombre) {
        errors.push('El nombre del equipo es obligatorio');
      }

      // Validar datos de la orden
      if (!formData.fecha) {
        errors.push('La fecha es obligatoria');
      }
      if (!formData.realiza_orden) {
        errors.push('El campo "Realiza la orden" es obligatorio');
      }
      if (formData.problemas.length === 0) {
        errors.push('Debe ingresar al menos un problema');
      }

      return errors;
    }

    // ========================================
    // MOSTRAR MODAL DE CARGA
    // ========================================
    showLoadingModal() {
      const modal = document.getElementById('loading-modal');
      if (modal) {
        modal.style.display = 'flex';
        this.updateLoadingProgress(0, 'Iniciando proceso...');
      }
    }

    // ========================================
    // OCULTAR MODAL DE CARGA
    // ========================================
    hideLoadingModal() {
      const modal = document.getElementById('loading-modal');
      if (modal) {
        modal.style.display = 'none';
        this.updateLoadingProgress(0, 'Procesando...');
      }
    }

    // ========================================
    // ACTUALIZAR PROGRESO DEL MODAL
    // ========================================
    updateLoadingProgress(percentage, status) {
      const progressBar = document.getElementById('progress-bar');
      const statusText = document.getElementById('loading-status');

      if (progressBar) {
        progressBar.style.width = percentage + '%';
      }

      if (statusText) {
        statusText.textContent = status;
      }
    }

    // ========================================
    // CREAR ORDEN COMPLETA CON PROGRESO
    // ========================================
    async crearOrdenCompleta(formData) {
      const API_BASE_URL = window.API_BASE_URL || 'https://backendtecnishop.onrender.com/api';

      try {
        let cliente_ci = formData.cliente_ci;

        // 1. Crear cliente si es nuevo (20%)
        if (formData.es_cliente_nuevo) {
          this.updateLoadingProgress(10, 'Verificando datos del cliente...');

          const nombreParts = formData.cliente_nombre.split(' ');
          const nombre = nombreParts[0] || formData.cliente_nombre;
          const apellido = nombreParts.slice(1).join(' ') || '';

          const datosCliente = {
            ci: formData.cliente_ci,
            nombre: nombre,
            apellido: apellido,
            telefono: formData.cliente_telefono || null,
            correo: formData.cliente_correo || null
          };

          this.updateLoadingProgress(20, 'Creando cliente...');
          console.log('Creando cliente:', datosCliente);
          const response = await fetch(`${API_BASE_URL}/clientes/crear/`, {
            method: 'POST',
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
            },
            body: JSON.stringify(datosCliente)
          });

          if (!response.ok) {
            throw new Error(`Error al crear cliente: ${response.status}`);
          }
        }

        // 2. Crear equipo (40%)
        this.updateLoadingProgress(30, 'Creando equipo...');
        const datosEquipo = {
          nombre: formData.equipo_nombre,
          cliente_ci: cliente_ci,
          marca: formData.equipo_marca || 'Sin marca',
          modelo: formData.equipo_modelo || 'Sin modelo',
          numero_serie: formData.numero_serie || "N/S"
        };

        console.log('Creando equipo:', datosEquipo);
        const equipoResponse = await fetch(`${API_BASE_URL}/equipos/crear/`, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
          }, body: JSON.stringify(datosEquipo)
        });

        if (!equipoResponse.ok) {
          throw new Error(`Error al crear equipo: ${equipoResponse.status}`);
        }

        const equipo = await equipoResponse.json();
        const equipo_id = equipo.id;

        // 3. Crear observaciones (60%)
        this.updateLoadingProgress(50, 'Guardando observaciones...');
        const datosObservaciones = {
          equipo: equipo_id,
          cargador: formData.observaciones.cargador,
          bateria: formData.observaciones.bateria,
          cable_poder: formData.observaciones.cable_poder,
          cable_datos: formData.observaciones.cable_datos,
          otros: formData.observaciones.otros || "Ninguna"
        };

        console.log('Creando observaciones:', datosObservaciones);
        await fetch(`${API_BASE_URL}/observaciones/crear/`, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
          }, body: JSON.stringify(datosObservaciones)
        });

        // 4. Crear problemas (80%)
        this.updateLoadingProgress(70, 'Registrando problemas...');
        for (let i = 0; i < formData.problemas.length; i++) {
          const problema = formData.problemas[i];
          const datosProblema = {
            equipo: equipo_id,
            problema: problema
          };

          console.log(`Creando problema ${i + 1}:`, datosProblema);
          await fetch(`${API_BASE_URL}/problemas/crear/`, {
            method: 'POST',
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
            },
            body: JSON.stringify(datosProblema)
          });

          // Actualizar progreso por cada problema
          const progressIncrement = 10 / formData.problemas.length;
          this.updateLoadingProgress(70 + (i + 1) * progressIncrement, `Registrando problema ${i + 1} de ${formData.problemas.length}...`);
        }

        // 5. Crear orden (100%)
        this.updateLoadingProgress(90, 'Creando orden de servicio...');
        const datosOrden = {
          equipo: equipo_id,
          fecha: formData.fecha,
          realiza_orden: formData.realiza_orden
        };

        console.log('Creando orden:', datosOrden);
        const ordenResponse = await fetch(`${API_BASE_URL}/ordenes/crear/`, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify(datosOrden)
        });

        if (!ordenResponse.ok) {
          throw new Error(`Error al crear orden: ${ordenResponse.status}`);
        }

        const orden = await ordenResponse.json();

        // Completar progreso
        this.updateLoadingProgress(100, 'Orden creada exitosamente!');

        // Esperar un momento para mostrar el éxito antes de cerrar
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Recargar órdenes recientes después de crear una nueva
        setTimeout(() => {
          this.cargarOrdenesRecientes();
        }, 500);

        console.log('Orden creada exitosamente:', orden);
        return orden;

      } catch (error) {
        console.error('Error en crearOrdenCompleta:', error);
        throw error;
      }
    }

    // ========================================
    // DESTRUIR INSTANCIA
    // ========================================
    destroy() {
      this.cleanup();
      this.isInitialized = false;
      console.log('OrdenesService destruido');
    }
  }

  // Register the service for initialization
  window.sectionServices = window.sectionServices || {};
  window.sectionServices.ordenes = new OrdenesService();
})();