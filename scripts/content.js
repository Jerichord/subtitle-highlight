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

    const dragHandle = document.createElement("div");
    dragHandle.id = "drag-handle";
    dragHandle.textContent = "☰";

    let langSelect = document.getElementById("language-select");
    if (!langSelect) {
      langSelect = document.createElement("select");
      langSelect.id = "language-select";
      langSelect.style.margin = "5px";

      //Populate only once
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
        // console.log("changed language to ", selectedLanguage)
        fetchAndProcessSubs(null, selectedLanguage);
      });
    }

    const textBackground = document.createElement("div");
    textBackground.id = "subtitle-background";
    const textContainer = document.createElement("div");
    textContainer.id = "subtitle-text";
    const textContainer2 = document.createElement("div");
    textContainer2.id = "subtitle-text-2";

    const resizeHandle = document.createElement("div");
    resizeHandle.id = "resize-handle";
    textBackground.appendChild(resizeHandle);
    enableResize(textBackground, resizeHandle);

    // here we need code to add the second subtitle box, and based on the result from fetch and process subs, we will set it to hidden or visible
    // need to add code for second subtitle here

    subtitleBox.appendChild(dragHandle);
    subtitleBox.appendChild(langSelect);
    subtitleBox.appendChild(textBackground);

    textBackground.appendChild(textContainer);
    textBackground.appendChild(textContainer2);

    document.body.appendChild(subtitleBox);
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

function enableResize(box, handle) {
  let isDragging = false;
  let isResizing = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  const baseWidth = 200;
  const baseFontSize = 16;

  box.style.width = `${baseWidth}px`;
  box.style.fontSize = `${baseFontSize}px`;

  // Dragging the box
  box.addEventListener("mousedown", (e) => {
    if (e.target === handle) return;
    isDragging = true;
    dragOffsetX = e.clientX - box.offsetLeft;
    dragOffsetY = e.clientY - box.offsetTop;
    box.style.cursor = "move";
  });

  // Resizing
  handle.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    isResizing = true;
    box.style.cursor = "se-resize";
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      box.style.left = `${e.clientX - dragOffsetX}px`;
      box.style.top = `${e.clientY - dragOffsetY}px`;
      box.style.cursor = "move";
    }

    if (isResizing) {
      const newWidth = Math.max(
        e.clientX - box.getBoundingClientRect().left,
        100
      );
      box.style.width = `${newWidth}px`;

      const scaleFactor = newWidth / baseWidth;
      const scaledFont = baseFontSize * scaleFactor;
      box.style.fontSize = `${scaledFont}px`;

      box.style.cursor = "se-resize";
    }
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
    isResizing = false;
    box.style.cursor = "text";
  });

  // Optional: when mouse re-enters the box, set it to text cursor
  box.addEventListener("mouseenter", () => {
    if (!isDragging && !isResizing) {
      box.style.cursor = "text";
    }
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
          // if (!subtitleData) {
          //   const langSelect = document.getElementById("language-select");
          //   const selectedLanguage = langSelect?.value || "en";
          //   fetchAndProcessSubs(() => {
          //     showSubtitles();
          //   }, selectedLanguage);
          // }
        } else {
          hideSubtitles();
        }
      }
    }
  });

  observer.observe(btn, { attributes: true });
};

checkAndObserve();

// needed to add this since subtitles would be on wrong language
// const observeForSubtitleButton = () => {
//   const observer = new MutationObserver(() => {
//     const btn = document.querySelector(".ytp-subtitles-button");
//     if (btn && !btn.hasAttribute("data-observed")) {
//       btn.setAttribute("data-observed", "true");
//       checkAndObserve();
//     }
//   });

//   observer.observe(document.body, {
//     childList: true,
//     subtree: true,
//   });
// };

// observeForSubtitleButton();


