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
import { clearAuthSession, readAuthSession, storeAuthSession } from './authSession.js'
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

const DEMO_OVERVIEW = {
  totalRegisteredUsers: 142,
  totalOrders: 28,
  totalRevenueInr: 3485000,
  averageOrderValueInr: 145208,
  ordersByStatus: {
    paid: 12,
    assembling: 6,
    tested: 4,
    shipped: 4,
    delivered: 2
  },
  paymentsByStatus: {
    paid: 24,
    pending: 4
  }
}

const DEMO_ORDERS = [
  {
    id: 'ord_demo_001',
    orderNumber: 'PCF-2026-8801',
    customerName: 'Deepak Sharma',
    customerEmail: 'deepak.sharma@example.com',
    customerPhone: '+91 98765 43210',
    customerAddress: 'Flat 402, Skyline Residency, Outer Ring Road, Bengaluru, Karnataka 560103',
    itemCount: 7,
    subtotalInr: 215000,
    taxInr: 38700,
    totalInr: 253700,
    orderStatus: 'shipped',
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    customer: {
      name: 'Deepak Sharma',
      email: 'deepak.sharma@example.com',
      phone: '+91 98765 43210',
      address: 'Flat 402, Skyline Residency, Outer Ring Road, Bengaluru, Karnataka 560103'
    },
    items: [
      { name: 'AMD Ryzen 7 7800X3D Gaming Processor', brand: 'AMD', model: 'Ryzen 7 7800X3D', category: 'Processors (CPU)', quantity: 1, unitPriceInr: 38999, lineTotalInr: 38999 },
      { name: 'NVIDIA GeForce RTX 4080 Super 16GB Trinity', brand: 'ZOTAC', model: 'RTX 4080 Super Trinity', category: 'Graphics Cards (GPU)', quantity: 1, unitPriceInr: 98999, lineTotalInr: 98999 },
      { name: 'ASUS ROG Strix B650E-F Gaming WiFi', brand: 'ASUS', model: 'ROG Strix B650E-F', category: 'Motherboards', quantity: 1, unitPriceInr: 24999, lineTotalInr: 24999 },
      { name: 'Corsair Vengeance 32GB (2x16GB) DDR5 6000MHz', brand: 'Corsair', model: 'Vengeance DDR5', category: 'Memory (RAM)', quantity: 1, unitPriceInr: 10999, lineTotalInr: 10999 },
      { name: 'Samsung 990 PRO 2TB PCIe 4.0 NVMe SSD', brand: 'Samsung', model: '990 PRO 2TB', category: 'Storage (SSD/HDD)', quantity: 1, unitPriceInr: 17499, lineTotalInr: 17499 },
      { name: 'Corsair RM850x 850W 80+ Gold Modular PSU', brand: 'Corsair', model: 'RM850x', category: 'Power Supplies (PSU)', quantity: 1, unitPriceInr: 12499, lineTotalInr: 12499 },
      { name: 'NZXT H9 Flow Dual-Chamber ATX Mid-Tower Case', brand: 'NZXT', model: 'H9 Flow', category: 'PC Cases', quantity: 1, unitPriceInr: 14999, lineTotalInr: 14999 }
    ]
  },
  {
    id: 'ord_demo_002',
    orderNumber: 'PCF-2026-8802',
    customerName: 'Priya Patel',
    customerEmail: 'priya.patel@designstudio.in',
    customerPhone: '+91 98123 45678',
    customerAddress: 'Plot 18, Phase 2, Hi-Tech City, Hyderabad, Telangana 500081',
    itemCount: 8,
    subtotalInr: 185000,
    taxInr: 33300,
    totalInr: 218300,
    orderStatus: 'assembling',
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    customer: {
      name: 'Priya Patel',
      email: 'priya.patel@designstudio.in',
      phone: '+91 98123 45678',
      address: 'Plot 18, Phase 2, Hi-Tech City, Hyderabad, Telangana 500081'
    },
    items: [
      { name: 'Intel Core i7-14700K 20-Core Processor', brand: 'Intel', model: 'Core i7-14700K', category: 'Processors (CPU)', quantity: 1, unitPriceInr: 37499, lineTotalInr: 37499 },
      { name: 'Gigabyte GeForce RTX 4070 Ti Super 16GB', brand: 'Gigabyte', model: 'RTX 4070 Ti Super', category: 'Graphics Cards (GPU)', quantity: 1, unitPriceInr: 82999, lineTotalInr: 82999 },
      { name: 'MSI MAG Z790 Tomahawk WiFi Motherboard', brand: 'MSI', model: 'MAG Z790 Tomahawk', category: 'Motherboards', quantity: 1, unitPriceInr: 27999, lineTotalInr: 27999 },
      { name: 'G.Skill Ripjaws S5 64GB (2x32GB) DDR5 6000MHz', brand: 'G.Skill', model: 'Ripjaws S5', category: 'Memory (RAM)', quantity: 1, unitPriceInr: 19999, lineTotalInr: 19999 },
      { name: 'Crucial T500 2TB Gen4 NVMe SSD with Heatsink', brand: 'Crucial', model: 'T500 2TB', category: 'Storage (SSD/HDD)', quantity: 1, unitPriceInr: 14999, lineTotalInr: 14999 },
      { name: 'DeepCool LT720 360mm High-Performance AIO Cooler', brand: 'DeepCool', model: 'LT720', category: 'Cooling Systems', quantity: 1, unitPriceInr: 9999, lineTotalInr: 9999 },
      { name: 'Antec NeoECO Gold Modular 850W Power Supply', brand: 'Antec', model: 'NE850G', category: 'Power Supplies (PSU)', quantity: 1, unitPriceInr: 9499, lineTotalInr: 9499 },
      { name: 'Lian Li O11 Dynamic EVO RGB Case', brand: 'Lian Li', model: 'O11D EVO', category: 'PC Cases', quantity: 1, unitPriceInr: 15999, lineTotalInr: 15999 }
    ]
  },
  {
    id: 'ord_demo_003',
    orderNumber: 'PCF-2026-8803',
    customerName: 'Aditya Verma',
    customerEmail: 'aditya.v@gaminghub.com',
    customerPhone: '+91 97654 32109',
    customerAddress: 'Tower B, 11th Floor, Sector 62, Noida, Uttar Pradesh 201309',
    itemCount: 7,
    subtotalInr: 98500,
    taxInr: 17730,
    totalInr: 116230,
    orderStatus: 'tested',
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    customer: {
      name: 'Aditya Verma',
      email: 'aditya.v@gaminghub.com',
      phone: '+91 97654 32109',
      address: 'Tower B, 11th Floor, Sector 62, Noida, Uttar Pradesh 201309'
    },
    items: [
      { name: 'AMD Ryzen 5 7600X 6-Core Processor', brand: 'AMD', model: 'Ryzen 5 7600X', category: 'Processors (CPU)', quantity: 1, unitPriceInr: 19499, lineTotalInr: 19499 },
      { name: 'ZOTAC Gaming GeForce RTX 4060 Ti Twin Edge 8GB', brand: 'ZOTAC', model: 'RTX 4060 Ti', category: 'Graphics Cards (GPU)', quantity: 1, unitPriceInr: 38499, lineTotalInr: 38499 },
      { name: 'MSI B650M Gaming Plus WiFi', brand: 'MSI', model: 'B650M Gaming Plus', category: 'Motherboards', quantity: 1, unitPriceInr: 14499, lineTotalInr: 14499 },
      { name: 'Corsair Vengeance 32GB (2x16GB) DDR5 5600MHz', brand: 'Corsair', model: 'Vengeance DDR5', category: 'Memory (RAM)', quantity: 1, unitPriceInr: 8999, lineTotalInr: 8999 },
      { name: 'Western Digital Black SN770 1TB NVMe SSD', brand: 'WD', model: 'SN770 1TB', category: 'Storage (SSD/HDD)', quantity: 1, unitPriceInr: 6999, lineTotalInr: 6999 },
      { name: 'Cooler Master MWE 650W 80+ Bronze V2 PSU', brand: 'Cooler Master', model: 'MWE 650', category: 'Power Supplies (PSU)', quantity: 1, unitPriceInr: 5499, lineTotalInr: 5499 },
      { name: 'Montech Air 903 Max High Airflow ATX Case', brand: 'Montech', model: 'Air 903 Max', category: 'PC Cases', quantity: 1, unitPriceInr: 6499, lineTotalInr: 6499 }
    ]
  },
  {
    id: 'ord_demo_004',
    orderNumber: 'PCF-2026-8804',
    customerName: 'Sneha Nair',
    customerEmail: 'sneha.nair@innovate.co',
    customerPhone: '+91 98450 11223',
    customerAddress: 'Villa 14, Palm Meadows, Whitefield, Bengaluru, Karnataka 560066',
    itemCount: 7,
    subtotalInr: 142000,
    taxInr: 25560,
    totalInr: 167560,
    orderStatus: 'delivered',
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    customer: {
      name: 'Sneha Nair',
      email: 'sneha.nair@innovate.co',
      phone: '+91 98450 11223',
      address: 'Villa 14, Palm Meadows, Whitefield, Bengaluru, Karnataka 560066'
    },
    items: [
      { name: 'AMD Ryzen 7 7700X 8-Core Processor', brand: 'AMD', model: 'Ryzen 7 7700X', category: 'Processors (CPU)', quantity: 1, unitPriceInr: 28999, lineTotalInr: 28999 },
      { name: 'MSI GeForce RTX 4070 Ventus 2X 12G OC', brand: 'MSI', model: 'RTX 4070 Ventus 2X', category: 'Graphics Cards (GPU)', quantity: 1, unitPriceInr: 54999, lineTotalInr: 54999 },
      { name: 'ASUS TUF Gaming B650-PLUS WiFi', brand: 'ASUS', model: 'TUF B650-PLUS', category: 'Motherboards', quantity: 1, unitPriceInr: 19999, lineTotalInr: 19999 },
      { name: 'Kingston Fury Beast 32GB (2x16GB) DDR5 6000', brand: 'Kingston', model: 'Fury Beast', category: 'Memory (RAM)', quantity: 1, unitPriceInr: 9999, lineTotalInr: 9999 },
      { name: 'Samsung 980 1TB M.2 NVMe SSD', brand: 'Samsung', model: '980 1TB', category: 'Storage (SSD/HDD)', quantity: 1, unitPriceInr: 6499, lineTotalInr: 6499 },
      { name: 'Corsair RM750e 750W 80+ Gold Modular PSU', brand: 'Corsair', model: 'RM750e', category: 'Power Supplies (PSU)', quantity: 1, unitPriceInr: 9499, lineTotalInr: 9499 },
      { name: 'Corsair 4000D Airflow Tempered Glass Mid-Tower', brand: 'Corsair', model: '4000D Airflow', category: 'PC Cases', quantity: 1, unitPriceInr: 7499, lineTotalInr: 7499 }
    ]
  },
  {
    id: 'ord_demo_005',
    orderNumber: 'PCF-2026-8805',
    customerName: 'Ananya Deshmukh',
    customerEmail: 'ananya.ai@researchlabs.org',
    customerPhone: '+91 98234 56789',
    customerAddress: '7th Floor, Cyber One, Sector 30A, Vashi, Navi Mumbai, Maharashtra 400703',
    itemCount: 8,
    subtotalInr: 345000,
    taxInr: 62100,
    totalInr: 407100,
    orderStatus: 'assembling',
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    customer: {
      name: 'Ananya Deshmukh',
      email: 'ananya.ai@researchlabs.org',
      phone: '+91 98234 56789',
      address: '7th Floor, Cyber One, Sector 30A, Vashi, Navi Mumbai, Maharashtra 400703'
    },
    items: [
      { name: 'AMD Ryzen 9 7950X 16-Core 32-Thread Processor', brand: 'AMD', model: 'Ryzen 9 7950X', category: 'Processors (CPU)', quantity: 1, unitPriceInr: 52999, lineTotalInr: 52999 },
      { name: 'ASUS ROG Strix GeForce RTX 4090 24GB OC', brand: 'ASUS', model: 'ROG Strix RTX 4090', category: 'Graphics Cards (GPU)', quantity: 1, unitPriceInr: 194999, lineTotalInr: 194999 },
      { name: 'ASRock X670E Taichi Flagship Motherboard', brand: 'ASRock', model: 'X670E Taichi', category: 'Motherboards', quantity: 1, unitPriceInr: 46999, lineTotalInr: 46999 },
      { name: 'Corsair Dominator Titanium 64GB (2x32GB) DDR5 6000', brand: 'Corsair', model: 'Dominator Titanium', category: 'Memory (RAM)', quantity: 1, unitPriceInr: 26999, lineTotalInr: 26999 },
      { name: 'Samsung 990 PRO 4TB PCIe 4.0 NVMe SSD', brand: 'Samsung', model: '990 PRO 4TB', category: 'Storage (SSD/HDD)', quantity: 1, unitPriceInr: 33999, lineTotalInr: 33999 },
      { name: 'Seasonic PRIME TX-1000 1000W 80+ Titanium Modular PSU', brand: 'Seasonic', model: 'PRIME TX-1000', category: 'Power Supplies (PSU)', quantity: 1, unitPriceInr: 28999, lineTotalInr: 28999 },
      { name: 'Lian Li Galahad II LCD 360 High-End Liquid Cooler', brand: 'Lian Li', model: 'Galahad II LCD', category: 'Cooling Systems', quantity: 1, unitPriceInr: 21999, lineTotalInr: 21999 },
      { name: 'Fractal Design North XL Charcoal Black Mesh Case', brand: 'Fractal Design', model: 'North XL Mesh', category: 'PC Cases', quantity: 1, unitPriceInr: 18999, lineTotalInr: 18999 }
    ]
  },
  {
    id: 'ord_demo_006',
    orderNumber: 'PCF-2026-8806',
    customerName: 'Rohan Gupta',
    customerEmail: 'rohan.g@techstarter.dev',
    customerPhone: '+91 99100 23456',
    customerAddress: 'B-304, Green Glen Layout, Bellandur, Bengaluru, Karnataka 560103',
    itemCount: 7,
    subtotalInr: 58000,
    taxInr: 10440,
    totalInr: 68440,
    orderStatus: 'awaiting_payment',
    paymentStatus: 'pending',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    customer: {
      name: 'Rohan Gupta',
      email: 'rohan.g@techstarter.dev',
      phone: '+91 99100 23456',
      address: 'B-304, Green Glen Layout, Bellandur, Bengaluru, Karnataka 560103'
    },
    items: [
      { name: 'AMD Ryzen 5 5600 6-Core Processor', brand: 'AMD', model: 'Ryzen 5 5600', category: 'Processors (CPU)', quantity: 1, unitPriceInr: 11999, lineTotalInr: 11999 },
      { name: 'ASRock AMD Radeon RX 7600 Challenger 8GB', brand: 'ASRock', model: 'RX 7600 Challenger', category: 'Graphics Cards (GPU)', quantity: 1, unitPriceInr: 25499, lineTotalInr: 25499 },
      { name: 'MSI B450M PRO-VDH MAX Motherboard', brand: 'MSI', model: 'B450M PRO-VDH', category: 'Motherboards', quantity: 1, unitPriceInr: 5499, lineTotalInr: 5499 },
      { name: 'G.Skill Ripjaws V 16GB (2x8GB) DDR4 3200MHz', brand: 'G.Skill', model: 'Ripjaws V DDR4', category: 'Memory (RAM)', quantity: 1, unitPriceInr: 3499, lineTotalInr: 3499 },
      { name: 'Crucial P3 Plus 1TB PCIe 4.0 3D NAND NVMe', brand: 'Crucial', model: 'P3 Plus 1TB', category: 'Storage (SSD/HDD)', quantity: 1, unitPriceInr: 5499, lineTotalInr: 5499 },
      { name: 'DeepCool PK550D 550W 80+ Bronze Certified PSU', brand: 'DeepCool', model: 'PK550D', category: 'Power Supplies (PSU)', quantity: 1, unitPriceInr: 3699, lineTotalInr: 3699 },
      { name: 'Ant Esports ICE-100 Air Mini Micro-ATX Case', brand: 'Ant Esports', model: 'ICE-100', category: 'PC Cases', quantity: 1, unitPriceInr: 2899, lineTotalInr: 2899 }
    ]
  }
]

