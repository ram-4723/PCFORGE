/**
 * GpuExplorer — scrubbable pre-rendered 3D hardware viewer for PCForge's Hardware Explorer.
 * One shared component for every part (GPU, motherboard, …): point `basePath` at a frame folder and pass its `labels`.
 * Plain React + <canvas>; no other dependencies. Styles: ./GpuExplorer.css (all classes prefixed "gpux-").
 *
 * A frame folder (e.g. public/gpu-explorer/, public/motherboard-explorer/) holds:
 *   rotate/000.webp … 143.webp, explode/000.webp … 071.webp, anchors.json, poster.webp
 *
 * Works uncontrolled (built-in Explode button + slider, exactly as before) or driven by a host toolbar:
 *   controlled props  exploded / showLabels / zoom  (+ onExplodedChange / onLabelsChange / onZoomChange)
 *   ref handle        explode() assemble() toggleExplode() toggleLabels() setZoom(n) zoomIn() zoomOut() reset() getState()
 */
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { GPU_PARTS } from "./parts.js";
import "./GpuExplorer.css";

export { GPU_PARTS };

// Vite injects import.meta.env.BASE_URL ("/PCFORGE/" on GitHub Pages). Guarded so the file also runs without Vite / during SSR.
let ENV_BASE = "/";
try { ENV_BASE = (import.meta && import.meta.env && import.meta.env.BASE_URL) || "/"; } catch (e) { /* not a Vite build */ }
/** URL of a frame folder in public/, e.g. explorerAssetPath("motherboard-explorer") -> "/PCFORGE/motherboard-explorer/" */
export const explorerAssetPath = (folder) => `${ENV_BASE.replace(/\/?$/, "/")}${String(folder).replace(/^\/+|\/+$/g, "")}/`;
export const DEFAULT_BASE_PATH = explorerAssetPath("gpu-explorer");

const pad3 = (i) => String(i).padStart(3, "0");
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const easeInOut = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

// ---------- frame sets: loaded once per folder and cached, so switching component tabs back and forth is instant ----------
const CACHE = new Map();
const CACHE_MAX = 3;
function getFrameSet(base, rotateCount, explodeCount, ext) {
  const key = `${base}|${rotateCount}|${explodeCount}|${ext}`;
  let s = CACHE.get(key);
  if (s) { CACHE.delete(key); CACHE.set(key, s); return s; }          // LRU touch
  s = { key, base, imgs: { rotate: new Array(rotateCount), explode: new Array(explodeCount) }, meta: null,
        loaded: 0, total: rotateCount + explodeCount, done: false, users: 0, subs: new Set() };
  const emit = (ev) => s.subs.forEach((fn) => fn(ev, s));
  if (typeof window === "undefined" || typeof Image === "undefined") return s;
  fetch(`${base}/anchors.json`).then((r) => (r.ok ? r.json() : null)).then((j) => { s.meta = j; emit("meta"); }).catch(() => {});
  const list = [];
  for (let i = 0; i < rotateCount; i++) list.push(["rotate", i]);
  for (let i = 0; i < explodeCount; i++) list.push(["explode", i]);
  let k = 0;
  const loadOne = ([kind, i]) => new Promise((res) => {
    const im = new Image();
    im.decoding = "async";
    im.onload = im.onerror = () => {
      s.imgs[kind][i] = im; s.loaded++;
      emit(kind === "rotate" && i === 0 ? "frame0" : "progress");
      res();
    };
    im.src = `${base}/${kind}/${pad3(i)}.${ext}`;
  });
  const worker = async () => { while (k < list.length) await loadOne(list[k++]); };
  Promise.all(Array.from({ length: 6 }, worker)).then(() => { s.done = true; emit("done"); });
  CACHE.set(key, s);
  // evict the oldest finished set nobody is showing
  for (const [ck, cs] of CACHE) { if (CACHE.size <= CACHE_MAX) break; if (cs !== s && cs.done && cs.users === 0) CACHE.delete(ck); }
  return s;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduced;
}

