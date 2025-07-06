let lastTimedTextUrl = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchSubs") {
    (async () => {
      const tabId = sender.tab.id;

      // Case 1: Use previously captured subtitle URL from debugger
      if (lastTimedTextUrl && !request.fromYT) {
        try {
          const urlObj = new URL(lastTimedTextUrl);
          const lang = urlObj.searchParams.get("lang");
          const tlang = urlObj.searchParams.get("tlang");
          const currentLang = tlang || lang;

          // First fetch
          const subs1 = await fetch(urlObj.toString()).then(r => r.json());
          let subs2 = null;

          // if (currentLang != request.selectedLanguage) {
          if (!request.selectedLanguage.startsWith(currentLang)) {
            urlObj.searchParams.set("tlang", request.selectedLanguage);
            subs2 = await fetch(urlObj.toString()).then(r => r.json());
          }

          const message = {
            action: "processSubs",
            subContent: subs1,
          };
          if (subs2) message.subContent2 = subs2;

          chrome.tabs.sendMessage(sender.tab.id, message);
          sendResponse({ status: "OK (manual fetch)" });
        } catch (err) {
          console.error("[Manual Fetch Error]", err);
          sendResponse({ status: "ERROR", error: err.message });
        }
        return;
      }
      // Case 2: Fallback — attach debugger and wait for timedtext
      try {
        await chrome.debugger.attach({ tabId }, "1.3");
        console.log("[Debugger] Attached via message");

        await chrome.debugger.sendCommand({ tabId }, "Network.enable");

        chrome.debugger.onEvent.addListener(async (source, method, params) => {
          if (
            source.tabId === tabId &&
            method === "Network.responseReceived" &&
            params.response.url.includes("timedtext") &&
            params.response.mimeType.includes("json")
          ) {
            lastTimedTextUrl = params.response.url;

            const urlObj = new URL(params.response.url);
            const urlSearch = urlObj.searchParams;
            const lang = urlSearch.get("lang");
            const tlang = urlSearch.get("tlang");
            const currentLang = tlang || lang;

            const subs1 = await fetch(urlObj.toString()).then(r => r.json());
            let subs2 = null;

            // if (currentLang != request.selectedLanguage) {
            if (!request.selectedLanguage.startsWith(currentLang)) {
              urlObj.searchParams.set("tlang", request.selectedLanguage);
              subs2 = await fetch(urlObj.toString()).then(r => r.json());
            }

            const message = {
              action: "processSubs",
              subContent: subs1,
            };
            if (subs2) message.subContent2 = subs2;

            chrome.tabs.sendMessage(tabId, message);
            sendResponse({ status: "OK (debugger)" });
          }
        });
      } catch (err) {
        console.error("[Debugger Attach Error]", err);
        sendResponse({ status: "ERROR", error: err.message });
      }
    })();

    return true; // async response
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("Highlighter installed");
});
