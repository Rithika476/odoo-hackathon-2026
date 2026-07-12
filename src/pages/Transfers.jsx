import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Transfers() {
  const [items, setItems] = useState([])
  const [assets, setAssets] = useState([])
  const [departments, setDepartments] = useState([])
  const [form, setForm] = useState({ asset_id: '', from_department_id: '', to_department_id: '', reason: '' })

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
    const token = localStorage.getItem('token')
    await axios.post('/transfers', form, { headers: { Authorization: `Bearer ${token}` } })
    setForm({ asset_id: '', from_department_id: '', to_department_id: '', reason: '' })
    load()
  }

  const approve = async (id) => {
    const token = localStorage.getItem('token')
    await axios.post(`/transfers/${id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } })
    load()
  }

  const getAssetName = (assetId) => {
    const asset = assets.find(a => a.id === assetId)
    return asset ? asset.name : `Asset #${assetId}`
  }

  const getDepartmentName = (deptId) => {
    const dept = departments.find(d => d.id === deptId)
    return dept ? dept.name : `Dept #${deptId}`
  }

  return (
    <div>
      <h2 className="mb-4">Transfer Requests</h2>
      <div className="card p-3 mb-4">
        <form onSubmit={submit} className="row g-3">
          <div className="col-md-3">
            <select className="form-select" value={form.asset_id} onChange={e => setForm({ ...form, asset_id: e.target.value })}>
              <option value="">Select Asset</option>
              {assets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <select className="form-select" value={form.from_department_id} onChange={e => setForm({ ...form, from_department_id: e.target.value })}>
              <option value="">From Department</option>
              {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <select className="form-select" value={form.to_department_id} onChange={e => setForm({ ...form, to_department_id: e.target.value })}>
              <option value="">To Department</option>
              {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <button className="btn btn-primary w-100">Submit Transfer</button>
          </div>
          <div className="col-12">
            <textarea className="form-control" rows="2" placeholder="Reason for transfer" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
          </div>
        </form>
      </div>
      <div className="card">
        <div className="card-body">
          <table className="table table-hover">
            <thead><tr><th>Asset</th><th>From</th><th>To</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>{items.map(item => <tr key={item.id}><td>{getAssetName(item.asset_id)}</td><td>{getDepartmentName(item.from_department_id)}</td><td>{getDepartmentName(item.to_department_id)}</td><td>{item.status}</td><td>{item.status === 'pending' ? <button className="btn btn-sm btn-success" onClick={() => approve(item.id)}>Approve</button> : '—'}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
