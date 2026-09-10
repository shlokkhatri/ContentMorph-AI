import { useState } from 'react'
import { IconHistory, IconSparkles } from './Icons.jsx'

export default function HistoryPanel({ history, onSelect, activeId, currentUser, onOpenAuth }) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredHistory = history.filter((item) => {
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    return (
      (item.source_preview || '').toLowerCase().includes(term) ||
      (item.output_types || []).some(t => t.toLowerCase().includes(term))
    )
  })

  function formatTimeAgo(isoDate) {
    if (!isoDate) return ''
    const date = new Date(isoDate)
    const now = new Date()
    const diffSecs = Math.floor((now - date) / 1000)
    if (diffSecs < 60) return 'Just now'
    const diffMins = Math.floor(diffSecs / 60)
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  if (!currentUser) {
    return (
      <div className="card-panel history-panel-card">
        <div className="history-header">
          <div className="history-title-wrap">
            <IconHistory className="w-5 h-5 text-accent" />
            <h3>Your History</h3>
          </div>
        </div>
        <div className="history-empty-state">
          <div className="empty-icon-circle">
            <IconSparkles className="w-6 h-6 text-muted" />
          </div>
          <p className="empty-title">Sign in for Personal History</p>
          <p className="empty-sub">Your generated multi-channel summaries are private and saved to your account.</p>
          <button type="button" className="btn-history-signin" onClick={onOpenAuth}>
            Sign In / Register →
          </button>
        </div>
      </div>
    )
  }


  return (
    <div className="card-panel history-panel-card">
      <div className="history-header">
        <div className="history-title-wrap">
          <IconHistory className="w-5 h-5 text-accent" />
          <h3>Transformation History</h3>
        </div>
        <span className="history-count-badge">{history.length}</span>
      </div>

      {history.length > 5 && (
        <div className="history-search-wrap">
          <input
            type="text"
            className="history-search-input"
            placeholder="Search past runs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {history.length === 0 ? (
        <div className="history-empty-state">
          <div className="empty-icon-circle">
            <IconSparkles className="w-6 h-6 text-muted" />
          </div>
          <p className="empty-title">No generations yet</p>
          <p className="empty-sub">Your generated multi-channel outputs will be saved here automatically.</p>
        </div>
      ) : (
        <div className="history-items-scroll">
          {filteredHistory.map((item) => {
            const isSelected = activeId === item.id

            return (
              <button
                key={item.id}
                type="button"
                className={`history-item-row ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelect(item.id)}
              >
                <div className="history-item-top">
                  <span className="history-time-tag">{formatTimeAgo(item.created_at)}</span>
                  <span className="history-types-pill">
                    {item.output_types?.length || 0} formats
                  </span>
                </div>

                <p className="history-snippet">
                  {item.source_preview || 'Untitled generation'}
                </p>

                <div className="history-chips-row">
                  {(item.output_types || []).slice(0, 3).map((t, idx) => (
                    <span key={idx} className="history-chip">
                      {t.replace('_', ' ')}
                    </span>
                  ))}
                  {(item.output_types || []).length > 3 && (
                    <span className="history-chip more">
                      +{(item.output_types || []).length - 3}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
