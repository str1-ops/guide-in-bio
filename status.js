/* A single printed-style guide with two states, and a full-page fade. */
(() => {
  "use strict";

  const root = document.documentElement;
  const shell = document.querySelector(".guide-shell");
  const page = document.querySelector(".guide-page");
  const photo = document.querySelector(".reptile-business .photo-wrap");
  const guideView = document.getElementById("guide-view");
  const expandedPanel = document.getElementById("reptile-expanded");
  const learnButton = document.getElementById("reptile-learn-more");
  const backButton = document.getElementById("back-to-guide");
  const hoursDetails = document.getElementById("opening-hours");
  const statusText = document.getElementById("status-text");
  const statusDot = document.querySelector(".status-dot");
  const dayRows = [...document.querySelectorAll("[data-day]")];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const GUIDE_PATH = "/beachcomber";
  const PROFILE_PATH = "/beachcomber/australian-reptile-park";
  const FADE_OUT_MS = 150;
  const isDirectProfile = () => /^\/beachcomber\/australian-reptile-park\/?$/.test(window.location.pathname);

  let fadeTimer = null;
  let fitFrame = null;

  function showView(expanded) {
    root.dataset.view = expanded ? "expanded" : "guide";
    guideView.inert = expanded;
    expandedPanel.inert = !expanded;
    guideView.setAttribute("aria-hidden", String(expanded));
    expandedPanel.setAttribute("aria-hidden", String(!expanded));
    learnButton.setAttribute("aria-expanded", String(expanded));
    document.title = expanded
      ? "Australian Reptile Park | Beachcomber Guide"
      : "Local Finds | Beachcomber Guide";
  }

  function fitGuideToViewport() {
    // visualViewport tracks the genuinely visible mobile area as the Safari
    // and Chrome address bars expand or collapse.
    const viewportHeight = Math.floor(
      window.visualViewport?.height || window.innerHeight
    );
    if (!viewportHeight) return;

    // Always measure without the previous transform or image crop. Keeping
    // the layout in natural flow lets wrapped copy influence the calculation.
    shell.classList.remove("is-viewport-fitted");
    page.style.removeProperty("--fit-scale");
    page.style.removeProperty("--photo-height");

    const isGuide = root.dataset.view === "guide";

    // The optional seven-day timetable can grow beyond the available height.
    // Preserve its readable rows and allow scrolling while it is opened.
    if (!isGuide && hoursDetails.open) return;

    const availableHeight = Math.max(1, viewportHeight - 2);

    if (isGuide) {
      const naturalHeight = page.scrollHeight;
      const overflow = Math.max(0, naturalHeight - availableHeight);

      if (overflow > 0 && window.innerWidth <= 610) {
        // First reduce the height of BOTH guide photos instead of shrinking
        // all the typography. Do not distort images: object-fit crops them.
        const currentPhotoHeight = photo.getBoundingClientRect().height;
        const minimumPhotoHeight = Math.min(112, currentPhotoHeight * 0.58);
        const cropPerPhoto = Math.min(
          overflow / 2,
          Math.max(0, currentPhotoHeight - minimumPhotoHeight)
        );
        if (cropPerPhoto > 0.5) {
          page.style.setProperty(
            "--photo-height",
            Math.round(currentPhotoHeight - cropPerPhoto) + "px"
          );
        }
      }
    }

    // Finally fit the complete page, including the last contact line and
    // safe-area padding. No minimum scale cutoff: even shorter displays
    // should never hide the second business below the fold.
    const measuredHeight = Math.max(page.scrollHeight, 1);
    const scale = Math.min(1, availableHeight / measuredHeight);
    page.style.setProperty("--fit-scale", String(scale));
    shell.style.setProperty("--viewport-height", viewportHeight + "px");
    shell.classList.add("is-viewport-fitted");
  }

  function scheduleFit() {
    if (fitFrame !== null) window.cancelAnimationFrame(fitFrame);
    fitFrame = window.requestAnimationFrame(() => {
      fitFrame = null;
      fitGuideToViewport();
    });
  }

  function commitView(expanded) {
    showView(expanded);
    if (!expanded) hoursDetails.open = false;
    fitGuideToViewport();
    // Returning from an expanded schedule must always reveal the top of the
    // guide, not retain a previous document scroll position.
    window.scrollTo(0, 0);
    if (expanded) {
      backButton.focus({ preventScroll: true });
    } else {
      learnButton.focus({ preventScroll: true });
    }
  }

  function changeView(expanded, updateHistory = true) {
    const currentlyExpanded = root.dataset.view === "expanded";
    if (fadeTimer !== null) {
      window.clearTimeout(fadeTimer);
      fadeTimer = null;
    }
    if (expanded === currentlyExpanded) {
      page.classList.remove("is-fading");
      return;
    }

    if (updateHistory) {
      window.history.pushState({ expanded }, "", expanded ? PROFILE_PATH : GUIDE_PATH);
    }

    if (reduceMotion.matches) {
      page.classList.remove("is-fading");
      commitView(expanded);
      return;
    }

    // No sliding or lower-panel crossfade. The ENTIRE page fades out, its
    // content switches while invisible, then the complete page fades in.
    page.classList.add("is-fading");
    fadeTimer = window.setTimeout(() => {
      fadeTimer = null;
      commitView(expanded);
      window.requestAnimationFrame(() => {
        page.classList.remove("is-fading");
      });
    }, FADE_OUT_MS);
  }

  showView(isDirectProfile());
  fitGuideToViewport();

  learnButton.addEventListener("click", () => changeView(true));
  backButton.addEventListener("click", () => changeView(false));

  window.addEventListener("popstate", () => {
    changeView(isDirectProfile(), false);
  });
  window.addEventListener("resize", scheduleFit);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", scheduleFit);
  }
  hoursDetails.addEventListener("toggle", scheduleFit);
  window.addEventListener("pageshow", scheduleFit);
  window.addEventListener("load", scheduleFit);
  if (document.fonts) document.fonts.ready.then(scheduleFit);

  const sydneyClock = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const sydneyWeekday = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    weekday: "long",
  });

  function updateOpeningStatus() {
    const now = new Date();
    const parts = Object.fromEntries(
      sydneyClock.formatToParts(now)
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, Number(part.value)])
    );

    const minutes = parts.hour * 60 + parts.minute;
    const isChristmas = parts.month === 12 && parts.day === 25;
    const isOpen = !isChristmas && minutes >= 9 * 60 && minutes < 17 * 60;

    if (isOpen) {
      statusText.textContent = "Open now · Closes 5:00pm";
    } else if (isChristmas) {
      statusText.textContent = "Closed for Christmas · Opens 9:00am tomorrow";
    } else if (minutes < 9 * 60) {
      statusText.textContent = "Closed · Opens 9:00am";
    } else if (parts.month === 12 && parts.day === 24) {
      statusText.textContent = "Closed · Opens 9:00am on 26 Dec";
    } else {
      statusText.textContent = "Closed · Opens 9:00am tomorrow";
    }

    statusDot.classList.toggle("is-closed", !isOpen);
    const today = sydneyWeekday.format(now);
    dayRows.forEach((row) => {
      row.classList.toggle("is-today", row.dataset.day === today);
    });
  }

  updateOpeningStatus();
  window.setInterval(updateOpeningStatus, 60 * 1000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) updateOpeningStatus();
  });
})();
