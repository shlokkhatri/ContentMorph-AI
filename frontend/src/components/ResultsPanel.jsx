import { useState } from 'react'
import {
  IconCopy,
  IconCheck,
  IconDownload,
  IconLinkedin,
  IconTwitter,
  IconShield,
  IconBarChart,
  IconBriefcase,
  IconPresentation,
  IconVideo,
  IconLayers,
} from './Icons.jsx'
import { downloadGeneration } from '../api.js'

const LABELS = {
  linkedin_post: { label: 'LinkedIn Post', icon: IconLinkedin, color: '#0A66C2' },
  twitter_post: { label: 'Twitter/X Post', icon: IconTwitter, color: '#1DA1F2' },
  advisory: { label: 'Security Advisory', icon: IconShield, color: '#E02424' },
  infographic: { label: 'Infographic Blueprint', icon: IconBarChart, color: '#7E22CE' },
  executive_summary: { label: 'Executive Summary', icon: IconBriefcase, color: '#057A55' },
  presentation: { label: 'Slide Presentation', icon: IconPresentation, color: '#D97706' },
  video_package: { label: 'Video Package', icon: IconVideo, color: '#E02424' },
}

export default function ResultsPanel({ results, generationId }) {
  const keys = Object.keys(results || {})
  const [activeTab, setActiveTab] = useState(keys[0] || '')

  if (keys.length === 0) return null

  const active = activeTab && results[activeTab] ? activeTab : keys[0]

  function downloadAsJson() {
    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: 'application/json',
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'contentmorph-results.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="results-panel">
      <div className="results-panel-header">
        <div>
          <div className="results-eyebrow">
            <span className="results-eyebrow-dot"></span>
            Generated Deliverables
          </div>

          <h2 className="results-title">
            Your content is ready
          </h2>

          <p className="results-subtitle">
            Review each generated deliverable below and download the results
            you need.
          </p>
        </div>

        <div className="results-actions">
          <button
            type="button"
            className="btn-modern-copy"
            onClick={downloadAsJson}
            title="Download all generated results as JSON"
          >
            <IconDownload className="w-4 h-4" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      <div className="results-tabs-scroller">
        <div className="results-tabs-bar">
          {keys.map((key) => {
            const config = LABELS[key] || {
              label: key,
              icon: IconLayers,
              color: '#6366F1',
            }

            const IconComp = config.icon
            const isActive = active === key

            return (
              <button
                key={key}
                type="button"
                className={`result-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(key)}
              >
                <span
                  className="tab-icon-wrap"
                  style={{
                    color: isActive ? '#fff' : config.color,
                  }}
                >
                  <IconComp className="w-4 h-4" />
                </span>

                <span>{config.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="result-view-container">
        <OutputView
          type={active}
          data={results[active]}
          generationId={generationId}
        />
      </div>
    </section>
  )
}

function CopyButton({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      className={`btn-modern-copy ${copied ? 'copied' : ''}`}
      onClick={handleCopy}
      title="Copy to clipboard"
    >
      {copied ? (
        <>
          <IconCheck className="w-4 h-4" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <IconCopy className="w-4 h-4" />
          <span>{label}</span>
        </>
      )}
    </button>
  )
}

function FormatDownloadButtons({ generationId }) {
  const [busy, setBusy] = useState('')

  async function handle(fmt) {
    setBusy(fmt)
    try {
      await downloadGeneration(generationId, fmt)
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="format-download-group">
      {['pptx', 'docx', 'pdf'].map((fmt) => (
        <button
          key={fmt}
          type="button"
          className="btn-export"
          disabled={busy === fmt}
          onClick={() => handle(fmt)}
          title={`Download as ${fmt.toUpperCase()}`}
        >
          <IconDownload className="w-4 h-4" />
          <span>{busy === fmt ? 'Preparing…' : fmt.toUpperCase()}</span>
        </button>
      ))}
    </div>
  )
}

function OutputView({ type, data, generationId }) {
  if (!data) return null

  // 1. LinkedIn Post
  if (type === 'linkedin_post') {
    const hashtagLine = (data.hashtags || []).map((h) => `#${h.replace(/^#/, '')}`).join(' ')
    const fullText = `${data.post_text}\n\n${hashtagLine}`

    return (
      <div className="linkedin-card-mockup">
        <div className="mockup-header">
          <div className="mockup-user">
            <div className="mockup-avatar">⚡</div>
            <div>
              <div className="mockup-author">
                <span>Enterprise Communicator</span>
                <span className="mockup-badge">AI Optimized</span>
              </div>
              <span className="mockup-time">Published just now • 🌐 Public</span>
            </div>
          </div>
          <CopyButton text={fullText} label="Copy Post" />
        </div>

        <div className="linkedin-body">
          <p className="post-content-text">{data.post_text}</p>
          {data.hashtags && data.hashtags.length > 0 && (
            <div className="hashtags-list">
              {data.hashtags.map((h, i) => (
                <span key={i} className="hashtag-pill">#{h.replace(/^#/, '')}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // 2. Twitter / X Thread
  if (type === 'twitter_post') {
    const tweets = data.tweets || []
    const fullText = tweets.map((t, i) => `${i + 1}/${tweets.length}\n${t}`).join('\n\n')

    return (
      <div className="twitter-thread-wrapper">
        <div className="thread-header-bar">
          <div className="thread-title">
            <IconTwitter className="w-5 h-5 text-twitter" />
            <span>Thread Preview ({tweets.length} posts)</span>
          </div>
          <CopyButton text={fullText} label="Copy All Tweets" />
        </div>

        <div className="tweet-items-timeline">
          {tweets.map((tweet, i) => (
            <div key={i} className="tweet-card">
              <div className="tweet-left">
                <div className="tweet-avatar">{i + 1}</div>
                {i < tweets.length - 1 && <div className="tweet-connector-line"></div>}
              </div>
              <div className="tweet-main">
                <div className="tweet-user-row">
                  <span className="tweet-user-name">Thread Post</span>
                  <span className="tweet-handle">@{i + 1} of {tweets.length}</span>
                  <div className="tweet-char-count">{tweet.length}/280</div>
                </div>
                <p className="tweet-text">{tweet}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 3. Advisory
  if (type === 'advisory') {
    const severity = (data.severity || 'Medium').toLowerCase()
    const fullText = `ADVISORY: ${data.title}\nSeverity: ${data.severity}\n\nSUMMARY:\n${data.summary}\n\nAFFECTED PARTIES:\n${data.affected_parties}\n\nRECOMMENDED ACTIONS:\n${(data.recommended_actions || []).map((a, i) => `${i + 1}. ${a}`).join('\n')}`

    return (
      <div className="advisory-card-wrapper">
        <div className="advisory-banner-top">
          <div className="advisory-title-group">
            <span className={`severity-tag severity-${severity}`}>
              <IconShield className="w-4 h-4" />
              <span>{data.severity || 'Notice'}</span>
            </span>
            <h3 className="advisory-heading">{data.title}</h3>
          </div>
          <CopyButton text={fullText} label="Copy Advisory" />
        </div>

        <div className="advisory-section">
          <h4 className="advisory-section-title">Executive Summary</h4>
          <p className="advisory-summary-text">{data.summary}</p>
        </div>

        {data.affected_parties && (
          <div className="advisory-section affected-box">
            <h4 className="advisory-section-title">Affected Scope & Assets</h4>
            <p>{data.affected_parties}</p>
          </div>
        )}

        <div className="advisory-section">
          <h4 className="advisory-section-title">Recommended Action Plan</h4>
          <ul className="advisory-actions-list">
            {(data.recommended_actions || []).map((action, i) => (
              <li key={i} className="action-item">
                <span className="action-number">{i + 1}</span>
                <span className="action-text">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  // 4. Infographic
  if (type === 'infographic') {
    const fullText = JSON.stringify(data, null, 2)
    return (
      <div className="infographic-deck-wrapper">
        <div className="infographic-top-bar">
          <div>
            <span className="infographic-label">Visual Information Architecture</span>
            <h3 className="infographic-title">{data.title}</h3>
          </div>
          <CopyButton text={fullText} label="Copy Blueprint" />
        </div>

        <div className="infographic-sections-grid">
          {(data.sections || []).map((sec, i) => (
            <div key={i} className="infographic-card">
              <div className="infographic-card-header">
                <span className="infographic-step-num">0{i + 1}</span>
                <h4>{sec.heading}</h4>
              </div>
              <p className="infographic-card-content">{sec.content}</p>
            </div>
          ))}
        </div>

        {data.visual_recommendations && data.visual_recommendations.length > 0 && (
          <div className="visual-recommendations-panel">
            <h4 className="visual-rec-title">🎨 Designer & Visual Cues</h4>
            <ul className="visual-rec-list">
              {data.visual_recommendations.map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  // 5. Executive Summary
  if (type === 'executive_summary') {
    const fullText = `# ${data.title}\n\n${data.summary}\n\nKey Takeaways:\n${(data.key_points || []).map(k => `- ${k}`).join('\n')}\n\nStrategic Recommendation:\n${data.recommendation}`

    return (
      <div className="executive-memo-wrapper">
        <div className="memo-header-bar">
          <div>
            <span className="memo-badge">Strategic Brief</span>
            <h3 className="memo-title">{data.title}</h3>
          </div>
          <CopyButton text={fullText} label="Copy Brief" />
        </div>

        <div className="memo-overview-box">
          <p className="memo-summary-p">{data.summary}</p>
        </div>

        <div className="memo-section">
          <h4 className="memo-subtitle">Key Observations & Findings</h4>
          <div className="memo-key-points-grid">
            {(data.key_points || []).map((point, i) => (
              <div key={i} className="memo-key-point-card">
                <div className="memo-point-icon">✓</div>
                <p>{point}</p>
              </div>
            ))}
          </div>
        </div>

        {data.recommendation && (
          <div className="memo-recommendation-box">
            <div className="memo-rec-header">
              <IconBriefcase className="w-5 h-5 text-emerald" />
              <h4>Strategic Recommendation</h4>
            </div>
            <p>{data.recommendation}</p>
          </div>
        )}
      </div>
    )
  }

  // 6. Presentation
  if (type === 'presentation') {
    const slides = data.slides || []
    const fullText = slides.map((s, i) => `Slide ${i + 1}: ${s.slide_title}\n${(s.bullet_points || []).map(b => `- ${b}`).join('\n')}\nSpeaker Notes: ${s.speaker_notes}`).join('\n\n---\n\n')

    return (
      <div className="presentation-deck-wrapper">
        <div className="deck-header-bar">
          <div>
            <span className="deck-badge">Slide Deck Outline</span>
            <h3 className="deck-title">{slides.length} Slide Presentation</h3>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <CopyButton text={fullText} label="Copy All Slides" />
            {generationId && <FormatDownloadButtons generationId={generationId} />}
          </div>
        </div>

        <div className="slides-list-flow">
          {slides.map((slide, i) => (
            <div key={i} className="slide-deck-card">
              <div className="slide-card-header">
                <span className="slide-number-pill">Slide {i + 1}</span>
                <h4 className="slide-title-text">{slide.slide_title}</h4>
              </div>

              <div className="slide-card-body">
                <ul className="slide-bullets-list">
                  {(slide.bullet_points || []).map((bullet, j) => (
                    <li key={j}>{bullet}</li>
                  ))}
                </ul>
              </div>

              {slide.speaker_notes && (
                <div className="slide-speaker-notes-box">
                  <span className="notes-label">🗣️ Speaker Notes</span>
                  <p>{slide.speaker_notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 7. Video Package
  if (type === 'video_package') {
    const scenes = data.scenes || []
    const fullText = `VIDEO: ${data.title} (${data.estimated_duration})\n\n` + scenes.map(s => `Scene ${s.scene_number}:\nVisual: ${s.visual_description}\nNarration: ${s.narration}\nSubtitle: ${s.subtitle}`).join('\n\n')

    return (
      <div className="video-package-wrapper">
        <div className="video-header-bar">
          <div>
            <span className="video-badge">Storyboard & Production Script</span>
            <h3 className="video-title">{data.title}</h3>
            {data.estimated_duration && (
              <span className="video-duration">⏱️ Est. Runtime: {data.estimated_duration}</span>
            )}
          </div>
          <CopyButton text={fullText} label="Copy Script" />
        </div>

        <div className="video-scenes-timeline">
          {scenes.map((scene) => (
            <div key={scene.scene_number} className="scene-storyboard-card">
              <div className="scene-card-top">
                <span className="scene-index-badge">Scene {scene.scene_number}</span>
              </div>

              <div className="scene-grid-info">
                <div className="scene-col visual-col">
                  <span className="scene-col-label">🎬 Visual Action</span>
                  <p>{scene.visual_description}</p>
                </div>

                <div className="scene-col audio-col">
                  <span className="scene-col-label">🎙️ Voiceover / Narration</span>
                  <p className="narration-script">"{scene.narration}"</p>
                </div>

                {scene.subtitle && (
                  <div className="scene-col subtitle-col">
                    <span className="scene-col-label">💬 On-Screen Subtitle</span>
                    <p className="subtitle-text">[{scene.subtitle}]</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Fallback
  return (
    <div className="raw-json-view">
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
