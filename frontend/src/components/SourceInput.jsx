import { useState, useRef } from 'react'
import { IconFileText, IconUploadCloud, IconTrash, IconCheck } from './Icons.jsx'

export default function SourceInput({ sourceText, setSourceText, file, setFile }) {
  const [activeTab, setActiveTab] = useState(file ? 'upload' : 'paste')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const wordCount = sourceText.trim() ? sourceText.trim().split(/\s+/).length : 0
  const charCount = sourceText.length

  function handleFileDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
      setActiveTab('upload')
    }
  }

  function handleFileChange(e) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  function formatFileSize(bytes) {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  return (
    <section className="card-panel source-panel">
      <div className="card-header">
        <div className="card-title-group">
          <div className="step-badge">1</div>
          <div>
            <h3>Source Material</h3>
            <p className="card-subtitle">Input raw text, article, security brief, or upload a document</p>
          </div>
        </div>

        <div className="source-tabs">
          <button
            type="button"
            className={`source-tab-btn ${activeTab === 'paste' ? 'active' : ''}`}
            onClick={() => setActiveTab('paste')}
          >
            <IconFileText className="w-4 h-4" />
            <span>Raw Text</span>
          </button>
          <button
            type="button"
            className={`source-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <IconUploadCloud className="w-4 h-4" />
            <span>Upload File {file && '✓'}</span>
          </button>
        </div>
      </div>

      {activeTab === 'paste' && (
        <div className="textarea-wrapper">
          <textarea
            className="modern-textarea"
            placeholder="Paste your source document, release notes, press release, research brief, or advisory here..."
            value={sourceText}
            onChange={(e) => {
              setSourceText(e.target.value)
              if (file) setFile(null)
            }}
            rows={9}
          />
          <div className="textarea-footer">
            <div className="text-stats">
              <span><strong>{wordCount}</strong> words</span>
              <span className="stats-separator">•</span>
              <span><strong>{charCount}</strong> characters</span>
            </div>
            {sourceText && (
              <button
                type="button"
                className="btn-text-action"
                onClick={() => setSourceText('')}
                title="Clear content"
              >
                Clear text
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === 'upload' && (
        <div className="upload-container">
          {!file ? (
            <div
              className={`dropzone ${isDragging ? 'dragging' : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden-file-input"
                accept=".txt,.pdf,.docx,.png,.jpg,.jpeg,.webp"
                onChange={handleFileChange}
              />
              <div className="dropzone-icon-circle">
                <IconUploadCloud className="w-8 h-8 dropzone-icon" />
              </div>
              <div className="dropzone-text">
                <p className="dropzone-primary">
                  <strong>Click to upload</strong> or drag and drop
                </p>
                <p className="dropzone-secondary">
                  PDF, DOCX, TXT, PNG, JPG (up to 25MB)
                </p>
              </div>
            </div>
          ) : (
            <div className="file-preview-card">
              <div className="file-info-left">
                <div className="file-type-icon">
                  <IconFileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="file-name">{file.name}</h4>
                  <span className="file-meta">{formatFileSize(file.size)} • {file.type || 'Document'}</span>
                </div>
              </div>
              <div className="file-actions">
                <span className="file-ready-tag">
                  <IconCheck className="w-3.5 h-3.5" /> Attached
                </span>
                <button
                  type="button"
                  className="btn-file-remove"
                  onClick={() => setFile(null)}
                  title="Remove file"
                >
                  <IconTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
