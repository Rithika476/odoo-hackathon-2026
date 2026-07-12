import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Employees() {
  const [items, setItems] = useState([])
  const [departments, setDepartments] = useState([])
  const [form, setForm] = useState({ email: '', full_name: '', job_title: '', department_id: '', phone: '', location: '', status: 'active' })

  const load = async () => {
    const token = localStorage.getItem('token')
    const [empRes, deptRes] = await Promise.all([
      axios.get('/employees', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/departments', { headers: { Authorization: `Bearer ${token}` } }),
    ])
    setItems(empRes.data)
    setDepartments(deptRes.data)
  }

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    await axios.post('/employees', form, { headers: { Authorization: `Bearer ${token}` } })
    setForm({ email: '', full_name: '', job_title: '', department_id: '', phone: '', location: '', status: 'active' })
    load()
  }

  return (
    <div>
      <h2 className="mb-4">Employee Directory</h2>
      <div className="card p-3 mb-4">
        <form onSubmit={submit} className="row g-3">
          <div className="col-md-3"><input className="form-control" placeholder="Full Name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
          <div className="col-md-3"><input className="form-control" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div className="col-md-2"><input className="form-control" placeholder="Job Title" value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })} /></div>
          <div className="col-md-2">
            <select className="form-select" value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}>
              <option value="">Department</option>
              {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
            </select>
          </div>
          <div className="col-md-2"><button className="btn btn-primary w-100">Add</button></div>
          <div className="col-md-3"><input className="form-control" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="col-md-3"><input className="form-control" placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
          <div className="col-md-2">
            <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </form>
      </div>
      <div className="card">
        <div className="card-body">
          <table className="table table-hover">
            <thead><tr><th>Name</th><th>Job Title</th><th>Department</th><th>Status</th><th>Phone</th><th>Location</th></tr></thead>
            <tbody>{items.map(item => <tr key={item.id}><td>{item.full_name}</td><td>{item.job_title}</td><td>{item.department}</td><td>{item.status}</td><td>{item.phone || '—'}</td><td>{item.location || '—'}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
