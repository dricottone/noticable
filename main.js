// constants
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const shortcut = require("electron-localshortcut");
const path = require("path");

// configuration
const notesDir = "notes";

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
      console.log("[main] posting new filename...");
      event.sender.send("post-new-filename", r.filePath);
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
    console.log("[main] caught request for local filename");
    console.log("[main] sending 'request-focus-editor'...");
    postFileName(win, event);
  });

  win.on("closed", () => {
    win = null;
  });
};
function registerShortCuts(window) {
  shortcut.register(window, "CmdOrCtrl+E", () => {
    console.log("[main] focus editor");
    window.webContents.send("key-focus-editor", "");
  });
  shortcut.register(window, "CmdOrCtrl+S", () => {
    console.log("[main] save text and render markdown");
    window.webContents.send("key-render-markdown", "");
  });
  shortcut.register(window, "CmdOrCtrl+Shift+S", () => {
    console.log("[main] save text");
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

