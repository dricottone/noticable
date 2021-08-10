// to disable logging, comment out the console.log line
function debug(message) {
  //console.log("[preload] " + message);
}

// constants
const { ipcRenderer } = require("electron");
const fs = require("fs");
const os = require("os");
const path = require("path");
const md = require("markdown-it")({ html: true });
let currentFilename = "";
let currentFileContent = "";

// configuration
const newFileButton = "+ New Note";
const notesDir = path.join(os.homedir(), "notes");

// messaging
function requestLocalFilename() {
  debug("requesting local filename...");
  ipcRenderer.send("request-local-filename", "");
}
function postFileText(text) {
  debug("posting file text...");
  window.postMessage({ type: "post-file-text", text: text }, "*");
}
function postDisplayFilename(filename) {
  debug("posting display file name '" + filename + "'...");
  window.postMessage({ type: "post-display-filename", text: filename }, "*");
}
function postHTML(html) {
  debug("posting HTML...");
  window.postMessage({ type: "post-html", text: html }, "*");
}
function requestEditorText() {
  debug("requesting editor text...");
  window.postMessage({ type: "request-editor-text" }, "*");
}
function requestFocusEditor() {
  debug("requesting focus editor...");
  window.postMessage({ type: "request-focus-editor" }, "*");
}
function requestUnfocusEditor() {
  debug("requesting unfocus editor...");
  window.postMessage({ type: "request-unfocus-editor" }, "*");
}
function requestToggleEditor() {
  debug("requesting toggle editor focus...");
  window.postMessage({ type: "request-toggle-editor" }, "*");
}
function requestHighlightFilename(filename) {
  debug("requesting highlight filename...");
  window.postMessage({ type: "request-highlight-filename", text: filename }, "*");
}
function requestAlertInvalidFilename() {
  debug("requesting alert about invalid filename...");
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
      requestHighlightFilename(filename);
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
    debug("writing file '" + currentFilename + "'");
    fs.writeFile(currentFilename, currentFileContent, (err) => {
      if (err) throw err;
    });
  } else {
    debug("no filename; halting write file");
  }
}
function saveFileConditional(content) {
  if (currentFilename != "") {
    if (content != currentFileContent || currentFileContent == "") {
      currentFileContent = content;
      debug("writing updated file '" + currentFilename + "'");
      fs.writeFile(currentFilename, currentFileContent, (err) => {
        if (err) throw err;
      });
      return true;
    } else {
      debug("no updates to file; halting write file");
      return false;
    }
  } else {
    debug("no filename; halting write file");
    return false;
  }
}

// listen to main process
ipcRenderer.on("post-new-filename", (event, filename) => {
  debug("caught file name '" + filename + "'");
  currentFilename = getActualFilename(filename);
  prettyFilename = getPrettyFilename(filename);
  postDisplayFilename(prettyFilename);
  requestHighlightFilename(prettyFilename);
});
ipcRenderer.on("menu-save-text", () => {
  debug("caught menu button for save text");
  requestEditorText();
});
ipcRenderer.on("menu-render-markdown", () => {
  debug("caught menu button for render markdown");
  requestEditorText();
  requestUnfocusEditor();
});
ipcRenderer.on("menu-focus-editor", () => {
  debug("caught menu button for focus editor");
  requestFocusEditor();
});
ipcRenderer.on("menu-unfocus-editor", () => {
  debug("caught menu button for unfocus editor");
  requestUnfocusEditor();
});

// listen to renderer
window.addEventListener("message", (event) => {
  if (event.source != window) return;
  if (event.data.type) {
    switch(event.data.type) {
      case "post-editor-text":
        debug("caught editor text");
        saveFileConditional(event.data.text);
        renderMarkdown(event.data.text);
        break;
      case "request-file-text":
        filename = event.data.text
        debug("caught request for text of file '" + filename + "'");
        readFile(filename);
        break;
    }
  }
}, false);

// initialize renderer
window.addEventListener("load", initNotesList);

