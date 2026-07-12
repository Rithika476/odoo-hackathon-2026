import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Transfers() {
  const [items, setItems] = useState([])
  const [assets, setAssets] = useState([])
  const [departments, setDepartments] = useState([])
  const [form, setForm] = useState({ asset_id: '', from_department_id: '', to_department_id: '', reason: '' })
  const [error, setError] = useState('')
  const [tab, setTab] = useState('pending')

  const load = async () => {
    const token = localStorage.getItem('token')
    const [transferRes, assetRes, deptRes] = await Promise.all([
      axios.get('/transfers', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/assets', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/departments', { headers: { Authorization: `Bearer ${token}` } }),
    ])
    setItems(transferRes.data)
    setAssets(assetRes.data)
    setDepartments(deptRes.data)
  }

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const token = localStorage.getItem('token')
      await axios.post('/transfers', form, { headers: { Authorization: `Bearer ${token}` } })
      setForm({ asset_id: '', from_department_id: '', to_department_id: '', reason: '' })
      load()
      setTab('pending')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit transfer request.')
    }
  }

  const approve = async (id) => {
    setError('')
    try {
      const token = localStorage.getItem('token')
      await axios.post(`/transfers/${id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } })
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve transfer.')
    }
  }

  const reject = async (id) => {
    setError('')
    try {
      const token = localStorage.getItem('token')
      await axios.post(`/transfers/${id}/reject`, {}, { headers: { Authorization: `Bearer ${token}` } })
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject transfer.')
    }
  }

  const getAssetName = (assetId) => {
    const asset = assets.find(a => a.id === assetId)
    return asset ? `${asset.name} (${asset.asset_tag})` : `Asset #${assetId}`
  }

  const getDepartmentName = (deptId) => {
    const dept = departments.find(d => d.id === deptId)
    return dept ? dept.name : `Dept #${deptId}`
  }

  const filteredItems = items.filter(item => tab === 'pending' ? item.status === 'pending' : item.status !== 'pending')

  return (
    <div>
      <h2 className="mb-4">Transfer Requests</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card p-3 mb-4 shadow-sm border-0">
        <form onSubmit={submit} className="row g-3">
          <div className="col-md-3">
            <select className="form-select" value={form.asset_id} onChange={e => setForm({ ...form, asset_id: e.target.value })} required>
              <option value="">Select Asset</option>
              {assets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <select className="form-select" value={form.from_department_id} onChange={e => setForm({ ...form, from_department_id: e.target.value })} required>
              <option value="">From Department</option>
              {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <select className="form-select" value={form.to_department_id} onChange={e => setForm({ ...form, to_department_id: e.target.value })} required>
              <option value="">To Department</option>
              {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <button className="btn btn-primary w-100">Submit Transfer</button>
          </div>
          <div className="col-12">
            <textarea className="form-control" rows="2" placeholder="Reason for transfer (optional)" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
          </div>
        </form>
      </div>

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>Pending Requests</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>Transfer History</button>
        </li>
      </ul>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Asset</th>
                <th>From</th>
                <th>To</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? filteredItems.map(item => (
                <tr key={item.id}>
                  <td>{getAssetName(item.asset_id)}</td>
                  <td>{getDepartmentName(item.from_department_id)}</td>
                  <td>{getDepartmentName(item.to_department_id)}</td>
                  <td>{item.reason || '—'}</td>
                  <td>
                    <span className={`badge ${item.status === 'pending' ? 'bg-warning text-dark' : item.status === 'approved' ? 'bg-success' : 'bg-danger'}`}>
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {item.status === 'pending' ? (
                      <>
                        <button className="btn btn-sm btn-outline-success me-1" onClick={() => approve(item.id)}>Approve</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => reject(item.id)}>Reject</button>
                      </>
                    ) : '—'}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">No transfer requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
