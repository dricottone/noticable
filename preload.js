////////////////////////////
// Global state goes here //
////////////////////////////

const { ipcRenderer } = require("electron");
const fs = require("fs");
const os = require("os");
const path = require("path");
const md = require("markdown-it")({ html: true });
var currentFile = "";
var currentNote = "";
var currentNotes = [];
const newFileButton = "+ New Note";

const dirNotes = path.join(os.homedir(), "notes");


///////////////////////
// Functions go here //
///////////////////////

// Push filenames to be relative to the notes directory.
// NOTE: In this module, we need to concatenate the notes directory and the
//       relative path. Different modules have different needs.
function relativeNotePath(filename) {
  return path.join(dirNotes, filename);
};

// Cache the new file name and ask renderer to send editor content to be saved.
function saveFile(filename) {
  currentFile = filename;
  rendererSendContentForSave();
};

// If the file name is cached, ask renderer to send editor content to be saved.
// Otherwise ask main to prompt for a new file name and proceed through
// `saveFile` logic.
function trySaveFile() {
  if (currentFile == "") {
    mainPromptSave();
  } else {
    rendererSendContentForSave();
  }
};

// Cache the new file name and ask renderer to send editor content to be saved
// then reset the editor.
function saveFileThenNewFile(filename) {
  currentFile = filename;
  rendererSendContentForSaveThenNew();
};

// If the file name is cached, ask renderer to send editor content to be saved.
// Otherwise ask main to prompt for a new file name and proceed through
// `saveFileThenNewFile` logic.
function trySaveFileThenNewFile() {
  if (currentFile == "") {
    mainPromptSaveDiscardableThenNew();
  } else {
    rendererSendContentForSaveThenNew();
  }
};

// If the file name is cached, save the cached content to it. Otherwise ask
// main to prompt for a new file name and proceed through
// `saveFileThenReadFile` logic.
function trySaveFileThenReadFile(filename) {
  if (currentFile == "") {
    mainPromptSaveDiscardableThenRead(filename);
  } else {
    writeFileThenReadFile(currentFile, currentNote, filename);
  }
};

// Read a directory and return a sorted array of all file names.
function readNotesDirectory(directory) {
  let files = fs.readdirSync(directory);
  return files.sort((a,b) => a.localeCompare(b));
};

// Read a file and send the content and title to the renderer.
function readNoteFromFile(filename) {
  fs.readFile(relativeNotePath(filename), "utf8", (err, content) => {
    if (err) {
      announceFileUnreadable();
    } else {
      currentFile = filename;
      currentNote = content;
      rendererNewTitle(filename);
      rendererNewContent(content);
      rendererNewHTML(md.render(content));
    }
  });
};

// Reset local cache and update renderer's state.
// NOTE: This is a destructive operation. Changes should have been saved or
//       discarded with user permission *first*.
function newNote() {
  currentFile = "";
  currentNote = "";
  rendererNewTitle("");
  rendererNewContent("");
  rendererNewHTML("");
};

// Write a note to a file.
function writeFile(filename, content) {
  console.log("trying to save " + filename);
  fs.writeFile(relativeNotePath(filename), content, (err) => {
    if (err) {
      announceFileUnwritable();
      mainRePromptSave();
    } else {
      currentFile = filename;
      currentNote = content;
      rendererNewTitle(filename);
    }
  });
};

// Write a note to a file and then open a new file.
function writeFileThenNewFile(filename, content) {
  console.log("trying to save " + filename);
  fs.writeFile(relativeNotePath(filename), content, (err) => {
    if (err) {
      announceFileUnwritable();
      mainRePromptSaveThenNew();
    } else {
      rendererAddTitle(filename);
      newNote()
    }
  });
};

// Write a note to a file and then read another file.
function writeFileThenReadFile(toWriteFilename, content, toReadFilename) {
  console.log("trying to save " + toWriteFilename);
  fs.writeFile(relativeNotePath(toWriteFilename), content, (err) => {
    if (err) {
      announceFileUnwritable();
      mainRePromptSaveThenRead();
    } else {
      rendererAddTitle(toWriteFilename);
      readNoteFromFile(toReadFilename);
    }
  });
};

// Ask renderer to show the editor.
function rendererShowEditor() {
  window.postMessage({ type: "showEditor" }, "*")
};

// Ask renderer to show the viewer.
function rendererShowViewer() {
  window.postMessage({ type: "showViewer" }, "*")
};

// Ask renderer to send editor content so that it can be saved.
function rendererSendContentForSave() {
  window.postMessage({ type: "sendContentForSave" }, "*")
};

// Ask renderer to send editor content so that it can be saved and then
// reset.
function rendererSendContentForSaveThenNew() {
  window.postMessage({ type: "sendContentForSaveThenNew" }, "*")
};

// Ask renderer to send editor content so that it can be checked and then
// conditionally reset.
function rendererSendContentForCheckThenNew() {
  window.postMessage({ type: "sendContentForCheckThenNew" }, "*")
};

// Ask renderer to send editor content so that it can be rendered.
function rendererSendContentForRender() {
  window.postMessage({ type: "sendContentForRender" }, "*")
};

// Ask renderer to add a note title to the sidebar.
function rendererAddTitle(filename) {
    if (currentNotes.indexOf(filename)==-1) {
      currentNotes.push(filename);
      window.postMessage({ type: "addTitle", text: filename }, "*")
    }
};

