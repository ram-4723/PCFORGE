import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CircuitBoard, Cpu, Database, Fan, Gauge, Layers2, MemoryStick, Monitor, RotateCcw, ScanLine, Tag, Zap } from 'lucide-react'
import GpuExplorer from './GpuExplorer/GpuExplorer.jsx'
import { MOTHERBOARD_BASE_PATH, MOTHERBOARD_PARTS, MOTHERBOARD_TITLE } from './GpuExplorer/motherboardParts.js'
import { RAM_BASE_PATH, RAM_PARTS, RAM_TITLE } from './GpuExplorer/ramParts.js'
import { CPU_BASE_PATH, CPU_PARTS, CPU_TITLE } from './GpuExplorer/cpuParts.js'
import { PSU_BASE_PATH, PSU_PARTS, PSU_TITLE } from './GpuExplorer/psuParts.js'
import { AIO_BASE_PATH, AIO_PARTS, AIO_TITLE } from './GpuExplorer/aioParts.js'
import { MONITOR_BASE_PATH, MONITOR_PARTS, MONITOR_TITLE } from './GpuExplorer/monitorParts.js'
import { CASE_BASE_PATH, CASE_PARTS, CASE_TITLE } from './GpuExplorer/caseParts.js'
import { SSD_BASE_PATH, SSD_PARTS, SSD_TITLE } from './GpuExplorer/ssdParts.js'
import { GPU_PARTS } from './GpuExplorer/parts.js'

const frameExplorers = {
  motherboard: { basePath: MOTHERBOARD_BASE_PATH, labels: MOTHERBOARD_PARTS, title: MOTHERBOARD_TITLE },
  cpu: { basePath: CPU_BASE_PATH, labels: CPU_PARTS, title: CPU_TITLE },
  ram: { basePath: RAM_BASE_PATH, labels: RAM_PARTS, title: RAM_TITLE },
  gpu: { labels: GPU_PARTS, title: 'Gigabyte GeForce RTX Gaming OC' },
  ssd: { basePath: SSD_BASE_PATH, labels: SSD_PARTS, title: SSD_TITLE },
  psu: { basePath: PSU_BASE_PATH, labels: PSU_PARTS, title: PSU_TITLE },
  case: { basePath: CASE_BASE_PATH, labels: CASE_PARTS, title: CASE_TITLE },
  aio: { basePath: AIO_BASE_PATH, labels: AIO_PARTS, title: AIO_TITLE },
  monitor: { basePath: MONITOR_BASE_PATH, labels: MONITOR_PARTS, title: MONITOR_TITLE },
}

const parts = [
  { id: 'motherboard', name: 'Motherboard', Icon: CircuitBoard, tag: '01' },
  { id: 'cpu', name: 'Processor', Icon: Cpu, tag: '02' },
  { id: 'ram', name: 'Memory', Icon: MemoryStick, tag: '03' },
  { id: 'gpu', name: 'Graphics card', Icon: Gauge, tag: '04' },
  { id: 'ssd', name: 'SSD storage', Icon: Database, tag: '05' },
  { id: 'psu', name: 'Power supply', Icon: Zap, tag: '06' },
  { id: 'case', name: 'Case and airflow', Icon: ScanLine, tag: '07' },
  { id: 'cooling', name: 'CPU cooling', Icon: Fan, tag: '08' },
  { id: 'aio', name: 'AIO liquid cooler', Icon: Fan, tag: '09' },
  { id: 'monitor', name: 'Monitor', Icon: Monitor, tag: '10' },
]

