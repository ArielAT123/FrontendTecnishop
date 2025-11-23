
(function () {
    // ========================================
    // ========================================
    class ConfiguracionService {
        constructor() {
            this.isInitialized = false;
        }

        // ========================================
        // INICIALIZAR SECCIÓN DE REPORTES
        // ========================================
        async initialize() {
            try {
                // Evitar inicialización múltiple
                if (this.isInitialized) {
                    this.cleanup();
                }

                this.setupEventListeners();
                this.isInitialized = true;
            } catch (error) {
                console.error('Error al inicializar reportes:', error);
                //showNotification('Error al inicializar la sección de reportes', 'error');
            }
        }

        // ========================================
        // LIMPIAR EVENT LISTENERS PREVIOS
        // ========================================
        cleanup() {
            // Limpiar event listeners si existen
            console.log('Limpiando ReportesService...');
        }

        // ========================================
        // CONFIGURAR EVENT LISTENERS
        // ========================================
        setupEventListeners() {

            const { ipcRenderer } = require('electron');
            const logout = document.getElementById("log-out-button");
            logout.addEventListener("click", (event) => {
                localStorage.setItem('accessToken', "");
                localStorage.setItem('refreshToken', "");
                localStorage.setItem('userId', "");
                localStorage.setItem('username', "");
                localStorage.setItem('userEmail', "");
                localStorage.setItem('isStaff', "");
                localStorage.setItem('isSuperuser', "");
                localStorage.setItem("maxSessionTime", ""); // en minutos
                ipcRenderer.send('logout'); // vuelve a la pantalla de login
            })
            // Aquí irían los event listeners específicos de reportes
            console.log('Event listeners de reportes configurados');

        }

        // ========================================
        // CARGAR TEMPLATE DEL REPORTE DESDE ARCHIVO
        // ========================================


        // ========================================
        // MOSTRAR MODAL DE REPORTE
        // ========================================
        // ========================================
        // CREAR MODAL DE REPORTE
        // ========================================


        // ========================================
        // LLENAR DATOS DEL REPORTE
        // ========================================


        // ========================================
        // IMPRIMIR REPORTE
        // ========================================


        // ========================================
        // DESTRUIR INSTANCIA
        // ========================================
        destroy() {
            this.cleanup();
            this.isInitialized = false;
            console.log('ConfiguracionService destruido');
        }
    }

    // Register the service for initialization
    window.sectionServices = window.sectionServices || {};
    window.sectionServices.configuracion = new ConfiguracionService();
})();