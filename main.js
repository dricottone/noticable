const { app, BrowserWindow } = require('electron');
const shortcut = require('electron-localshortcut');
const path = require('path');

let win;
const createWindow = () => {
  win = new BrowserWindow({
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

  win.on('closed', () => {
    win = null;
  });
};

// initialize
app.on('ready', createWindow);

// macOS convention is to keep process alive (accessible via the dock) until
// explicitly quit; must handle re-initialization
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});

