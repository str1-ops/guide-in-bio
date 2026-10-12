const files = [
  "Cover.png",
  ...Array.from({ length: 14 }, (_, i) => `Page-${i + 1}.png`),
  "Back Cover.png"
];
const urls = files.map(file => "/assets/" + encodeURIComponent(file));
const root = document.getElementById("publication");
const viewport = document.getElementById("viewport");
const track = document.getElementById("track");
const announcer = document.getElementById("announcer");
const controls = document.getElementById("page-controls");
const profileControls = document.getElementById("profile-controls");
const profileControlsBack = document.getElementById("profile-controls-back");
const prevButton = document.getElementById("page-prev");
const nextButton = document.getElementById("page-next");
const jumpForm = document.getElementById("page-jump");
const pageInput = document.getElementById("page-number");
let controlsOpen = false;
const CONTROL_HEIGHT = 80;
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
// Reusable, researched profiles inserted beside the existing profile sections.
// Construct the additional business pages before resolving their profile nodes.
const socialSvgs = {
  Instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5"/><circle cx="12" cy="12" r="4.25"/><circle cx="17.7" cy="6.6" r="1" fill="currentColor" stroke="none"/></svg>',
  Facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.1 0 2.25.2 2.25.2v2.46H15.2c-1.25 0-1.64.77-1.64 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" fill="currentColor"/></svg>'
};
const additionalBusinesses = [
  ["caves", "Caves Coastal Bar & Bungalows", "caves-logo.png",
    [["Book a Stay","https://cavescoastal.com.au/stay/"],["Accommodation","https://cavescoastal.com.au/stay/"],["Special Offers","https://cavescoastal.com.au/offers/"],["Directions","https://www.google.com/maps/search/?api=1&query=Caves+Coastal+Caves+Beach"]], []],
  ["pearl", "Broken Bay Pearl Farm", "pearl-logo.png",
    [["Book a Tour","https://brokenbaypearlfarm.com.au/our-tours/"],["Tour Experiences","https://brokenbaypearlfarm.com.au/our-tours/"],["Website","https://brokenbaypearlfarm.com.au/"],["Directions","https://www.google.com/maps/search/?api=1&query=Broken+Bay+Pearl+Farm+Mooney+Mooney"]],
    [["Instagram","https://www.instagram.com/brokenbaypearlfarm/"]]],
  ["chocolate", "Chocolate Factory Gosford", "chocolate-logo.png",
    [["Factory Tours","https://chocolatefactorygosford.com.au/chocolate-factory-tours/"],["Chocolate Shop","https://chocolatefactorygosford.com.au/"],["Website","https://chocolatefactorygosford.com.au/"],["Directions","https://www.google.com/maps/search/?api=1&query=6+Jusfrute+Drive+West+Gosford+NSW"]],
    [["Instagram","https://www.instagram.com/chocolatefactorygosford/"],["Facebook","https://www.facebook.com/chocolatefactorygosford"]]],
  ["aero", "Central Coast Aero Club", "aero-logo.png",
    [["Scenic Flights","https://ccac.com.au/joy-flights-and-experiences/"],["Trial Flights","https://ccac.com.au/"],["Website","https://ccac.com.au/"],["Directions","https://www.google.com/maps/search/?api=1&query=Central+Coast+Aero+Club+Warnervale+Airport"]], []],
  ["glenworth", "Glenworth Valley", "glenworth-logo.png",
    [["Horse Riding","https://glenworth.com.au/"],["Other Adventures","https://glenworth.com.au/"],["Website","https://glenworth.com.au/"],["Directions","https://www.google.com/maps/search/?api=1&query=69+Cooks+Road+Glenworth+Valley+NSW"]],
    [["Instagram","https://www.instagram.com/glenworth_valley/"]]],
  ["iris", "Iris Lodge Alpacas", "iris-logo.png",
    [["Book Experience","https://www.irislodgealpacas.com/"],["Meet & Greet","https://www.irislodgealpacas.com/alpaca-meet-and-greet"],["Website","https://www.irislodgealpacas.com/"],["Directions","https://www.google.com/maps/search/?api=1&query=33+Dunks+Lane+Jilliby+NSW"]],
    [["Instagram","https://www.instagram.com/irislodgealpacas/"]]],
  ["treetops", "Treetops Adventure", "treetops-logo.png",
    [["Book Adventure","https://treetopsadventure.com.au/location/nsw-central-coast/"],["Tree Ropes","https://treetopsadventure.com.au/location/nsw-central-coast/"],["Park Information","https://treetopsadventure.com.au/location/nsw-central-coast/"],["Directions","https://www.google.com/maps/search/?api=1&query=Treetops+Adventure+Ourimbah"]], []],
  ["trinity", "8 at Trinity", "trinity-logo.png",
    [["Book a Table","https://8attrinitypoint.com.au/book/"],["Food Menu","https://8attrinitypoint.com.au/menus/lunch-dinner/"],["Drinks Menu","https://8attrinitypoint.com.au/menus/"],["Directions","https://www.google.com/maps/search/?api=1&query=81+Trinity+Point+Drive+Morisset+Park+NSW"]], []]
];
for (const [key, title, logo, actions, socials] of additionalBusinesses) {
  const section = document.createElement("section");
  section.id = key + "-profile";
  section.className = "profile";
  section.hidden = true;
  section.setAttribute("aria-label", title + " profile");
  section.innerHTML = '<div class="profile-paper"><button type="button" class="profile-back" aria-label="Back to the Beachcomber Guide"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18 9 12l6-6"/></svg><span class="profile-back-label">The Beachcomber Guide</span></button><div class="profile-content"><div class="business-logo-frame"><img class="business-logo" decoding="async"></div><h1></h1><nav class="profile-actions"></nav><div class="profile-socials"></div></div></div>';
  section.querySelector("img").src = "/assets/" + logo;
  section.querySelector("img").alt = title + " logo";
  section.querySelector("h1").textContent = title;
  const navigation = section.querySelector(".profile-actions");
  navigation.setAttribute("aria-label", title + " links");
  for (const [i, [label, url]] of actions.entries()) {
    const a = document.createElement("a");
    a.className = ["action-food","action-drinks","action-bookings","action-room"][i];
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = label;
    navigation.append(a);
  }
  const socialRow = section.querySelector(".profile-socials");
  for (const [network,url] of socials) {
    const a = document.createElement("a");
    a.className = "social-icon";
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.setAttribute("aria-label",network);
    a.innerHTML = socialSvgs[network];
    socialRow.append(a);
  }
  root.insertBefore(section, announcer);
}

