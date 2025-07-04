let subtitleData = null;
let subtitleBox = null;
let activeSub = null;
let hasListener = false;

let subtitleData2 = null;
let activeSub2 = null;

function showSubtitles() {
  if (!subtitleBox) {
    subtitleBox = document.createElement("div");
    subtitleBox.id = "custom-subtitles";

    // Controls wrapper
    const controlsWrapper = document.createElement("div");
    controlsWrapper.id = "subtitle-controls";

    const dragHandle = document.createElement("div");
    dragHandle.id = "drag-handle";
    dragHandle.textContent = "☰";

    let langSelect = document.getElementById("language-select");
    if (!langSelect) {
      langSelect = document.createElement("select");
      langSelect.id = "language-select";
      langSelect.classList.add("custom-select");

      window.youtubeLanguages.forEach((lang) => {
        const option = document.createElement("option");
        option.value = lang.code;
        option.textContent = lang.name;
        langSelect.appendChild(option);
      });

      const savedLang = localStorage.getItem("selectedLanguage") || "en";
      langSelect.value = savedLang;

      langSelect.addEventListener("change", (e) => {
        const selectedLanguage = e.target.value;
        localStorage.setItem("selectedLanguage", selectedLanguage);
        fetchAndProcessSubs(null, selectedLanguage);
      });
    }

    // Subtitle container
    const subtitleContainer = document.createElement("div");
    subtitleContainer.className = "subtitle-container";

    // Subtitle background and text
    const textBackground = document.createElement("div");
    textBackground.id = "subtitle-background";

    const textContainer = document.createElement("div");
    textContainer.id = "subtitle-text";

    const textContainer2 = document.createElement("div");
    textContainer2.id = "subtitle-text-2";

    textBackground.appendChild(textContainer);
    textBackground.appendChild(textContainer2);

    // Resize handles
    const resizeHandle = document.createElement("div");
    resizeHandle.id = "resize-handle";

    const resizeHandleX = document.createElement("div");
    resizeHandleX.id = "resize-handle-x";

    // Append controls
    controlsWrapper.appendChild(dragHandle);
    controlsWrapper.appendChild(langSelect);
    subtitleBox.appendChild(controlsWrapper);

    // Append background + handles to container
    subtitleContainer.appendChild(textBackground);
    subtitleContainer.appendChild(resizeHandle);
    subtitleContainer.appendChild(resizeHandleX);

    // Append to main subtitle box
    subtitleBox.appendChild(subtitleContainer);

    // Insert into YouTube player instead of body
    const player = document.querySelector('.html5-video-player');
    if (player) {
      player.appendChild(subtitleBox);
    } else {
      console.warn("YouTube video player not found, falling back to body");
      document.body.appendChild(subtitleBox);
    }

    // Enable functionality
    enableResize(textBackground, resizeHandle);
    enableHorizontalResize(textBackground, resizeHandleX);
    enableDrag(subtitleBox, dragHandle);
  }

  subtitleBox.style.display = "block";
}


function hideSubtitles() {
  if (subtitleBox) subtitleBox.style.display = "none";
  // need to add code for second subtitle here
}

function updateSubtitle(video) {
  const currentTimeMs = video.currentTime * 1000;
  const match = subtitleData?.events?.find(
    (ev) =>
      currentTimeMs >= ev.tStartMs &&
      currentTimeMs <= ev.tStartMs + ev.dDurationMs
  );

  // need to add code for second subtitle here
  const match2 = subtitleData2?.events?.find(
    (ev) =>
      currentTimeMs >= ev.tStartMs &&
      currentTimeMs <= ev.tStartMs + ev.dDurationMs
  );

  const textContainer = subtitleBox?.querySelector("#subtitle-text");
  const textContainer2 = subtitleBox?.querySelector("#subtitle-text-2");

  if (match && match !== activeSub && textContainer) {
    textContainer.innerText = match.segs.map((s) => s.utf8).join("");
    activeSub = match;
  } else if (!match && activeSub !== null && textContainer) {
    textContainer.innerText = "";
    activeSub = null;
  }

  if (match2 && match2 !== activeSub2 && textContainer2) {
    textContainer2.innerText = match2.segs?.map((s) => s.utf8).join("") || "";
    activeSub2 = match2;
  } else if (!match2 && activeSub2 !== null && textContainer2) {
    textContainer2.innerText = "";
    activeSub2 = null;
  }
}

