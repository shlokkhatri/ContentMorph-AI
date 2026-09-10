import { useState } from 'react'
import { IconSliders } from './Icons.jsx'

const AUDIENCES = [
  'General Audience',
  'Executives',
  'Technical Team',
  'Security Team',
  'Media / Public',
  'Developers',
  'Customers',
]

const TONES = [
  'Professional',
  'Formal',
  'Casual',
  'Urgent',
  'Technical',
  'Inspiring',
  'Educational',
]

const LANGUAGES = [
  'English',
  'Hindi',
  'Spanish',
  'French',
  'German',
  'Japanese',
  'Portuguese',
]

const DETAIL_LEVELS = ['Low', 'Medium', 'High']

const OBJECTIVES = [
  'Awareness',
  'Call to Action',
  'Decision Support',
  'Training / Education',
  'Public Relations',
  'Compliance',
]

const QUICK_INSTRUCTIONS = [
  'Keep it under 150 words',
  'Highlight key deadlines',
  'Avoid heavy technical jargon',
  'Include actionable metrics',
  'Focus on strategic ROI',
]

export default function ParametersPanel({ parameters, setParameters }) {
  const [showExtra, setShowExtra] = useState(!!parameters.extra_instructions)

  function update(field, value) {
    setParameters((prev) => ({ ...prev, [field]: value }))
  }

  function appendInstruction(tag) {
    setParameters((prev) => {
      const current = prev.extra_instructions || ''
      if (current.includes(tag)) return prev
      const updated = current ? `${current}; ${tag}` : tag
      return { ...prev, extra_instructions: updated }
    })
    setShowExtra(true)
  }

  return (
    <section className="card-panel">
      <div className="card-header">
        <div className="card-title-group">
          <div className="step-badge">3</div>
          <div>
            <h3>Transformation Parameters</h3>
            <p className="card-subtitle">Fine-tune audience framing, tone, detail level, and styling</p>
          </div>
        </div>
      </div>

      <div className="param-cards-grid">
        <div className="param-field-group">
          <label className="param-label">
            <span>Target Audience</span>
          </label>
          <div className="custom-select-wrap">
            <select
              className="modern-select"
              value={parameters.audience}
              onChange={(e) => update('audience', e.target.value)}
            >
              {AUDIENCES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        <div className="param-field-group">
          <label className="param-label">
            <span>Tone of Voice</span>
          </label>
          <div className="custom-select-wrap">
            <select
              className="modern-select"
              value={parameters.tone}
              onChange={(e) => update('tone', e.target.value)}
            >
              {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="param-field-group">
          <label className="param-label">
            <span>Language</span>
          </label>
          <div className="custom-select-wrap">
            <select
              className="modern-select"
              value={parameters.language}
              onChange={(e) => update('language', e.target.value)}
            >
              {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div className="param-field-group">
          <label className="param-label">
            <span>Level of Detail</span>
          </label>
          <div className="detail-level-pill-group">
            {DETAIL_LEVELS.map((level) => (
              <button
                type="button"
                key={level}
                className={`detail-pill-btn ${parameters.detail_level === level ? 'active' : ''}`}
                onClick={() => update('detail_level', level)}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="param-field-group">
          <label className="param-label">
            <span>Primary Objective</span>
          </label>
          <div className="custom-select-wrap">
            <select
              className="modern-select"
              value={parameters.objective}
              onChange={(e) => update('objective', e.target.value)}
            >
              {OBJECTIVES.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="extra-instructions-section">
        <div className="extra-instructions-toggle">
          <button
            type="button"
            className="btn-toggle-extra"
            onClick={() => setShowExtra(!showExtra)}
          >
            <span>{showExtra ? '▾ Custom Guidance & Directives' : '▸ Add custom guidance / constraints (optional)'}</span>
          </button>
        </div>

        {showExtra && (
          <div className="extra-instructions-content">
            <div className="quick-tags-row">
              <span className="quick-tags-title">Quick tags:</span>
              <div className="quick-tags-list">
                {QUICK_INSTRUCTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="tag-chip"
                    onClick={() => appendInstruction(tag)}
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              className="modern-textarea extra-textarea"
              rows={2}
              placeholder="e.g. Include specific metrics from source, highlight urgent deadlines, avoid buzzwords..."
              value={parameters.extra_instructions}
              onChange={(e) => update('extra_instructions', e.target.value)}
            />
          </div>
        )}
      </div>
    </section>
  )
}
