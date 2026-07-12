import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Maintenance() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ asset_id: 1, issue_description: '', priority: 'medium' })

  const load = async () => {
    const token = localStorage.getItem('token')
    const { data } = await axios.get('/maintenance', { headers: { Authorization: `Bearer ${token}` } })
    setItems(data)
  }

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    await axios.post('/maintenance', form, { headers: { Authorization: `Bearer ${token}` } })
    setForm({ asset_id: 1, issue_description: '', priority: 'medium' })
    load()
  }

  return (
    <div>
      <h2 className="mb-4">Maintenance Requests</h2>
      <div className="card p-3 mb-4">
        <form onSubmit={submit} className="row g-3">
          <div className="col-md-4"><input className="form-control" placeholder="Asset ID" value={form.asset_id} onChange={e => setForm({ ...form, asset_id: e.target.value })} /></div>
          <div className="col-md-4"><input className="form-control" placeholder="Issue" value={form.issue_description} onChange={e => setForm({ ...form, issue_description: e.target.value })} /></div>
          <div className="col-md-2"><select className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}><option>low</option><option>medium</option><option>high</option></select></div>
          <div className="col-md-2"><button className="btn btn-primary w-100">Submit</button></div>
        </form>
      </div>
      <div className="card">
        <div className="card-body">
          <table className="table table-hover">
            <thead><tr><th>ID</th><th>Issue</th><th>Priority</th><th>Status</th></tr></thead>
            <tbody>{items.map(item => <tr key={item.id}><td>{item.id}</td><td>{item.issue_description}</td><td>{item.priority}</td><td>{item.status}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
