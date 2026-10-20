/**
 * Labelled parts of the SSD explorer (Gigabyte NVMe SSD 1TB, M.2 2280, GP-GSM2NE3100TNTD). Edit names/descriptions freely;
 * the ids must stay in sync with public/ssd-explorer/anchors.json (which holds where each label points in the frames).
 * `short` (optional) is used instead of `name` when the explorer is narrower than 560px.
 *
 *   import GpuExplorer from "./GpuExplorer.jsx";
 *   import { SSD_PARTS, SSD_BASE_PATH, SSD_TITLE } from "./ssdParts.js";
 *   <GpuExplorer basePath={SSD_BASE_PATH} labels={SSD_PARTS} title={SSD_TITLE} />
 */
import { explorerAssetPath } from "./GpuExplorer.jsx";

export const SSD_TITLE = "Gigabyte NVMe SSD 1TB (M.2 2280)";
export const SSD_BASE_PATH = explorerAssetPath("ssd-explorer");   // -> /PCFORGE/ssd-explorer/

export const SSD_PARTS = [
  { id: "label",      name: "Heat-Spreader Label", short: "Label",      desc: "The printed sticker on top of the chips. Its foil backing spreads heat from the flash and controller across the drive." },
  { id: "nand",       name: "NAND Flash",                                desc: "The memory chips that store your data. They keep it with the power off, and together hold the full 1 TB." },
  { id: "controller", name: "SSD Controller",      short: "Controller", desc: "The drive's processor: it talks NVMe to the PC, spreads writes evenly across the flash and corrects errors." },
  { id: "pcb",        name: "PCB",                                       desc: "The circuit board (22 × 80 mm, hence \"2280\") whose copper traces connect the chips to the connector." },
  { id: "notch",      name: "Mounting Notch",      short: "Notch",      desc: "The half-round cut-out where a single screw or latch holds the drive flat against the motherboard." },
  { id: "connector",  name: "M.2 M-Key Connector", short: "M.2 M-Key",  desc: "The gold edge contacts that plug into the M.2 slot. The M-key gap marks a PCIe x4 slot, which NVMe drives use." },
];

export default SSD_PARTS;
