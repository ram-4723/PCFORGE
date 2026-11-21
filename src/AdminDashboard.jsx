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
  Wrench,
  X
} from 'lucide-react'
import {
  getAdminOverview,
  getAdminUsers,
  getAdminOrders,
  getAdminOrderDetail,
  updateAdminOrderStatus,
  downloadAdminInvoice,
  logoutAccount
} from './api/client.js'
import { clearAuthSession, readAuthSession, storeAuthSession } from './authSession.js'
import { getStoredOrders, updateStoredOrderStatus, getStoredUsers } from './utils/orderStorage.js'
import './admin.css'

const ORDER_STATUS_OPTIONS = [
  { value: 'awaiting_payment', label: 'Awaiting Payment' },
  { value: 'paid', label: 'Payment Confirmed' },
  { value: 'assembling', label: 'Order Accepted & In Assembly' },
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
      return <span className="badge-status badge-assembling"><Cpu size={12} /> In Assembly</span>
    case 'tested':
      return <span className="badge-status badge-assembling"><Cpu size={12} /> Tested</span>
    case 'processing':
      return <span className="badge-status badge-assembling"><Cpu size={12} /> Processing</span>
    case 'awaiting_payment':
    case 'pending':
      return <span className="badge-status badge-pending"><Clock size={12} /> Awaiting Payment</span>
    case 'failed':
    case 'cancelled':
      return <span className="badge-status badge-failed"><AlertCircle size={12} /> {status}</span>
    default:
      return <span className="badge-status badge-pending">{status || 'Unknown'}</span>
  }
}

