async function fetchCaptions(videoId, lang = "en") {
  const res = await fetch(
    `https://video.google.com/timedtext?lang=${lang}&v=${videoId}`
  );
  const xml = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  return [...doc.getElementsByTagName("text")].map((el) => ({
    start: parseFloat(el.getAttribute("start")),
    dur: parseFloat(el.getAttribute("dur")),
    text: el.textContent,
  }));
}

function createCustomSubtitleOverlay() {
  if (document.getElementById("custom-sub-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "custom-sub-overlay";
  overlay.className = "subtitle-overlay";
  overlay.textContent = "replacement subs";
  document.body.appendChild(overlay);
}

function hideYouTubeCaptions() {
  const captionContainer = document.querySelector(
    ".ytp-caption-window-container"
  );
  if (captionContainer) {
    captionContainer.style.display = "none";
  }
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
            hideYouTubeCaptions();
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

// function setupSubtitleButtonOverride() {
//   const observer = new MutationObserver(() => {
//     const button = document.querySelector(".ytp-subtitles-button");
//     if (button) {
//       observer.disconnect();
//       button.addEventListener(
//         "click",
//         (e) => {
//           e.stopPropagation();
//           hideYouTubeCaptions();
//           createCustomSubtitleOverlay();
//         },
//         { once: true }
//       ); // Attach once to simulate your test goal
//     }
//   });

//   observer.observe(document.body, { childList: true, subtree: true });
// }

function syncSubtitles(primary, secondary) {
  const video = document.querySelector("video");
  const primaryEl = document.getElementById("primary-subtitle");
  const secondaryEl = document.getElementById("secondary-subtitle");

  setInterval(() => {
    const t = video.currentTime;
    const p = primary.find(
      (line) => t >= line.start && t <= line.start + line.dur
    );
    const s = secondary.find(
      (line) => t >= line.start && t <= line.start + line.dur
    );
    if (p) primaryEl.innerText = p.text;
    else primaryEl.innerText = "";
    if (s) secondaryEl.innerText = s.text;
    else secondaryEl.innerText = "";
  }, 200);

  document
    .getElementById("dual-subtitle-overlay")
    .addEventListener("mouseup", () => {
      const sel = window.getSelection();
      if (sel && sel.toString().length > 0) {
        document.execCommand("copy");
      }
    });
}

async function startDualSub() {
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get("v");
  console.log(videoId);
  setupSubtitleButtonObserver();

  //   setupSubtitleButtonOverride();
  //   if (!videoId) return;

  //   const [primarySubs, secondarySubs] = await Promise.all([
  //     fetchCaptions(videoId, "zh-Hans"),
  //     fetchCaptions(videoId, "en"),
  //   ]);

  //   createOverlay();
  //   syncSubtitles(primarySubs, secondarySubs);
}

startDualSub();
