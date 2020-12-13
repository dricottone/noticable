const { app, BrowserWindow } = require('electron');
const shortcut = require('electron-localshortcut');
const path = require('path');

app.on('ready', () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));

  shortcut.register(win, 'CmdOrCtrl+S', () => {
    console.log("[main] triggering 'request-render-markdown'...")
    win.webContents.send('request-render-markdown', '');
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