const callouts = {
  motherboard: [['CPU socket', 'The socket secures the processor and carries its electrical connections.', 405, 206], ['DIMM slots', 'Memory modules click into these parallel slots. Match the board’s supported memory generation.', 525, 211], ['PCIe x16', 'The long reinforced slot usually hosts a graphics card.', 424, 360], ['M.2 storage', 'This compact connector accepts an M.2 SSD; supported lengths and interfaces vary by board.', 327, 330], ['VRM heatsink', 'Heatsinks help dissipate heat from the circuitry that regulates CPU power.', 267, 213], ['24-pin power', 'The main power connector supplies the motherboard from the PSU.', 552, 273]],
  cpu: [['Heat spreader', 'The metal lid spreads heat from the silicon beneath it toward the cooler.', 405, 251], ['Contact pads', 'Electrical contacts connect the processor to its matching motherboard socket.', 407, 350], ['Socket', 'CPU and motherboard socket must match; chipset and firmware support also matter.', 405, 403]],
  ram: [['Memory chips', 'DRAM chips hold data the system is actively using; capacity affects multitasking headroom.', 410, 242], ['Gold contacts', 'The edge connector mates with a compatible DIMM slot. DDR generations are not interchangeable.', 410, 392], ['Heat spreader', 'The outer shell protects the module and can help move heat away from its chips.', 410, 205]],
  gpu: [['Cooling fans', 'Fans push air through the card’s heatsink when its cooling system needs it.', 377, 268], ['GPU shroud', 'The shroud directs airflow around the card’s heatsink and protects the assembly.', 406, 208], ['PCIe connector', 'The card plugs into a compatible PCIe expansion slot on the motherboard.', 402, 398]],
  storage: [['NAND flash', 'Non-volatile memory stores files without power. Capacity and endurance vary by drive.', 392, 237], ['Controller', 'The controller manages data movement between the host and flash memory.', 435, 306], ['M.2 edge', 'The connector must match the board slot; keying, length and SATA/NVMe support matter.', 399, 379]],
  psu: [['PSU fan', 'The fan moves air through the power supply when its thermal controls call for it.', 410, 200], ['Modular sockets', 'Connect only the cables supplied for this exact PSU model; modular cables are not universal.', 520, 332], ['Power leads', 'Use the correct motherboard, CPU and GPU connectors for the selected components.', 367, 378]],
  case: [['Intake fans', 'Front or bottom intake brings cool air into the enclosure.', 282, 260], ['Exhaust fans', 'Rear or top exhaust helps carry warmed air out of the case.', 500, 200], ['Clearance', 'Check GPU length, cooler height, radiator support and motherboard form factor.', 401, 326]],
  cooling: [['Fan', 'The fan pushes air through the heatsink fins to carry heat away.', 405, 187], ['Fin stack', 'Closely spaced fins increase surface area for heat to transfer into moving air.', 405, 286], ['Heat pipes', 'Heat pipes move energy from the CPU contact plate into the fin stack.', 405, 370]],
}

function Board({ technical, active }) {
  return <g className={`model-board ${technical ? 'technical' : ''} ${active}`}>
    <path className="board-outline" d="M177 147h347l35 32v234l-26 25H177l-23-24V171z" />
    <path className="board-inset" d="M190 160h327l22 22v217l-20 20H187l-18-19V175z" />
    {Array.from({ length: 13 }, (_, i) => <path key={i} className="trace" d={`M${190 + i * 15} 177v${30 + (i % 4) * 12}h${36 + (i % 3) * 17}v${28 + (i % 3) * 18}`} />)}
    <rect className="heatsink" x="206" y="185" width="48" height="111" rx="5" />{Array.from({ length: 5 }, (_, i) => <path key={i} className="fin" d={`M${215 + i * 8} 192v96`} />)}
    <rect className="cpu-socket" x="353" y="195" width="102" height="103" rx="5" /><rect className="cpu-lid" x="364" y="206" width="80" height="81" rx="5" />
    {[0, 1, 2, 3].map(i => <g key={i}><rect className="dimm" x={478 + (i % 2) * 19} y={188 + Math.floor(i / 2) * 99} width="13" height="88" rx="2" /><path className="gold-line" d={`M${481 + (i % 2) * 19} ${264 + Math.floor(i / 2) * 99}v8`} /></g>)}
    <rect className="pcie" x="264" y="333" width="244" height="14" rx="3" /><rect className="pcie-short" x="288" y="362" width="171" height="10" rx="3" />
    <rect className="m2" x="319" y="312" width="111" height="11" rx="2" /><circle className="cap" cx="284" cy="210" r="8" /><circle className="cap" cx="302" cy="210" r="8" /><circle className="cap" cx="282" cy="238" r="8" /><rect className="chip" x="277" y="387" width="44" height="26" rx="3" />
    <rect className="io" x="168" y="184" width="18" height="108" rx="2" />
    <path className="gold-line" d="M514 263h22v18h-22M191 421h52m12 0h17m165-5h53" />
    <circle className="led" cx="532" cy="410" r="3" /><circle className="led led-gold" cx="519" cy="410" r="3" />
  </g>
}

