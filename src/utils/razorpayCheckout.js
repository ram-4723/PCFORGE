let razorpayScriptPromise

export function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve()
  if (!razorpayScriptPromise) razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => window.Razorpay ? resolve() : reject(new Error('Razorpay Checkout did not initialize.'))
    script.onerror = () => { razorpayScriptPromise = null; reject(new Error('Razorpay Checkout could not be loaded. Check your connection and retry.')) }
    document.body.appendChild(script)
  })
  return razorpayScriptPromise
}
