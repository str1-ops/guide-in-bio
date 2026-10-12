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
  frameWidth = Math.min(width, height * ratio);
  frameHeight = frameWidth / ratio;
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
  // Load one more image forward after the displayed images have been requested.
  const ahead = current + 2;
  if (ahead < urls.length) {
    const preload = () => { const img = new Image(); img.src = urls[ahead]; };
    if ("requestIdleCallback" in window) requestIdleCallback(preload, { timeout: 1500 });
    else setTimeout(preload, 200);
  }
}
function openProfile(name, updateHistory = true) {
  const data = profiles[name];
  if (!data) return;
  activeProfile = name;
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

// Separate transparent button layer, fixed to the displayed image, not the
// moving carousel. Page-relative percentages can be refined independently.
const hotspots = [
  { page: 3, name: "beachie", style: "left:71%;top:55%;width:28%;height:13%;" },
  { page: 9, name: "reptile", style: "left:65%;top:0%;width:35%;height:18%;" }
].map(config => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "pdf-hotspot viewport-hotspot";
  button.style.cssText = config.style;
  button.setAttribute("aria-label", "View " + profiles[config.name].title + " profile");
  button.addEventListener("pointerdown", event => event.stopPropagation());
  button.addEventListener("pointerup", event => event.stopPropagation());
  button.addEventListener("click", event => {
    event.stopPropagation();
    openProfile(config.name);
  });
  viewport.append(button);
  return { ...config, button };
});
function updateHotspots() {
  hotspots.forEach(({page, button}) => { button.hidden = activeProfile !== null || current !== page; });
}
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
  if (event.target.closest(".viewport-hotspot")) return;
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
  const elapsed = Math.max(1, performance.now() - pointer.started);
  pointer = null;
  if (Math.abs(dx) > Math.max(34, frameWidth * .2) || (Math.abs(dx) > 18 && Math.abs(dx / elapsed) > .55)) {
    slide(Math.max(0, Math.min(urls.length - 1, current + (dx < 0 ? 1 : -1))));
  } else slide(current);
});
viewport.addEventListener("pointercancel", () => { pointer = null; if (!animating) slide(current); });
window.addEventListener("keydown", event => {
  if (activeProfile || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
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