function Model({ id, technical, exploded }) {
  if (id === 'motherboard') return <Board technical={technical} active={exploded ? 'exploded' : ''} />
  if (id === 'cpu') return <g className={`model-generic ${exploded ? 'exploded' : ''}`}><ellipse className="shadow" cx="405" cy="365" rx="151" ry="26"/><path className="metal-base" d="M270 222l34-34h201l34 34v128l-34 34H304l-34-34z"/><path className="metal-edge" d="M270 222l35 27h199l35-27v128l-35-27H305l-35 27z"/><rect className="chip-base" x="315" y="220" width="180" height="146" rx="9"/><rect className="chip-lid" x="328" y="232" width="154" height="120" rx="6"/><path className="chip-mark" d="M349 252h109M349 265h64"/><text className="model-text" x="350" y="321">PCFORGE / CPU</text>{Array.from({ length: 8 }, (_, i) => <path key={i} className="contact" d={`M${330 + i * 19} 369v18m${-12} 0h12`} />)}</g>
  if (id === 'ram') return <g className={`model-generic ${exploded ? 'exploded' : ''}`}><ellipse className="shadow" cx="405" cy="376" rx="178" ry="19"/>{[0,1,2].map((n)=><g key={n} transform={`translate(0 ${n * -44})`}><path className="ram-board" d="M271 315h270v43H271z"/><path className="ram-shell" d="M278 298h256v21H278z"/>{[0,1,2,3,4,5].map(i=><rect key={i} className="ram-chip" x={291+i*39} y="302" width="27" height="14" rx="2"/>)}<path className="contact" d="M294 359v13m18-13v13m18-13v13m18-13v13m18-13v13m18-13v13m18-13v13m18-13v13m18-13v13m18-13v13m18-13v13m18-13v13"/></g>)}</g>
  if (id === 'gpu') return <g className={`model-generic ${exploded ? 'exploded' : ''}`}><ellipse className="shadow" cx="405" cy="390" rx="198" ry="25"/><path className="gpu-body" d="M229 219h353v140H229z"/><path className="gpu-top" d="M229 219h353v25H229z"/><path className="gpu-side" d="M229 359h353v18H229z"/><circle className="gpu-fan" cx="335" cy="290" r="54"/><circle className="fan-inner" cx="335" cy="290" r="13"/>{[0,1,2,3,4,5].map(i=><path key={i} className="fan-blade" transform={`rotate(${i*60} 335 290)`} d="M335 279q8-24 3-37q-14 14-8 37z"/>)}<circle className="gpu-fan" cx="472" cy="290" r="54"/><circle className="fan-inner" cx="472" cy="290" r="13"/>{[0,1,2,3,4,5].map(i=><path key={i} className="fan-blade" transform={`rotate(${i*60} 472 290)`} d="M472 279q8-24 3-37q-14 14-8 37z"/>)}<path className="contact" d="M362 377v20m13-20v20m13-20v20m13-20v20m13-20v20m13-20v20m13-20v20"/><text className="model-text" x="375" y="236">PCFORGE / GRAPHICS</text></g>
  if (id === 'storage') return <g className={`model-generic ${exploded ? 'exploded' : ''}`}><ellipse className="shadow" cx="405" cy="368" rx="173" ry="18"/><path className="storage-board" d="M260 258l31-31h289l32 31v91l-32 31H291l-31-31z"/><rect className="storage-chip" x="309" y="261" width="83" height="69" rx="4"/><rect className="storage-chip" x="405" y="261" width="83" height="69" rx="4"/><rect className="controller" x="502" y="270" width="52" height="52" rx="4"/><path className="model-textline" d="M324 278h52m-52 12h38m-38 12h43M419 278h51m-51 12h42m-42 12h49"/><circle className="screw" cx="294" cy="243" r="6"/><circle className="screw" cx="590" cy="243" r="6"/><path className="contact" d="M304 380v16m14-16v16m14-16v16m14-16v16m14-16v16m14-16v16m14-16v16m14-16v16m14-16v16"/></g>
  if (id === 'psu') return <g className={`model-generic ${exploded ? 'exploded' : ''}`}><ellipse className="shadow" cx="405" cy="380" rx="165" ry="22"/><path className="psu-body" d="M250 207h310l35 34v113l-35 33H250l-34-33V241z"/><circle className="psu-fan" cx="363" cy="287" r="64"/><circle className="fan-inner" cx="363" cy="287" r="11"/>{[0,1,2,3,4,5,6,7].map(i=><path key={i} className="fan-blade" transform={`rotate(${i*45} 363 287)`} d="M363 280q8-26 2-39q-14 13-8 39z"/>)}<rect className="psu-panel" x="452" y="249" width="91" height="99" rx="5"/>{[0,1,2,3,4,5,6,7].map(i=><rect key={i} className="socket" x={464+(i%2)*39} y={261+Math.floor(i/2)*19} width="22" height="11" rx="2"/>)}</g>
  if (id === 'case') return <g className={`model-generic ${exploded ? 'exploded' : ''}`}><ellipse className="shadow" cx="405" cy="403" rx="170" ry="18"/><path className="case-frame" d="M285 167h235l29 22v202H256V189z"/><path className="case-glass" d="M302 183h201l20 16v169H276V199z"/><path className="case-board" d="M359 227h116v123H359z"/><rect className="case-board" x="296" y="230" width="44" height="151" rx="3"/><circle className="case-fan" cx="309" cy="261" r="24"/><circle className="case-fan" cx="309" cy="327" r="24"/><circle className="case-fan" cx="490" cy="215" r="22"/><path className="airflow" d="M307 279v27m0 40v-24m181-42v-38"/><path className="gpu-body" d="M365 303h97v25h-97z"/><rect className="chip" x="387" y="343" width="57" height="16" rx="2"/></g>
  return <g className={`model-generic ${exploded ? 'exploded' : ''}`}><ellipse className="shadow" cx="405" cy="393" rx="170" ry="20"/><path className="cooler-base" d="M325 355l23-18h115l23 18v21H325z"/><path className="cooler-fin" d="M343 339v-94h125v94z"/>{Array.from({length:11},(_,i)=><path key={i} className="fin" d={`M${350+i*10} 248v88`}/>)}<circle className="cooler-fan" cx="405" cy="245" r="73"/><circle className="fan-inner" cx="405" cy="245" r="12"/>{[0,1,2,3,4,5,6,7].map(i=><path key={i} className="fan-blade" transform={`rotate(${i*45} 405 245)`} d="M405 238q8-28 2-45q-15 14-9 45z"/>)}<path className="cooler-pipe" d="M366 365q-20-52 0-87m78 87q20-52 0-87"/></g>
}

