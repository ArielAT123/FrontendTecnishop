(function () {
  // ========================================
  // ORDENES SERVICE
  // ========================================
  class OrdenesService {
    constructor() {
      this.clientes = [];
      this.equipos = [];
    }

    // ========================================
    // INICIALIZAR SECCIÓN DE ÓRDENES
    // ========================================
    async initialize() {
      try {
        [this.clientes, this.equipos] = await Promise.all([getClientes(), getEquipos()]);
        this.populateEquiposDropdown();
        this.handleOrdenForm();
        setCurrentDate(); // From api.js
      } catch (error) {
        console.error('Error al inicializar órdenes:', error);
        showNotification('Error al inicializar la sección de órdenes', 'error');
      }
    }

    // ========================================
    // RELLENAR DROPDOWN DE EQUIPOS
    // ========================================
    populateEquiposDropdown() {
      const equipoSelect = document.getElementById('equipo-orden');
      if (!equipoSelect) {
        console.error('No se encontró el dropdown de equipos');
        return;
      }

      equipoSelect.innerHTML = '<option value="">Seleccione un equipo</option>';
      this.equipos.forEach(equipo => {
        const option = document.createElement('option');
        option.value = equipo.id;
        option.textContent = `${equipo.nombre} (${equipo.marca || ''} ${equipo.modelo || ''})`;
        equipoSelect.appendChild(option);
      });
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

      // Remove existing event listeners to prevent duplicates
      const newForm = form.cloneNode(true);
      form.parentNode.replaceChild(newForm, form);

      newForm.addEventListener('submit', async e => {
        e.preventDefault();
        const formData = {
          equipo_id: document.getElementById('equipo-orden').value,
          fecha: document.getElementById('fecha').value,
          realiza_orden: document.getElementById('realiza-orden').value.trim(),
          problema: document.getElementById('problema').value.trim(),
          observaciones: {
            cargador: document.getElementById('cargador').checked,
            bateria: document.getElementById('bateria').checked,
            cable_poder: document.getElementById('cable-poder').checked,
            cable_datos: document.getElementById('cable-datos').checked,
            otros: document.getElementById('otros').value.trim(),
          },
        };

        if (!formData.equipo_id || !formData.fecha || !formData.realiza_orden || !formData.problema) {
          showNotification('Por favor complete los campos obligatorios', 'error');
          return;
        }

        try {
          await this.createOrden(formData);
          showNotification('Orden creada exitosamente', 'success');
          newForm.reset();
          setCurrentDate();
        } catch (error) {
          console.error('Error al crear orden:', error);
          showNotification('Error al crear orden: ' + error.message, 'error');
        }
      });
    }

    // ========================================
    // CREAR NUEVA ORDEN
    // ========================================
    async createOrden(ordenData) {
      try {
        const response = await fetch(`${API_BASE_URL}/ordenes/crear/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ordenData),
        });

        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error('Error al crear orden:', error);
        throw error;
      }
    }
  }

  // Register the service for initialization
  window.sectionServices = window.sectionServices || {};
  window.sectionServices.ordenes = new OrdenesService();
})();