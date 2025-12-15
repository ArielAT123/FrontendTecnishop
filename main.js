import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

// Función para obtener la ruta del ícono (funciona en dev y producción)
function getIconPath() {
  if (app.isPackaged) {
    // En producción (empaquetado), busca en la carpeta de recursos
    return path.join(process.resourcesPath, 'src/assets/tecnishopicon.ico');
  } else {
    // En desarrollo, usa la ruta relativa normal
    return path.join(__dirname, 'src/assets/tecnishopicon.ico');
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    // width: 1720,
    // height: 900,
    fullscreen: true, // ← Descomenta para inicio en pantalla completa
    // kiosk: true, // ← O usa modo kiosk (pantalla completa sin poder salir con F11)
    autoHideMenuBar: true, // ← Oculta el menú File, Edit, View, Window, Help
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Para usar require en el renderer
      enableRemoteModule: true,
    },
    icon: getIconPath(), // ✅ Funciona en desarrollo Y en el .exe empaquetado
  });

  // Cargar pantalla de login
  mainWindow.loadFile('src/main/screens/login/loginScreen.html');

  // Opcional: Abrir DevTools en desarrollo
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ✅ Escuchar evento de login exitoso
ipcMain.on('login-success', (event, userData) => {
  console.log('✅ Login exitoso:', userData);

  // Cambiar a la pantalla principal/dashboard
  mainWindow.loadFile('index.html');
  // O si tienes index.html:
  // mainWindow.loadFile('index.html');
});

// ✅ Escuchar evento de logout
ipcMain.on('logout', () => {
  console.log('🔒 Cerrando sesión...');

  // Volver a la pantalla de login
  mainWindow.loadFile('src/main/screens/login/loginScreen.html');
});

// ✅ Opcional: Cambiar a cualquier pantalla
ipcMain.on('navigate-to', (event, filePath) => {
  console.log('📍 Navegando a:', filePath);
  mainWindow.loadFile(filePath);
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});