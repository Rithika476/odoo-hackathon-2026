import { useEffect, useState } from 'react'
import axios from 'axios'
import { Users, Plus, Search, Edit, Trash2 } from 'lucide-react'
import Toast from '../components/Toast'
import ConfirmationDialog from '../components/ConfirmationDialog'
import LoadingSkeleton from '../components/LoadingSkeleton'

export default function Employees({ darkMode }) {
  const [items, setItems] = useState([])
  const [departments, setDepartments] = useState([])
  const [form, setForm] = useState({ email: '', full_name: '', job_title: '', department_id: '', phone: '', location: '', status: 'active' })
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
      const [empRes, deptRes] = await Promise.all([
        axios.get('/employees', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/departments', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      setItems(empRes.data)
      setDepartments(deptRes.data)
    } catch (err) {
      showToastMessage('Failed to load employees', 'danger')
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
      await axios.post('/employees', form, { headers: { Authorization: `Bearer ${token}` } })
      setForm({ email: '', full_name: '', job_title: '', department_id: '', phone: '', location: '', status: 'active' })
      showToastMessage('Employee created successfully', 'success')
      load()
    } catch (err) {
      showToastMessage(err.response?.data?.error || 'Failed to create employee', 'danger')
    } finally {
      setSubmitting(false)
    }
  }

  const updateEmployee = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      await axios.patch(`/employees/${editForm.id}`, editForm, { headers: { Authorization: `Bearer ${token}` } })
      setEditForm(null)
      showToastMessage('Employee updated successfully', 'success')
      load()
    } catch (err) {
      showToastMessage(err.response?.data?.error || 'Failed to update employee', 'danger')
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
      await axios.delete(`/employees/${deleteTarget.id}`, { headers: { Authorization: `Bearer ${token}` } })
      setShowDeleteDialog(false)
      setDeleteTarget(null)
      showToastMessage('Employee deleted successfully', 'success')
      load()
    } catch (err) {
      showToastMessage(err.response?.data?.error || 'Failed to delete employee', 'danger')
    }
  }

  const showToastMessage = (message, type) => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
  }

  const filtered = items.filter(item => {
    const matchesSearch = item.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.job_title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const getStatusBadge = (status) => {
    return status === 'active' 
      ? <span className="badge bg-success">Active</span>
      : <span className="badge bg-secondary">Inactive</span>
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
          title="Delete Employee"
          message={`Are you sure you want to delete "${deleteTarget?.full_name}"? This action cannot be undone.`}
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
          {editForm ? 'Edit Employee' : 'Add New Employee'}
        </h5>
        <form onSubmit={editForm ? updateEmployee : submit} className="row g-3">
          <div className="col-md-3">
            <input 
              className={`form-control ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
              placeholder="Full Name" 
              value={editForm ? editForm.full_name : form.full_name} 
              onChange={e => editForm ? setEditForm({ ...editForm, full_name: e.target.value }) : setForm({ ...form, full_name: e.target.value })}
              required
            />
          </div>
          <div className="col-md-3">
            <input 
              className={`form-control ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
              placeholder="Email" 
              value={editForm ? editForm.email : form.email} 
              onChange={e => editForm ? setEditForm({ ...editForm, email: e.target.value }) : setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="col-md-2">
            <input 
              className={`form-control ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
              placeholder="Job Title" 
              value={editForm ? editForm.job_title : form.job_title} 
              onChange={e => editForm ? setEditForm({ ...editForm, job_title: e.target.value }) : setForm({ ...form, job_title: e.target.value })}
              required
            />
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
          <div className="col-md-3">
            <input 
              className={`form-control ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
              placeholder="Phone" 
              value={editForm ? editForm.phone : form.phone} 
              onChange={e => editForm ? setEditForm({ ...editForm, phone: e.target.value }) : setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="col-md-3">
            <input 
              className={`form-control ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
              placeholder="Location" 
              value={editForm ? editForm.location : form.location} 
              onChange={e => editForm ? setEditForm({ ...editForm, location: e.target.value }) : setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div className="col-md-2">
            <select 
              className={`form-select ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
              value={editForm ? editForm.status : form.status} 
              onChange={e => editForm ? setEditForm({ ...editForm, status: e.target.value }) : setForm({ ...form, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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
                  placeholder="Search employees..." 
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <span className={`badge ${darkMode ? 'bg-primary' : 'bg-light text-dark'}`}>
              {filtered.length} employees
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
                    <th>Job Title</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Phone</th>
                    <th>Location</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length > 0 ? paginated.map(item => (
                    <tr key={item.id}>
                      <td className="fw-semibold">{item.full_name}</td>
                      <td>{item.job_title}</td>
                      <td>{item.department}</td>
                      <td>{getStatusBadge(item.status)}</td>
                      <td className="text-muted">{item.phone || '—'}</td>
                      <td className="text-muted">{item.location || '—'}</td>
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
                      <td colSpan="7" className="text-center text-muted py-4">
                        <Users size={48} className="mb-2 text-muted" />
                        <p className="mb-0">No employees found matching your filters.</p>
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
