import { app, BrowserWindow, ipcMain, shell, globalShortcut } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function getIconPath(): string {
  const iconName = process.platform === 'win32' ? 'tecnishopicon.ico' : 'tecnishopicon.png';
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'public', iconName);
  }
  return path.join(__dirname, '../public', iconName);
}

function createWindow(): void {
  const preloadPath = fs.existsSync(path.join(__dirname, 'preload.cjs'))
    ? path.join(__dirname, 'preload.cjs')
    : path.join(__dirname, 'preload.js');

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Tecnishop - Sistema de Gestión de Taller',
    icon: getIconPath(),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.maximize();
    mainWindow?.show();
  });

  // Open external links in default system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('app:get-version', () => app.getVersion());

ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('window:toggle-fullscreen', () => {
  if (mainWindow) {
    const isFS = !mainWindow.isFullScreen();
    mainWindow.setFullScreen(isFS);
    return isFS;
  }
  return false;
});

ipcMain.handle('window:is-fullscreen', () => {
  return mainWindow?.isFullScreen() ?? false;
});

ipcMain.handle('window:is-maximized', () => {
  return mainWindow?.isMaximized() ?? false;
});

ipcMain.handle('window:close', () => {
  mainWindow?.close();
});

ipcMain.handle('print:document', async (event, options) => {
  if (!mainWindow) return false;
  return new Promise((resolve) => {
    mainWindow?.webContents.print(
      {
        silent: false,
        printBackground: true,
        ...options,
      },
      (success, errorType) => {
        if (!success) console.error('Print failed:', errorType);
        resolve(success);
      }
    );
  });
});

app.whenReady().then(() => {
  createWindow();

  globalShortcut.register('F11', () => {
    if (mainWindow) {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });

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
