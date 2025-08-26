console.log("WhatsApp Copilot console test loaded");

let currentChatId = null;
let chatObserver = null;
let messageObserver = null;

function getCurrentChatInfo() {
  const headerEl = document.querySelectorAll("header")[3];
  if (!headerEl) return null;

  const nameEl = headerEl.querySelector("span.x1iyjqo2");
  const name = nameEl ? nameEl.textContent.trim() : "Desconhecido";

  const chatId = btoa(name).replace(/[^a-zA-Z0-9]/g, "");

  return {
    chatId,
    name,
    timestamp: Date.now(),
  };
}

function onChatChange() {
  const chatInfo = getCurrentChatInfo();
  if (chatInfo && chatInfo.chatId !== currentChatId) {
    currentChatId = chatInfo.chatId;
    sendToSidepanel({
      type: "CHAT_CHANGED",
      data: {
        ...chatInfo,
        messages: getRecentMessagesFromChat(5),
        lastMessage: getLastIncomingMessage(),
      },
    });
  }
  console.log("Current chat info:", chatInfo);
}

function setupChatMonitoring() {
  const mainContainer = document.querySelector(".x9f619.x1n2onr6.xupqr0c");
  if (!mainContainer) {
    console.log("Main container not found");
    return;
  }

  const chatContainer = document.querySelector("#main");
  if (!chatContainer) {
    console.log("Chat container not found");
  }

  const chatObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (document.querySelector("#main")) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          onChatChange();
        }
      }
    });
  });

  chatObserver.observe(mainContainer, {
    childList: true,
    subtree: true,
  });

  // Initial check
  onChatChange();
  console.log("Chat monitoring started");
}

function waitForWhatsAppLoad(callback) {
  const checkInterval = setInterval(() => {
    // Check if WhatsApp main interface is loaded
    const mainPanel = document.querySelector("#main");
    const chatList = document.querySelector('[aria-label="Chat list"]');

    if (mainPanel || chatList) {
      clearInterval(checkInterval);
      setTimeout(callback, 1000); // Give it a moment to fully render
    }
  }, 1000);
}

function sendToSidepanel(message) {
  const data = chrome.runtime.sendMessage({
    action: "FORWARD_TO_SIDEPANEL",
    ...message,
  });

  console.log(data);
}

function setupMessageMonitoring() {
  // Monitor for new messages in the current chat
  const messagesContainer = document.querySelector('[aria-label="Chat list"]');
  if (!messagesContainer) return;

  messageObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        // Check if new message was added
        const newMessages = Array.from(mutation.addedNodes).filter(
          (node) =>
            node.nodeType === 1 &&
            node.getAttribute("data-testid") === "msg-container"
        );

        if (newMessages.length > 0) {
          onNewMessage();
        }
      }
    });
  });

  messageObserver.observe(messagesContainer, {
    childList: true,
    subtree: false,
  });
}

function getLastMessageFromChat() {
  const messagesCount = document.querySelectorAll("._akbu");
  if (messagesCount.length === 0) return null;
  const lastMsg = messagesCount[messagesCount.length - 1].querySelector("span");
  return lastMsg.textContent;
}

function getLastIncomingMessage() {
  const clientMessages = Array.from(document.querySelectorAll("._amk6")).filter(
    (msg) => !msg.querySelector('span[aria-label="You:"]')
  );
  if (clientMessages.length === 0) return null;
  const lastMsg = clientMessages[clientMessages.length - 1]
    .querySelector("._akbu")
    .querySelector("span");
  return lastMsg.textContent;
}

function getNewMessage() {
  const messagesContainer = document.querySelector('[aria-label="Chat list"]');
  const messagesChats = messagesContainer.querySelectorAll(".x10l6tqk");
  const messageCountPopup = messagesChats[0].querySelector(".x140p0ai");
  const lastMessage = messagesChats[0].querySelector("span.x78zum5");

  if (messageCountPopup && lastMessage) {
    return lastMessage.textContent;
  } else {
    return null;
  }
}

function getRecentMessages(count = 5) {
  const messagesContainer = document.querySelector('[aria-label="Chat list"]');
  if (!messagesContainer) return [];

  const messagesChats = messagesContainer.querySelectorAll(".x10l6tqk");
  if (!messagesChats.length) return [];

  // Take the last 'count' messages
  const recentMessages = Array.from(messagesChats)
    .slice(-count)
    .map((msgEl) => {
      // Try to get the message text inside the span
      const textEl = msgEl.querySelector("span.x78zum5");
      return textEl ? textEl.textContent : null;
    })
    .filter(Boolean); // Remove nulls

  return recentMessages;
}

function getRecentMessagesFromChat(count = 5) {
  const messages = document.querySelectorAll("._akbu");
  const recentMessages = Array.from(messages).slice(-count);

  return recentMessages
    .map((msg) => msg.querySelector("span").textContent)
    .reverse();
}

function onNewMessage() {
  const lastMessage = getNewMessage();
  if (lastMessage) {
    console.log("New incoming message:", lastMessage.textContent);

    // Send new message to sidepanel for suggestion generation
    sendToSidepanel({
      type: "NEW_MESSAGE",
      data: {
        message: lastMessage,
        chatContext: getCurrentChatInfo(),
        recentMessages: getRecentMessages(3),
      },
    });
  }
}

// Start monitoring
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    waitForWhatsAppLoad(setupChatMonitoring);
  });
} else {
  waitForWhatsAppLoad(setupChatMonitoring);
}
