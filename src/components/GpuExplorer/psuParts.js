/**
 * Labelled parts of the power supply explorer (Gigabyte P550B, generic labels). Edit names/descriptions freely; the ids must
 * stay in sync with public/psu-explorer/anchors.json (which holds where each label points in the frames).
 * `short` (optional) is used instead of `name` when the explorer is narrower than 560px.
 *
 *   import GpuExplorer from "./GpuExplorer.jsx";
 *   import { PSU_PARTS, PSU_BASE_PATH, PSU_TITLE } from "./psuParts.js";
 *   <GpuExplorer basePath={PSU_BASE_PATH} labels={PSU_PARTS} title={PSU_TITLE} />
 */
import { explorerAssetPath } from "./GpuExplorer.jsx";

export const PSU_TITLE = "Gigabyte P550B Power Supply";
export const PSU_BASE_PATH = explorerAssetPath("psu-explorer");   // -> /PCFORGE/psu-explorer/

export const PSU_PARTS = [
  { id: "fan",      name: "120mm Fan",                 short: "Fan",        desc: "A 120 mm fan that pulls cool air in through the grille and pushes it across the components and out the rear vent." },
  { id: "grille",   name: "Fan Grille",                short: "Grille",     desc: "The slotted steel guard over the fan, part of the removable cover. It keeps fingers and cables out of the blades." },
  { id: "housing",  name: "Steel Housing",             short: "Housing",    desc: "The black powder-coated steel box that encloses and shields the electronics and mounts to the PC case." },
  { id: "ac",       name: "AC Inlet & Power Switch",   short: "AC & Switch",desc: "Where the wall power cable plugs in, next to the rocker switch that turns the power supply fully on or off." },
  { id: "vent",     name: "Rear Honeycomb Vent",       short: "Rear Vent",  desc: "A hexagonal mesh in the rear wall that lets the warm air out of the case while keeping the housing rigid." },
  { id: "pcb",      name: "Internal PCB & Capacitors", short: "PCB & Caps", desc: "The circuit board that converts mains AC into the low DC voltages a PC uses, with large bulk capacitors that smooth the supply." },
  { id: "heatsink", name: "Heatsinks",                                      desc: "Finned aluminium bars that the power transistors and diodes are bolted to, so their heat spreads into the airflow." },
  { id: "cables",   name: "Cable Bundle",              short: "Cables",     desc: "The fixed (non-modular) bundle of power leads for the motherboard, CPU, graphics card and drives." },
];

export default PSU_PARTS;
