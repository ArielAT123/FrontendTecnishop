(function () {
  // ========================================
  // REPORTES SERVICE
  // ========================================
  class ReportesService {
    constructor() {
      this.ordenes = [];
      this.isInitialized = false;
      this.trabajosRealizados = [];
      this.repuestosUtilizados = [];
      this.reportesOriginales = []; // Para almacenar reportes sin filtrar
    }

    // ========================================
    // INICIALIZAR SECCIÓN DE REPORTES
    // ========================================
    async initialize() {
      try {
        if (this.isInitialized) {
          console.log('ReportesService ya está inicializado, limpiando eventos...');
          this.cleanup();
        }

        if (!localStorage.getItem("Ordenes") || localStorage.getItem("Ordenes") == "") {
          await this.cargarOrdenesRecientes();
        }

        this.cargarOrdenesDesdeStorage();
        this.setupEventListeners();
        await this.mostrarReportes();
        this.isInitialized = true;
        console.log('ReportesService inicializado correctamente');
      } catch (error) {
        console.error('Error al inicializar reportes:', error);
      }
    }

    // ========================================
    // CARGAR ÓRDENES DESDE LOCALSTORAGE
    // ========================================
    cargarOrdenesDesdeStorage() {
      try {
        const ordenesStr = localStorage.getItem("Ordenes");
        this.ordenes = ordenesStr ? JSON.parse(ordenesStr) : [];
        console.log('Órdenes cargadas:', this.ordenes.length);
      } catch (error) {
        console.error('Error al cargar órdenes desde storage:', error);
        this.ordenes = [];
      }
    }

    // ========================================
    // POPULATE DROPDOWN DE ÓRDENES
    // ========================================
    populateOrdenesDropdown() {
      const select = document.getElementById('orden_id');
      if (!select) return;

      // Limpiar opciones existentes excepto la primera
      select.innerHTML = '<option value="">Seleccione una orden...</option>';

      this.ordenes.forEach(orden => {
        const option = document.createElement('option');
        option.value = orden.id;
        option.textContent = `${orden.numero_orden} - ${orden.cliente_nombre} - ${orden.equipo_marca} ${orden.equipo_modelo}`;
        option.dataset.ordenData = JSON.stringify(orden);
        select.appendChild(option);
      });
    }

    // ========================================
    // LIMPIAR EVENT LISTENERS PREVIOS
    // ========================================
    cleanup() {
      console.log('Limpiando ReportesService...');
      // Limpiar listeners globales
      const form = document.getElementById('reporteForm');
      if (form) {
        form.replaceWith(form.cloneNode(true));
      }
    }

    // ========================================
    // CONFIGURAR EVENT LISTENERS
    // ========================================
    setupEventListeners() {
      const button = document.getElementById("reporte-button-create");
      const formContainer = document.getElementById("form-container-reporte");

      if (button && formContainer) {
        button.addEventListener("click", () => {
          if (formContainer.style.visibility === "hidden") {
            formContainer.style.visibility = "visible";
            formContainer.style.display = "block";
            this.limpiarFormulario();
            this.populateOrdenesDropdown();
          } else {
            formContainer.style.visibility = "hidden";
            formContainer.style.display = "none";
          }
        });
      }

      document.addEventListener('DOMContentLoaded', function () {
        const trabajosContainer = document.getElementById('trabajos-container');
        const repuestosContainer = document.getElementById('repuestos-container');

        if (trabajosContainer && repuestosContainer) {
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                removeEmptyState('trabajos-container');
                removeEmptyState('repuestos-container');
              }
            });
          });

          observer.observe(trabajosContainer, { childList: true });
          observer.observe(repuestosContainer, { childList: true });
        }
      });
      // Listener para cuando se selecciona una orden
      const selectOrden = document.getElementById('orden_id');
      if (selectOrden) {
        selectOrden.addEventListener('change', (e) => {
          const selectedOption = e.target.options[e.target.selectedIndex];
          if (selectedOption && selectedOption.dataset.ordenData) {
            const ordenData = JSON.parse(selectedOption.dataset.ordenData);
            this.llenarDatosOrden(ordenData);
          }
        });
      }

      // Listener para el formulario
      const form = document.getElementById('reporteForm');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.generarReporte();
        });
      }

      // Exponer funciones globalmente para los botones inline
      window.agregarTrabajo = () => this.agregarTrabajo();
      window.agregarRepuesto = () => this.agregarRepuesto();
      window.eliminarTrabajo = (id) => this.eliminarTrabajo(id);
      window.eliminarRepuesto = (id) => this.eliminarRepuesto(id);

      console.log('Event listeners de reportes configurados');
    }

    // ========================================
    // LLENAR DATOS DE LA ORDEN SELECCIONADA
    // ========================================
    llenarDatosOrden(orden) {
      console.log('Llenando datos de la orden:', orden);

      // Llenar técnico
      const tecnicoInput = document.getElementById('tecnico');
      if (tecnicoInput) {
        tecnicoInput.value = orden.realiza_orden || '';
      }

      // Llenar equipo
      const equipoInput = document.getElementById('equipo');
      if (equipoInput) {
        const equipoDesc = `${orden.equipo_nombre} ${orden.equipo_marca} ${orden.equipo_modelo} (S/N: ${orden.numero_serie})`;
        equipoInput.value = equipoDesc;
      }

      // Llenar observaciones con problemas reportados
      const observacionesTextarea = document.getElementById('observaciones');
      if (observacionesTextarea && orden.problemas) {
        const problemasText = `PROBLEMAS REPORTADOS:\n${orden.problemas.join('\n')}\n\nACCESORIOS RECIBIDOS:\n`;
        const obs = orden.observaciones || {};
        let accesorios = [];
        if (obs.cargador) accesorios.push('- Cargador');
        if (obs.bateria) accesorios.push('- Batería');
        if (obs.cable_poder) accesorios.push('- Cable de Poder');
        if (obs.cable_datos) accesorios.push('- Cable de Datos');
        if (obs.otros) accesorios.push(`- Otros: ${obs.otros}`);

        observacionesTextarea.value = problemasText + (accesorios.length > 0 ? accesorios.join('\n') : 'Ninguno');
      }
    }

    // ========================================
    // LIMPIAR FORMULARIO
    // ========================================
    limpiarFormulario() {
      const form = document.getElementById('reporteForm');
      if (form) form.reset();

      // Limpiar contenedores dinámicos
      const trabajosContainer = document.getElementById('trabajos-container');
      const repuestosContainer = document.getElementById('repuestos-container');

      if (trabajosContainer) trabajosContainer.innerHTML = '';
      if (repuestosContainer) repuestosContainer.innerHTML = '';

      this.actualizarTotal();
    }

    // ========================================
    // AGREGAR TRABAJO REALIZADO
    // ========================================
    agregarTrabajo() {
      const container = document.getElementById("trabajos-container");
      if (!container) return;

      const trabajoId = `trabajo-${Date.now()}`;
      const trabajoHTML = `
        <div class="item-row" id="${trabajoId}">
          <div class="form-group">
            <label>Descripción del Trabajo</label>
            <input type="text" class="trabajo-descripcion" placeholder="Ej: Limpieza de cabezal de impresión">
          </div>
          <div class="form-group">
            <label>Costo ($)</label>
            <input type="number" class="trabajo-costo" placeholder="0.00" step="0.01" min="0" value="0">
          </div>
          <div class="form-group">
            <label>&nbsp;</label>
            <button type="button" class="remove-btn" onclick="eliminarTrabajo('${trabajoId}')">
              🗑️ Eliminar
            </button>
          </div>
        </div>
      `;

      container.insertAdjacentHTML('beforeend', trabajoHTML);

      // Agregar listener para actualizar total
      const trabajoElement = document.getElementById(trabajoId);
      const inputCosto = trabajoElement.querySelector('.trabajo-costo');
      inputCosto.addEventListener('input', () => this.actualizarTotal());

      this.actualizarTotal();
    }

    // ========================================
    // ELIMINAR TRABAJO
    // ========================================
    eliminarTrabajo(trabajoId) {
      const elemento = document.getElementById(trabajoId);
      if (elemento) {
        elemento.remove();
        this.actualizarTotal();
      }
    }

    // ========================================
    // AGREGAR REPUESTO
    // ========================================
    agregarRepuesto() {
      const container = document.getElementById("repuestos-container");
      if (!container) return;

      const repuestoId = `repuesto-${Date.now()}`;
      const repuestoHTML = `
        <div class="item-row" id="${repuestoId}">
          <div class="form-group">
            <label>Nombre del Repuesto</label>
            <input type="text" class="repuesto-nombre" placeholder="Ej: Cartucho de tinta negro">
          </div>
          <div class="form-group">
            <label>Cantidad</label>
            <input type="number" class="repuesto-cantidad" placeholder="1" min="1" value="1">
          </div>
          <div class="form-group">
            <label>Precio Unit. ($)</label>
            <input type="number" class="repuesto-precio" placeholder="0.00" step="0.01" min="0" value="0">
          </div>
          <div class="form-group">
            <label>&nbsp;</label>
            <button type="button" class="remove-btn" onclick="eliminarRepuesto('${repuestoId}')">
              🗑️ Eliminar
            </button>
          </div>
        </div>
      `;

      container.insertAdjacentHTML('beforeend', repuestoHTML);

      // Agregar listeners para actualizar total
      const repuestoElement = document.getElementById(repuestoId);
      const inputCantidad = repuestoElement.querySelector('.repuesto-cantidad');
      const inputPrecio = repuestoElement.querySelector('.repuesto-precio');

      inputCantidad.addEventListener('input', () => this.actualizarTotal());
      inputPrecio.addEventListener('input', () => this.actualizarTotal());

      this.actualizarTotal();
    }

    // ========================================
    // ELIMINAR REPUESTO
    // ========================================
    eliminarRepuesto(repuestoId) {
      const elemento = document.getElementById(repuestoId);
      if (elemento) {
        elemento.remove();
        this.actualizarTotal();
      }
    }

    // ========================================
    // ACTUALIZAR TOTAL
    // ========================================
    actualizarTotal() {
      let totalTrabajos = 0;
      let totalRepuestos = 0;

      // Sumar trabajos
      document.querySelectorAll('.trabajo-costo').forEach(input => {
        const valor = parseFloat(input.value) || 0;
        totalTrabajos += valor;
      });

      // Sumar repuestos
      document.querySelectorAll('.item-row').forEach(item => {
        const cantidadInput = item.querySelector('.repuesto-cantidad');
        const precioInput = item.querySelector('.repuesto-precio');

        if (cantidadInput && precioInput) {
          const cantidad = parseFloat(cantidadInput.value) || 0;
          const precio = parseFloat(precioInput.value) || 0;
          totalRepuestos += cantidad * precio;
        }
      });

      const totalGeneral = totalTrabajos + totalRepuestos;

      // Actualizar displays
      const totalTrabajosEl = document.getElementById('total-trabajos');
      const totalRepuestosEl = document.getElementById('total-repuestos');
      const totalGeneralEl = document.getElementById('total-general');

      if (totalTrabajosEl) totalTrabajosEl.textContent = `$${totalTrabajos.toFixed(2)}`;
      if (totalRepuestosEl) totalRepuestosEl.textContent = `$${totalRepuestos.toFixed(2)}`;
      if (totalGeneralEl) totalGeneralEl.textContent = `$${totalGeneral.toFixed(2)}`;
    }

    // ========================================
    // GENERAR REPORTE
    // ========================================
    generarReporte() {
      // Validar que haya una orden seleccionada
      const ordenId = document.getElementById('orden_id').value;
      if (!ordenId) {
        alert('Por favor seleccione una orden');
        return;
      }

      // Recopilar todos los datos del formulario
      const trabajos = [];
      document.querySelectorAll('.item-row').forEach(item => {
        const descripcionInput = item.querySelector('.trabajo-descripcion');
        const costoInput = item.querySelector('.trabajo-costo');

        if (descripcionInput && costoInput) {
          const descripcion = descripcionInput.value;
          const costo = parseFloat(costoInput.value) || 0;
          if (descripcion) {
            trabajos.push({ descripcion, costo });
          }
        }
      });

      const repuestos = [];
      document.querySelectorAll('.item-row').forEach(item => {
        const nombreInput = item.querySelector('.repuesto-nombre');
        const cantidadInput = item.querySelector('.repuesto-cantidad');
        const precioInput = item.querySelector('.repuesto-precio');

        if (nombreInput && cantidadInput && precioInput) {
          const nombre = nombreInput.value;
          const cantidad = parseInt(cantidadInput.value) || 0;
          const precio = parseFloat(precioInput.value) || 0;
          if (nombre) {
            repuestos.push({
              nombre,
              cantidad,
              precio,
              subtotal: cantidad * precio
            });
          }
        }
      });

      const reporte = {
        orden_id: ordenId,
        tecnico: document.getElementById('tecnico').value,
        equipo: document.getElementById('equipo').value,
        observaciones: document.getElementById('observaciones').value,
        trabajos: trabajos,
        repuestos: repuestos,
        total_trabajos: trabajos.reduce((sum, t) => sum + t.costo, 0),
        total_repuestos: repuestos.reduce((sum, r) => sum + r.subtotal, 0),
        fecha_reporte: new Date().toISOString()
      };

      reporte.total_general = reporte.total_trabajos + reporte.total_repuestos;

      console.log('Reporte generado:', reporte);

      // Guardar en localStorage
      this.guardarReporte(reporte);

      // Mostrar confirmación
      alert('¡Reporte generado exitosamente!');

      // Limpiar formulario y ocultar
      this.limpiarFormulario();

      const formContainer = document.getElementById("form-container-reporte");
      if (formContainer) {
        formContainer.style.visibility = "hidden";
        formContainer.style.display = "none";
      }
      this.mostrarReportes();

    }

    // ========================================
    // GUARDAR REPORTE EN LOCALSTORAGE
    // ========================================
    guardarReporte(reporte) {
      try {
        let reportes = localStorage.getItem('Reportes');
        reportes = reportes ? JSON.parse(reportes) : [];

        reportes.push(reporte);
        localStorage.setItem('Reportes', JSON.stringify(reportes));

        console.log('Reporte guardado exitosamente');
      } catch (error) {
        console.error('Error al guardar reporte:', error);
      }
    }

    // ========================================
    // CARGAR ÓRDENES RECIENTES DESDE API
    // ========================================
    async cargarOrdenesRecientes() {
      try {
        const API_BASE_URL = window.API_BASE_URL || 'https://backendtecnishop.onrender.com/api';

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

        const ordenesRecientes = responseData.ordenes || [];

        const ordenesTransformadas = await Promise.all(ordenesRecientes.map(async (orden) => {
          const equipo = orden.equipo || {};
          const observaciones = equipo.observaciones?.[0] || {};
          const problemas = equipo.problemas || [];

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
            numero_orden: orden.numero_orden,
            cliente_nombre: clienteNombre,
            cliente_ci: equipo.cliente_ci || 'N/A',
            cliente_telefono: '',
            cliente_correo: '',
            equipo_nombre: equipo.nombre || 'N/A',
            equipo_marca: equipo.marca || 'N/A',
            equipo_modelo: equipo.modelo || 'N/A',
            numero_serie: equipo.numero_serie || 'N/A',
            fecha: orden.fecha,
            problemas: problemas.map(p => p.problema),
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
        this.ordenes = ordenesTransformadas;
      } catch (error) {
        console.error('Error al cargar órdenes recientes:', error);
      }
    }
    //MOSTRAR REPORTES EN PANTALLA 

    async mostrarReportes() {
      try {
        // 1) Llamar al endpoint
        let response = await fetch(API_BASE_URL + "/reportes/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        let data = await response.json();
        let reportes = Array.isArray(data.data) ? data.data : [];

        // 2) Guardar reportes en localStorage para acceso posterior
        localStorage.setItem('ReportesData', JSON.stringify(reportes));
        this.reportesOriginales = reportes; // Guardar referencia para filtrado
        console.log('Reportes guardados en localStorage:', reportes.length);

        // Renderizar reportes
        this.renderizarTablaReportes(reportes);

      } catch (error) {
        console.error("Error al mostrar reportes:", error);
      }
    }

    // ========================================
    // RENDERIZAR TABLA DE REPORTES
    // ========================================
    renderizarTablaReportes(reportes) {

      const lista = document.getElementById("reportes-containers");
      lista.innerHTML = "";

      if (reportes.length === 0) {
        lista.innerHTML = `
            <div class="empty-container">
              No hay reportes registrados actualmente.
            </div>
          `;
        return;
      }

      // --- FUNCIONES AUXILIARES ---
      const formatCurrency = (v) => {
        const num = typeof v === "string" ? parseFloat(v) : (v || 0);
        return `$${isNaN(num) ? "0.00" : num.toFixed(2)}`;
      };

      const formatDate = (fechaStr) => {
        if (!fechaStr) return "Sin fecha";
        return new Date(fechaStr).toLocaleDateString('es-EC', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      };

      // 3) Crear tabla de reportes
      const tableHTML = `
          <table class="reportes-table">
            <thead>
              <tr>
                <th>Código Orden</th>
                <th>Cliente</th>
                <th>Máquina</th>
                <th>Fecha</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${reportes.map(rep => {
        const orden = rep.orden || {};
        const equipo = orden.equipo || {};
        const cliente = equipo.cliente || {};

        // Extraer datos
        const codigoOrden = orden.numero_orden || `ORD-${rep.orden_id}`;
        const nombreCliente = cliente.nombre && cliente.apellido
          ? `${cliente.nombre} ${cliente.apellido}`
          : (cliente.nombre || 'N/A');
        const maquina = equipo.nombre && equipo.marca
          ? `${equipo.nombre} - ${equipo.marca}`
          : (equipo.nombre || 'N/A');
        const fecha = formatDate(rep.fecha_creacion || orden.fecha);
        const total = formatCurrency(rep.total_general);

        return `
                  <tr onclick="abrirModalReporte('${rep.id}')" title="Click para ver detalles">
                    <td><span class="reporte-badge">${codigoOrden}</span></td>
                    <td>${nombreCliente}</td>
                    <td>${maquina}</td>
                    <td>${fecha}</td>
                    <td class="reporte-total">${total}</td>
                  </tr>
                `;
      }).join('')}
            </tbody>
          </table>
        `;

      lista.innerHTML = tableHTML;
    }

    // ========================================
    // FILTRAR REPORTES
    // ========================================
    filtrarReportes() {
      const filtroCliente = document.getElementById('filtro-cliente')?.value.toLowerCase().trim() || '';
      const filtroOrden = document.getElementById('filtro-orden')?.value.toLowerCase().trim() || '';
      const filtroDesde = document.getElementById('filtro-fecha-desde')?.value || '';
      const filtroHasta = document.getElementById('filtro-fecha-hasta')?.value || '';

      // Si no hay reportes originales, cargarlos desde localStorage
      if (!this.reportesOriginales || this.reportesOriginales.length === 0) {
        const reportesStr = localStorage.getItem('ReportesData');
        this.reportesOriginales = reportesStr ? JSON.parse(reportesStr) : [];
      }

      let reportesFiltrados = this.reportesOriginales.filter(rep => {
        const orden = rep.orden || {};
        const equipo = orden.equipo || {};
        const cliente = equipo.cliente || {};

        // Filtro por cliente
        const nombreCliente = `${cliente.nombre || ''} ${cliente.apellido || ''}`.toLowerCase();
        if (filtroCliente && !nombreCliente.includes(filtroCliente)) {
          return false;
        }

        // Filtro por codigo de orden
        const codigoOrden = (orden.numero_orden || '').toLowerCase();
        if (filtroOrden && !codigoOrden.includes(filtroOrden)) {
          return false;
        }

        // Filtro por fecha
        const fechaReporte = rep.fecha_creacion || orden.fecha || '';
        if (fechaReporte) {
          const fechaReporteDate = new Date(fechaReporte).toISOString().split('T')[0];

          if (filtroDesde && fechaReporteDate < filtroDesde) {
            return false;
          }

          if (filtroHasta && fechaReporteDate > filtroHasta) {
            return false;
          }
        }

        return true;
      });

      // Renderizar los reportes filtrados
      this.renderizarTablaReportes(reportesFiltrados);
    }

    // ========================================
    // LIMPIAR FILTROS
    // ========================================
    limpiarFiltros() {
      // Limpiar los inputs
      const filtroCliente = document.getElementById('filtro-cliente');
      const filtroOrden = document.getElementById('filtro-orden');
      const filtroDesde = document.getElementById('filtro-fecha-desde');
      const filtroHasta = document.getElementById('filtro-fecha-hasta');

      if (filtroCliente) filtroCliente.value = '';
      if (filtroOrden) filtroOrden.value = '';
      if (filtroDesde) filtroDesde.value = '';
      if (filtroHasta) filtroHasta.value = '';

      // Mostrar todos los reportes
      this.renderizarTablaReportes(this.reportesOriginales);
    }

    // ========================================
    // OBTENER REPORTE DESDE LOCALSTORAGE POR ID
    // ========================================
    obtenerReportePorId(id) {
      try {
        const reportesStr = localStorage.getItem('ReportesData');
        if (!reportesStr) return null;

        const reportes = JSON.parse(reportesStr);
        return reportes.find(r => String(r.id) === String(id)) || null;
      } catch (error) {
        console.error('Error al obtener reporte:', error);
        return null;
      }
    }

    // ========================================
    // ABRIR MODAL CON DETALLES DEL REPORTE
    // ========================================
    abrirModalReporte(reporteId) {
      const reporte = this.obtenerReportePorId(reporteId);
      if (!reporte) {
        alert('No se pudo encontrar el reporte');
        return;
      }

      // Guardar ID del reporte seleccionado para la descarga
      window.reporteSeleccionadoId = reporteId;

      const orden = reporte.orden || {};
      const equipo = orden.equipo || {};
      const cliente = equipo.cliente || {};
      const problemas = equipo.problemas || [];
      const observacionesEquipo = equipo.observaciones_equipo?.[0] || {};
      const trabajos = reporte.trabajos_realizados || [];
      const repuestos = reporte.repuestos_utilizados || [];

      const formatCurrency = (v) => {
        const num = typeof v === "string" ? parseFloat(v) : (v || 0);
        return `$${isNaN(num) ? "0.00" : num.toFixed(2)}`;
      };

      const formatDate = (fechaStr) => {
        if (!fechaStr) return "Sin fecha";
        return new Date(fechaStr).toLocaleString('es-EC');
      };

      // Construir contenido del modal
      const modalBody = document.getElementById('modal-body-content');
      const modalTitle = document.getElementById('modal-title');

      modalTitle.textContent = `Reporte #${reporte.id} - ${orden.numero_orden || 'N/A'}`;

      modalBody.innerHTML = `
        <!-- Información de la Orden -->
        <div class="detail-section">
          <h3>Informacion de la Orden</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Número de Orden</span>
              <span class="detail-value">${orden.numero_orden || 'N/A'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Fecha de Orden</span>
              <span class="detail-value">${orden.fecha || 'N/A'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Estado</span>
              <span class="detail-value">${orden.estado || 'N/A'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Técnico</span>
              <span class="detail-value">${orden.realiza_orden || reporte.persona_a_cargo || 'N/A'}</span>
            </div>
          </div>
        </div>

        <!-- Información del Cliente -->
        <div class="detail-section">
          <h3>Datos del Cliente</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Nombre Completo</span>
              <span class="detail-value">${cliente.nombre || ''} ${cliente.apellido || ''}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">CI/RUC</span>
              <span class="detail-value">${cliente.ci || 'N/A'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Teléfono</span>
              <span class="detail-value">${cliente.telefono || 'N/A'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Correo</span>
              <span class="detail-value">${cliente.correo || 'N/A'}</span>
            </div>
          </div>
        </div>

        <!-- Información del Equipo -->
        <div class="detail-section">
          <h3>Datos del Equipo</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Nombre</span>
              <span class="detail-value">${equipo.nombre || 'N/A'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Marca</span>
              <span class="detail-value">${equipo.marca || 'N/A'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Modelo</span>
              <span class="detail-value">${equipo.modelo || 'N/A'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Número de Serie</span>
              <span class="detail-value">${equipo.numero_serie || 'N/A'}</span>
            </div>
          </div>

          <h4 style="margin-top: 15px; color: #c53030;">Problemas Reportados:</h4>
          ${problemas.length > 0 ? `
            <ul class="problems-list">
              ${problemas.map(p => `<li>${p.problema}</li>`).join('')}
            </ul>
          ` : '<p style="color: #718096; font-style: italic;">Sin problemas registrados</p>'}

          <h4 style="margin-top: 15px; color: #4a5568;">Accesorios Recibidos:</h4>
          <div class="accessories-grid">
            <span class="accessory-badge ${observacionesEquipo.cargador ? 'yes' : 'no'}">
              ${observacionesEquipo.cargador ? 'SI' : 'NO'} Cargador
            </span>
            <span class="accessory-badge ${observacionesEquipo.bateria ? 'yes' : 'no'}">
              ${observacionesEquipo.bateria ? 'SI' : 'NO'} Bateria
            </span>
            <span class="accessory-badge ${observacionesEquipo.cable_poder ? 'yes' : 'no'}">
              ${observacionesEquipo.cable_poder ? 'SI' : 'NO'} Cable Poder
            </span>
            <span class="accessory-badge ${observacionesEquipo.cable_datos ? 'yes' : 'no'}">
              ${observacionesEquipo.cable_datos ? 'SI' : 'NO'} Cable Datos
            </span>
          </div>
          ${observacionesEquipo.otros ? `
            <p style="margin-top: 10px; color: #4a5568;"><strong>Otros:</strong> ${observacionesEquipo.otros}</p>
          ` : ''}
        </div>

        <!-- Trabajos Realizados -->
        <div class="detail-section">
          <h3>Trabajos Realizados (${trabajos.length})</h3>
          ${trabajos.length > 0 ? `
            <table class="detail-table">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th style="text-align: right;">Costo</th>
                </tr>
              </thead>
              <tbody>
                ${trabajos.map(t => `
                  <tr>
                    <td>${t.descripcion || 'N/A'}</td>
                    <td style="text-align: right; font-weight: 600;">${formatCurrency(t.costo)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p style="color: #718096; font-style: italic;">Sin trabajos registrados</p>'}
        </div>

        <!-- Repuestos Utilizados -->
        <div class="detail-section">
          <h3>Repuestos Utilizados (${repuestos.length})</h3>
          ${repuestos.length > 0 ? `
            <table class="detail-table">
              <thead>
                <tr>
                  <th>Repuesto</th>
                  <th style="text-align: center;">Cantidad</th>
                  <th style="text-align: right;">P. Unitario</th>
                  <th style="text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${repuestos.map(r => `
                  <tr>
                    <td>${r.nombre_repuesto || r.nombre || 'N/A'}</td>
                    <td style="text-align: center;">${r.cantidad || 1}</td>
                    <td style="text-align: right;">${formatCurrency(r.precio_unitario || r.precio)}</td>
                    <td style="text-align: right; font-weight: 600;">${formatCurrency(r.subtotal)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p style="color: #718096; font-style: italic;">Sin repuestos registrados</p>'}
        </div>

        <!-- Observaciones del Reporte -->
        ${reporte.observaciones ? `
          <div class="detail-section">
            <h3>Observaciones del Reporte</h3>
            <div class="observaciones-box">
              ${reporte.observaciones}
            </div>
          </div>
        ` : ''}

        <!-- Totales -->
        <div class="totals-summary">
          <div class="total-row">
            <span>Total Trabajos:</span>
            <span>${formatCurrency(reporte.total_trabajos)}</span>
          </div>
          <div class="total-row">
            <span>Total Repuestos:</span>
            <span>${formatCurrency(reporte.total_repuestos)}</span>
          </div>
          <div class="total-row grand-total">
            <span>TOTAL GENERAL:</span>
            <span>${formatCurrency(reporte.total_general)}</span>
          </div>
        </div>

        <p style="text-align: center; margin-top: 20px; color: #718096; font-size: 0.85rem;">
          Fecha de creación del reporte: ${formatDate(reporte.fecha_creacion)}
        </p>
      `;

      // Mostrar modal
      const modal = document.getElementById('reporte-detail-modal');
      modal.classList.add('active');
    }

    // ========================================
    // CERRAR MODAL
    // ========================================
    cerrarModalReporte() {
      const modal = document.getElementById('reporte-detail-modal');
      modal.classList.remove('active');
    }

    // ========================================
    // GENERAR CONTENIDO HTML DEL REPORTE
    // ========================================
    generarContenidoReporte() {
      const reporteId = window.reporteSeleccionadoId;
      const reporte = this.obtenerReportePorId(reporteId);

      if (!reporte) {
        alert('No se pudo encontrar el reporte');
        return null;
      }

      const orden = reporte.orden || {};
      const equipo = orden.equipo || {};
      const cliente = equipo.cliente || {};
      const problemas = equipo.problemas || [];
      const observacionesEquipo = equipo.observaciones_equipo?.[0] || {};
      const trabajos = reporte.trabajos_realizados || [];
      const repuestos = reporte.repuestos_utilizados || [];

      const formatCurrency = (v) => {
        const num = typeof v === "string" ? parseFloat(v) : (v || 0);
        return `$${isNaN(num) ? "0.00" : num.toFixed(2)}`;
      };

      return { reporte, orden, equipo, cliente, problemas, observacionesEquipo, trabajos, repuestos, formatCurrency };
    }

    // ========================================
    // DESCARGAR PDF DIRECTAMENTE
    // ========================================
    descargarPDF() {
      const data = this.generarContenidoReporte();
      if (!data) return;

      const { reporte, orden, equipo, cliente, problemas, observacionesEquipo, trabajos, repuestos, formatCurrency } = data;

      // Crear el contenido del reporte
      const reporteHTML = this.crearHTMLReporte(data);

      // Crear un elemento temporal para el PDF
      const container = document.createElement('div');
      container.innerHTML = reporteHTML;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.width = '210mm';
      document.body.appendChild(container);

      const nombreArchivo = `Reporte_${orden.numero_orden || reporte.id}.pdf`;

      // Verificar si html2pdf esta disponible
      if (typeof html2pdf !== 'undefined') {
        const opciones = {
          margin: 10,
          filename: nombreArchivo,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf()
          .set(opciones)
          .from(container)
          .save()
          .then(() => {
            document.body.removeChild(container);
            console.log('PDF descargado exitosamente:', nombreArchivo);
          })
          .catch((error) => {
            console.error('Error al generar PDF:', error);
            document.body.removeChild(container);
            alert('Error al generar el PDF. Intente nuevamente.');
          });
      } else {
        // Metodo alternativo: mostrar mensaje de error
        document.body.removeChild(container);
        alert('La libreria html2pdf no esta cargada. Por favor, recargue la pagina e intente nuevamente.');
      }
    }

    // ========================================
    // IMPRIMIR REPORTE (abre dialogo de impresion)
    // ========================================
    imprimirReporte() {
      const data = this.generarContenidoReporte();
      if (!data) return;

      const { reporte, orden, equipo, cliente, problemas, observacionesEquipo, trabajos, repuestos, formatCurrency } = data;

      const printContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Reporte Técnico - ${orden.numero_orden || 'N/A'}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            @page { size: A4 portrait; margin: 10mm; }
            body { font-family: Arial, sans-serif; font-size: 11px; padding: 20px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #3b82f6; }
            .header h1 { color: #3b82f6; font-size: 18px; }
            .header .orden-info { text-align: right; }
            .section { margin-bottom: 20px; }
            .section h3 { background: #3b82f6; color: white; padding: 8px 12px; font-size: 12px; margin-bottom: 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .item { padding: 5px 0; }
            .item .label { font-weight: bold; color: #555; font-size: 10px; }
            .item .value { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 10px; }
            th { background: #f5f5f5; font-weight: bold; }
            .totals { background: #3b82f6; color: white; padding: 15px; margin-top: 20px; text-align: right; }
            .totals .row { padding: 5px 0; }
            .totals .grand { font-size: 16px; font-weight: bold; border-top: 1px solid white; padding-top: 10px; margin-top: 10px; }
            .problema-item { background: #fff3f3; padding: 5px 10px; margin: 3px 0; border-left: 3px solid #e53e3e; }
            .accesorio { display: inline-block; padding: 3px 8px; margin: 2px; border-radius: 10px; font-size: 9px; }
            .accesorio.yes { background: #d4edda; color: #155724; }
            .accesorio.no { background: #f8d7da; color: #721c24; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>REPORTE TÉCNICO</h1>
              <p>www.intecnic.com</p>
              <p>CDLA. CONDOR MZ. G VILLA 13 LOCALES #1 Y #2</p>
              <p>Teléfono: 0999339586 | Email: tecnishop.imp@gmail.com</p>
            </div>
            <div class="orden-info">
              <p><strong>Reporte No:</strong> ${reporte.id}</p>
              <p><strong>Orden:</strong> ${orden.numero_orden || 'N/A'}</p>
              <p><strong>Fecha:</strong> ${orden.fecha || 'N/A'}</p>
            </div>
          </div>

          <div class="section">
            <h3>DATOS DEL CLIENTE</h3>
            <div class="grid">
              <div class="item"><span class="label">Nombre:</span> <span class="value">${cliente.nombre || ''} ${cliente.apellido || ''}</span></div>
              <div class="item"><span class="label">CI/RUC:</span> <span class="value">${cliente.ci || 'N/A'}</span></div>
              <div class="item"><span class="label">Teléfono:</span> <span class="value">${cliente.telefono || 'N/A'}</span></div>
              <div class="item"><span class="label">Correo:</span> <span class="value">${cliente.correo || 'N/A'}</span></div>
            </div>
          </div>

          <div class="section">
            <h3>DATOS DEL EQUIPO</h3>
            <div class="grid">
              <div class="item"><span class="label">Artículo:</span> <span class="value">${equipo.nombre || 'N/A'}</span></div>
              <div class="item"><span class="label">Marca:</span> <span class="value">${equipo.marca || 'N/A'}</span></div>
              <div class="item"><span class="label">Modelo:</span> <span class="value">${equipo.modelo || 'N/A'}</span></div>
              <div class="item"><span class="label">No. Serie:</span> <span class="value">${equipo.numero_serie || 'N/A'}</span></div>
            </div>
            
            <p style="margin-top: 10px;"><strong>Problemas Reportados:</strong></p>
            ${problemas.map(p => `<div class="problema-item">${p.problema}</div>`).join('') || '<p style="color: #666; font-style: italic;">Sin problemas registrados</p>'}
            
            <p style="margin-top: 10px;"><strong>Accesorios:</strong></p>
            <span class="accesorio ${observacionesEquipo.cargador ? 'yes' : 'no'}">${observacionesEquipo.cargador ? 'SI' : 'NO'} Cargador</span>
            <span class="accesorio ${observacionesEquipo.bateria ? 'yes' : 'no'}">${observacionesEquipo.bateria ? 'SI' : 'NO'} Bateria</span>
            <span class="accesorio ${observacionesEquipo.cable_poder ? 'yes' : 'no'}">${observacionesEquipo.cable_poder ? 'SI' : 'NO'} Cable Poder</span>
            <span class="accesorio ${observacionesEquipo.cable_datos ? 'yes' : 'no'}">${observacionesEquipo.cable_datos ? 'SI' : 'NO'} Cable Datos</span>
            ${observacionesEquipo.otros ? `<p style="margin-top: 5px;"><strong>Otros:</strong> ${observacionesEquipo.otros}</p>` : ''}
          </div>

          <div class="section">
            <h3>TRABAJOS REALIZADOS</h3>
            ${trabajos.length > 0 ? `
              <table>
                <thead><tr><th>Descripción</th><th style="text-align: right; width: 100px;">Costo</th></tr></thead>
                <tbody>
                  ${trabajos.map(t => `<tr><td>${t.descripcion || 'N/A'}</td><td style="text-align: right;">${formatCurrency(t.costo)}</td></tr>`).join('')}
                </tbody>
              </table>
            ` : '<p style="color: #666; font-style: italic;">Sin trabajos registrados</p>'}
          </div>

          <div class="section">
            <h3>REPUESTOS UTILIZADOS</h3>
            ${repuestos.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th>Repuesto</th>
                    <th style="text-align: center; width: 60px;">Cant.</th>
                    <th style="text-align: right; width: 80px;">P.Unit</th>
                    <th style="text-align: right; width: 80px;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${repuestos.map(r => `
                    <tr>
                      <td>${r.nombre_repuesto || r.nombre || 'N/A'}</td>
                      <td style="text-align: center;">${r.cantidad || 1}</td>
                      <td style="text-align: right;">${formatCurrency(r.precio_unitario || r.precio)}</td>
                      <td style="text-align: right;">${formatCurrency(r.subtotal)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p style="color: #666; font-style: italic;">Sin repuestos registrados</p>'}
          </div>

          ${reporte.observaciones ? `
            <div class="section">
              <h3>OBSERVACIONES</h3>
              <p style="padding: 10px; background: #f9f9f9; border: 1px solid #ddd;">${reporte.observaciones}</p>
            </div>
          ` : ''}

          <div class="totals">
            <div class="row">Total Trabajos: ${formatCurrency(reporte.total_trabajos)}</div>
            <div class="row">Total Repuestos: ${formatCurrency(reporte.total_repuestos)}</div>
            <div class="row grand">TOTAL GENERAL: ${formatCurrency(reporte.total_general)}</div>
          </div>

          <div style="margin-top: 60px; display: flex; justify-content: space-between;">
            <div style="text-align: center;">
              <div style="border-top: 1px solid #333; width: 200px; padding-top: 5px;">FIRMA DEL CLIENTE</div>
            </div>
            <div style="text-align: center;">
              <div style="border-top: 1px solid #333; width: 200px; padding-top: 5px;">TÉCNICO RESPONSABLE</div>
            </div>
          </div>

          <p style="text-align: center; margin-top: 30px; color: #888; font-size: 9px;">
            Reporte generado el: ${new Date().toLocaleString('es-EC')}
          </p>
        </body>
        </html>
      `;

      // Abrir ventana de impresión
      const printWindow = window.open('', '_blank');
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();

      // Esperar a que cargue y luego imprimir
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }

    // ========================================
    // CREAR HTML DEL REPORTE (usado por descargarPDF)
    // ========================================
    crearHTMLReporte(data) {
      const { reporte, orden, equipo, cliente, problemas, observacionesEquipo, trabajos, repuestos, formatCurrency } = data;

      return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Reporte Tecnico - ${orden.numero_orden || 'N/A'}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; font-size: 11px; padding: 20px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #3b82f6; }
            .header h1 { color: #3b82f6; font-size: 18px; }
            .header .orden-info { text-align: right; }
            .section { margin-bottom: 20px; }
            .section h3 { background: #3b82f6; color: white; padding: 8px 12px; font-size: 12px; margin-bottom: 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .item { padding: 5px 0; }
            .item .label { font-weight: bold; color: #555; font-size: 10px; }
            .item .value { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 10px; }
            th { background: #f5f5f5; font-weight: bold; }
            .totals { background: #3b82f6; color: white; padding: 15px; margin-top: 20px; text-align: right; }
            .totals .row { padding: 5px 0; }
            .totals .grand { font-size: 16px; font-weight: bold; border-top: 1px solid white; padding-top: 10px; margin-top: 10px; }
            .problema-item { background: #fff3f3; padding: 5px 10px; margin: 3px 0; border-left: 3px solid #e53e3e; }
            .accesorio { display: inline-block; padding: 3px 8px; margin: 2px; border-radius: 10px; font-size: 9px; }
            .accesorio.yes { background: #d4edda; color: #155724; }
            .accesorio.no { background: #f8d7da; color: #721c24; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>REPORTE TECNICO</h1>
              <p>www.intecnic.com</p>
              <p>CDLA. CONDOR MZ. G VILLA 13 LOCALES #1 Y #2</p>
              <p>Telefono: 0999339586 | Email: tecnishop.imp@gmail.com</p>
            </div>
            <div class="orden-info">
              <p><strong>Reporte No:</strong> ${reporte.id}</p>
              <p><strong>Orden:</strong> ${orden.numero_orden || 'N/A'}</p>
              <p><strong>Fecha:</strong> ${orden.fecha || 'N/A'}</p>
            </div>
          </div>

          <div class="section">
            <h3>DATOS DEL CLIENTE</h3>
            <div class="grid">
              <div class="item"><span class="label">Nombre:</span> <span class="value">${cliente.nombre || ''} ${cliente.apellido || ''}</span></div>
              <div class="item"><span class="label">CI/RUC:</span> <span class="value">${cliente.ci || 'N/A'}</span></div>
              <div class="item"><span class="label">Telefono:</span> <span class="value">${cliente.telefono || 'N/A'}</span></div>
              <div class="item"><span class="label">Correo:</span> <span class="value">${cliente.correo || 'N/A'}</span></div>
            </div>
          </div>

          <div class="section">
            <h3>DATOS DEL EQUIPO</h3>
            <div class="grid">
              <div class="item"><span class="label">Articulo:</span> <span class="value">${equipo.nombre || 'N/A'}</span></div>
              <div class="item"><span class="label">Marca:</span> <span class="value">${equipo.marca || 'N/A'}</span></div>
              <div class="item"><span class="label">Modelo:</span> <span class="value">${equipo.modelo || 'N/A'}</span></div>
              <div class="item"><span class="label">No. Serie:</span> <span class="value">${equipo.numero_serie || 'N/A'}</span></div>
            </div>
            
            <p style="margin-top: 10px;"><strong>Problemas Reportados:</strong></p>
            ${problemas.map(p => '<div class="problema-item">' + p.problema + '</div>').join('') || '<p style="color: #666; font-style: italic;">Sin problemas registrados</p>'}
            
            <p style="margin-top: 10px;"><strong>Accesorios:</strong></p>
            <span class="accesorio ${observacionesEquipo.cargador ? 'yes' : 'no'}">${observacionesEquipo.cargador ? 'SI' : 'NO'} Cargador</span>
            <span class="accesorio ${observacionesEquipo.bateria ? 'yes' : 'no'}">${observacionesEquipo.bateria ? 'SI' : 'NO'} Bateria</span>
            <span class="accesorio ${observacionesEquipo.cable_poder ? 'yes' : 'no'}">${observacionesEquipo.cable_poder ? 'SI' : 'NO'} Cable Poder</span>
            <span class="accesorio ${observacionesEquipo.cable_datos ? 'yes' : 'no'}">${observacionesEquipo.cable_datos ? 'SI' : 'NO'} Cable Datos</span>
            ${observacionesEquipo.otros ? '<p style="margin-top: 5px;"><strong>Otros:</strong> ' + observacionesEquipo.otros + '</p>' : ''}
          </div>

          <div class="section">
            <h3>TRABAJOS REALIZADOS</h3>
            ${trabajos.length > 0 ?
          '<table><thead><tr><th>Descripcion</th><th style="text-align: right; width: 100px;">Costo</th></tr></thead><tbody>' +
          trabajos.map(t => '<tr><td>' + (t.descripcion || 'N/A') + '</td><td style="text-align: right;">' + formatCurrency(t.costo) + '</td></tr>').join('') +
          '</tbody></table>'
          : '<p style="color: #666; font-style: italic;">Sin trabajos registrados</p>'}
          </div>

          <div class="section">
            <h3>REPUESTOS UTILIZADOS</h3>
            ${repuestos.length > 0 ?
          '<table><thead><tr><th>Repuesto</th><th style="text-align: center; width: 60px;">Cant.</th><th style="text-align: right; width: 80px;">P.Unit</th><th style="text-align: right; width: 80px;">Subtotal</th></tr></thead><tbody>' +
          repuestos.map(r => '<tr><td>' + (r.nombre_repuesto || r.nombre || 'N/A') + '</td><td style="text-align: center;">' + (r.cantidad || 1) + '</td><td style="text-align: right;">' + formatCurrency(r.precio_unitario || r.precio) + '</td><td style="text-align: right;">' + formatCurrency(r.subtotal) + '</td></tr>').join('') +
          '</tbody></table>'
          : '<p style="color: #666; font-style: italic;">Sin repuestos registrados</p>'}
          </div>

          ${reporte.observaciones ?
          '<div class="section"><h3>OBSERVACIONES</h3><p style="padding: 10px; background: #f9f9f9; border: 1px solid #ddd;">' + reporte.observaciones + '</p></div>'
          : ''}

          <div class="totals">
            <div class="row">Total Trabajos: ${formatCurrency(reporte.total_trabajos)}</div>
            <div class="row">Total Repuestos: ${formatCurrency(reporte.total_repuestos)}</div>
            <div class="row grand">TOTAL GENERAL: ${formatCurrency(reporte.total_general)}</div>
          </div>

          <div style="margin-top: 60px; display: flex; justify-content: space-between;">
            <div style="text-align: center;">
              <div style="border-top: 1px solid #333; width: 200px; padding-top: 5px;">FIRMA DEL CLIENTE</div>
            </div>
            <div style="text-align: center;">
              <div style="border-top: 1px solid #333; width: 200px; padding-top: 5px;">TECNICO RESPONSABLE</div>
            </div>
          </div>

          <p style="text-align: center; margin-top: 30px; color: #888; font-size: 9px;">
            Reporte generado el: ${new Date().toLocaleString('es-EC')}
          </p>
        </body>
        </html>
      `;
    }

    // ========================================
    // OBTENER INFO DEL CLIENTE
    // ========================================
    async obtenerInfoCliente(ci) {
      // Implementar si es necesario
      return null;
    }

    // ========================================
    // DESTRUIR INSTANCIA
    // ========================================
    destroy() {
      this.cleanup();
      this.isInitialized = false;
      console.log('ReportesService destruido');
    }
  }

  // Register the service for initialization
  window.sectionServices = window.sectionServices || {};
  window.sectionServices.reportes = new ReportesService();

  // Exponer funciones globales para los botones del modal
  window.abrirModalReporte = (id) => window.sectionServices.reportes.abrirModalReporte(id);
  window.cerrarModalReporte = () => window.sectionServices.reportes.cerrarModalReporte();
  window.descargarPDF = () => window.sectionServices.reportes.descargarPDF();
  window.imprimirReporte = () => window.sectionServices.reportes.imprimirReporte();

  // Exponer funciones globales para los filtros
  window.filtrarReportes = () => window.sectionServices.reportes.filtrarReportes();
  window.limpiarFiltros = () => window.sectionServices.reportes.limpiarFiltros();
})();
