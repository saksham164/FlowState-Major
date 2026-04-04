import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import './Auth.css'

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [confirmationSent, setConfirmationSent] = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const user = await signup({ name: form.name, email: form.email, password: form.password })
      // Supabase may require email confirmation before the session is active
      if (user && !user.confirmed_at) {
        setConfirmationSent(true)
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  if (confirmationSent) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card animate-fadeIn">
          <div className="auth-logo">
            <h1>FlowState</h1>
            <span>The Digital Sanctuary</span>
          </div>
          <h2 className="auth-heading">Check your email</h2>
          <p className="auth-subheading">
            We sent a confirmation link to <strong>{form.email}</strong>.
            Click it to activate your account and get started.
          </p>
          <p className="auth-footer" style={{ marginTop: '1.5rem' }}>
            Already confirmed? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card animate-fadeIn">
        <div className="auth-logo">
          <h1>FlowState</h1>
          <span>The Digital Sanctuary</span>
        </div>

        <h2 className="auth-heading">Create account</h2>
        <p className="auth-subheading">Start your productivity journey</p>


        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="signup-name">Full Name</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                className="form-input"
                type="text"
                id="signup-name"
                name="name"
                placeholder="Your full name"
                value={form.name}
                onChange={handleChange}
                required
                autoComplete="name"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">Email</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                className="form-input"
                type="email"
                id="signup-email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                className="form-input"
                type={showPass ? 'text' : 'password'}
                id="signup-password"
                name="password"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowPass(p => !p)}
                aria-label="Toggle password visibility"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-confirm">Confirm Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                className="form-input"
                type={showPass ? 'text' : 'password'}
                id="signup-confirm"
                name="confirmPassword"
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
