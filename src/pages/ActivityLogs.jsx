import { useEffect, useState } from 'react'
import axios from 'axios'
import { Activity, Search } from 'lucide-react'
import LoadingSkeleton from '../components/LoadingSkeleton'

export default function ActivityLogs({ darkMode }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('token')
        const res = await axios.get('/activity', { headers: { Authorization: `Bearer ${token}` } })
        setItems(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = items.filter(item => 
    item.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.details && item.details.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div>
      <div className={`card shadow-sm border-0 mb-4 ${darkMode ? 'bg-secondary text-white' : ''}`}>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0 d-flex align-items-center gap-2">
              <Activity size={20} />
              Activity Logs
            </h5>
            <div className="position-relative" style={{ maxWidth: '300px' }}>
              <Search size={18} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
              <input 
                type="text" 
                className={`form-control ps-5 ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
                placeholder="Search activities..." 
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          {loading ? (
            <LoadingSkeleton type="table" rows={5} />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className={darkMode ? 'table-dark' : 'table-light'}>
                  <tr>
                    <th>Action</th>
                    <th>Details</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length > 0 ? paginated.map((item, index) => (
                    <tr key={index}>
                      <td className="fw-semibold">{item.action}</td>
                      <td className="text-muted">{item.details || '—'}</td>
                      <td className="text-muted small">{new Date(item.created_at).toLocaleString()}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="3" className="text-center text-muted py-4">
                        <Activity size={48} className="mb-2 text-muted" />
                        <p className="mb-0">No activity logs found matching your search.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-3">
              <ul className="pagination mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(prev => prev - 1)}>Previous</button>
                </li>
                {[...Array(totalPages)].map((_, i) => (
                  <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(prev => prev + 1)}>Next</button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
