const fs = require('fs');
const path = require('path');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(path.join(__dirname, 'cat-debug.log'), line);
  console.log(msg);
}

log('Starting main.js...');

process.on('uncaughtException', (err) => {
  log(`UNCAUGHT EXCEPTION: ${err.stack || err}`);
});

process.on('unhandledRejection', (reason) => {
  log(`UNHANDLED REJECTION: ${reason}`);
});

const { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage, shell, globalShortcut, desktopCapturer } = require('electron');

let mainWindow = null;
let tray = null;
let configWatcher = null;
let currentConfig = null;
let appState = {
  lastInteractionTime: Date.now(),
  oiiaEnabled: true,
  isPaused: false
};

const CONFIG_PATH = path.join(__dirname, 'config.json');

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
      currentConfig = JSON.parse(data);
      return currentConfig;
    }
  } catch (err) {
    log(`Failed to load config.json: ${err.message}`);
  }
  return {};
}

function getStateFilePath() {
  return path.join(app.getPath('userData'), 'desktop-cat-state.json');
}

function loadState() {
  try {
    const p = getStateFilePath();
    if (fs.existsSync(p)) {
      const data = fs.readFileSync(p, 'utf-8');
      appState = { ...appState, ...JSON.parse(data) };
    }
  } catch (err) {
    log(`Could not read state file: ${err.message}`);
  }
}

function saveStateToDisk() {
  try {
    const p = getStateFilePath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(appState, null, 2), 'utf-8');
  } catch (err) {
    log(`Failed to save state to disk: ${err.message}`);
  }
}

function setupConfigWatcher() {
  if (configWatcher) configWatcher.close();
  let debounceTimeout = null;
  try {
    configWatcher = fs.watch(CONFIG_PATH, (eventType) => {
      if (debounceTimeout) clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        log(`Config file changed (${eventType}), reloading...`);
        const newConfig = loadConfig();
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('config-changed', newConfig);
        }
        updateHotkey();
      }, 200);
    });
  } catch (err) {
    log(`Failed to watch config.json: ${err.message}`);
  }
}

function getTrayIcon() {
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
  if (fs.existsSync(iconPath)) {
    const img = nativeImage.createFromPath(iconPath);
    if (!img.isEmpty()) return img;
  }
  return nativeImage.createEmpty();
}

function updateTrayMenu() {
  if (!tray) return;

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Desktop Cat', enabled: false },
    { type: 'separator' },
    {
      label: 'OIIA Dance Reaction',
      type: 'checkbox',
      checked: appState.oiiaEnabled,
      click: () => toggleOiia()
    },
    {
      label: 'Test OIIA Spin (5 sec)',
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('test-oiia');
        }
      }
    },
    {
      label: appState.isPaused ? 'Resume Cat' : 'Pause Cat',
      click: () => togglePause()
    },
    {
      label: 'Open Config (config.json)',
      click: () => shell.openPath(CONFIG_PATH)
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        log('User clicked Quit in tray');
        app.quit();
      }
    }
  ]);

  try {
    tray.setContextMenu(contextMenu);
    tray.setToolTip(`Desktop Cat (${appState.isPaused ? 'Paused' : 'Active'})`);
  } catch (e) {
    log(`Tray setContextMenu error: ${e.message}`);
  }
}

function setupTray() {
  try {
    const icon = getTrayIcon();
    tray = new Tray(icon);
    tray.on('click', () => {
      log('Tray icon clicked');
    });
    updateTrayMenu();
    log('Tray setup completed successfully');
  } catch (err) {
    log(`Tray setup failed: ${err.message}`);
  }
}

function toggleOiia(forceState) {
  if (typeof forceState === 'boolean') {
    appState.oiiaEnabled = forceState;
  } else {
    appState.oiiaEnabled = !appState.oiiaEnabled;
  }
  saveStateToDisk();
  updateTrayMenu();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('oiia-toggled', appState.oiiaEnabled);
  }
  log(`OIIA Dance toggled: ${appState.oiiaEnabled}`);
}