export default function PCStudioScene({ selectedId = 'cpu', onSelect = () => {}, onGpuPartSelect, controls = false, className = '' }) {
  const viewerRef = useRef(null)
  const [exploded, setExploded] = useState(false)
  const [labels, setLabels] = useState(true)
  const [technical, setTechnical] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState({ x: -9, y: -17 })
  const [drag, setDrag] = useState(null)
  const [hotspot, setHotspot] = useState(null)
  const frameExplorer = frameExplorers[selectedId]
  const hasFrameExplorer = Boolean(frameExplorer)
  const selected = parts.find(p => p.id === selectedId) || parts[0]
  const dots = useMemo(() => Array.from({ length: 34 }, (_, i) => ({ x: (i * 89 + 37) % 680, y: (i * 53 + 13) % 450, r: i % 5 === 0 ? 1.5 : 0.7 })), [])
  const annotations = callouts[selectedId] || []
  const move = (e) => { if (!drag) return; setRotation({ x: Math.max(-36, Math.min(36, drag.x + (e.clientY - drag.py) * .32)), y: drag.y + (e.clientX - drag.px) * .38 }) }
  const reset = () => { setExploded(false); setTechnical(false); setZoom(1); setRotation({ x: -9, y: -17 }); setHotspot(null) }
  const resetFrameExplorer = () => { viewerRef.current?.reset(); setExploded(false); setLabels(true); setTechnical(false); setZoom(1); setHotspot(null) }
  const changeFrameZoom = (direction) => viewerRef.current?.[direction > 0 ? 'zoomIn' : 'zoomOut']()
  useEffect(() => {
    if (hasFrameExplorer) resetFrameExplorer()
    // Reset the shared viewer when switching between GPU and motherboard frames.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])
  return <div className={`pc-studio ${className}`}>
    <div className={`forge-viewer ${hasFrameExplorer && technical ? 'technical-mode' : ''}`}>
      <div className="forge-viewer-head"><div><span className="forge-live-dot"/> LIVE COMPONENT STUDY <span className="forge-divider">/</span> {selected.tag} · {selected.name.toUpperCase()}</div><span className="forge-view-hint">{hasFrameExplorer ? 'DRAG TO ROTATE · EXPLODE TO INSPECT' : <>DRAG TO ORBIT <i>·</i> SCENE {technical ? 'TECHNICAL' : 'EXPLORE'}</>}</span></div>
      {hasFrameExplorer ? <>
      <GpuExplorer ref={viewerRef} title={frameExplorer.title} basePath={frameExplorer.basePath} labels={frameExplorer.labels} exploded={exploded} onExplodedChange={setExploded} showLabels={labels} onLabelsChange={setLabels} zoom={zoom} onZoomChange={setZoom} hideControls className="hardware-gpu-explorer" onPartSelect={onGpuPartSelect} />
      {controls && <div className="frame-explorer-controls"><div className="forge-zoom-controls frame-explorer-zoom"><button type="button" onClick={() => changeFrameZoom(-1)} aria-label="Zoom out">−</button><span>{Math.round(zoom * 100)}%</span><button type="button" onClick={() => changeFrameZoom(1)} aria-label="Zoom in">+</button></div><div className="forge-toolbar frame-explorer-toolbar" aria-label="Scene controls"><button type="button" className={!exploded?'active':''} onClick={() => viewerRef.current?.assemble()}><ScanLine size={14}/> Explore</button><button type="button" className={exploded?'active':''} onClick={() => viewerRef.current?.explode()} aria-pressed={exploded}><Layers2 size={14}/> Exploded</button><button type="button" className={labels?'active':''} onClick={() => viewerRef.current?.toggleLabels()} aria-pressed={labels}><Tag size={14}/> Labels</button><button type="button" className={technical?'active':''} onClick={() => setTechnical(v => !v)} aria-pressed={technical}><CircuitBoard size={14}/> Technical</button><button type="button" onClick={resetFrameExplorer}><RotateCcw size={14}/> Reset</button></div></div>}
      <div className="forge-status"><span><i/> FRAME VIEW READY</span><span>144 ROTATION · 72 EXPLODED FRAMES</span><span>PCFORGE / HARDWARE LAB</span></div></> : <>
      <div className={`pc-stage forge-stage ${technical ? 'technical-mode' : ''}`} onPointerMove={move} onPointerUp={() => setDrag(null)} onPointerLeave={() => setDrag(null)} onPointerDown={e => { if (e.target.closest('button, .svg-hotspot')) return; e.currentTarget.setPointerCapture(e.pointerId); setDrag({ px:e.clientX, py:e.clientY, ...rotation }) }}>
        <div className="forge-reticle"/><div className="forge-axis forge-axis-x"/><div className="forge-axis forge-axis-y"/>
        <div className="forge-particles" aria-hidden="true">{dots.map((d,i)=><i key={i} style={{left:`${d.x/6.8}%`,top:`${d.y/4.5}%`,width:d.r*2,height:d.r*2}}/>)}</div>
        <div className={`forge-model ${exploded ? 'is-exploded' : ''}`} style={{ transform:`translate(-50%,-50%) scale(${zoom}) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}><svg viewBox="0 0 810 500" role="img" aria-label={`${selected.name} technical illustration`}><defs><linearGradient id="pcb" x2="1" y2="1"><stop stopColor="#233a42"/><stop offset=".48" stopColor="#101b22"/><stop offset="1" stopColor="#263944"/></linearGradient><linearGradient id="metal" x2=".85" y2="1"><stop stopColor="#c7d0d1"/><stop offset=".32" stopColor="#53636a"/><stop offset=".62" stopColor="#303c43"/><stop offset="1" stopColor="#93a4a7"/></linearGradient><linearGradient id="gold" x2="0" y2="1"><stop stopColor="#f1d28b"/><stop offset="1" stopColor="#92713d"/></linearGradient><radialGradient id="glow"><stop stopColor="#54dff2" stopOpacity=".2"/><stop offset="1" stopColor="#54dff2" stopOpacity="0"/></radialGradient></defs><ellipse cx="405" cy="280" rx="257" ry="198" fill="url(#glow)"/><g className="model-shadow"><ellipse className="shadow" cx="402" cy="423" rx="224" ry="25"/></g><Model id={selectedId} technical={technical} exploded={exploded}/>{labels && annotations.map(([name,copy,x,y],i)=><g key={name} className={`svg-hotspot ${hotspot===i?'hotspot-active':''}`}><circle cx={x} cy={y} r="18" className="hotspot-hit"/><circle cx={x} cy={y} r="5" className="hotspot-core"/><circle cx={x} cy={y} r="10" className="hotspot-ring"/><path className="hotspot-leader" d={`M${x} ${y}h${i%2?33:-33}`} /><text x={x+(i%2?38:-38)} y={y-5} textAnchor={i%2?'start':'end'} className="hotspot-label">{name}</text><title>{copy}</title></g>)}</svg>{labels && <div className="forge-hotspot-layer">{annotations.map(([name,copy,x,y],i)=><button key={name} className={`forge-hotspot-target ${hotspot===i?'hotspot-active':''}`} type="button" style={{left:`${x/8.1}%`,top:`${y/5}%`}} onClick={e=>{e.stopPropagation();setHotspot(hotspot===i?null:i)}} aria-label={`Show ${name} annotation`} aria-pressed={hotspot===i} title={copy}/>)}</div>}</div>
        {hotspot!==null && labels && annotations[hotspot] && <div className="forge-annotation"><button type="button" aria-label="Dismiss annotation" onClick={()=>setHotspot(null)}>×</button><span>ENGINEERING NOTE · {String(hotspot+1).padStart(2,'0')}</span><b>{annotations[hotspot][0]}</b><p>{annotations[hotspot][1]}</p></div>}
        <div className="forge-zoom-controls"><button type="button" onClick={()=>setZoom(z=>Math.min(1.3,z+.08))} aria-label="Zoom in">+</button><span>{Math.round(zoom*100)}%</span><button type="button" onClick={()=>setZoom(z=>Math.max(.78,z-.08))} aria-label="Zoom out">−</button></div>
        {controls && <div className="forge-toolbar" aria-label="Scene controls"><button type="button" className={!exploded?'active':''} onClick={()=>setExploded(false)}><ScanLine size={14}/> Explore</button><button type="button" className={exploded?'active':''} onClick={()=>setExploded(v=>!v)} aria-pressed={exploded}><Layers2 size={14}/> Exploded</button><button type="button" className={labels?'active':''} onClick={()=>{setLabels(v=>!v);setHotspot(null)}} aria-pressed={labels}><Tag size={14}/> Labels</button><button type="button" className={technical?'active':''} onClick={()=>setTechnical(v=>!v)} aria-pressed={technical}><CircuitBoard size={14}/> Technical</button><button type="button" onClick={reset}><RotateCcw size={14}/> Reset</button></div>}
        <div className="forge-corner-mark">PF<span>·</span>LAB <small>01—08</small></div>
      </div>
      <div className="forge-status"><span><i/> MODEL READY</span><span>ILLUSTRATIVE ENGINEERING VIEW · NOT TO SCALE</span><span>PCFORGE / HARDWARE LAB</span></div>
      </>}
    </div>
    {controls && <nav className="pc-part-selector" aria-label="Hardware learning strip">{parts.map(({id,name,Icon,tag})=><button key={id} type="button" className={selectedId===id?'active':''} onClick={()=>{onSelect(id);setHotspot(null)}} aria-pressed={selectedId===id}><span className="part-index">{tag}</span><Icon className="part-icon" size={19}/><span className="part-name">{name}</span><span className="part-indicator"/></button>)}</nav>}
  </div>
}
