/**
 * PanelCompare — TN vs VA vs IPS viewing-angle comparison for PCForge. Standalone React block (no other deps).
 * Three identical pre-rendered monitors (1600x900 three.js PBR frames, same studio as the Hardware Explorer)
 * driven by one shared angle; each screen shows the same test image through that panel type's viewing-angle model
 * (panelsData.js), drawn on a canvas that is perspective-mapped onto the screen of the current frame.
 *
 *   <PanelCompare />                                   uses PANEL_BASE_PATH (/PCFORGE/panel-compare/)
 *   <PanelCompare basePath="/x/panel-compare/" title="…" compact />
 *   ref handle: reset(), setAngle(deg, axis?), setAxis("h"|"v"), getState()
 * Frames load lazily when the block nears the viewport (pass `eager` to load immediately).
 * Styles: ./PanelCompare.css (all classes prefixed "pnlx-").
 */
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { PANEL_AXES, PANEL_BASE_PATH, PANEL_TITLE, PANEL_TYPES, applyPanel, panelResponse, panelTag } from "./panelsData.js";
import "./PanelCompare.css";

const pad3 = (i) => String(i).padStart(3, "0");
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const CW = 480, CH = 270;                       // screen canvas resolution (content is 16:9 like the panel)

// homography: unit square -> quad (CSS matrix3d), quad = [[x,y] TL, TR, BR, BL] in px
function quadMatrix(q, w, h) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1, g = (sx * dy2 - dx2 * sy) / den, hh = (dx1 * sy - sx * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + hh * x3, d = y1 - y0 + g * y1, e = y3 - y0 + hh * y3;
  // scale from canvas px to unit square
  const m = [a / w, d / w, 0, g / w, b / h, e / h, 0, hh / h, 0, 0, 1, 0, x0, y0, 0, 1];
  return `matrix3d(${m.map((v) => +v.toFixed(8)).join(",")})`;
}

const cache = new Map();     // basePath -> Promise<{manifest, frames:{h:[],v:[]}, src:ImageData}>
function loadSet(basePath, onProgress) {
  if (cache.has(basePath)) return cache.get(basePath);
  const p = (async () => {
    const manifest = await (await fetch(basePath + "manifest.json")).json();
    const img = (url) => new Promise((res, rej) => { const i = new Image(); i.decoding = "async"; i.onload = () => res(i); i.onerror = () => rej(new Error("failed " + url)); i.src = url; });
    const test = await img(basePath + manifest.testImage);
    const c = document.createElement("canvas"); c.width = CW; c.height = CH; const x = c.getContext("2d", { willReadFrequently: true });
    x.drawImage(test, 0, 0, CW, CH); const src = x.getImageData(0, 0, CW, CH);
    const urls = []; for (const ax of ["h", "v"]) for (let i = 0; i < manifest[ax].n; i++) urls.push([ax, i, `${basePath}${ax}/${pad3(i)}.webp`]);
    // head-on frame first, then outward, so the block is usable right away
    const mid = manifest.h.mid; urls.sort((A, B) => (A[0] === "h" ? Math.abs(A[1] - mid) : 100 + Math.abs(A[1] - manifest.v.mid)) - (B[0] === "h" ? Math.abs(B[1] - mid) : 100 + Math.abs(B[1] - manifest.v.mid)));
    const frames = { h: [], v: [] }; let done = 0;
    await Promise.all(urls.map(([ax, i, u]) => img(u).then((im) => { frames[ax][i] = im; onProgress && onProgress(++done / urls.length); })));
    return { manifest, frames, src };
  })();
  cache.set(basePath, p); p.catch(() => cache.delete(basePath));
  return p;
}

