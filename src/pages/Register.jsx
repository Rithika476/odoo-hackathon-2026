import { useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Mail, Lock, User, Building2 } from 'lucide-react'

export default function Register({ onLogin, darkMode }) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'Employee' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await axios.post('/auth/register', form)
      localStorage.setItem('token', data.token)
      onLogin(data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-vh-100 d-flex align-items-center justify-content-center ${darkMode ? 'bg-dark' : 'bg-light'}`}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className={`card shadow-lg border-0 ${darkMode ? 'bg-secondary text-white' : ''}`}>
              <div className="card-body p-4 p-md-5">
                <div className="text-center mb-4">
                  <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary text-white mb-3" style={{ width: '60px', height: '60px' }}>
                    <Building2 size={32} />
                  </div>
                  <h3 className="fw-bold mb-2">Create Your Account</h3>
                  <p className={`text-muted ${darkMode ? 'text-light' : ''}`}>Join AssetFlow to manage your assets</p>
                </div>

                <form onSubmit={submit}>
                  <div className="mb-3">
                    <div className="form-floating">
                      <input
                        type="text"
                        className={`form-control ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
                        id="fullName"
                        placeholder="Full Name"
                        value={form.full_name}
                        onChange={e => setForm({ ...form, full_name: e.target.value })}
                        required
                        disabled={loading}
                      />
                      <label htmlFor="fullName" className={darkMode ? 'text-light' : ''}>
                        <User size={16} className="me-2" />
                        Full Name
                      </label>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="form-floating">
                      <input
                        type="email"
                        className={`form-control ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
                        id="email"
                        placeholder="name@example.com"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        required
                        disabled={loading}
                      />
                      <label htmlFor="email" className={darkMode ? 'text-light' : ''}>
                        <Mail size={16} className="me-2" />
                        Email Address
                      </label>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="form-floating">
                      <input
                        type="password"
                        className={`form-control ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
                        id="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        required
                        disabled={loading}
                        minLength="6"
                      />
                      <label htmlFor="password" className={darkMode ? 'text-light' : ''}>
                        <Lock size={16} className="me-2" />
                        Password
                      </label>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="role" className={`form-label ${darkMode ? 'text-light' : ''}`}>
                      <User size={16} className="me-2" />
                      Role
                    </label>
                    <select
                      className={`form-select ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
                      id="role"
                      value={form.role}
                      onChange={e => setForm({ ...form, role: e.target.value })}
                      disabled={loading}
                    >
                      <option value="Employee">Employee</option>
                      <option value="Asset Manager">Asset Manager</option>
                      <option value="Department Head">Department Head</option>
                    </select>
                  </div>

                  {error && (
                    <div className="alert alert-danger py-2 mb-3" role="alert">
                      {error}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="btn btn-primary w-100 py-2 fw-semibold"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Creating account...
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} className="me-2" />
                        Create Account
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-4 text-center">
                  <p className={`mb-0 ${darkMode ? 'text-light' : 'text-muted'}`}>
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary text-decoration-none fw-semibold">
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center mt-4">
              <p className={`small mb-0 ${darkMode ? 'text-light' : 'text-muted'}`}>
                © 2026 AssetFlow. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