const profiles = {
  beachie: { element: document.getElementById("beachie-profile"), path: "/beachcomber/the-beachie", page: 3, title: "The Beachie Bar & Bistro" },
  reptile: { element: document.getElementById("reptile-profile"), path: "/beachcomber/australian-reptile-park", page: 9, title: "Australian Reptile Park" },
  caves: { element: document.getElementById("caves-profile"), path: "/beachcomber/caves-coastal", page: 5, title: "Caves Coastal Bar & Bungalows" },
  pearl: { element: document.getElementById("pearl-profile"), path: "/beachcomber/broken-bay-pearl-farm", page: 9, title: "Broken Bay Pearl Farm" },
  chocolate: { element: document.getElementById("chocolate-profile"), path: "/beachcomber/chocolate-factory", page: 10, title: "Chocolate Factory Gosford" },
  aero: { element: document.getElementById("aero-profile"), path: "/beachcomber/central-coast-aero-club", page: 10, title: "Central Coast Aero Club" },
  glenworth: { element: document.getElementById("glenworth-profile"), path: "/beachcomber/glenworth-valley", page: 11, title: "Glenworth Valley" },
  iris: { element: document.getElementById("iris-profile"), path: "/beachcomber/iris-lodge-alpacas", page: 11, title: "Iris Lodge Alpacas" },
  treetops: { element: document.getElementById("treetops-profile"), path: "/beachcomber/treetops-adventure", page: 12, title: "Treetops Adventure" },
  trinity: { element: document.getElementById("trinity-profile"), path: "/beachcomber/8-at-trinity", page: 12, title: "8 at Trinity" }
};
const sheets = new Map();
// Preserve the established digital guide page aspect ratio across every image.
const ratio = 101.5 / 195;
let current = 0, activeProfile = null;
let frameWidth = 0, frameHeight = 0, pointer = null, animating = false, resizeFrame = 0, wheelAt = 0;

