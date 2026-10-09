import { useEffect, useState } from 'react'
import { ArrowLeft, Check, CircleAlert, CreditCard, Landmark, ShieldCheck, Smartphone, X } from 'lucide-react'
import { formatINR } from '../utils/pricing.js'

export default function CartCheckoutModal({ open, items, total, onClose, onBackToCart }) {
  const [view, setView] = useState('details')
  const [method, setMethod] = useState('UPI')
  const [details, setDetails] = useState({ name: '', email: '', phone: '' })
  const [errors, setErrors] = useState({})
  const [reference, setReference] = useState('')
  const [pendingOutcome, setPendingOutcome] = useState('success')
  useEffect(() => {
    if (!open || view !== 'processing') return undefined
    const timer = window.setTimeout(() => setView(pendingOutcome), 1800)
    return () => window.clearTimeout(timer)
  }, [open, view, pendingOutcome])
  const exitCheckout = (backToCart = false) => { onClose(); if (backToCart) onBackToCart?.(); setView('details'); setErrors({}); setDetails({ name: '', email: '', phone: '' }); setReference('') }
  if (!open) return null
  const tryOutcome = (outcome) => {
    const next = {}
    if (!details.name.trim()) next.name = 'Add your name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) next.email = 'Enter a valid email.'
    if (!/^[0-9+\s()-]{8,18}$/.test(details.phone)) next.phone = 'Enter a valid phone number.'
    setErrors(next)
    if (Object.keys(next).length) return
    setReference(`PF-DEMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`)
    setPendingOutcome(outcome)
    setView('processing')
  }
  return <div className="modal-scrim cart-checkout-scrim"><section className="store-checkout-modal" role="dialog" aria-modal="true" aria-labelledby="store-checkout-title"><header className="store-checkout-header"><div><b className="checkout-brand">PC<span>FORGE</span></b><small>SHOPPING CART CHECKOUT</small></div><button onClick={() => exitCheckout(true)} aria-label="Close checkout"><X /></button></header>{view === 'details' ? <><div className="demo-banner"><ShieldCheck size={18} /><span><b>DEMO CHECKOUT — NO REAL PAYMENT</b><small>All cart items and prices are sample data only.</small></span></div><div className="store-checkout-grid"><div><span className="eyebrow">ORDER SUMMARY</span><h2 id="store-checkout-title">Your sample order.</h2><div className="store-order-list">{items.map((item) => <div key={item.key}><span>{item.quantity} × {item.name}</span><b>{formatINR(item.price * item.quantity)}</b></div>)}</div><div className="store-order-total"><span>Demo total</span><strong>{formatINR(total)}</strong></div></div><div className="store-checkout-form"><span className="eyebrow">DEMO CONTACT DETAILS</span>{[['name', 'Name', 'Your name'], ['email', 'Email', 'you@example.com'], ['phone', 'Phone', '+91 98765 43210']].map(([key, label, placeholder]) => <label key={key}>{label}<input value={details[key]} onChange={(e) => setDetails({ ...details, [key]: e.target.value })} placeholder={placeholder} />{errors[key] && <small>{errors[key]}</small>}</label>)}<b className="method-heading">Choose a demo payment method</b><div className="store-payment-methods">{[['UPI', Smartphone], ['Card', CreditCard], ['Net banking', Landmark]].map(([name, Icon]) => <button className={method === name ? 'selected' : ''} key={name} onClick={() => setMethod(name)}><Icon size={17} />{name}{method === name && <Check size={13} />}</button>)}</div><p>No card numbers, CVVs, UPI PINs, OTPs, or bank credentials are requested.</p><div className="store-pay-actions"><button className="button button-gold" onClick={() => tryOutcome('success')}>Proceed to pay · {formatINR(total)}</button></div><button type="button" className="payment-failure-preview" onClick={() => tryOutcome('failure')}>Preview a failed payment</button></div></div><button className="checkout-back" onClick={() => exitCheckout(true)}><ArrowLeft size={14} /> Back to cart</button></> : view === 'processing' ? <div className="store-result payment-processing" role="status" aria-live="polite"><span className="payment-spinner" aria-hidden="true" /><span className="eyebrow">DEMO PAYMENT · {method.toUpperCase()}</span><h2 id="store-checkout-title">Processing your payment</h2><p>Please wait while we complete this payment simulation. Keep this window open for a moment.</p><div className="processing-total"><span>Amount</span><b>{formatINR(total)}</b></div><div className="processing-progress"><span /></div><small className="processing-note">Secure demo environment · No money will be charged</small></div> : view === 'success' ? <div className="store-result"><span className="result-badge"><Check size={25} /></span><span className="eyebrow">SIMULATION ONLY — NO MONEY CHARGED</span><h2 id="store-checkout-title">Demo Payment Successful</h2><p>No payment was processed and no real order was created. This screen is for demonstration only.</p><div className="demo-reference"><small>DEMO REFERENCE</small><b>{reference}</b></div><div className="store-order-total"><span>Illustrative total</span><strong>{formatINR(total)}</strong></div><button className="button button-gold full" onClick={exitCheckout}>Continue shopping</button></div> : <div className="store-result"><span className="result-badge"><CircleAlert size={25} /></span><span className="eyebrow">SIMULATED RESULT</span><h2 id="store-checkout-title">Demo Payment Failed</h2><p>This is a simulated failure. Your cart is unchanged and no money was charged.</p><div className="store-pay-actions"><button className="button button-gold" onClick={() => { setView('details'); setErrors({}) }}>Try again</button><button className="button button-darkline" onClick={() => exitCheckout(true)}>Back to cart</button></div></div>}</section></div>
}
