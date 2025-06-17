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
            createCustomSubtitleOverlay();
          } else {
            const overlay = document.getElementById("custom-sub-overlay");
            if (overlay) overlay.remove();
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
