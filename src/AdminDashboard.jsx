import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Cpu,
  Download,
  Eye,
  FileText,
  Filter,
  Layers,
  LogOut,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Truck,
  Users,
  X
} from 'lucide-react'
import {
  getAdminOverview,
  getAdminUsers,
  getAdminOrders,
  getAdminOrderDetail,
  updateAdminOrderStatus,
  downloadAdminInvoice,
  seedAdminOrders,
  logoutAccount
} from './api/client.js'
import { clearAuthSession, readAuthSession } from './authSession.js'
import './admin.css'

const ORDER_STATUS_OPTIONS = [
  { value: 'awaiting_payment', label: 'Awaiting Payment' },
  { value: 'paid', label: 'Payment Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'assembling', label: 'In Assembly' },
  { value: 'tested', label: 'Benchmarked & Tested' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' }
]

function formatInr(val) {
  if (val === undefined || val === null || isNaN(val)) return '₹0'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)
}

function formatDate(val) {
  if (!val) return '—'
  const d = new Date(val)
  return Number.isNaN(d.valueOf()) ? '—' : new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

function getStatusBadge(status) {
  switch (status?.toLowerCase()) {
    case 'paid':
      return <span className="badge-status badge-paid"><CheckCircle2 size={12} /> Paid</span>
    case 'delivered':
      return <span className="badge-status badge-delivered"><CheckCircle2 size={12} /> Delivered</span>
    case 'shipped':
      return <span className="badge-status badge-shipped"><Truck size={12} /> Shipped</span>
    case 'assembling':
    case 'processing':
    case 'tested':
      return <span className="badge-status badge-assembling"><Cpu size={12} /> {status.charAt(0).toUpperCase() + status.slice(1)}</span>
    case 'awaiting_payment':
    case 'pending':
      return <span className="badge-status badge-pending"><Clock size={12} /> Pending</span>
    case 'failed':
    case 'cancelled':
      return <span className="badge-status badge-failed"><AlertCircle size={12} /> {status}</span>
    default:
      return <span className="badge-status badge-pending">{status || 'Unknown'}</span>
  }
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [session] = useState(() => readAuthSession())
  const [currentTab, setCurrentTab] = useState('overview') // 'overview', 'orders', 'users'

  // Overview stats
  const [overview, setOverview] = useState(null)
  const [loadingOverview, setLoadingOverview] = useState(true)

  // Orders state
  const [orders, setOrders] = useState([])
  const [ordersPagination, setOrdersPagination] = useState({ page: 1, size: 15, total: 0, totalPages: 0 })
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersSearch, setOrdersSearch] = useState('')
  const [debouncedOrdersSearch, setDebouncedOrdersSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [seedingOrders, setSeedingOrders] = useState(false)
  const [actionNotice, setActionNotice] = useState(null)

  // Users state
  const [users, setUsers] = useState([])
  const [usersPagination, setUsersPagination] = useState({ page: 1, total: 0, totalPages: 0 })
  const [usersPage, setUsersPage] = useState(1)
  const [usersSearch, setUsersSearch] = useState('')
  const [debouncedUsersSearch, setDebouncedUsersSearch] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)

  // General error state
  const [error, setError] = useState('')
  const [forbidden, setForbidden] = useState(false)

  // Auth Guard
  useEffect(() => {
    if (!session?.accessToken) {
      navigate('/account?next=%2Fadmin', { replace: true })
    }
  }, [navigate, session?.accessToken])

  // Fetch Overview Stats
  const loadOverview = async () => {
    if (!session?.accessToken) return
    try {
      setLoadingOverview(true)
      const data = await getAdminOverview(session.accessToken)
      setOverview(data)
    } catch (err) {
      if (err.status === 401) {
        clearAuthSession()
        navigate('/account?next=%2Fadmin', { replace: true })
      } else if (err.status === 403) {
        setForbidden(true)
      } else {
        setError(err.message || 'Failed to load overview data')
      }
    } finally {
      setLoadingOverview(false)
    }
  }

  useEffect(() => {
    loadOverview()
  }, [session?.accessToken])

  // Debounce Orders Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedOrdersSearch(ordersSearch.trim())
      setOrdersPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [ordersSearch])

  // Debounce Users Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsersSearch(usersSearch.trim())
      setUsersPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [usersSearch])

  // Fetch Orders
  const loadOrders = async () => {
    if (!session?.accessToken) return
    try {
      setLoadingOrders(true)
      const res = await getAdminOrders(session.accessToken, {
        page: ordersPage,
        size: 15,
        search: debouncedOrdersSearch,
        status: statusFilter === 'all' ? '' : statusFilter
      })
      setOrders(res.orders || [])
      setOrdersPagination(res.pagination || { page: ordersPage, total: 0, totalPages: 0 })
    } catch (err) {
      setError(err.message || 'Failed to fetch orders')
    } finally {
      setLoadingOrders(false)
    }
  }

  useEffect(() => {
    if (currentTab === 'orders' || currentTab === 'overview') {
      loadOrders()
    }
  }, [session?.accessToken, ordersPage, debouncedOrdersSearch, statusFilter, currentTab])

  // Fetch Users
  useEffect(() => {
    if (currentTab !== 'users' || !session?.accessToken) return
    let active = true
    setLoadingUsers(true)
    getAdminUsers(session.accessToken, {
      page: usersPage,
      size: 10,
      search: debouncedUsersSearch
    }).then((res) => {
      if (!active) return
      setUsers(res.users || [])
      setUsersPagination(res.pagination || { page: usersPage, total: 0, totalPages: 0 })
    }).catch((err) => {
      if (!active) return
      setError(err.message || 'Failed to fetch users')
    }).finally(() => {
      if (active) setLoadingUsers(false)
    })
    return () => { active = false }
  }, [session?.accessToken, usersPage, debouncedUsersSearch, currentTab])

  // Open Order Detail Drawer
  const handleOpenOrderDetail = async (orderId) => {
    try {
      setLoadingDetail(true)
      const res = await getAdminOrderDetail(session.accessToken, orderId)
      setSelectedOrder(res.order)
    } catch (err) {
      alert('Could not load order details: ' + err.message)
    } finally {
      setLoadingDetail(false)
    }
  }

  // Update Order Status
  const handleStatusChange = async (newStatus) => {
    if (!selectedOrder) return
    try {
      setUpdatingStatus(true)
      const res = await updateAdminOrderStatus(session.accessToken, selectedOrder.id, newStatus)
      setSelectedOrder(res.order)
      // update in local orders list
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, orderStatus: newStatus } : o))
      setActionNotice(`Order ${selectedOrder.orderNumber || selectedOrder.id} status updated to "${newStatus}".`)
      setTimeout(() => setActionNotice(null), 4000)
      loadOverview()
    } catch (err) {
      alert('Failed to update status: ' + err.message)
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Download Invoice PDF
  const handleDownloadInvoice = async (orderId, orderNum) => {
    try {
      setActionNotice('Preparing PDF invoice...')
      const blob = await downloadAdminInvoice(session.accessToken, orderId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `PCForge-Invoice-${orderNum || orderId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      setActionNotice(null)
    } catch (err) {
      alert('Invoice download failed: ' + err.message)
      setActionNotice(null)
    }
  }

  // Seed Demo Orders
  const handleSeedOrders = async () => {
    if (!confirm('Seed realistic sample PC orders for demonstration?')) return
    try {
      setSeedingOrders(true)
      const res = await seedAdminOrders(session.accessToken)
      setActionNotice(res.message || 'Successfully seeded sample orders!')
      setTimeout(() => setActionNotice(null), 4000)
      loadOrders()
      loadOverview()
    } catch (err) {
      alert('Failed to seed orders: ' + err.message)
    } finally {
      setSeedingOrders(false)
    }
  }

  const handleSignOut = async () => {
    try {
      if (session?.accessToken) await logoutAccount(session.accessToken)
    } catch {
      // Local sign out still proceeds
    }
    clearAuthSession()
    navigate('/', { replace: true })
  }

  if (forbidden) {
    return (
      <main className="admin-shell">
        <section className="admin-view-content" style={{ margin: 'auto', textAlign: 'center', padding: '60px' }}>
          <AlertCircle size={48} color="#f87171" style={{ margin: '0 auto 16px' }} />
          <h1>Administrator Access Required</h1>
          <p style={{ color: '#94a3b8', maxWidth: '420px', margin: '0 auto 20px' }}>
            This account does not have administrator privileges to view orders and management systems.
          </p>
          <button className="admin-btn-primary" onClick={handleSignOut} style={{ margin: '0 auto' }}>
            Sign Out
          </button>
        </section>
      </main>
    )
  }

  return (
    <div className="admin-shell">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="admin-brand-header">
          <Link className="admin-logo" to="/">
            <div className="admin-logo-icon">
              <Cpu size={20} />
            </div>
            <span>PC<b>FORGE</b></span>
          </Link>
          <span className="admin-badge-role">ADMIN</span>
        </div>

        <div className="admin-nav-group">
          <span className="admin-nav-label">Main Console</span>
          <button
            className={`admin-nav-item ${currentTab === 'overview' ? 'active' : ''}`}
            onClick={() => setCurrentTab('overview')}
          >
            <Activity size={17} /> Overview & Analytics
          </button>
          <button
            className={`admin-nav-item ${currentTab === 'orders' ? 'active' : ''}`}
            onClick={() => setCurrentTab('orders')}
          >
            <Package size={17} /> Orders Management
            {overview?.totalOrders > 0 && (
              <span className="admin-nav-count">{overview.totalOrders}</span>
            )}
          </button>
          <button
            className={`admin-nav-item ${currentTab === 'users' ? 'active' : ''}`}
            onClick={() => setCurrentTab('users')}
          >
            <Users size={17} /> Users Directory
            {overview?.totalRegisteredUsers > 0 && (
              <span className="admin-nav-count">{overview.totalRegisteredUsers}</span>
            )}
          </button>
        </div>

        <div className="admin-sidebar-footer">
          <div className="admin-status-pill">
            <div className="admin-status-dot" />
            <span>Spring Boot API 3.5 Active</span>
          </div>
          <Link className="admin-return-link" to="/">
            <span>Storefront Portal</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="admin-main">
        {/* Top Header Bar */}
        <header className="admin-header-bar">
          <div className="admin-breadcrumb">
            <span>PCFORGE Console</span>
            <span>/</span>
            <b>{currentTab === 'overview' ? 'Overview' : currentTab === 'orders' ? 'Orders Pipeline' : 'Users Directory'}</b>
          </div>

          <div className="admin-user-menu">
            <div className="admin-user-pill">
              <div className="admin-user-avatar">
                {session?.user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <span>{session?.user?.name || 'Administrator'}</span>
            </div>
            <button className="admin-btn-logout" onClick={handleSignOut} title="Sign Out">
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </header>

        {/* Dynamic Action Notification */}
        {actionNotice && (
          <div style={{
            background: 'rgba(56, 189, 248, 0.15)',
            borderBottom: '1px solid rgba(56, 189, 248, 0.3)',
            color: '#38bdf8',
            padding: '10px 32px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Sparkles size={16} /> {actionNotice}
          </div>
        )}

        {/* View Contents */}
        <div className="admin-view-content">
          {/* Header Title & Actions */}
          <div className="admin-title-row">
            <div>
              <h1>
                {currentTab === 'overview' && 'Executive Business Dashboard'}
                {currentTab === 'orders' && 'Order Management & Fulfillment'}
                {currentTab === 'users' && 'Registered Users Directory'}
              </h1>
              <p>
                {currentTab === 'overview' && 'Live sales revenue, build statistics, and operational KPIs.'}
                {currentTab === 'orders' && 'Inspect customer configurations, update fulfillment status, and generate invoices.'}
                {currentTab === 'users' && 'Customer directory and authentication records.'}
              </p>
            </div>

            <div className="admin-action-row">
              <button
                className="admin-btn-secondary"
                onClick={() => { loadOverview(); loadOrders(); }}
                disabled={loadingOverview || loadingOrders}
              >
                <RefreshCw size={14} className={loadingOverview || loadingOrders ? 'admin-spin' : ''} />
                Refresh
              </button>

              <button
                className="admin-btn-primary"
                onClick={handleSeedOrders}
                disabled={seedingOrders}
                title="Generates 6 realistic sample PC builds with full hardware specs for demoing"
              >
                <Sparkles size={14} />
                {seedingOrders ? 'Seeding...' : 'Seed Sample Orders'}
              </button>
            </div>
          </div>

          {/* Executive KPI Cards Grid */}
          <div className="admin-kpi-grid">
            <div className="admin-kpi-card">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">Gross Revenue</span>
                <div className="admin-kpi-icon revenue"><TrendingUp size={20} /></div>
              </div>
              <div className="admin-kpi-value">
                {overview ? formatInr(overview.totalRevenueInr) : '—'}
              </div>
              <span className="admin-kpi-footnote">Confirmed customer payments (INR)</span>
            </div>

            <div className="admin-kpi-card">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">Total PC Orders</span>
                <div className="admin-kpi-icon orders"><Package size={20} /></div>
              </div>
              <div className="admin-kpi-value">
                {overview ? overview.totalOrders : '—'}
              </div>
              <span className="admin-kpi-footnote">Active orders across all pipelines</span>
            </div>

            <div className="admin-kpi-card">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">Average Order Value</span>
                <div className="admin-kpi-icon"><Activity size={20} /></div>
              </div>
              <div className="admin-kpi-value">
                {overview ? formatInr(overview.averageOrderValueInr) : '—'}
              </div>
              <span className="admin-kpi-footnote">AOV across confirmed purchases</span>
            </div>

            <div className="admin-kpi-card">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">Customer Accounts</span>
                <div className="admin-kpi-icon users"><Users size={20} /></div>
              </div>
              <div className="admin-kpi-value">
                {overview ? overview.totalRegisteredUsers : '—'}
              </div>
              <span className="admin-kpi-footnote">Registered community members</span>
            </div>
          </div>

          {/* TAB 1: OVERVIEW & RECENT ORDERS */}
          {currentTab === 'overview' && (
            <div className="admin-card-panel">
              <div className="admin-panel-toolbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={17} color="#ffc64a" />
                  <strong style={{ fontSize: '14px', color: '#f8fafc' }}>Recent Hardware Orders</strong>
                </div>
                <button
                  className="admin-btn-secondary"
                  onClick={() => setCurrentTab('orders')}
                >
                  View All Orders ({ordersPagination.total}) <ArrowRight size={14} />
                </button>
              </div>

              {loadingOrders ? (
                <div className="admin-empty-state">
                  <RefreshCw className="admin-spin" size={24} />
                  <p>Loading recent orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="admin-empty-state">
                  <Package size={40} strokeWidth={1.5} />
                  <h3>No Orders Placed Yet</h3>
                  <p>When customers assemble and checkout custom PC builds, they will appear here.</p>
                  <button className="admin-btn-primary" onClick={handleSeedOrders}>
                    <Sparkles size={14} /> Seed Sample Orders
                  </button>
                </div>
              ) : (
                <div className="admin-table-container">
                  <table className="admin-data-table">
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Total Amount</th>
                        <th>Payment</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 6).map((order) => (
                        <tr key={order.id}>
                          <td><strong style={{ color: '#38bdf8' }}>{order.orderNumber || order.id.slice(0, 8)}</strong></td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#f8fafc' }}>{order.customerName}</div>
                            <small style={{ color: '#64748b' }}>{order.customerEmail}</small>
                          </td>
                          <td>{order.itemCount} components</td>
                          <td><strong style={{ color: '#f8fafc' }}>{formatInr(order.totalInr)}</strong></td>
                          <td>{getStatusBadge(order.paymentStatus)}</td>
                          <td>{getStatusBadge(order.orderStatus)}</td>
                          <td style={{ color: '#94a3b8', fontSize: '12px' }}>{formatDate(order.createdAt)}</td>
                          <td>
                            <div className="admin-table-actions">
                              <button
                                className="admin-btn-action"
                                onClick={() => handleOpenOrderDetail(order.id)}
                                title="Inspect Build & Customer Details"
                              >
                                <Eye size={13} /> View
                              </button>
                              <button
                                className="admin-btn-action invoice"
                                onClick={() => handleDownloadInvoice(order.id, order.orderNumber)}
                                title="Download PDF Tax Invoice"
                              >
                                <Download size={13} /> PDF
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ORDERS MANAGEMENT */}
          {currentTab === 'orders' && (
            <div className="admin-card-panel">
              <div className="admin-panel-toolbar">
                <div className="admin-filter-pills">
                  {['all', 'paid', 'assembling', 'tested', 'shipped', 'delivered', 'awaiting_payment'].map((f) => (
                    <button
                      key={f}
                      className={`admin-pill-btn ${statusFilter === f ? 'active' : ''}`}
                      onClick={() => { setStatusFilter(f); setOrdersPage(1); }}
                    >
                      {f === 'all' ? 'All Orders' : f.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="admin-search-box">
                  <Search size={15} color="#64748b" />
                  <input
                    value={ordersSearch}
                    onChange={(e) => setOrdersSearch(e.target.value)}
                    placeholder="Search by Order #, Customer, or Phone..."
                  />
                  {ordersSearch && (
                    <button
                      style={{ background: 'none', border: 0, color: '#94a3b8', cursor: 'pointer' }}
                      onClick={() => setOrdersSearch('')}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {loadingOrders ? (
                <div className="admin-empty-state">
                  <RefreshCw className="admin-spin" size={24} />
                  <p>Retrieving orders from MongoDB...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="admin-empty-state">
                  <Package size={40} strokeWidth={1.5} />
                  <h3>No Orders Found</h3>
                  <p>{ordersSearch ? 'No orders match your search criteria.' : 'No orders in this status category.'}</p>
                  <button className="admin-btn-primary" onClick={handleSeedOrders}>
                    <Sparkles size={14} /> Seed Sample Orders
                  </button>
                </div>
              ) : (
                <>
                  <div className="admin-table-container">
                    <table className="admin-data-table">
                      <thead>
                        <tr>
                          <th>Order Number</th>
                          <th>Customer Details</th>
                          <th>Parts</th>
                          <th>Total (INR)</th>
                          <th>Payment</th>
                          <th>Fulfillment Stage</th>
                          <th>Placed On</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id}>
                            <td>
                              <strong style={{ color: '#38bdf8', letterSpacing: '0.04em' }}>
                                {order.orderNumber || order.id.slice(0, 8)}
                              </strong>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, color: '#f8fafc' }}>{order.customerName}</div>
                              <div style={{ color: '#64748b', fontSize: '11px' }}>{order.customerEmail}</div>
                              {order.customerPhone && order.customerPhone !== '—' && (
                                <div style={{ color: '#475569', fontSize: '11px' }}>{order.customerPhone}</div>
                              )}
                            </td>
                            <td>
                              <span style={{
                                padding: '3px 8px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 600
                              }}>
                                {order.itemCount} Components
                              </span>
                            </td>
                            <td>
                              <strong style={{ color: '#f8fafc', fontSize: '14px' }}>
                                {formatInr(order.totalInr)}
                              </strong>
                            </td>
                            <td>{getStatusBadge(order.paymentStatus)}</td>
                            <td>{getStatusBadge(order.orderStatus)}</td>
                            <td style={{ color: '#94a3b8', fontSize: '12px' }}>
                              {formatDate(order.createdAt)}
                            </td>
                            <td>
                              <div className="admin-table-actions">
                                <button
                                  className="admin-btn-action"
                                  onClick={() => handleOpenOrderDetail(order.id)}
                                >
                                  <Eye size={13} /> View
                                </button>
                                <button
                                  className="admin-btn-action invoice"
                                  onClick={() => handleDownloadInvoice(order.id, order.orderNumber)}
                                  title="Download Tax Invoice"
                                >
                                  <FileText size={13} /> PDF
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="admin-pagination-bar">
                    <span>
                      Page {ordersPagination.page} of {Math.max(ordersPagination.totalPages, 1)} ({ordersPagination.total} total orders)
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="admin-btn-secondary"
                        disabled={ordersPage <= 1 || loadingOrders}
                        onClick={() => setOrdersPage(p => Math.max(1, p - 1))}
                      >
                        <ArrowLeft size={14} /> Previous
                      </button>
                      <button
                        className="admin-btn-secondary"
                        disabled={ordersPage >= ordersPagination.totalPages || loadingOrders}
                        onClick={() => setOrdersPage(p => p + 1)}
                      >
                        Next <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: USERS DIRECTORY */}
          {currentTab === 'users' && (
            <div className="admin-card-panel">
              <div className="admin-panel-toolbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={17} color="#c084fc" />
                  <strong style={{ fontSize: '14px', color: '#f8fafc' }}>Registered Accounts</strong>
                </div>

                <div className="admin-search-box">
                  <Search size={15} color="#64748b" />
                  <input
                    value={usersSearch}
                    onChange={(e) => setUsersSearch(e.target.value)}
                    placeholder="Search by name or email..."
                  />
                  {usersSearch && (
                    <button
                      style={{ background: 'none', border: 0, color: '#94a3b8', cursor: 'pointer' }}
                      onClick={() => setUsersSearch('')}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {loadingUsers ? (
                <div className="admin-empty-state">
                  <RefreshCw className="admin-spin" size={24} />
                  <p>Loading user records...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="admin-empty-state">
                  <Users size={40} strokeWidth={1.5} />
                  <h3>No Users Found</h3>
                  <p>No registered accounts match your criteria.</p>
                </div>
              ) : (
                <>
                  <div className="admin-table-container">
                    <table className="admin-data-table">
                      <thead>
                        <tr>
                          <th>Account Name</th>
                          <th>Email Address</th>
                          <th>Joined Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.email}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div className="admin-user-avatar" style={{ width: 28, height: 28, fontSize: '11px' }}>
                                  {u.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <span style={{ fontWeight: 600, color: '#f8fafc' }}>{u.name}</span>
                              </div>
                            </td>
                            <td style={{ color: '#94a3b8' }}>{u.email}</td>
                            <td style={{ color: '#64748b' }}>{formatDate(u.registeredAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="admin-pagination-bar">
                    <span>
                      Page {usersPagination.page} of {Math.max(usersPagination.totalPages, 1)} ({usersPagination.total} registered users)
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="admin-btn-secondary"
                        disabled={usersPage <= 1 || loadingUsers}
                        onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                      >
                        <ArrowLeft size={14} /> Previous
                      </button>
                      <button
                        className="admin-btn-secondary"
                        disabled={usersPage >= usersPagination.totalPages || loadingUsers}
                        onClick={() => setUsersPage(p => p + 1)}
                      >
                        Next <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ORDER DETAILS MODAL / DRAWER */}
      {selectedOrder && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Package size={22} color="#38bdf8" />
                <div>
                  <h2>Order #{selectedOrder.orderNumber || selectedOrder.id}</h2>
                  <small style={{ color: '#94a3b8' }}>Placed on {formatDate(selectedOrder.createdAt)}</small>
                </div>
              </div>
              <button className="admin-btn-close" onClick={() => setSelectedOrder(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              {/* Customer & Shipping Section */}
              <div className="admin-modal-section">
                <h3>Customer & Delivery Address</h3>
                <div className="admin-info-grid">
                  <div className="admin-info-field">
                    <label>Customer Name</label>
                    <div>{selectedOrder.customer?.name || '—'}</div>
                  </div>
                  <div className="admin-info-field">
                    <label>Email Address</label>
                    <div>{selectedOrder.customer?.email || '—'}</div>
                  </div>
                  <div className="admin-info-field">
                    <label>Phone Number</label>
                    <div>{selectedOrder.customer?.phone || '—'}</div>
                  </div>
                  <div className="admin-info-field">
                    <label>Payment Status</label>
                    <div>{getStatusBadge(selectedOrder.paymentStatus)}</div>
                  </div>
                  <div className="admin-info-field" style={{ gridColumn: 'span 2' }}>
                    <label>Shipping Address</label>
                    <div style={{ fontWeight: 400, color: '#cbd5e1' }}>
                      {selectedOrder.customer?.address || '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Hardware Bill of Materials */}
              <div className="admin-modal-section">
                <h3>Configured Hardware Components ({selectedOrder.items?.length || 0})</h3>
                <table className="admin-items-table">
                  <thead>
                    <tr>
                      <th>Component / Model</th>
                      <th>Category</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong style={{ color: '#f8fafc' }}>{item.name}</strong>
                          <div style={{ color: '#64748b', fontSize: '11px' }}>
                            {item.brand} {item.model ? `• ${item.model}` : ''}
                          </div>
                        </td>
                        <td>
                          <span style={{ color: '#ffc64a', fontSize: '11px' }}>
                            {item.category}
                          </span>
                        </td>
                        <td>{item.quantity || 1}</td>
                        <td>{formatInr(item.unitPriceInr)}</td>
                        <td><strong style={{ color: '#f8fafc' }}>{formatInr(item.lineTotalInr)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Summary */}
              <div className="admin-modal-section">
                <h3>Financial Breakdown</h3>
                <div className="admin-info-grid">
                  <div className="admin-info-field">
                    <label>Hardware Subtotal</label>
                    <div>{formatInr(selectedOrder.subtotalInr)}</div>
                  </div>
                  <div className="admin-info-field">
                    <label>GST / Tax (18%)</label>
                    <div>{formatInr(selectedOrder.taxInr)}</div>
                  </div>
                  <div className="admin-info-field" style={{ gridColumn: 'span 2', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
                    <label>Total Order Value</label>
                    <div style={{ fontSize: '20px', color: '#ffc64a', font: '700 22px Manrope, sans-serif' }}>
                      {formatInr(selectedOrder.totalInr)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer with Status Changer & Invoice Download */}
            <div className="admin-modal-footer">
              <div className="admin-status-changer">
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Update Stage:</span>
                <select
                  value={selectedOrder.orderStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={updatingStatus}
                >
                  {ORDER_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {updatingStatus && <RefreshCw size={14} className="admin-spin" />}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="admin-btn-primary"
                  onClick={() => handleDownloadInvoice(selectedOrder.id, selectedOrder.orderNumber)}
                >
                  <Download size={14} /> Download Tax Invoice (PDF)
                </button>
                <button
                  className="admin-btn-secondary"
                  onClick={() => setSelectedOrder(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
