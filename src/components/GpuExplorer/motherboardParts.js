/**
 * Labelled parts of the motherboard explorer (Gigabyte B550M DS3H AC R2). Edit names/descriptions freely; the ids must
 * stay in sync with public/motherboard-explorer/anchors.json (which holds where each label points in the frames).
 * `short` (optional) is used instead of `name` when the explorer is narrower than 560px.
 *
 *   import GpuExplorer from "./GpuExplorer.jsx";
 *   import { MOTHERBOARD_PARTS, MOTHERBOARD_BASE_PATH, MOTHERBOARD_TITLE } from "./motherboardParts.js";
 *   <GpuExplorer basePath={MOTHERBOARD_BASE_PATH} labels={MOTHERBOARD_PARTS} title={MOTHERBOARD_TITLE} />
 */
import { explorerAssetPath } from "./GpuExplorer.jsx";

export const MOTHERBOARD_TITLE = "Gigabyte B550M DS3H AC R2";
export const MOTHERBOARD_BASE_PATH = explorerAssetPath("motherboard-explorer");   // -> /PCFORGE/motherboard-explorer/

export const MOTHERBOARD_PARTS = [
  { id: "cpu_socket",   name: "CPU Socket (AM4)",    short: "CPU Socket",  desc: "The 1331-hole AM4 socket that holds a Ryzen processor; the lever clamps the CPU's pins in place." },
  { id: "vrm_heatsink", name: "VRM Heatsink",                              desc: "An aluminium block over the CPU's power stages that soaks up their heat so the voltage stays clean under load." },
  { id: "chipset",      name: "Chipset (B550)",      short: "Chipset",     desc: "AMD's B550 hub chip: it runs the extra USB, SATA and PCIe lanes and links them to the CPU." },
  { id: "ram_slots",    name: "RAM Slots (DDR4 ×4)", short: "RAM Slots",   desc: "Four DDR4 DIMM slots in dual channel, for up to 128 GB of memory; the latches lock each stick in." },
  { id: "pcie_x16",     name: "PCIe x16 Slot",       short: "PCIe x16",    desc: "The full-length slot wired straight to the CPU, where the graphics card plugs in (PCIe 4.0 x16)." },
  { id: "m2_slots",     name: "M.2 SSD Slots",       short: "M.2 Slots",   desc: "Two M.2 sockets for NVMe SSDs that lie flat on the board: one runs off the CPU, one off the chipset." },
  { id: "atx_24pin",    name: "24-Pin ATX Power",    short: "24-Pin ATX",  desc: "The main power input from the PSU, feeding 12 V, 5 V and 3.3 V to the board, RAM and slots." },
  { id: "cpu_8pin",     name: "8-Pin CPU Power",     short: "8-Pin CPU",   desc: "A dedicated 12 V input from the PSU that the VRM converts into the processor's core voltage." },
  { id: "rear_io",      name: "Rear I/O Ports",      short: "Rear I/O",    desc: "The ports at the back of the case: USB, HDMI and DisplayPort, Gigabit LAN, Wi-Fi antennas and audio jacks." },
  { id: "sata_ports",   name: "SATA Ports",                                desc: "Four right-angle SATA 6 Gb/s connectors for 2.5\" SSDs, hard drives and optical drives." },
  { id: "cmos_battery", name: "CMOS Battery",        short: "CMOS",        desc: "A CR2032 coin cell that keeps the BIOS settings and the real-time clock alive while the PC is unplugged." },
];

export default MOTHERBOARD_PARTS;
