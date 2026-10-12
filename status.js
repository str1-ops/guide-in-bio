import * as pdfjs from "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.4.299/build/pdf.min.mjs";

pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.4.299/build/pdf.worker.min.mjs";

const PDF_URL = "/Beachcomber-Digital-Guide-2.pdf";
const root = document.getElementById("publication");
const viewport = document.getElementById("viewport");
const track = document.getElementById("track");
const announcer = document.getElementById("announcer");
const profiles = {
  beachie: { element: document.getElementById("beachie-profile"), path: "/beachcomber/the-beachie", page: 3, title: "The Beachie Bar & Bistro" },
  reptile: { element: document.getElementById("reptile-profile"), path: "/beachcomber/australian-reptile-park", page: 9, title: "Australian Reptile Park" }
};
let activeProfile = null;
let profileOpen = false;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const cache = new Map();
const MAX_CACHE = 7;
const renderQueue = [];
let queuedWorker = false;
let documentPdf, pageCount = 0, pageRatio = 101.5 / 195, current = 0;
let frameWidth = 0, frameHeight = 0, renderGeneration = 0, activeAnimation = false;
let pointer = null, resizeTicket = 0, wheelTime = 0;

function announce() { announcer.textContent = `Page ${current + 1} of ${pageCount}`; }
function sizing() {
  const size = window.visualViewport;
  const width = size?.width || window.innerWidth;
  const height = size?.height || window.innerHeight;
  // Ignore temporary pinch-zoom scaling; the guide follows the visible area.
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  frameWidth = Math.min(safeWidth, safeHeight * pageRatio);
  frameHeight = frameWidth / pageRatio;
  viewport.style.setProperty("--page-width", `${frameWidth}px`);
  viewport.style.setProperty("--page-height", `${frameHeight}px`);
  // The independent business profile must receive the same fitted dimensions.
  root.style.setProperty("--page-width", `${frameWidth}px`);
  root.style.setProperty("--page-height", `${frameHeight}px`);
  // Fixed layout follows iOS's visible viewport while the browser toolbar moves.
  root.style.width = `${safeWidth}px`;
  root.style.height = `${safeHeight}px`;
  root.style.left = `${size?.offsetLeft || 0}px`;
  root.style.top = `${size?.offsetTop || 0}px`;
}
function sheetFor(index) {
  let entry = cache.get(index);
  if (!entry) {
    const element = document.createElement("div");
    element.className = "sheet";
    const canvas = document.createElement("canvas");
    element.append(canvas);
    // Approximate the printed "View >" pill on PDF page 4.
    // Coordinates are percentages of the page; nothing is added to the PDF.
    if (index === 3 || index === 9) {
      const hotspot = document.createElement("button");
      hotspot.type = "button";
      hotspot.className = "pdf-hotspot";
      hotspot.setAttribute("aria-label", index === 3 ? "View The Beachie Bar and Bistro profile" : "View Australian Reptile Park profile");
      // Page 10 contains two listings; target only the upper View pill.
      hotspot.style.cssText = index === 3 ? "left:74%;top:58.8%;width:22%;height:6%;" : "left:73%;top:3%;width:24%;height:9%;";
      hotspot.addEventListener("pointerdown", event => event.stopPropagation());
      hotspot.addEventListener("click", event => { event.stopPropagation(); openProfile(index === 3 ? "beachie" : "reptile"); });
      element.append(hotspot);
    }
    entry = { element, canvas, ready: false, promise: null, generation: -1 };
    cache.set(index, entry);
  }
  // Map insertion order represents most recent access.
  cache.delete(index); cache.set(index, entry);
  return entry;
}
async function render(index) {
  if (!documentPdf || index < 0 || index >= pageCount) return;
  const entry = sheetFor(index);
  const generation = renderGeneration;
  if (entry.ready && entry.generation === generation) return;
  if (entry.promise && entry.generation === generation) return entry.promise;
  entry.generation = generation;
  const task = (async () => {
    const page = await documentPdf.getPage(index + 1);
    if (entry.generation !== generation) return;
    const original = page.getViewport({ scale: 1 });
    const dpr = Math.min(devicePixelRatio || 1, 2.5);
    const desired = Math.min(frameWidth / original.width * dpr, frameHeight / original.height * dpr);
    const maxPixels = 6000000;
    const pixelScale = Math.min(desired, Math.sqrt(maxPixels / (original.width * original.height)));
    const actual = page.getViewport({ scale: Math.max(0.01, pixelScale) });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(actual.width));
    canvas.height = Math.max(1, Math.round(actual.height));
    // Preserve an alpha-capable destination while PDF.js composites soft masks and
    // transparency groups. Keep the normal opaque PDF page background white.
    const context = canvas.getContext("2d", { alpha: true });
    await page.render({ canvasContext: context, viewport: actual, background: "rgb(255,255,255)" }).promise;
    if (entry.generation !== generation) { canvas.width = canvas.height = 0; return; }
    entry.canvas.replaceWith(canvas);
    entry.canvas.width = entry.canvas.height = 0;
    entry.canvas = canvas;
    entry.ready = true;
    // Leave page resources available for fast repeat renders. The PDF document
    // and bounded canvas cache manage memory across navigation.
  })().catch(error => { console.error("PDF page rendering failed", index + 1, error); }).finally(() => {
    if (entry.promise === task) entry.promise = null;
  });
  entry.promise = task;
  return task;
}
function position(offset = 0) {
  track.style.transition = "none";
  track.style.transform = `translate3d(${offset}px,0,0)`;
}
function mount() {
  if (!documentPdf) return;
  const keep = new Set([current - 1, current, current + 1].filter(i => i >= 0 && i < pageCount));
  for (const [index, entry] of cache) {
    if (!keep.has(index)) entry.element.remove();
  }
  for (const index of [...keep]) {
    const entry = sheetFor(index);
    entry.element.style.left = `${(index - current) * frameWidth}px`;
    if (entry.element.parentElement !== track) track.append(entry.element);
  }
  position();
  for (const [index, entry] of cache) {
    if (!keep.has(index) && cache.size > MAX_CACHE) {
      entry.element.remove();
      entry.canvas.width = entry.canvas.height = 0;
      cache.delete(index);
    }
  }
  // Render the visible page immediately, then prepare the likely next page.
  // Use idle time for further pages so heavy transparency does not compete
  // with the initial first-page paint.
  render(current).then(() => {
    const near = [current + 1, current - 1].filter(i => i >= 0 && i < pageCount);
    near.forEach(i => enqueueRender(i));
    const further = [current + 2, current - 2].filter(i => i >= 0 && i < pageCount);
    further.forEach(i => enqueueRender(i));
  });
  announce();
}
function enqueueRender(index) {
  if (cache.get(index)?.ready || renderQueue.includes(index)) return;
  renderQueue.push(index);
  if (!queuedWorker) {
    queuedWorker = true;
    const schedule = window.requestIdleCallback || (callback => setTimeout(callback, 40));
    schedule(drainRenderQueue, { timeout: 250 });
  }
}
async function drainRenderQueue() {
  const index = renderQueue.shift();
  if (index === undefined) { queuedWorker = false; return; }
  await render(index);
  const schedule = window.requestIdleCallback || (callback => setTimeout(callback, 40));
  schedule(drainRenderQueue, { timeout: 250 });
}
function openProfile(name, updateHistory = true) {
  const data = profiles[name];
  if (!data) return;
  activeProfile = name;
  profileOpen = true;
  for (const item of Object.values(profiles)) item.element.hidden = item !== data;
  viewport.hidden = true;
  if (updateHistory) history.pushState({ profile: name }, "", data.path);
  document.title = data.title + " | Beachcomber Guide";
  data.element.querySelector(".profile-back").focus({ preventScroll: true });
}
function closeProfile(updateHistory = true) {
  if (!activeProfile) return;
  const data = profiles[activeProfile];
  activeProfile = null;
  profileOpen = false;
  for (const item of Object.values(profiles)) item.element.hidden = true;
  viewport.hidden = false;
  current = data.page;
  if (updateHistory) history.pushState({ page: current + 1 }, "", "/beachcomber");
  document.title = "Beachcomber | Your Pocket Guide";
  mount();
}
document.querySelectorAll(".profile-back").forEach(button => button.addEventListener("click", () => closeProfile()));
window.addEventListener("popstate", () => {
  const found = Object.entries(profiles).find(([, data]) => data.path === location.pathname.replace(/\/$/, ""));
  if (found) {
    if (activeProfile !== found[0]) openProfile(found[0], false);
  } else {
    closeProfile(false);
  }
});
function animateTo(target) {
  if (profileOpen || activeAnimation || !documentPdf || target < 0 || target >= pageCount || target === current) return;
  // Only slide into an already rendered page. A heavy soft mask should not
  // produce a blank panel mid-swipe while the renderer catches up.
  if (!cache.get(target)?.ready) {
    render(target).then(() => { if (cache.get(target)?.ready) animateTo(target); });
    return;
  }
  activeAnimation = true;
  const direction = target - current;
  const finish = () => {
    current = target;
    activeAnimation = false;
    mount();
  };
  if (reduceMotion.matches) { finish(); return; }
  track.style.transition = "transform 300ms cubic-bezier(.2,.78,.24,1)";
  track.style.transform = `translate3d(${-direction * frameWidth}px,0,0)`;
  track.addEventListener("transitionend", finish, { once: true });
  // Transition-end fallback for browser interruptions.
  setTimeout(() => { if (activeAnimation) { track.removeEventListener("transitionend", finish); finish(); } }, 380);
}
function settle(shift, next) {
  if (activeAnimation) return;
  activeAnimation = true;
  const finish = () => {
    if (next !== current) current = next;
    activeAnimation = false; mount();
  };
  if (reduceMotion.matches) { finish(); return; }
  track.style.transition = "transform 280ms cubic-bezier(.2,.78,.24,1)";
  track.style.transform = `translate3d(${shift}px,0,0)`;
  track.addEventListener("transitionend", finish, { once: true });
  setTimeout(() => { if (activeAnimation) { track.removeEventListener("transitionend", finish); finish(); } }, 350);
}
viewport.addEventListener("pointerdown", event => {
  if (profileOpen || !documentPdf || activeAnimation || pointer || (event.pointerType === "mouse" && event.button !== 0)) return;
  pointer = { id: event.pointerId, startX: event.clientX, startY: event.clientY, startTime: performance.now(), dx: 0 };
  viewport.setPointerCapture(event.pointerId);
});
viewport.addEventListener("pointermove", event => {
  if (!pointer || event.pointerId !== pointer.id) return;
  let dx = event.clientX - pointer.startX;
  if (current === 0) dx = Math.min(0, dx);
  if (current === pageCount - 1) dx = Math.max(0, dx);
  pointer.dx = dx;
  position(dx);
});
function endPointer(event) {
  if (!pointer || pointer.id !== event.pointerId) return;
  const { dx, startTime } = pointer;
  pointer = null;
  const duration = Math.max(performance.now() - startTime, 1);
  const enough = Math.abs(dx) > Math.max(35, frameWidth * 0.19) ||
    (Math.abs(dx) > 18 && Math.abs(dx / duration) > 0.55);
  const target = enough ? Math.max(0, Math.min(pageCount - 1, current + (dx < 0 ? 1 : -1))) : current;
  if (target !== current && !cache.get(target)?.ready) {
    // Hold position until the destination is drawn, retaining the visible page.
    render(target).then(() => settle(-Math.sign(target - current) * frameWidth, target));
  } else {
    settle(target === current ? 0 : -Math.sign(target - current) * frameWidth, target);
  }
}
viewport.addEventListener("pointerup", endPointer);
viewport.addEventListener("pointercancel", event => {
  if (!pointer || pointer.id !== event.pointerId) return;
  pointer = null; settle(0, current);
});
window.addEventListener("keydown", event => {
  if (profileOpen || (event.key !== "ArrowRight" && event.key !== "ArrowLeft")) return;
  event.preventDefault();
  animateTo(current + (event.key === "ArrowRight" ? 1 : -1));
});
viewport.addEventListener("wheel", event => {
  if (profileOpen || Math.abs(event.deltaX) <= Math.abs(event.deltaY) || Math.abs(event.deltaX) < 12) return;
  event.preventDefault();
  if (performance.now() - wheelTime < 500) return;
  wheelTime = performance.now();
  animateTo(current + (event.deltaX > 0 ? 1 : -1));
}, { passive: false });
function onResize() {
  cancelAnimationFrame(resizeTicket);
  resizeTicket = requestAnimationFrame(() => {
    if (pointer || activeAnimation) return;
    const oldWidth = frameWidth, oldHeight = frameHeight;
    sizing();
    if (Math.abs(frameWidth - oldWidth) > 1 || Math.abs(frameHeight - oldHeight) > 1) {
      ++renderGeneration;
      for (const entry of cache.values()) entry.ready = false;
      mount();
    }
  });
}
window.addEventListener("resize", onResize);
window.visualViewport?.addEventListener("resize", onResize);
window.visualViewport?.addEventListener("scroll", onResize);
document.addEventListener("touchmove", event => { if (event.cancelable) event.preventDefault(); }, { passive: false });
(async () => {
  try {
    sizing();
    const loading = pdfjs.getDocument({ url: PDF_URL, cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.4.299/cmaps/", cMapPacked: true });
    documentPdf = await loading.promise;
    pageCount = documentPdf.numPages;
    const first = await documentPdf.getPage(1);
    const size = first.getViewport({ scale: 1 });
    pageRatio = size.width / size.height;
    sizing();
    const direct = Object.entries(profiles).find(([, data]) => data.path === location.pathname.replace(/\/$/, ""));
    if (direct) {
      current = direct[1].page;
      mount();
      openProfile(direct[0], false);
    }
    // Mount immediately: the first page is rendered without waiting on other pages.
    mount();
    await render(0);
    viewport.classList.add("ready");
  } catch (error) {
    console.error("Could not load Beachcomber guide", error);
    announcer.textContent = "The guide could not be loaded. Please reload the page.";
  }
})();
