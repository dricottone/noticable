////////////////////////////
// Monaco magic goes here //
////////////////////////////
require.config({ paths: { vs: 'node_modules/monaco-editor/min/vs' } });
require(['vs/editor/editor.main'], function () {
  window.editor = monaco.editor.create(document.getElementById('container-editor'), {
    automaticLayout: true,
    language: 'markdown',
    minimap: {
      enabled: false
    },
    value: '',
    wordWrap: 'on',
  });
});


///////////////////////
// Functions go here //
///////////////////////

// TODO: Add documentation for all functions.

// Parse a file name and return a pretty note title.
function cleanTitle(filename) {
  return filename.split(".")[0].split("_").join(" ");
};

function showEditor() {
  $("#container-editor").addClass("focused");
  $("#container-viewer").removeClass("focused");
};

function showViewer() {
  $("#container-editor").removeClass("focused");
  $("#container-viewer").addClass("focused");
};

function addTitle(filename) {
  let element = document.createElement("li");
  element.innerHTML = cleanTitle(filename);
  element.addEventListener("click", () => { preloadContentForCheckThenRead(filename); });
  $("#list-filenames").append(element)
};

function newTitle(filename) {
  $("#list-filenames li").removeClass("focused")
  let selector = "#list-filenames li:contains(" + cleanTitle(filename) + ")"
  $(selector).addClass("focused")
};

function sortTitles() {
  let sidebar = $("#list-filenames")
  let titles = sidebar.children("li")
  titles.detach().sort((a,b) => a.innerText.localeCompare(b.innerText))
  sidebar.append(titles)
};

function newContent(content) {
  window.editor.setValue(content);
};

function newHTML(html) {
  $("#container-viewer").html(html);
};

function preloadContentForSave() {
  window.postMessage({ type: "contentForSave", text: window.editor.getValue() }, "*");
};

function preloadContentForSaveThenNew() {
  window.postMessage({ type: "contentForSaveThenNew", text: window.editor.getValue() }, "*");
};

function preloadContentForSaveThenRead(filename) {
  window.postMessage({ type: "contentForSaveThenRead", text: { note: window.editor.getValue(), title: filename } }, "*");
};

function preloadContentForCheckThenNew() {
  window.postMessage({ type: "contentForCheckThenNew", text: window.editor.getValue() }, "*");
};

function preloadContentForCheckThenRead(filename) {
  window.postMessage({ type: "contentForCheckThenRead", text: { note: window.editor.getValue(), title: filename } }, "*");
};

function preloadContentForRender() {
  window.postMessage({ type: "contentForRender", text: window.editor.getValue() }, "*");
};


////////////////////////////
// Listen for events here //
////////////////////////////
window.addEventListener("message", (event) => {
  if (event.source != window) return;
  if (event.data.type) {
    let parameter = event.data.text;
    switch(event.data.type) {
      case "addTitle":
        addTitle(parameter);
        sortTitles();
        break;
      case "addTitleOrdered":
        addTitle(parameter);
        break;
      case "newTitle":
        newTitle(parameter);
        break;
      case "newContent":
        newContent(parameter);
        break;
      case "newHTML":
        newHTML(parameter);
        break;
      case "sendContentForSave":
        preloadContentForSave();
        break;
      case "sendContentForSaveThenNew":
        preloadContentForSaveThenNew();
        break;
      case "sendContentForSaveThenRead":
        preloadContentForSaveThenRead(parameter);
        break;
      case "sendContentForCheckThenNew":
        preloadContentForCheckThenNew();
        break;
      case "sendContentForRender":
        preloadContentForRender();
        break;
      case "showEditor":
        showEditor();
        break;
      case "showViewer":
        showViewer();
        break;
      case "fileNotSaved":
        // TODO: add some UI component to indicate an error occured
        break;
      case "fileDiscarded":
        // TODO: add some UI component to indicate an error occured
        break;
      case "fileUnreadable":
        // TODO: add some UI component to indicate an error occured
        break;
      case "fileUnwritable":
        // TODO: add some UI component to indicate an error occured
        break;
    }
  }
}, false);

