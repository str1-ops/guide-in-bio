/* A single printed-style guide with two states, and a full-page fade. */
(() => {
  "use strict";

  const root = document.documentElement;
  const shell = document.querySelector(".guide-shell");
  const page = document.querySelector(".guide-page");
  const photo = document.querySelector(".reptile-business .photo-wrap");
  const pearlPanel = document.getElementById("pearl-business");
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
  const MIN_READABLE_SCALE = 0.82;
  const isDirectProfile = () => /^\/beachcomber\/australian-reptile-park\/?$/.test(window.location.pathname);

  let fadeTimer = null;
  let fitFrame = null;
  let canFitViewport = false;

  function showView(expanded) {
    root.dataset.view = expanded ? "expanded" : "guide";
    pearlPanel.inert = expanded;
    expandedPanel.inert = !expanded;
    pearlPanel.setAttribute("aria-hidden", String(expanded));
    expandedPanel.setAttribute("aria-hidden", String(!expanded));
    learnButton.setAttribute("aria-expanded", String(expanded));
    document.title = expanded
      ? "Australian Reptile Park | Beachcomber Guide"
      : "Local Finds | Beachcomber Guide";
  }

  // Measure both versions of the same page. Switching data-view here is
  // synchronous: the browser cannot paint either temporary measurement.
  function measurePageHeights() {
    const originalView = root.dataset.view;
    root.dataset.view = "guide";
    const guideHeight = page.scrollHeight;
    root.dataset.view = "expanded";
    const expandedHeight = page.scrollHeight;
    root.dataset.view = originalView;
    return { guideHeight, expandedHeight };
  }

  function fitGuideToViewport() {
    const viewportHeight = Math.floor(
      window.visualViewport ? window.visualViewport.height : window.innerHeight
    );
    if (!viewportHeight) return;

    // Measure at natural size, then preserve the printed design's proportions
    // by uniformly scaling the page only when necessary. On shorter phones
    // we first trim a little photograph height to retain legible controls.
    shell.classList.remove("is-viewport-fitted");
    page.style.removeProperty("--fit-scale");
    page.style.removeProperty("--photo-height");

    // The weekly hours are additional content: allow scrolling when opened.
    // Temporarily collapse them for fitting, then restore the user's choice.
    const hoursWereOpen = hoursDetails.open;
    hoursDetails.open = false;
    const natural = measurePageHeights();
    const mostContent = Math.max(natural.guideHeight, natural.expandedHeight);

    if (window.innerWidth <= 610 && mostContent > viewportHeight) {
      const photoHeight = photo.getBoundingClientRect().height;
      const targetReduction = Math.min(
        photoHeight * 0.17,
        Math.max(0, (mostContent - viewportHeight) / 2)
      );
      page.style.setProperty(
        "--photo-height",
        Math.max(128, Math.round(photoHeight - targetReduction)) + "px"
      );
    }

    const fitted = measurePageHeights();
    const requiredHeight = Math.max(fitted.guideHeight, fitted.expandedHeight);
    const scale = Math.min(1, viewportHeight / Math.max(requiredHeight, 1));
    canFitViewport = scale >= MIN_READABLE_SCALE;

    if (canFitViewport) {
      page.style.setProperty("--fit-scale", String(scale));
      shell.style.setProperty("--viewport-height", viewportHeight + "px");
    } else {
      // Do not turn 44px controls into tiny tap targets on very short
      // screens or under large accessibility text settings.
      page.style.removeProperty("--fit-scale");
    }

    hoursDetails.open = hoursWereOpen;
    shell.classList.toggle("is-viewport-fitted", canFitViewport && !hoursWereOpen);
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
  hoursDetails.addEventListener("toggle", () => {
    // Opening all seven rows is an intentional scrollable exception.
    shell.classList.toggle("is-viewport-fitted", canFitViewport && !hoursDetails.open);
  });

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
