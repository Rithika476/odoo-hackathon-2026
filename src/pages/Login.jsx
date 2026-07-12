import { useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const { data } = await axios.post('/auth/login', form)
      localStorage.setItem('token', data.token)
      onLogin(data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h3 className="mb-3">Welcome to AssetFlow</h3>
              <p className="text-muted">Enterprise asset and resource management</p>
              <form onSubmit={submit}>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-control" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                </div>
                {error ? <div className="alert alert-danger py-2">{error}</div> : null}
                <button className="btn btn-primary w-100">Login</button>
              </form>
              <div className="mt-3 text-center">
                <Link to="/register">Create account</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
