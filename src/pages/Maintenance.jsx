import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Maintenance() {
  const [items, setItems] = useState([])
  const [assets, setAssets] = useState([])
  const [form, setForm] = useState({ asset_id: '', issue_description: '', priority: 'medium' })

  const load = async () => {
    const token = localStorage.getItem('token')
    const [maintenanceRes, assetRes] = await Promise.all([
      axios.get('/maintenance', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/assets', { headers: { Authorization: `Bearer ${token}` } }),
    ])
    setItems(maintenanceRes.data)
    setAssets(assetRes.data)
  }

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    await axios.post('/maintenance', form, { headers: { Authorization: `Bearer ${token}` } })
    setForm({ asset_id: '', issue_description: '', priority: 'medium' })
    load()
  }

  const updateStatus = async (id, status) => {
    const token = localStorage.getItem('token')
    await axios.patch(`/maintenance/${id}`, { status }, { headers: { Authorization: `Bearer ${token}` } })
    load()
  }

  const getAssetName = (assetId) => {
    const asset = assets.find(a => a.id === assetId)
    return asset ? asset.name : `Asset #${assetId}`
  }

  const getStatusBadge = (status) => {
    const colors = {
      'pending': 'warning',
      'approved': 'info',
      'rejected': 'danger',
      'in_progress': 'primary',
      'resolved': 'success'
    }
    return <span className={`badge bg-${colors[status] || 'secondary'}`}>{status.replace('_', ' ')}</span>
  }

  const getNextActions = (item) => {
    switch (item.status) {
      case 'pending':
        return (
          <>
            <button className="btn btn-sm btn-info me-1" onClick={() => updateStatus(item.id, 'approved')}>Approve</button>
            <button className="btn btn-sm btn-danger" onClick={() => updateStatus(item.id, 'rejected')}>Reject</button>
          </>
        )
      case 'approved':
        return <button className="btn btn-sm btn-primary" onClick={() => updateStatus(item.id, 'in_progress')}>Start Work</button>
      case 'in_progress':
        return <button className="btn btn-sm btn-success" onClick={() => updateStatus(item.id, 'resolved')}>Resolve</button>
      default:
        return '—'
    }
  }

  return (
    <div>
      <h2 className="mb-4">Maintenance Requests</h2>
      <div className="card p-3 mb-4">
        <form onSubmit={submit} className="row g-3">
          <div className="col-md-4">
            <select className="form-select" value={form.asset_id} onChange={e => setForm({ ...form, asset_id: e.target.value })}>
              <option value="">Select Asset</option>
              {assets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
            </select>
          </div>
          <div className="col-md-4"><input className="form-control" placeholder="Issue Description" value={form.issue_description} onChange={e => setForm({ ...form, issue_description: e.target.value })} /></div>
          <div className="col-md-2">
            <select className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="col-md-2"><button className="btn btn-primary w-100">Submit</button></div>
        </form>
      </div>
      <div className="card">
        <div className="card-body">
          <table className="table table-hover">
            <thead><tr><th>Asset</th><th>Issue</th><th>Priority</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>{items.map(item => <tr key={item.id}><td>{getAssetName(item.asset_id)}</td><td>{item.issue_description}</td><td><span className={`badge bg-${item.priority === 'high' ? 'danger' : item.priority === 'medium' ? 'warning' : 'secondary'}`}>{item.priority}</span></td><td>{getStatusBadge(item.status)}</td><td>{getNextActions(item)}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
