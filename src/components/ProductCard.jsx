import { useEffect, useState } from 'react'
import { Box, Cable, CircuitBoard, Cpu, Database, Eye, Fan, Gamepad2, Headphones, Heart, Keyboard, MemoryStick, Monitor, Mouse, PanelsTopLeft, ShoppingCart, Wifi, Zap } from 'lucide-react'
import { formatINR } from '../utils/pricing.js'
import { publicAsset } from '../utils/assets.js'
import SpecificationChips from './SpecificationChips.jsx'

const artIcons = { Cpu, Gpu: Monitor, CircuitBoard, MemoryStick, Database, Zap, Box, Fan, Monitor, Keyboard, Mouse, Headphones, Gamepad2, PanelsTopLeft, Wifi, Cable }

export function ProductArt({ icon = 'Cpu', tone = 'blue', small = false, thumbnail = false, image, fallbackImage, alt = 'Product photo' }) {
  const [imageFailed, setImageFailed] = useState(false)
  const [fallbackFailed, setFallbackFailed] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  useEffect(() => {
    setImageFailed(false)
    setFallbackFailed(false)
    setImageLoaded(false)
  }, [image, fallbackImage])
  const Icon = artIcons[icon] || Cpu
  const sizeClass = thumbnail ? 'product-art-thumbnail' : small ? 'product-art-small' : ''
  const genericFallback = publicAsset('/images/pc%20cabineyt.jpg')
  const backup = fallbackImage && fallbackImage !== image
    ? fallbackImage
    : image !== genericFallback ? genericFallback : null
  const showingFallback = !image || imageFailed
  const currentImage = showingFallback ? (!fallbackFailed ? backup : null) : image
  if (currentImage) return <div className={`product-art product-art-photo ${sizeClass}`}><img className={imageLoaded ? 'product-image-loaded' : 'product-image-loading'} src={currentImage} alt={alt} loading="lazy" onLoad={() => setImageLoaded(true)} onError={() => showingFallback ? setFallbackFailed(true) : setImageFailed(true)} /></div>
  return <div className={`product-art product-art-placeholder ${sizeClass}`} role="img" aria-label={alt}><Icon size={thumbnail ? 22 : small ? 27 : 45} strokeWidth={1.15} />{!thumbnail && <span>Product photo unavailable</span>}</div>
}

export default function ProductCard({ product, onAdd, onWishlist, onViewDetails, wishlisted = false, sponsored = false, compact = false }) {
  return <article className={`product-card ${compact ? 'product-card-compact' : ''}`}>
    <div className="product-visual"><ProductArt key={`${product.id}:${product.image || ''}:${product.fallbackImage || ''}`} icon={product.icon} tone={product.tone} image={product.image} fallbackImage={product.fallbackImage} alt={product.imageAlt || `${product.brand ? `${product.brand} ` : ''}${product.name} product photo`} /><span className="stock-pill">{product.stock}</span><button className={`wish-button ${wishlisted ? 'wishlisted' : ''}`} aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'} onClick={() => onWishlist(product)}><Heart size={17} fill={wishlisted ? 'currentColor' : 'none'} /></button>{sponsored && <span className="sponsored-chip">Preview placement</span>}</div>
    <div className="product-body"><div className="product-brand">{product.brand ? <>{product.brand} <span>· {product.category}</span></> : product.category}</div><h3>{product.name}</h3><SpecificationChips specifications={product.specs} className="product-specs" /><div className="product-price-row"><div><strong>{formatINR(product.price)}</strong>{product.isDemoData && <small className="sample-price-label">Sample price</small>}</div><button className="add-cart-button" onClick={() => onAdd(product)} aria-label={`Add ${product.name} to cart`}><ShoppingCart size={16} /><span>Add to Cart</span></button></div><button className="product-details-link" onClick={() => onViewDetails?.(product)}><Eye size={13} /> View Details</button></div>
  </article>
}
