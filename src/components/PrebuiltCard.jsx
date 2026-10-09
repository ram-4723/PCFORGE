import { useState } from 'react'
import { ArrowUpRight, Box, Check, ShoppingCart } from 'lucide-react'
import { formatINR } from '../utils/pricing.js'

export default function PrebuiltCard({ build, onView, onAdd }) {
  const [imageFailed, setImageFailed] = useState(false)
  const hasImage = Boolean(build.image && !imageFailed)
  return <article className="prebuilt-card"><div className={`prebuilt-visual tone-${build.tone} ${hasImage ? 'has-prebuilt-photo' : ''}`}>{hasImage && <img className="prebuilt-photo" src={build.image} alt={`${build.name} representative prebuilt PC`} loading="lazy" onError={() => setImageFailed(true)} />}<span className="prebuilt-index">SAMPLE BUILD</span>{!hasImage && <div className="prebuilt-tower"><Box size={72} strokeWidth={1} /><i /><i /><i /></div>}<span className="prebuilt-use">{build.use}</span></div><div className="prebuilt-copy"><span className="eyebrow">NEW COMPONENTS · DEMO DATA</span><h3>{build.name}</h3><p>{build.text}</p><ul>{build.specs.map((spec) => <li key={spec}><Check size={12} />{spec}</li>)}</ul><div className="prebuilt-price"><small>ILLUSTRATIVE ESTIMATE</small><strong>{formatINR(build.price)}</strong></div><div className="prebuilt-actions"><button className="product-details-link" onClick={() => onView(build)}>View Details <ArrowUpRight size={13} /></button><button className="button button-gold" onClick={() => onAdd(build)}><ShoppingCart size={14} /> Add to Cart</button></div></div></article>
}
