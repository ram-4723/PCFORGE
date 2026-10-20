/**
 * Labelled parts of the case explorer (Gigabyte glass-panel ATX mid-tower). Edit names/descriptions freely; the ids must
 * stay in sync with public/case-explorer/anchors.json (which holds where each label points in the frames).
 * `short` (optional) is used instead of `name` when the explorer is narrower than 560px.
 *
 *   import GpuExplorer from "./GpuExplorer.jsx";
 *   import { CASE_PARTS, CASE_BASE_PATH, CASE_TITLE } from "./caseParts.js";
 *   <GpuExplorer basePath={CASE_BASE_PATH} labels={CASE_PARTS} title={CASE_TITLE} />
 */
import { explorerAssetPath } from "./GpuExplorer.jsx";

export const CASE_TITLE = "Gigabyte ATX Mid-Tower Case (tempered glass)";
export const CASE_BASE_PATH = explorerAssetPath("case-explorer");   // -> /PCFORGE/case-explorer/

export const CASE_PARTS = [
  { id: "glass",  name: "Tempered Glass Side Panel", short: "Glass Panel",  desc: "A tinted, toughened-glass side that shows off the build inside. It lifts off so you can get at the components." },
  { id: "front",  name: "Front Mesh Panel",          short: "Front Mesh",   desc: "A perforated front that lets the intake fans pull in plenty of cool air while hiding the fans behind it." },
  { id: "ffans",  name: "ARGB Front Fans",           short: "Front Fans",   desc: "Three 120 mm intake fans with addressable RGB rings. They push fresh air across the GPU and motherboard." },
  { id: "rfan",   name: "Rear ARGB Fan",             short: "Rear Fan",     desc: "A 120 mm exhaust fan behind the CPU area that pushes warm air out of the back of the case." },
  { id: "filter", name: "Top Dust Filter",           short: "Top Filter",   desc: "A removable fine mesh over the roof's fan and radiator mounts that keeps dust out and lifts off for cleaning." },
  { id: "io",     name: "Front I/O Panel",           short: "Front I/O",    desc: "The power button plus the USB and audio ports on top of the case, wired to headers on the motherboard." },
  { id: "shroud", name: "PSU Shroud",                                        desc: "A steel cover over the power supply and spare cables in the bottom of the case, so the build looks tidy through the glass." },
  { id: "slots",  name: "Expansion Slots",           short: "Exp. Slots",   desc: "Seven slot openings in the rear wall where the graphics card and other add-in cards are screwed in place." },
];

export default CASE_PARTS;
