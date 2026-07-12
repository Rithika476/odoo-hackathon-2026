import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Bookings() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ resource_type: 'Meeting Room', resource_name: '', start_time: '', end_time: '', purpose: '' })

  const load = async () => {
    const token = localStorage.getItem('token')
    const { data } = await axios.get('/bookings', { headers: { Authorization: `Bearer ${token}` } })
    setItems(data)
  }

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    await axios.post('/bookings', form, { headers: { Authorization: `Bearer ${token}` } })
    setForm({ resource_type: 'Meeting Room', resource_name: '', start_time: '', end_time: '', purpose: '' })
    load()
  }

  return (
    <div>
      <h2 className="mb-4">Bookings</h2>
      <div className="card p-3 mb-4">
        <form onSubmit={submit} className="row g-3">
          <div className="col-md-3"><input className="form-control" placeholder="Resource Type" value={form.resource_type} onChange={e => setForm({ ...form, resource_type: e.target.value })} /></div>
          <div className="col-md-3"><input className="form-control" placeholder="Resource Name" value={form.resource_name} onChange={e => setForm({ ...form, resource_name: e.target.value })} /></div>
          <div className="col-md-2"><input className="form-control" type="datetime-local" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} /></div>
          <div className="col-md-2"><input className="form-control" type="datetime-local" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} /></div>
          <div className="col-md-2"><button className="btn btn-primary w-100">Book</button></div>
        </form>
      </div>
      <div className="card">
        <div className="card-body">
          <table className="table table-hover">
            <thead><tr><th>Resource</th><th>Purpose</th><th>Status</th></tr></thead>
            <tbody>{items.map(item => <tr key={item.id}><td>{item.resource_name}</td><td>{item.purpose}</td><td>{item.status}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
