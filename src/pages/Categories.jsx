import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Categories() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ name: '', code: '', description: '' })

  const load = async () => {
    const token = localStorage.getItem('token')
    const { data } = await axios.get('/categories', { headers: { Authorization: `Bearer ${token}` } })
    setItems(data)
  }

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    await axios.post('/categories', form, { headers: { Authorization: `Bearer ${token}` } })
    setForm({ name: '', code: '', description: '' })
    load()
  }

  return (
    <div>
      <h2 className="mb-4">Asset Categories</h2>
      <div className="card p-3 mb-4">
        <form onSubmit={submit} className="row g-3">
          <div className="col-md-4"><input className="form-control" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="col-md-3"><input className="form-control" placeholder="Code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
          <div className="col-md-3"><input className="form-control" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="col-md-2"><button className="btn btn-primary w-100">Add</button></div>
        </form>
      </div>
      <div className="card">
        <div className="card-body">
          <table className="table table-hover">
            <thead><tr><th>Name</th><th>Code</th><th>Description</th></tr></thead>
            <tbody>{items.map(item => <tr key={item.id}><td>{item.name}</td><td>{item.code}</td><td>{item.description}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
