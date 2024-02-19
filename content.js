document.addEventListener("selectionchange", () => {
  const selectedText = window.getSelection().toString().trim();
  chrome.storage.local.set({ selectedText });
});
