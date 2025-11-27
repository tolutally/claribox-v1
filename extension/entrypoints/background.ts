const GMAIL_ORIGIN = "https://mail.google.com";

async function updateSidePanelState(tabId: number, url: string) {
  try {
    const urlObj = new URL(url);
    const isGmail = urlObj.origin === GMAIL_ORIGIN;

    if (isGmail) {
      // Enable + wire panel for Gmail tabs
      await chrome.sidePanel.setOptions({
        tabId,
        path: "entrypoints/sidebar/sidebar.html",
        enabled: true,
      });
    } else {
      // 🔴 Not Gmail: close the panel ASAP

      // Chrome 141+ has sidePanel.close
      try {
        // Close the panel in this tab (if open)
        // @ts-ignore – older types may not know about close()
        await chrome.sidePanel.close({ tabId });
      } catch (e) {
        // Fallback for older Chrome: disable + ask panel to call window.close()
        await chrome.sidePanel.setOptions({ tabId, enabled: false });
        chrome.runtime.sendMessage({
          type: "claribox/force-close-sidepanel",
          tabId,
        }).catch(() => {
          // Panel might not be open, ignore error
        });
      }
    }
  } catch (e) {
    // Invalid URL (chrome:// etc.) → just disable
    await chrome.sidePanel.setOptions({ tabId, enabled: false });
  }
}

// When a tab finishes loading a URL
chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status === "complete" && tab.url) {
    updateSidePanelState(tabId, tab.url);
  }
});

// When user switches tabs
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  if (tab.url) {
    updateSidePanelState(tabId, tab.url);
  } else {
    await chrome.sidePanel.setOptions({ tabId, enabled: false });
  }
});

// On install/startup
chrome.runtime.onInstalled.addListener(async () => {
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id && tab.url) {
      updateSidePanelState(tab.id, tab.url);
    }
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openSidePanel' && sender.tab?.id) {
    chrome.sidePanel.open({ tabId: sender.tab.id, windowId: sender.tab.windowId })
      .catch((error) => console.error('Failed to open side panel:', error));
  }
});

console.log('Claribox background script loaded');

export { };