function enableDrag(box, handle) {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  handle.addEventListener("mousedown", function (e) {
    isDragging = true;
    const rect = box.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    document.body.style.userSelect = "none";
  });

  document.addEventListener("mousemove", function (e) {
    if (isDragging) {
      const parent = box.parentElement;
      const parentRect = parent.getBoundingClientRect();

      let newLeft = e.clientX - offsetX - parentRect.left;
      let newTop = e.clientY - offsetY - parentRect.top;

      // Clamp to parent bounds
      const maxLeft = parent.clientWidth - box.offsetWidth;
      const maxTop = parent.clientHeight - box.offsetHeight;

      newLeft = Math.max(0, Math.min(newLeft, maxLeft));
      newTop = Math.max(0, Math.min(newTop, maxTop));

      box.style.left = `${newLeft}px`;
      box.style.top = `${newTop}px`;
      box.style.transform = "none";
    }
  });

  document.addEventListener("mouseup", function () {
    isDragging = false;
    document.body.style.userSelect = "auto";
  });
}

function enableResize(box, handle) {
  let isResizing = false;
  const baseWidth = 200;
  const baseFontSize = 16;

  box.style.width = `${baseWidth}px`;
  box.style.fontSize = `${baseFontSize}px`;

  handle.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    isResizing = true;
    document.body.style.userSelect = "none";
    box.style.cursor = "se-resize";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;

    const container = box.parentElement || document.body;
    const containerRect = container.getBoundingClientRect();
    const boxRect = box.getBoundingClientRect();

    let maxWidth = containerRect.right - boxRect.left;
    let newWidth = Math.max(Math.min(e.clientX - boxRect.left, maxWidth), 100);
    box.style.width = `${newWidth}px`;

    const scaleFactor = newWidth / baseWidth;
    const scaledFont = baseFontSize * scaleFactor;
    box.style.fontSize = `${scaledFont}px`;
  });

  document.addEventListener("mouseup", () => {
    isResizing = false;
    box.style.cursor = "text";
    document.body.style.userSelect = "auto";
  });

  box.addEventListener("mouseenter", () => {
    if (!isResizing) {
      box.style.cursor = "text";
    }
  });
}

function enableHorizontalResize(box, handle) {
  let isResizing = false;
  const minWidth = 100;

  handle.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    isResizing = true;
    document.body.style.userSelect = "none";
    box.style.cursor = "ew-resize";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;

    const container = box.parentElement || document.body;
    const containerRect = container.getBoundingClientRect();
    const boxRect = box.getBoundingClientRect();

    let maxWidth = containerRect.right - boxRect.left;
    let newWidth = Math.max(minWidth, Math.min(e.clientX - boxRect.left, maxWidth));
    box.style.width = `${newWidth}px`;
  });

  document.addEventListener("mouseup", () => {
    isResizing = false;
    box.style.cursor = "text";
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

function fetchAndProcessSubs(callback, selectedLanguage) {
  chrome.runtime.sendMessage(
    { action: "fetchSubs", selectedLanguage: selectedLanguage },
    (response) => {
      if (response?.status === "OK") {
        console.log("Request sent to background");
      }
    }
  );

  if (!hasListener) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "processSubs") {
        // need to add code for second subtitle here
        subtitleData = request.subContent;
        subtitleData2 = request.subContent2 || null;
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
          const langSelect = document.getElementById("language-select");
          // always fetch to handle sub transition
          const selectedLanguage = langSelect?.value || "en";
          fetchAndProcessSubs(() => {
            showSubtitles();
          }, selectedLanguage);
        } else {
          hideSubtitles();
        }
      }
    }
  });

  observer.observe(btn, { attributes: true });
};

checkAndObserve();




