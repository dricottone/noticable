////////////////////////////
// Global state goes here //
////////////////////////////

const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require("electron");
const path = require("path");
const os = require("os");
var win;

const dirNotes = path.join(os.homedir(), "notes");

const filePreload = path.join(__dirname, "preload.js");
const fileIndex = path.join(__dirname, "index.html");

const urlProject = "https://github.com/dricottone/noticable";
const urlBugTracker = "https://github.com/dricottone/noticable/issues";

// Options for prompt to discard or save changes.
const optionsDiscard = {
  message: "You have made changes in the editor. Do you want to discard those changes, or save to a file?",
  buttons: ["&Discard", "&Save", "Save &As..."],
  type: "question",
  normalizeAccessKeys: true,
};

// Options for error message that saving failed.
const optionsReSaveAs = {
  message: "File could not be saved.",
  buttons: ["&Cancel", "&Try Again"],
  type: "error",
  normalizeAccessKeys: true,
};

// Options for prompt to save a file.
const optionsSaveAs = {
  title: "Create new note",
  defaultPath: dirNotes,
  properties: ["showOverwriteConfirmation"],
  filters: [
    { name: "Markdown", extensions: ["md"] },
    { name: "Plain Text", extensions: ["txt"] },
  ],
};


///////////////////////
// Functions go here //
///////////////////////

// Push filenames to be relative to the notes directory.
function relativeNotePath(filename) {
  return path.relative(dirNotes, filename);
}

// Prompt to save a file.
function promptSave() {
  dialog.showSaveDialog(win, optionsSaveAs)
  .then(r => {
    if (r.canceled) {
      announceFileNotSaved();
    } else {
      preloadSaveFile(relativeNotePath(r.filePath));
    }
  });
};

// Prompt to save a file after already attempting to do so.
function rePromptSave() {
  dialog.showMessageBox(win, optionsSaveError)
  .then(r => {
    if (r.response==0) {
      announceFileNotSaved();
    } else {
      dialog.showSaveDialog(win, optionsSaveAs)
      .then(r => {
        if (r.canceled) {
          announceFileNotSaved();
        } else {
          preloadReSaveFile(relativeNotePath(r.filePath));
        }
      });
    }
  });
};

// Prompt to save a file then open a new file. Discard the file if the prompt
// is cancelled.
function promptSaveDiscardableThenNew() {
  dialog.showMessageBox(win, optionsDiscard)
  .then(r => {
    if (r.response==0) {
      announceFileDiscardedForNewFile();
    } else if (r.response==1) {
      preloadTrySaveFileThenNewFile();
    } else {
      dialog.showSaveDialog(win, optionsSaveAs)
      .then(r => {
        if (r.canceled) {
          announceFileDiscardedForNewFile();
        } else {
          preloadSaveFileThenNewFile(relativeNotePath(r.filePath));
        }
      });
    }
  });
};

// Prompt to save a file then read a file. Discard the file if the prompt is
// cancelled.
function promptSaveDiscardableThenRead(filename) {
  dialog.showMessageBox(win, optionsDiscard)
  .then(r => {
    if (r.response==0) {
      announceFileDiscardedForReadFile(filename);
    } else if (r.response==1) {
      preloadTrySaveFileThenReadFile(filename);
    } else {
      dialog.showSaveDialog(win, optionsSaveAs)
      .then(r => {
        if (r.canceled) {
          announceFileDiscardedForReadFile(filename);
        } else {
          preloadSaveFileThenReadFile(relativeNotePath(r.filePath), filename);
        }
      });
    }
  });
};

// Prompt to save a file after already attempting to do so. Discard the file if
// the prompt is cancelled.
function rePromptSaveDiscardableThenNew() {
  dialog.showMessageBox(win, optionsSaveError)
  .then(r => {
    if (r.response==0) {
      announceFileDiscardedForNewFile();
    } else {
      dialog.showSaveDialog(win, optionsSaveAs)
      .then(r => {
        if (r.canceled) {
          announceFileDiscardedForNewFile();
        } else {
          preloadReSaveFileThenNewFile(relativeNotePath(r.filePath));
        }
      });
    }
  });
};

// Ask preload to save a file.
function preloadSaveFile(filename) {
  win.webContents.send("saveFile", filename);
};

// Ask preload to *try* to save a file.
// NOTE: We don't know if preload has a cached file name. There is no real
//       advantage to querying this first. Same number of IPC calls in worst
//       case (i.e. no known file name) and excessive calls in best case.
function preloadTrySaveFile() {
  win.webContents.send("trySaveFile", "");
};

// Ask preload to save a file.
// NOTE: Triggers different logic. Preload skips querying the renderer for the
//       note (because this is a *re*-save).
function preloadReSaveFile(filename) {
  win.webContents.send("reSaveFile", filename);
};

