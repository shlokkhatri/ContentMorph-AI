import {
  IconLinkedin,
  IconTwitter,
  IconShield,
  IconBarChart,
  IconBriefcase,
  IconPresentation,
  IconVideo,
  IconLayers,
  IconCheck,
} from './Icons.jsx'

const TYPE_CONFIG = {
  linkedin_post: {
    icon: IconLinkedin,
    color: '#0A66C2',
    category: 'Social Media',
    tagline: 'Professional post with formatted body & hashtag recommendations',
  },
  twitter_post: {
    icon: IconTwitter,
    color: '#1DA1F2',
    category: 'Social Media',
    tagline: 'Engaging numbered tweet thread with viral hooks',
  },
  advisory: {
    icon: IconShield,
    color: '#E02424',
    category: 'Governance & Security',
    tagline: 'Formal security / operational advisory with severity & action checklist',
  },
  infographic: {
    icon: IconBarChart,
    color: '#7E22CE',
    category: 'Visual & Design',
    tagline: 'Structured blueprint, key stat blocks & graphic cues for designers',
  },
  executive_summary: {
    icon: IconBriefcase,
    color: '#057A55',
    category: 'Executive Brief',
    tagline: 'High-level synthesis with key points & strategic recommendation',
  },
  presentation: {
    icon: IconPresentation,
    color: '#D97706',
    category: 'Deck & Slides',
    tagline: 'Slide-by-slide layout, bullet hierarchy & comprehensive speaker notes',
  },
  video_package: {
    icon: IconVideo,
    color: '#E02424',
    category: 'Multimedia',
    tagline: 'Scene storyboard with visual directions, voiceover script & subtitles',
  },
}

export default function OutputSelector({ outputTypes, selected, setSelected }) {
  function toggle(key) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  function handleSelectAll() {
    setSelected(outputTypes.map((t) => t.key))
  }

  function handleClearAll() {
    setSelected([])
  }

  return (
    <section className="card-panel">
      <div className="card-header">
        <div className="card-title-group">
          <div className="step-badge">2</div>
          <div>
            <h3>Target Deliverables</h3>
            <p className="card-subtitle">Choose which formats to generate simultaneously in one pass</p>
          </div>
        </div>

        <div className="selector-actions">
          <span className="selected-counter">
            {selected.length} of {outputTypes.length} selected
          </span>
          <div className="selector-btn-group">
            <button
              type="button"
              className="btn-select-shortcut"
              onClick={handleSelectAll}
            >
              Select All
            </button>
            <button
              type="button"
              className="btn-select-shortcut secondary"
              onClick={handleClearAll}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="output-cards-grid">
        {outputTypes.map((type) => {
          const config = TYPE_CONFIG[type.key] || {
            icon: IconLayers,
            color: '#6366F1',
            category: 'Content',
            tagline: 'Structured output artifact',
          }
          const IconComp = config.icon
          const isSelected = selected.includes(type.key)

          return (
            <div
              key={type.key}
              className={`output-card ${isSelected ? 'selected' : ''}`}
              onClick={() => toggle(type.key)}
              role="checkbox"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault()
                  toggle(type.key)
                }
              }}
            >
              <div className="card-top-row">
                <div
                  className="output-icon-badge"
                  style={{
                    backgroundColor: isSelected ? `${config.color}20` : 'var(--bg-tag)',
                    color: config.color,
                  }}
                >
                  <IconComp className="w-5 h-5" />
                </div>
                <div className={`selection-checkbox ${isSelected ? 'checked' : ''}`}>
                  {isSelected && <IconCheck className="w-3.5 h-3.5 check-icon" />}
                </div>
              </div>

              <div className="card-meta">
                <span className="output-category">{config.category}</span>
                <h4 className="output-title">{type.label}</h4>
                <p className="output-description">{config.tagline}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
