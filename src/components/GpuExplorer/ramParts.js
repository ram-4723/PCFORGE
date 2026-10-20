/**
 * Labelled parts of the memory explorer (Gigabyte DDR4 DIMM, generic labels). Edit names/descriptions freely; the ids must
 * stay in sync with public/ram-explorer/anchors.json (which holds where each label points in the frames).
 * `short` (optional) is used instead of `name` when the explorer is narrower than 560px.
 *
 *   import GpuExplorer from "./GpuExplorer.jsx";
 *   import { RAM_PARTS, RAM_BASE_PATH, RAM_TITLE } from "./ramParts.js";
 *   <GpuExplorer basePath={RAM_BASE_PATH} labels={RAM_PARTS} title={RAM_TITLE} />
 */
import { explorerAssetPath } from "./GpuExplorer.jsx";

export const RAM_TITLE = "Gigabyte DDR4 Memory";
export const RAM_BASE_PATH = explorerAssetPath("ram-explorer");   // -> /PCFORGE/ram-explorer/

export const RAM_PARTS = [
  { id: "spreader", name: "Heat Spreader",                          desc: "Two brushed metal covers that clip over both sides of the module, protecting the chips and spreading their heat out to the air." },
  { id: "pads",     name: "Thermal Pads",                           desc: "Soft pads between the chips and the spreader that fill the tiny air gaps so heat can flow into the metal." },
  { id: "dram",     name: "DRAM Chips",                             desc: "The memory chips that hold your data while the PC is running. They sit on both sides of the board." },
  { id: "pcb",      name: "PCB",                                    desc: "The green circuit board that connects every memory chip to the contacts along the bottom edge." },
  { id: "spd",      name: "SPD Chip",                               desc: "A tiny chip that tells the motherboard how the module is set up, so the system can configure it at boot." },
  { id: "contacts", name: "Gold Edge Contacts", short: "Contacts",  desc: "The row of gold-plated fingers that press into the motherboard's memory slot to carry power and signals." },
  { id: "notch",    name: "Key Notch",                              desc: "An off-centre gap in the contact edge that matches the ridge in the slot, so the module only fits one way round." },
];

export default RAM_PARTS;
