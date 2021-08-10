// to disable logging, comment out the console.log line
function debug(message) {
  //console.log("[renderer] " + message);
}

// initialize monaco editor
require.config({ paths: { vs: 'node_modules/monaco-editor/min/vs' } });
require(['vs/editor/editor.main'], function () {
  window.editor = monaco.editor.create(document.getElementById('container-editor'), {
    language: 'markdown',
    minimap: {
      enabled: false
    },
    value: '',
    wordWrap: 'on',
  });
});

// messaging
function postEditorText() {
  debug("posting editor text...");
  window.postMessage({ type: "post-editor-text", text: window.editor.getValue() }, "*");
}
function requestFileText(filename) {
  debug("posting editor text and requesting text of file '" + filename + "'...");
  window.postMessage({ type: "post-editor-text", text: window.editor.getValue() }, "*");
  window.postMessage({ type: "request-file-text", text: filename }, "*");
}

// utilities
function buildFilename(filename) {
  var el = document.createElement("li");
  el.innerHTML = filename;
  el.addEventListener("click", () => { requestFileText(filename); });
  return el
}
function sortFilenames(a, b) {
  return ($(b).text()) < ($(a).text());
}
function focusEditor() {
  $("#container-editor").addClass("focused");
  $("#container-rendered").removeClass("focused");
  $("#ui-focus-editor").prop("checked", true);
}
function unfocusEditor() {
  if ($("#ui-enable-render").prop("checked")) {
    $("#container-editor").removeClass("focused");
    $("#container-rendered").addClass("focused");
    $("#ui-focus-editor").prop("checked", false);
  } else {
    debug("rendering disabled; halting unfocus editor");
    focusEditor();
  }
}
function toggleEditor() {
  if ($("#ui-focus-editor").prop("checked")) {
    unfocusEditor();
    postEditorText();
  } else {
    focusEditor();
  }
}
function uiToggleEditor() {
  //NOTE: Remember that the status accessed here is the 'new' status, i.e. after it had been toggled
  if ($("#ui-focus-editor").prop("checked")) {
    debug("UI focus editor");
    focusEditor();
  } else {
    debug("UI unfocus editor");
    unfocusEditor();
    postEditorText();
  }
}

// listen to preload
window.addEventListener("message", (event) => {
  if (event.source != window) return;
  if (event.data.type) {
    switch(event.data.type) {
      case "post-file-text":
        debug("caught file text");
        window.editor.setValue(event.data.text);
        focusEditor();
        break;
      case "post-display-filename":
        filename = event.data.text
        debug("caught display filename '" + filename + "'");
        $("#list-filenames").append(buildFilename(filename));
        $("#list-filenames li").sort(sortFilenames).appendTo("#list-filenames");
        break;
      case "post-html":
        debug("caught HTML");
        $("#container-rendered").html(event.data.text);
        break;
      case "request-editor-text":
        debug("caught request for editor text");
        postEditorText();
        break;
      case "request-focus-editor":
        debug("caught request to focus editor");
        focusEditor();
        break;
      case "request-unfocus-editor":
        debug("caught request to unfocus editor");
        unfocusEditor();
        break;
      case "request-toggle-editor":
        debug("caught request to toggle editor");
        toggleEditor();
        break;
      case "request-highlight-filename":
        filename = event.data.text;
        debug("caught request to highlight filename '" + filename + "'");
        $("#list-filenames li").removeClass("highlight");
        $("#list-filenames li").each( function(i, li) {
          if ( $(li).text()==filename) $(li).addClass("highlight");
        });
        break;
      case "request-alert-invalid-filename":
        debug("caught request to alert about invalid filename");
        alert("Error: File could not be read");
        break;
    }
  }
}, false);

