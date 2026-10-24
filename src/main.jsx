import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import App from './App.jsx'
import AccountPage from './AccountPage.jsx'
import AdminDashboard from './AdminDashboard.jsx'
import { siteRoutes } from './config/siteRoutes.js'
import './index.css'
import './visual-refresh.css'
import './design-system.css'
import './readability.css'
import './builder-contrast.css'
import './mobile-responsive.css'
import './premium-ui.css'
import './accessibility-readability.css'

createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter basename={import.meta.env.BASE_URL}><Routes>
<Route path="/account" element={<AccountPage />} />
<Route path="/admin/*" element={<AdminDashboard />} />
<Route element={<App />}>
    {siteRoutes.map(({ id, path }) => <Route key={id} index={path === '/'} path={path === '/' ? undefined : path.slice(1)} element={null} />)}
    <Route path="*" element={null} />
  </Route>
</Routes></BrowserRouter></React.StrictMode>)
