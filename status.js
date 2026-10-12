/* Opening hours are intentionally hardcoded for this single business prototype. */
(function () {
  "use strict";

  const statusText = document.getElementById("status-text");
  const statusDot = document.querySelector(".status-dot");

  if (!statusText || !statusDot) return;

  const sydneyClock = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  function updateOpeningStatus() {
    const parts = Object.fromEntries(
      sydneyClock.formatToParts(new Date())
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, Number(part.value)])
    );

    const minutes = parts.hour * 60 + parts.minute;
    const christmasDay = parts.month === 12 && parts.day === 25;
    const open = !christmasDay && minutes >= 9 * 60 && minutes < 17 * 60;

    let label;
    if (open) {
      label = "Open now · Closes 5:00pm";
    } else if (christmasDay) {
      label = "Closed for Christmas · Opens 9:00am tomorrow";
    } else if (minutes < 9 * 60) {
      label = "Closed · Opens 9:00am";
    } else if (parts.month === 12 && parts.day === 24) {
      label = "Closed · Opens 9:00am on 26 Dec";
    } else {
      label = "Closed · Opens 9:00am tomorrow";
    }

    statusText.textContent = label;
    statusDot.classList.toggle("is-closed", !open);
  }

  updateOpeningStatus();
  window.setInterval(updateOpeningStatus, 60 * 1000);
})();
