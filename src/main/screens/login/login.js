// login.js
const { ipcRenderer } = require('electron');

// Configuración de la API
const API_URL = 'https://backendtecnishop.onrender.com';

// Elementos del DOM
let loginForm;
let btnSubmit;
let usernameInput;
let passwordInput;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Obtener elementos
  loginForm = document.querySelector('.login-form');
  btnSubmit = document.querySelector('.btn-submit');
  usernameInput = document.getElementById('username');
  passwordInput = document.getElementById('password');

  // Agregar event listener al formulario
  loginForm.addEventListener('submit', handleLogin);

  // Verificar si ya hay una sesión activa
  checkExistingSession();

  // Focus automático en el campo de usuario
  usernameInput.focus();
});

/**
 * Manejar el envío del formulario de login
 */
async function handleLogin(e) {
  e.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  // Validar campos
  if (!username || !password) {
    showError('Por favor ingresa usuario y contraseña');
    return;
  }

  // Deshabilitar el botón y mostrar estado de carga
  setLoadingState(true);

  try {
    // Llamar a la API de Django
    const response = await fetch(`${API_URL}/api/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // ✅ LOGIN EXITOSO
      await handleSuccessfulLogin(data);
    } else {
      // ❌ ERROR DE AUTENTICACIÓN
      setLoadingState(false);
      showError(data.error || 'Credenciales inválidas');
    }

  } catch (error) {
    // ❌ ERROR DE CONEXIÓN
    console.error('❌ Error de conexión:', error);
    setLoadingState(false);
    showError('Error de conexión con el servidor.\n\nVerifica que Django esté corriendo en:\n' + API_URL);
  }
}

/**
 * Manejar login exitoso
 */

const ahora = Date.now();
  const cincoHoras = 5 * 60 * 60 * 1000;
  const horaExpiracion = ahora + cincoHoras;
async function handleSuccessfulLogin(data) {
  try {

    // Guardar tokens y datos del usuario en localStorage
    localStorage.setItem('accessToken', data.tokens.access);
    localStorage.setItem('refreshToken', data.tokens.refresh);  
    localStorage.setItem('userId', data.user.id);
    localStorage.setItem('username', data.user.username);
    localStorage.setItem('userEmail', data.user.email);
    localStorage.setItem('isStaff', data.user.is_staff);
    localStorage.setItem('isSuperuser', data.user.is_superuser);
    localStorage.setItem("maxSessionTime", horaExpiracion); // en minutos
    console.log('✅ Login exitoso para:', data.user.username);

    // Pequeña animación de éxito
    btnSubmit.textContent = '✓ ÉXITO';
    btnSubmit.style.background = 'linear-gradient(135deg, #11998e, #38ef7d)';

    // Esperar un momento para que el usuario vea el éxito
    await sleep(500);

    // Notificar al proceso principal de Electron
    ipcRenderer.send('login-success', data.user);

  } catch (error) {
    console.error('❌ Error guardando datos:', error);
    showError('Error al guardar los datos de sesión');
    setLoadingState(false);
  }
}

/**
 * Verificar si ya existe una sesión activa
 */
async function checkExistingSession() {
  const token = localStorage.getItem('accessToken');
  const username = localStorage.getItem('username');

  if (token && username) {
    console.log('🔍 Sesión existente encontrada, verificando token...');

    try {
      const response = await fetch(`${API_URL}/api/verify/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Token válido, redirigiendo al dashboard...');
        
        // Token válido, ir directamente al dashboard
        ipcRenderer.send('login-success', data.user);
      } else {
        console.log('⚠️ Token inválido o expirado, limpiando sesión...');
        localStorage.clear();
      }
    } catch (error) {
      console.log('⚠️ Error verificando token:', error);
      // No hacer nada, dejar que el usuario haga login manualmente
    }
  }
}

/**
 * Establecer estado de carga del botón
 */
function setLoadingState(loading) {
  if (loading) {
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'INICIANDO SESIÓN...';
    btnSubmit.style.opacity = '0.7';
    btnSubmit.style.cursor = 'not-allowed';
  } else {
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'INICIAR SESIÓN';
    btnSubmit.style.opacity = '1';
    btnSubmit.style.cursor = 'pointer';
    btnSubmit.style.background = 'linear-gradient(135deg, #35c3c1, #00d6b7)';
  }
}

/**
 * Mostrar mensaje de error
 */
function showError(message) {
  alert(message);
  
  // Limpiar campos de contraseña por seguridad
  passwordInput.value = '';
  passwordInput.focus();
}

/**
 * Utilidad: Esperar X milisegundos
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Manejar tecla Enter en los campos
 */
usernameInput?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    passwordInput.focus();
  }
});

passwordInput?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    loginForm.dispatchEvent(new Event('submit'));
  }
});

// Log para debugging
console.log('🚀 Login.js cargado correctamente');
console.log('📡 API URL:', API_URL);