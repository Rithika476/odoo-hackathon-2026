import { useEffect, useState } from 'react'
import axios from 'axios'
import { Bell, Check, Trash2, Search } from 'lucide-react'
import Toast from '../components/Toast'
import LoadingSkeleton from '../components/LoadingSkeleton'

export default function Notifications({ darkMode }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')

  const load = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const { data } = await axios.get('/notifications', { headers: { Authorization: `Bearer ${token}` } })
      setItems(data)
    } catch (err) {
      showToastMessage('Failed to load notifications', 'danger')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const markRead = async (id) => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(`/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } })
      showToastMessage('Notification marked as read', 'success')
      load()
    } catch (err) {
      showToastMessage('Failed to mark as read', 'danger')
    }
  }

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('token')
      await Promise.all(
        items.filter(item => !item.is_read).map(item => 
          axios.post(`/notifications/${item.id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } })
        )
      )
      showToastMessage('All notifications marked as read', 'success')
      load()
    } catch (err) {
      showToastMessage('Failed to mark all as read', 'danger')
    }
  }

  const deleteNotification = async (id) => {
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`/notifications/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      showToastMessage('Notification deleted', 'success')
      load()
    } catch (err) {
      showToastMessage('Failed to delete notification', 'danger')
    }
  }

  const showToastMessage = (message, type) => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
  }

  const filtered = items.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.message && item.message.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const unreadCount = items.filter(item => !item.is_read).length

  return (
    <div>
      {showToast && (
        <Toast 
          message={toastMessage} 
          type={toastType} 
          onClose={() => setShowToast(false)} 
        />
      )}

      <div className={`card shadow-sm border-0 mb-4 ${darkMode ? 'bg-secondary text-white' : ''}`}>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center gap-3">
              <h5 className="card-title mb-0 d-flex align-items-center gap-2">
                <Bell size={20} />
                Notification Inbox
              </h5>
              {unreadCount > 0 && (
                <span className="badge bg-danger">{unreadCount} unread</span>
              )}
            </div>
            <div className="d-flex gap-2">
              <div className="position-relative" style={{ maxWidth: '300px' }}>
                <Search size={18} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                <input 
                  type="text" 
                  className={`form-control ps-5 ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
                  placeholder="Search notifications..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              {unreadCount > 0 && (
                <button 
                  className="btn btn-outline-primary"
                  onClick={markAllRead}
                >
                  Mark All Read
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <LoadingSkeleton type="table" rows={5} />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className={darkMode ? 'table-dark' : 'table-light'}>
                  <tr>
                    <th>Title</th>
                    <th>Message</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? filtered.map(item => (
                    <tr key={item.id} className={!item.is_read ? 'table-light' : ''}>
                      <td className="fw-semibold">{item.title}</td>
                      <td className="text-muted">{item.message || '—'}</td>
                      <td className="text-muted small">{new Date(item.created_at).toLocaleString()}</td>
                      <td>
                        {item.is_read ? (
                          <span className="badge bg-secondary">Read</span>
                        ) : (
                          <span className="badge bg-primary">Unread</span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="btn-group">
                          {!item.is_read && (
                            <button 
                              className="btn btn-sm btn-outline-success"
                              onClick={() => markRead(item.id)}
                              title="Mark as read"
                            >
                              <Check size={16} />
                            </button>
                          )}
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => deleteNotification(item.id)}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">
                        <Bell size={48} className="mb-2 text-muted" />
                        <p className="mb-0">No notifications found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
