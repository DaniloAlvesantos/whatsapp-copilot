// content.js - Runs inside WhatsApp Web page
console.log("WhatsApp Copilot content script loaded");

class WhatsAppMonitor {
  constructor() {
    this.currentChatId = null;
    this.lastMessageCount = 0;
    this.isInitialized = false;
    this.messageObserver = null;
    this.chatObserver = null;

    this.init();
  }

  init() {
    // Wait for WhatsApp to fully load
    this.waitForWhatsAppLoad(() => {
      console.log("WhatsApp loaded, starting monitoring...");
      this.setupChatMonitoring();
      this.setupMessageMonitoring();
      this.isInitialized = true;
    });
  }

  waitForWhatsAppLoad(callback) {
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

  setupChatMonitoring() {
    // Monitor when user switches to a different chat
    const chatContainer = document.querySelector("#main");
    if (!chatContainer) return;

    this.chatObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          this.onChatChange();
        }
      });
    });

    this.chatObserver.observe(chatContainer, {
      childList: true,
      subtree: true,
    });

    // Initial chat check
    this.onChatChange();
  }

  setupMessageMonitoring() {
    // Monitor for new messages in the current chat
    const messagesContainer = document.querySelector(
      '[aria-label="Chat list"]'
    );
    if (!messagesContainer) return;

    this.messageObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          // Check if new message was added
          const newMessages = Array.from(mutation.addedNodes).filter(
            (node) =>
              node.nodeType === 1 &&
              node.getAttribute("data-testid") === "msg-container"
          );

          if (newMessages.length > 0) {
            // this.onNewMessage();
          }
        }
      });
    });

    this.messageObserver.observe(messagesContainer, {
      childList: true,
      subtree: false,
    });
  }

  onChatChange() {
    setTimeout(() => {
      const chatInfo = this.getCurrentChatInfo();
      if (chatInfo && chatInfo.chatId !== this.currentChatId) {
        this.currentChatId = chatInfo.chatId;
        console.log("Chat changed to:", chatInfo.name);

        // Send chat context to sidepanel
        this.sendToSidepanel({
          type: "CHAT_CHANGED",
          data: {
            ...chatInfo,
            // messages: this.getRecentMessages(5),
          },
        });
      }
      console.log("Current chat info:", chatInfo);
    }, 500);
  }

  //   onNewMessage() {
  //     setTimeout(() => {
  //       const lastMessage = this.getLastMessage();
  //       if (lastMessage && lastMessage.isIncoming) {
  //         console.log("New incoming message:", lastMessage.text);

  //         // Send new message to sidepanel for suggestion generation
  //         this.sendToSidepanel({
  //           type: "NEW_MESSAGE",
  //           data: {
  //             message: lastMessage,
  //             chatContext: this.getCurrentChatInfo(),
  //             recentMessages: this.getRecentMessages(3),
  //           },
  //         });
  //       }
  //     }, 500);
  //   }

  getCurrentChatInfo() {
    // Get current chat name and info
    const headerEl = document.querySelectorAll("header")[3];
    if (!headerEl) return null;

    const nameEl = headerEl.querySelector("span");
    const name = nameEl ? nameEl.textContent.trim() : "Desconhecido";

    // Generate a simple chat ID based on the name (in real app, you'd use WhatsApp's internal ID)
    const chatId = btoa(name).replace(/[^a-zA-Z0-9]/g, "");

    return {
      chatId,
      name,
      timestamp: Date.now(),
    };
  }

  //   getLastMessage() {
  //     const messages = document.querySelectorAll('[data-testid="msg-container"]');
  //     if (messages.length === 0) return null;

  //     const lastMsg = messages[messages.length - 1];
  //     return this.parseMessage(lastMsg);
  //   }

  //   getRecentMessages(count = 5) {
  //     const messages = document.querySelectorAll('[data-testid="msg-container"]');
  //     const recentMessages = Array.from(messages).slice(-count);

  //     return recentMessages.map((msg) => this.parseMessage(msg)).filter(Boolean);
  //   }

  //   parseMessage(messageEl) {
  //     if (!messageEl) return null;

  //     // Check if message is incoming or outgoing
  //     const isIncoming =
  //       messageEl.classList.contains("message-in") ||
  //       !messageEl.querySelector('[data-testid="msg-meta-outgoing"]');

  //     // Get message text
  //     const textEl = messageEl.querySelector(
  //       '[data-testid="conversation-text"] span'
  //     );
  //     const text = textEl ? textEl.textContent.trim() : "";

  //     // Get timestamp
  //     const timeEl = messageEl.querySelector('[data-testid="msg-meta"] span');
  //     const time = timeEl ? timeEl.textContent.trim() : "";

  //     return {
  //       text,
  //       time,
  //       isIncoming,
  //       timestamp: Date.now(),
  //     };
  //   }

  sendToSidepanel(message) {
    // Send message to background script, which will forward to sidepanel
    chrome.runtime.sendMessage({
      action: "FORWARD_TO_SIDEPANEL",
      ...message,
    });
  }
}

// Start monitoring when the page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new WhatsAppMonitor();
  });
} else {
  new WhatsAppMonitor();
}
