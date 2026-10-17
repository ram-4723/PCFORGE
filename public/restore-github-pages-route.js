(() => {
  const base = (document.currentScript?.dataset.base || '/').replace(/\/$/, '')
  const redirect = window.location.search.match(/^\?\/([^&]*)(?:&(.+))?$/)
  if (!redirect) return
  const route = decodeURIComponent(redirect[1] || '')
  const query = redirect[2] ? `?${redirect[2]}` : ''
  window.history.replaceState(null, '', `${base}/${route}${query}${window.location.hash}`)
})()
