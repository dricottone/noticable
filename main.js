// to disable logging, comment out the console.log line
function debug(message) {
  //console.log("[main] " + message);
}

// constants
const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require("electron");
const os = require("os");
const path = require("path");
let win;

// configuration
const notesDir = path.join(os.homedir(), "notes");

// manu
const template = [
  {
    label: "File",
    submenu: [
      {
        label: "Save and Render",
        accelerator: "CmdOrCtrl+S",
        click: () => {
          win.webContents.send("key-render-markdown", "");
        }
      },
      {
        label: "Save",
        accelerator: "CmdOrCtrl+Shift+S",
        click: () => {
          win.webContents.send("key-save-text", "");
        }
      },
      { type: "separator" },
      {
        label: "Show Notes Directory",
        click: async () => {
          await shell.openPath(notesDir);
        }
      },
      { type: "separator" },
      { role: "quit" }
    ]
  },
  {
    label: "Edit",
    submenu: [
      { role: "undo" },
      { role: "redo" },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      { role: "delete" },
      { type: "separator" },
      { role: "selectAll" }
    ]
  },
  {
    label: "View",
    submenu: [
      {
        label: "Focus Editor Mode",
        accelerator: "CmdOrCtrl+E",
        click: () => {
          win.webContents.send("key-focus-editor", "");
        }
      },
      { type: "separator" },
      { role: "reload" },
      { role: "forceReload" },
      { role: "toggleDevTools" },
      { type: "separator" },
      { role: "resetZoom" },
      { role: "zoomIn" },
      { role: "zoomOut" },
      { type: "separator" },
      { role: "togglefullscreen" },
    ]
  },
  {
    label: "Window",
    submenu: [
      { role: "minimize" }
    ]
  },
  {
    label: "Help",
    submenu: [
      {
        label: "About",
        click: async () => {
          await shell.openExternal("https://github.com/dricottone/noticable");
        }
      },
      {
        label: "Report Bugs",
        click: async () => {
          await shell.openExternal("https://github.com/dricottone/noticable/issues");
        }
      }
    ]
  }
];
Menu.setApplicationMenu(Menu.buildFromTemplate(template));

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
function initializeWindow() {
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

  ipcMain.on("request-local-filename", (event) => {
    debug("caught request for local filename");
    postFileName(win, event);
  });

  win.on("closed", () => {
    win = null;
  });
};

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

