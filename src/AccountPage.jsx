import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Cpu, ShieldCheck } from 'lucide-react'
import { loginAccount, registerAccount } from './api/client.js'
import { storeAuthSession } from './authSession.js'
import './auth.css'

function safeReturnPath(search) {
  const requested = new URLSearchParams(search).get('next') || '/'
  return requested.startsWith('/') && !requested.startsWith('//') ? requested : '/'
}

export default function AccountPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mode, setMode] = useState(new URLSearchParams(location.search).get('mode') === 'register' ? 'register' : 'login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [state, setState] = useState({ loading: false, error: '' })
  const isRegister = mode === 'register'

  const submit = async (event) => {
    event.preventDefault()
    setState({ loading: true, error: '' })
    try {
      const result = isRegister
        ? await registerAccount(form.name.trim(), form.email.trim(), form.password)
        : await loginAccount(form.email.trim(), form.password)
      storeAuthSession(result)
      navigate(safeReturnPath(location.search), { replace: true })
    } catch (error) {
      setState({ loading: false, error: error.message || 'Unable to reach PCForge. Please try again.' })
    }
  }

  const changeMode = (nextMode) => {
    setMode(nextMode)
    setState({ loading: false, error: '' })
    setForm((current) => ({ ...current, password: '' }))
  }

  return <main className="account-shell">
    <Link className="account-back" to="/"><ArrowLeft size={16} /> Back to PCForge</Link>
    <section className="account-card" aria-labelledby="account-title">
      <div className="account-brand"><span><Cpu size={23} /></span><b>PC<span>FORGE</span></b></div>
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
      </form>
      <p className="account-privacy">Passwords are hashed before storage and are never returned by the API.</p>
      {new URLSearchParams(location.search).has('next') && <p className="account-admin-note">Administrator access is granted only to accounts provisioned by PCForge.</p>}
    </section>
  </main>
}