// Ask renderer to add a note title to the sidebar. Does not need to trigger a
// re-sort. Should only be used on initialization.
function rendererAddTitleOrdered(filename) {
  window.postMessage({ type: "addTitleOrdered", text: filename }, "*")
};

// Ask renderer to highlight a new note title in the sidebar.
function rendererNewTitle(filename) {
  if (filename!="") {
    rendererAddTitle(filename);
    window.postMessage({ type: "newTitle", text: filename }, "*")
  }
};

// Ask renderer to show new content in the editor.
function rendererNewContent(content) {
  window.postMessage({ type: "newContent", text: content }, "*")
};

// Ask renderer to show new HTML in the viewer.
function rendererNewHTML(html) {
  window.postMessage({ type: "newHTML", text: html }, "*")
};

// Ask main to prompt for a new file name.
function mainPromptSave() {
  ipcRenderer.send("promptSave", "");
};

// Ask main to prompt for either permission to discard changes or a new file
// name then open a new file.
function mainPromptSaveDiscardableThenNew() {
  ipcRenderer.send("promptSaveDiscardableThenNew", "");
};

// Ask main to prompt for either permission to discard changes or a new file
// name then read a new file.
function mainPromptSaveDiscardableThenRead(filename) {
  ipcRenderer.send("promptSaveDiscardableThenRead", filename);
};

// Ask main to prompt for a new file after the previous file name failed to
// work.
function mainRePromptSave() {
  ipcRenderer.send("rePromptSave", "");
};

// Ask main to prompt for a new file after the previous file name failed to
// write then open a new file.
function mainRePromptSaveThenNew() {
  ipcRenderer.send("rePromptSaveThenNew", "");
}

// Ask main to prompt for a new file after the previous file name failed to
// write then read another file.
function mainRePromptSaveThenRead(filename) {
  ipcRenderer.send("rePromptSaveThenRead", filename);
}

// Announce that a file is unreadable.
function announceFileUnreadable() {
  ipcRenderer.send("fileUnreadable", "");
  window.postMessage({ type: "fileUnreadable" }, "*")
};

// Announce that a file is unwritable.
function announceFileUnwritable() {
  ipcRenderer.send("fileUnwritable", "");
  window.postMessage({ type: "fileUnwritable" }, "*")
};

// Main announced that a file was not saved. Broadcast this announcement.
function broadcastFileNotSaved() {
  window.postMessage({ type: "fileNotSaved" }, "*")
};

// Main announced that a file was discarded. Broadcast this announcement.
function broadcastFileDiscarded() {
  window.postMessage({ type: "fileDiscarded" }, "*")
};


////////////////////////////
// Listen for events here //
////////////////////////////
ipcRenderer.on("saveFile", (_, filename) => saveFile(filename));
ipcRenderer.on("saveFileThenNewFile", (_, filename) => saveFileThenNewFile(filename));
ipcRenderer.on("saveFileThenReadFile", (_, filenames) => writeFileThenReadFile(filenames.toSave, currentNote, filenames.toRead));
ipcRenderer.on("trySaveFile", () => trySaveFile());
ipcRenderer.on("trySaveFileThenNewFile", () => trySaveFileThenNewFile());
ipcRenderer.on("trySaveFileThenReadFile", (_, filename) => trySaveFileThenReadFile(filename));
ipcRenderer.on("reSaveFile", (_, filename) => writeFile(filename, currentNote));
ipcRenderer.on("reSaveFileThenNewFile", (_, filename) => writeFileThenNewFile(filename, currentNote));
ipcRenderer.on("reSaveFileThenReadFile", (_, filenames) => writeFileThenReadFile(filenames.toSave, currentNote, filenames.toRead));
ipcRenderer.on("fileNotSaved", () => broadcastFileNotSaved());
ipcRenderer.on("fileDiscardedForNewFile", () => {
  broadcastFileDiscarded();
  newNote();
});
ipcRenderer.on("fileDiscardedForReadFile", (_, filename) => {
  broadcastFileDiscarded();
  readNoteFromFile(filename);
});
ipcRenderer.on("rendererShowViewer", () => rendererShowViewer());
ipcRenderer.on("rendererShowEditor", () => rendererShowEditor());
ipcRenderer.on("rendererSendContentForCheckThenNew", () => rendererSendContentForCheckThenNew());
ipcRenderer.on("rendererSendContentForRender", () => rendererSendContentForRender());

window.addEventListener("message", (event) => {
  if (event.source != window) return;
  if (event.data.type) {
    let parameter = event.data.text;
    switch(event.data.type) {
      case "contentForSave":
        writeFile(currentFile, parameter);
        break;
      case "contentForSaveThenNew":
        writeFileThenNewFile(currentFile, parameter);
        break;
      case "contentForSaveThenRead":
        writeFileThenReadFile(currentFile, parameter.note, parameter.title);
        break;
      case "contentForCheckThenNew":
        if (currentNote!=parameter) {
          currentNote = parameter.note;
          mainPromptSaveDiscardableThenNew();
        } else {
          newNote();
        }
        break;
      case "contentForCheckThenRead":
        if (currentNote!=parameter.note) {
          currentNote = parameter.note;
          mainPromptSaveDiscardableThenRead(parameter.title);
        } else {
          readNoteFromFile(parameter.title)
        }
        break;
      case "contentForRender":
        rendererNewHTML(md.render(parameter));
        rendererShowViewer();
        break;
    }
  }
}, false);

window.addEventListener("load", () => {
  currentNotes = readNotesDirectory(dirNotes);
  currentNotes.forEach(filename => {
    rendererAddTitleOrdered(filename);
  });
});