function togglePause(forceState) {
  if (typeof forceState === 'boolean') {
    appState.isPaused = forceState;
  } else {
    appState.isPaused = !appState.isPaused;
  }
  saveStateToDisk();
  updateTrayMenu();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('pause-toggled', appState.isPaused);
  }
  log(`Pause toggled: ${appState.isPaused}`);
}

let registeredHotkey = null;
function updateHotkey() {
  if (registeredHotkey) {
    try {
      globalShortcut.unregister(registeredHotkey);
    } catch (e) {}
    registeredHotkey = null;
  }

  const hotkey = currentConfig?.behaviors?.music?.hotkey || 'CommandOrControl+Alt+O';
  try {
    const success = globalShortcut.register(hotkey, () => {
      log(`Hotkey ${hotkey} pressed! Toggling OIIA...`);
      toggleOiia();
    });
    if (success) {
      registeredHotkey = hotkey;
      log(`Registered global hotkey: ${hotkey}`);
    } else {
      log(`Failed to register global hotkey: ${hotkey}`);
    }
  } catch (err) {
    log(`Error registering global hotkey: ${err.message}`);
  }
}

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.bounds;
  log(`Primary display bounds: ${width}x${height}`);

  mainWindow = new BrowserWindow({
    x: 0,
    y: 0,
    width: width,
    height: height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  try {
    mainWindow.setVisibleOnAllWorkspaces?.(true, { visibleOnFullScreen: true });
  } catch (e) {}

  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  // Enable loopback system audio capture for music reaction
  try {
    mainWindow.webContents.session.setDisplayMediaRequestHandler((request, callback) => {
      desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
        if (sources && sources.length > 0) {
          callback({ video: sources[0], audio: 'loopback' });
        } else {
          callback({});
        }
      }).catch(err => {
        log(`setDisplayMediaRequestHandler error: ${err.message}`);
        callback({});
      });
    });
  } catch (e) {
    log(`Could not setup setDisplayMediaRequestHandler: ${e.message}`);
  }

  mainWindow.webContents.on('console-message', (e, level, msg, line, src) => {
    log(`[Renderer] ${msg} (${src}:${line})`);
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    log(`Render process gone: ${JSON.stringify(details)}`);
  });

  mainWindow.on('close', (e) => {
    log('mainWindow received close event');
  });

  mainWindow.on('closed', () => {
    log('mainWindow closed');
    mainWindow = null;
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  log('loadFile called for index.html');
}

// IPC Handlers
ipcMain.handle('get-config', () => {
  return currentConfig || loadConfig();
});

ipcMain.handle('save-config', (_event, newConfig) => {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2), 'utf-8');
    currentConfig = newConfig;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-screen-info', () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  return {
    bounds: primaryDisplay.bounds,
    workArea: primaryDisplay.workArea,
    scaleFactor: primaryDisplay.scaleFactor || 1
  };
});

ipcMain.handle('get-cursor-pos', () => {
  return screen.getCursorScreenPoint();
});

ipcMain.handle('get-state', () => {
  return appState;
});

ipcMain.handle('save-state', (_event, newState) => {
  appState = { ...appState, ...newState };
  saveStateToDisk();
  updateTrayMenu();
  return { success: true };
});

ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed()) {
    win.setIgnoreMouseEvents(ignore, options || { forward: true });
  }
});

ipcMain.on('open-config', () => {
  shell.openPath(CONFIG_PATH);
});

ipcMain.on('quit-app', () => {
  log('IPC quit-app received');
  app.quit();
});

// App Lifecycle
app.whenReady().then(() => {
  log('app.whenReady resolved');
  loadConfig();
  loadState();
  createWindow();
  setupTray();
  setupConfigWatcher();
  updateHotkey();

  screen.on('display-metrics-changed', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const primaryDisplay = screen.getPrimaryDisplay();
      mainWindow.setBounds(primaryDisplay.bounds);
      mainWindow.webContents.send('display-changed', {
        bounds: primaryDisplay.bounds,
        workArea: primaryDisplay.workArea
      });
    }
  });
});

app.on('will-quit', () => {
  log('app will-quit');
  globalShortcut.unregisterAll();
  if (configWatcher) configWatcher.close();
  saveStateToDisk();
});

app.on('window-all-closed', () => {
  log('app window-all-closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
