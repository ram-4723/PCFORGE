import { specificationItems } from '../utils/specifications.js'

export default function SpecificationChips({ specifications, className = '' }) {
  const items = specificationItems(specifications)
  if (!items.length) return null
  return <div className={`specification-chips ${className}`.trim()} aria-label="Product specifications">
    {items.map((item, index) => <span className="specification-chip" key={`${item}-${index}`}>{item}</span>)}
  </div>
}
