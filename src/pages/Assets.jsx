import { useEffect, useState } from 'react'
import axios from 'axios'
import { Package, Plus, Search, Edit, Trash2 } from 'lucide-react'
import Toast from '../components/Toast'
import ConfirmationDialog from '../components/ConfirmationDialog'
import LoadingSkeleton from '../components/LoadingSkeleton'

export default function Assets({ darkMode }) {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [departments, setDepartments] = useState([])
  const [form, setForm] = useState({ name: '', asset_tag: '', serial_number: '', category_id: '', department_id: '', value: 0, status: 'available' })
  const [editForm, setEditForm] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const itemsPerPage = 10

  const load = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const [assetRes, catRes, deptRes] = await Promise.all([
        axios.get('/assets', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/categories', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/departments', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      setItems(assetRes.data)
      setCategories(catRes.data)
      setDepartments(deptRes.data)
    } catch (err) {
      showToastMessage('Failed to load assets', 'danger')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      await axios.post('/assets', form, { headers: { Authorization: `Bearer ${token}` } })
      setForm({ name: '', asset_tag: '', serial_number: '', category_id: '', department_id: '', value: 0, status: 'available' })
      showToastMessage('Asset created successfully', 'success')
      load()
    } catch (err) {
      showToastMessage(err.response?.data?.error || 'Failed to create asset', 'danger')
    } finally {
      setSubmitting(false)
    }
  }

  const updateAsset = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      await axios.patch(`/assets/${editForm.id}`, editForm, { headers: { Authorization: `Bearer ${token}` } })
      setEditForm(null)
      showToastMessage('Asset updated successfully', 'success')
      load()
    } catch (err) {
      showToastMessage(err.response?.data?.error || 'Failed to update asset', 'danger')
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = (item) => {
    setDeleteTarget(item)
    setShowDeleteDialog(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`/assets/${deleteTarget.id}`, { headers: { Authorization: `Bearer ${token}` } })
      setShowDeleteDialog(false)
      setDeleteTarget(null)
      showToastMessage('Asset deleted successfully', 'success')
      load()
    } catch (err) {
      showToastMessage(err.response?.data?.error || 'Failed to delete asset', 'danger')
    }
  }

  const showToastMessage = (message, type) => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
  }

  const filtered = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.serial_number && item.serial_number.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const getStatusBadge = (status) => {
    const colors = {
      'available': 'success',
      'assigned': 'primary',
      'maintenance': 'warning',
      'retired': 'secondary'
    }
    return <span className={`badge bg-${colors[status] || 'secondary'}`}>{status}</span>
  }

  return (
    <div>
      {showToast && (
        <Toast 
          message={toastMessage} 
          type={toastType} 
          onClose={() => setShowToast(false)} 
        />
      )}

      {showDeleteDialog && (
        <ConfirmationDialog
          show={showDeleteDialog}
          title="Delete Asset"
          message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => {
            setShowDeleteDialog(false)
            setDeleteTarget(null)
          }}
          confirmText="Delete"
          variant="danger"
        />
      )}

      <div className={`card p-4 mb-4 shadow-sm border-0 ${darkMode ? 'bg-secondary text-white' : ''}`}>
        <h5 className="card-title mb-3 d-flex align-items-center gap-2">
          <Plus size={20} />
          {editForm ? 'Edit Asset' : 'Add New Asset'}
        </h5>
        <form onSubmit={editForm ? updateAsset : submit} className="row g-3">
          <div className="col-md-3">
            <input 
              className={`form-control ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
              placeholder="Asset Name" 
              value={editForm ? editForm.name : form.name} 
              onChange={e => editForm ? setEditForm({ ...editForm, name: e.target.value }) : setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="col-md-2">
            <input 
              className={`form-control ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
              placeholder="Asset Tag" 
              value={editForm ? editForm.asset_tag : form.asset_tag} 
              onChange={e => editForm ? setEditForm({ ...editForm, asset_tag: e.target.value }) : setForm({ ...form, asset_tag: e.target.value })}
              required
            />
          </div>
          <div className="col-md-2">
            <input 
              className={`form-control ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
              placeholder="Serial Number" 
              value={editForm ? editForm.serial_number : form.serial_number} 
              onChange={e => editForm ? setEditForm({ ...editForm, serial_number: e.target.value }) : setForm({ ...form, serial_number: e.target.value })}
            />
          </div>
          <div className="col-md-2">
            <select 
              className={`form-select ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
              value={editForm ? editForm.category_id : form.category_id} 
              onChange={e => editForm ? setEditForm({ ...editForm, category_id: e.target.value }) : setForm({ ...form, category_id: e.target.value })}
              required
            >
              <option value="">Category</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <select 
              className={`form-select ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
              value={editForm ? editForm.department_id : form.department_id} 
              onChange={e => editForm ? setEditForm({ ...editForm, department_id: e.target.value }) : setForm({ ...form, department_id: e.target.value })}
              required
            >
              <option value="">Department</option>
              {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
            </select>
          </div>
          <div className="col-md-1">
            <input 
              type="number"
              className={`form-control ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
              placeholder="Value" 
              value={editForm ? editForm.value : form.value} 
              onChange={e => editForm ? setEditForm({ ...editForm, value: e.target.value }) : setForm({ ...form, value: e.target.value })}
            />
          </div>
          <div className="col-md-2 d-flex gap-2">
            <button 
              className="btn btn-primary flex-grow-1" 
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : editForm ? 'Update' : 'Add'}
            </button>
            {editForm && (
              <button 
                className="btn btn-secondary" 
                type="button"
                onClick={() => setEditForm(null)}
              >
                Cancel
              </button>
            )}
          </div>
          <div className="col-md-2">
            <select 
              className={`form-select ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
              value={editForm ? editForm.status : form.status} 
              onChange={e => editForm ? setEditForm({ ...editForm, status: e.target.value }) : setForm({ ...form, status: e.target.value })}
            >
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>
        </form>
      </div>

      <div className={`card shadow-sm border-0 mb-4 ${darkMode ? 'bg-secondary text-white' : ''}`}>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex gap-2 flex-grow-1">
              <div className="position-relative" style={{ maxWidth: '300px' }}>
                <Search size={18} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                <input 
                  type="text" 
                  className={`form-control ps-5 ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
                  placeholder="Search assets..." 
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>
              <select 
                className={`form-select ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
                style={{ width: '150px' }}
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="assigned">Assigned</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            <span className={`badge ${darkMode ? 'bg-primary' : 'bg-light text-dark'}`}>
              {filtered.length} assets
            </span>
          </div>

          {loading ? (
            <LoadingSkeleton type="table" rows={5} />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className={darkMode ? 'table-dark' : 'table-light'}>
                  <tr>
                    <th>Name</th>
                    <th>Tag</th>
                    <th>Serial</th>
                    <th>Category</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Value</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length > 0 ? paginated.map(item => (
                    <tr key={item.id}>
                      <td className="fw-semibold">{item.name}</td>
                      <td><span className={`badge ${darkMode ? 'bg-primary' : 'bg-secondary'}`}>{item.asset_tag}</span></td>
                      <td className="text-muted">{item.serial_number || '—'}</td>
                      <td>{item.category}</td>
                      <td>{item.department}</td>
                      <td>{getStatusBadge(item.status)}</td>
                      <td className="text-muted">${item.value || 0}</td>
                      <td className="text-end">
                        <div className="btn-group">
                          <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setEditForm(item)}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => confirmDelete(item)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="8" className="text-center text-muted py-4">
                        <Package size={48} className="mb-2 text-muted" />
                        <p className="mb-0">No assets found matching your filters.</p>
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
