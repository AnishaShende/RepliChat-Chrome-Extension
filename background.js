chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "getSelectedText") {
    console.log("Selected Text in Background:", request.text);
    // Forward the message to the popup
    chrome.runtime.sendMessage({ action: "updatePopup", text: request.text });
  }
});

