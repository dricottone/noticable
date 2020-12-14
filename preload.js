const { ipcRenderer } = require("electron");
const fs = require("fs")
const path = require("path");
const md = require("markdown-it")();

// messaging
function postFile(text) {
  console.log("[preload] sending 'post-file'...");
  window.postMessage({ type: "post-file", text: text }, "*");
}
function requestInsertFilename(filename) {
  console.log("[preload] sending 'request-insert-filename'...");
  window.postMessage({ type: "request-insert-filename", text: filename }, "*");
}
function requestInsertHTML(html) {
  console.log("[preload] sending 'request-insert-html'...");
  window.postMessage({ type: "request-insert-html", text: html }, "*");
}
function requestPostMarkdown() {
  console.log("[preload] sending 'request-post-markdown'...");
  window.postMessage({ type: "request-post-markdown" }, "*");
}
function requestToggleEditor() {
  console.log("[preload] sending 'request-toggle-editor'...");
  window.postMessage({ type: "request-toggle-editor" }, "*");
}

// utilities
const newFileButton = "+ New Note";
const notesDir = "notes"
function readFile(filename) {
  if (filename == newFileButton) {
    postFile("");
  } else {
    fs.readFile(path.join(notesDir, filename + ".md"), "utf8", (err, data) => {
      if (err) throw err;
      postFile(data);
    });
  };
}
function renderMarkdown(markdown) {
  requestInsertHTML(md.render(markdown));
}
function initNotesList() {
  requestInsertFilename(newFileButton);

  fs.readdir(notesDir, (err, files) => {
    if (err) throw err;
    files.forEach(file => {
      requestInsertFilename(file.slice(0,-3))
    });
  });
}

// listen to main process
ipcRenderer.on("request-render-markdown", () => {
  console.log("[preload] caught 'request-render-markdown'!");
  requestPostMarkdown();
});
ipcRenderer.on("request-focus-editor", () => {
  console.log("[preload] caught 'request-focus-editor'!");
  requestToggleEditor();
});

// listen to renderer
window.addEventListener("message", (event) => {
  if (event.source != window) return;
  if (event.data.type && (event.data.type == "post-markdown")) {
    console.log("[preload] caught 'post-markdown'!");
    renderMarkdown(event.data.text);
  };
  if (event.data.type && (event.data.type == "request-post-file")) {
    console.log("[preload] caught 'request-post-file'!");
    readFile(event.data.text);
  };
}, false);

// initialize renderer
window.addEventListener("load", initNotesList);

