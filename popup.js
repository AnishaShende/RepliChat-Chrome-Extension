document.addEventListener("DOMContentLoaded", async function () {
  // Get the elements by their IDs
  var selectedTextElement = document.getElementById("selectedText");
  var chatgptReplyElement = document.getElementById("chatgptReply");
  var loadingSpinner = document.getElementById("loadingSpinner");
  var copyIcon = document.getElementById("copyIcon");
  var generateAnotherButton = document.getElementById("generateAnother");
  var showAllRepliesButton = document.getElementById("showAllReplies");
  var previousRepliesContainer = document.getElementById("previousReplies");

  chrome.storage.local.get(["selectedText"], async function (result) {
    var initialSelectedText = result.selectedText || "";
    selectedTextElement.textContent = initialSelectedText;

    // Show loading spinner while fetching initial ChatGPT reply
    loadingSpinner.style.display = "block";

    // Call a function to get a ChatGPT reply initially based on the selected text
    var initialChatGPTReply = "Loading ...";
    initialChatGPTReply = await getChatGPTReply(initialSelectedText);
    storePreviousReply(initialChatGPTReply);

    // Hide loading spinner after fetching initial ChatGPT reply
    loadingSpinner.style.display = "none";

    chatgptReplyElement.textContent = initialChatGPTReply;

    // Show copy icon when reply is fully generated
    copyIcon.style.display = "inline";

    generateAnotherButton.style.display = "block";
    showAllRepliesButton.style.display = "block";

    // Display previous replies
    displayPreviousReplies(result.previousReplies);
  });

  // Listen for selection changes in the browser
  document.addEventListener("selectionchange", function () {
    // Get the selected text
    chrome.storage.local.get(["selectedText"], async function (result) {
      var selectedText = result.selectedText || "";
      selectedTextElement.textContent = selectedText;
    });
  });

  // Copy text function
  copyIcon.addEventListener("click", function () {
    var chatGPTReply = chatgptReplyElement.textContent;
    navigator.clipboard.writeText(chatGPTReply).then(
      function () {
        console.log("Text copied to clipboard.", chatGPTReply);
        // showToast("Text copied to clipboard");
        alert("Text copied to clipboard");
      },
      function (err) {
        console.error("Error copying text.", err);
        // showToast("Error copying text!");
        alert("Error copying text!");
      }
    );
  });

  // Function to show toast notification
  function showToast(message) {
    var toastContainer = document.getElementById("toast-container");
    var toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = message;
    toastContainer.appendChild(toast);

    setTimeout(function () {
      toast.classList.add("show");
      setTimeout(function () {
        toast.classList.remove("show");
        setTimeout(function () {
          toastContainer.removeChild(toast);
        }, 500);
      }, 3000);
    }, 100);
  }

  // Generate another reply function
  generateAnotherButton.addEventListener("click", async function () {
    // Show loading spinner while fetching another ChatGPT reply
    loadingSpinner.style.display = "block";

    // Call the function to get another ChatGPT reply based on the selected text
    var newChatGPTReply = await getChatGPTReply(
      selectedTextElement.textContent
    );

    loadingSpinner.style.display = "none";

    // Update the displayed ChatGPT reply with the new one
    chatgptReplyElement.textContent = newChatGPTReply;

    // Store the new reply as a previous reply
    storePreviousReply(newChatGPTReply);
  });

  // Show all previous replies function
  showAllRepliesButton.addEventListener("click", function () {
    chrome.storage.local.get("previousReplies", function (result) {
      displayPreviousReplies(result.previousReplies);
    });
    // Call the function when the page is loaded
    document.addEventListener(
      "DOMContentLoaded",
      retrieveAndDisplayPreviousReplies
    );
  });

  // Function to display previous replies
  function displayPreviousReplies(previousReplies) {
    const previousRepliesContainer = document.getElementById(
      "previous-replies-container"
    );
    previousRepliesContainer.innerHTML = ""; // Clear the container

    // Loop through the previous replies and create a new paragraph for each one
    for (let i = 0; i < previousReplies.length; i++) {
      const p = document.createElement("p");
      p.textContent = previousReplies[i];
      previousRepliesContainer.appendChild(p);
    }
  }

  // Function to retrieve and display previous replies
  function retrieveAndDisplayPreviousReplies() {
    chrome.storage.local.get(["previousReplies"], function (result) {
      if (result.previousReplies) {
        displayPreviousReplies(result.previousReplies);
      }
    });
  }

  // Call the function when the page is loaded
  // document.addEventListener('DOMContentLoaded', retrieveAndDisplayPreviousReplies);
  // function displayPreviousReplies(previousReplies) {
  //   const previousRepliesContainer = document.getElementById(
  //     "previous-replies-container"
  //   );
  //   // Clear previous replies container
  //   previousRepliesContainer.innerHTML = "";

  //   // Display each previous reply
  //   if (previousReplies && previousReplies.length > 0) {
  //     previousReplies.forEach(function (reply) {
  //       var replyElement = document.createElement("p");
  //       replyElement.textContent = reply;
  //       previousRepliesContainer.appendChild(replyElement);
  //     });
  //   } else {
  //     // Display a message if there are no previous replies
  //     var noRepliesMessage = document.createElement("p");
  //     noRepliesMessage.textContent = "No previous replies available.";
  //     previousRepliesContainer.appendChild(noRepliesMessage);
  //   }
  // }

  function storePreviousReply(newReply) {
    // Retrieve previous replies from storage
    chrome.storage.local.get("previousReplies", function (result) {
      var previousReplies = result.previousReplies || [];

      // Add the new reply to the list of previous replies
      previousReplies.push(newReply);

      // Limit the number of stored replies
      if (previousReplies.length > 10) {
        previousReplies.shift();
      }

      // Store the updated list of previous replies in the Chrome extension's local storage
      chrome.storage.local.set({ previousReplies: previousReplies });
    });
  }

  // Call the function when the page is loaded
  document.addEventListener(
    "DOMContentLoaded",
    retrieveAndDisplayPreviousReplies
  );

  async function fetchConfig() {
    try {
      const response = await fetch(chrome.runtime.getURL("config.json"));
      const configData = await response.json();
      console.log("configData", configData);
      return configData;
    } catch (error) {
      console.error("Error fetching config:", error);
    }
  }

  // Function to get a ChatGPT reply based on the selected text
  async function getChatGPTReply(selectedText) {
    try {
      const config = await fetchConfig();
      console.log("config: ", config);
      const openaiApiKey = config.openai_api_key;
      const openaiApiUrl = config.API_ENDPOINT;
      console.log("OpenAI API key:", openaiApiKey);
      console.log("OpenAI API key:", openaiApiUrl);

      const apiKey = openaiApiKey;
      const apiUrl = openaiApiUrl;
      const prompt =
        "Hey ChatGPT, Imagine you're embodying the conversational finesse of Dale Carnegie, and a friend has sent you the following message. Your task is to respond thoughtfully and succinctly, capturing the essence of the conversation's context. Craft a reply that reflects comprehension of the received text and offers an appropriate response. Your replies should typically be one to three lines in length. Here's the received message: ";
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: prompt + selectedText },
          ],
          max_tokens: 50,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          // Handle rate limiting by waiting for some time and then retrying
          await new Promise((resolve) => setTimeout(resolve, 3000));
          return getChatGPTReply(selectedText);
        }

        throw new Error(
          `Failed to fetch response from OpenAI API. Status: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("data: ", data);
      const chatGPTReply =
        data.choices[0]?.message?.content || "No reply from ChatGPT.";
      console.log("ChatGPTReply: ", chatGPTReply);
      return chatGPTReply;
    } catch (error) {
      console.error("Error fetching ChatGPT reply:", error.message);
      return "Error fetching ChatGPT reply.";
    }
  }
});
