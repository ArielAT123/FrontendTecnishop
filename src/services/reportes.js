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
})();