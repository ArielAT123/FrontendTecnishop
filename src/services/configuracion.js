
(function () {
    // ========================================
    // SERVICIO DE CONFIGURACIÓN - TECNISHOP
    // ========================================
    class ConfiguracionService {
        constructor() {
            this.isInitialized = false;
            this.currentTheme = 'blue-light'; // Tema por defecto
            this.themeNames = {
                'blue-light': 'Azul Claro',
                'blue-dark': 'Azul Oscuro',
                'red-light': 'Rojo Carmesí',
                'red-dark': 'Rojo Oscuro'
            };
        }

        // ========================================
        // INICIALIZAR SECCIÓN DE CONFIGURACIÓN
        // ========================================
        async initialize() {
            try {
                // Evitar inicialización múltiple
                if (this.isInitialized) {
                    this.cleanup();
                }

                // Cargar tema guardado
                this.loadSavedTheme();

                // Configurar event listeners
                this.setupEventListeners();

                // Actualizar UI con el tema actual
                this.updateThemeUI();

                this.isInitialized = true;
                console.log('ConfiguracionService inicializado correctamente');
            } catch (error) {
                console.error('Error al inicializar configuración:', error);
            }
        }

        // ========================================
        // LIMPIAR EVENT LISTENERS PREVIOS
        // ========================================
        cleanup() {
            console.log('Limpiando ConfiguracionService...');
        }

        // ========================================
        // CONFIGURAR EVENT LISTENERS
        // ========================================
        setupEventListeners() {
            const { ipcRenderer } = require('electron');

            // Botón de cerrar sesión
            const logout = document.getElementById("log-out-button");
            if (logout) {
                logout.addEventListener("click", (event) => {
                    localStorage.setItem('accessToken', "");
                    localStorage.setItem('refreshToken', "");
                    localStorage.setItem('userId', "");
                    localStorage.setItem('username', "");
                    localStorage.setItem('userEmail', "");
                    localStorage.setItem('isStaff', "");
                    localStorage.setItem('isSuperuser', "");
                    localStorage.setItem("maxSessionTime", "");
                    ipcRenderer.send('logout');
                });
            }

            // Selector de temas
            const themeSelector = document.getElementById('theme-selector');
            if (themeSelector) {
                const themeOptions = themeSelector.querySelectorAll('.theme-option');
                themeOptions.forEach(option => {
                    option.addEventListener('click', (e) => {
                        const theme = option.getAttribute('data-theme');
                        this.setTheme(theme);
                    });
                });
            }

            console.log('Event listeners de configuración establecidos');
        }

        // ========================================
        // CARGAR TEMA GUARDADO
        // ========================================
        loadSavedTheme() {
            const savedTheme = localStorage.getItem('tecnishop-theme');
            if (savedTheme && this.themeNames[savedTheme]) {
                this.currentTheme = savedTheme;
            }
            // Aplicar tema al documento
            this.applyTheme(this.currentTheme);
        }

        // ========================================
        // ESTABLECER TEMA
        // ========================================
        setTheme(theme) {
            if (!this.themeNames[theme]) {
                console.warn('Tema no válido:', theme);
                return;
            }

            this.currentTheme = theme;

            // Guardar preferencia
            localStorage.setItem('tecnishop-theme', theme);

            // Aplicar tema
            this.applyTheme(theme);

            // Actualizar UI
            this.updateThemeUI();

            console.log('Tema cambiado a:', this.themeNames[theme]);
        }

        // ========================================
        // APLICAR TEMA AL DOCUMENTO
        // ========================================
        applyTheme(theme) {
            // Establecer atributo data-theme en el HTML
            document.documentElement.setAttribute('data-theme', theme);

            // También aplicar al body por si acaso
            document.body.setAttribute('data-theme', theme);
        }

        // ========================================
        // ACTUALIZAR UI DEL SELECTOR DE TEMAS
        // ========================================
        updateThemeUI() {
            // Actualizar opciones activas
            const themeOptions = document.querySelectorAll('.theme-option');
            themeOptions.forEach(option => {
                const optionTheme = option.getAttribute('data-theme');
                if (optionTheme === this.currentTheme) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });

            // Actualizar texto del tema actual
            const currentThemeName = document.getElementById('current-theme-name');
            if (currentThemeName) {
                currentThemeName.textContent = this.themeNames[this.currentTheme];
            }
        }

        // ========================================
        // DESTRUIR INSTANCIA
        // ========================================
        destroy() {
            this.cleanup();
            this.isInitialized = false;
            console.log('ConfiguracionService destruido');
        }
    }

    // ========================================
    // INICIALIZAR TEMA AL CARGAR LA PÁGINA
    // ========================================
    function initializeThemeOnLoad() {
        const savedTheme = localStorage.getItem('tecnishop-theme') || 'blue-light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.body.setAttribute('data-theme', savedTheme);
    }

    // Ejecutar inmediatamente para evitar flash de estilos
    initializeThemeOnLoad();

    // Registrar el servicio
    window.sectionServices = window.sectionServices || {};
    window.sectionServices.configuracion = new ConfiguracionService();
})();