import { useEffect, useState } from 'react'
import axios from 'axios'
import { Tag, Plus, Search, Edit, Trash2 } from 'lucide-react'
import Toast from '../components/Toast'
import ConfirmationDialog from '../components/ConfirmationDialog'
import LoadingSkeleton from '../components/LoadingSkeleton'

export default function Categories({ darkMode }) {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ name: '', code: '', description: '' })
  const [editForm, setEditForm] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
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
      const { data } = await axios.get('/categories', { headers: { Authorization: `Bearer ${token}` } })
      setItems(data)
    } catch (err) {
      showToastMessage('Failed to load categories', 'danger')
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
      await axios.post('/categories', form, { headers: { Authorization: `Bearer ${token}` } })
      setForm({ name: '', code: '', description: '' })
      showToastMessage('Category created successfully', 'success')
      load()
    } catch (err) {
      showToastMessage(err.response?.data?.error || 'Failed to create category', 'danger')
    } finally {
      setSubmitting(false)
    }
  }

  const updateCategory = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      await axios.patch(`/categories/${editForm.id}`, editForm, { headers: { Authorization: `Bearer ${token}` } })
      setEditForm(null)
      showToastMessage('Category updated successfully', 'success')
      load()
    } catch (err) {
      showToastMessage(err.response?.data?.error || 'Failed to update category', 'danger')
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
      await axios.delete(`/categories/${deleteTarget.id}`, { headers: { Authorization: `Bearer ${token}` } })
      setShowDeleteDialog(false)
      setDeleteTarget(null)
      showToastMessage('Category deleted successfully', 'success')
      load()
    } catch (err) {
      showToastMessage(err.response?.data?.error || 'Failed to delete category', 'danger')
    }
  }

  const showToastMessage = (message, type) => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
  }

  const filtered = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

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
          title="Delete Category"
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
          {editForm ? 'Edit Category' : 'Add New Category'}
        </h5>
        <form onSubmit={editForm ? updateCategory : submit} className="row g-3">
          <div className="col-md-4">
            <input 
              className={`form-control ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
              placeholder="Category Name" 
              value={editForm ? editForm.name : form.name} 
              onChange={e => editForm ? setEditForm({ ...editForm, name: e.target.value }) : setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="col-md-3">
            <input 
              className={`form-control ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
              placeholder="Code" 
              value={editForm ? editForm.code : form.code} 
              onChange={e => editForm ? setEditForm({ ...editForm, code: e.target.value }) : setForm({ ...form, code: e.target.value })}
              required
            />
          </div>
          <div className="col-md-3">
            <input 
              className={`form-control ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
              placeholder="Description" 
              value={editForm ? editForm.description : form.description} 
              onChange={e => editForm ? setEditForm({ ...editForm, description: e.target.value }) : setForm({ ...form, description: e.target.value })}
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
                  placeholder="Search categories..." 
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>
            <span className={`badge ${darkMode ? 'bg-primary' : 'bg-light text-dark'}`}>
              {filtered.length} categories
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
                    <th>Code</th>
                    <th>Description</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length > 0 ? paginated.map(item => (
                    <tr key={item.id}>
                      <td className="fw-semibold">{item.name}</td>
                      <td><span className={`badge ${darkMode ? 'bg-primary' : 'bg-secondary'}`}>{item.code}</span></td>
                      <td className="text-muted">{item.description || '—'}</td>
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
                      <td colSpan="4" className="text-center text-muted py-4">
                        <Tag size={48} className="mb-2 text-muted" />
                        <p className="mb-0">No categories found matching your search.</p>
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
