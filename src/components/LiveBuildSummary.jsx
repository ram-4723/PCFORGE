import { useState } from 'react'
import { Box, Check, CircuitBoard, Cpu, Database, Fan, Gamepad2, MemoryStick, Monitor, ShieldAlert, Zap } from 'lucide-react'
import { getBuildTotal, formatINR } from '../utils/pricing.js'
import SpecificationChips from './SpecificationChips.jsx'
import { productTitle } from '../utils/catalogue.js'
import { ProductArt } from './ProductCard.jsx'

const icons = { cpu: Cpu, gpu: Monitor, motherboard: CircuitBoard, ram: MemoryStick, storage: Database, psu: Zap, case: Box, cooling: Fan }

function compatibilityState(build, requiredKeys, result) {
  if (!build) return { label: 'Pending', detail: 'Generate a recommendation to evaluate selected parts.' }
  if (requiredKeys.some((key) => !build[key])) return { label: 'Incomplete build', detail: 'Generate or add the missing required parts before compatibility can be checked.' }
  if (!result || !result.status) return { label: 'Pending', detail: 'Compatibility has not been checked for this selection.' }
  if (result.status === 'incompatible') return { label: 'Incompatible', detail: 'One or more blocking conflicts were found.' }
  if (result.status === 'warning') return { label: 'Warnings', detail: 'Review the compatibility notes before continuing.' }
  if (result.status === 'unverified') return { label: 'Unable to verify', detail: 'Some required specifications are missing from the catalogue.' }
  if (result.status === 'compatible') return { label: 'Compatible', detail: 'All implemented checks passed for the supplied specifications.' }
  return { label: 'Unable to verify', detail: 'The compatibility response could not be interpreted.' }
}

export default function LiveBuildSummary({ budget, build, requiredKeys, visibleKeys, labels, compatibility, onContinue, onReviewComponent, onRemoveOptional, loading, error, actionLabel }) {
  const [findingsOpen, setFindingsOpen] = useState(true)
  const [expanded, setExpanded] = useState(true)
  const total = getBuildTotal(build)
  const selectedCount = requiredKeys.filter((key) => Boolean(build?.[key])).length
  const remaining = total === null ? null : budget - total
  const validBudget = Number.isSafeInteger(budget) && budget > 0
  const percentage = validBudget && total !== null ? Math.min(100, Math.max(0, (total / budget) * 100)) : 0
  const status = compatibilityState(build, requiredKeys, compatibility)
  const findings = compatibility?.findings || []

  return <details className="live-build-summary" open={expanded} onToggle={(event) => setExpanded(event.currentTarget.open)}>
    <summary className="live-summary-heading"><span className="live-summary-icon"><Monitor size={19} /></span><span className="live-summary-title"><b>Your PC Build</b><small>LIVE BUILD SUMMARY</small></span><span className={`live-status-pill ${status.label.toLowerCase().replaceAll(' ', '-')}`}>{status.label}</span></summary>
    <div className="live-summary-content">
      <div className="live-metric-grid">
        <div className="live-metric"><span>Your budget</span><strong>{validBudget ? formatINR(budget) : 'Enter a valid budget'}</strong></div>
        <div className="live-metric estimated"><span>Estimated component total</span><strong>{total === null ? 'Price unavailable' : formatINR(total)}</strong></div>
      </div>
      <div className={`live-budget-balance ${remaining !== null && remaining < 0 ? 'over-budget' : ''}`} aria-live="polite">
        <span>{remaining === null ? 'Remaining budget' : remaining < 0 ? 'Over budget' : 'Remaining budget'}</span>
        <b>{remaining === null ? '—' : formatINR(Math.abs(remaining))}</b>
      </div>
      <div className="live-budget-usage"><div><span>Budget used</span><b>{validBudget && total !== null ? `${Math.round((total / budget) * 100)}%` : '—'}</b></div><div className="live-budget-track" role="progressbar" aria-label="Budget used" aria-valuemin="0" aria-valuemax="100" aria-valuenow={validBudget && total !== null ? Math.min(100, Math.round((total / budget) * 100)) : 0}><span className={remaining !== null && remaining < 0 ? 'over-budget' : ''} style={{ width: `${percentage}%` }} /></div></div>
      <div className="live-selection-heading"><b>Selected components</b><span>{selectedCount}/{requiredKeys.length} required</span></div>
      <div className="live-component-list">
        {visibleKeys.map((key) => {
          const Icon = icons[key] || Cpu
          const part = build?.[key]
          return <div className="live-component" key={key}>
            <span className="live-component-icon">{part ? <ProductArt key={`${part.id}:${part.image || ''}:${part.fallbackImage || ''}`} thumbnail icon={part.icon || key} image={part.image} fallbackImage={part.fallbackImage} alt={part.imageAlt || `${productTitle(part.name, part.brand)} product photo`} /> : <Icon size={15} />}</span>
            <button type="button" className="live-component-copy" onClick={() => onReviewComponent(key)} aria-label={`Review or change ${labels[key]}`}><small>{labels[key]}{!requiredKeys.includes(key) ? ' · OPTIONAL' : ''}</small><b>{part ? productTitle(part.name, part.brand) : 'Not selected'}</b><SpecificationChips specifications={part?.specs} className="summary-specifications" /></button>
            <span className="live-component-price">{part ? Number.isSafeInteger(part.price) && part.price >= 0 ? formatINR(part.price) : 'Price unavailable' : '—'}</span>
            {part && !requiredKeys.includes(key) && <button className="live-remove-component" type="button" onClick={() => onRemoveOptional(key)} aria-label={`Remove ${labels[key]}`}>×</button>}
          </div>
        })}
      </div>
      <div className={`live-compatibility ${status.label.toLowerCase().replaceAll(' ', '-')}`}><div><ShieldAlert size={16} /><b>{status.label}</b></div><p>{status.detail}</p>{findings.length > 0 && <><button className="live-findings-toggle" type="button" aria-expanded={findingsOpen} onClick={() => setFindingsOpen((open) => !open)}>{findingsOpen ? 'Hide details' : 'Review details'} · {findings.length}</button>{findingsOpen && <ul>{findings.map((finding, index) => <li key={`${finding.code || finding.status}-${index}`}>{finding.message || finding.text || 'Review the component specifications.'}</li>)}</ul>}</>}</div>
      {error && <p className="live-summary-error" role="alert">{error}</p>}
      <button className="button button-gold live-summary-continue" type="button" onClick={onContinue} disabled={loading}>{loading ? 'Loading active products…' : actionLabel} {loading ? null : <Check size={15} />}</button>
      <p className="live-summary-disclaimer">Component estimate only. Taxes, delivery, and other charges are not included.</p>
    </div>
  </details>
}
