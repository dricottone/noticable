// to disable logging, comment out the console.log line
function debug(message) {
  //console.log("[main] " + message);
}

// constants
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const shortcut = require("electron-localshortcut");
const os = require("os");
const path = require("path");

// configuration
const notesDir = path.join(os.homedir(), "notes");

// messaging
function postFileName(window, event) {
  dialog.showSaveDialog(window, {
    title: "Create new note",
    defaultPath: notesDir,
    properties: ["showOverwriteConfirmation"],
    filters: [
      { name: "Markdown", extensions: ["md"] },
      { name: "Plain Text", extensions: ["txt"] },
    ]
  })
  .then(r => {
    if (!r.canceled) {
      filename = r.filePath
      debug("posting new filename '" + filename + "'...");
      event.sender.send("post-new-filename", filename);
    }
  });
}

// utilities
let win;
function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js")
    }
  });

  win.loadFile(path.join(__dirname, "index.html"));
}
function initializeWindow() {
  createWindow();
  registerShortCuts(win);

  ipcMain.on("request-local-filename", (event) => {
    debug("caught request for local filename");
    postFileName(win, event);
  });

  win.on("closed", () => {
    win = null;
  });
};
function registerShortCuts(window) {
  shortcut.register(window, "CmdOrCtrl+E", () => {
    debug("keypress focus editor");
    window.webContents.send("key-focus-editor", "");
  });
  shortcut.register(window, "CmdOrCtrl+S", () => {
    debug("keypress save text and render markdown");
    window.webContents.send("key-render-markdown", "");
  });
  shortcut.register(window, "CmdOrCtrl+Shift+S", () => {
    debug("keypress save text");
    window.webContents.send("key-save-text", "");
  });
}

// app event loop
app.on("ready", initializeWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (win === null) {
    initializeWindow();
  }
});

