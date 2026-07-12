import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Reports() {
  const [data, setData] = useState({ asset_status_counts: [], maintenance_counts: [], latest_allocations: [] })
  const [assets, setAssets] = useState([])
  const [users, setUsers] = useState([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    axios.get('/reports', { headers: { Authorization: `Bearer ${token}` } }).then(res => setData(res.data))
    Promise.all([
      axios.get('/assets', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/users', { headers: { Authorization: `Bearer ${token}` } }),
    ]).then(([assetRes, userRes]) => {
      setAssets(assetRes.data)
      setUsers(userRes.data)
    })
  }, [])

  const getAssetName = (assetId) => {
    const asset = assets.find(a => a.id === assetId)
    return asset ? asset.name : `Asset #${assetId}`
  }

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId)
    return user ? user.full_name : `User #${userId}`
  }

  return (
    <div>
      <h2 className="mb-4">Reports & Analytics</h2>
      <div className="row g-3">
        <div className="col-md-6">
          <div className="card p-3">
            <h5>Asset Status</h5>
            <ul className="list-group list-group-flush">
              {data.asset_status_counts.map(item => <li key={item.status} className="list-group-item d-flex justify-content-between"><span>{item.status}</span><strong>{item.count}</strong></li>)}
            </ul>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card p-3">
            <h5>Maintenance Status</h5>
            <ul className="list-group list-group-flush">
              {data.maintenance_counts.map(item => <li key={item.status} className="list-group-item d-flex justify-content-between"><span>{item.status}</span><strong>{item.count}</strong></li>)}
            </ul>
          </div>
        </div>
      </div>
      <div className="card p-3 mt-4">
        <h5>Latest Allocations</h5>
        <table className="table table-hover">
          <thead><tr><th>Asset</th><th>Assigned To</th><th>Status</th></tr></thead>
          <tbody>{data.latest_allocations.map((item, index) => <tr key={index}><td>{getAssetName(item.asset_id)}</td><td>{getUserName(item.assigned_to_user_id)}</td><td>{item.status}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  )
}
