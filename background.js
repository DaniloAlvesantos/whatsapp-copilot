const TARGET_PAGE = "https://web.whatsapp.com";
const apiRoute = "http://127.0.0.1:8000/generate";

async function sendMessage(message) {
  // Set the initial loading state for the UI
  await chrome.storage.local.set({
    appState: {
      isLoading: true,
      suggestions: null,
      originalMessage: null,
      error: null,
    },
  });

  try {
    if (!message || message.trim() === "" || message.length < 3) {
      console.warn("⚠️ Skipping AI request: empty or too short message");
      await chrome.storage.local.set({
        appState: {
          isLoading: false,
          suggestions: null,
          originalMessage: null,
          error: null,
        },
      });
      return;
    }

    const response = await fetch(apiRoute, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: message
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate suggestions from API.");
    }
    const data = await response.json();
    const suggestions = JSON.parse(data.suggestions);

    await chrome.storage.local.set({
      appState: {
        isLoading: false,
        suggestions: suggestions,
        originalMessage: data.original_message,
        error: null,
      },
    });

  } catch (error) {
    console.error("Error sending message to AI:", error);
    await chrome.storage.local.set({
      appState: {
        isLoading: false,
        suggestions: null,
        originalMessage: null,
        error: "Failed to load suggestions. Please try again.",
      },
    });
  }
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;
  const isWhatsApp = tab.url.startsWith(TARGET_PAGE);

  try {
    await chrome.sidePanel.setOptions({
      tabId,
      path: "sidepanel.html",
      enabled: isWhatsApp,
    });
  } catch (err) {
    console.error("Error handling side panel:", err);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "FORWARD_TO_SIDEPANEL") {
    chrome.storage.local.set({
      chatInfo: message.data,
    });

    if (message.type === "CHAT_CHANGED" && message.data.lastMessage) {
      sendMessage(message.data.lastMessage);
    }
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  const tabs = await chrome.tabs.query({
    url: `${TARGET_PAGE}/*`
  });
  for (const tab of tabs) {
    if (tab.id) {
      try {
        await chrome.sidePanel.setOptions({
          tabId: tab.id,
          path: "sidepanel.html",
          enabled: true,
        });
      } catch (err) {
        console.error("Error enabling side panel:", err);
      }
    }
  }
});