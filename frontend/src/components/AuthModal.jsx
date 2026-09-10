import { useState } from 'react'
import { IconSparkles, IconCheck } from './Icons.jsx'
import { loginUser, registerUser } from '../api.js'

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [tab, setTab] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    try {
      let data
      if (tab === 'register') {
        if (!fullName.trim()) {
          setError('Please enter your full name.')
          setLoading(false)
          return
        }
        data = await registerUser(email, password, fullName)
      } else {
        data = await loginUser(email, password)
      }

      onAuthSuccess(data.user)
      onClose()
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-top">
          <div className="auth-logo-badge">
            <IconSparkles className="w-6 h-6 text-white" />
          </div>
          <h3>{tab === 'login' ? 'Welcome Back' : 'Create Your Account'}</h3>
          <p className="auth-modal-sub">
            {tab === 'login'
              ? 'Sign in to access your personal transformations, summaries & history.'
              : 'Register to get private workspaces and personalized AI deliverables.'}
          </p>
        </div>

        <div className="auth-tabs-toggle">
          <button
            type="button"
            className={`auth-tab-pill ${tab === 'login' ? 'active' : ''}`}
            onClick={() => {
              setTab('login')
              setError('')
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-pill ${tab === 'register' ? 'active' : ''}`}
            onClick={() => {
              setTab('register')
              setError('')
            }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="auth-error-banner">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {tab === 'register' && (
            <div className="auth-field">
              <label>Full Name</label>
              <input
                type="text"
                className="modern-input"
                placeholder="e.g. Peter Parker"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label>Email Address</label>
            <input
              type="email"
              className="modern-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              className="modern-input"
              placeholder={tab === 'register' ? 'Min. 6 characters' : 'Enter your password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-auth-submit" disabled={loading}>
            {loading ? (
              <span className="auth-loading-spinner">Processing...</span>
            ) : (
              <span>{tab === 'login' ? 'Sign In →' : 'Create Free Account →'}</span>
            )}
          </button>
        </form>

        <div className="auth-footer-notice">
          <span>🔒 Private & Secured Workspace • PostgreSQL Isolated</span>
        </div>
      </div>
    </div>
  )
}