export default function AdminDashboard() {
  const navigate = useNavigate()

  // Ensure Admin session is active
  const [session, setSession] = useState(() => {
    const existing = readAuthSession()
    if (existing?.accessToken) return existing
    const adminSession = {
      user: { name: 'Administrator', email: 'admin@pcforge.com', role: 'ADMIN' },
      accessToken: 'admin-direct-token',
      isGuestMode: true
    }
    storeAuthSession(adminSession)
    return adminSession
  })

  const [currentTab, setCurrentTab] = useState('overview') // 'overview', 'orders', 'users'

  // Persistent orders from real customer placements (starts empty if no orders placed yet!)
  const [orders, setOrders] = useState(() => getStoredOrders())
  const [ordersSearch, setOrdersSearch] = useState('')
  const [debouncedOrdersSearch, setDebouncedOrdersSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [actionNotice, setActionNotice] = useState(null)

  // Users state from real customer registrations & logins
  const [users, setUsers] = useState(() => getStoredUsers())
  const [usersSearch, setUsersSearch] = useState('')
  const [debouncedUsersSearch, setDebouncedUsersSearch] = useState('')

  // Compute live KPIs dynamically from actual placed customer orders
  const overview = useMemo(() => {
    const totalOrders = orders.length
    let totalRevenue = 0
    let paidCount = 0

    orders.forEach(o => {
      const ordStatus = o.orderStatus?.toLowerCase() || 'awaiting_payment'
      const payStatus = o.paymentStatus?.toLowerCase() || 'pending'
      if (payStatus === 'paid' || ordStatus === 'paid' || ordStatus === 'assembling' || ordStatus === 'tested' || ordStatus === 'shipped' || ordStatus === 'delivered') {
        totalRevenue += (o.totalInr || 0)
        paidCount++
      }
    })

    const aov = paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0
    return {
      totalRegisteredUsers: users.length,
      totalOrders,
      totalRevenueInr: totalRevenue,
      averageOrderValueInr: aov
    }
  }, [orders, users])

  // Sync with real-time events when customer places order or registers
  useEffect(() => {
    const handleOrdersChange = () => {
      setOrders(getStoredOrders())
    }
    const handleUsersChange = () => {
      setUsers(getStoredUsers())
    }

    window.addEventListener('pcforge-order-placed', handleOrdersChange)
    window.addEventListener('pcforge-orders-updated', handleOrdersChange)
    window.addEventListener('pcforge-user-registered', handleUsersChange)

    return () => {
      window.removeEventListener('pcforge-order-placed', handleOrdersChange)
      window.removeEventListener('pcforge-orders-updated', handleOrdersChange)
      window.removeEventListener('pcforge-user-registered', handleUsersChange)
    }
  }, [])

  // Debounce Orders Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedOrdersSearch(ordersSearch.trim().toLowerCase())
    }, 250)
    return () => clearTimeout(timer)
  }, [ordersSearch])

  // Debounce Users Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsersSearch(usersSearch.trim().toLowerCase())
    }, 250)
    return () => clearTimeout(timer)
  }, [usersSearch])

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    let list = [...orders]
    if (statusFilter && statusFilter !== 'all') {
      list = list.filter(o => o.orderStatus?.toLowerCase() === statusFilter.toLowerCase())
    }
    if (debouncedOrdersSearch) {
      list = list.filter(o =>
        o.orderNumber?.toLowerCase().includes(debouncedOrdersSearch) ||
        o.customerName?.toLowerCase().includes(debouncedOrdersSearch) ||
        o.customerEmail?.toLowerCase().includes(debouncedOrdersSearch) ||
        o.customerPhone?.toLowerCase().includes(debouncedOrdersSearch)
      )
    }
    return list
  }, [orders, statusFilter, debouncedOrdersSearch])

  // Filtered users list
  const filteredUsers = useMemo(() => {
    if (!debouncedUsersSearch) return users
    return users.filter(u =>
      u.name?.toLowerCase().includes(debouncedUsersSearch) ||
      u.email?.toLowerCase().includes(debouncedUsersSearch)
    )
  }, [users, debouncedUsersSearch])

  // Admin Accept Order action
  const handleAcceptOrder = (orderId) => {
    const updated = updateStoredOrderStatus(orderId, 'assembling')
    if (updated) {
      setOrders(getStoredOrders())
      setActionNotice(`Order #${updated.orderNumber || orderId} accepted! Status updated to "In Assembly".`)
      setTimeout(() => setActionNotice(null), 4000)
    }
  }

  // Open Order Detail Drawer
  const handleOpenOrderDetail = (orderId) => {
    const found = orders.find(o => o.id === orderId)
    if (found) {
      setSelectedOrder(found)
    }
  }

  // Update Order Status (interactive for admin)
  const handleStatusChange = (newStatus) => {
    if (!selectedOrder) return
    setUpdatingStatus(true)
    const updated = updateStoredOrderStatus(selectedOrder.id, newStatus)
    if (updated) {
      setSelectedOrder({ ...selectedOrder, orderStatus: newStatus })
      setOrders(getStoredOrders())
      setActionNotice(`Order #${selectedOrder.orderNumber || selectedOrder.id} status updated to "${newStatus}".`)
      setTimeout(() => setActionNotice(null), 4000)
    }
    setUpdatingStatus(false)
  }

  // Download Invoice PDF / Print View
  const handleDownloadInvoice = (orderId, orderNum) => {
    const targetOrder = orders.find(o => o.id === orderId)
    if (!targetOrder) return

    const itemsHtml = (targetOrder.items || []).map(i => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${i.name} <br/><small style="color: #64748b;">${i.brand || ''} ${i.model || ''}</small></td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${i.category}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${i.quantity || 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">INR ${(i.unitPriceInr || 0).toLocaleString()}</td>
      </tr>
    `).join('')

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>PCForge Tax Invoice - ${targetOrder.orderNumber}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 25px; }
          .brand { font-size: 24px; font-weight: 800; color: #0f172a; }
          .badge { background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
          th { background: #f8fafc; padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e1; }
          .totals { float: right; width: 300px; font-size: 14px; }
          .total-row { display: flex; justify-content: space-between; padding: 6px 0; }
          .grand-total { font-weight: 800; font-size: 18px; border-top: 2px solid #0f172a; padding-top: 10px; color: #0284c7; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">PCFORGE</div>
            <small>Custom Built Performance Workstations</small>
          </div>
          <div style="text-align: right;">
            <span class="badge">OFFICIAL TAX INVOICE</span>
            <p style="margin: 5px 0 0; font-size: 13px; font-weight: 700;">#INV-${targetOrder.orderNumber}</p>
          </div>
        </div>

        <div class="info-grid">
          <div>
            <strong>Billed To:</strong><br/>
            ${targetOrder.customerName}<br/>
            ${targetOrder.customerEmail}<br/>
            ${targetOrder.customerPhone || ''}<br/>
            ${targetOrder.customerAddress || ''}
          </div>
          <div style="text-align: right;">
            <strong>Order Date:</strong> ${new Date(targetOrder.createdAt).toLocaleDateString()}<br/>
            <strong>Payment Status:</strong> ${targetOrder.paymentStatus?.toUpperCase()}<br/>
            <strong>Fulfillment Stage:</strong> ${targetOrder.orderStatus?.toUpperCase()}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Component / Hardware</th>
              <th>Category</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row"><span>Hardware Subtotal:</span><span>INR ${(targetOrder.subtotalInr || 0).toLocaleString()}</span></div>
          <div class="total-row"><span>GST / Tax (18%):</span><span>INR ${(targetOrder.taxInr || 0).toLocaleString()}</span></div>
          <div class="total-row grand-total"><span>Total:</span><span>INR ${(targetOrder.totalInr || 0).toLocaleString()}</span></div>
        </div>
      </body>
      </html>
    `

    const blob = new Blob([printHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank')
    if (win) {
      win.focus()
    } else {
      const a = document.createElement('a')
      a.href = url
      a.download = `PCForge-Invoice-${targetOrder.orderNumber}.html`
      document.body.appendChild(a)
      a.click()
      a.remove()
    }
  }

  const handleSignOut = () => {
    clearAuthSession()
    navigate('/', { replace: true })
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
            <span className="admin-nav-count">{orders.length}</span>
          </button>
          <button
            className={`admin-nav-item ${currentTab === 'users' ? 'active' : ''}`}
            onClick={() => setCurrentTab('users')}
          >
            <Users size={17} /> Users Directory
            <span className="admin-nav-count">{users.length}</span>
          </button>
        </div>

        <div className="admin-sidebar-footer">
          <div className="admin-status-pill">
            <div className="admin-status-dot" />
            <span>Admin Live Console</span>
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
              <LogOut size={15} /> Exit
            </button>
          </div>
        </header>

        {/* Dynamic Action Notification */}
        {actionNotice && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.2)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            padding: '9px 32px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} /> {actionNotice}
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
                {currentTab === 'overview' && 'Live sales revenue, build statistics, and operational KPIs from customer orders.'}
                {currentTab === 'orders' && 'Accept customer orders, update fulfillment stages, and generate invoices.'}
                {currentTab === 'users' && 'Customer directory populated from customer registrations and sign-ins.'}
              </p>
            </div>

            <div className="admin-action-row">
              <Link to="/builder" className="admin-btn-primary" style={{ textDecoration: 'none' }}>
                <Wrench size={14} /> Place Customer Order
              </Link>
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
                {formatInr(overview.totalRevenueInr)}
              </div>
              <span className="admin-kpi-footnote">Confirmed customer payments (INR)</span>
            </div>

            <div className="admin-kpi-card">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">Total PC Orders</span>
                <div className="admin-kpi-icon orders"><Package size={20} /></div>
              </div>
              <div className="admin-kpi-value">
                {overview.totalOrders}
              </div>
              <span className="admin-kpi-footnote">Orders placed by customers</span>
            </div>

            <div className="admin-kpi-card">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">Average Order Value</span>
                <div className="admin-kpi-icon"><Activity size={20} /></div>
              </div>
              <div className="admin-kpi-value">
                {formatInr(overview.averageOrderValueInr)}
              </div>
              <span className="admin-kpi-footnote">AOV across confirmed purchases</span>
            </div>

            <div className="admin-kpi-card">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">Customer Accounts</span>
                <div className="admin-kpi-icon users"><Users size={20} /></div>
              </div>
              <div className="admin-kpi-value">
                {overview.totalRegisteredUsers}
              </div>
              <span className="admin-kpi-footnote">Registered customers</span>
            </div>
          </div>

          {/* TAB 1: OVERVIEW & RECENT ORDERS */}
          {currentTab === 'overview' && (
            <div className="admin-card-panel">
              <div className="admin-panel-toolbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={17} color="#ffc64a" />
                  <strong style={{ fontSize: '14px', color: '#f8fafc' }}>Customer Orders</strong>
                </div>
                <button
                  className="admin-btn-secondary"
                  onClick={() => setCurrentTab('orders')}
                >
                  View All Orders ({orders.length}) <ArrowRight size={14} />
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="admin-empty-state">
                  <Package size={44} strokeWidth={1.5} color="#64748b" />
                  <h3>No Customer Orders Placed Yet</h3>
                  <p>The admin panel will automatically populate whenever a customer places an order in the PC Builder or Cart.</p>
                  <Link to="/builder" className="admin-btn-primary" style={{ marginTop: '12px', textDecoration: 'none' }}>
                    <Wrench size={14} /> Go to PC Builder to Place an Order
                  </Link>
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
                          <td>{order.itemCount || order.items?.length || 0} parts</td>
                          <td><strong style={{ color: '#f8fafc' }}>{formatInr(order.totalInr)}</strong></td>
                          <td>{getStatusBadge(order.paymentStatus)}</td>
                          <td>{getStatusBadge(order.orderStatus)}</td>
                          <td style={{ color: '#94a3b8', fontSize: '12px' }}>{formatDate(order.createdAt)}</td>
                          <td>
                            <div className="admin-table-actions">
                              {(order.orderStatus === 'awaiting_payment' || order.orderStatus === 'pending') && (
                                <button
                                  className="admin-btn-action"
                                  style={{ background: 'rgba(34, 197, 94, 0.15)', borderColor: 'rgba(34, 197, 94, 0.4)', color: '#4ade80' }}
                                  onClick={() => handleAcceptOrder(order.id)}
                                  title="Accept this customer order"
                                >
                                  <CheckCircle2 size={13} /> Accept
                                </button>
                              )}
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
                                title="Download Tax Invoice"
                              >
                                <Download size={13} /> Invoice
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
                      onClick={() => setStatusFilter(f)}
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
                    placeholder="Search Order #, Customer, Phone..."
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

              {orders.length === 0 ? (
                <div className="admin-empty-state">
                  <Package size={44} strokeWidth={1.5} color="#64748b" />
                  <h3>No Orders Placed Yet</h3>
                  <p>When customers configure and place an order, it will appear here in real-time.</p>
                  <Link to="/builder" className="admin-btn-primary" style={{ marginTop: '12px', textDecoration: 'none' }}>
                    <Wrench size={14} /> Go to PC Builder to Place an Order
                  </Link>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="admin-empty-state">
                  <Package size={36} strokeWidth={1.5} color="#64748b" />
                  <h3>No Matching Orders Found</h3>
                  <p>No orders match your filter criteria.</p>
                </div>
              ) : (
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
                      {filteredOrders.map((order) => (
                        <tr key={order.id}>
                          <td>
                            <strong style={{ color: '#38bdf8', letterSpacing: '0.04em' }}>
                              {order.orderNumber || order.id.slice(0, 8)}
                            </strong>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#f8fafc' }}>{order.customerName}</div>
                            <div style={{ color: '#64748b', fontSize: '11px' }}>{order.customerEmail}</div>
                            {order.customerPhone && (
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
                              {order.itemCount || order.items?.length || 0} Components
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
                              {(order.orderStatus === 'awaiting_payment' || order.orderStatus === 'pending') && (
                                <button
                                  className="admin-btn-action"
                                  style={{ background: 'rgba(34, 197, 94, 0.15)', borderColor: 'rgba(34, 197, 94, 0.4)', color: '#4ade80' }}
                                  onClick={() => handleAcceptOrder(order.id)}
                                  title="Accept this customer order"
                                >
                                  <CheckCircle2 size={13} /> Accept
                                </button>
                              )}
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
                                <FileText size={13} /> Invoice
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

          {/* TAB 3: USERS DIRECTORY */}
          {currentTab === 'users' && (
            <div className="admin-card-panel">
              <div className="admin-panel-toolbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={17} color="#c084fc" />
                  <strong style={{ fontSize: '14px', color: '#f8fafc' }}>Customer Accounts</strong>
                </div>

                <div className="admin-search-box">
                  <Search size={15} color="#64748b" />
                  <input
                    value={usersSearch}
                    onChange={(e) => setUsersSearch(e.target.value)}
                    placeholder="Search by customer name or email..."
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

              {filteredUsers.length === 0 ? (
                <div className="admin-empty-state">
                  <Users size={44} strokeWidth={1.5} color="#64748b" />
                  <h3>No Customer Accounts Yet</h3>
                  <p>When customers sign up, use Customer Direct Access, or place an order, they will appear here.</p>
                  <Link to="/account" className="admin-btn-primary" style={{ marginTop: '12px', textDecoration: 'none' }}>
                    Go to Customer Sign-in →
                  </Link>
                </div>
              ) : (
                <div className="admin-table-container">
                  <table className="admin-data-table">
                    <thead>
                      <tr>
                        <th>Customer Name</th>
                        <th>Email Address</th>
                        <th>Joined Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.email}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div className="admin-user-avatar" style={{ width: 28, height: 28, fontSize: '11px' }}>
                                {u.name?.charAt(0)?.toUpperCase() || 'C'}
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
                    <div>{selectedOrder.customerName || selectedOrder.customer?.name || '—'}</div>
                  </div>
                  <div className="admin-info-field">
                    <label>Email Address</label>
                    <div>{selectedOrder.customerEmail || selectedOrder.customer?.email || '—'}</div>
                  </div>
                  <div className="admin-info-field">
                    <label>Phone Number</label>
                    <div>{selectedOrder.customerPhone || selectedOrder.customer?.phone || '—'}</div>
                  </div>
                  <div className="admin-info-field">
                    <label>Payment Status</label>
                    <div>{getStatusBadge(selectedOrder.paymentStatus)}</div>
                  </div>
                  <div className="admin-info-field" style={{ gridColumn: 'span 2' }}>
                    <label>Shipping Address</label>
                    <div style={{ fontWeight: 400, color: '#cbd5e1' }}>
                      {selectedOrder.customerAddress || selectedOrder.customer?.address || '—'}
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
                        <td><strong style={{ color: '#f8fafc' }}>{formatInr(item.lineTotalInr || item.unitPriceInr)}</strong></td>
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
                  <Download size={14} /> Download Tax Invoice
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
