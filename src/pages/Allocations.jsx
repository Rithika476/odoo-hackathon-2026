import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Allocations() {
  const [items, setItems] = useState([])
  const [users, setUsers] = useState([])
  const [assets, setAssets] = useState([])
  const [form, setForm] = useState({ asset_id: '', assigned_to_user_id: '', expected_return_date: '' })

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
    const token = localStorage.getItem('token')
    await axios.post('/allocations', form, { headers: { Authorization: `Bearer ${token}` } })
    setForm({ asset_id: '', assigned_to_user_id: '', expected_return_date: '' })
    load()
  }

  const getAssetName = (assetId) => {
    const asset = assets.find(a => a.id === assetId)
    return asset ? asset.name : `Asset #${assetId}`
  }

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId)
    return user ? user.full_name : `User #${userId}`
  }

  const returnAsset = async (id) => {
    const token = localStorage.getItem('token')
    await axios.post(`/allocations/${id}/return`, {}, { headers: { Authorization: `Bearer ${token}` } })
    load()
  }

  return (
    <div>
      <h2 className="mb-4">Asset Allocation & Transfer</h2>
      <div className="card p-3 mb-4">
        <form onSubmit={submit} className="row g-3">
          <div className="col-md-4">
            <select className="form-select" value={form.asset_id} onChange={e => setForm({ ...form, asset_id: e.target.value })}>
              <option value="">Select Asset</option>
              {assets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
            </select>
          </div>
          <div className="col-md-4">
            <select className="form-select" value={form.assigned_to_user_id} onChange={e => setForm({ ...form, assigned_to_user_id: e.target.value })}>
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
      <div className="card">
        <div className="card-body">
          <table className="table table-hover">
            <thead><tr><th>Asset</th><th>Assigned To</th><th>Status</th><th>Expected Return</th><th>Action</th></tr></thead>
            <tbody>{items.map(item => <tr key={item.id}><td>{getAssetName(item.asset_id)}</td><td>{getUserName(item.assigned_to_user_id)}</td><td>{item.status}</td><td>{item.expected_return_date ? item.expected_return_date.split('T')[0] : '—'}</td><td>{item.status === 'assigned' ? <button className="btn btn-sm btn-success" onClick={() => returnAsset(item.id)}>Return</button> : '—'}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
