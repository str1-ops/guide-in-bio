/* The printed guide is one unmodified, aspect-ratio locked image. */
(() => {
  "use strict";

  const root = document.documentElement;
  const page = document.querySelector(".guide-page");
  const guideView = document.getElementById("guide-view");
  const imageFrame = document.querySelector(".guide-visual");
  const profileView = document.getElementById("reptile-expanded");
  const learnButton = document.getElementById("reptile-learn-more");
  const backButton = document.getElementById("back-to-guide");
  const hoursDetails = document.getElementById("opening-hours");
  const statusText = document.getElementById("status-text");
  const statusDot = document.querySelector(".status-dot");
  const dayRows = [...document.querySelectorAll("[data-day]")];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const GUIDE_PATH = "/beachcomber";
  const PROFILE_PATH = "/beachcomber/australian-reptile-park";
  const IMAGE_RATIO = 610 / 1118;
  const FADE_OUT_MS = 150;
  const isDirectProfile = () => /^\/beachcomber\/australian-reptile-park\/?$/.test(window.location.pathname);

  let fadeTimer = null;
  let resizeFrame = null;

  function showView(expanded) {
    root.dataset.view = expanded ? "expanded" : "guide";
    guideView.inert = expanded;
    profileView.inert = !expanded;
    guideView.setAttribute("aria-hidden", String(expanded));
    profileView.setAttribute("aria-hidden", String(!expanded));
    learnButton.setAttribute("aria-expanded", String(expanded));
    document.title = expanded
      ? "Australian Reptile Park | Beachcomber Guide"
      : "Local Finds | Beachcomber Guide";
  }

  function fitGuideImage() {
    if (root.dataset.view !== "guide") return;

    const styles = getComputedStyle(guideView);
    const availableWidth = guideView.clientWidth
      - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
    const visibleHeight = Math.min(
      guideView.clientHeight,
      window.visualViewport?.height || guideView.clientHeight
    );
    const availableHeight = visibleHeight
      - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom);
    const width = Math.max(1, Math.floor(Math.min(
      610, availableWidth, availableHeight * IMAGE_RATIO
    )));

    // Only the surrounding cream space changes. Image contents never reflow,
    // stretch or crop, and both buttons remain anchored to image coordinates.
    imageFrame.style.width = width + "px";
  }

  function scheduleFit() {
    if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = null;
      fitGuideImage();
    });
  }

  function commitView(expanded) {
    showView(expanded);
    if (!expanded) hoursDetails.open = false;
    window.scrollTo(0, 0);
    fitGuideImage();
    (expanded ? backButton : learnButton).focus({ preventScroll: true });
  }

  function changeView(expanded, updateHistory = true) {
    if (fadeTimer !== null) {
      clearTimeout(fadeTimer);
      fadeTimer = null;
    }
    if (expanded === (root.dataset.view === "expanded")) {
      page.classList.remove("is-fading");
      return;
    }
    if (updateHistory) {
      history.pushState({ expanded }, "", expanded ? PROFILE_PATH : GUIDE_PATH);
    }

    if (reduceMotion.matches) {
      page.classList.remove("is-fading");
      commitView(expanded);
      return;
    }

    page.classList.add("is-fading");
    fadeTimer = setTimeout(() => {
      fadeTimer = null;
      commitView(expanded);
      requestAnimationFrame(() => page.classList.remove("is-fading"));
    }, FADE_OUT_MS);
  }

  showView(isDirectProfile());
  fitGuideImage();

  learnButton.addEventListener("click", () => changeView(true));
  backButton.addEventListener("click", () => changeView(false));

  window.addEventListener("popstate", () => changeView(isDirectProfile(), false));
  window.addEventListener("resize", scheduleFit);
  window.addEventListener("pageshow", scheduleFit);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", scheduleFit);
  }

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
