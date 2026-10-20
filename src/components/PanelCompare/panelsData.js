/**
 * Data + viewing-angle model for the PCForge panel-technology comparison (<PanelCompare/>). Self-contained: no imports.
 *
 *   import PanelCompare from "./PanelCompare.jsx";
 *   import { PANEL_BASE_PATH } from "./panelsData.js";
 *   <PanelCompare basePath={PANEL_BASE_PATH} />
 *
 * The frame folder (public/panel-compare/) holds manifest.json, test-image.webp, h/000-060.webp (−75…+75° turn) and
 * v/000-036.webp (−45…+45°, viewer below → above), all 1600x900 renders of the same monitor with a black screen.
 * The screen content is drawn live on a canvas through panelResponse() below.
 *
 * The model is illustrative, not a measurement of any product: it reproduces the textbook behaviour of each
 * liquid-crystal family (shape and direction of the shift), with exaggeration kept moderate.
 */

// Vite injects import.meta.env.BASE_URL ("/PCFORGE/" on GitHub Pages). Guarded so the file also runs without Vite.
let ENV_BASE = "/";
try { ENV_BASE = (import.meta && import.meta.env && import.meta.env.BASE_URL) || "/"; } catch (e) { /* not a Vite build */ }
export const PANEL_BASE_PATH = `${ENV_BASE.replace(/\/?$/, "/")}panel-compare/`;   // -> /PCFORGE/panel-compare/
export const PANEL_TITLE = "Panel technology: TN vs VA vs IPS";

export const PANEL_TYPES = [
  { id: "tn",  name: "TN",  full: "Twisted Nematic",
    caption: "Fast and affordable, but the picture changes quickly off-axis: colours shift and wash out to the sides, and from below the image darkens and inverts. Vertical angles are the weak spot." },
  { id: "va",  name: "VA",  full: "Vertical Alignment",
    caption: "The deepest blacks and highest contrast head-on. Off-axis the gamma shifts: dark and mid tones lift, shadows look washed out and colours lose some punch." },
  { id: "ips", name: "IPS", full: "In-Plane Switching",
    caption: "The most consistent colour from any angle. Blacks are a little greyer head-on, and dark scenes show a soft silvery 'IPS glow' toward the far corners at steep angles." },
];

/** Axis ranges (degrees) that the pre-rendered frames cover. */
export const PANEL_AXES = {
  h: { label: "Horizontal", min: -75, max: 75, step: 2.5 },
  v: { label: "Vertical", min: -45, max: 45, step: 2.5 },
};

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/**
 * Viewing-angle response of one panel type.
 * h: horizontal angle (deg, + = viewer to the right of the screen normal), v: vertical angle (deg, + = viewer above).
 * Returns per-channel 256-entry lookup tables plus the per-pixel terms (saturation, glow) PanelCompare applies.
 */
