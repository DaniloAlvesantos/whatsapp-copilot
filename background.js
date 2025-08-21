// background.js
const TARGET_PAGE = "https://web.whatsapp.com";

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Wait for the tab to finish loading
  if (changeInfo.status !== "complete" || !tab.url) return;

  try {
    const url = new URL(tab.url);

    if (url.origin === TARGET_PAGE) {
      console.log("WhatsApp Web detected, enabling side panel");

      // Only enable the side panel, don't auto-open
      await chrome.sidePanel.setOptions({
        tabId,
        path: "sidepanel.html",
        enabled: true,
      });

      // Handle messages from content script and forward to sidepanel
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "FORWARD_TO_SIDEPANEL") {
          // Store the message so sidepanel can retrieve it
          chrome.storage.local.set({
            lastWhatsAppEvent: {
              ...message,
              timestamp: Date.now(),
            },
          });
        }
      });

      console.log("Side panel enabled - click the extension icon to open");
    } else {
      // Disable the side panel on other sites
      await chrome.sidePanel.setOptions({
        tabId,
        enabled: false,
      });
    }
  } catch (err) {
    console.error("Error handling side panel:", err);
  }
});

// Also handle when extension is installed/enabled
chrome.runtime.onInstalled.addListener(async () => {
  // Check if any existing tabs are WhatsApp Web
  const tabs = await chrome.tabs.query({ url: `${TARGET_PAGE}/*` });

  for (const tab of tabs) {
    if (tab.id) {
      try {
        await chrome.sidePanel.setOptions({
          tabId: tab.id,
          path: "sidepanel.html",
          enabled: true,
        });
        console.log("Side panel enabled for existing WhatsApp tab");
      } catch (err) {
        console.error("Error enabling side panel for existing tab:", err);
      }
    }
  }
});

// Remove the automatic opening since it requires user gesture
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Wait for the tab to finish loading
  if (changeInfo.status !== "complete" || !tab.url) return;

  try {
    const url = new URL(tab.url);

    if (url.origin === TARGET_PAGE) {
      console.log("WhatsApp Web detected, enabling side panel");

      // Only enable the side panel, don't auto-open
      await chrome.sidePanel.setOptions({
        tabId,
        path: "sidepanel.html",
        enabled: true,
      });

      console.log("Side panel enabled - click the extension icon to open");
    } else {
      // Disable the side panel on other sites
      await chrome.sidePanel.setOptions({
        tabId,
        enabled: false,
      });
    }
  } catch (err) {
    console.error("Error handling side panel:", err);
  }
});