import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'
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

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

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

  if (loading) return <div className="p-5">Loading...</div>

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <div className="min-vh-100 bg-light">
      {user ? (
        <div className="d-flex">
          <aside className="bg-dark text-white p-3" style={{ width: 260, minHeight: '100vh' }}>
            <h4 className="mb-4">AssetFlow</h4>
            <nav className="d-flex flex-column gap-2">
              <Link className="text-white text-decoration-none" to="/dashboard">Dashboard</Link>
              <Link className="text-white text-decoration-none" to="/departments">Departments</Link>
              <Link className="text-white text-decoration-none" to="/employees">Employees</Link>
              <Link className="text-white text-decoration-none" to="/categories">Categories</Link>
              <Link className="text-white text-decoration-none" to="/assets">Assets</Link>
              <Link className="text-white text-decoration-none" to="/bookings">Bookings</Link>
              <Link className="text-white text-decoration-none" to="/allocations">Allocations</Link>
              <Link className="text-white text-decoration-none" to="/transfers">Transfers</Link>
              <Link className="text-white text-decoration-none" to="/maintenance">Maintenance</Link>
              <Link className="text-white text-decoration-none" to="/audit">Audit</Link>
              <Link className="text-white text-decoration-none" to="/notifications">Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}</Link>
              <Link className="text-white text-decoration-none" to="/activity">Activity Logs</Link>
              <Link className="text-white text-decoration-none" to="/reports">Reports</Link>
              <button className="btn btn-outline-light btn-sm mt-3" onClick={logout}>Logout</button>
            </nav>
          </aside>
          <main className="flex-grow-1 p-4">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard user={user} />} />
              <Route path="/departments" element={<Departments />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/assets" element={<Assets />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/allocations" element={<Allocations />} />
              <Route path="/transfers" element={<Transfers />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/audit" element={<Audit />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/activity" element={<ActivityLogs />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<Login onLogin={setUser} />} />
          <Route path="/register" element={<Register onLogin={setUser} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </div>
  )
}

export default App
