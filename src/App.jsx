import React, { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowDownRight, ArrowLeft, ArrowRight, Check, ChevronDown, CircleAlert, Clipboard, Cpu, Gamepad2, Menu, Monitor, Sparkles, Code2, Video, GraduationCap, X, Zap, Wrench, ArrowUpRight, RotateCcw, CreditCard, Landmark, Smartphone, ShieldCheck, Heart, ShoppingBag, Search, Tag, House, CircuitBoard, Images } from 'lucide-react'
import { categoryLabels } from './data/components.js'
import { exampleBuilds } from './data/exampleBuilds.js'
import { services } from './data/services.js'
import { getBuildTotal, formatINR } from './utils/pricing.js'
import { addOrIncrement, cartItemCount, cartTotal, removeFromCart, setCartQuantity } from './utils/cart.js'
import { categories, products, featuredPrebuilts, representativeImages } from './data/products.js'
import { demoCampaigns } from './config/campaigns.js'
import { campaignPlacements, getCampaignById, shouldPlaceCatalogueCampaign } from './config/campaignPlacements.js'
import { siteNavigationRoutes, footerExploreRoutes, resolveSiteRoute } from './config/siteRoutes.js'
import ProductCard, { ProductArt } from './components/ProductCard.jsx'
import CampaignPlacement from './components/CampaignPlacement.jsx'
import CartDrawer from './components/CartDrawer.jsx'
import CartCheckoutModal from './components/CartCheckoutModal.jsx'
import BuildOrderModal from './components/BuildOrderModal.jsx'
import PrebuiltCard from './components/PrebuiltCard.jsx'
import PCStudioScene from './components/PCStudioScene.jsx'
import LiveBuildSummary from './components/LiveBuildSummary.jsx'
import SpecificationChips from './components/SpecificationChips.jsx'
import { componentToProduct, productTitle } from './utils/catalogue.js'
import { publicAsset } from './utils/assets.js'
import { loadRazorpayCheckout } from './utils/razorpayCheckout.js'
import { checkBuildCompatibility, createOrder, createPaymentCheckout, downloadInvoice, getComponents, getOrder, getRecommendation, reportPaymentFailure, saveBuild, verifyPayment } from './api/client.js'

const componentIcons = { 'Processors (CPU)': 'Cpu', CPU: 'Cpu', 'Graphics Cards (GPU)': 'Gpu', GPU: 'Gpu', Motherboards: 'CircuitBoard', RAM: 'MemoryStick', 'SSDs and HDDs': 'Database', Storage: 'Database', 'Power Supplies': 'Zap', PSU: 'Zap', 'PC Cabinets and Cases': 'Box', Case: 'Box', 'CPU Coolers': 'Fan', 'CPU Cooler': 'Fan', 'Case Fans': 'Fan', Monitors: 'Monitor', Monitor: 'Monitor', Keyboards: 'Keyboard', Keyboard: 'Keyboard', 'Gaming Mice': 'Mouse', Mouse: 'Mouse', 'Gaming Chairs': 'Box', 'Headphones and Speakers': 'Headphones', 'Gaming Controllers': 'Gamepad2', Mousepads: 'PanelsTopLeft', 'Networking Devices': 'Wifi', 'Other PC Accessories': 'Cable' }
function toShopProduct(component) {
  const product = componentToProduct(component, import.meta.env.BASE_URL)
  return { ...product, icon: componentIcons[product.category] || 'Cpu' }
}
function toBuildPart(component) {
  const product = toShopProduct(component)
  return { id: product.id, name: product.name, brand: product.brand, price: product.price, specs: product.specs, isDemoData: product.isDemoData, image: product.image, fallbackImage: product.fallbackImage, imageAlt: product.imageAlt, icon: product.icon }
}

