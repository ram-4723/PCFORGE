/**
 * Labelled parts of the AIO liquid cooler explorer (Aorus/Gigabyte 360 mm AIO, generic labels). Edit names/descriptions freely; the ids must
 * stay in sync with public/aio-explorer/anchors.json (which holds where each label points in the frames).
 * `short` (optional) is used instead of `name` when the explorer is narrower than 560px.
 *
 *   import GpuExplorer from "./GpuExplorer.jsx";
 *   import { AIO_PARTS, AIO_BASE_PATH, AIO_TITLE } from "./aioParts.js";
 *   <GpuExplorer basePath={AIO_BASE_PATH} labels={AIO_PARTS} title={AIO_TITLE} />
 */
import { explorerAssetPath } from "./GpuExplorer.jsx";

export const AIO_TITLE = "Aorus 360 mm AIO Liquid Cooler";
export const AIO_BASE_PATH = explorerAssetPath("aio-explorer");   // -> /PCFORGE/aio-explorer/

export const AIO_PARTS = [
  { id: "lcd",      name: "Pump Head LCD",             short: "Pump LCD",   desc: "A round screen on the pump cap that can show live readouts such as CPU temperature, framed by an ARGB light ring." },
  { id: "pump",     name: "Pump Block and Cold Plate", short: "Pump Block", desc: "The pump that circulates the coolant, sitting on a copper cold plate that touches the CPU and draws its heat into the liquid." },
  { id: "bracket",  name: "Mounting Bracket",          short: "Bracket",    desc: "The cross-shaped bracket and thumb screws that hold the pump block down firmly onto the CPU socket." },
  { id: "tubes",    name: "Coolant Tubes",             short: "Tubes",      desc: "Two flexible, braided-sleeve hoses that carry warm coolant to the radiator and cooled coolant back to the pump." },
  { id: "fittings", name: "Fittings",                                       desc: "Swivel connectors where the tubes join the radiator and the pump block, sealed so the loop never needs refilling." },
  { id: "fans",     name: "ARGB Fans (x3)",            short: "Fans (x3)",  desc: "Three 120 mm fans with addressable pink and cyan lighting that push air through the radiator fins." },
  { id: "rad",      name: "Radiator (360mm)",          short: "Radiator",   desc: "A 360 mm long finned heat exchanger. Coolant flows through thin channels while the fans blow the heat away." },
];

export default AIO_PARTS;
