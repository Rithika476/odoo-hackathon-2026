import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Audit() {
  const [items, setItems] = useState([])
  const [departments, setDepartments] = useState([])
  const [form, setForm] = useState({ title: '', department_id: '', scheduled_date: '' })

  const load = async () => {
    const token = localStorage.getItem('token')
    const [auditRes, deptRes] = await Promise.all([
      axios.get('/audits', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/departments', { headers: { Authorization: `Bearer ${token}` } }),
    ])
    setItems(auditRes.data)
    setDepartments(deptRes.data)
  }

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    await axios.post('/audits', form, { headers: { Authorization: `Bearer ${token}` } })
    setForm({ title: '', department_id: '', scheduled_date: '' })
    load()
  }

  const getDepartmentName = (deptId) => {
    const dept = departments.find(d => d.id === deptId)
    return dept ? dept.name : `Dept #${deptId}`
  }

  return (
    <div>
      <h2 className="mb-4">Asset Audit</h2>
      <div className="card p-3 mb-4">
        <form onSubmit={submit} className="row g-3">
          <div className="col-md-5"><input className="form-control" placeholder="Audit Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
          <div className="col-md-3">
            <select className="form-select" value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}>
              <option value="">Select Department</option>
              {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
            </select>
          </div>
          <div className="col-md-2"><input className="form-control" type="date" value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })} /></div>
          <div className="col-md-2"><button className="btn btn-primary w-100">Schedule</button></div>
        </form>
      </div>
      <div className="card">
        <div className="card-body">
          <table className="table table-hover">
            <thead><tr><th>Title</th><th>Department</th><th>Scheduled</th><th>Status</th></tr></thead>
            <tbody>{items.map(item => <tr key={item.id}><td>{item.title}</td><td>{getDepartmentName(item.department_id)}</td><td>{item.scheduled_date ? item.scheduled_date.split('T')[0] : '—'}</td><td>{item.status}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
