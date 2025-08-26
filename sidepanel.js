document.addEventListener("DOMContentLoaded", function () {
  const statusEl = document.getElementById("status");
  const suggestionsList = document.getElementById("suggestionsList");
  const currentChatNameEl = document.getElementById("currentChatName");
  const lastMessageEl = document.getElementById("lastMessage");
  let isConnected = false;

  // Renders the suggestions based on the state
  function renderSuggestions(state) {
    suggestionsList.innerHTML = ""; // Clear previous suggestions

    if (state.isLoading) {
      // Render the skeleton loading UI
      suggestionsList.innerHTML = `
        <div class="suggestion-item-skeleton"></div>
        <div class="suggestion-item-skeleton"></div>
        <div class="suggestion-item-skeleton"></div>
      `;
      lastMessageEl.textContent =
        state.originalMessage || "Generating response...";
      return;
    }

    if (state.error) {
      // Render the error state
      suggestionsList.innerHTML = `<div class="error-message">${state.error}</div>`;
      lastMessageEl.textContent = "";
      return;
    }

    if (state.suggestions) {
      // Render the actual suggestions
      lastMessageEl.textContent = state.originalMessage || "";
      Object.keys(state.suggestions).forEach((key) => {
        const suggestionText = state.suggestions[key];
        const suggestionItem = document.createElement("div");
        suggestionItem.className = "suggestion-item";
        suggestionItem.setAttribute("data-message", suggestionText);
        suggestionItem.textContent = `💬 ${suggestionText}`;
        suggestionsList.appendChild(suggestionItem);
      });
    }
  }

  // Listen for all changes in chrome.storage.local
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local") {
      if (changes.chatInfo && changes.chatInfo.newValue) {
        currentChatNameEl.textContent = changes.chatInfo.newValue.name;
      }
      if (changes.appState && changes.appState.newValue) {
        renderSuggestions(changes.appState.newValue);
      }
    }
  });

  // Initial load of the state
  chrome.storage.local.get(["appState", "chatInfo"], (data) => {
    if (data.chatInfo) {
      currentChatNameEl.textContent = data.chatInfo.name;
    }
    if (data.appState) {
      renderSuggestions(data.appState);
    }
  });

  // Your other UI logic for buttons and clipboard remains the same...
  connectBtn.addEventListener("click", function () {
    if (isConnected) {
      chrome.tabs.query({ url: "https://web.whatsapp.com/*" }, function (tabs) {
        if (tabs.length > 0) chrome.tabs.reload(tabs[0].id);
      });
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0])
          chrome.tabs.update(tabs[0].id, { url: "https://web.whatsapp.com" });
      });
    }
  });

  // Copy suggestion to clipboard on click
  suggestionsList.addEventListener("click", function (e) {
    const suggestionItem = e.target.closest(".suggestion-item");
    if (!suggestionItem) return;

    const message = suggestionItem.getAttribute("data-message");
    if (message) {
      navigator.clipboard.writeText(message).then(() => {
        const originalText = suggestionItem.textContent;
        suggestionItem.style.backgroundColor = "#d4edda";
        suggestionItem.textContent = "📋 Copiado!";

        setTimeout(() => {
          suggestionItem.textContent = originalText;
          suggestionItem.style.backgroundColor = "";
        }, 1500);
      });
    }
  });

  function setConnected(connected) {
    isConnected = connected;
    if (connected) {
      statusEl.textContent = "Conectado ao WhatsApp Web ✓";
      statusEl.className = "status connected";
      connectBtn.textContent = "Reconectar";
    } else {
      statusEl.textContent = "Não conectado ao WhatsApp Web";
      statusEl.className = "status disconnected";
      connectBtn.textContent = "Ir para WhatsApp Web";
    }
  }

  function checkConnection() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const activeTab = tabs[0];
      setConnected(
        activeTab?.url?.startsWith("https://web.whatsapp.com") || false
      );
    });
  }

  checkConnection();
  setInterval(checkConnection, 3000);
});
