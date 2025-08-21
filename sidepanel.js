document.addEventListener("DOMContentLoaded", function () {
  const statusEl = document.getElementById("status");
  const connectBtn = document.getElementById("connectBtn");
  const suggestionsList = document.getElementById("suggestionsList");
  const currentChatNameEl = document.getElementById("currentChatName");
  const lastMessageEl = document.getElementById("lastMessage");

  let isConnected = false;

  // Update connection status
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

  // Check if WhatsApp Web tab is active
  function checkConnection() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const activeTab = tabs[0];
      setConnected(
        activeTab?.url?.startsWith("https://web.whatsapp.com") || false
      );
    });
  }

  // Render a new suggestion
  //   function renderEvent(event) {
  //     if (!event) return;

  //     const suggestionItem = document.createElement("div");
  //     suggestionItem.className = "suggestion-item";

  //     if (event.type === "NEW_MESSAGE") {
  //       suggestionItem.setAttribute("data-message", event.data.message.text);
  //       suggestionItem.textContent = `💬 ${event.data.message.text}`;
  //     } else if (event.type === "CHAT_CHANGED") {
  //       suggestionItem.textContent = `📂 Chat changed to: ${event.data.name}`;
  //     }

  //     suggestionsList.appendChild(suggestionItem);
  //   }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.lastWhatsAppEvent) {
      const event = changes.lastWhatsAppEvent.newValue;
      if (event.type === "CHAT_CHANGED") {
        console.log(event)
        currentChatNameEl.textContent = event.data.name;
        lastMessageEl.textContent = event.data.lastMessage || "Nenhuma mensagem";
      }
    }
  });

  //   // Load last message if exists
  //   chrome.storage.local.get("lastWhatsAppEvent", (data) => {
  //     renderEvent(data.lastWhatsAppEvent);
  //   });

  // Handle connect button
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

  // Initial check
  checkConnection();
  setInterval(checkConnection, 3000);
});