const useCases = [
  { id: 'Gaming', icon: Gamepad2, copy: 'Frame rates, responsive play, and a graphics path that fits your budget.', image: 'https://images.unsplash.com/photo-1636489953081-c4ebbd50fa3a?auto=format&fit=crop&w=1200&q=85' },
  { id: 'Programming & Development', icon: Code2, copy: 'A smooth workspace for editors, local tools, and multitasking.', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=85' },
  { id: 'Content Creation', icon: Video, copy: 'Memory and graphics headroom for creative workloads.', image: 'https://images.unsplash.com/photo-1779896412277-c4fd15c7a89c?auto=format&fit=crop&w=1200&q=85' },
  { id: 'Study & Office', icon: GraduationCap, copy: 'Everyday speed for classes, research, calls, and the essentials.', image: 'https://images.unsplash.com/photo-1573879409095-e47e5759ed0f?auto=format&fit=crop&w=1200&q=85' },
]
const prebuiltFilters = ['All prebuilt PCs', ...featuredPrebuilts.map((item) => item.use)]
const DEFAULT_PREFERENCE = 'balanced'
const primaryNavIds = ['home', 'builder', 'components', 'prebuilt', 'showcase']
const navDisplayLabels = { builder: 'PC Builder', prebuilt: 'Builds' }
const navIcons = { home: House, builder: Cpu, components: CircuitBoard, prebuilt: Monitor, showcase: Images }
const navLinks = siteNavigationRoutes.filter(({ id }) => primaryNavIds.includes(id)).map(({ id, label, path }) => [id, navDisplayLabels[id] || label, path])
const componentKeys = ['cpu', 'motherboard', 'ram', 'storage', 'psu', 'case']
const categoryKeys = { 'CPU': 'cpu', 'Processors (CPU)': 'cpu', 'GPU': 'gpu', 'Graphics Cards (GPU)': 'gpu', Motherboard: 'motherboard', Motherboards: 'motherboard', RAM: 'ram', Storage: 'storage', 'SSDs and HDDs': 'storage', PSU: 'psu', 'Power Supplies': 'psu', Case: 'case', 'PC Cabinets and Cases': 'case', 'CPU Cooler': 'cooling', 'CPU Coolers': 'cooling' }
const backendUse = { Gaming: 'gaming', 'Study & Office': 'office', 'Programming & Development': 'programming', 'Content Creation': 'video_editing' }

function Media({ src, alt, className = '', fallback = 'PCForge build' }) {
  const [failed, setFailed] = useState(false)
  return failed ? <div className={`media-fallback ${className}`} aria-label={fallback}><div className="fallback-case"><span /><i /><i /><i /></div><small>{fallback}</small></div> : <img className={className} src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
}

function LoopingVisual({ src, poster, alt, className = '', loading = 'lazy' }) {
  const [failed, setFailed] = useState(false)
  return <div className={`looping-visual ${className}`}>
    {failed
      ? <img src={poster} alt={alt} />
      : <picture><source media="(prefers-reduced-motion: reduce)" srcSet={poster} /><img src={src} alt={alt} loading={loading} decoding="async" onError={() => setFailed(true)} /></picture>}
  </div>
}

function Reveal({ children, className = '', delay = 0 }) {
  const reduce = useReducedMotion()
  return <motion.div className={className} initial={reduce ? false : { opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.14 }} transition={{ duration: reduce ? 0 : 0.62, delay }}>{children}</motion.div>
}

function Header({ onConfigure, cartCount, wishlistCount, onOpenCart, onOpenWishlist, searchTerm, onSearch }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const move = (path) => { navigate(path); setOpen(false) }
  return <header className="topbar"><Link className="brand" to="/" onClick={() => setOpen(false)}><img className="brand-logo" src={publicAsset('/images/pcforge-logo.jpg')} alt="PCForge logo" /><span>PC<span className="gold">FORGE</span><small>BUILT AROUND YOU</small></span></Link>
    <div className="header-search"><Search size={15} /><input aria-label="Search products" placeholder="Search components..." value={searchTerm} onChange={(e) => onSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') move('/components') }} /><button aria-label="Show search results" onClick={() => move('/components')}><ArrowRight size={14} /></button></div>
    <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label={open ? 'Close navigation' : 'Open navigation'}>{open ? <X /> : <Menu />}</button>
    <nav className={open ? 'nav-links open' : 'nav-links'} aria-label="Main navigation">{navLinks.map(([id, label, path]) => { const Icon = navIcons[id]; return <NavLink key={path} to={path} end={path === '/'} className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setOpen(false)}>{Icon && <Icon size={16} strokeWidth={1.8} />}<span>{label}</span></NavLink> })}</nav><div className="header-actions"><button className="header-icon-button" onClick={onOpenWishlist} aria-label={`Wishlist, ${wishlistCount} saved products`}><Heart size={18} /><span>{wishlistCount}</span></button><button className="header-icon-button" onClick={onOpenCart} aria-label={`Shopping cart, ${cartCount} items`}><ShoppingBag size={18} /><span>{cartCount}</span></button><button className="nav-cta" onClick={onConfigure}>Build Your PC <ArrowRight size={15} /></button></div>
  </header>
}

function SectionTitle({ eyebrow, title, copy, light = false }) {
  return <div className={`section-title ${light ? 'section-title-light' : ''}`}><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{copy && <p>{copy}</p>}</div>
}

const hardwareParts = [
  { id: 'cpu', name: 'Processor', category: 'CPU', icon: 'Cpu', summary: 'The CPU runs program instructions and coordinates work across the system.', detail: 'Core count, clock behavior, socket, and power limits help determine which workloads a processor handles well. A motherboard must use a compatible socket.' },
  { id: 'cooling', name: 'CPU cooler', category: 'Cooling', icon: 'Fan', summary: 'The cooler moves heat away from the processor.', detail: 'Air coolers use a heatsink and fan; liquid coolers move heat through a radiator. Cooler height, radiator size, and socket mounting all affect fit.' },
  { id: 'motherboard', name: 'Motherboard', category: 'Platform', icon: 'CircuitBoard', summary: 'The motherboard connects the processor, memory, storage, and add-in cards.', detail: 'Its CPU socket and memory generation define the platform. Expansion slots, storage connectors, and case size determine what else can be installed.' },
  { id: 'ram', name: 'Memory', category: 'RAM', icon: 'MemoryStick', summary: 'RAM holds the data and applications the processor is actively using.', detail: 'Capacity, memory generation, speed, and the number of modules matter. DDR4 and DDR5 are physically and electrically different.' },
  { id: 'gpu', name: 'Graphics card', category: 'GPU', icon: 'Gpu', summary: 'A GPU renders graphics and accelerates many visual and parallel workloads.', detail: 'Check card length and thickness against the case, and confirm the power supply has enough capacity and the required connectors.' },
  { id: 'storage', name: 'Storage', category: 'Storage', icon: 'Database', summary: 'An SSD or hard drive keeps files and software when the PC is off.', detail: 'NVMe drives use M.2 slots; SATA drives need a SATA data connection and power. Capacity and workload influence which type is suitable.' },
  { id: 'psu', name: 'Power supply', category: 'Power', icon: 'Zap', summary: 'The PSU converts wall power into regulated power for the components.', detail: 'Choose a reputable unit with suitable wattage, protection features, and connectors. The GPU and CPU are major parts of the power estimate.' },
  { id: 'case', name: 'Case and fans', category: 'Enclosure', icon: 'Box', summary: 'The case holds the hardware and helps provide airflow.', detail: 'Motherboard form factor, GPU clearance, cooler dimensions, radiator support, and fan positions all affect the build.' },
]

function HardwareExplorer() {
  const [selectedId, setSelectedId] = useState(hardwareParts[0].id)
  const selected = hardwareParts.find((part) => part.id === selectedId) || hardwareParts[0]
  return <section className="hardware-explorer-section section-pad">
    <div className="section-top"><SectionTitle eyebrow="PC HARDWARE, EXPLAINED" title="Explore what’s inside." copy="Choose a component to learn what it does and which fit questions matter when planning a PC." /><span className="side-note">INTERACTIVE COMPONENT GUIDE</span></div>
    <div className="hardware-explorer-grid"><PCStudioScene selectedId={selectedId} onSelect={setSelectedId} controls className="hardware-studio-scene" />
      <article className="hardware-part-detail" aria-live="polite"><div className="hardware-part-copy"><span className="eyebrow">{selected.category} · COMPONENT GUIDE</span><h3>{selected.name}</h3><p className="hardware-part-summary">{selected.summary}</p><p>{selected.detail}</p><div className="hardware-fit-note"><ShieldCheck size={17} /><span><b>Fit depends on the full parts list.</b><small>Use verified component specifications before purchasing.</small></span></div></div></article>
    </div>
  </section>
}

function App() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const reduceMotion = useReducedMotion()
  const route = resolveSiteRoute(pathname)
  const page = route.id
  const [budget, setBudget] = useState(65000)
  const [budgetDraft, setBudgetDraft] = useState('65,000')
  const [usage, setUsage] = useState('Gaming')
  const [build, setBuild] = useState(null)
  const [generatedFor, setGeneratedFor] = useState(null)
  const [activeExample, setActiveExample] = useState(null)
  const [checkout, setCheckout] = useState(false)
  const [checkoutView, setCheckoutView] = useState('details')
  const [contact, setContact] = useState({ name: '', email: '', phone: '', address: '' })
  const [contactErrors, setContactErrors] = useState({})
  const [copied, setCopied] = useState(false)
  const [contactForm, setContactForm] = useState({ name: '', email: '', usage: '', budget: '', message: '' })
  const [contactFormState, setContactFormState] = useState({ errors: {}, sent: false })
  const [showResults, setShowResults] = useState(false)
  const [builderStep, setBuilderStep] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [priceCeiling, setPriceCeiling] = useState(100000)
  const [sortBy, setSortBy] = useState('featured')
  const [cart, setCart] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('pcforge-cart') || '[]')
      if (!Array.isArray(saved)) return []
      return saved.map((item) => {
        const productId = item?.key?.startsWith('product:') ? item.key.slice('product:'.length) : null
        const product = products.find((entry) => entry.id === productId)
        const componentId = item?.componentId || (/^[a-f\d]{24}$/i.test(productId || '') ? productId : null)
        return product ? { ...item, componentId, isDemoData: true, brand: product.brand, name: product.name, specs: product.specs, icon: product.icon, tone: product.tone, image: product.image, fallbackImage: product.fallbackImage, imageAlt: product.imageAlt, imageSource: product.imageSource } : { ...item, componentId }
      })
    } catch { return [] }
  })
  const [wishlist, setWishlist] = useState(() => { try { const saved = JSON.parse(localStorage.getItem('pcforge-wishlist') || '[]'); return Array.isArray(saved) ? saved : [] } catch { return [] } })
  const [cartOpen, setCartOpen] = useState(false)
  const [wishlistOpen, setWishlistOpen] = useState(false)
  const [cartCheckoutOpen, setCartCheckoutOpen] = useState(false)
  const campaigns = demoCampaigns
  const [productDetail, setProductDetail] = useState(null)
  const [prebuiltDetail, setPrebuiltDetail] = useState(null)
  const [activePrebuiltUse, setActivePrebuiltUse] = useState('All prebuilt PCs')
  const [apiProducts, setApiProducts] = useState([])
  const [knownApiProducts, setKnownApiProducts] = useState({})
  const [catalogHasMore, setCatalogHasMore] = useState(false)
  const [catalogLoadingMore, setCatalogLoadingMore] = useState(false)
  const [catalogState, setCatalogState] = useState({ loading: false, error: '' })
  const [catalogHasLiveProducts, setCatalogHasLiveProducts] = useState(null)
  const [buildState, setBuildState] = useState({ loading: false, error: '', saved: '' })
  const [buildOptions, setBuildOptions] = useState({})
  const [checkoutBuild, setCheckoutBuild] = useState(null)
  const [activeOrder, setActiveOrder] = useState(() => {
    try { const id = sessionStorage.getItem('pcforge-active-order'); const accessToken = id && sessionStorage.getItem(`pcforge-order-${id}`); return id && accessToken ? { id, accessToken, order: null } : null } catch { return null }
  })
  const [checkoutError, setCheckoutError] = useState('')
  const [pendingPaymentResult, setPendingPaymentResult] = useState(null)
  const orderSubmissionLock = useRef(false)
  const paymentFlowLock = useRef(false)

  const [compatibility, setCompatibility] = useState([])
  const amount = build ? getBuildTotal(build) : 0
  const visibleComponentKeys = build ? [...componentKeys, ...(build.gpu ? ['gpu'] : []), ...(build.cooling ? ['cooling'] : [])] : []
  const summaryComponentKeys = [...componentKeys, 'gpu', 'cooling']
  const recommendationOutOfDate = !build || generatedFor?.budget !== budget || generatedFor?.usage !== usage
  const hasRequiredBuildParts = Boolean(build && componentKeys.every((key) => build[key]?.id && Number.isSafeInteger(build[key]?.price) && build[key].price >= 0))
  const canSaveBuild = Boolean(hasRequiredBuildParts && generatedFor && !recommendationOutOfDate && !buildState.loading && amount !== null && amount > 0)
  const canAddBuildToCart = Boolean(canSaveBuild)
  const canCheckoutRecommendation = Boolean(canAddBuildToCart && (!generatedFor.demoData || generatedFor.testCheckoutEnabled === true))
  const cartCount = cartItemCount(cart)
  const cartSubtotal = cartTotal(cart)
  const wishlistProducts = [...products, ...Object.values(knownApiProducts)].filter((product, index, all) => wishlist.includes(product.id) && all.findIndex((item) => item.id === product.id) === index)
  const demoProducts = products
    .filter((product) => selectedCategory === 'all' || product.category === selectedCategory)
    .filter((product) => selectedBrand === 'all' || product.brand === selectedBrand)
    .filter((product) => product.price <= priceCeiling)
    .filter((product) => {
      const query = searchTerm.trim().toLowerCase()
      return !query || [product.name, product.brand, product.category, ...(product.specs || [])].some((value) => String(value).toLowerCase().includes(query))
    })
    .sort((left, right) => sortBy === 'price-low' ? left.price - right.price : sortBy === 'price-high' ? right.price - left.price : sortBy === 'name' ? left.name.localeCompare(right.name) : 0)
  const usingDemoProducts = apiProducts.length === 0 && (catalogHasLiveProducts !== true || Boolean(catalogState.error))
  const brandOptions = [...new Set((usingDemoProducts ? products : apiProducts).map((product) => product.brand).filter(Boolean))].sort()
  const shopProducts = usingDemoProducts ? demoProducts : apiProducts
  const visiblePrebuilts = featuredPrebuilts.filter((item) => activePrebuiltUse === 'All prebuilt PCs' || item.use === activePrebuiltUse)
  const catalogueCampaign = getCampaignById(campaigns, campaignPlacements.componentsByCategory[selectedCategory])
  const addCartItem = (item) => setCart((current) => addOrIncrement(current, item))
  const addProduct = (product) => { const componentId = /^[a-f\d]{24}$/i.test(product.id || '') ? product.id : null; addCartItem({ key: `product:${product.id}`, kindLabel: 'Component', componentId, isDemoData: product.isDemoData === true, brand: product.brand, name: product.name, price: product.price, specs: product.specs, icon: product.icon, tone: product.tone, image: product.image, fallbackImage: product.fallbackImage, imageAlt: product.imageAlt, imageSource: product.imageSource }); setCartOpen(true); setWishlistOpen(false) }
  const addPrebuilt = (item) => { addCartItem({ key: `prebuilt:${item.id}`, kindLabel: 'Prebuilt PC · Sample estimate', name: item.name, price: item.price, specs: item.specs, icon: 'Box', tone: item.tone, image: item.image }); setCartOpen(true) }
  const addConfiguredBuild = () => { if (!build) return; const key = `custom:${visibleComponentKeys.map((part) => build[part].id).join('-')}`; addCartItem({ key, kindLabel: 'Custom PC configuration · Estimate', name: `Custom build · ${generatedFor?.usage || 'PCForge configuration'}`, price: amount, specs: visibleComponentKeys.map((part) => `${categoryLabels[part]}: ${build[part].name}`), icon: 'Cpu', tone: 'gold' }); setCartOpen(true) }
  const toggleWishlist = (product) => setWishlist((current) => current.includes(product.id) ? current.filter((id) => id !== product.id) : [...current, product.id])
  const updateQuantity = (key, quantity) => setCart((current) => setCartQuantity(current, key, quantity))
  const removeCartItem = (key) => setCart((current) => removeFromCart(current, key))
  const openShop = () => navigate('/components')
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })
  const openConfigurator = () => { navigate('/builder'); setTimeout(() => document.getElementById('budget-entry')?.focus({ preventScroll: true }), 450) }

  const generate = async () => {
    const parsedBudget = Number(String(budgetDraft).replaceAll(',', '').trim())
    if (!Number.isSafeInteger(parsedBudget) || parsedBudget < 20000 || parsedBudget > 500000) {
      setBuildState({ loading: false, error: 'Enter a whole-number tower budget from ₹20,000 to ₹5,00,000.', saved: '' })
      return
    }
    setBudget(parsedBudget)
    setBuild(null); setShowResults(false)
    setCheckoutBuild(null)
    setBuildState({ loading: true, error: '', saved: '' })
    try {
      const response = await getRecommendation(parsedBudget, backendUse[usage], DEFAULT_PREFERENCE)
      const result = response.recommendation
      const next = Object.fromEntries(result.components.map((part) => {
        const key = categoryKeys[part.category]
        return [key, toBuildPart(part)]
      }).filter(([key]) => key))
      setBuild(next); setGeneratedFor({ usage, preference: DEFAULT_PREFERENCE, budget: parsedBudget, explanation: result.explanation, compatibility: result.compatibility, demoData: result.demoData === true, testCheckoutEnabled: result.testCheckoutEnabled === true, paymentsEnabled: result.paymentsEnabled === true }); setShowResults(true); setBuilderStep(3)
      setCompatibility(result.compatibility?.findings || [])
      setTimeout(() => document.getElementById('build-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
      setBuildState({ loading: false, error: '', saved: '' })
    } catch (error) { setBuildState({ loading: false, error: error.message || 'A live recommendation could not be created.', saved: '' }) }
  }
  const replacePart = async (key, id) => {
    const selected = buildOptions[key]?.find((item) => item.id === id)
    if (!selected) return
    const next = { ...build, [key]: selected }
    const componentIds = Object.values(next).filter((item) => item?.id).map((item) => item.id)
    try {
      const response = await checkBuildCompatibility(componentIds)
      const result = response.compatibility
      setBuild(next)
      setCheckoutBuild(null)
      setCompatibility(result.findings || [])
      setGeneratedFor((current) => ({ ...current, compatibility: result }))
    } catch (error) { setBuildState((current) => ({ ...current, error: error.message || 'Compatibility could not be refreshed.' })) }
  }
  const addOptionalPart = async (key, id) => {
    const selected = buildOptions[key]?.find((item) => item.id === id)
    if (!selected || !build) return
    const next = { ...build, [key]: selected }
    const componentIds = Object.values(next).filter((item) => item?.id).map((item) => item.id)
    try {
      const response = await checkBuildCompatibility(componentIds)
      setBuild(next); setCheckoutBuild(null)
      setCompatibility(response.compatibility?.findings || [])
      setGeneratedFor((current) => ({ ...current, compatibility: response.compatibility }))
      setBuildState((current) => ({ ...current, error: '', saved: '' }))
    } catch (error) { setBuildState((current) => ({ ...current, error: error.message || 'Compatibility could not be refreshed.' })) }
  }
  const removeOptionalPart = async (key) => {
    if (!build?.[key]) return
    const next = { ...build }
    delete next[key]
    const componentIds = Object.values(next).filter((item) => item?.id).map((item) => item.id)
    try {
      const response = await checkBuildCompatibility(componentIds)
      setBuild(next); setCheckoutBuild(null)
      setCompatibility(response.compatibility?.findings || [])
      setGeneratedFor((current) => ({ ...current, compatibility: response.compatibility }))
      setBuildState((current) => ({ ...current, error: '', saved: '' }))
    } catch (error) { setBuildState((current) => ({ ...current, error: error.message || 'Compatibility could not be refreshed.' })) }
  }
  const reviewComponent = (key) => {
    const target = document.getElementById(build?.[key] ? `build-component-${key}` : `build-optional-${key}`)
    if (!target) { generate(); return }
    target?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' })
    target?.focus?.({ preventScroll: true })
  }
  const continueFromSummary = () => {
    if (recommendationOutOfDate) { generate(); return }
    setBuilderStep(4)
    document.getElementById('build-result')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }
  const navigateBuilderStep = (step) => {
    if (step >= 3 && !showResults) { generate(); return }
    setBuilderStep(step)
    const targetId = ({ 1: 'builder-workload', 2: 'builder-budget', 3: 'build-result', 4: 'build-result' })[step]
    document.getElementById(targetId)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' })
  }
  const resetBuild = () => { setBuild(null); setCheckoutBuild(null); setGeneratedFor(null); setShowResults(false); setBuilderStep(1); setBuildState({ loading: false, error: '', saved: '' }); setBudget(65000); setBudgetDraft('65,000'); setUsage('Gaming') }
  const startSimilar = (item) => {
    const plans = {
      student: { budget: 42000, usage: 'Study & Office' },
      gaming: { budget: 68000, usage: 'Gaming' },
      dev: { budget: 62000, usage: 'Programming & Development' },
      creator: { budget: 92000, usage: 'Content Creation' },
    }
    const plan = plans[item.id]
    setBudget(plan.budget); setBudgetDraft(plan.budget.toLocaleString('en-IN')); setUsage(plan.usage); setBuild(null); setShowResults(false); setActiveExample(null)
    setTimeout(openConfigurator, 40)
  }
  const copySummary = async () => {
    const summary = visibleComponentKeys.map((key) => `${categoryLabels[key]}: ${build[key].name} — ${formatINR(build[key].price)}`).join('\n') + `\nEstimated total: ${formatINR(amount)}`
    try { await navigator.clipboard.writeText(summary); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { setCopied(false) }
  }
  const persistBuild = async () => {
    try {
      const response = await saveBuild({ componentIds: visibleComponentKeys.map((key) => build[key].id), intendedUse: backendUse[generatedFor.usage], preference: generatedFor.preference, budgetInr: generatedFor.budget })
      sessionStorage.setItem(`pcforge-build-${response.build.id}`, response.sessionToken)
      setBuildState({ loading: false, error: '', saved: `Saved build ${response.build.id}. Its private session token is stored in this browser tab.` })
    } catch (error) { setBuildState({ loading: false, error: error.message || 'Build could not be saved.', saved: '' }) }
  }
  const openCheckout = () => { setCheckout(true); setCheckoutView('details'); setCheckoutError(''); setContactErrors({}) }
  const closeCheckout = () => { setCheckout(false); setCheckoutView('details'); setContact({ name: '', email: '', phone: '', address: '' }); setContactErrors({}); setCheckoutError('') }
  const validateCheckout = () => {
    const errors = {}
    if (!contact.name.trim()) errors.name = 'Add your name to continue.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) errors.email = 'Enter a valid email address.'
    if (!/^[0-9+\s()-]{8,18}$/.test(contact.phone)) errors.phone = 'Enter a valid phone number.'
    if (!contact.address.trim()) errors.address = 'Enter your delivery address.'
    setContactErrors(errors); return Object.keys(errors).length === 0
  }
  const placeBuildOrder = async () => {
    if (orderSubmissionLock.current || !validateCheckout() || !build || !generatedFor) return
    orderSubmissionLock.current = true
    setCheckoutView('processing'); setCheckoutError('')
    try {
      let saved = checkoutBuild
      if (!saved) {
        const savedResponse = await saveBuild({ componentIds: visibleComponentKeys.map((key) => build[key].id), intendedUse: backendUse[generatedFor.usage], preference: generatedFor.preference, budgetInr: generatedFor.budget })
        saved = { build: savedResponse.build, sessionToken: savedResponse.sessionToken }
        setCheckoutBuild(saved)
        sessionStorage.setItem(`pcforge-build-${saved.build.id}`, saved.sessionToken)
      }
      const idempotencyStorageKey = `pcforge-order-key-${saved.build.id}`
      const idempotencyKey = sessionStorage.getItem(idempotencyStorageKey) || (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`)
      sessionStorage.setItem(idempotencyStorageKey, idempotencyKey)
      const created = await createOrder({ buildId: saved.build.id, customer: contact }, saved.sessionToken, idempotencyKey)
      const order = created.order
      sessionStorage.setItem(`pcforge-order-${order.id}`, created.accessToken)
      sessionStorage.setItem('pcforge-active-order', order.id)
      const currentOrder = { id: order.id, accessToken: created.accessToken, order }
      setActiveOrder(currentOrder)
      setCheckoutView('review')
    } catch (error) { setCheckoutError(error.message || 'Order could not be created.'); setCheckoutView('details') }
    finally { orderSubmissionLock.current = false }
  }
  const startPayment = async () => {
    if (!activeOrder || paymentFlowLock.current) return
    paymentFlowLock.current = true
    setCheckoutView('processing'); setCheckoutError('')
    try {
      if (pendingPaymentResult) {
        try {
          const verifiedResult = await verifyPayment(activeOrder.id, activeOrder.accessToken, pendingPaymentResult.razorpay_payment_id, pendingPaymentResult.razorpay_signature)
          setPendingPaymentResult(null)
          setActiveOrder((current) => ({ ...current, order: verifiedResult.order }))
          setCheckoutView(verifiedResult.paymentStatus === 'paid' ? 'success' : verifiedResult.paymentStatus === 'failed' ? 'failure' : 'pending')
        } catch (error) {
          if (error.status && error.status < 500) { setPendingPaymentResult(null); setCheckoutView('failure') }
          else setCheckoutView('pending')
          setCheckoutError(error.message || 'Payment verification is still pending.')
        } finally { paymentFlowLock.current = false }
        return
      }
      const key = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const paymentResponse = await createPaymentCheckout(activeOrder.id, activeOrder.accessToken, key)
      const checkout = paymentResponse.checkout
      await loadRazorpayCheckout()
      let verified = false
      const razorpay = new window.Razorpay({
        key: checkout.keyId, amount: checkout.amountPaise, currency: checkout.currency, order_id: checkout.razorpayOrderId,
        name: 'PCForge', description: `Order ${activeOrder.order.orderNumber}`,
        prefill: { name: contact.name, email: contact.email, contact: contact.phone },
        theme: { color: '#ffc64a' },
        handler: async (result) => {
          setPendingPaymentResult(result)
          try {
            const verifiedResult = await verifyPayment(activeOrder.id, activeOrder.accessToken, result.razorpay_payment_id, result.razorpay_signature)
            verified = true
            setPendingPaymentResult(null)
            setActiveOrder((current) => ({ ...current, order: verifiedResult.order }))
            setCheckoutView(verifiedResult.paymentStatus === 'paid' ? 'success' : verifiedResult.paymentStatus === 'failed' ? 'failure' : 'pending')
          } catch (error) {
            verified = true
            if (error.status && error.status < 500) { setPendingPaymentResult(null); setCheckoutView('failure') }
            else setCheckoutView('pending')
            setCheckoutError(error.message || 'Payment verification is still pending.')
          }
          finally { paymentFlowLock.current = false }
        },
        modal: { ondismiss: () => { if (!verified) { setCheckoutError('Checkout was closed before a confirmed payment. Your order remains unpaid.'); setCheckoutView('pending'); paymentFlowLock.current = false } } },
      })
      razorpay.on('payment.failed', async (event) => {
        verified = true
        const paymentId = event.error?.metadata?.payment_id
        try {
          if (paymentId) {
            const failed = await reportPaymentFailure(activeOrder.id, activeOrder.accessToken, paymentId)
            setActiveOrder((current) => ({ ...current, order: failed.order }))
          }
        } catch (error) {
          setCheckoutError(error.message || 'Razorpay reported a failure, but the server could not confirm it yet.')
        } finally {
          paymentFlowLock.current = false
          setCheckoutView('failure')
        }
      })
      setCheckoutView('payment'); razorpay.open()
    } catch (error) { paymentFlowLock.current = false; setCheckoutError(error.message || 'Payment could not be started.'); setCheckoutView(activeOrder ? 'review' : 'details') }
  }
  const downloadCurrentInvoice = async () => {
    if (!activeOrder) return
    try {
      const file = await downloadInvoice(activeOrder.id, activeOrder.accessToken)
      const url = URL.createObjectURL(file); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${activeOrder.order?.invoiceNumber || activeOrder.order?.orderNumber || 'pcforge-estimate'}.pdf`; anchor.click(); URL.revokeObjectURL(url)
    } catch (error) { setCheckoutError(error.message || 'Invoice could not be downloaded.') }
  }
  const submitContact = (event) => {
    event.preventDefault()
    const errors = {}
    if (!contactForm.name.trim()) errors.name = 'Please enter your name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email)) errors.email = 'Please enter a valid email.'
    if (!contactForm.usage) errors.usage = 'Choose your intended usage.'
    setContactFormState({ errors, sent: Object.keys(errors).length === 0 })
  }

  useEffect(() => { window.scrollTo(0, 0) }, [page])
  useEffect(() => { document.title = route.title }, [route.title])
  useEffect(() => { try { localStorage.setItem('pcforge-cart', JSON.stringify(cart)) } catch {} }, [cart])
  useEffect(() => { try { localStorage.setItem('pcforge-wishlist', JSON.stringify(wishlist)) } catch {} }, [wishlist])
  useEffect(() => {
    let cancelled = false
    getComponents({ page: 1, limit: 1 })
      .then((data) => { if (!cancelled) setCatalogHasLiveProducts((data?.pagination?.total || 0) > 0) })
      .catch(() => { if (!cancelled) setCatalogHasLiveProducts(false) })
    return () => { cancelled = true }
  }, [])
  useEffect(() => {
    if (!activeOrder?.id || activeOrder.order) return undefined
    let cancelled = false
    getOrder(activeOrder.id, activeOrder.accessToken).then((data) => { if (!cancelled) setActiveOrder((current) => current?.id === activeOrder.id ? { ...current, order: data.order } : current) })
      .catch((error) => { if (!cancelled) setCheckoutError(error.message || 'The saved order could not be retrieved.') })
    return () => { cancelled = true }
  }, [activeOrder?.id])
  useEffect(() => {
    let cancelled = false
    const sort = ({ 'price-low': 'priceAsc', 'price-high': 'priceDesc', name: 'name', featured: 'name' })[sortBy]
    setCatalogState({ loading: true, error: '' })
    getComponents({ category: selectedCategory, brand: selectedBrand, maxPrice: priceCeiling, search: searchTerm, sort, page: 1, limit: 100 })
      .then((data) => { if (!cancelled) { const listed = (data?.components || []).map(toShopProduct); setApiProducts(listed); setKnownApiProducts((current) => ({ ...current, ...Object.fromEntries(listed.map((item) => [item.id, item])) })); setCatalogHasMore((data?.pagination?.totalPages || 0) > 1); setCatalogState({ loading: false, error: '' }) } })
      .catch((error) => { if (!cancelled) { setApiProducts([]); setCatalogState({ loading: false, error: error.message || 'The component catalogue is unavailable.' }) } })
    return () => { cancelled = true }
  }, [selectedCategory, selectedBrand, priceCeiling, searchTerm, sortBy])
  const loadMoreCatalog = async () => {
    if (catalogLoadingMore || !catalogHasMore) return
    setCatalogLoadingMore(true)
    const sort = ({ 'price-low': 'priceAsc', 'price-high': 'priceDesc', name: 'name', featured: 'name' })[sortBy]
    try {
      const data = await getComponents({ category: selectedCategory, brand: selectedBrand, maxPrice: priceCeiling, search: searchTerm, sort, page: Math.floor(apiProducts.length / 100) + 1, limit: 100 })
      const listed = (data?.components || []).map(toShopProduct)
      setApiProducts((current) => [...current, ...listed])
      setKnownApiProducts((current) => ({ ...current, ...Object.fromEntries(listed.map((item) => [item.id, item])) }))
      setCatalogHasMore((data?.pagination?.totalPages || 0) > Math.ceil((apiProducts.length + listed.length) / 100))
    } catch (error) { setCatalogState((current) => ({ ...current, error: error.message || 'More catalogue products could not be loaded.' })) }
    finally { setCatalogLoadingMore(false) }
  }
  useEffect(() => {
    if (!build) { setBuildOptions({}); return undefined }
    let cancelled = false
    const categoriesByKey = { cpu: 'Processors (CPU)', gpu: 'Graphics Cards (GPU)', motherboard: 'Motherboards', ram: 'RAM', storage: 'SSDs and HDDs', psu: 'Power Supplies', case: 'PC Cabinets and Cases', cooling: 'CPU Coolers' }
    Promise.all(Object.entries(categoriesByKey).map(async ([key, category]) => {
      try { const data = await getComponents({ category, sort: 'priceAsc' }); return [key, (data?.components || []).map(toBuildPart)] }
      catch { return [key, []] }
    })).then((entries) => { if (!cancelled) setBuildOptions(Object.fromEntries(entries)) })
    return () => { cancelled = true }
  }, [build])
  const visitCampaign = (campaign) => {
    const targetCategory = campaign.category === 'all' && selectedCategory !== 'all' ? selectedCategory : campaign.category
    if (categories.some((item) => item.id === targetCategory)) setSelectedCategory(targetCategory)
    openShop()
  }

  return <>
    <Header onConfigure={openConfigurator} cartCount={cartCount} wishlistCount={wishlist.length} onOpenCart={() => { setCartOpen(true); setWishlistOpen(false) }} onOpenWishlist={() => { setWishlistOpen(true); setCartOpen(false) }} searchTerm={searchTerm} onSearch={setSearchTerm} />
    <motion.main key={page} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.28, ease: 'easeOut' }}>
      {page === 'home' && <>
      <section className="hero" id="home">
        <div className="hero-orbit orbit-a" /><div className="hero-orbit orbit-b" />
        <div className="hero-copy"><div className="hero-kicker"><span /> CUSTOM PCS&nbsp; · &nbsp;REAL COMPONENTS&nbsp; · &nbsp;SMARTER BUILDS</div><h1>Build a PC<br />that <em>gets you.</em></h1><h2 className="hero-subtitle">Your workload. Your budget. Your machine.</h2><p>Choose components, check compatibility, and shape a PC for gaming, work, or creativity—all in one place.</p><div className="hero-actions"><button className="button button-gold" onClick={openConfigurator}><Wrench size={16} /> Start your build <ArrowRight size={16} /></button><button className="button button-line" onClick={openShop}><CircuitBoard size={16} /> Explore components</button></div><div className="hero-benefits"><span><Cpu size={14} /> Real component recommendations</span><span><ShieldCheck size={14} /> Compatibility checking</span><span><Gamepad2 size={14} /> Builds for every use case</span><span><Monitor size={14} /> Learn PC hardware</span></div></div>
        <div className="hero-art"><div className="hero-image-wrap"><LoopingVisual className="hero-media" src={publicAsset('/videos/hero.gif')} poster={publicAsset('/videos/hero-poster.png')} alt="Animated gaming PC showcase" loading="eager" /></div><div className="hero-art-label"><span>01 / PERSONAL BY DESIGN</span><strong>Precision, from the inside out.</strong></div><div className="hero-chip"><Zap size={14} /> PERFORMANCE, REFINED</div></div>
        <div className="hero-bottom"><span>SCROLL TO EXPLORE</span><span className="line" /><span>01 — 06</span></div>
      </section>

      <section className="main-promo section-pad"><div className="promo-overline"><span>FEATURED PLACEMENT</span><span>PLACEMENT PREVIEW</span></div><CampaignPlacement campaign={getCampaignById(campaigns, campaignPlacements.homeFeatured)} variant="hero" onVisit={visitCampaign} /><div className="promo-trust"><span><Check size={13} /> SAMPLE CAMPAIGNS ONLY</span><span>No real advertisers or retailer partnerships are represented.</span><button onClick={() => { navigate('/about'); setTimeout(() => scrollTo('business-model'), 80) }}>How placements could work <ArrowRight size={13} /></button></div></section>

      <section className="category-section section-pad"><div className="section-top"><SectionTitle eyebrow="FIND YOUR NEXT COMPONENT" title="Shop by category." copy="Explore individual parts and gaming gear without needing to configure a whole PC." /><button className="text-link" onClick={openShop}>Browse all components <ArrowRight size={15} /></button></div><div className="category-grid">{categories.filter((item) => item.id !== 'all').map((category) => <button className="category-tile" key={category.id} onClick={() => { setSelectedCategory(category.id); openShop() }}><ProductArt icon={category.icon} tone="blue" image={representativeImages[category.id]} alt={`${category.name} representative photo`} small /><span>{category.name}</span><ArrowUpRight size={14} /></button>)}</div></section>

      <section className="featured-products section-pad"><div className="section-top"><SectionTitle eyebrow="CURATED COMPONENTS" title="Build from the good stuff." copy="Sample catalogue highlights. Prices and stock status are illustrative, not live." /><button className="text-link" onClick={openShop}>Shop every component <ArrowRight size={15} /></button></div><div className="product-grid featured-product-grid">{products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} wishlisted={wishlist.includes(product.id)} onAdd={addProduct} onWishlist={toggleWishlist} onViewDetails={setProductDetail} />)}</div></section>
      <section className="home-build-highlights section-pad"><div className="section-top"><SectionTitle eyebrow="START WITH A DIRECTION" title="Builds to spark an idea." copy="A few illustrative configurations to explore. Review all sample specs and estimates before deciding." /><button className="text-link" onClick={() => navigate('/prebuilt')}>Explore all prebuilt PCs <ArrowRight size={15} /></button></div><div className="prebuilt-grid">{featuredPrebuilts.slice(0, 3).map((item) => <PrebuiltCard key={item.id} build={item} onView={setPrebuiltDetail} onAdd={addPrebuilt} />)}</div><p className="sample-stock-note">Sample configurations and estimates only; no live inventory or prices are implied.</p></section>

      </>}

      {page === 'components' && <>
      <section className="shop-section section-pad" id="shop-components"><div className="section-top shop-title-row"><SectionTitle eyebrow="THE COMPONENT SHOP" title="Find your next upgrade." copy="Search the live PCForge catalogue. If it is empty or unavailable, sample products are shown for preview." /><span className="catalogue-count">{shopProducts.length.toString().padStart(2, '0')} {usingDemoProducts ? 'CATALOGUE PREVIEW' : 'ACTIVE PRODUCTS'}</span></div><div className="shop-filters"><label className="filter-select">Category<select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><ChevronDown size={13} /></label><label className="filter-select">Brand<select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)}><option value="all">All brands</option>{brandOptions.map((brand) => <option key={brand}>{brand}</option>)}</select><ChevronDown size={13} /></label><label className="filter-select">Sort by<select value={sortBy} onChange={(e) => setSortBy(e.target.value)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A to Z</option></select><ChevronDown size={13} /></label><label className="price-filter">Up to <b>{formatINR(priceCeiling)}</b><input type="range" min="1000" max="100000" step="1000" value={priceCeiling} onChange={(e) => setPriceCeiling(Number(e.target.value))} aria-label="Maximum product price" /></label><button className="clear-filters" onClick={() => { setSelectedCategory('all'); setSelectedBrand('all'); setPriceCeiling(100000); setSortBy('featured'); setSearchTerm('') }}>Reset filters <RotateCcw size={13} /></button></div><div className="shop-category-chips">{categories.map((category) => <button key={category.id} className={selectedCategory === category.id ? 'active' : ''} onClick={() => setSelectedCategory(category.id)}>{category.name}</button>)}</div><div className="demo-stock-note"><Tag size={14} /> {usingDemoProducts ? "Preview only: these sample products and prices are not live inventory and are not stored in MongoDB." : "Showing active catalogue records. Prices and stock can change as the database is updated."}</div>{catalogState.loading && <p className="demo-stock-note" role="status">Loading active catalogue…</p>}{catalogState.error && <p className="demo-stock-note" role="alert">Catalogue unavailable: {catalogState.error}</p>}<div className="product-grid shop-product-grid">{shopProducts.length ? shopProducts.map((product, index) => <React.Fragment key={product.id}><ProductCard product={product} wishlisted={wishlist.includes(product.id)} onAdd={addProduct} onWishlist={toggleWishlist} onViewDetails={setProductDetail} />{catalogueCampaign && shouldPlaceCatalogueCampaign(index, shopProducts.length) && <CampaignPlacement key={`campaign-${catalogueCampaign.id}`} campaign={catalogueCampaign} variant="inline" onVisit={visitCampaign} />}</React.Fragment>) : <div className="shop-empty"><Search size={25} /><b>{catalogState.error ? 'Unable to load the active catalogue.' : catalogState.loading ? 'Loading active products…' : usingDemoProducts ? 'No demo products match these filters.' : 'No active products match these filters.'}</b><button onClick={() => { setSelectedCategory('all'); setSelectedBrand('all'); setPriceCeiling(100000); setSearchTerm('') }}>Clear filters</button></div>}</div>{catalogHasMore && <div className="shop-load-more"><button className="button button-darkline" onClick={loadMoreCatalog} disabled={catalogLoadingMore}>{catalogLoadingMore ? 'Loading…' : 'Load more products'}</button></div>}</section>
      </>}

      {page === 'about' && <>
      <section className="intro section-pad" id="brand-intro"><div className="intro-image"><Media src="https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=1100&q=85" alt="Clean, considered desktop workstation" fallback="A better way to build" /><div className="image-caption">GOOD HARDWARE. CLEAR CHOICES.</div><div className="intro-index">PF<br /><b>01</b></div></div><Reveal className="intro-copy"><span className="eyebrow">A MORE PERSONAL BUILD</span><h2>Power should<br /><i>be personal.</i></h2><p>PC building should start with what you need to do—not a spreadsheet full of parts. PCForge makes the process more approachable with considered recommendations, clear choices, and a build that feels like yours.</p><div className="intro-points"><div><span>01</span><p><b>Start with your world</b><small>Study, gaming, work, or creative flow.</small></p></div><div><span>02</span><p><b>Understand every choice</b><small>Specs and sample costs stay in plain sight.</small></p></div><div><span>03</span><p><b>Build with a next step in mind</b><small>Keep future upgrades part of the conversation.</small></p></div></div><button className="text-link" onClick={openConfigurator}>Find your starting point <ArrowRight size={16} /></button></Reveal></section>
      </>}

      {page === 'showcase' && <>
      <section className="builds section-pad" id="builds"><div className="section-top"><SectionTitle eyebrow="THE PCFORGE EDIT" title="Four ways to get started." copy="A few considered directions. Prices shown are sample estimates, not current market prices." /><span className="side-note">SAMPLE BUILDS <b>04</b></span></div><div className="build-grid">{exampleBuilds.map((item, index) => <Reveal key={item.id} delay={index * 0.07}><article className={`build-card tone-${item.tone}`}><div className="build-photo"><Media src={`https://images.unsplash.com/${item.image}?auto=format&fit=crop&w=900&q=80`} alt={`${item.name} PC build concept`} fallback="Build concept" /><span className="build-number">0{index + 1}</span><button aria-label={`View ${item.name} details`} className="round-action" onClick={() => setActiveExample(item)}><ArrowUpRight size={18} /></button></div><div className="build-info"><div className="build-use">{item.use}</div><h3>{item.name}</h3><p>{item.text}</p><ul>{item.specs.map((spec) => <li key={spec}>{spec}</li>)}</ul><div className="build-card-bottom"><span><small>SAMPLE ESTIMATE</small><b>{formatINR(item.price)}</b></span><button onClick={() => startSimilar(item)}>Configure similar <ArrowRight size={14} /></button></div></div></article></Reveal>)}</div></section>
      </>}

      {page === 'builder' && <>
      <section className="config-section section-pad" id="configurator">
        <div className="config-layout">
          <div className="config-heading"><SectionTitle light eyebrow="YOUR BUILD, YOUR WAY" title="Build Your PC" copy="A guided builder to help you choose the right components." /><div className="config-note"><ShieldCheck size={19} /><span>LIVE CATALOGUE PICKS<br /><small>Recommendations use active products and current database prices.</small></span></div></div>
          <section className="build-promo" aria-labelledby="build-promo-title">
            <LoopingVisual className="build-promo-visual" src={publicAsset('/videos/build.gif')} poster={publicAsset('/videos/build-poster.png')} alt="Animated PC components being assembled" />
            <div className="build-promo-copy"><span className="eyebrow">A BUILD THAT FITS YOU</span><h2 id="build-promo-title">Your Dream PC, Built Your Way</h2><p>Choose your workload, set your budget, and discover compatible components for your perfect build.</p><button className="button button-gold" type="button" onClick={() => scrollTo('builder-interface')}>Start Building <ArrowRight size={15} /></button></div>
          </section>
          <nav className="builder-progress" aria-label="PC build steps">{[['01','Workload',1],['02','Budget',2],['03','Components',3],['04','Review',4]].map(([number,label,step]) => <button type="button" key={step} className={builderStep === step ? 'active' : builderStep > step ? 'complete' : ''} aria-current={builderStep === step ? 'step' : undefined} onClick={() => navigateBuilderStep(step)}><span className="builder-step-number">{builderStep > step ? <Check size={14} /> : number}</span><b>{label}</b><small>{step === 1 ? 'What will you use it for?' : step === 2 ? 'Set your budget' : step === 3 ? 'Review chosen parts' : 'Check and finalise'}</small></button>)}</nav>
          <div className="config-form" id="builder-interface">
          <div className="step-block" id="builder-workload"><div className="step-heading"><span>01</span><div><h3>What will you use it for?</h3><p>Choose the primary use case. We’ll tailor recommendations for your needs.</p></div></div><div className="use-grid">{useCases.map(({ id, icon: Icon, copy, image }) => <button type="button" key={id} aria-pressed={usage === id} className={`use-card ${usage === id ? 'selected' : ''}`} style={{ '--use-card-image': 'url(' + JSON.stringify(image) + ')' }} onClick={() => { setUsage(id); setBuilderStep(1) }}><Icon size={20} /><b>{id}</b><small>{copy}</small><span className="select-dot">{usage === id && <Check size={11} />}</span></button>)}</div></div>
          <div className="step-block" id="builder-budget"><div className="step-heading"><span>02</span><div><h3>Set your budget</h3><p>Enter your target budget for the entire build. We recommend from ₹20,000 to ₹5,00,000.</p></div></div><div className="budget-input-row"><label htmlFor="budget-entry">Total PC budget</label><div className="budget-entry-wrap"><span aria-hidden="true">₹</span><input id="budget-entry" inputMode="numeric" autoComplete="off" value={budgetDraft} onFocus={() => setBuilderStep(2)} onChange={(event) => { const digits = event.target.value.replace(/\D/g, '').slice(0, 7); setBudgetDraft(digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')); setBudget(digits ? Number(digits) : 0); setBuilderStep(2); setBuildState((current) => ({ ...current, error: '' })) }} aria-describedby="budget-scope budget-help" aria-invalid={Boolean(buildState.error)} /></div><p id="budget-scope">Enter your total tower budget in Indian rupees.</p><p id="budget-help" className="budget-range-hint">Minimum ₹20,000 · Maximum ₹5,00,000</p></div><div className="quick-budgets" aria-label="Suggested tower budgets">{[30000, 50000, 75000, 100000].map((value) => <button type="button" className={budget === value ? 'active' : ''} key={value} onClick={() => { setBudget(value); setBudgetDraft(value.toLocaleString('en-IN')); setBuilderStep(2); setBuildState((current) => ({ ...current, error: '' })) }}>{formatINR(value)}</button>)}</div></div>
          <button className="button button-gold generate-button" onClick={generate} disabled={buildState.loading}><Sparkles size={17} /> {buildState.loading ? 'Loading active products…' : 'Generate My Build'} <ArrowRight size={16} /></button>{buildState.error && <p className="field-error" role="alert">{buildState.error}</p>}
        </div><LiveBuildSummary budget={budget} build={build} requiredKeys={componentKeys} visibleKeys={summaryComponentKeys} labels={categoryLabels} compatibility={generatedFor?.compatibility} onContinue={continueFromSummary} onReviewComponent={reviewComponent} onRemoveOptional={removeOptionalPart} loading={buildState.loading} error={buildState.error} actionLabel={recommendationOutOfDate ? 'View Recommended Build' : 'Review Your Build'} /></div>
        <AnimatePresence>{showResults && build && <motion.div id="build-result" className="result-panel" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}><div className="result-head"><div><span className="eyebrow">DATABASE RECOMMENDATION</span><h3>{generatedFor?.usage} <i>· Balanced recommendation</i></h3><p>{generatedFor.explanation}</p></div><div className="result-actions"><button className="button button-darkline" onClick={copySummary}><Clipboard size={15} /> {copied ? 'Copied' : 'Copy summary'}</button><button className="icon-button" onClick={resetBuild} aria-label="Reset build"><RotateCcw size={16} /></button></div></div>{generatedFor?.demoData && <p className="demo-stock-note" role="status">{generatedFor.testCheckoutEnabled ? 'TEST CATALOGUE ONLY: sample products and prices are in the isolated test database. No live stock or production inventory is used.' : 'Demo catalogue only: these sample products and prices are not live inventory and cannot be ordered.'}</p>}<div className="component-grid">{visibleComponentKeys.map((key) => <div className="component-row" id={`build-component-${key}`} key={key} tabIndex={-1}><div className="component-icon"><ProductArt thumbnail icon={build[key].icon || (key === 'gpu' ? 'Gpu' : key === 'cooling' ? 'Fan' : 'Cpu')} image={build[key].image} alt={build[key].imageAlt || `${productTitle(build[key].name, build[key].brand)} product photo`} /></div><div className="component-name"><span>{categoryLabels[key]}</span><b>{productTitle(build[key].name, build[key].brand)}</b><small>{build[key].spec}</small></div>{buildOptions[key]?.length > 1 ? <select value={build[key].id} onChange={(e) => replacePart(key, e.target.value)} aria-label={`Choose ${categoryLabels[key]}`}>{buildOptions[key].map((item) => <option key={item.id} value={item.id}>{productTitle(item.name, item.brand)} · {formatINR(item.price)}</option>)}</select> : <span className="component-brand">{build[key].brand}</span>}<strong className="component-price">{formatINR(build[key].price)}</strong></div>)}</div><div className="optional-parts-row">{['gpu', 'cooling'].filter((key) => !build[key]).map((key) => <label id={`build-optional-${key}`} key={key} tabIndex={-1}>Add an optional {categoryLabels[key]}{buildOptions[key]?.length ? <select value="" onChange={(event) => addOptionalPart(key, event.target.value)}><option value="">Choose from active catalogue</option>{buildOptions[key].map((item) => <option value={item.id} key={item.id}>{item.name} · {formatINR(item.price)}</option>)}</select> : <small>No active {categoryLabels[key].toLowerCase()} products are available.</small>}</label>)}</div><div className="result-lower"><div className="compatibility-box"><div className="compat-title"><span className="status-icon">{generatedFor.compatibility?.status === 'compatible' ? <Check size={17} /> : <CircleAlert size={17} />}</span><b>Compatibility notes</b><small>Database specification checks</small></div>{compatibility.map((item, i) => <p key={i} className={`compat-line ${item.status === 'compatible' ? '' : 'warn'}`}><span>{item.status}</span>{item.message}</p>)}<p className="tiny-disclaimer">A result marked unverified means required specifications are missing. Confirm full fit before purchase.</p></div><div className="total-box"><span className="eyebrow">CURRENT CATALOGUE ESTIMATE</span><strong>{amount === null ? 'Price unavailable' : formatINR(amount)}</strong><p>{amount === null ? 'A selected component is missing a valid price.' : budget - amount >= 0 ? `${formatINR(budget - amount)} remaining from your target` : `${formatINR(amount - budget)} above your target`}</p>{amount !== null && amount > budget && <small className="budget-over-note">This customised selection is over budget. Remove or change a part to meet your target.</small>}<button className="button button-darkline full" onClick={persistBuild} disabled={!canSaveBuild}>Save this build <Clipboard size={14} /></button>{buildState.saved && <small role="status">{buildState.saved}</small>}<button className="button button-darkline full" onClick={addConfiguredBuild} disabled={!canAddBuildToCart}>Add configuration to cart <ShoppingBag size={14} /></button><button className="button button-gold full" onClick={openCheckout} disabled={!canCheckoutRecommendation}>Review order <ArrowRight size={15} /></button><button className="text-link light-link" onClick={openConfigurator}>Return to recommendations <ArrowUpRight size={13} /></button><button className="text-link light-link" onClick={resetBuild}>Start again <RotateCcw size={13} /></button></div></div></motion.div>}</AnimatePresence>
      </section>
      </>}

      {page === 'prebuilt' && <>
      <section className="prebuilt-section section-pad" id="prebuilt"><div className="section-top"><SectionTitle eyebrow="PREBUILT PCS · SAMPLE CONFIGURATIONS" title="Ready-made starting points." copy="Every system is shown as a sample build with example specifications and an estimated total; prices are not live." /><span className="side-note">6 SAMPLE BUILDS</span></div><div className="prebuilt-filters" aria-label="Filter prebuilt PCs">{prebuiltFilters.map((filter) => <button key={filter} className={activePrebuiltUse === filter ? 'active' : ''} onClick={() => setActivePrebuiltUse(filter)}>{filter}</button>)}</div><div className="prebuilt-grid">{visiblePrebuilts.map((item) => <PrebuiltCard key={item.id} build={item} onView={setPrebuiltDetail} onAdd={addPrebuilt} />)}</div><p className="sample-stock-note">Prebuilt systems and pricing are illustrative. All sample builds use new components; availability and final fit require verification.</p></section>

      <section className="peripherals-section section-pad" id="peripherals"><div className="section-top"><SectionTitle eyebrow="COMPLETE YOUR SETUP" title="The details around the desk." copy="Explore sample displays, keyboards, pointing devices, audio, and more." /><button className="text-link" onClick={() => { setSelectedCategory('Gaming Mice'); openShop() }}>Shop peripherals <ArrowRight size={15} /></button></div><div className="peripheral-layout"><div className="peripheral-feature"><CampaignPlacement campaign={getCampaignById(campaigns, campaignPlacements.peripheralsFeature)} variant="tile" onVisit={visitCampaign} /><p>Demo creative · no sponsorship or retailer offer is configured.</p></div><div className="product-grid peripheral-grid">{products.filter((product) => ['Monitors', 'Keyboards', 'Gaming Mice', 'Gaming Chairs', 'Headphones and Speakers'].includes(product.category)).map((product) => <ProductCard key={product.id} product={product} wishlisted={wishlist.includes(product.id)} onAdd={addProduct} onWishlist={toggleWishlist} onViewDetails={setProductDetail} />)}</div></div></section>
      </>}

      {page === 'about' && <>
      <section className="services section-pad" id="services"><div className="section-top"><SectionTitle eyebrow="CONSIDERED SUPPORT" title="More than a parts list." copy="Proposed services designed to make your decisions clearer—from first draft through future upgrades." /><div className="services-annotation">THOUGHTFUL BY DESIGN <ArrowDownRight size={22} /></div></div><div className="service-grid">{services.map(({ icon: Icon, title, text }, i) => <Reveal className="service-item" key={title} delay={i * 0.05}><span className="service-icon"><Icon size={21} strokeWidth={1.5} /></span><small>0{i + 1}</small><h3>{title}</h3><p>{text}</p></Reveal>)}</div></section>

      <section className="process section-pad"><div className="process-heading"><SectionTitle light eyebrow="A SIMPLE THREE-STEP FLOW" title="From idea to parts list." copy="A clearer way to make your next PC decision." /></div><div className="timeline">{[['01', 'Tell us your needs', 'Choose a use case and budget that feel right for you.'], ['02', 'Configure your PC', 'Explore the recommendation, swap parts, and see sample pricing update.'], ['03', 'Review your build', 'Check the estimate and basic compatibility notes before the demo checkout.']].map(([n, title, text]) => <div className="timeline-step" key={n}><span className="timeline-num">{n}</span><span className="timeline-line" /><h3>{title}</h3><p>{text}</p></div>)}</div></section>

      <section className="brand-wall section-pad"><div className="brand-wall-heading"><SectionTitle eyebrow="SAMPLE CATALOGUE BRANDS" title="Familiar names, for context." copy="Brands below are example product labels from the local demo catalogue. No affiliation, advertising relationship, or endorsement is implied." /><span className="not-partnered">NO PARTNERSHIPS IMPLIED</span></div><div className="brand-logos">{['AMD', 'Intel', 'NVIDIA', 'ASUS', 'MSI', 'Corsair', 'Kingston', 'Acer', 'Logitech', 'TP-Link'].map((brand, index) => <span key={brand} style={{ '--brand-index': index }}>{brand}</span>)}</div></section>

      <section className="business-model section-pad" id="business-model"><div className="business-heading"><SectionTitle light eyebrow="A PROPOSED BUSINESS MODEL" title="How PCForge could earn." copy="A few possible revenue paths as the idea develops. These are opportunities under consideration—not current revenue, contracts, or approved programs." /><span className="model-stamp">POTENTIAL<br />REVENUE</span></div><div className="revenue-grid">{[
        { n: '01', title: 'Component advertising', text: 'Hardware brands or retailers could pay for clearly labelled sponsored banners and relevant product placements.' },
        { n: '02', title: 'Affiliate commissions', text: 'PCForge could earn a referral commission when someone buys through an eligible affiliate link, if approved in the future.' },
        { n: '03', title: 'Custom PC sales', text: 'Complete new-component PCs could become a direct sales opportunity as the proposed service takes shape.' },
        { n: '04', title: 'Assembly and support', text: 'Assembly, setup, upgrade planning, and ongoing support could provide additional services.' },
      ].map((stream) => <article key={stream.n}><span>{stream.n}</span><h3>{stream.title}</h3><p>{stream.text}</p></article>)}</div><div className="model-footnote"><ShieldCheck size={16} /> Campaign cards on this page are demonstration content. No paid advertising or affiliate tracking is active.</div></section>

      <section className="about section-pad" id="about"><div className="about-copy"><span className="eyebrow">WHY PCFORGE</span><h2>Build around<br />what <i>moves you.</i></h2><p>PCForge aims to make custom PC building easier to understand. We help students, gamers, developers, young professionals, and creators select appropriate new components, see how costs add up, and keep future upgrades in view.</p><p>Personalised configurations. New hardware. Clear estimates. Better context for your money.</p><div className="about-tags"><span>NEW HARDWARE</span><span>CLEAR ESTIMATES</span><span>COMPATIBILITY GUIDANCE</span><span>UPGRADE PLANNING</span></div></div><div className="about-visual"><Media src="https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1100&q=80" alt="Desktop PC components in a dark studio" fallback="Built for what's next" /><div className="about-overlay"><span>THE PCFORGE APPROACH</span><b>Clarity at every<br />component.</b></div></div></section>
      </>}

      {page === 'contact' && <>
      <section className="contact section-pad" id="contact"><div className="contact-intro"><SectionTitle light eyebrow="LET’S START A CONVERSATION" title="Tell us what you’re building toward." copy="Share a little about your idea. This demo form stays in your browser and does not send to a real business." /><div className="contact-note"><span className="note-rule" /><p>Exploring your first PC? Planning an upgrade?<br />This is a frontend-only enquiry demo.</p></div></div><form className="contact-form" onSubmit={submitContact} noValidate>{contactFormState.sent ? <div className="form-success"><span><Check size={20} /></span><h3>Thanks for sharing.</h3><p>Your enquiry is shown as a demo confirmation. Nothing was sent to a business.</p><button type="button" className="button button-line" onClick={() => { setContactFormState({ errors: {}, sent: false }); setContactForm({ name: '', email: '', usage: '', budget: '', message: '' }) }}>Send another enquiry</button></div> : <><div className="form-row"><label>Name<input value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} placeholder="Your name" />{contactFormState.errors.name && <small className="field-error">{contactFormState.errors.name}</small>}</label><label>Email<input value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} placeholder="you@example.com" />{contactFormState.errors.email && <small className="field-error">{contactFormState.errors.email}</small>}</label></div><div className="form-row"><label>Intended use<select value={contactForm.usage} onChange={(e) => setContactForm({ ...contactForm, usage: e.target.value })}><option value="">Choose a direction</option>{useCases.map((c) => <option key={c.id}>{c.id}</option>)}</select>{contactFormState.errors.usage && <small className="field-error">{contactFormState.errors.usage}</small>}</label><label>Budget (optional)<input value={contactForm.budget} onChange={(e) => setContactForm({ ...contactForm, budget: e.target.value })} placeholder="e.g. ₹60,000" /></label></div><label>Tell us more<textarea rows="3" value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} placeholder="What would you like your PC to help you do?" /></label><div className="form-submit"><span>Demo only · No details are stored or sent.</span><button className="button button-gold" type="submit">Send enquiry <ArrowRight size={15} /></button></div></>}</form></section>
      </>}
      {page === 'hardware-explorer' && <HardwareExplorer />}
      {page === 'not-found' && <section className="route-not-found section-pad"><span className="eyebrow">404 · ROUTE NOT FOUND</span><h1>That page isn’t here.</h1><p>Choose a PCForge page from the navigation or return to the home page.</p><Link className="button button-gold" to="/">Back to home <ArrowRight size={15} /></Link></section>}
    </motion.main>
    <Outlet />

    <footer className="footer"><div className="footer-main"><div className="footer-brand"><Link className="brand" to="/"><span className="brand-mark"><Cpu size={20} /></span><span>PC<span className="gold">FORGE</span><small>BUILT AROUND YOU</small></span></Link><p>Custom PC configuration with clear choices, sample pricing, and your priorities at the centre.</p><b>Built Around You. Engineered for Performance.</b></div><div><h4>EXPLORE</h4>{footerExploreRoutes.map(({ label, path }) => <Link key={path} to={path}>{label}</Link>)}<Link to="/showcase">Showcase</Link><Link to="/hardware-explorer">Hardware Explorer</Link></div><div><h4>OUR APPROACH</h4><Link to="/about">About PCForge</Link><Link to="/about">Compatibility guidance</Link><Link to="/about">Upgrade planning</Link><Link to="/contact">Contact</Link></div><div className="footer-disclaimer"><span>PLEASE NOTE</span><p>Build examples and demo products are illustrative. Active catalogue prices and stock come from the backend; confirm compatibility and availability before ordering.</p></div></div><div className="footer-bottom"><span>© 2026 PCForge · Startup Expo MVP</span><span>CONTACT FORM IS LOCAL ONLY · LIVE CHECKOUT REQUIRES CONFIGURED SERVICES</span><Link to="/">BACK TO HOME ↑</Link></div></footer>

    <AnimatePresence>{activeExample && <motion.div className="modal-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => { if (e.target === e.currentTarget) setActiveExample(null) }}><motion.div className="example-modal" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} role="dialog" aria-modal="true" aria-labelledby="example-title"><button className="modal-close" aria-label="Close build details" onClick={() => setActiveExample(null)}><X /></button><Media src={`https://images.unsplash.com/${activeExample.image}?auto=format&fit=crop&w=900&q=80`} alt={`${activeExample.name} build concept`} fallback="PC build" /><div className="example-modal-copy"><span className="eyebrow">{activeExample.use}</span><h2 id="example-title">{activeExample.name}</h2><p>{activeExample.text}</p><div className="example-price"><small>SAMPLE ESTIMATE · NOT LIVE PRICE</small><strong>{formatINR(activeExample.price)}</strong></div><ul>{activeExample.specs.map((spec) => <li key={spec}><Check size={14} />{spec}</li>)}</ul><button className="button button-gold full" onClick={() => startSimilar(activeExample)}>Configure a similar build <ArrowRight size={15} /></button></div></motion.div></motion.div>}</AnimatePresence>

    <BuildOrderModal open={checkout} view={checkoutView} setView={setCheckoutView} build={build} parts={visibleComponentKeys} categoryLabels={categoryLabels} customer={contact} setCustomer={setContact} errors={contactErrors} message={checkoutError} orderState={activeOrder} verificationPending={Boolean(pendingPaymentResult)} paymentsEnabled={generatedFor?.paymentsEnabled === true} formatINR={formatINR} onClose={closeCheckout} onPlaceOrder={placeBuildOrder} onPay={startPayment} onDownload={downloadCurrentInvoice} />
    <CartDrawer mode="wishlist" open={wishlistOpen} items={wishlistProducts} onClose={() => setWishlistOpen(false)} onAddToCart={addProduct} onToggleWishlist={toggleWishlist} />
    <CartDrawer mode="cart" open={cartOpen} items={cart} subtotal={cartSubtotal} onClose={() => setCartOpen(false)} onQuantity={updateQuantity} onRemove={removeCartItem} onCheckout={() => { setCartOpen(false); setCartCheckoutOpen(true) }} />
    <CartCheckoutModal open={cartCheckoutOpen} items={cart} total={cartSubtotal} onClose={() => setCartCheckoutOpen(false)} onBackToCart={() => setCartOpen(true)} onPurchaseComplete={() => setCart([])} />

    <AnimatePresence>{productDetail && <motion.div className="modal-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => { if (e.target === e.currentTarget) setProductDetail(null) }}><motion.div className="product-detail-modal" initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 18, opacity: 0 }} role="dialog" aria-modal="true" aria-labelledby="product-detail-title"><button className="modal-close" onClick={() => setProductDetail(null)} aria-label="Close product details"><X /></button><ProductArt key={`${productDetail.id}:${productDetail.image || ''}:${productDetail.fallbackImage || ''}`} icon={productDetail.icon} tone={productDetail.tone} image={productDetail.image} fallbackImage={productDetail.fallbackImage} alt={productDetail.imageAlt || `${productDetail.name} product photo`} /><div><span className="eyebrow">{productDetail.brand ? `${productDetail.brand} · ` : ''}{productDetail.category}</span><h2 id="product-detail-title">{productDetail.name}</h2><SpecificationChips specifications={productDetail.specs} /><p className="detail-stock">{productDetail.stock}</p><strong>{formatINR(productDetail.price)}</strong>{productDetail.isDemoData && <small className="sample-price-label">Sample price</small>}<button className="button button-gold full" onClick={() => { addProduct(productDetail); setProductDetail(null) }}>Add to cart <ShoppingBag size={15} /></button></div></motion.div></motion.div>}</AnimatePresence>

    <AnimatePresence>{prebuiltDetail && <motion.div className="modal-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => { if (e.target === e.currentTarget) setPrebuiltDetail(null) }}><motion.div className="prebuilt-detail-modal" initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 18, opacity: 0 }} role="dialog" aria-modal="true" aria-labelledby="prebuilt-detail-title"><button className="modal-close" onClick={() => setPrebuiltDetail(null)} aria-label="Close prebuilt details"><X /></button><ProductArt icon="Box" tone={prebuiltDetail.tone} /><span className="eyebrow">{prebuiltDetail.use} · SAMPLE CONFIGURATION</span><h2 id="prebuilt-detail-title">{prebuiltDetail.name}</h2><p>{prebuiltDetail.text}</p><ul>{prebuiltDetail.specs.map((spec) => <li key={spec}><Check size={13} />{spec}</li>)}</ul><div className="demo-reference"><small>SAMPLE ESTIMATE · NOT LIVE PRICE</small><b>{formatINR(prebuiltDetail.price)}</b></div><button className="button button-gold full" onClick={() => { addPrebuilt(prebuiltDetail); setPrebuiltDetail(null) }}>Add prebuilt PC to cart <ShoppingBag size={15} /></button></motion.div></motion.div>}</AnimatePresence>
  </>
}

export default App
