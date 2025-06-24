let subtitleData = null;
let subtitleBox = null;
let activeSub = null;
let hasListener = false;

function showSubtitles() {
  if (!subtitleBox) {
    subtitleBox = document.createElement("div");
    subtitleBox.id = "custom-subtitles";
    document.body.appendChild(subtitleBox);
  }
  subtitleBox.style.display = "block";
}

function hideSubtitles() {
  if (subtitleBox) subtitleBox.style.display = "none";
}

function updateSubtitle(video) {
  const currentTimeMs = video.currentTime * 1000;
  const match = subtitleData?.events?.find(
    (ev) =>
      currentTimeMs >= ev.tStartMs &&
      currentTimeMs <= ev.tStartMs + ev.dDurationMs
  );

  if (match && match !== activeSub) {
    subtitleBox.innerText = match.segs.map((s) => s.utf8).join("");
    activeSub = match;
  } else if (!match && activeSub !== null) {
    subtitleBox.innerText = "";
    activeSub = null;
  }
}

function attachSubtitleListeners(video) {
  const handler = () => updateSubtitle(video);
  video.addEventListener("timeupdate", handler);
  video.addEventListener("seeked", handler);
  video.addEventListener("play", handler);
  video.addEventListener("pause", handler);
  document.addEventListener("visibilitychange", handler);
}

function fetchAndProcessSubs(callback) {
  chrome.runtime.sendMessage({ action: "fetchSubs" }, (response) => {
    if (response?.status === "OK") {
      console.log("Request sent to background");
    }
  });

  if (!hasListener) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "processSubs") {
        subtitleData = request.subContent;
        const video = document.querySelector("video");
        if (!video) {
          console.error("No video element found.");
          return;
        }
        attachSubtitleListeners(video);
        if (callback) callback();
      }
    });
    hasListener = true;
  }
}

const checkAndObserve = () => {
  const btn = document.querySelector(".ytp-subtitles-button");
  if (!btn) return;

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "aria-pressed"
      ) {
        const isPressed = btn.getAttribute("aria-pressed") === "true";
        if (isPressed) {
          showSubtitles();
          if (!subtitleData) {
            fetchAndProcessSubs(() => {
              showSubtitles();
            });
          }
        } else {
          hideSubtitles();
        }
      }
    }
  });

  observer.observe(btn, { attributes: true });
};

checkAndObserve();

console.log("content_launched");
