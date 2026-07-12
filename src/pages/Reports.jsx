import { useEffect, useState } from 'react'
import axios from 'axios'
import { FileText, Download, Package, Wrench, User } from 'lucide-react'
import LoadingSkeleton from '../components/LoadingSkeleton'

export default function Reports({ darkMode }) {
  const [data, setData] = useState({ asset_status_counts: [], maintenance_counts: [], latest_allocations: [] })
  const [assets, setAssets] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('token')
        const reportsRes = await axios.get('/reports', { headers: { Authorization: `Bearer ${token}` } })
        setData(reportsRes.data)
        
        const [assetRes, userRes] = await Promise.all([
          axios.get('/assets', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/users', { headers: { Authorization: `Bearer ${token}` } }),
        ])
        setAssets(assetRes.data)
        setUsers(userRes.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const getAssetName = (assetId) => {
    const asset = assets.find(a => a.id === assetId)
    return asset ? asset.name : `Asset #${assetId}`
  }

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId)
    return user ? user.full_name : `User #${userId}`
  }

  const exportToCSV = (data, filename) => {
    const headers = Object.keys(data[0] || {})
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }

  const exportAssetStatusReport = () => {
    exportToCSV(data.asset_status_counts, 'asset_status_report.csv')
  }

  const exportMaintenanceReport = () => {
    exportToCSV(data.maintenance_counts, 'maintenance_report.csv')
  }

  const exportAllocationsReport = () => {
    const allocationsData = data.latest_allocations.map(item => ({
      asset: getAssetName(item.asset_id),
      assigned_to: getUserName(item.assigned_to_user_id),
      status: item.status
    }))
    exportToCSV(allocationsData, 'allocations_report.csv')
  }

  if (loading) {
    return (
      <div className="row g-3">
        <div className="col-md-6"><LoadingSkeleton type="card" /></div>
        <div className="col-md-6"><LoadingSkeleton type="card" /></div>
        <div className="col-12"><LoadingSkeleton type="card" /></div>
      </div>
    )
  }

  return (
    <div>
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className={`card shadow-sm border-0 ${darkMode ? 'bg-secondary text-white' : ''}`}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0 d-flex align-items-center gap-2">
                  <Package size={20} />
                  Asset Status
                </h5>
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={exportAssetStatusReport}
                  title="Export to CSV"
                >
                  <Download size={16} />
                </button>
              </div>
              <ul className="list-group list-group-flush">
                {data.asset_status_counts.map((item, index) => (
                  <li key={index} className={`list-group-item d-flex justify-content-between align-items-center ${darkMode ? 'bg-secondary text-white border-secondary' : ''}`}>
                    <span className="fw-semibold">{item.status}</span>
                    <span className={`badge ${darkMode ? 'bg-primary' : 'bg-primary'}`}>{item.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className={`card shadow-sm border-0 ${darkMode ? 'bg-secondary text-white' : ''}`}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0 d-flex align-items-center gap-2">
                  <Wrench size={20} />
                  Maintenance Status
                </h5>
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={exportMaintenanceReport}
                  title="Export to CSV"
                >
                  <Download size={16} />
                </button>
              </div>
              <ul className="list-group list-group-flush">
                {data.maintenance_counts.map((item, index) => (
                  <li key={index} className={`list-group-item d-flex justify-content-between align-items-center ${darkMode ? 'bg-secondary text-white border-secondary' : ''}`}>
                    <span className="fw-semibold">{item.status}</span>
                    <span className={`badge ${darkMode ? 'bg-primary' : 'bg-primary'}`}>{item.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div className={`card shadow-sm border-0 ${darkMode ? 'bg-secondary text-white' : ''}`}>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0 d-flex align-items-center gap-2">
              <User size={20} />
              Latest Allocations
            </h5>
            <button 
              className="btn btn-sm btn-outline-primary"
              onClick={exportAllocationsReport}
              title="Export to CSV"
            >
              <Download size={16} />
            </button>
          </div>
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className={darkMode ? 'table-dark' : 'table-light'}>
                <tr>
                  <th>Asset</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.latest_allocations.map((item, index) => (
                  <tr key={index}>
                    <td className="fw-semibold">{getAssetName(item.asset_id)}</td>
                    <td>{getUserName(item.assigned_to_user_id)}</td>
                    <td>
                      <span className={`badge ${item.status === 'assigned' ? 'bg-success' : 'bg-secondary'}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