function fit() {
  const view = window.visualViewport;
  const width = view?.width || innerWidth;
  const height = view?.height || innerHeight;
  const availableHeight = Math.max(1, height - (controlsOpen ? CONTROL_HEIGHT : 0));
  frameWidth = Math.min(width, availableHeight * ratio);
  frameHeight = frameWidth / ratio;
  root.classList.toggle("controls-open", controlsOpen);
  root.style.width = width + "px";
  root.style.height = height + "px";
  root.style.left = (view?.offsetLeft || 0) + "px";
  root.style.top = (view?.offsetTop || 0) + "px";
  root.style.setProperty("--page-width", frameWidth + "px");
  root.style.setProperty("--page-height", frameHeight + "px");
  viewport.style.setProperty("--page-width", frameWidth + "px");
  viewport.style.setProperty("--page-height", frameHeight + "px");
}
function makeSheet(index) {
  if (sheets.has(index)) return sheets.get(index);
  const element = document.createElement("div");
  element.className = "sheet";
  const img = document.createElement("img");
  img.className = "guide-image";
  img.src = urls[index];
  img.alt = "Beachcomber guide, page " + (index + 1);
  img.draggable = false;
  img.decoding = "async";
  img.loading = index <= 1 ? "eager" : "lazy";
  if (index === 0) img.fetchPriority = "high";
  element.append(img);
  attachPageButtons(index, element);
  sheets.set(index, element);
  return element;
}
function mount() {
  const nearby = new Set([current - 1, current, current + 1].filter(i => i >= 0 && i < urls.length));
  for (const [i, el] of sheets) {
    if (!nearby.has(i)) el.remove();
  }
  for (const i of nearby) {
    const el = makeSheet(i);
    el.style.left = ((i - current) * frameWidth) + "px";
    if (el.parentElement !== track) track.append(el);
  }
  track.style.transition = "none";
  track.style.transform = "translate3d(0,0,0)";
  updateHotspots();
  announcer.textContent = "Page " + (current + 1) + " of " + urls.length;
  pageInput.value = current + 1;
  prevButton.disabled = current === 0;
  nextButton.disabled = current === urls.length - 1;
  // Load one more image forward after the displayed images have been requested.
  const ahead = current + 2;
  if (ahead < urls.length) {
    const preload = () => { const img = new Image(); img.src = urls[ahead]; };
    if ("requestIdleCallback" in window) requestIdleCallback(preload, { timeout: 1500 });
    else setTimeout(preload, 200);
  }
}
function syncControls() {
  controls.hidden = !controlsOpen || Boolean(activeProfile);
  profileControls.hidden = !controlsOpen || !activeProfile;
}
function setControls(open) {
  if (controlsOpen === open) return;
  controlsOpen = open;
  syncControls();
  fit();
  mount();
}
profileControlsBack.addEventListener("click", () => closeProfile());
prevButton.addEventListener("click", () => goToPage(current - 1));
nextButton.addEventListener("click", () => goToPage(current + 1));
// Keep a brief delay for single digits so typing "12" doesn't jump to page 1.
let pageEntryTimer = null;
function commitPageEntry() {
  clearTimeout(pageEntryTimer);
  pageEntryTimer = null;
  const raw = pageInput.value.trim();
  const value = Number(raw);
  if (/^\d{1,2}$/.test(raw) && Number.isInteger(value) && value >= 1 && value <= urls.length) {
    goToPage(value - 1);
    pageInput.blur();
  } else {
    pageInput.value = String(current + 1);
  }
}
pageInput.addEventListener("focus", () => {
  clearTimeout(pageEntryTimer);
  requestAnimationFrame(() => pageInput.select());
});
pageInput.addEventListener("click", () => pageInput.select());
pageInput.addEventListener("input", () => {
  clearTimeout(pageEntryTimer);
  const value = pageInput.value.replace(/\D/g, "").slice(0, 2);
  pageInput.value = value;
  if (!value) return;
  // Two digits are a completed page number; single digits may lead to 10-16.
  if (value.length === 2) commitPageEntry();
  else pageEntryTimer = setTimeout(commitPageEntry, 650);
});
pageInput.addEventListener("blur", () => {
  if (pageEntryTimer !== null) commitPageEntry();
});
jumpForm.addEventListener("submit", event => {
  event.preventDefault();
  commitPageEntry();
});
function goToPage(index) {
  if (activeProfile || !Number.isInteger(index) || index < 0 || index >= urls.length) return;
  // Jump directly, without animating through intervening pages.
  animating = false;
  pointer = null;
  current = index;
  mount();
}
function openProfile(name, updateHistory = true) {
  const data = profiles[name];
  if (!data) return;
  activeProfile = name;
  syncControls();
  fit();
  Object.values(profiles).forEach(entry => { entry.element.hidden = entry !== data; });
  viewport.hidden = true;
  if (updateHistory) history.pushState({ profile: name }, "", data.path);
  document.title = data.title + " | Beachcomber Guide";
  updateHotspots();
  data.element.querySelector(".profile-back").focus({ preventScroll: true });
}
function closeProfile(updateHistory = true) {
  if (!activeProfile) return;
  current = profiles[activeProfile].page;
  activeProfile = null;
  syncControls();
  Object.values(profiles).forEach(entry => { entry.element.hidden = true; });
  viewport.hidden = false;
  fit();
  if (updateHistory) history.pushState({ page: current + 1 }, "", "/beachcomber");
  document.title = "Beachcomber | Your Pocket Guide";
  mount();
}
document.querySelectorAll(".profile-back").forEach(button => button.addEventListener("click", () => closeProfile()));
// Vertical gesture on a business profile uses the same controls as the guide.
for (const profile of Object.values(profiles)) {
  let gesture = null;
  profile.element.addEventListener("pointerdown", event => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.target.closest("button, a, input, nav")) return;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  profile.element.addEventListener("pointerup", event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    gesture = null;
    if (Math.abs(dy) > 45 && Math.abs(dy) > Math.abs(dx) * 1.2) setControls(dy < 0);
  });
  profile.element.addEventListener("pointercancel", () => { gesture = null; });
}
window.addEventListener("popstate", () => {
  const match = Object.entries(profiles).find(([, data]) => data.path === location.pathname.replace(/\/$/, ""));
  if (match) openProfile(match[0], false);
  else closeProfile(false);
});

