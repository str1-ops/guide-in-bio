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
const prevButton = document.getElementById("page-prev");
const nextButton = document.getElementById("page-next");
const closeButton = document.getElementById("page-close");
const jumpForm = document.getElementById("page-jump");
const pageInput = document.getElementById("page-number");
let controlsOpen = false;
const CONTROL_HEIGHT = 80;
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const profiles = {
  beachie: { element: document.getElementById("beachie-profile"), path: "/beachcomber/the-beachie", page: 3, title: "The Beachie Bar & Bistro" },
  reptile: { element: document.getElementById("reptile-profile"), path: "/beachcomber/australian-reptile-park", page: 9, title: "Australian Reptile Park" }
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
  const availableHeight = Math.max(1, height - (controlsOpen && !activeProfile ? CONTROL_HEIGHT : 0));
  frameWidth = Math.min(width, availableHeight * ratio);
  frameHeight = frameWidth / ratio;
  root.classList.toggle("controls-open", controlsOpen && !activeProfile);
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
function setControls(open) {
  if (activeProfile || controlsOpen === open) return;
  controlsOpen = open;
  controls.hidden = !open;
  fit();
  mount();
}
closeButton.addEventListener("click", () => setControls(false));
prevButton.addEventListener("click", () => goToPage(current - 1));
nextButton.addEventListener("click", () => goToPage(current + 1));
jumpForm.addEventListener("submit", event => {
  event.preventDefault();
  const target = Number(pageInput.value);
  if (!Number.isInteger(target) || target < 1 || target > urls.length) {
    pageInput.setCustomValidity("Enter a page between 1 and " + urls.length);
    pageInput.reportValidity();
    return;
  }
  pageInput.setCustomValidity("");
  pageInput.blur();
  goToPage(target - 1);
});
pageInput.addEventListener("input", () => pageInput.setCustomValidity(""));
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
  controls.hidden = true;
  controlsOpen = false;
  activeProfile = name;
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
  Object.values(profiles).forEach(entry => { entry.element.hidden = true; });
  viewport.hidden = false;
  fit();
  if (updateHistory) history.pushState({ page: current + 1 }, "", "/beachcomber");
  document.title = "Beachcomber | Your Pocket Guide";
  mount();
}
document.querySelectorAll(".profile-back").forEach(button => button.addEventListener("click", () => closeProfile()));
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
  { page: 5, label: "Caves Coastal", xMm: 82.416, yMm: 119.639 },
  { page: 9, name: "reptile", label: "Australian Reptile Park", xMm: 82.588, yMm: 65.156 },
  { page: 9, label: "Broken Bay Pearl Farm", xMm: 82.588, yMm: 162.58 },
  { page: 10, label: "Chocolate Factory Gosford", xMm: 184.088, yMm: 65.156 },
  { page: 10, label: "Central Coast Aero Club", xMm: 184.088, yMm: 162.58 },
  { page: 11, label: "Glenworth Valley Horse Riding", xMm: 82.588, yMm: 65.156 },
  { page: 11, label: "Iris Lodge Alpacas", xMm: 82.588, yMm: 162.58 },
  { page: 12, label: "Treetops Adventure Park", xMm: 82.588, yMm: 65.156 },
  { page: 12, label: "8 at Trinity", xMm: 82.588, yMm: 162.58 }
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
