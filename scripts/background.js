function msToVttTime(ms) {
  const date = new Date(ms);
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  const mmm = String(date.getUTCMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${mmm}`;
}

function convertTimedTextJsonToVtt(json) {
  let vtt = 'WEBVTT\n\n';
  let cueIndex = 0;

  for (const event of json.events) {
    const start = msToVttTime(event.tStartMs);
    const end = msToVttTime(event.tStartMs + (event.dDurationMs || 1000));

    const text = (event.segs || [])
      .map(seg => seg.utf8)
      .filter(Boolean)
      .join('');

    if (text.trim()) {
      vtt += `${cueIndex}\n${start} --> ${end}\n${text}\n\n`;
      cueIndex++;
    }
  }

  return vtt;
}

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
          console.log("[TimedText URL]", params.response.url);

          const res = await fetch(params.response.url);
          const data = await res.json();
          console.log("[TimedText JSON]", data);

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


