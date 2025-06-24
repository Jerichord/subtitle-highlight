document.getElementById('start').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  chrome.runtime.sendMessage({ action: "attachDebugger", tabId: tab.id });
});

function createCustomSubtitleOverlay() {
  if (document.getElementById("custom-sub-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "custom-sub-overlay";
  overlay.className = "subtitle-overlay";
  overlay.textContent = "replacement subs";
  document.body.appendChild(overlay);
}

function setupSubtitleButtonObserver() {
  const checkAndObserve = () => {
    const btn = document.querySelector(".ytp-subtitles-button");
    if (!btn) return;

    // Watch the aria-pressed attribute
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "aria-pressed"
        ) {
          const isPressed = btn.getAttribute("aria-pressed") === "true";
          if (isPressed) {
            // hideYouTubeCaptions();

            let subtitleBox = document.getElementById("custom-subtitles");
            if (!subtitleBox) {
              subtitleBox = document.createElement("div");
              subtitleBox.id = "custom-subtitles";
              document.body.appendChild(subtitleBox);
            }
            // Request the json file from background.js
            chrome.runtime.sendMessage({ action: "fetchSubs" }, (response) => {
              if (response?.status === "OK") {
                console.log("Request sent to background");
              }
            });

            // Listen for the response with the json data
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
              if (request.action === "processSubs") {
                // process subs code here
                let subtitleData = request.subContent
                const video = document.querySelector("video");
                if (!video) {
                  console.error("No video element found.");
                  return;
                } 
                
                let activeSub = null;
                function updateSubtitle() {
                  const currentTimeMs = video.currentTime * 1000;
                  const match = subtitleData.events.find(ev => {
                    return (
                      currentTimeMs >= ev.tStartMs &&
                      currentTimeMs <= ev.tStartMs + ev.dDurationMs
                    );
                  });

                  if (match && match !== activeSub) {
                    subtitleBox.innerText = match.segs.map(s => s.utf8).join('');
                    activeSub = match;
                  } else if (!match && activeSub !== null) {
                    subtitleBox.innerText = '';
                    activeSub = null;
                  }
                }

                // Listen for playback changes
                video.addEventListener("timeupdate", updateSubtitle);
                video.addEventListener("seeked", updateSubtitle);
                video.addEventListener("play", updateSubtitle);
                video.addEventListener("pause", updateSubtitle);
                document.addEventListener("visibilitychange", updateSubtitle);
                
              }
            });
            createCustomSubtitleOverlay();
          } else {
            const overlay = document.getElementById("custom-subtitles");
            if (overlay) overlay.style.display = "none";
          }
        }
      }
    });

    observer.observe(btn, { attributes: true });
  };

   // Wait until button is available
  const waitObserver = new MutationObserver(() => {
    const btn = document.querySelector(".ytp-subtitles-button");
    if (btn) {
      waitObserver.disconnect();
      checkAndObserve();
    }
  });

  waitObserver.observe(document.body, { childList: true, subtree: true });
}
