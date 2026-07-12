import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Bookings() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ resource_type: 'Meeting Room', resource_name: '', start_time: '', end_time: '', purpose: '' })
  const [error, setError] = useState('')
  
  // Search, filter, pagination
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') 
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  
  // Reschedule state
  const [editBooking, setEditBooking] = useState(null)
  const [editForm, setEditForm] = useState({ start_time: '', end_time: '' })
  const [editError, setEditError] = useState('')

  const load = async () => {
    try {
      const token = localStorage.getItem('token')
      const { data } = await axios.get('/bookings', { headers: { Authorization: `Bearer ${token}` } })
      setItems(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const token = localStorage.getItem('token')
      await axios.post('/bookings', form, { headers: { Authorization: `Bearer ${token}` } })
      setForm({ resource_type: 'Meeting Room', resource_name: '', start_time: '', end_time: '', purpose: '' })
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create booking.')
    }
  }

  const cancelBooking = async (id) => {
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`/bookings/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel booking.')
    }
  }

  const startReschedule = (item) => {
    setEditBooking(item)
    setEditForm({
      start_time: item.start_time ? item.start_time.slice(0,16) : '',
      end_time: item.end_time ? item.end_time.slice(0,16) : ''
    })
    setEditError('')
  }

  const submitReschedule = async (e) => {
    e.preventDefault()
    setEditError('')
    try {
      const token = localStorage.getItem('token')
      await axios.patch(`/bookings/${editBooking.id}`, editForm, { headers: { Authorization: `Bearer ${token}` } })
      setEditBooking(null)
      load()
    } catch (err) {
      setEditError(err.response?.data?.error || 'Failed to reschedule.')
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleString()
  }

  // Derived state for filtering and pagination
  const filtered = items.filter(item => {
    const matchesSearch = item.resource_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.purpose && item.purpose.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div>
      <h2 className="mb-4">Resource Bookings</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card p-3 mb-4 shadow-sm border-0">
        <form onSubmit={submit} className="row g-3">
          <div className="col-md-3">
            <input className="form-control" placeholder="Resource Type (e.g. Room)" value={form.resource_type} onChange={e => setForm({ ...form, resource_type: e.target.value })} required />
          </div>
          <div className="col-md-3">
            <input className="form-control" placeholder="Resource Name" value={form.resource_name} onChange={e => setForm({ ...form, resource_name: e.target.value })} required />
          </div>
          <div className="col-md-2">
            <input className="form-control" type="datetime-local" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} required />
          </div>
          <div className="col-md-2">
            <input className="form-control" type="datetime-local" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} required />
          </div>
          <div className="col-md-2">
            <button className="btn btn-primary w-100">Book Now</button>
          </div>
          <div className="col-12">
            <input className="form-control" placeholder="Purpose" value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} />
          </div>
        </form>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex gap-2">
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search resources..." 
            value={searchTerm} 
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            style={{ width: '250px' }} 
          />
          <select 
            className="form-select" 
            value={statusFilter} 
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            style={{ width: '150px' }}
          >
            <option value="all">All Statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-0">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Resource</th>
                <th>Type</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Purpose</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? paginated.map(item => (
                <tr key={item.id}>
                  <td>{item.resource_name}</td>
                  <td>{item.resource_type}</td>
                  <td>{formatDate(item.start_time)}</td>
                  <td>{formatDate(item.end_time)}</td>
                  <td>{item.purpose || '—'}</td>
                  <td>
                    <span className={`badge bg-${item.status === 'upcoming' ? 'primary' : item.status === 'ongoing' ? 'warning text-dark' : item.status === 'completed' ? 'success' : 'danger'}`}>
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {item.status === 'upcoming' ? (
                      <div className="btn-group">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => startReschedule(item)}>Reschedule</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => cancelBooking(item.id)}>Cancel</button>
                      </div>
                    ) : '—'}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">No bookings found matching your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="d-flex justify-content-center">
          <ul className="pagination">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setCurrentPage(prev => prev - 1)}>Previous</button>
            </li>
            {[...Array(totalPages)].map((_, i) => (
              <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
              </li>
            ))}
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setCurrentPage(prev => prev + 1)}>Next</button>
            </li>
          </ul>
        </div>
      )}

      {editBooking && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reschedule {editBooking.resource_name}</h5>
                <button type="button" className="btn-close" onClick={() => setEditBooking(null)}></button>
              </div>
              <div className="modal-body">
                {editError && <div className="alert alert-danger">{editError}</div>}
                <form onSubmit={submitReschedule}>
                  <div className="mb-3">
                    <label className="form-label">New Start Time</label>
                    <input className="form-control" type="datetime-local" value={editForm.start_time} onChange={e => setEditForm({...editForm, start_time: e.target.value})} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">New End Time</label>
                    <input className="form-control" type="datetime-local" value={editForm.end_time} onChange={e => setEditForm({...editForm, end_time: e.target.value})} required />
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-secondary" onClick={() => setEditBooking(null)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Save Changes</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
