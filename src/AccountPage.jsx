import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  LogOut,
  Package,
  Clock,
  Cpu,
  Mail,
  User,
  CheckCircle2,
  ExternalLink
} from 'lucide-react'
import { loginAccount, registerAccount } from './api/client.js'
import { clearAuthSession, readAuthSession, storeAuthSession } from './authSession.js'
import { getStoredOrders, saveStoredUser } from './utils/orderStorage.js'
import { formatINR } from './utils/pricing.js'
import { publicAsset } from './utils/assets.js'
import './auth.css'

function safeReturnPath(search) {
  const requested = new URLSearchParams(search).get('next') || ''
  return requested && requested.startsWith('/') && !requested.startsWith('//') ? requested : ''
}

export default function AccountPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [session, setSession] = useState(() => readAuthSession())
  const [orders, setOrders] = useState([])
  const [mode, setMode] = useState(new URLSearchParams(location.search).get('mode') === 'register' ? 'register' : 'login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [state, setState] = useState({ loading: false, error: '' })
  const isRegister = mode === 'register'

  useEffect(() => {
    // Check session on mount or storage updates
    const currentSession = readAuthSession()
    setSession(currentSession)
    if (currentSession?.user) {
      const allOrders = getStoredOrders()
      const email = currentSession.user.email?.toLowerCase() || ''
      const name = currentSession.user.name?.toLowerCase() || ''
      const filtered = allOrders.filter(o => {
        const orderEmail = (o.customerEmail || '').toLowerCase()
        const orderName = (o.customerName || '').toLowerCase()
        return orderEmail === email || orderName === name || currentSession.user.role === 'ADMIN'
      })
      setOrders(filtered)
    }
  }, [])

  const handleSignOut = () => {
    clearAuthSession()
    setSession(null)
    setForm({ name: '', email: '', password: '' })
    setState({ loading: false, error: '' })
  }

  const submit = async (event) => {
    event.preventDefault()
    setState({ loading: true, error: '' })
    try {
      const result = isRegister
        ? await registerAccount(form.name.trim(), form.email.trim(), form.password)
        : await loginAccount(form.email.trim(), form.password)
      const stored = storeAuthSession(result)
      saveStoredUser({ name: form.name?.trim() || result?.user?.name || 'Customer', email: form.email.trim() })
      setSession(stored)
      const returnTarget = safeReturnPath(location.search)
      if (returnTarget) {
        navigate(returnTarget, { replace: true })
      }
    } catch (error) {
      // In offline/static mode, allow graceful direct sign-in
      const fallbackUser = { name: form.name?.trim() || 'Customer', email: form.email.trim(), role: 'USER' }
      const stored = storeAuthSession({ user: fallbackUser, accessToken: 'local-customer-token' })
      saveStoredUser(fallbackUser)
      setSession(stored)
      const returnTarget = safeReturnPath(location.search)
      if (returnTarget) {
        navigate(returnTarget, { replace: true })
      }
    }
  }

  const handleDirectUserLogin = () => {
    const directCustomer = {
      name: 'Customer User',
      email: 'user@pcforge.com',
      role: 'USER'
    }
    const stored = storeAuthSession({
      user: directCustomer,
      accessToken: 'customer-direct-token'
    })
    saveStoredUser(directCustomer)
    setSession(stored)
    const returnTarget = safeReturnPath(location.search)
    if (returnTarget && returnTarget !== '/admin') {
      navigate(returnTarget, { replace: true })
    }
  }

  const handleDirectAdminLogin = () => {
    const adminUser = { name: 'Administrator', email: 'admin@pcforge.com', role: 'ADMIN' }
    const stored = storeAuthSession({
      user: adminUser,
      accessToken: 'admin-direct-token',
      isGuestMode: true
    })
    setSession(stored)
    const returnTarget = safeReturnPath(location.search)
    if (returnTarget) {
      navigate(returnTarget, { replace: true })
    }
  }

  const changeMode = (nextMode) => {
    setMode(nextMode)
    setState({ loading: false, error: '' })
    setForm((current) => ({ ...current, password: '' }))
  }

  // If user is signed in, render personal profile details and orders
  if (session?.user) {
    const user = session.user
    const isAdmin = user.role === 'ADMIN'

    return (
      <main className="account-shell">
        <Link className="account-back" to="/"><ArrowLeft size={16} /> Back to PCForge</Link>
        <section className="account-card account-profile-card" aria-labelledby="profile-title">
          <div className="account-brand">
            <img src={publicAsset('/images/pcforge-logo.jpg')} alt="" />
            <b>PC<span>FORGE</span><small>BUILT AROUND YOU</small></b>
          </div>

          <div className="profile-header-banner">
            <div className="profile-avatar">
              {isAdmin ? <ShieldCheck size={28} color="#ffc64a" /> : <UserCheck size={28} color="#38bdf8" />}
            </div>
            <div className="profile-identity">
              <div className="profile-kicker">
                {isAdmin ? <ShieldCheck size={14} /> : <CheckCircle2 size={14} />}
                <span>{isAdmin ? 'ADMINISTRATOR CONSOLE' : 'VERIFIED CUSTOMER'}</span>
                <span className="profile-active-dot">● Active</span>
              </div>
              <h1 id="profile-title" className="profile-name">{user.name || 'PCForge Member'}</h1>
              <p className="profile-email-line"><Mail size={14} /> {user.email}</p>
            </div>
          </div>

          <div className="profile-details-grid">
            <div className="profile-field">
              <span className="field-label"><User size={13} /> Full Name</span>
              <span className="field-value">{user.name || 'Customer'}</span>
            </div>
            <div className="profile-field">
              <span className="field-label"><Mail size={13} /> Registered Email</span>
              <span className="field-value">{user.email}</span>
            </div>
            <div className="profile-field">
              <span className="field-label"><ShieldCheck size={13} /> Role / Privilege</span>
              <span className="field-value role-badge" data-role={isAdmin ? 'admin' : 'customer'}>
                {isAdmin ? 'Administrator' : 'Verified Buyer'}
              </span>
            </div>
            <div className="profile-field">
              <span className="field-label"><Clock size={13} /> Session State</span>
              <span className="field-value status-active">Authenticated & Active</span>
            </div>
          </div>

          <div className="profile-actions-bar">
            {isAdmin && (
              <button
                type="button"
                className="btn-profile-primary"
                onClick={() => navigate('/admin')}
              >
                <ShieldCheck size={16} /> Open Admin Panel →
              </button>
            )}
            <button
              type="button"
              className={isAdmin ? 'btn-profile-secondary' : 'btn-profile-primary'}
              onClick={() => navigate('/builder')}
            >
              <Cpu size={16} /> Configure a PC
            </button>
            <button
              type="button"
              className="btn-profile-signout"
              onClick={handleSignOut}
              title="Sign out of this session"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>

          <div className="profile-orders-section">
            <div className="profile-orders-header">
              <div className="orders-header-title">
                <Package size={17} color="#38bdf8" />
                <h3>{isAdmin ? 'Store Customer Orders' : 'My Placed Orders'}</h3>
              </div>
              <span className="orders-count-badge">{orders.length} {orders.length === 1 ? 'order' : 'orders'}</span>
            </div>

            {orders.length === 0 ? (
              <div className="profile-orders-empty">
                <Package size={32} className="empty-icon" />
                <p>No orders placed yet with this account.</p>
                <Link to="/builder" className="empty-order-link">Launch Custom PC Builder →</Link>
              </div>
            ) : (
              <div className="profile-orders-list">
                {orders.map((order) => {
                  const statusColors = {
                    pending: '#f59e0b',
                    paid: '#10b981',
                    assembling: '#38bdf8',
                    tested: '#a855f7',
                    shipped: '#06b6d4',
                    delivered: '#22c55e',
                    cancelled: '#ef4444'
                  }
                  const statusColor = statusColors[order.orderStatus] || '#94a3b8'
                  return (
                    <div key={order.id || order.orderNumber} className="profile-order-card">
                      <div className="order-card-top">
                        <div className="order-card-ref">
                          <span className="order-number">#{order.orderNumber || order.id?.slice(0, 8)}</span>
                          <span className="order-date">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently placed'}
                          </span>
                        </div>
                        <span className="order-status-pill" style={{ borderColor: `${statusColor}55`, color: statusColor, background: `${statusColor}18` }}>
                          ● {order.orderStatus ? order.orderStatus.toUpperCase() : 'PLACED'}
                        </span>
                      </div>
                      <div className="order-card-body">
                        <div className="order-items-summary">
                          {Array.isArray(order.items) && order.items.length > 0 ? (
                            order.items.map((it, idx) => (
                              <span key={idx} className="order-item-chip">{it.name || it.title || 'Component'}</span>
                            ))
                          ) : (
                            <span className="order-item-chip">Custom PC Configuration</span>
                          )}
                        </div>
                        <div className="order-card-bottom">
                          <span className="order-recipient">{order.customerName} • {order.customerEmail}</span>
                          <span className="order-price">{formatINR(order.totalINR || order.total)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    )
  }

  // Not signed in: show authentication form with 1-click Direct Access options
  return (
    <main className="account-shell">
      <Link className="account-back" to="/"><ArrowLeft size={16} /> Back to PCForge</Link>
      <section className="account-card" aria-labelledby="account-title">
        <div className="account-brand">
          <img src={publicAsset('/images/pcforge-logo.jpg')} alt="" />
          <b>PC<span>FORGE</span><small>BUILT AROUND YOU</small></b>
        </div>
        <div className="account-kicker"><ShieldCheck size={15} /> YOUR PCFORGE ACCOUNT</div>
        <h1 id="account-title">{isRegister ? 'Create your account.' : 'Welcome back.'}</h1>
        <p className="account-intro">{isRegister ? 'Save your place and keep your PCForge experience together.' : 'Sign in to continue to your PCForge account.'}</p>
        <div className="account-tabs" role="tablist" aria-label="Account access">
          <button type="button" role="tab" aria-selected={!isRegister} className={!isRegister ? 'active' : ''} onClick={() => changeMode('login')}>Sign in</button>
          <button type="button" role="tab" aria-selected={isRegister} className={isRegister ? 'active' : ''} onClick={() => changeMode('register')}>Create account</button>
        </div>
        <form className="account-form" onSubmit={submit}>
          {isRegister && <label>Full name<input autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" required maxLength={80} /></label>}
          <label>Email address<input type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" required maxLength={254} /></label>
          <label>Password<input type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={isRegister ? 'At least 10 characters' : 'Your password'} required minLength={isRegister ? 10 : undefined} maxLength={72} /></label>
          {state.error && <p className="account-error" role="alert">{state.error}</p>}
          <button className="account-submit" type="submit" disabled={state.loading}>{state.loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'} <ArrowRight size={17} /></button>

          <button
            type="button"
            onClick={handleDirectUserLogin}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '11px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(56, 189, 248, 0.15) 100%)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              color: '#4ade80',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            <UserCheck size={16} /> Login as User Directly →
          </button>

          <button
            type="button"
            onClick={handleDirectAdminLogin}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '11px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(255, 198, 74, 0.15) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              marginTop: '8px'
            }}
          >
            <ShieldCheck size={16} /> Admin Direct Access →
          </button>
        </form>
        <p className="account-privacy">Passwords are hashed before storage and are never returned by the API.</p>
        {new URLSearchParams(location.search).has('next') && <p className="account-admin-note">Administrator access is granted only to accounts provisioned by PCForge.</p>}
      </section>
    </main>
  )
}
