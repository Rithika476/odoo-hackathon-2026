import { useEffect, useState } from 'react'
import axios from 'axios'

export default function ActivityLogs() {
  const [items, setItems] = useState([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    axios.get('/activity', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setItems(res.data))
  }, [])

  return (
    <div>
      <h2 className="mb-4">Activity Logs</h2>
      <div className="card">
        <div className="card-body">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Action</th>
                <th>Details</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td>{item.action}</td>
                  <td>{item.details}</td>
                  <td>{item.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
