// constants
const { ipcRenderer } = require("electron");
const fs = require("fs")
const path = require("path");
const md = require("markdown-it")();
let currentFilename = "";
let currentFileContent = "";

// configuration
const newFileButton = "+ New Note";
const notesDir = "notes";

// messaging
function requestLocalFilename() {
  console.log("[preload -> main] requesting local filename...");
  ipcRenderer.send("request-local-filename", "");
}
function postFileText(text) {
  console.log("[preload -> renderer] posting file text...");
  window.postMessage({ type: "post-file-text", text: text }, "*");
}
function postDisplayFilename(filename) {
  console.log("[preload -> renderer] posting display file name...");
  window.postMessage({ type: "post-display-filename", text: filename }, "*");
}
function postHTML(html) {
  console.log("[preload -> renderer] posting HTML...");
  window.postMessage({ type: "post-html", text: html }, "*");
}
function requestEditorText() {
  console.log("[preload -> renderer] requesting editor text...");
  window.postMessage({ type: "request-editor-text" }, "*");
}
function requestFocusEditor() {
  console.log("[preload -> renderer] requesting focus editor...");
  window.postMessage({ type: "request-focus-editor" }, "*");
}
function requestUnfocusEditor() {
  console.log("[preload -> renderer] requesting unfocus editor...");
  window.postMessage({ type: "request-unfocus-editor" }, "*");
}
function requestToggleEditor() {
  console.log("[preload -> renderer] requesting toggle editor focus...");
  window.postMessage({ type: "request-toggle-editor" }, "*");
}
function requestAlertInvalidFilename() {
  console.log("[preload -> renderer] requesting alert about invalid filename...");
  window.postMessage({ type: "request-alert-invalid-filename" }, "*");
}

// utilities
function initNotesList() {
  // initialize the new file button
  postDisplayFilename(newFileButton);
  // initialize the notes files
  fs.readdir(notesDir, (err, files) => {
    if (err) throw err;
    files.forEach(file => {
      postDisplayFilename(getPrettyFilename(file));
    });
  });
}
function getActualFilename(filename) {
  unprettyFilename = path.basename(filename, ".md").split(" ").join("_") + ".md";
  return path.join(notesDir, unprettyFilename);
}
function getPrettyFilename(filename) {
  return path.basename(filename, ".md").split("_").join(" ");
}
function readFile(filename) {
  if (filename == newFileButton) {
    updateState("","");
    requestLocalFilename();
  } else {
    let actualFilename = getActualFilename(filename);
    fs.readFile(actualFilename, "utf8", (err, content) => {
      if (err) requestAlertInvalidFilename();
      updateState(actualFilename,content);
    });
  }
}
function renderMarkdown(content) {
  postHTML(md.render(content));
}
function updateState(filename, content) {
  currentFilename = filename;
  currentFileContent = content;
  postFileText(content);
}
function saveFile(content) {
  if (currentFilename != "") {
    currentFileContent = content;
    console.log("[preload] writing file '" + currentFilename + "'");
    fs.writeFile(currentFilename, currentFileContent, (err) => {
      if (err) throw err;
    });
  } else {
    console.log("[preload] no filename; cannot write file");
  }
}
function saveFileConditional(content) {
  if (currentFilename != "") {
    if (content != currentFileContent) {
      currentFileContent = content;
      console.log("[preload] writing updated file '" + currentFilename + "'");
      fs.writeFile(currentFilename, currentFileContent, (err) => {
        if (err) throw err;
      });
      return true;
    } else {
      console.log("[preload] no updates; not writing file");
      return false;
    }
  } else {
    console.log("[preload] no filename; cannot write file");
    return false;
  }
}

// listen to main process
ipcRenderer.on("post-new-filename", (event, filename) => {
  console.log("[preload] caught file name");
  currentFilename = getActualFilename(filename);
  postDisplayFilename(getPrettyFilename(filename));
});
ipcRenderer.on("key-save-text", () => {
  console.log("[preload] caught keybind for save text");
  requestEditorText();
});
ipcRenderer.on("key-render-markdown", () => {
  console.log("[preload] caught keybind for render markdown");
  requestEditorText();
  requestUnfocusEditor();
});
ipcRenderer.on("key-focus-editor", () => {
  console.log("[preload] caught keybind for focus editor");
  requestFocusEditor();
});
ipcRenderer.on("key-unfocus-editor", () => {
  console.log("[preload] caught keybind for unfocus editor");
  requestUnfocusEditor();
});

// listen to renderer
window.addEventListener("message", (event) => {
  if (event.source != window) return;
  if (event.data.type) {
    switch(event.data.type) {
      case "post-editor-text":
        console.log("[preload] caught editor text");
        saveFileConditional(event.data.text);
        renderMarkdown(event.data.text);
        break;
      case "request-file-text":
        console.log("[preload] caught request for file text");
        readFile(event.data.text);
        break;
    }
  }
}, false);

// initialize renderer
window.addEventListener("load", initNotesList);

