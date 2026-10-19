/**
 * Labelled parts of the GPU explorer. Edit names/descriptions freely; the ids must stay in sync with
 * public/gpu-explorer/anchors.json (which holds where each label points in the frames).
 * `short` (optional) is used instead of `name` when the explorer is narrower than 560px.
 */
export const GPU_PARTS = [
  { id: "shroud",    name: "Shroud",                    desc: "The outer cover that frames the fans, channels their airflow through the heatsink and protects the board." },
  { id: "fans",      name: "Fans",                      desc: "Three axial fans push cool air down through the fin stack; the middle one spins the opposite way to cut turbulence." },
  { id: "heatsink",  name: "Heatsink",                  desc: "A dense stack of thin aluminium fins that spreads the heat over a large surface for the airflow to carry away." },
  { id: "heatpipes", name: "Heat Pipes",                desc: "Sealed copper pipes whose internal fluid boils at the GPU and condenses in the fins, moving heat very quickly." },
  { id: "pcb",       name: "PCB (Circuit Board)",       desc: "The multi-layer printed circuit board whose copper traces connect the GPU, video memory and power circuitry." },
  { id: "gpu",       name: "GPU Chip",                  desc: "The graphics processor die: thousands of parallel cores that render each frame and run compute workloads." },
  { id: "vrm",       name: "VRM",                       desc: "Voltage regulator module: power stages and chokes that step the 12 V input down to the ~1 V the GPU core runs on." },
  { id: "pcie",      name: "PCIe Connector",            desc: "The x16 edge connector that plugs into the motherboard slot for data and supplies up to 75 W." },
  { id: "power",     name: "8-Pin Power Connector",     short: "8-Pin Power",   desc: "Supplemental PCIe power input from the power supply, rated for up to 150 W." },
  { id: "ports",     name: "Display Ports (DP + HDMI)", short: "Display Ports", desc: "DisplayPort and HDMI outputs on the I/O bracket that carry the video signal to your monitors." },
];

export default GPU_PARTS;