const DEMO_USERS = [
  { name: 'Deepak Sharma', email: 'deepak.sharma@example.com', registeredAt: '2026-11-18T10:15:00Z' },
  { name: 'Priya Patel', email: 'priya.patel@designstudio.in', registeredAt: '2026-11-19T14:32:00Z' },
  { name: 'Aditya Verma', email: 'aditya.v@gaminghub.com', registeredAt: '2026-11-20T09:12:00Z' },
  { name: 'Sneha Nair', email: 'sneha.nair@innovate.co', registeredAt: '2026-11-10T16:45:00Z' },
  { name: 'Ananya Deshmukh', email: 'ananya.ai@researchlabs.org', registeredAt: '2026-11-21T08:20:00Z' },
  { name: 'Rohan Gupta', email: 'rohan.g@techstarter.dev', registeredAt: '2026-11-21T09:55:00Z' }
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

  // Auto-provision Recruiter Guest Session if no session exists, so visitors never get blocked!
  const [session, setSession] = useState(() => {
    const existing = readAuthSession()
    if (existing?.accessToken) return existing
    const guestAdmin = {
      user: { name: 'Administrator', email: 'admin@pcforge.com', role: 'ADMIN' },
      accessToken: 'admin-direct-token',
      isGuestMode: true
    }
    storeAuthSession(guestAdmin)
    return guestAdmin
  })

  const [currentTab, setCurrentTab] = useState('overview') // 'overview', 'orders', 'users'

  // Overview stats with rich demo fallback
  const [overview, setOverview] = useState(DEMO_OVERVIEW)
  const [loadingOverview, setLoadingOverview] = useState(false)

  // Orders state with rich demo fallback
  const [orders, setOrders] = useState(DEMO_ORDERS)
  const [ordersPagination, setOrdersPagination] = useState({ page: 1, size: 15, total: DEMO_ORDERS.length, totalPages: 1 })
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersSearch, setOrdersSearch] = useState('')
  const [debouncedOrdersSearch, setDebouncedOrdersSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [seedingOrders, setSeedingOrders] = useState(false)
  const [actionNotice, setActionNotice] = useState(null)

  // Users state with rich demo fallback
  const [users, setUsers] = useState(DEMO_USERS)
  const [usersPagination, setUsersPagination] = useState({ page: 1, total: DEMO_USERS.length, totalPages: 1 })
  const [usersPage, setUsersPage] = useState(1)
  const [usersSearch, setUsersSearch] = useState('')
  const [debouncedUsersSearch, setDebouncedUsersSearch] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Fetch Overview Stats
  const loadOverview = async () => {
    if (!session?.accessToken || session.isGuestMode) return
    try {
      setLoadingOverview(true)
      const data = await getAdminOverview(session.accessToken)
      if (data) setOverview(data)
    } catch (err) {
      // Graceful fallback to demo data on static hosts like GitHub Pages
      setOverview(DEMO_OVERVIEW)
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
      setDebouncedOrdersSearch(ordersSearch.trim().toLowerCase())
      setOrdersPage(1)
    }, 250)
    return () => clearTimeout(timer)
  }, [ordersSearch])

  // Debounce Users Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsersSearch(usersSearch.trim().toLowerCase())
      setUsersPage(1)
    }, 250)
    return () => clearTimeout(timer)
  }, [usersSearch])

  // Fetch or Filter Orders
  const loadOrders = async () => {
    if (!session?.accessToken || session.isGuestMode) {
      // Local client-side filtering for static/guest mode
      let filtered = [...DEMO_ORDERS]
      if (statusFilter && statusFilter !== 'all') {
        filtered = filtered.filter(o => o.orderStatus?.toLowerCase() === statusFilter.toLowerCase())
      }
      if (debouncedOrdersSearch) {
        filtered = filtered.filter(o =>
          o.orderNumber?.toLowerCase().includes(debouncedOrdersSearch) ||
          o.customerName?.toLowerCase().includes(debouncedOrdersSearch) ||
          o.customerEmail?.toLowerCase().includes(debouncedOrdersSearch) ||
          o.customerPhone?.toLowerCase().includes(debouncedOrdersSearch)
        )
      }
      setOrders(filtered)
      setOrdersPagination({ page: 1, size: 15, total: filtered.length, totalPages: 1 })
      return
    }

    try {
      setLoadingOrders(true)
      const res = await getAdminOrders(session.accessToken, {
        page: ordersPage,
        size: 15,
        search: debouncedOrdersSearch,
        status: statusFilter === 'all' ? '' : statusFilter
      })
      if (res?.orders && res.orders.length > 0) {
        setOrders(res.orders)
        setOrdersPagination(res.pagination || { page: ordersPage, total: res.orders.length, totalPages: 1 })
      } else {
        // Fallback to rich demo data if DB has 0 records
        setOrders(DEMO_ORDERS)
        setOrdersPagination({ page: 1, size: 15, total: DEMO_ORDERS.length, totalPages: 1 })
      }
    } catch (err) {
      // On static deployment (GitHub Pages), gracefully serve demo orders
      setOrders(DEMO_ORDERS)
      setOrdersPagination({ page: 1, size: 15, total: DEMO_ORDERS.length, totalPages: 1 })
    } finally {
      setLoadingOrders(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [session?.accessToken, ordersPage, debouncedOrdersSearch, statusFilter, currentTab])

  // Fetch or Filter Users
  useEffect(() => {
    if (currentTab !== 'users') return
    if (debouncedUsersSearch) {
      setUsers(DEMO_USERS.filter(u =>
        u.name.toLowerCase().includes(debouncedUsersSearch) ||
        u.email.toLowerCase().includes(debouncedUsersSearch)
      ))
    } else {
      setUsers(DEMO_USERS)
    }
  }, [debouncedUsersSearch, currentTab])

  // Open Order Detail Drawer
  const handleOpenOrderDetail = (orderId) => {
    const found = orders.find(o => o.id === orderId) || DEMO_ORDERS.find(o => o.id === orderId)
    if (found) {
      setSelectedOrder(found)
    }
  }

  // Update Order Status (interactive for recruiters & admins!)
  const handleStatusChange = async (newStatus) => {
    if (!selectedOrder) return
    setUpdatingStatus(true)

    // Immediate optimistic update so recruiter sees instant reaction!
    setSelectedOrder(prev => ({ ...prev, orderStatus: newStatus }))
    setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, orderStatus: newStatus } : o))
    setActionNotice(`Order #${selectedOrder.orderNumber || selectedOrder.id} status updated to "${newStatus}".`)
    setTimeout(() => setActionNotice(null), 4000)

    try {
      if (session?.accessToken && !session.isGuestMode) {
        await updateAdminOrderStatus(session.accessToken, selectedOrder.id, newStatus)
      }
    } catch {
      // Silently keep optimistic update in demo mode
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Download Invoice PDF (or instant generated invoice for static preview)
  const handleDownloadInvoice = async (orderId, orderNum) => {
    setActionNotice('Preparing invoice download...')
    try {
      if (session?.accessToken && !session.isGuestMode) {
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
        return
      }
    } catch {
      // Fall through to instant client-side invoice generator
    }

    // Client-side formatted tax invoice for recruiters visiting the live hosted static site
    const targetOrder = orders.find(o => o.id === orderId) || DEMO_ORDERS.find(o => o.id === orderId)
    if (targetOrder) {
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
              <strong>Order Placed:</strong> ${new Date(targetOrder.createdAt).toLocaleDateString()}<br/>
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
            <div class="total-row grand-total"><span>Total Paid:</span><span>INR ${(targetOrder.totalInr || 0).toLocaleString()}</span></div>
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
    setActionNotice(null)
  }

  // Seed Demo Orders
  const handleSeedOrders = async () => {
    setSeedingOrders(true)
    setTimeout(() => {
      setOrders(DEMO_ORDERS)
      setOverview(DEMO_OVERVIEW)
      setActionNotice('Sample PC orders and business analytics refreshed!')
      setTimeout(() => setActionNotice(null), 4000)
      setSeedingOrders(false)
    }, 400)
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
            <span>Enterprise Admin Active</span>
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
                {session?.user?.name?.charAt(0)?.toUpperCase() || 'R'}
              </div>
              <span>{session?.user?.name || 'Administrator'}</span>
            </div>
            <button className="admin-btn-logout" onClick={handleSignOut} title="Sign Out">
              <LogOut size={15} /> Exit
            </button>
          </div>
        </header>

        {/* Admin Access Welcome Pill */}
        <div style={{
          background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.15), rgba(255, 198, 74, 0.12))',
          borderBottom: '1px solid rgba(56, 189, 248, 0.3)',
          color: '#e2e8f0',
          padding: '10px 32px',
          fontSize: '12.5px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="#38bdf8" />
            <span>
              <strong>Admin Direct Access:</strong> Full administrative privileges active. You can inspect hardware orders, change fulfillment stages, and generate invoices.
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#ffc64a', fontWeight: 700, letterSpacing: '0.04em' }}>
            ADMIN ACCESS ACTIVE
          </span>
        </div>

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
                {currentTab === 'overview' && 'Live sales revenue, build statistics, and operational KPIs.'}
                {currentTab === 'orders' && 'Inspect customer configurations, update fulfillment status, and generate invoices.'}
                {currentTab === 'users' && 'Customer directory and authentication records.'}
              </p>
            </div>

            <div className="admin-action-row">
              <button
                className="admin-btn-secondary"
                onClick={() => { loadOverview(); loadOrders(); }}
              >
                <RefreshCw size={14} /> Refresh Data
              </button>

              <button
                className="admin-btn-primary"
                onClick={handleSeedOrders}
                disabled={seedingOrders}
              >
                <Sparkles size={14} />
                {seedingOrders ? 'Refreshing...' : 'Reset Demo Orders'}
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
                {overview ? formatInr(overview.totalRevenueInr) : formatInr(3485000)}
              </div>
              <span className="admin-kpi-footnote">Confirmed customer payments (INR)</span>
            </div>

            <div className="admin-kpi-card">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">Total PC Orders</span>
                <div className="admin-kpi-icon orders"><Package size={20} /></div>
              </div>
              <div className="admin-kpi-value">
                {overview ? overview.totalOrders : orders.length}
              </div>
              <span className="admin-kpi-footnote">Active orders across all pipelines</span>
            </div>

            <div className="admin-kpi-card">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">Average Order Value</span>
                <div className="admin-kpi-icon"><Activity size={20} /></div>
              </div>
              <div className="admin-kpi-value">
                {overview ? formatInr(overview.averageOrderValueInr) : formatInr(145208)}
              </div>
              <span className="admin-kpi-footnote">AOV across confirmed purchases</span>
            </div>

            <div className="admin-kpi-card">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">Customer Accounts</span>
                <div className="admin-kpi-icon users"><Users size={20} /></div>
              </div>
              <div className="admin-kpi-value">
                {overview ? overview.totalRegisteredUsers : users.length}
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
                  View All Orders ({orders.length}) <ArrowRight size={14} />
                </button>
              </div>

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
                              <FileText size={13} /> Invoice
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
                  Showing {orders.length} orders
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="admin-btn-secondary" disabled>
                    <ArrowLeft size={14} /> Previous
                  </button>
                  <button className="admin-btn-secondary" disabled>
                    Next <ArrowRight size={14} />
                  </button>
                </div>
              </div>
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
                <span>Showing {users.length} registered accounts</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="admin-btn-secondary" disabled>
                    <ArrowLeft size={14} /> Previous
                  </button>
                  <button className="admin-btn-secondary" disabled>
                    Next <ArrowRight size={14} />
                  </button>
                </div>
              </div>
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
