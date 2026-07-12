import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Allocations() {
  const [items, setItems] = useState([])
  const [users, setUsers] = useState([])
  const [assets, setAssets] = useState([])
  const [form, setForm] = useState({ asset_id: '', assigned_to_user_id: '', expected_return_date: '' })
  const [error, setError] = useState('')
  const [tab, setTab] = useState('active')

  const load = async () => {
    const token = localStorage.getItem('token')
    const [allocRes, userRes, assetRes] = await Promise.all([
      axios.get('/allocations', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/users', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/assets', { headers: { Authorization: `Bearer ${token}` } }),
    ])
    setItems(allocRes.data)
    setUsers(userRes.data)
    setAssets(assetRes.data)
  }

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const token = localStorage.getItem('token')
      await axios.post('/allocations', form, { headers: { Authorization: `Bearer ${token}` } })
      setForm({ asset_id: '', assigned_to_user_id: '', expected_return_date: '' })
      load()
      setTab('active')
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during allocation.')
    }
  }

  const getAssetName = (assetId) => {
    const asset = assets.find(a => a.id === assetId)
    return asset ? `${asset.name} (${asset.asset_tag})` : `Asset #${assetId}`
  }

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId)
    return user ? user.full_name : `User #${userId}`
  }

  const returnAsset = async (id) => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(`/allocations/${id}/return`, {}, { headers: { Authorization: `Bearer ${token}` } })
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to return asset.')
    }
  }

  const filteredItems = items.filter(item => tab === 'active' ? item.status === 'assigned' : item.status === 'returned')
  const today = new Date().toISOString().split('T')[0]

  return (
    <div>
      <h2 className="mb-4">Asset Allocation & Transfer</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card p-3 mb-4 shadow-sm border-0">
        <form onSubmit={submit} className="row g-3">
          <div className="col-md-4">
            <select className="form-select" value={form.asset_id} onChange={e => setForm({ ...form, asset_id: e.target.value })} required>
              <option value="">Select Asset</option>
              {assets.filter(a => a.status === 'available').map(asset => <option key={asset.id} value={asset.id}>{asset.name} ({asset.asset_tag})</option>)}
            </select>
          </div>
          <div className="col-md-4">
            <select className="form-select" value={form.assigned_to_user_id} onChange={e => setForm({ ...form, assigned_to_user_id: e.target.value })} required>
              <option value="">Assign To</option>
              {users.map(user => <option key={user.id} value={user.id}>{user.full_name}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <input className="form-control" type="date" value={form.expected_return_date} onChange={e => setForm({ ...form, expected_return_date: e.target.value })} />
          </div>
          <div className="col-md-2">
            <button className="btn btn-primary w-100">Allocate</button>
          </div>
        </form>
      </div>

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>Active Allocations</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>Allocation History</button>
        </li>
      </ul>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Asset</th>
                <th>Assigned To</th>
                <th>Status</th>
                <th>Expected Return</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? filteredItems.map(item => {
                const dateOnly = item.expected_return_date ? item.expected_return_date.split('T')[0] : null
                const isOverdue = tab === 'active' && dateOnly && dateOnly < today

                return (
                  <tr key={item.id}>
                    <td>{getAssetName(item.asset_id)}</td>
                    <td>{getUserName(item.assigned_to_user_id)}</td>
                    <td>
                      <span className={`badge ${item.status === 'assigned' ? 'bg-success' : 'bg-secondary'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      {dateOnly || '—'}
                      {isOverdue && <span className="badge bg-danger ms-2">Overdue</span>}
                    </td>
                    <td>
                      {item.status === 'assigned' ? (
                        <button className="btn btn-sm btn-outline-success" onClick={() => returnAsset(item.id)}>Return Asset</button>
                      ) : '—'}
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-4">No allocations found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