export function panelResponse(id, h = 0, v = 0) {
  const sh = clamp01(Math.abs(h) / 75), sv = clamp01(Math.abs(v) / 45);
  const s = clamp01(Math.hypot(sh, sv));
  let gamma = 1, black = 0, gain = [1, 1, 1], sat = 1, inv = 0, invTint = [1, 1, 1], glow = 0, glowTint = [1, 1, 1];
  if (id === "tn") {
    black = 0.03;                                                   // modest contrast even head-on
    gamma *= 1 - 0.42 * Math.pow(sh, 1.2);                          // sideways: mids wash out…
    black += 0.13 * Math.pow(sh, 1.4);
    const y = 1 - 0.28 * sh * sh;                                   // …with a yellow-green cast and some dimming
    gain = [y * (1 + 0.07 * sh), y * (1 + 0.05 * sh), y * (1 - 0.24 * sh)];
    sat *= 1 - 0.40 * sh;
    if (v > 0) {                                                    // from above: strongly washed out, bluish
      gamma *= 1 - 0.55 * Math.pow(sv, 1.15); black += 0.20 * Math.pow(sv, 1.4); sat *= 1 - 0.45 * sv;
      gain = gain.map((g, i) => g * [0.95, 1.0, 1.10][i]);
    } else if (v < 0) {                                             // from below: darkens, then the grey scale inverts
      gamma *= 1 + 1.7 * sv; sat *= 1 - 0.3 * sv;
      inv = 0.92 * sstep(0.22, 0.75, sv); invTint = [1.05, 0.93, 0.66];
    }
  } else if (id === "va") {
    black = 0.003;                                                  // near-black head-on (deep blacks)
    gamma = 1.06 - 0.50 * Math.pow(s, 1.25);                        // slight shadow crush head-on, then gamma shift
    black += 0.075 * Math.pow(s, 1.6);                              // washed-out darks
    const y = 1 - 0.22 * s * s; gain = [y, y, y * (1 + 0.02 * s)];
    sat = 1 - 0.30 * Math.pow(s, 1.4);
  } else {                                                          // ips
    black = 0.022 + 0.006 * s;
    gamma = 1 - 0.07 * s;
    const y = 1 - 0.16 * s * s; gain = [y, y, y];
    sat = 1 - 0.06 * s;
    glow = 0.20 * Math.pow(s, 1.7); glowTint = [1.0, 0.96, 0.88];  // IPS glow, visible on dark content only
  }
  const lut = [new Uint8ClampedArray(256), new Uint8ClampedArray(256), new Uint8ClampedArray(256)];
  for (let i = 0; i < 256; i++) {
    const x = i / 255, p = Math.pow(x, gamma);
    for (let c = 0; c < 3; c++) {
      let o = black + (1 - black) * p * gain[c];
      if (inv > 0) o = o * (1 - inv) + inv * (0.06 + 0.62 * Math.pow(1 - x, 1.25)) * invTint[c];
      lut[c][i] = Math.round(clamp01(o) * 255);
    }
  }
  return { id, h, v, lut, sat, glow, glowTint, inv, s };
}

/** Qualitative live tag for the caption (derived from the model, not a measurement). */
export function panelTag(r) {
  if (r.inv > 0.45) return "Image inverting";
  if (r.s < 0.12) return "On-axis: reference picture";
  if (r.id === "tn") return r.s > 0.45 ? "Strong colour shift" : "Colour shifting";
  if (r.id === "va") return r.s > 0.5 ? "Shadows washed out" : "Gamma shifting";
  return r.s > 0.55 ? "Colour stable, IPS glow on darks" : "Colour stable";
}

/** Applies a panelResponse to ImageData (in place, from the untouched source pixels). */
export function applyPanel(r, src, dst, w, h) {
  const [L0, L1, L2] = r.lut, S = r.sat, G = r.glow;
  const s = src.data, d = dst.data;
  // IPS glow is strongest toward the side of the screen farthest from the viewer (left edge when viewed from the right; bottom when viewed from above)
  const wx = new Float32Array(w), wy = new Float32Array(h);
  const hx = Math.sign(r.h) || 0, vy = Math.sign(r.v) || 0, ah = Math.abs(r.h) / 75, av = Math.abs(r.v) / 45, tot = ah + av + 1e-6;
  for (let x = 0; x < w; x++) { const u = x / (w - 1); const far = hx > 0 ? 1 - u : hx < 0 ? u : 0.5; wx[x] = 0.25 + 0.75 * far * far; }
  for (let y = 0; y < h; y++) { const u = y / (h - 1); const far = vy > 0 ? u : vy < 0 ? 1 - u : 0.5; wy[y] = 0.25 + 0.75 * far * far; }
  const gt = r.glowTint;
  for (let y = 0, i = 0; y < h; y++) {
    for (let x = 0; x < w; x++, i += 4) {
      const R = s[i], Gi = s[i + 1], B = s[i + 2];
      let r0 = L0[R], g0 = L1[Gi], b0 = L2[B];
      if (S < 0.999) { const l = 0.2126 * r0 + 0.7152 * g0 + 0.0722 * b0; r0 = l + (r0 - l) * S; g0 = l + (g0 - l) * S; b0 = l + (b0 - l) * S; }
      if (G > 0) {
        const dk = 1 - (0.2126 * R + 0.7152 * Gi + 0.0722 * B) / 255, wgt = (wx[x] * ah + wy[y] * av) / tot;
        const a = G * wgt * dk * dk * 255; r0 += a * gt[0]; g0 += a * gt[1]; b0 += a * gt[2];
      }
      d[i] = r0; d[i + 1] = g0; d[i + 2] = b0; d[i + 3] = 255;
    }
  }
}

export default PANEL_TYPES;
