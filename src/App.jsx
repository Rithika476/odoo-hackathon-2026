import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  LayoutDashboard,
  Building2,
  Users,
  Tag,
  Package,
  Calendar,
  ArrowRightLeft,
  Wrench,
  ClipboardCheck,
  Bell,
  FileText,
  Activity,
  LogOut,
  User,
  Moon,
  Sun,
  Menu,
  X
} from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import Departments from './pages/Departments'
import Employees from './pages/Employees'
import Categories from './pages/Categories'
import Assets from './pages/Assets'
import Bookings from './pages/Bookings'
import Maintenance from './pages/Maintenance'
import Reports from './pages/Reports'
import Allocations from './pages/Allocations'
import Transfers from './pages/Transfers'
import Audit from './pages/Audit'
import Notifications from './pages/Notifications'
import ActivityLogs from './pages/ActivityLogs'

axios.defaults.baseURL = '/api'

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/departments', label: 'Departments', icon: Building2 },
  { path: '/employees', label: 'Employees', icon: Users },
  { path: '/categories', label: 'Categories', icon: Tag },
  { path: '/assets', label: 'Assets', icon: Package },
  { path: '/bookings', label: 'Bookings', icon: Calendar },
  { path: '/allocations', label: 'Allocations', icon: ArrowRightLeft },
  { path: '/transfers', label: 'Transfers', icon: ArrowRightLeft },
  { path: '/maintenance', label: 'Maintenance', icon: Wrench },
  { path: '/audit', label: 'Audit', icon: ClipboardCheck },
  { path: '/notifications', label: 'Notifications', icon: Bell },
  { path: '/activity', label: 'Activity Logs', icon: Activity },
  { path: '/reports', label: 'Reports', icon: FileText },
]

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [darkMode, setDarkMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    axios.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setUser(res.data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!user) return
    const token = localStorage.getItem('token')
    axios.get('/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setUnreadCount(res.data.filter(item => !item.is_read).length))
  }, [user])

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('bg-dark')
      document.body.classList.remove('bg-light')
    } else {
      document.body.classList.add('bg-light')
      document.body.classList.remove('bg-dark')
    }
  }, [darkMode])

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  )

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setUserDropdownOpen(false)
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen)
  }

  const NavLink = ({ to, children, icon: Icon }) => {
    const isActive = location.pathname === to
    return (
      <Link
        to={to}
        className={`d-flex align-items-center gap-2 px-3 py-2 rounded text-decoration-none transition-all ${
          isActive 
            ? 'bg-primary text-white' 
            : darkMode 
              ? 'text-white hover:bg-white-10' 
              : 'text-white hover:bg-white-10'
        }`}
        style={{ '--bs-bg-opacity': 0.1 }}
      >
        <Icon size={18} />
        <span className={sidebarOpen ? '' : 'd-none'}>{children}</span>
      </Link>
    )
  }

  return (
    <div className={`min-vh-100 ${darkMode ? 'bg-dark' : 'bg-light'}`}>
      {user ? (
        <div className="d-flex">
          <aside 
            className={`bg-dark text-white d-flex flex-column transition-all ${
              sidebarOpen ? 'p-3' : 'p-2'
            }`}
            style={{ 
              width: sidebarOpen ? 260 : 70, 
              minHeight: '100vh',
              position: 'fixed',
              left: 0,
              top: 0,
              zIndex: 1000
            }}
          >
            <div className="d-flex align-items-center justify-content-between mb-4">
              {sidebarOpen && <h4 className="mb-0 fw-bold">AssetFlow</h4>}
              <button 
                className="btn btn-link text-white p-0"
                onClick={toggleSidebar}
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
            
            <nav className="d-flex flex-column gap-2 flex-grow-1">
              {menuItems.map(item => (
                <NavLink 
                  key={item.path} 
                  to={item.path} 
                  icon={item.icon}
                >
                  {item.label}
                  {item.path === '/notifications' && unreadCount > 0 && (
                    <span className="badge bg-danger ms-auto">{unreadCount}</span>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="mt-auto pt-3 border-top border-secondary">
              <button 
                className="btn btn-outline-light btn-sm w-100 mb-2 d-flex align-items-center justify-content-center gap-2"
                onClick={toggleDarkMode}
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                {sidebarOpen && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
              </button>
              <button 
                className="btn btn-outline-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
                onClick={logout}
              >
                <LogOut size={16} />
                {sidebarOpen && <span>Logout</span>}
              </button>
            </div>
          </aside>

          <main className="flex-grow-1 p-4" style={{ marginLeft: sidebarOpen ? 260 : 70 }}>
            <header className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="mb-0">
                {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
              </h2>
              
              <div className="position-relative">
                <button 
                  className="btn btn-outline-secondary d-flex align-items-center gap-2"
                  onClick={toggleUserDropdown}
                >
                  <User size={18} />
                  <span className="d-none d-md-inline">{user.full_name}</span>
                </button>
                
                {userDropdownOpen && (
                  <div className="dropdown-menu show position-absolute end-0 mt-2" style={{ zIndex: 1001 }}>
                    <div className="dropdown-header">
                      <strong>{user.full_name}</strong>
                      <br />
                      <small className="text-muted">{user.email}</small>
                    </div>
                    <div className="dropdown-divider"></div>
                    <span className="dropdown-item-text">
                      <span className="badge bg-primary">{user.role}</span>
                    </span>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item" onClick={logout}>
                      <LogOut size={16} className="me-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </header>

            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard user={user} darkMode={darkMode} />} />
              <Route path="/departments" element={<Departments darkMode={darkMode} />} />
              <Route path="/employees" element={<Employees darkMode={darkMode} />} />
              <Route path="/categories" element={<Categories darkMode={darkMode} />} />
              <Route path="/assets" element={<Assets darkMode={darkMode} />} />
              <Route path="/bookings" element={<Bookings darkMode={darkMode} />} />
              <Route path="/allocations" element={<Allocations darkMode={darkMode} />} />
              <Route path="/transfers" element={<Transfers darkMode={darkMode} />} />
              <Route path="/maintenance" element={<Maintenance darkMode={darkMode} />} />
              <Route path="/audit" element={<Audit darkMode={darkMode} />} />
              <Route path="/notifications" element={<Notifications darkMode={darkMode} />} />
              <Route path="/activity" element={<ActivityLogs darkMode={darkMode} />} />
              <Route path="/reports" element={<Reports darkMode={darkMode} />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<Login onLogin={setUser} darkMode={darkMode} />} />
          <Route path="/register" element={<Register onLogin={setUser} darkMode={darkMode} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </div>
  )
}

export default App
