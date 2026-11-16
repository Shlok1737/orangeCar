const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('catAPI', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (cfg) => ipcRenderer.invoke('save-config', cfg),
  onConfigChanged: (callback) => {
    const handler = (_event, config) => callback(config);
    ipcRenderer.on('config-changed', handler);
    return () => ipcRenderer.removeListener('config-changed', handler);
  },
  
  setIgnoreMouseEvents: (ignore, options) => {
    ipcRenderer.send('set-ignore-mouse-events', ignore, options);
  },

  getScreenInfo: () => ipcRenderer.invoke('get-screen-info'),
  getCursorPos: () => ipcRenderer.invoke('get-cursor-pos'),

  getState: () => ipcRenderer.invoke('get-state'),
  saveState: (state) => ipcRenderer.invoke('save-state', state),

  openConfig: () => ipcRenderer.send('open-config'),
  quitApp: () => ipcRenderer.send('quit-app'),
  
  onPauseToggled: (callback) => {
    const handler = (_event, isPaused) => callback(isPaused);
    ipcRenderer.on('pause-toggled', handler);
    return () => ipcRenderer.removeListener('pause-toggled', handler);
  },

  onOiiaToggled: (callback) => {
    const handler = (_event, isEnabled) => callback(isEnabled);
    ipcRenderer.on('oiia-toggled', handler);
    return () => ipcRenderer.removeListener('oiia-toggled', handler);
  },

  onTestOiia: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('test-oiia', handler);
    return () => ipcRenderer.removeListener('test-oiia', handler);
  }
});
