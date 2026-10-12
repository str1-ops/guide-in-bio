import * as pdfjs from "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs";

pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";

const PDF_URL = "/Beachcomber-Digital-Guide.pdf";
const root = document.getElementById("publication");
const viewport = document.getElementById("viewport");
const track = document.getElementById("track");
const announcer = document.getElementById("announcer");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const cache = new Map();
const MAX_CACHE = 5;
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
    page.cleanup();
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
  // Current page renders first. Neighbours render in the background.
  render(current).then(() => {
    if (current > 0) render(current - 1);
    if (current < pageCount - 1) render(current + 1);
  });
  announce();
}
function animateTo(target) {
  if (activeAnimation || !documentPdf || target < 0 || target >= pageCount || target === current) return;
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
  if (!documentPdf || activeAnimation || pointer || (event.pointerType === "mouse" && event.button !== 0)) return;
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
  settle(target === current ? 0 : -Math.sign(target - current) * frameWidth, target);
}
viewport.addEventListener("pointerup", endPointer);
viewport.addEventListener("pointercancel", event => {
  if (!pointer || pointer.id !== event.pointerId) return;
  pointer = null; settle(0, current);
});
window.addEventListener("keydown", event => {
  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
  event.preventDefault();
  animateTo(current + (event.key === "ArrowRight" ? 1 : -1));
});
viewport.addEventListener("wheel", event => {
  if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || Math.abs(event.deltaX) < 12) return;
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
    const loading = pdfjs.getDocument({ url: PDF_URL, cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/", cMapPacked: true });
    documentPdf = await loading.promise;
    pageCount = documentPdf.numPages;
    const first = await documentPdf.getPage(1);
    const size = first.getViewport({ scale: 1 });
    pageRatio = size.width / size.height;
    sizing();
    await render(0);
    mount();
    viewport.classList.add("ready");
  } catch (error) {
    console.error("Could not load Beachcomber guide", error);
    announcer.textContent = "The guide could not be loaded. Please reload the page.";
  }
})();
