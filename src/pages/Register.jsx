import { useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'

export default function Register({ onLogin }) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'Employee' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const { data } = await axios.post('/auth/register', form)
      localStorage.setItem('token', data.token)
      onLogin(data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h3 className="mb-3">Create your account</h3>
              <form onSubmit={submit}>
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <input className="form-control" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-control" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Role</label>
                  <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option>Employee</option>
                    <option>Asset Manager</option>
                    <option>Department Head</option>
                  </select>
                </div>
                {error ? <div className="alert alert-danger py-2">{error}</div> : null}
                <button className="btn btn-primary w-100">Register</button>
              </form>
              <div className="mt-3 text-center">
                <Link to="/login">Back to login</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