// Ask preload to save a file then show a new file.
function preloadSaveFileThenNewFile(filename) {
  win.webContents.send("saveFileThenNewFile", filename);
};

// Ask preload to *try* to save a file then show a new file.
// NOTE: We don't know if preload has a cached file name. There is no real
//       advantage to querying this first. Same number of IPC calls in worst
//       case (i.e. no known file name) and excessive calls in best case.
function preloadTrySaveFileThenNewFile() {
  win.webContents.send("trySaveFileThenNewFile", "");
};

// Ask preload to save a file then show a new file.
// NOTE: Triggers different logic. Preload skips querying the renderer for the
//       note (because this is a *re*-save).
function preloadReSaveFileThenNewFile(toSaveFilename, toReadFilename) {
  win.webContents.send("reSaveFileThenNewFile", { toSave: toSaveFilename, toRead: toReadFilename });
};

// Ask preload to save a file then read another file.
function preloadSaveFileThenReadFile(toSaveFilename, toReadFilename) {
  win.webContents.send("saveFileThenReadFile", { toSave: toSaveFilename, toRead: toReadFilename });
};

// Ask preload to *try* to save a file then read another file.
// NOTE: We don't know if preload has a cached file name. There is no real
//       advantage to querying this first. Same number of IPC calls in worst
//       case (i.e. no known file name) and excessive calls in best case.
function preloadTrySaveFileThenReadFile(filename) {
  win.webContents.send("trySaveFileThenReadFile", filename);
};

// Announce that a file was not saved.
function announceFileNotSaved() {
  win.webContents.send("fileNotSaved", "");
};

// Announce that a file was not saved and changes should be discarded for a new
// file.
function announceFileDiscardedForNewFile() {
  win.webContents.send("fileDiscardedForNewFile", "");
};

// Announce that a file was not saved and changes should be discarded for
// another file to be read.
function announceFileDiscardedForReadFile(filename) {
  win.webContents.send("fileDiscardedForReadFile", filename);
};

// Ask renderer to sent editor content to be checked against the cached content
// then reset the editor.
function preloadRendererSendContentForCheckThenNew() {
  win.webContents.send("rendererSendContentForCheckThenNew", "");
};

// Ask renderer to send content for rendering.
function preloadRendererSendContentForRender() {
  win.webContents.send("rendererSendContentForRender", "");
};

// Ask renderer to show the editor.
function preloadRendererShowEditor() {
  win.webContents.send("rendererShowEditor", "");
};

// Ask renderer to send content for rendering and show the viewer.
function preloadRendererShowViewer() {
  preloadRendererSendContentForRender();
  win.webContents.send("rendererShowViewer", "");
};


//////////////////////////////
// Electron magic goes here //
//////////////////////////////

const template = [
  {
    label: "File",
    submenu: [
      {
        label: "Save",
        accelerator: "CmdOrCtrl+S",
        click: preloadTrySaveFile,
      },
      {
        label: "Save As...",
        accelerator: "CmdOrCtrl+Shift+S",
        click: () => {
          promptSave(win);
        }
      },
      {
        label: "Render Note",
        accelerator: "CmdOrCtrl+R",
        click: preloadRendererSendContentForRender,
      },
      {
        label: "New",
        accelerator: "CmdOrCtrl+N",
        click: preloadRendererSendContentForCheckThenNew,
      },
      { type: "separator" },
      {
        label: "Show Notes Directory",
        click: async () => {
          await shell.openPath(dirNotes);
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
        label: "Show Editor",
        accelerator: "CmdOrCtrl+E",
        click: preloadRendererShowEditor,
      },
      {
        label: "Show Viewer",
        accelerator: "CmdOrCtrl+Shift+E",
        click: preloadRendererShowViewer,
      },
      { type: "separator" },
      // NOTE: I believe these should not be enabled in a production build
      // { role: "reload" },
      // { role: "forceReload" },
      // { role: "toggleDevTools" },
      // { type: "separator" },
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
          await shell.openExternal(urlProject);
        }
      },
      {
        label: "Report Bugs",
        click: async () => {
          await shell.openExternal(urlBugTracker);
        }
      }
    ]
  }
];
Menu.setApplicationMenu(Menu.buildFromTemplate(template));

function initializeWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: filePreload,
    }
  });
  win.loadFile(fileIndex);

  ////////////////////////////
  // Listen for events here //
  ////////////////////////////
  ipcMain.on("promptSave", promptSave);
  ipcMain.on("promptSaveDiscardableThenNew", promptSaveDiscardableThenNew);
  ipcMain.on("promptSaveDiscardableThenRead", (_, filename) => promptSaveDiscardableThenRead(filename));
  ipcMain.on("rePromptSave", rePromptSave);
  //ipcMain.on("fileUnreadable", () => {});
  //ipcMain.on("fileUnunwritable", () => {});

  win.on("closed", () => {
    win = null;
  });
};

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

