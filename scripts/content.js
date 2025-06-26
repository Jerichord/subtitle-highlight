let subtitleData = null;
let subtitleBox = null;
let activeSub = null;
let hasListener = false;

function showSubtitles() {
  if (!subtitleBox) {
    subtitleBox = document.createElement("div");
    subtitleBox.id = "custom-subtitles";

    const dragHandle = document.createElement("div");
    dragHandle.id = "drag-handle";
    dragHandle.textContent = "☰";

    const textBackground = document.createElement("div");
    const textContainer = document.createElement("div");
    textBackground.id = "subtitle-background";
    textContainer.id = "subtitle-text";

    subtitleBox.appendChild(dragHandle);
    subtitleBox.appendChild(textBackground);

    textBackground.appendChild(textContainer);

    document.body.appendChild(subtitleBox);
    enableDrag(subtitleBox, dragHandle);
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

  const textContainer = subtitleBox?.querySelector("#subtitle-text");

  if (match && match !== activeSub && textContainer) {
    textContainer.innerText = match.segs.map((s) => s.utf8).join("");
    activeSub = match;
  } else if (!match && activeSub !== null && textContainer) {
    textContainer.innerText = "";
    activeSub = null;
  }
}

function enableDrag(box, handle) {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  handle.addEventListener("mousedown", function (e) {
    isDragging = true;
    offsetX = e.clientX - box.offsetLeft;
    offsetY = e.clientY - box.offsetTop;
    document.body.style.userSelect = "none";
  });

  document.addEventListener("mousemove", function (e) {
    if (isDragging) {
      box.style.left = `${e.clientX - offsetX}px`;
      box.style.top = `${e.clientY - offsetY}px`;
      box.style.transform = "none";
    }
  });

  document.addEventListener("mouseup", function () {
    isDragging = false;
    document.body.style.userSelect = "auto";
  });
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
  // New code here: new selector for value of language dropdown select menu when it is pressed

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (
        // New code here: need attribute for whenever a new select is triggered from a menu
        mutation.type === "attributes" &&
        mutation.attributeName === "aria-pressed"
      ) {
        // New code here: also need or condition to show that select menu was triggered
        const isPressed = btn.getAttribute("aria-pressed") === "true";
        if (isPressed) {
          showSubtitles();
          if (!subtitleData) {
            // New code here: get subtitle button value of language dropdown select menu and pass it into fetchAndProcessSubs
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
