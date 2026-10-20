/**
 * Labelled parts of the CPU explorer (AMD Ryzen 5 5600X, AM4 PGA, generic labels). Edit names/descriptions freely; the ids must
 * stay in sync with public/cpu-explorer/anchors.json (which holds where each label points in the frames).
 * `short` (optional) is used instead of `name` when the explorer is narrower than 560px.
 *
 *   import GpuExplorer from "./GpuExplorer.jsx";
 *   import { CPU_PARTS, CPU_BASE_PATH, CPU_TITLE } from "./cpuParts.js";
 *   <GpuExplorer basePath={CPU_BASE_PATH} labels={CPU_PARTS} title={CPU_TITLE} />
 */
import { explorerAssetPath } from "./GpuExplorer.jsx";

export const CPU_TITLE = "AMD Ryzen 5 5600X";
export const CPU_BASE_PATH = explorerAssetPath("cpu-explorer");   // -> /PCFORGE/cpu-explorer/

export const CPU_PARTS = [
  { id: "ihs",       name: "Integrated Heat Spreader (IHS)", short: "IHS",         desc: "The nickel-plated copper lid that protects the chips and spreads their heat evenly into the cooler mounted on top." },
  { id: "tim",       name: "Thermal Interface (Solder)",     short: "Solder TIM",  desc: "A thin soldered metal layer between the chips and the lid that carries heat out of the silicon far better than paste." },
  { id: "ccd",       name: "CPU Chiplet (CCD)",              short: "CCD",         desc: "The core chiplet that holds the processor cores and their cache, built as its own small piece of silicon." },
  { id: "iod",       name: "I/O Die",                                              desc: "A separate die that handles memory, PCIe and other connections, linking the core chiplet to the rest of the PC." },
  { id: "substrate", name: "Substrate",                                            desc: "The green layered circuit board the dies sit on. It fans their tiny connections out to the pins underneath." },
  { id: "pins",      name: "PGA Pins (AM4)",                 short: "AM4 Pins",    desc: "The grid of gold-plated pins on the underside that drops into the AM4 motherboard socket." },
  { id: "pin1",      name: "Pin 1 Indicator",                short: "Pin 1",       desc: "The gold triangle in one corner that lines up with the matching mark on the socket so the chip goes in the right way." },
];

export default CPU_PARTS;
