import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Dashboard({ user }) {
  const [data, setData] = useState({ counts: {}, recent_activity: [] })

  useEffect(() => {
    const token = localStorage.getItem('token')
    axios.get('/dashboard', { headers: { Authorization: `Bearer ${token}` } }).then(res => setData(res.data))
  }, [])

  return (
    <div>
      <h2 className="mb-4">Welcome, {user?.full_name || 'User'}</h2>
      <div className="row g-3 mb-4">
        <div className="col-md-3"><div className="card p-3"><h6>Assets</h6><h3>{data.counts.assets || 0}</h3></div></div>
        <div className="col-md-3"><div className="card p-3"><h6>Departments</h6><h3>{data.counts.departments || 0}</h3></div></div>
        <div className="col-md-3"><div className="card p-3"><h6>Employees</h6><h3>{data.counts.employees || 0}</h3></div></div>
        <div className="col-md-3"><div className="card p-3"><h6>Maintenance</h6><h3>{data.counts.maintenance || 0}</h3></div></div>
      </div>
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Recent Activity</h5>
          <ul className="list-group list-group-flush">
            {data.recent_activity.map((item, index) => (
              <li key={index} className="list-group-item d-flex justify-content-between align-items-start">
                <div>
                  <strong>{item.action}</strong>
                  <div>{item.details}</div>
                </div>
                <small className="text-muted">{item.created_at}</small>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
