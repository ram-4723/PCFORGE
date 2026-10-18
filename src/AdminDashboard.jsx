import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Activity, AlertCircle, ArrowLeft, ArrowRight, Cpu, LogOut, RefreshCw, Search, ShieldCheck, Users } from 'lucide-react'
import { getAdminOverview, getAdminUsers, logoutAccount } from './api/client.js'
import { clearAuthSession, readAuthSession } from './authSession.js'
import './auth.css'

const PAGE_SIZE = 10

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? '—' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [session] = useState(() => readAuthSession())
  const [overview, setOverview] = useState(null)
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [state, setState] = useState({ loading: true, error: '', forbidden: false })

  useEffect(() => {
    if (!session?.accessToken) {
      navigate('/account?next=%2Fadmin', { replace: true })
      return
    }
    let cancelled = false
    getAdminOverview(session.accessToken).then(setOverview).catch((error) => {
      if (cancelled) return
      if (error.status === 401) {
        clearAuthSession()
        navigate('/account?next=%2Fadmin', { replace: true })
        return
      }
      setState({ loading: false, error: error.message, forbidden: error.status === 403 })
    })
    return () => { cancelled = true }
  }, [navigate, session?.accessToken])

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1) }, 250)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (!session?.accessToken) return
    let cancelled = false
    setState((current) => ({ ...current, loading: true, error: '' }))
    getAdminUsers(session.accessToken, { page, size: PAGE_SIZE, search: debouncedSearch }).then((result) => {
      if (cancelled) return
      setUsers(result.users || [])
      setPagination(result.pagination || { page, total: 0, totalPages: 0 })
      setState({ loading: false, error: '', forbidden: false })
    }).catch((error) => {
      if (cancelled) return
      if (error.status === 401) {
        clearAuthSession()
        navigate('/account?next=%2Fadmin', { replace: true })
        return
      }
      setState({ loading: false, error: error.message, forbidden: error.status === 403 })
    })
    return () => { cancelled = true }
  }, [session?.accessToken, page, debouncedSearch, navigate])

  const signOut = async () => {
    try { if (session?.accessToken) await logoutAccount(session.accessToken) } catch { /* local sign-out still clears the session */ }
    clearAuthSession()
    navigate('/', { replace: true })
  }

  return <main className="admin-shell">
    <aside className="admin-sidebar">
      <Link className="admin-logo" to="/"><span><Cpu size={21} /></span><b>PC<span>FORGE</span></b></Link>
      <p className="admin-workspace-label">WORKSPACE</p>
      <a className="admin-nav active" href="#overview"><Activity size={17} /> Overview</a>
      <a className="admin-nav" href="#users"><Users size={17} /> Users</a>
      <div className="admin-sidebar-bottom"><span><ShieldCheck size={16} /> Private admin area</span><Link to="/">Visit website <ArrowRight size={14} /></Link></div>
    </aside>
    <section className="admin-main">
      <header className="admin-topbar"><div><span>PCFORGE</span><b>Admin dashboard</b></div><button className="admin-signout" onClick={signOut}><LogOut size={16} /> Sign out</button></header>
      <div className="admin-content" id="overview">
        <div className="admin-heading"><div><p className="admin-eyebrow">OVERVIEW</p><h1>Good to see you, {session?.user?.name || 'Admin'}.</h1><p>Review the PCForge community and registered accounts.</p></div><span className="admin-secure"><ShieldCheck size={16} /> Secure access</span></div>
        {state.forbidden ? <div className="admin-alert" role="alert"><AlertCircle size={20} /><div><b>Administrator access required</b><p>This account does not have permission to view the user directory.</p></div><button onClick={signOut}>Sign out</button></div> : state.error ? <div className="admin-alert" role="alert"><AlertCircle size={20} /><div><b>Dashboard could not load</b><p>{state.error}</p></div><button onClick={() => window.location.reload()}>Retry</button></div> : <>
          <article className="admin-stat-card"><div className="admin-stat-icon"><Users size={20} /></div><p>Total registered users</p><strong>{overview ? overview.totalRegisteredUsers.toLocaleString() : '—'}</strong><span>Accounts registered with PCForge</span></article>
          <section className="admin-users-panel" id="users">
            <div className="admin-users-heading"><div><h2>Users</h2><p>Search and review registered accounts.</p></div><span>{pagination.total.toLocaleString()} total</span></div>
            <label className="admin-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or email" aria-label="Search users" /><button type="button" aria-label="Clear search" onClick={() => setSearch('')}>Clear</button></label>
            {state.loading ? <div className="admin-state"><RefreshCw className="admin-spin" size={19} /> Loading user records…</div> : state.error ? <div className="admin-state admin-state-error"><AlertCircle size={19} /> {state.error}</div> : users.length === 0 ? <div className="admin-state"><Users size={22} /><b>{debouncedSearch ? 'No matching users' : 'No registered users yet'}</b><span>{debouncedSearch ? 'Try a different name or email.' : 'New registrations will appear here.'}</span></div> : <>
              <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Name</th><th>Email</th><th>Registered</th></tr></thead><tbody>{users.map((user) => <tr key={user.email}><td><span className="admin-avatar">{user.name?.slice(0, 1)?.toUpperCase() || '?'}</span>{user.name}</td><td>{user.email}</td><td>{formatDate(user.registeredAt)}</td></tr>)}</tbody></table></div>
              <div className="admin-pagination"><span>Page {pagination.page} of {Math.max(pagination.totalPages, 1)}</span><div><button disabled={page <= 1 || state.loading} onClick={() => setPage((current) => Math.max(1, current - 1))}><ArrowLeft size={15} /> Previous</button><button disabled={page >= pagination.totalPages || state.loading} onClick={() => setPage((current) => current + 1)}>Next <ArrowRight size={15} /></button></div></div>
            </>}
          </section>
        </>}
        <p className="admin-footer-note">Only the name, email address, and registration date are shown here. Passwords and session tokens are never included.</p>
      </div>
    </section>
  </main>
}
