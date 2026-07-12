import { useEffect, useState } from 'react'
import axios from 'axios'
import { ArrowRight, Plus, Check, X } from 'lucide-react'
import Toast from '../components/Toast'
import ConfirmationDialog from '../components/ConfirmationDialog'
import LoadingSkeleton from '../components/LoadingSkeleton'

export default function Transfers({ darkMode }) {
  const [items, setItems] = useState([])
  const [assets, setAssets] = useState([])
  const [departments, setDepartments] = useState([])
  const [form, setForm] = useState({ asset_id: '', from_department_id: '', to_department_id: '', reason: '' })
  const [error, setError] = useState('')
  const [tab, setTab] = useState('pending')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [actionTarget, setActionTarget] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const [transferRes, assetRes, deptRes] = await Promise.all([
        axios.get('/transfers', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/assets', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/departments', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      setItems(transferRes.data)
      setAssets(assetRes.data)
      setDepartments(deptRes.data)
    } catch (err) {
      showToastMessage('Failed to load transfers', 'danger')
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
      await axios.post('/transfers', form, { headers: { Authorization: `Bearer ${token}` } })
      setForm({ asset_id: '', from_department_id: '', to_department_id: '', reason: '' })
      showToastMessage('Transfer request submitted successfully', 'success')
      load()
      setTab('pending')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit transfer request.')
    } finally {
      setSubmitting(false)
    }
  }

  const showToastMessage = (message, type) => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
  }

  const confirmApprove = (item) => {
    setActionTarget(item)
    setShowApproveDialog(true)
  }

  const confirmReject = (item) => {
    setActionTarget(item)
    setShowRejectDialog(true)
  }

  const approve = async () => {
    if (!actionTarget) return
    try {
      const token = localStorage.getItem('token')
      await axios.post(`/transfers/${actionTarget.id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } })
      setShowApproveDialog(false)
      setActionTarget(null)
      showToastMessage('Transfer approved successfully', 'success')
      load()
    } catch (err) {
      showToastMessage(err.response?.data?.error || 'Failed to approve transfer.', 'danger')
    }
  }

  const reject = async () => {
    if (!actionTarget) return
    try {
      const token = localStorage.getItem('token')
      await axios.post(`/transfers/${actionTarget.id}/reject`, {}, { headers: { Authorization: `Bearer ${token}` } })
      setShowRejectDialog(false)
      setActionTarget(null)
      showToastMessage('Transfer rejected successfully', 'success')
      load()
    } catch (err) {
      showToastMessage(err.response?.data?.error || 'Failed to reject transfer.', 'danger')
    }
  }

  const getAssetName = (assetId) => {
    const asset = assets.find(a => a.id === assetId)
    return asset ? `${asset.name} (${asset.asset_tag})` : `Asset #${assetId}`
  }

  const getDepartmentName = (deptId) => {
    const dept = departments.find(d => d.id === deptId)
    return dept ? dept.name : `Dept #${deptId}`
  }

  const filteredItems = items.filter(item => tab === 'pending' ? item.status === 'pending' : item.status !== 'pending')

  return (
    <div>
      {showToast && (
        <Toast 
          message={toastMessage} 
          type={toastType} 
          onClose={() => setShowToast(false)} 
        />
      )}

      {showApproveDialog && (
        <ConfirmationDialog
          show={showApproveDialog}
          title="Approve Transfer"
          message={`Are you sure you want to approve the transfer of ${getAssetName(actionTarget?.asset_id)}?`}
          onConfirm={approve}
          onCancel={() => {
            setShowApproveDialog(false)
            setActionTarget(null)
          }}
          confirmText="Approve"
          variant="success"
        />
      )}

      {showRejectDialog && (
        <ConfirmationDialog
          show={showRejectDialog}
          title="Reject Transfer"
          message={`Are you sure you want to reject the transfer of ${getAssetName(actionTarget?.asset_id)}?`}
          onConfirm={reject}
          onCancel={() => {
            setShowRejectDialog(false)
            setActionTarget(null)
          }}
          confirmText="Reject"
          variant="danger"
        />
      )}

      <h3 className="fw-bold mb-4 d-flex align-items-center gap-2">
        <ArrowRight size={28} />
        Transfer Requests
      </h3>
      
      {error && <div className="alert alert-danger">{error}</div>}

      <div className={`card p-4 mb-4 shadow-sm border-0 ${darkMode ? 'bg-secondary text-white' : ''}`}>
        <h5 className="card-title mb-3 d-flex align-items-center gap-2">
          <Plus size={20} />
          Submit Transfer Request
        </h5>
        <form onSubmit={submit} className="row g-3">
          <div className="col-md-3">
            <select className={`form-select ${darkMode ? 'bg-dark text-white border-secondary' : ''}`} value={form.asset_id} onChange={e => setForm({ ...form, asset_id: e.target.value })} required>
              <option value="">Select Asset</option>
              {assets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <select className={`form-select ${darkMode ? 'bg-dark text-white border-secondary' : ''}`} value={form.from_department_id} onChange={e => setForm({ ...form, from_department_id: e.target.value })} required>
              <option value="">From Department</option>
              {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <select className={`form-select ${darkMode ? 'bg-dark text-white border-secondary' : ''}`} value={form.to_department_id} onChange={e => setForm({ ...form, to_department_id: e.target.value })} required>
              <option value="">To Department</option>
              {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <button className="btn btn-primary w-100" disabled={submitting}>
              {submitting ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : 'Submit Transfer'}
            </button>
          </div>
          <div className="col-12">
            <textarea className={`form-control ${darkMode ? 'bg-dark text-white border-secondary' : ''}`} rows="2" placeholder="Reason for transfer (optional)" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
          </div>
        </form>
      </div>

      <ul className={`nav nav-tabs mb-3 ${darkMode ? 'border-secondary' : ''}`}>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'pending' ? 'active' : ''} ${darkMode ? 'text-white' : ''}`} onClick={() => setTab('pending')}>Pending Requests</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'history' ? 'active' : ''} ${darkMode ? 'text-white' : ''}`} onClick={() => setTab('history')}>Transfer History</button>
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
                  <th>From</th>
                  <th>To</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length > 0 ? filteredItems.map(item => (
                  <tr key={item.id}>
                    <td className="fw-semibold">{getAssetName(item.asset_id)}</td>
                    <td>{getDepartmentName(item.from_department_id)}</td>
                    <td>{getDepartmentName(item.to_department_id)}</td>
                    <td className="text-muted">{item.reason || '—'}</td>
                    <td>
                      <span className={`badge ${item.status === 'pending' ? 'bg-warning text-dark' : item.status === 'approved' ? 'bg-success' : 'bg-danger'}`}>
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {item.status === 'pending' ? (
                        <div className="btn-group">
                          <button className="btn btn-sm btn-outline-success" onClick={() => confirmApprove(item)}>
                            <Check size={16} />
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => confirmReject(item)}>
                            <X size={16} />
                          </button>
                        </div>
                      ) : '—'}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      <ArrowRight size={48} className="mb-2 text-muted" />
                      <p className="mb-0">No transfer requests found.</p>
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
