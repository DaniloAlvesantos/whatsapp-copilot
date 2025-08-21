document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("openPanel").addEventListener("click", async () => {
    try {
      const [activeTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (activeTab && activeTab.id) {
        if (
          activeTab.url &&
          activeTab.url.startsWith("https://web.whatsapp.com")
        ) {
          // Enable and open the side panel for this tab
          await chrome.sidePanel.setOptions({
            tabId: activeTab.id,
            path: "sidepanel.html",
            enabled: true,
          });

          await chrome.sidePanel.open({ tabId: activeTab.id });
          window.close(); // Close popup after opening side panel
        } else {
          alert("Por favor, navegue até web.whatsapp.com primeiro");
        }
      }
    } catch (err) {
      console.error("Error opening side panel:", err);
      alert("Erro ao abrir o painel. Verifique se você está no WhatsApp Web.");
    }
  });
});