// InDesign measurements: 101.5 x 195 mm per page; right-facing spread
// coordinates begin at X=101.5 mm. Values refer to the pill group's centre.
// A shared 4 mm visual X calibration matches the exported page artwork in the
// supplied InDesign screenshots; change only X_CALIBRATION_MM if exports move.
const PAGE_W_MM = 101.5;
const PAGE_H_MM = 195;
const PILL_W_MM = 20;
const PILL_H_MM = 8.49;
const X_CALIBRATION_MM = 4;
// Nudge local business listing pills upward without affecting hotel pages.
const BUSINESS_PILL_Y_OFFSET_MM = -1;
const buttonSpecs = [
  { page: 3, name: "beachie", label: "The Beachie", xMm: 82.617, yMm: 121.334 },
  { page: 5, name: "caves", label: "Caves Coastal", xMm: 82.416, yMm: 119.639 },
  { page: 9, name: "reptile", label: "Australian Reptile Park", xMm: 82.588, yMm: 65.156 },
  { page: 9, name: "pearl", label: "Broken Bay Pearl Farm", xMm: 82.588, yMm: 162.58 },
  { page: 10, name: "chocolate", label: "Chocolate Factory Gosford", xMm: 184.088, yMm: 65.156 },
  { page: 10, name: "aero", label: "Central Coast Aero Club", xMm: 184.088, yMm: 162.58 },
  { page: 11, name: "glenworth", label: "Glenworth Valley Horse Riding", xMm: 82.588, yMm: 65.156 },
  { page: 11, name: "iris", label: "Iris Lodge Alpacas", xMm: 82.588, yMm: 162.58 },
  { page: 12, name: "treetops", label: "Treetops Adventure Park", xMm: 82.588, yMm: 65.156 },
  { page: 12, name: "trinity", label: "8 at Trinity", xMm: 82.588, yMm: 162.58 }
];
function attachPageButtons(index, sheet) {
  for (const spec of buttonSpecs.filter(item => item.page === index)) {
    const localX = spec.xMm - (spec.xMm >= PAGE_W_MM ? PAGE_W_MM : 0);
    const centerX = localX + X_CALIBRATION_MM;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "guide-view-pill";
    button.style.left = (((centerX - PILL_W_MM / 2) / PAGE_W_MM) * 100) + "%";
    button.style.top = (((spec.yMm + (spec.page >= 9 && spec.page <= 12 ? BUSINESS_PILL_Y_OFFSET_MM : 0) - PILL_H_MM / 2) / PAGE_H_MM) * 100) + "%";
    button.style.width = (PILL_W_MM / PAGE_W_MM * 100) + "%";
    button.style.height = (PILL_H_MM / PAGE_H_MM * 100) + "%";
    button.textContent = "View ›";
    button.setAttribute("aria-label", spec.name ? "View " + spec.label : spec.label + " profile coming soon");
    if (spec.name) {
      button.addEventListener("click", event => { event.stopPropagation(); openProfile(spec.name); });
    } else {
      button.disabled = true;
      button.title = spec.label + " profile coming soon";
    }
    button.addEventListener("pointerdown", event => event.stopPropagation());
    button.addEventListener("pointerup", event => event.stopPropagation());
    sheet.append(button);
  }
}
function updateHotspots() { /* Buttons now travel with each page's artwork. */ }
function endAnimation(next) {
  current = next;
  animating = false;
  mount();
}
function slide(next, offset = 0) {
  if (animating || next < 0 || next >= urls.length) return;
  animating = true;
  if (next !== current) makeSheet(next);
  const target = next === current ? 0 : Math.sign(current - next) * frameWidth;
  track.style.transition = reduced.matches ? "none" : "transform 280ms cubic-bezier(.2,.78,.24,1)";
  track.style.transform = "translate3d(" + target + "px,0,0)";
  if (reduced.matches) { endAnimation(next); return; }
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    track.removeEventListener("transitionend", finish);
    endAnimation(next);
  };
  track.addEventListener("transitionend", finish);
  setTimeout(finish, 350);
}
viewport.addEventListener("pointerdown", event => {
  if (activeProfile || animating || pointer || (event.pointerType === "mouse" && event.button !== 0)) return;
  if (event.target.closest(".guide-view-pill")) return;
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, started: performance.now() };
  viewport.setPointerCapture(event.pointerId);
});
viewport.addEventListener("pointermove", event => {
  if (!pointer || event.pointerId !== pointer.id) return;
  let dx = event.clientX - pointer.x;
  if (current === 0) dx = Math.min(0, dx);
  if (current === urls.length - 1) dx = Math.max(0, dx);
  track.style.transition = "none";
  track.style.transform = "translate3d(" + dx + "px,0,0)";
});
viewport.addEventListener("pointerup", event => {
  if (!pointer || event.pointerId !== pointer.id) return;
  const dx = event.clientX - pointer.x;
  const dy = event.clientY - pointer.y;
  const elapsed = Math.max(1, performance.now() - pointer.started);
  pointer = null;
  if (Math.abs(dy) > 45 && Math.abs(dy) > Math.abs(dx) * 1.2) {
    track.style.transition = "none";
    track.style.transform = "translate3d(0,0,0)";
    setControls(dy < 0);
    return;
  }
  if (Math.abs(dx) > Math.max(34, frameWidth * .2) || (Math.abs(dx) > 18 && Math.abs(dx / elapsed) > .55)) {
    slide(Math.max(0, Math.min(urls.length - 1, current + (dx < 0 ? 1 : -1))));
  } else slide(current);
});
viewport.addEventListener("pointercancel", () => { pointer = null; if (!animating) slide(current); });
window.addEventListener("keydown", event => {
  if (activeProfile || document.activeElement === pageInput || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  event.preventDefault();
  if (!animating) slide(Math.max(0, Math.min(urls.length - 1, current + (event.key === "ArrowRight" ? 1 : -1))));
});
viewport.addEventListener("wheel", event => {
  if (activeProfile || Math.abs(event.deltaX) <= Math.abs(event.deltaY) || Math.abs(event.deltaX) < 12) return;
  event.preventDefault();
  if (performance.now() - wheelAt < 500 || animating) return;
  wheelAt = performance.now();
  slide(Math.max(0, Math.min(urls.length - 1, current + (event.deltaX > 0 ? 1 : -1))));
}, { passive: false });
function resize() {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    if (pointer || animating) return;
    fit();
    mount();
  });
}
addEventListener("resize", resize);
visualViewport?.addEventListener("resize", resize);
visualViewport?.addEventListener("scroll", resize);
document.addEventListener("touchmove", event => { if (event.cancelable) event.preventDefault(); }, { passive: false });
fit();
mount();
const initial = Object.entries(profiles).find(([, data]) => data.path === location.pathname.replace(/\/$/, ""));
if (initial) { current = initial[1].page; mount(); openProfile(initial[0], false); }
