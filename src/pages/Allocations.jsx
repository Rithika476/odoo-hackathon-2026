import { useEffect, useState } from 'react'
import axios from 'axios'
import { ArrowRightLeft, Plus, RotateCcw } from 'lucide-react'
import Toast from '../components/Toast'
import ConfirmationDialog from '../components/ConfirmationDialog'
import LoadingSkeleton from '../components/LoadingSkeleton'

export default function Allocations({ darkMode }) {
  const [items, setItems] = useState([])
  const [users, setUsers] = useState([])
  const [assets, setAssets] = useState([])
  const [form, setForm] = useState({ asset_id: '', assigned_to_user_id: '', expected_return_date: '' })
  const [error, setError] = useState('')
  const [tab, setTab] = useState('active')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')
  const [showReturnDialog, setShowReturnDialog] = useState(false)
  const [returnTarget, setReturnTarget] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const [allocRes, userRes, assetRes] = await Promise.all([
        axios.get('/allocations', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/users', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/assets', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      setItems(allocRes.data)
      setUsers(userRes.data)
      setAssets(assetRes.data)
    } catch (err) {
      showToastMessage('Failed to load allocations', 'danger')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      await axios.post('/allocations', form, { headers: { Authorization: `Bearer ${token}` } })
      setForm({ asset_id: '', assigned_to_user_id: '', expected_return_date: '' })
      showToastMessage('Asset allocated successfully', 'success')
      load()
      setTab('active')
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during allocation.')
    } finally {
      setSubmitting(false)
    }
  }

  const getAssetName = (assetId) => {
    const asset = assets.find(a => a.id === assetId)
    return asset ? `${asset.name} (${asset.asset_tag})` : `Asset #${assetId}`
  }

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId)
    return user ? user.full_name : `User #${userId}`
  }

  const showToastMessage = (message, type) => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
  }

  const confirmReturn = (item) => {
    setReturnTarget(item)
    setShowReturnDialog(true)
  }

  const returnAsset = async () => {
    if (!returnTarget) return
    try {
      const token = localStorage.getItem('token')
      await axios.post(`/allocations/${returnTarget.id}/return`, {}, { headers: { Authorization: `Bearer ${token}` } })
      setShowReturnDialog(false)
      setReturnTarget(null)
      showToastMessage('Asset returned successfully', 'success')
      load()
    } catch (err) {
      showToastMessage(err.response?.data?.error || 'Failed to return asset.', 'danger')
    }
  }

  const filteredItems = items.filter(item => tab === 'active' ? item.status === 'assigned' : item.status === 'returned')
  const today = new Date().toISOString().split('T')[0]

  return (
    <div>
      {showToast && (
        <Toast 
          message={toastMessage} 
          type={toastType} 
          onClose={() => setShowToast(false)} 
        />
      )}

      {showReturnDialog && (
        <ConfirmationDialog
          show={showReturnDialog}
          title="Return Asset"
          message={`Are you sure you want to return ${getAssetName(returnTarget?.asset_id)}?`}
          onConfirm={returnAsset}
          onCancel={() => {
            setShowReturnDialog(false)
            setReturnTarget(null)
          }}
          confirmText="Return Asset"
          variant="success"
        />
      )}

      <h3 className="fw-bold mb-4 d-flex align-items-center gap-2">
        <ArrowRightLeft size={28} />
        Asset Allocation & Transfer
      </h3>
      
      {error && <div className="alert alert-danger">{error}</div>}

      <div className={`card p-4 mb-4 shadow-sm border-0 ${darkMode ? 'bg-secondary text-white' : ''}`}>
        <h5 className="card-title mb-3 d-flex align-items-center gap-2">
          <Plus size={20} />
          Allocate Asset
        </h5>
        <form onSubmit={submit} className="row g-3">
          <div className="col-md-4">
            <select className={`form-select ${darkMode ? 'bg-dark text-white border-secondary' : ''}`} value={form.asset_id} onChange={e => setForm({ ...form, asset_id: e.target.value })} required>
              <option value="">Select Asset</option>
              {assets.filter(a => a.status === 'available').map(asset => <option key={asset.id} value={asset.id}>{asset.name} ({asset.asset_tag})</option>)}
            </select>
          </div>
          <div className="col-md-4">
            <select className={`form-select ${darkMode ? 'bg-dark text-white border-secondary' : ''}`} value={form.assigned_to_user_id} onChange={e => setForm({ ...form, assigned_to_user_id: e.target.value })} required>
              <option value="">Assign To</option>
              {users.map(user => <option key={user.id} value={user.id}>{user.full_name}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <input className={`form-control ${darkMode ? 'bg-dark text-white border-secondary' : ''}`} type="date" value={form.expected_return_date} onChange={e => setForm({ ...form, expected_return_date: e.target.value })} />
          </div>
          <div className="col-md-2">
            <button className="btn btn-primary w-100" disabled={submitting}>
              {submitting ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : 'Allocate'}
            </button>
          </div>
        </form>
      </div>

      <ul className={`nav nav-tabs mb-3 ${darkMode ? 'border-secondary' : ''}`}>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'active' ? 'active' : ''} ${darkMode ? 'text-white' : ''}`} onClick={() => setTab('active')}>Active Allocations</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'history' ? 'active' : ''} ${darkMode ? 'text-white' : ''}`} onClick={() => setTab('history')}>Allocation History</button>
        </li>
      </ul>

      {loading ? (
        <LoadingSkeleton type="table" rows={5} />
      ) : (
        <div className={`card shadow-sm border-0 ${darkMode ? 'bg-secondary text-white' : ''}`}>
          <div className="card-body p-0">
            <table className="table table-hover mb-0">
              <thead className={darkMode ? 'table-dark' : 'table-light'}>
                <tr>
                  <th>Asset</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Expected Return</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length > 0 ? filteredItems.map(item => {
                  const dateOnly = item.expected_return_date ? item.expected_return_date.split('T')[0] : null
                  const isOverdue = tab === 'active' && dateOnly && dateOnly < today

                  return (
                    <tr key={item.id}>
                      <td className="fw-semibold">{getAssetName(item.asset_id)}</td>
                      <td>{getUserName(item.assigned_to_user_id)}</td>
                      <td>
                        <span className={`badge ${item.status === 'assigned' ? 'bg-success' : 'bg-secondary'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        {dateOnly || '—'}
                        {isOverdue && <span className="badge bg-danger ms-2">Overdue</span>}
                      </td>
                      <td>
                        {item.status === 'assigned' ? (
                          <button className="btn btn-sm btn-outline-success" onClick={() => confirmReturn(item)}>
                            <RotateCcw size={16} className="me-1" />
                            Return Asset
                          </button>
                        ) : '—'}
                      </td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4">
                      <ArrowRightLeft size={48} className="mb-2 text-muted" />
                      <p className="mb-0">No allocations found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
