import { useState } from 'react'
import { IconSparkles, IconSun, IconMoon, IconWand } from './Icons.jsx'

export default function Navbar({
  theme,
  toggleTheme,
  onOpenPresets,
  isBackendReady,
  currentUser,
  onOpenAuth,
  onLogout,
}) {
  const [showUserMenu, setShowUserMenu] = useState(false)

  function getInitials(name) {
    if (!name) return 'U'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  return (
    <header className="app-navbar">
      <div className="navbar-left">
        <div className="brand-logo-wrap">
          <div className="brand-logo-glow">
            <IconSparkles className="w-6 h-6 brand-icon" />
          </div>
          <div>
            <div className="brand-name-row">
              <span className="brand-name">ContentMorph</span>
              <span className="brand-ai-badge">AI</span>
            </div>
            <span className="brand-tagline">Automated Multichannel Content Transformation</span>
          </div>
        </div>
      </div>

      <div className="navbar-right">
        <div className="engine-badge" title="Powered by Groq High-Speed LPU Inference">
          <span className="engine-dot pulse"></span>
          <span className="engine-name">Groq LPU</span>
        </div>

        <div className={`status-indicator ${isBackendReady ? 'online' : 'checking'}`}>
          <span className="status-dot"></span>
          <span>{isBackendReady ? 'Online' : 'Connecting...'}</span>
        </div>

        <button
          type="button"
          className="btn-preset-trigger"
          onClick={onOpenPresets}
          title="Choose a pre-filled sample template"
        >
          <IconWand className="w-4 h-4" />
          <span>Templates</span>
        </button>

        {currentUser ? (
          <div className="user-profile-menu-wrap">
            <button
              type="button"
              className="user-profile-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
              title={`Logged in as ${currentUser.full_name} (${currentUser.email})`}
            >
              <div className="user-avatar-pill">
                {getInitials(currentUser.full_name)}
              </div>
              <span className="user-name-text">{currentUser.full_name}</span>
              <span className="user-menu-chevron">▾</span>
            </button>

            {showUserMenu && (
              <div className="user-dropdown-menu" onClick={() => setShowUserMenu(false)}>
                <div className="dropdown-user-info">
                  <strong>{currentUser.full_name}</strong>
                  <span className="dropdown-email">{currentUser.email}</span>
                </div>
                <div className="dropdown-divider"></div>
                <button
                  type="button"
                  className="dropdown-item-btn logout-btn"
                  onClick={onLogout}
                >
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="btn-auth-trigger"
            onClick={onOpenAuth}
          >
            Sign In / Register
          </button>
        )}

        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label="Toggle dark/light theme"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <IconSun className="w-5 h-5" /> : <IconMoon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  )
}
