/* One guide page, two views. No API, framework, database or business CMS. */
(() => {
  "use strict";

  const root = document.documentElement;
  const stage = document.getElementById("content-stage");
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
  const isDirectProfile = () => /^\/beachcomber\/australian-reptile-park\/?$/.test(window.location.pathname);
  let heightTimer;

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

  function changeView(expanded, updateHistory = true) {
    const currentlyExpanded = root.dataset.view === "expanded";
    if (expanded === currentlyExpanded) return;

    window.clearTimeout(heightTimer);

    // Hold the existing height before switching panels, then ease into the
    // natural height of the next view without moving the first business.
    const oldHeight = stage.getBoundingClientRect().height;
    stage.style.height = oldHeight + "px";
    showView(expanded);

    const nextPanel = expanded ? expandedPanel : pearlPanel;
    const nextHeight = nextPanel.getBoundingClientRect().height;

    if (updateHistory) {
      window.history.pushState({ expanded }, "", expanded ? PROFILE_PATH : GUIDE_PATH);
    }

    if (reduceMotion.matches) {
      stage.style.height = "";
    } else {
      // Start the transition from the explicit previous height.
      stage.getBoundingClientRect();
      window.requestAnimationFrame(() => {
        stage.style.height = nextHeight + "px";
      });
      heightTimer = window.setTimeout(() => {
        stage.style.height = "";
      }, 330);
    }

    if (expanded) {
      backButton.focus({ preventScroll: true });
    } else {
      hoursDetails.open = false;
      learnButton.focus({ preventScroll: true });
    }
  }

  showView(isDirectProfile());

  learnButton.addEventListener("click", () => changeView(true));
  backButton.addEventListener("click", () => changeView(false));

  window.addEventListener("popstate", () => {
    const expanded = isDirectProfile();
    if (expanded === (root.dataset.view === "expanded")) return;
    changeView(expanded, false);
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
