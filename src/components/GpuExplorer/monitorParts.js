/**
 * Labelled parts of the monitor explorer (Gigabyte gaming monitor, generic labels). Edit names/descriptions freely; the ids must
 * stay in sync with public/monitor-explorer/anchors.json (which holds where each label points in the frames).
 * `short` (optional) is used instead of `name` when the explorer is narrower than 560px.
 *
 *   import GpuExplorer from "./GpuExplorer.jsx";
 *   import { MONITOR_PARTS, MONITOR_BASE_PATH, MONITOR_TITLE } from "./monitorParts.js";
 *   <GpuExplorer basePath={MONITOR_BASE_PATH} labels={MONITOR_PARTS} title={MONITOR_TITLE} />
 */
import { explorerAssetPath } from "./GpuExplorer.jsx";

export const MONITOR_TITLE = "Gigabyte Gaming Monitor";
export const MONITOR_BASE_PATH = explorerAssetPath("monitor-explorer");   // -> /PCFORGE/monitor-explorer/

export const MONITOR_PARTS = [
  { id: "panel", name: "Display Panel",            short: "Panel",      desc: "The flat 16:9 screen itself: an LCD panel with a backlight that produces the picture. It sits behind a glossy front surface." },
  { id: "bezel", name: "Thin Bezel",               short: "Bezel",      desc: "The slim frame around the screen, with a slightly deeper bottom edge that carries the logo and power LED." },
  { id: "back",  name: "Back Cover",               short: "Back Cover", desc: "The plastic rear housing that encloses the electronics and power board. It has vent slits along the top to let heat out." },
  { id: "vesa",  name: "VESA Mount",               short: "VESA",       desc: "A standard 100 x 100 mm mounting plate. It lets the screen clip onto the stand or onto a wall or arm mount instead." },
  { id: "neck",  name: "Height-Adjustable Stand",  short: "Stand",      desc: "The upright column of the stand. The screen slides up and down it so you can set a comfortable viewing height." },
  { id: "cable", name: "Cable Management",         short: "Cables",     desc: "An opening through the stand column that gathers the power and video cables so they run neatly down the back." },
  { id: "base",  name: "Stand Base",               short: "Base",       desc: "The weighted V-shaped feet that keep the monitor stable on the desk while taking up little space." },
  { id: "io",    name: "I/O Ports",                short: "Ports",      desc: "Downward-facing video and USB ports under the back cover, where the PC, power and accessories plug in." },
];

export default MONITOR_PARTS;
