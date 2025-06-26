
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchSubs") {
    const tabId = sender.tab.id;

    chrome.debugger.attach({ tabId }, "1.3").then(() => {
      console.log("[Debugger] Attached via message");

      chrome.debugger.sendCommand({ tabId }, "Network.enable");

      chrome.debugger.onEvent.addListener(async (source, method, params) => {
        if (
          source.tabId === tabId &&
          method === "Network.responseReceived" &&
          params.response.url.includes("timedtext") &&
          params.response.mimeType.includes("json")
        ) {
          // console.log("[TimedText URL]", params.response.url);

          const res = await fetch(params.response.url);
          const data = await res.json();
          // console.log("[TimedText JSON]", data);

          chrome.tabs.sendMessage(sender.tab.id, {
          action: "processSubs",
          subContent: data
          });
          sendResponse({ status: "OK" });
          
        }
      });
    }).catch((err) => {
      console.error("Failed to fetch Subtitles", err);
      sendResponse({ status: "ERROR", error: err.message });
    });

    return true;
  }
});


console.log("background_launched")

chrome.runtime.onInstalled.addListener(() => {
  console.log('Highlighter installed');
});