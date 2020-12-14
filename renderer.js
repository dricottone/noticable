// initialize monaco editor
require.config({ paths: { vs: 'node_modules/monaco-editor/min/vs' } });
require(['vs/editor/editor.main'], function () {
  window.editor = monaco.editor.create(document.getElementById('container-editor'), {
    language: 'markdown',
    minimap: {
      enabled: false
    },
    value: ''
  });
});

// messaging
function postMarkdown(markdown) {
  console.log("[renderer] sending 'post-markdown'...");
  window.postMessage({ type: "post-markdown", text: markdown }, "*");
}
function requestPostFile(filename) {
  console.log("[renderer] triggering 'request-post-file' on '" + filename + "'...");
  window.postMessage({ type: "request-post-file", text: filename }, "*");
}

// utilities
function buildFileName(filename) {
  var el = document.createElement("li");
  el.innerHTML = filename;
  el.addEventListener("click", () => { requestPostFile(filename); });
  return el
}
function sortFileNames(a, b) {
  return ($(b).text()) < ($(a).text());
}

// listen to preload
window.addEventListener("message", (event) => {
  if (event.source != window) return;
  if (event.data.type && (event.data.type == "request-post-markdown")) {
    console.log("[renderer] caught 'request-post-markdown'!");
    postMarkdown(window.editor.getValue());
  };
  if (event.data.type && (event.data.type == "request-insert-filename")) {
    console.log("[renderer] caught 'request-insert-filename'!");
    $("#list-filenames").append(buildFileName(event.data.text));
    $("#list-filenames li").sort(sortFileNames).appendTo("#list-filenames");
  };
  if (event.data.type && (event.data.type == "request-insert-html")) {
    console.log("[renderer] caught 'request-insert-html'!");
    $("#container-results").html(event.data.text);
    $(".container").toggleClass("focused");
  };
  if (event.data.type && (event.data.type == "request-toggle-editor")) {
    console.log("[renderer] caught 'request-toggle-editor'!");
    $(".container").toggleClass("focused");
  };
  if (event.data.type && (event.data.type == "post-file")) {
    console.log("[renderer] caught 'post-file'!");
    window.editor.setValue(event.data.text);
  };
}, false);

