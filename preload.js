const { ipcRenderer } = require('electron');
const md = require('markdown-it')();

// listen to electron
ipcRenderer.on('request-render-markdown', () => {
  console.log("[preload] caught 'request-render-markdown'!");
  console.log("[preload] sending 'request-post-markdown'...");
  window.postMessage({ type: "request-post-markdown" }, "*");
});

// listen to renderer
window.addEventListener("message", (event) => {
  if (event.source != window) return;
  if (event.data.type && (event.data.type == "post-markdown")) {
    console.log("[preload] caught 'post-markdown'!");
    console.log("[preload] sending 'request-insert-html'...");
    window.postMessage({ type: "request-insert-html", text: md.render(event.data.text) }, "*");
  };
}, false);