let UID = 0;
const useStableId = React.useId || (() => { const r = useRef(null); if (r.current === null) r.current = `u${++UID}`; return r.current; });

export const GpuExplorer = forwardRef(function GpuExplorer({
  basePath = DEFAULT_BASE_PATH,
  rotateCount = 144,
  explodeCount = 72,
  ext = "webp",
  title = "Gigabyte GeForce RTX Gaming OC",
  labels = GPU_PARTS,          // [{id, name, short?, desc}] — override names / descriptions (ids must match anchors.json)
  explodeDuration = 1600,      // ms for the button-driven explode / reassemble
  dragTurnsPerWidth = 1,       // one full turn per container width of drag
  initiallyExploded = false,
  onPartSelect,                // (part|null) => void
  className = "",
  // ---- host-toolbar API (all optional; omit them and the component behaves exactly as before) ----
  exploded,                    // bool  — controlled explode state
  onExplodedChange,            // (bool) => void — fired when the viewer itself asks to explode/reassemble (button, E key, drag, slider)
  showLabels,                  // bool  — controlled label visibility (labels only ever appear on the fully exploded view)
  onLabelsChange,              // (bool) => void
  zoom,                        // number, 1 = 100 %; clamped to [minZoom, maxZoom]
  onZoomChange,                // (number) => void
  minZoom = 0.6,
  maxZoom = 2.5,
  zoomStep = 0.1,              // zoomIn()/zoomOut() step (0.1 = 10 percentage points)
  enableGestureZoom = false,   // wheel / pinch zoom inside the viewer (off by default so it doesn't fight the host's +/- buttons)
  hideControls = false,        // hide the built-in Explode button + slider (host toolbar is the only UI)
}, ref) {
  const base = basePath.replace(/\/$/, "");
  const reduced = usePrefersReducedMotion();
  const rid = useStableId();
  const descId = `gpux-desc-${String(rid).replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const stageRef = useRef(null);
  const viewRef = useRef(null);
  const canvasRef = useRef(null);
  const cur = useRef(null);                            // frame set on screen
  const labelsFor = useRef({});                        // labels prop per folder, so names swap together with the frames
  labelsFor.current[base] = labels;
  const [shown, setShown] = useState({ base: null, meta: null });
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [switching, setSwitching] = useState(0);       // 0 = idle, else preload progress (0..1] of the next component
  const [explodeUI, setExplodeUI] = useState(0);       // mirrors the explode amount for the slider
  const [full, setFull] = useState(false);             // fully exploded
  const [labelsInt, setLabelsInt] = useState(true);
  const [zoomInt, setZoomInt] = useState(1);
  const [panning, setPanning] = useState(false);
  const [hoverId, setHoverId] = useState(null);
  const [pinnedId, setPinnedId] = useState(null);
  const activeId = hoverId || pinnedId;
  const labelsEnabled = showLabels === undefined ? labelsInt : !!showLabels;
  const z = clamp(zoom === undefined ? zoomInt : +zoom || 1, minZoom, maxZoom);
  const labelsOn = full && labelsEnabled;

  // mutable animation state (kept out of React to avoid re-rendering at 60 fps)
  const S = useRef({ a: 0, vel: 0, e: 0, tween: null, wantE: null, snap: false, drag: null, raf: 0, last: 0, drawn: "",
                     pan: { x: 0, y: 0 }, z: 1, ptrs: new Map(), gesture: null, panDrag: null, lastE: false });
  S.current.z = z;
  const cb = useRef({});
  cb.current = { onExplodedChange, onLabelsChange, onZoomChange };

  // ---------- drawing ----------
  const drawFrame = useCallback((force) => {
    const c = canvasRef.current, st = S.current, set = cur.current;
    if (!c || !set) return;
    const kind = st.e > 0.0005 ? "explode" : "rotate";
    const idx = kind === "explode"
      ? Math.round(st.e * (explodeCount - 1))
      : ((Math.round(st.a) % rotateCount) + rotateCount) % rotateCount;
    const arr = set.imgs[kind];
    let im = arr[idx];
    if (!im || !im.naturalWidth) {
      // nearest loaded neighbour while preloading
      const wrap = kind === "rotate";
      for (let d = 1; d < arr.length && (!im || !im.naturalWidth); d++) {
        const lo = wrap ? (idx - d + arr.length) % arr.length : idx - d, hi = wrap ? (idx + d) % arr.length : idx + d;
        im = (arr[lo]?.naturalWidth && arr[lo]) || (arr[hi]?.naturalWidth && arr[hi]) || null;
      }
      if (!im || !im.naturalWidth) return;
    }
    const key = set.key + kind + idx + c.width;
    if (!force && key === st.drawn) return;
    st.drawn = key;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(im, 0, 0, c.width, c.height);
  }, [explodeCount, rotateCount]);

  const tick = useCallback((now) => {
    const st = S.current;
    const dt = Math.min(0.05, (now - (st.last || now)) / 1000);
    st.last = now;
    let active = false;
    const wantsExplode = (st.wantE !== null && st.wantE > 0) || st.tween;
    // 1) snap rotation to 0° (shortest way round) before any explode, or on reset()
    if ((wantsExplode || st.snap) && st.a !== 0 && !st.drag) {
      const R = rotateCount;
      let diff = -(((st.a % R) + R) % R);
      if (diff < -R / 2) diff += R;
      if (reduced || Math.abs(diff) < 0.35) { st.a = 0; st.vel = 0; }
      else { st.a += diff * Math.min(1, dt * 7); st.vel = 0; active = true; }
      if (st.a !== 0) { drawFrame(); st.raf = requestAnimationFrame(tick); return; }
    }
    if (st.a === 0) st.snap = false;
    // 2) explode tween / slider target
    if (st.a === 0 && st.wantE !== null) {
      if (reduced) { st.e = st.wantE; st.wantE = null; }
      else if (!st.tween) {
        const dist = Math.abs(st.wantE - st.e);
        st.tween = { from: st.e, to: st.wantE, t0: now, dur: Math.max(120, explodeDuration * dist) };
        st.wantE = null;
      }
    }
    if (st.tween) {
      const tw = st.tween, u = clamp((now - tw.t0) / tw.dur, 0, 1);
      st.e = tw.from + (tw.to - tw.from) * easeInOut(u);
      if (u >= 1) st.tween = null; else active = true;
    }
    // 3) inertia while assembled
    if (st.e === 0 && !st.drag && Math.abs(st.vel) > 0.02 && !reduced) {
      st.a += st.vel * dt;
      st.vel *= Math.exp(-dt * 3.2);
      active = true;
    }
    drawFrame();
    setExplodeUI((v) => (Math.abs(v - st.e) > 0.001 ? st.e : v));
    setFull(st.e > 0.995);
    if (active || st.drag || st.wantE !== null || st.snap) st.raf = requestAnimationFrame(tick);
    else st.raf = 0;
  }, [drawFrame, explodeDuration, reduced, rotateCount]);

  const requestDraw = useCallback((force) => {
    if (force) S.current.drawn = "";
    const st = S.current;
    if (!st.raf) { st.last = 0; st.raf = requestAnimationFrame(tick); }
  }, [tick]);

  // ---------- load / swap frame sets (old component stays on screen until the new one is fully preloaded) ----------
  useEffect(() => {
    let alive = true;
    const set = getFrameSet(base, rotateCount, explodeCount, ext);
    set.users++;
    const show = () => {
      if (cur.current && cur.current !== set) cur.current.users--;
      if (cur.current !== set) set.users++;
      cur.current = set;
      S.current.pan = { x: 0, y: 0 }; applyView();
      setShown({ base: set.base, meta: set.meta });
      setPinnedId(null); setHoverId(null);
      requestDraw(true);
    };
    const first = !cur.current;
    if (first || set.done) { show(); setReady(set.done); setProgress(set.loaded / set.total); setSwitching(0); }
    else setSwitching(Math.max(0.02, set.loaded / set.total));
    const onEv = (ev) => {
      if (!alive) return;
      const onScreen = cur.current === set;
      if (ev === "meta" && onScreen) setShown({ base: set.base, meta: set.meta });
      if (ev === "frame0" && onScreen) requestDraw(true);
      if (onScreen) setProgress(set.loaded / set.total); else setSwitching(Math.max(0.02, set.loaded / set.total));
      if (ev === "done") { if (!onScreen) show(); setReady(true); setSwitching(0); requestDraw(true); }
    };
    set.subs.add(onEv);
    return () => { alive = false; set.subs.delete(onEv); set.users--; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, rotateCount, explodeCount, ext]);

  // ---------- zoom / pan ----------
  const clampPan = (p, zz) => {
    const el = stageRef.current; if (!el || zz <= 1) return { x: 0, y: 0 };
    const mx = ((zz - 1) / 2) * el.clientWidth, my = ((zz - 1) / 2) * el.clientHeight;
    return { x: clamp(p.x, -mx, mx), y: clamp(p.y, -my, my) };
  };
  const applyView = () => {
    const v = viewRef.current, st = S.current; if (!v) return;
    st.pan = clampPan(st.pan, st.z);
    v.style.transform = `translate(${st.pan.x}px, ${st.pan.y}px) scale(${st.z})`;
    v.style.setProperty("--gpux-z", String(st.z));
  };
  const setZoomVal = useCallback((n) => {
    const v = clamp(+n || 1, minZoom, maxZoom);
    const r = Math.round(v * 1000) / 1000;
    if (zoom === undefined) setZoomInt(r);
    cb.current.onZoomChange?.(r);
    return r;
  }, [zoom, minZoom, maxZoom]);
  useEffect(() => { applyView(); /* eslint-disable-next-line */ }, [z]);

  // canvas sizing (device-pixel accurate, 16:9; extra resolution while zoomed in)
  useEffect(() => {
    const el = stageRef.current, c = canvasRef.current;
    if (!el || !c || typeof window === "undefined") return;
    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1) * clamp(S.current.z, 1, 2);
      const w = Math.min(3200, Math.round(el.clientWidth * dpr)), h = Math.round((w * 9) / 16);
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; requestDraw(true); }
      applyView();
    };
    if (typeof ResizeObserver === "undefined") { size(); return; }
    const ro = new ResizeObserver(size);
    ro.observe(el); size();
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestDraw, z]);

  useEffect(() => () => cancelAnimationFrame(S.current.raf), []);

  // ---------- explode / labels ----------
  const setExplode = useCallback((target) => {
    const st = S.current;
    st.tween = null;
    st.wantE = clamp(target, 0, 1);
    requestDraw();
  }, [requestDraw]);
  const requestExplode = useCallback((target) => {      // user action inside the viewer
    setExplode(target);
    const b = target > 0.5; if (b !== S.current.lastE) { S.current.lastE = b; cb.current.onExplodedChange?.(b); }
  }, [setExplode]);
  useEffect(() => { if (initiallyExploded && ready && exploded === undefined) requestExplode(1); /* eslint-disable-next-line */ }, [ready]);
  useEffect(() => { if (exploded !== undefined) { S.current.lastE = !!exploded; setExplode(exploded ? 1 : 0); } }, [exploded, setExplode]);
  const setLabels = useCallback((b) => { if (showLabels === undefined) setLabelsInt(b); cb.current.onLabelsChange?.(b); }, [showLabels]);

  const reset = useCallback(() => {
    const st = S.current;
    st.vel = 0; st.drag = null; st.gesture = null; st.panDrag = null; st.snap = true;
    setPinnedId(null); setHoverId(null);
    st.pan = { x: 0, y: 0 };
    if (S.current.lastE || st.e > 0) { st.lastE = false; cb.current.onExplodedChange?.(false); }
    setExplode(0);
    if (!labelsEnabled) setLabels(true);
    setZoomVal(1); applyView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setExplode, setZoomVal, setLabels, labelsEnabled]);

  useImperativeHandle(ref, () => ({
    explode: () => requestExplode(1),
    assemble: () => requestExplode(0),
    toggleExplode: () => requestExplode(S.current.e > 0.5 || (S.current.tween && S.current.tween.to > 0.5) ? 0 : 1),
    toggleLabels: () => setLabels(!labelsEnabled),
    setZoom: (n) => setZoomVal(n),
    zoomIn: () => setZoomVal(S.current.z + zoomStep),
    zoomOut: () => setZoomVal(S.current.z - zoomStep),
    reset,
    getState: () => ({ exploded: S.current.e > 0.5, explodeAmount: S.current.e, labels: labelsEnabled, zoom: S.current.z,
                       frame: ((Math.round(S.current.a) % rotateCount) + rotateCount) % rotateCount, ready }),
  }), [requestExplode, setLabels, labelsEnabled, setZoomVal, zoomStep, reset, rotateCount, ready]);

  // ---------- pointer input ----------
  const onSlider = (ev) => {
    const v = +ev.target.value, st = S.current;
    const b = v > 0.5; if (b !== st.lastE) { st.lastE = b; cb.current.onExplodedChange?.(b); }
    if (st.a !== 0) { setExplode(v); return; }        // snap rotation first, then glide there
    st.tween = null; st.wantE = null; st.e = v;
    setExplodeUI(v); setFull(v > 0.995); requestDraw();
  };
  const toggle = () => requestExplode(S.current.e > 0.5 || (S.current.tween && S.current.tween.to > 0.5) ? 0 : 1);

  const twoFinger = () => { const p = [...S.current.ptrs.values()]; return { mx: (p[0].x + p[1].x) / 2, my: (p[0].y + p[1].y) / 2, d: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1 }; };
  const onPointerDown = (ev) => {
    if (ev.button !== undefined && ev.button !== 0) return;
    const st = S.current;
    st.ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    stageRef.current.setPointerCapture?.(ev.pointerId);
    if (st.ptrs.size === 2) {                           // two fingers: pan (when zoomed) / pinch (when enabled)
      if (st.drag) { st.drag = null; st.vel = 0; }
      const g = twoFinger(); st.gesture = { ...g, pan0: { ...st.pan }, z0: st.z }; st.panDrag = null; setPanning(true); return;
    }
    if (st.ptrs.size > 2) return;
    const panMod = ev.shiftKey || ev.altKey || ev.ctrlKey || ev.metaKey;
    if (st.z > 1.001 && (panMod || st.e > 0 || st.tween)) {   // zoomed: modifier-drag (or any drag on the exploded view) pans
      st.panDrag = { x: ev.clientX, y: ev.clientY, pan0: { ...st.pan } }; setPanning(true); return;
    }
    if (st.e > 0 || st.tween) { requestExplode(0); return; }  // dragging an exploded card reassembles it first
    st.drag = { x: ev.clientX, t: performance.now(), v: 0 };
    st.vel = 0;
    requestDraw();
  };
  const onPointerMove = (ev) => {
    const st = S.current;
    if (st.ptrs.has(ev.pointerId)) st.ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (st.gesture && st.ptrs.size >= 2) {
      const g = twoFinger();
      let zz = st.z;
      if (enableGestureZoom) zz = setZoomVal(st.gesture.z0 * (g.d / st.gesture.d));
      st.z = zz;
      st.pan = { x: st.gesture.pan0.x + (g.mx - st.gesture.mx), y: st.gesture.pan0.y + (g.my - st.gesture.my) };
      applyView(); return;
    }
    if (st.panDrag) { st.pan = { x: st.panDrag.pan0.x + ev.clientX - st.panDrag.x, y: st.panDrag.pan0.y + ev.clientY - st.panDrag.y }; applyView(); return; }
    if (!st.drag) return;
    const w = stageRef.current.clientWidth || 1;
    const now = performance.now();
    const dFrames = ((ev.clientX - st.drag.x) / w) * rotateCount * dragTurnsPerWidth;
    st.a -= dFrames;   // drag right → card turns to the right
    const dt = Math.max(1, now - st.drag.t) / 1000;
    st.drag.v = 0.7 * (-dFrames / dt) + 0.3 * st.drag.v;
    st.drag.x = ev.clientX; st.drag.t = now;
    drawFrame();
  };
  const onPointerUp = (ev) => {
    const st = S.current;
    st.ptrs.delete(ev?.pointerId);
    if (st.gesture) { if (st.ptrs.size < 2) { st.gesture = null; setPanning(false); } return; }
    if (st.panDrag) { st.panDrag = null; setPanning(false); return; }
    if (!st.drag) return;
    st.vel = performance.now() - st.drag.t < 90 ? clamp(st.drag.v, -rotateCount * 2, rotateCount * 2) : 0;
    st.drag = null;
    requestDraw();
  };
  // wheel zoom (opt-in; needs a non-passive listener to stop the page from scrolling)
  useEffect(() => {
    const el = stageRef.current;
    if (!el || !enableGestureZoom) return;
    const onWheel = (e) => { e.preventDefault(); setZoomVal(S.current.z * Math.exp(-e.deltaY * 0.0015)); };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [enableGestureZoom, setZoomVal]);

  const onKeyDown = (ev) => {
    const st = S.current;
    if (ev.key === "ArrowLeft" || ev.key === "ArrowRight") {
      if (st.e > 0) return;
      st.a += ev.key === "ArrowLeft" ? 2 : -2; ev.preventDefault(); requestDraw();
    } else if (ev.key === "e" || ev.key === "E" || ev.key === "Enter") { toggle(); ev.preventDefault(); }
    else if (ev.key === "Escape") { setPinnedId(null); }
    else if (enableGestureZoom && (ev.key === "+" || ev.key === "=")) { setZoomVal(st.z + zoomStep); ev.preventDefault(); }
    else if (enableGestureZoom && ev.key === "-") { setZoomVal(st.z - zoomStep); ev.preventDefault(); }
  };

  // ---------- label geometry (from anchors.json, last explode frame) ----------
  const shownLabels = (shown.base && labelsFor.current[shown.base]) || labels;
  const labelData = useMemo(() => {
    const meta = shown.meta;
    const last = meta?.explode?.frames?.[meta.explode.frames.length - 1];
    const mp = Object.fromEntries((meta?.parts || []).map((p) => [p.id, p]));
    return shownLabels.map((p) => {
      const a = last?.anchors?.find((x) => x.id === p.id);
      const m = mp[p.id];
      if (!a || !m) return null;
      return { ...p, ax: a.x, ay: a.y, lx: m.label.x, ly: m.label.y, side: m.side || "r", color: m.color || "#ffc64a" };
    }).filter(Boolean);
  }, [shown, shownLabels]);

  const active = labelData.find((p) => p.id === activeId) || null;
  useEffect(() => { onPartSelect?.(active); /* eslint-disable-next-line */ }, [activeId]);
  useEffect(() => { if (!labelsOn) { setPinnedId(null); setHoverId(null); } }, [labelsOn]);

  const gestureCls = enableGestureZoom || z > 1.001 ? "is-gesture" : "";
  return (
    <div className={`gpux ${reduced ? "gpux--reduced" : ""} ${className}`}>
      <div
        ref={stageRef}
        className={`gpux-stage ${labelsOn ? "is-labelled" : ""} ${gestureCls} ${panning ? "is-panning" : ""}`}
        role="application"
        aria-label={`${title}: drag to rotate, press E to explode`}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <div ref={viewRef} className="gpux-view">
          {shown.base && <img className="gpux-poster" src={`${shown.base}/poster.webp`} alt="" aria-hidden="true" draggable={false} />}
          <canvas ref={canvasRef} className="gpux-canvas" />

          <svg className="gpux-leaders" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
            {labelData.map((p, i) => (
              <g key={p.id} className={`gpux-leader ${activeId === p.id ? "is-active" : ""}`} style={{ "--i": i }}>
                <line x1={p.ax * 1600} y1={p.ay * 900} x2={p.lx * 1600} y2={p.ly * 900} />
                <circle cx={p.ax * 1600} cy={p.ay * 900} r={9 / z} className="ring" style={{ stroke: p.color }} />
                <circle cx={p.ax * 1600} cy={p.ay * 900} r={3.6 / z} style={{ fill: p.color }} />
              </g>
            ))}
          </svg>

          <div className="gpux-labels">
            {labelData.map((p, i) => (
              <button
                key={p.id}
                type="button"
                className={`gpux-label gpux-label--${p.side} ${activeId === p.id ? "is-active" : ""}`}
                style={{ left: `${p.lx * 100}%`, top: `${p.ly * 100}%`, "--i": i, "--accent": p.color }}
                aria-label={p.name}
                tabIndex={labelsOn ? 0 : -1}
                aria-describedby={activeId === p.id ? descId : undefined}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseEnter={() => setHoverId(p.id)}
                onMouseLeave={() => setHoverId(null)}
                onFocus={() => setHoverId(p.id)}
                onBlur={() => setHoverId(null)}
                onClick={() => setPinnedId((v) => (v === p.id ? null : p.id))}
              >
                {p.short ? (<><span className="gpux-l-full">{p.name}</span><span className="gpux-l-short">{p.short}</span></>) : p.name}
              </button>
            ))}
          </div>
        </div>

        {!ready && !switching && (
          <div className="gpux-loader" aria-live="polite">
            <div className="gpux-loader-bar"><i style={{ width: `${Math.round(progress * 100)}%` }} /></div>
            <span>Loading 3D view… {Math.round(progress * 100)}%</span>
          </div>
        )}
        {switching > 0 && <div className="gpux-switch-progress" role="status" aria-live="polite" aria-atomic="true">
          <span>Loading {title}… <b>{Math.round(switching * 100)}%</b></span>
          <div className="gpux-switch-progress-track" role="progressbar" aria-label={`Loading ${title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(switching * 100)}>
            <i style={{ width: `${Math.round(switching * 100)}%` }} />
          </div>
        </div>}
        {ready && explodeUI === 0 && !full && <div className="gpux-hint" aria-hidden="true">Drag to rotate</div>}
      </div>

      <div className={`gpux-desc ${labelsOn && active ? "is-on" : ""} ${labelsOn ? "is-labelled" : ""}`} id={descId} role="status" aria-live="polite">
        {active
          ? (<><strong style={{ color: active.color }}>{active.name}</strong><span>{active.desc}</span></>)
          : (<span className="gpux-desc-hint">Tap or hover a label to see what that part does.</span>)}
      </div>

      {!hideControls && (
        <div className="gpux-controls">
          <button type="button" className="gpux-btn" onClick={toggle} disabled={!ready} aria-pressed={explodeUI > 0.5}>
            {explodeUI > 0.5 ? "Reassemble" : "Explode"}
          </button>
          <label className="gpux-slider">
            <span>Assembled</span>
            <input type="range" min="0" max="1" step="0.001" value={explodeUI} onChange={onSlider} disabled={!ready} aria-label="Explode amount" />
            <span>Exploded</span>
          </label>
        </div>
      )}
    </div>
  );
});

export default GpuExplorer;
