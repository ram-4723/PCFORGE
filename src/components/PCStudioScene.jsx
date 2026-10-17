import React, { useState } from 'react'
import { Layers2, RotateCcw } from 'lucide-react'

const parts = [
  { id: 'motherboard', name: 'Motherboard', className: 'board', tag: '01' },
  { id: 'cpu', name: 'Processor', className: 'cpu', tag: '02' },
  { id: 'ram', name: 'Memory', className: 'ram', tag: '03' },
  { id: 'gpu', name: 'Graphics card', className: 'gpu', tag: '04' },
  { id: 'storage', name: 'Storage', className: 'storage', tag: '05' },
  { id: 'psu', name: 'Power supply', className: 'psu', tag: '06' },
  { id: 'case', name: 'Case and airflow', className: 'case', tag: '07' },
  { id: 'cooling', name: 'CPU cooling', className: 'cooling', tag: '08' },
]

/** A lightweight CSS 3D studio diagram. Each hardware layer is independently selectable and moves when exploded. */
export default function PCStudioScene({ selectedId = 'cpu', onSelect = () => {}, controls = false, className = '' }) {
  const [exploded, setExploded] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const selected = parts.find((part) => part.id === selectedId) || parts[0]
  const handlePointerMove = (event) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = (event.clientY - bounds.top) / bounds.height - 0.5
    const y = (event.clientX - bounds.left) / bounds.width - 0.5
    setTilt({ x: x * -5, y: y * 7 })
  }

  return <div className={`pc-studio ${className}`}>
    <div className="pc-stage" onPointerMove={handlePointerMove} onPointerLeave={() => setTilt({ x: 0, y: 0 })}>
      <div className="pc-stage-halo" />
      <div className={`pc-rig ${exploded ? 'is-exploded' : ''}`} style={{ '--tilt-x': `${tilt.x}deg`, '--tilt-y': `${tilt.y}deg` }}>
        <div className="pc-case-shadow" />
        <div className="pc-case-shell"><div className="pc-case-edge" /><div className="pc-case-window"><div className="pc-case-reflection" /></div><div className="pc-case-front"><i /><i /><i /></div></div>
        {parts.filter((part) => part.id !== 'case').map((part) => <button key={part.id} type="button" className={`pc-hardware pc-hardware-${part.className} ${selectedId === part.id ? 'selected' : ''}`} onClick={() => onSelect(part.id)} aria-label={`Explore ${part.name}`} aria-pressed={selectedId === part.id}><span className="hardware-glow" />{part.id === 'cooling' && <><i /><i /><i /></>}{part.id === 'ram' && <><i /><i /></>}{part.id === 'gpu' && <><i /><i /><b>PCF</b></>}{part.id === 'motherboard' && <><i /><i /><i /><b /></>}</button>)}
      </div>
      {controls && <div className="pc-stage-controls"><button type="button" className={exploded ? 'active' : ''} onClick={() => setExploded((value) => !value)} aria-pressed={exploded}><Layers2 size={15} />{exploded ? 'Assemble parts' : 'Explode view'}</button><button type="button" onClick={() => { setExploded(false); onSelect('cpu') }}><RotateCcw size={14} />Reset</button></div>}
      <div className="pc-stage-caption"><span>{controls ? `SELECTED · ${selected.name.toUpperCase()}` : 'PCFORGE · COMPONENT STUDY'}</span><small>Illustrative interactive layout</small></div>
    </div>
    {controls && <div className="pc-part-selector" aria-label="Select a component to explore">{parts.map((part) => <button key={part.id} type="button" className={selectedId === part.id ? 'active' : ''} onClick={() => onSelect(part.id)} aria-pressed={selectedId === part.id}><span>{part.tag}</span>{part.name}</button>)}</div>}
  </div>
}
