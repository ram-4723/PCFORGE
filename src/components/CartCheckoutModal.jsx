import { useState } from 'react'
import { ArrowLeft, Check, CircleAlert, ShieldCheck, X } from 'lucide-react'
import { createOrder, createPaymentCheckout, reportPaymentFailure, saveBuild, verifyPayment } from '../api/client.js'
import { loadRazorpayCheckout } from '../utils/razorpayCheckout.js'
import { formatINR } from '../utils/pricing.js'

const emptyDetails = { name: '', email: '', phone: '', address: '' }
const isComponentId = (value) => /^[a-f\d]{24}$/i.test(value || '')
const randomKey = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`

export default function CartCheckoutModal({ open, items, total, onClose, onBackToCart, onPurchaseComplete }) {
  const [view, setView] = useState('details')
  const [details, setDetails] = useState(emptyDetails)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [activeOrder, setActiveOrder] = useState(null)
  const [busy, setBusy] = useState(false)
  const [pendingPayment, setPendingPayment] = useState(null)
  const cartIsOrderable = items.length > 0 && items.every((item) => item.kindLabel === 'Component' && isComponentId(item.componentId) && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 10)
  const orderTotal = activeOrder?.order?.totalInr ?? total

  const exitCheckout = (backToCart = false) => {
    if (busy) return
    onClose()
    if (backToCart) onBackToCart?.()
    setView('details'); setErrors({}); setError(''); setDetails(emptyDetails); setActiveOrder(null); setPendingPayment(null)
  }

  const placeOrder = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!details.name.trim()) nextErrors.name = 'Add your name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) nextErrors.email = 'Enter a valid email.'
    if (!/^[0-9+() .-]{8,32}$/.test(details.phone)) nextErrors.phone = 'Enter a valid phone number.'
    if (!/^[0-9+\s()-]{8,32}$/.test(details.phone)) nextErrors.phone = 'Enter a valid phone number.'
    if (!details.address.trim()) nextErrors.address = 'Enter your delivery address.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    if (!cartIsOrderable) { setError('Only components loaded from the active PCForge catalogue can be checked out. Preview products and prebuilt estimates are not purchasable.'); return }

    setBusy(true); setError(''); setView('processing')
    try {
      const componentIds = items.map((item) => item.componentId)
      if (new Set(componentIds).size !== componentIds.length) throw new Error('Remove duplicate component entries and try again.')
      const saved = await saveBuild({ componentIds, intendedUse: 'office', preference: 'balanced', budgetInr: 1_000_000_000 })
      const build = saved.build
      sessionStorage.setItem(`pcforge-build-${build.id}`, saved.sessionToken)
      const storageKey = `pcforge-cart-order-key-${build.id}`
      const idempotencyKey = sessionStorage.getItem(storageKey) || randomKey()
      sessionStorage.setItem(storageKey, idempotencyKey)
      const quantities = Object.fromEntries(items.map((item) => [item.componentId, item.quantity]))
      const created = await createOrder({ buildId: build.id, customer: details, quantities }, saved.sessionToken, idempotencyKey)
      const orderState = { id: created.order.id, accessToken: created.accessToken, order: created.order }
      sessionStorage.setItem(`pcforge-order-${orderState.id}`, orderState.accessToken)
      sessionStorage.setItem('pcforge-active-order', orderState.id)
      setActiveOrder(orderState); setView('review')
    } catch (requestError) {
      setError(requestError.message || 'The server could not create this order. Check the active catalogue and try again.')
      setView('details')
    } finally { setBusy(false) }
  }

  const startPayment = async () => {
    if (!activeOrder || busy) return
    setBusy(true); setError(''); setView('processing')
    try {
      if (pendingPayment) {
        const result = await verifyPayment(activeOrder.id, activeOrder.accessToken, pendingPayment.razorpay_payment_id, pendingPayment.razorpay_signature)
        setActiveOrder((current) => ({ ...current, order: result.order }))
        setPendingPayment(null)
        if (result.paymentStatus === 'paid') { setView('success'); onPurchaseComplete?.() }
        else { setError('The payment is not confirmed yet. You can retry verification or start a new payment.'); setView('pending') }
        return
      }
      const response = await createPaymentCheckout(activeOrder.id, activeOrder.accessToken, randomKey())
      const checkout = response.checkout
      await loadRazorpayCheckout()
      let finished = false
      const razorpay = new window.Razorpay({
        key: checkout.keyId,
        amount: checkout.amountPaise,
        currency: checkout.currency,
        order_id: checkout.razorpayOrderId,
        name: 'PCForge',
        description: `Component order ${activeOrder.order.orderNumber}`,
        prefill: { name: details.name, email: details.email, contact: details.phone },
        theme: { color: '#ffc64a' },
        handler: async (paymentResult) => {
          finished = true; setPendingPayment(paymentResult); setBusy(true); setView('processing')
          try {
            const verified = await verifyPayment(activeOrder.id, activeOrder.accessToken, paymentResult.razorpay_payment_id, paymentResult.razorpay_signature)
            setPendingPayment(null); setActiveOrder((current) => ({ ...current, order: verified.order }))
            setView(verified.paymentStatus === 'paid' ? 'success' : 'pending')
            if (verified.paymentStatus === 'paid') onPurchaseComplete?.()
          } catch (verificationError) {
            setError(verificationError.message || 'Payment verification is pending. Retry verification in a moment.')
            setView('pending')
          } finally { setBusy(false) }
        },
        modal: { ondismiss: () => { if (!finished) { setError('Razorpay checkout was closed. The order remains unpaid.'); setView('review'); setBusy(false) } } },
      })
      razorpay.on('payment.failed', async (event) => {
        finished = true
        const paymentId = event.error?.metadata?.payment_id
        if (paymentId) {
          try { await reportPaymentFailure(activeOrder.id, activeOrder.accessToken, paymentId) }
          catch (failureError) { setError(failureError.message || 'Razorpay reported a failure; the server could not confirm it yet.') }
        } else setError('Razorpay could not complete the payment. Your order remains unpaid.')
        setBusy(false); setView('failure')
      })
      setView('payment'); setBusy(false); razorpay.open()
    } catch (paymentError) {
      setError(paymentError.message || 'Razorpay could not be opened. Please try again.')
      setView(activeOrder ? 'review' : 'details')
    } finally { setBusy(false) }
  }

  if (!open) return null
  return <div className="modal-scrim cart-checkout-scrim"><section className="store-checkout-modal" role="dialog" aria-modal="true" aria-labelledby="store-checkout-title">
    <header className="store-checkout-header"><div><b className="checkout-brand">PC<span>FORGE</span></b><small>SECURE COMPONENT CHECKOUT</small></div><button onClick={() => exitCheckout(true)} aria-label="Close checkout"><X /></button></header>
    {view === 'details' ? <>
      <div className="demo-banner"><ShieldCheck size={18} /><span><b>RAZORPAY TEST MODE</b><small>Payments are verified by the PCForge backend. Test Mode does not charge real money.</small></span></div>
      <div className="store-checkout-grid"><div><span className="eyebrow">ORDER SUMMARY</span><h2 id="store-checkout-title">Review your components.</h2><div className="store-order-list">{items.map((item) => <div key={item.key}><span>{item.quantity} × {item.name}</span><b>{formatINR(item.price * item.quantity)}</b></div>)}</div><div className="store-order-total"><span>Current estimate</span><strong>{formatINR(total)}</strong></div><p className="sensitive-note">The server confirms catalogue prices and stock before creating your order.</p></div>
        <form className="store-checkout-form" onSubmit={placeOrder}><span className="eyebrow">DELIVERY DETAILS</span>{[['name', 'Name', 'Your name'], ['email', 'Email', 'you@example.com'], ['phone', 'Phone', '+91 98765 43210'], ['address', 'Delivery address', 'Street, city, postal code']].map(([key, label, placeholder]) => <label key={key}>{label}<input value={details[key]} onChange={(event) => setDetails({ ...details, [key]: event.target.value })} placeholder={placeholder} autoComplete={key === 'address' ? 'street-address' : key} />{errors[key] && <small>{errors[key]}</small>}</label>)}<p>Razorpay handles payment details securely. PCForge never asks for your UPI PIN, CVV, or OTP.</p>{error && <p role="alert">{error}</p>}<div className="store-pay-actions"><button className="button button-gold" type="submit" disabled={busy || !cartIsOrderable}>{busy ? 'Preparing order…' : 'Continue to order review'}</button></div>{!cartIsOrderable && <small role="alert">Your cart has preview-only items. Add components from the active catalogue to purchase.</small>}</form></div>
      <button className="checkout-back" onClick={() => exitCheckout(true)}><ArrowLeft size={14} /> Back to cart</button>
    </> : view === 'processing' ? <div className="store-result payment-processing" role="status" aria-live="polite"><span className="payment-spinner" aria-hidden="true" /><span className="eyebrow">SECURE CHECKOUT</span><h2 id="store-checkout-title">{pendingPayment ? 'Verifying payment' : 'Preparing your order'}</h2><p>Keep this window open while PCForge confirms your order with the server.</p><div className="processing-total"><span>Order total</span><b>{formatINR(orderTotal)}</b></div><div className="processing-progress"><span /></div></div>
      : view === 'review' ? <div className="store-result"><span className="eyebrow">SERVER-PRICED ORDER</span><h2 id="store-checkout-title">Ready for Razorpay.</h2><div className="store-order-list">{activeOrder?.order?.items?.map((item) => <div key={item.componentId}><span>{item.quantity} × {item.name}</span><b>{formatINR(item.lineTotalInr)}</b></div>)}</div><div className="store-order-total"><span>Server-calculated total</span><strong>{formatINR(orderTotal)}</strong></div><p>Payment is not recorded until Razorpay confirms it and PCForge verifies the signature.</p>{error && <p role="alert">{error}</p>}<div className="store-pay-actions"><button className="button button-gold" onClick={startPayment} disabled={busy}>Continue to secure payment · {formatINR(orderTotal)}</button><button className="button button-darkline" onClick={() => setView('details')}>Edit delivery details</button></div></div>
      : view === 'payment' ? <div className="store-result"><span className="eyebrow">RAZORPAY CHECKOUT</span><h2 id="store-checkout-title">Complete payment in the Razorpay window.</h2><p>Close this message after you finish or dismiss checkout.</p></div>
      : view === 'success' ? <div className="store-result"><span className="result-badge"><Check size={25} /></span><span className="eyebrow">PAYMENT VERIFIED</span><h2 id="store-checkout-title">Component order confirmed.</h2><p>Your Razorpay payment was verified by the PCForge backend.</p><div className="demo-reference"><small>ORDER NUMBER</small><b>{activeOrder?.order?.orderNumber}</b></div><div className="store-order-total"><span>Paid total</span><strong>{formatINR(orderTotal)}</strong></div><button className="button button-gold full" onClick={() => exitCheckout(false)}>Continue shopping</button></div>
      : view === 'pending' ? <div className="store-result"><span className="result-badge"><CircleAlert size={25} /></span><span className="eyebrow">PAYMENT NOT YET CONFIRMED</span><h2 id="store-checkout-title">We’re checking your payment.</h2><p>{error || 'The order stays unpaid until the server verifies the payment.'}</p><div className="store-pay-actions">{pendingPayment && <button className="button button-gold" onClick={startPayment} disabled={busy}>Retry verification</button>}<button className="button button-darkline" onClick={() => setView('review')}>Back to order</button></div></div>
      : <div className="store-result"><span className="result-badge"><CircleAlert size={25} /></span><span className="eyebrow">PAYMENT FAILED</span><h2 id="store-checkout-title">Your order remains unpaid.</h2><p>{error || 'Razorpay could not complete this payment.'}</p><div className="store-pay-actions"><button className="button button-gold" onClick={() => setView('review')}>Try Razorpay again</button><button className="button button-darkline" onClick={() => exitCheckout(true)}>Back to cart</button></div></div>}
  </section></div>
}