function Screen({ panel, resp, src, quad, frameW }) {
  const ref = useRef(null), img = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c || !src) return; const x = c.getContext("2d");
    if (!img.current) img.current = x.createImageData(CW, CH);
    applyPanel(resp, src, img.current, CW, CH); x.putImageData(img.current, 0, 0);
  }, [resp, src]);
  const tf = quad && frameW ? quadMatrix(quad.map(([u, v]) => [u * frameW, v * frameW * 9 / 16]), CW, CH) : "none";
  return (
    <div className="pnlx-screen" style={{ transform: tf, width: CW, height: CH }} data-panel={panel.id}>
      <canvas ref={ref} width={CW} height={CH} className="pnlx-canvas" />
      <i className="pnlx-glass" />
    </div>
  );
}

const PanelCompare = forwardRef(function PanelCompare({ basePath = PANEL_BASE_PATH, title = PANEL_TITLE, panels = PANEL_TYPES, className = "", onChange, eager = false }, ref) {
  const [data, setData] = useState(null), [prog, setProg] = useState(0), [err, setErr] = useState(null);
  const [axis, setAxisS] = useState("h"), [angle, setAngleS] = useState(0);
  const [tileW, setTileW] = useState(0);
  const stageRef = useRef(null), drag = useRef(null), rootRef = useRef(null);
  const [near, setNear] = useState(eager);
  // frames load only when the block comes near the viewport (it usually sits below the explorer)
  useEffect(() => { if (near) return; const el = rootRef.current; if (!el || typeof IntersectionObserver === "undefined") { setNear(true); return; }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setNear(true); io.disconnect(); } }, { rootMargin: "600px 0px" });
    io.observe(el); return () => io.disconnect(); }, [near]);
  const A = PANEL_AXES[axis];

  useEffect(() => { if (!near) return; let on = true; setData(null); setErr(null);
    loadSet(basePath, (p) => on && setProg(p)).then((d) => on && setData(d)).catch((e) => on && setErr(String(e.message || e)));
    return () => { on = false; }; }, [basePath, near]);
  useEffect(() => { const el = stageRef.current; if (!el) return; const ro = new ResizeObserver(() => setTileW(el.clientWidth)); ro.observe(el); setTileW(el.clientWidth); return () => ro.disconnect(); }, [data]);

  const setAngle = useCallback((deg, ax) => { const a = PANEL_AXES[ax || axis]; if (ax) setAxisS(ax); setAngleS(clamp(Math.round(deg * 2) / 2, a.min, a.max)); }, [axis]);
  const setAxis = useCallback((ax) => { setAxisS(ax); setAngleS(0); }, []);
  const reset = useCallback(() => { setAxisS("h"); setAngleS(0); }, []);
  const h = axis === "h" ? angle : 0, v = axis === "v" ? angle : 0;
  useImperativeHandle(ref, () => ({ reset, setAngle, setAxis, getState: () => ({ axis, angle, h, v, ready: !!data, frame: data ? fi : -1 }) }));
  useEffect(() => { onChange && onChange({ axis, angle, h, v }); }, [axis, angle]);   // eslint-disable-line react-hooks/exhaustive-deps

  const man = data && data.manifest;
  const fi = man ? clamp(Math.round((angle - man[axis].min) / man[axis].step), 0, man[axis].n - 1) : 0;
  const resps = useMemo(() => panels.map((p) => panelResponse(p.id, h, v)), [panels, h, v]);
  const crop = man ? man.crop : [0.18, 0.82, 0, 1];               // visible part of the 16:9 frame (x0,x1,y0,y1)
  const cw = crop[1] - crop[0], ch = crop[3] - crop[2];
  const frameW = tileW / cw;                                       // px width of the full frame inside a tile
  const aspect = `${(cw * 16).toFixed(3)} / ${(ch * 9).toFixed(3)}`;

  // drag-to-rotate on any monitor (horizontal drag in Horizontal mode, vertical drag in Vertical mode)
  const onDown = (e) => { if (e.button !== undefined && e.button !== 0) return; try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) { /* synthetic or already-released pointer */ } drag.current = { x: e.clientX, y: e.clientY, a: angle, w: e.currentTarget.clientWidth || 300 }; };
  const onMove = (e) => { const d = drag.current; if (!d) return; const px = axis === "h" ? e.clientX - d.x : d.y - e.clientY; setAngle(d.a + px * (180 / Math.max(240, d.w * 1.4)) * (axis === "h" ? 1 : 0.6)); };
  const onUp = () => { drag.current = null; };
  const onKey = (e) => { const k = e.key; if (k === "ArrowLeft" || k === "ArrowDown") { setAngle(angle - 2.5); e.preventDefault(); } else if (k === "ArrowRight" || k === "ArrowUp") { setAngle(angle + 2.5); e.preventDefault(); } else if (k === "0" || k === "Home") { setAngle(0); e.preventDefault(); } };
  const sideTxt = angle === 0 ? "head-on" : axis === "h" ? `${Math.abs(angle)}° ${angle > 0 ? "right" : "left"}` : `${Math.abs(angle)}° ${angle > 0 ? "above" : "below"}`;

  return (
    <section ref={rootRef} className={`pnlx ${className}`} aria-label={title}>
      <div className="pnlx-head">
        <h3 className="pnlx-title">{title}</h3>
        <p className="pnlx-sub">Same monitor, same picture, three panel types. Tilt the view to see how each one holds up off-axis.</p>
      </div>
      <div className="pnlx-controls">
        <div className="pnlx-seg" role="group" aria-label="Viewing axis">
          {Object.entries(PANEL_AXES).map(([k, a]) => <button key={k} type="button" className={axis === k ? "on" : ""} aria-pressed={axis === k} data-axis={k} onClick={() => setAxis(k)}>{a.label}</button>)}
        </div>
        <label className="pnlx-slider">
          <span className="pnlx-sr">Viewing angle</span>
          <input type="range" min={A.min} max={A.max} step={0.5} value={angle} onChange={(e) => setAngle(+e.target.value)}
            aria-valuetext={sideTxt} data-role="angle" />
        </label>
        <output className="pnlx-angle" data-role="readout">{angle > 0 ? "+" : ""}{angle}° <small>{sideTxt}</small></output>
        <button type="button" className="pnlx-reset" data-role="reset" onClick={reset}>Reset</button>
      </div>
      <div className="pnlx-grid">
        {panels.map((p, k) => (
          <figure key={p.id} className="pnlx-tile" data-panel={p.id}>
            <div className="pnlx-stage" ref={k === 0 ? stageRef : undefined} style={{ aspectRatio: aspect }} tabIndex={0}
              aria-label={`${p.name} monitor, ${sideTxt}. Drag or use the arrow keys to change the angle.`}
              onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onKey}>
              {data ? (
                <div className="pnlx-frame" style={{ width: frameW, height: frameW * 9 / 16, left: -crop[0] * frameW, top: -crop[2] * frameW * 9 / 16 }}>
                  <img className="pnlx-body" alt="" draggable={false} src={data.frames[axis][fi].src} />
                  <Screen panel={p} resp={resps[k]} src={data.src} quad={man[axis].corners[fi]} frameW={frameW} />
                </div>
              ) : (
                <div className="pnlx-loader">{err ? <span className="pnlx-err">{err}</span> : <><span>Loading…</span><span className="pnlx-bar"><i style={{ width: `${Math.round(prog * 100)}%` }} /></span></>}</div>
              )}
              <span className={`pnlx-badge pnlx-badge--${p.id}`}>{p.name}</span>
            </div>
            <figcaption className="pnlx-cap">
              <strong>{p.name} <span>· {p.full}</span></strong>
              <em data-role="tag">{panelTag(resps[k])}</em>
              <p>{p.caption}</p>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="pnlx-note">Simulated from typical behaviour of each panel family; real monitors vary by model, calibration and coatings.</p>
    </section>
  );
});

export default PanelCompare;
export { PANEL_BASE_PATH, PANEL_TYPES };
