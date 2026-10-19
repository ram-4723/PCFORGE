/**
 * GpuExplorer — scrubbable pre-rendered 3D graphics card for PCForge's Hardware Explorer.
 * Plain React + <canvas>; no other dependencies. Styles: ./GpuExplorer.css (all classes prefixed "gpux-").
 *
 * Frames live in public/gpu-explorer/ (served at `${import.meta.env.BASE_URL}gpu-explorer/`):
 *   rotate/000.webp … 143.webp, explode/000.webp … 071.webp, anchors.json, poster.webp
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GPU_PARTS } from "./parts.js";
import "./GpuExplorer.css";

export { GPU_PARTS };

// Vite injects import.meta.env.BASE_URL ("/PCFORGE/" on GitHub Pages). Guarded so the file also runs without Vite / during SSR.
let ENV_BASE = "/";
try { ENV_BASE = (import.meta && import.meta.env && import.meta.env.BASE_URL) || "/"; } catch (e) { /* not a Vite build */ }
export const DEFAULT_BASE_PATH = `${ENV_BASE.replace(/\/?$/, "/")}gpu-explorer/`;

const pad3 = (i) => String(i).padStart(3, "0");
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const easeInOut = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

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

export function GpuExplorer({
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
}) {
  const base = basePath.replace(/\/$/, "");
  const reduced = usePrefersReducedMotion();
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const imgs = useRef({ rotate: [], explode: [] });
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [meta, setMeta] = useState(null);
  const [explodeUI, setExplodeUI] = useState(0);      // mirrors the explode amount for the slider
  const [labelsOn, setLabelsOn] = useState(false);
  const [hoverId, setHoverId] = useState(null);
  const [pinnedId, setPinnedId] = useState(null);
  const activeId = hoverId || pinnedId;

  // mutable animation state (kept out of React to avoid re-rendering at 60 fps)
  const S = useRef({ a: 0, vel: 0, e: 0, tween: null, wantE: null, drag: null, raf: 0, last: 0, drawn: "" });

  // ---------- preload ----------
  useEffect(() => {
    let cancelled = false;
    const list = [];
    for (let i = 0; i < rotateCount; i++) list.push(["rotate", i]);
    for (let i = 0; i < explodeCount; i++) list.push(["explode", i]);
    let done = 0;
    imgs.current = { rotate: new Array(rotateCount), explode: new Array(explodeCount) };
    fetch(`${base}/anchors.json`).then((r) => (r.ok ? r.json() : null)).then((j) => !cancelled && setMeta(j)).catch(() => {});
    const loadOne = ([kind, i]) =>
      new Promise((res) => {
        const im = new Image();
        im.decoding = "async";
        im.onload = im.onerror = () => {
          if (cancelled) return res();
          imgs.current[kind][i] = im;
          done++;
          setProgress(done / list.length);
          if (kind === "rotate" && i === 0) requestDraw(true);
          res();
        };
        im.src = `${base}/${kind}/${pad3(i)}.${ext}`;
      });
    // 6 parallel requests: frame 0 first, then a coarse pass so early drags already show something
    const order = [list[0], ...list.slice(1)];
    let k = 0;
    const worker = async () => { while (k < order.length && !cancelled) await loadOne(order[k++]); };
    Promise.all(Array.from({ length: 6 }, worker)).then(() => { if (!cancelled) { setReady(true); requestDraw(true); } });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, rotateCount, explodeCount, ext]);

  // ---------- drawing ----------
  const drawFrame = useCallback((force) => {
    const c = canvasRef.current, st = S.current;
    if (!c) return;
    const kind = st.e > 0.0005 ? "explode" : "rotate";
    const idx = kind === "explode"
      ? Math.round(st.e * (explodeCount - 1))
      : ((Math.round(st.a) % rotateCount) + rotateCount) % rotateCount;
    let im = imgs.current[kind][idx];
    if (!im || !im.naturalWidth) {
      // nearest loaded neighbour while preloading
      const arr = imgs.current[kind];
      const wrap = kind === "rotate";
      for (let d = 1; d < arr.length && (!im || !im.naturalWidth); d++) {
        const lo = wrap ? (idx - d + arr.length) % arr.length : idx - d, hi = wrap ? (idx + d) % arr.length : idx + d;
        im = (arr[lo]?.naturalWidth && arr[lo]) || (arr[hi]?.naturalWidth && arr[hi]) || null;
      }
      if (!im || !im.naturalWidth) return;
    }
    const key = kind + idx + c.width;
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
    // 1) snap rotation to 0° (shortest way round) before any explode
    if (wantsExplode && st.a !== 0 && !st.drag) {
      const R = rotateCount;
      let diff = -(((st.a % R) + R) % R);
      if (diff < -R / 2) diff += R;
      if (reduced || Math.abs(diff) < 0.35) { st.a = 0; st.vel = 0; }
      else { st.a += diff * Math.min(1, dt * 7); st.vel = 0; active = true; }
      if (st.a !== 0) { drawFrame(); st.raf = requestAnimationFrame(tick); return; }
    }
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
    setLabelsOn(st.e > 0.995);
    if (active || st.drag || st.wantE !== null) st.raf = requestAnimationFrame(tick);
    else st.raf = 0;
  }, [drawFrame, explodeDuration, reduced, rotateCount]);

  const requestDraw = useCallback((force) => {
    if (force) S.current.drawn = "";
    const st = S.current;
    if (!st.raf) { st.last = 0; st.raf = requestAnimationFrame(tick); }
  }, [tick]);

  // canvas sizing (device-pixel accurate, 16:9)
  useEffect(() => {
    const el = stageRef.current, c = canvasRef.current;
    if (!el || !c || typeof window === "undefined") return;
    if (typeof ResizeObserver === "undefined") { c.width = el.clientWidth || 1280; c.height = Math.round(c.width * 9 / 16); requestDraw(true); return; }
    const ro = new ResizeObserver(() => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.round(el.clientWidth * dpr), h = Math.round((el.clientWidth * 9 / 16) * dpr);
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; requestDraw(true); }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [requestDraw]);

  useEffect(() => () => cancelAnimationFrame(S.current.raf), []);
  useEffect(() => { if (initiallyExploded && ready) setExplode(1); /* eslint-disable-next-line */ }, [ready]);

  // ---------- controls ----------
  const setExplode = useCallback((target) => {
    const st = S.current;
    st.tween = null;
    st.wantE = clamp(target, 0, 1);
    requestDraw();
  }, [requestDraw]);

  const onSlider = (ev) => {
    const v = +ev.target.value, st = S.current;
    if (st.a !== 0) { setExplode(v); return; }        // snap rotation first, then glide there
    st.tween = null; st.wantE = null; st.e = v;
    setExplodeUI(v); setLabelsOn(v > 0.995); requestDraw();
  };

  const toggle = () => setExplode(S.current.e > 0.5 || (S.current.tween && S.current.tween.to > 0.5) ? 0 : 1);

  const onPointerDown = (ev) => {
    if (ev.button !== undefined && ev.button !== 0) return;
    const st = S.current;
    if (st.e > 0 || st.tween) { setExplode(0); return; }  // dragging an exploded card reassembles it first
    stageRef.current.setPointerCapture?.(ev.pointerId);
    st.drag = { x: ev.clientX, t: performance.now(), v: 0 };
    st.vel = 0;
    requestDraw();
  };
  const onPointerMove = (ev) => {
    const st = S.current;
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
  const onPointerUp = () => {
    const st = S.current;
    if (!st.drag) return;
    st.vel = performance.now() - st.drag.t < 90 ? clamp(st.drag.v, -rotateCount * 2, rotateCount * 2) : 0;
    st.drag = null;
    requestDraw();
  };
  const onKeyDown = (ev) => {
    const st = S.current;
    if (ev.key === "ArrowLeft" || ev.key === "ArrowRight") {
      if (st.e > 0) return;
      st.a += ev.key === "ArrowLeft" ? 2 : -2; ev.preventDefault(); requestDraw();
    } else if (ev.key === "e" || ev.key === "E" || ev.key === "Enter") { toggle(); ev.preventDefault(); }
    else if (ev.key === "Escape") { setPinnedId(null); }
  };

  // ---------- label geometry (from anchors.json, last explode frame) ----------
  const labelData = useMemo(() => {
    const last = meta?.explode?.frames?.[meta.explode.frames.length - 1];
    const mp = Object.fromEntries((meta?.parts || []).map((p) => [p.id, p]));
    return labels.map((p) => {
      const a = last?.anchors?.find((x) => x.id === p.id);
      const m = mp[p.id];
      if (!a || !m) return null;
      return { ...p, ax: a.x, ay: a.y, lx: m.label.x, ly: m.label.y, side: m.side || "r", color: m.color || "#ffc64a" };
    }).filter(Boolean);
  }, [meta, labels]);

  const active = labelData.find((p) => p.id === activeId) || null;
  useEffect(() => { onPartSelect?.(active); /* eslint-disable-next-line */ }, [activeId]);

  return (
    <div className={`gpux ${reduced ? "gpux--reduced" : ""} ${className}`}>
      <div
        ref={stageRef}
        className={`gpux-stage ${labelsOn ? "is-labelled" : ""}`}
        role="application"
        aria-label={`${title}: drag to rotate, press E to explode`}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <img className="gpux-poster" src={`${base}/poster.webp`} alt="" aria-hidden="true" draggable={false} />
        <canvas ref={canvasRef} className="gpux-canvas" />

        <svg className="gpux-leaders" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
          {labelData.map((p, i) => (
            <g key={p.id} className={`gpux-leader ${activeId === p.id ? "is-active" : ""}`} style={{ "--i": i }}>
              <line x1={p.ax * 1600} y1={p.ay * 900} x2={p.lx * 1600} y2={p.ly * 900} />
              <circle cx={p.ax * 1600} cy={p.ay * 900} r="9" className="ring" style={{ stroke: p.color }} />
              <circle cx={p.ax * 1600} cy={p.ay * 900} r="3.6" style={{ fill: p.color }} />
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
              aria-describedby={activeId === p.id ? "gpux-desc" : undefined}
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


        {!ready && (
          <div className="gpux-loader" aria-live="polite">
            <div className="gpux-loader-bar"><i style={{ width: `${Math.round(progress * 100)}%` }} /></div>
            <span>Loading 3D view… {Math.round(progress * 100)}%</span>
          </div>
        )}
        {ready && explodeUI === 0 && !labelsOn && <div className="gpux-hint" aria-hidden="true">Drag to rotate</div>}
      </div>

      <div className={`gpux-desc ${labelsOn && active ? "is-on" : ""} ${labelsOn ? "is-labelled" : ""}`} id="gpux-desc" role="status" aria-live="polite">
        {active
          ? (<><strong style={{ color: active.color }}>{active.name}</strong><span>{active.desc}</span></>)
          : (<span className="gpux-desc-hint">Tap or hover a label to see what that part does.</span>)}
      </div>

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
    </div>
  );
}

export default GpuExplorer;
