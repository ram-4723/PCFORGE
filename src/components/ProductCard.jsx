import { useState } from 'react'
import { Box, Cable, CircuitBoard, Cpu, Database, Eye, Fan, Gamepad2, Headphones, Heart, Keyboard, MemoryStick, Monitor, Mouse, PanelsTopLeft, ShoppingCart, Wifi, Zap } from 'lucide-react'
import { formatINR } from '../utils/pricing.js'

const artIcons = { Cpu, Gpu: Monitor, CircuitBoard, MemoryStick, Database, Zap, Box, Fan, Monitor, Keyboard, Mouse, Headphones, Gamepad2, PanelsTopLeft, Wifi, Cable }

export function ProductArt({ icon = 'Cpu', tone = 'blue', small = false, image, alt = 'Product photo' }) {
  const [imageFailed, setImageFailed] = useState(false)
  const Icon = artIcons[icon] || Cpu
  if (image && !imageFailed) return <div className={`product-art product-art-photo ${small ? 'product-art-small' : ''}`}><img src={image} alt={alt} loading="lazy" onError={() => setImageFailed(true)} /></div>
  return <div className={`product-art art-${tone} ${small ? 'product-art-small' : ''}`} aria-hidden="true"><div className="art-glow" /><Icon size={small ? 27 : 45} strokeWidth={1.15} /><span className="art-orbit" /></div>
}

export default function ProductCard({ product, onAdd, onWishlist, onViewDetails, wishlisted = false, sponsored = false, compact = false }) {
  return <article className={`product-card ${compact ? 'product-card-compact' : ''}`}>
    <div className="product-visual"><ProductArt icon={product.icon} tone={product.tone} image={product.image} alt={`${product.name} representative component photo`} /><span className="stock-pill">{product.stock}</span><button className={`wish-button ${wishlisted ? 'wishlisted' : ''}`} aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'} onClick={() => onWishlist(product)}><Heart size={17} fill={wishlisted ? 'currentColor' : 'none'} /></button>{sponsored && <span className="sponsored-chip">Demo Advertisement</span>}</div>
    <div className="product-body"><div className="product-brand">{product.brand} <span>· {product.category}</span></div><h3>{product.name}</h3><div className="product-specs">{product.specs.map((spec) => <span key={spec}>{spec}</span>)}</div><div className="product-price-row"><div><strong>{formatINR(product.price)}</strong>{product.mrp && <><s title="Illustrative comparison price">{formatINR(product.mrp)}</s><small className="demo-discount">Illustrative demo discount · {Math.round((product.mrp - product.price) / product.mrp * 100)}%</small></>}</div><button className="add-cart-button" onClick={() => onAdd(product)} aria-label={`Add ${product.name} to cart`}><ShoppingCart size={16} /><span>Add to Cart</span></button></div><button className="product-details-link" onClick={() => onViewDetails?.(product)}><Eye size={13} /> View Details</button></div>
  </article>
}
