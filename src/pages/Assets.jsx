import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Assets() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ name: '', asset_tag: '', serial_number: '', category_id: 1, department_id: 1, value: 0 })

  const load = async () => {
    const token = localStorage.getItem('token')
    const { data } = await axios.get('/assets', { headers: { Authorization: `Bearer ${token}` } })
    setItems(data)
  }

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    await axios.post('/assets', form, { headers: { Authorization: `Bearer ${token}` } })
    setForm({ name: '', asset_tag: '', serial_number: '', category_id: 1, department_id: 1, value: 0 })
    load()
  }

  return (
    <div>
      <h2 className="mb-4">Assets</h2>
      <div className="card p-3 mb-4">
        <form onSubmit={submit} className="row g-3">
          <div className="col-md-3"><input className="form-control" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="col-md-2"><input className="form-control" placeholder="Tag" value={form.asset_tag} onChange={e => setForm({ ...form, asset_tag: e.target.value })} /></div>
          <div className="col-md-2"><input className="form-control" placeholder="Serial" value={form.serial_number} onChange={e => setForm({ ...form, serial_number: e.target.value })} /></div>
          <div className="col-md-2"><input type="number" className="form-control" placeholder="Value" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} /></div>
          <div className="col-md-2"><button className="btn btn-primary w-100">Add</button></div>
        </form>
      </div>
      <div className="card">
        <div className="card-body">
          <table className="table table-hover">
            <thead><tr><th>Name</th><th>Tag</th><th>Status</th><th>Category</th><th>Department</th></tr></thead>
            <tbody>{items.map(item => <tr key={item.id}><td>{item.name}</td><td>{item.asset_tag}</td><td>{item.status}</td><td>{item.category}</td><td>{item.department}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
