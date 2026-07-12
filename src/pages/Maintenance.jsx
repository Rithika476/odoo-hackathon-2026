import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Maintenance() {
  const [items, setItems] = useState([])
  const [assets, setAssets] = useState([])
  const [technicians, setTechnicians] = useState([])
  
  const [form, setForm] = useState({ asset_id: '', issue_description: '', priority: 'medium', photo_url: '' })
  const [error, setError] = useState('')
  const [tab, setTab] = useState('list') 
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Details Modal
  const [selectedItem, setSelectedItem] = useState(null)
  const [assignForm, setAssignForm] = useState({ technician_id: '' })
  const [assetHistory, setAssetHistory] = useState([])

  const load = async () => {
    try {
      const token = localStorage.getItem('token')
      const [maintenanceRes, assetRes, techRes] = await Promise.all([
        axios.get('/maintenance', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/assets', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/technicians', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      setItems(maintenanceRes.data)
      setAssets(assetRes.data)
      setTechnicians(techRes.data)
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
      await axios.post('/maintenance', form, { headers: { Authorization: `Bearer ${token}` } })
      setForm({ asset_id: '', issue_description: '', priority: 'medium', photo_url: '' })
      load()
      setTab('list')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit request.')
    }
  }

  const updateStatus = async (id, status, payload = {}) => {
    try {
      const token = localStorage.getItem('token')
      await axios.patch(`/maintenance/${id}`, { status, ...payload }, { headers: { Authorization: `Bearer ${token}` } })
      await load()
      // Close the modal upon updating, so the user can see it updated in the list or reopen it with fresh data
      setSelectedItem(null)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status.')
    }
  }

  const openDetails = async (item) => {
    setSelectedItem(item)
    setAssignForm({ technician_id: item.assigned_technician_id || '' })
    try {
      const token = localStorage.getItem('token')
      const { data } = await axios.get(`/assets/${item.asset_id}`, { headers: { Authorization: `Bearer ${token}` } })
      setAssetHistory(data.history || [])
    } catch (err) {
      setAssetHistory([])
    }
  }

  const getAssetName = (assetId) => {
    const asset = assets.find(a => a.id === assetId)
    return asset ? asset.name : `Asset #${assetId}`
  }

  const getTechName = (techId) => {
    const tech = technicians.find(t => t.id === techId)
    return tech ? tech.name : 'Unassigned'
  }

  const getStatusBadge = (status) => {
    const colors = {
      'pending': 'warning text-dark',
      'approved': 'info text-dark',
      'rejected': 'danger',
      'in_progress': 'primary',
      'resolved': 'success'
    }
    return <span className={`badge bg-${colors[status] || 'secondary'}`}>{status.replace('_', ' ').toUpperCase()}</span>
  }

  const getPriorityBadge = (priority) => {
    const colors = {
      'low': 'secondary',
      'medium': 'warning text-dark',
      'high': 'orange',
      'critical': 'danger'
    }
    return <span className={`badge bg-${colors[priority] || 'secondary'}`} style={{ backgroundColor: priority === 'high' ? '#fd7e14' : '' }}>{priority.toUpperCase()}</span>
  }

  const formatDate = (d) => d ? new Date(d).toLocaleString() : '—'

  const filtered = items.filter(item => {
    const matchesSearch = item.issue_description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          getAssetName(item.asset_id).toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div>
      <h2 className="mb-4">Maintenance Management</h2>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>Requests List</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'submit' ? 'active' : ''}`} onClick={() => setTab('submit')}>Raise Request</button>
        </li>
      </ul>

      {tab === 'submit' && (
        <div className="card p-4 shadow-sm border-0 mx-auto" style={{ maxWidth: '600px' }}>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label">Select Asset</label>
              <select className="form-select" value={form.asset_id} onChange={e => setForm({ ...form, asset_id: e.target.value })} required>
                <option value="">-- Choose Asset --</option>
                {assets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Issue Description</label>
              <textarea className="form-control" rows="3" value={form.issue_description} onChange={e => setForm({ ...form, issue_description: e.target.value })} required />
            </div>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Priority</label>
                <select className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Photo URL (Optional)</label>
                <input type="text" className="form-control" placeholder="https://..." value={form.photo_url} onChange={e => setForm({ ...form, photo_url: e.target.value })} />
              </div>
            </div>
            <button className="btn btn-primary w-100 mt-2">Submit Request</button>
          </form>
        </div>
      )}

      {tab === 'list' && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex gap-2">
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search issues or assets..." 
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
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body p-0">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Asset</th>
                    <th>Issue</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Date Requested</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length > 0 ? paginated.map(item => (
                    <tr key={item.id}>
                      <td>{getAssetName(item.asset_id)}</td>
                      <td style={{ maxWidth: '200px' }} className="text-truncate" title={item.issue_description}>{item.issue_description}</td>
                      <td>{getPriorityBadge(item.priority)}</td>
                      <td>{getStatusBadge(item.status)}</td>
                      <td>{new Date(item.created_at).toLocaleDateString()}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => openDetails(item)}>Details & History</button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="text-center text-muted py-4">No maintenance requests found.</td>
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
        </>
      )}

      {selectedItem && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-light">
                <h5 className="modal-title">Maintenance Details</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedItem(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-4">
                  <div className="col-md-6">
                    <p><strong>Asset:</strong> {getAssetName(selectedItem.asset_id)}</p>
                    <p><strong>Status:</strong> {getStatusBadge(selectedItem.status)}</p>
                    <p><strong>Priority:</strong> {getPriorityBadge(selectedItem.priority)}</p>
                    <p><strong>Technician:</strong> {getTechName(selectedItem.assigned_technician_id)}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Issue:</strong><br/> {selectedItem.issue_description}</p>
                    {selectedItem.photo_url && (
                      <div><strong>Attached Photo:</strong><br/><a href={selectedItem.photo_url} target="_blank" rel="noreferrer" style={{wordBreak: 'break-all'}}>{selectedItem.photo_url}</a></div>
                    )}
                  </div>
                </div>

                <div className="card mb-4 bg-light border-0">
                  <div className="card-body">
                    <h6>Request Timeline</h6>
                    <ul className="list-unstyled mb-0" style={{ fontSize: '0.9rem' }}>
                      <li><strong>Requested:</strong> {formatDate(selectedItem.created_at)}</li>
                      {selectedItem.approved_at && <li><strong>Approved:</strong> {formatDate(selectedItem.approved_at)}</li>}
                      {selectedItem.rejected_at && <li><strong>Rejected:</strong> {formatDate(selectedItem.rejected_at)}</li>}
                      {selectedItem.started_at && <li><strong>Started:</strong> {formatDate(selectedItem.started_at)}</li>}
                      {selectedItem.completed_at && <li><strong>Completed:</strong> {formatDate(selectedItem.completed_at)}</li>}
                    </ul>
                  </div>
                </div>

                <div className="d-flex gap-2 flex-wrap mb-4">
                  {selectedItem.status === 'pending' && (
                    <>
                      <button className="btn btn-success" onClick={() => updateStatus(selectedItem.id, 'approved')}>Approve</button>
                      <button className="btn btn-danger" onClick={() => updateStatus(selectedItem.id, 'rejected')}>Reject</button>
                    </>
                  )}
                  {selectedItem.status === 'approved' && (
                    <div className="d-flex gap-2 align-items-center w-100 p-3 border rounded">
                      <select className="form-select w-auto" value={assignForm.technician_id} onChange={e => setAssignForm({ technician_id: e.target.value })}>
                        <option value="">-- Assign Technician --</option>
                        {technicians.map(t => <option key={t.id} value={t.id}>{t.name} ({t.specialty})</option>)}
                      </select>
                      <button 
                        className="btn btn-primary" 
                        disabled={!assignForm.technician_id}
                        onClick={() => updateStatus(selectedItem.id, 'in_progress', { assigned_technician_id: assignForm.technician_id })}
                      >
                        Assign & Start Work
                      </button>
                    </div>
                  )}
                  {selectedItem.status === 'in_progress' && (
                    <button className="btn btn-success" onClick={() => updateStatus(selectedItem.id, 'resolved')}>Mark as Resolved</button>
                  )}
                </div>

                <hr/>
                <h6>Asset History Log</h6>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {assetHistory.length > 0 ? (
                    <ul className="list-group list-group-flush">
                      {assetHistory.map(hist => (
                        <li key={hist.id} className="list-group-item px-0 py-2">
                          <small className="text-muted d-block">{formatDate(hist.created_at)}</small>
                          <strong>{hist.action}</strong>: {hist.details}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted small">No history available for this asset.</p>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
