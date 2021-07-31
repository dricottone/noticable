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
function postEditorText() {
  console.log("[renderer -> preload] posting editor text...");
  window.postMessage({ type: "post-editor-text", text: window.editor.getValue() }, "*");
}
function requestFileText(filename) {
  console.log("[renderer -> preload] requesting file text...");
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
    console.log("[renderer] rendering disabled");
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
    console.log("[renderer] UI focus editor");
    focusEditor();
  } else {
    console.log("[renderer] UI unfocus editor");
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
        console.log("[renderer] caught file text");
        window.editor.setValue(event.data.text);
        focusEditor();
        break;
      case "post-display-filename":
        console.log("[renderer] caught display filename");
        $("#list-filenames").append(buildFilename(event.data.text));
        $("#list-filenames li").sort(sortFilenames).appendTo("#list-filenames");
        break;
      case "post-html":
        console.log("[renderer] caught HTML");
        $("#container-rendered").html(event.data.text);
        break;
      case "request-editor-text":
        console.log("[renderer] caught request for editor text");
        postEditorText();
        break;
      case "request-focus-editor":
        console.log("[renderer] caught request to focus editor");
        focusEditor();
        break;
      case "request-unfocus-editor":
        console.log("[renderer] caught request to unfocus editor");
        unfocusEditor();
        break;
      case "request-toggle-editor":
        console.log("[renderer] caught request to toggle editor");
        toggleEditor();
        break;
      case "request-alert-invalid-filename":
        console.log("[renderer] caught request to alert about invalid filename");
        alert("Error: File could not be read");
        break;
    }
  }
}, false);

