import { useEffect, useState, useRef } from 'react'
import Navbar from './components/Navbar.jsx'
import SourceInput from './components/SourceInput.jsx'
import OutputSelector from './components/OutputSelector.jsx'
import ParametersPanel from './components/ParametersPanel.jsx'
import ResultsPanel from './components/ResultsPanel.jsx'
import HistoryPanel from './components/HistoryPanel.jsx'
import PresetsModal from './components/PresetsModal.jsx'
import AuthModal from './components/AuthModal.jsx'
import { IconSparkles } from './components/Icons.jsx'
import {
  fetchOutputTypes,
  generateContent,
  fetchHistory,
  fetchHistoryItem,
  fetchCurrentUser,
  getStoredUser,
  logoutUser,
} from './api.js'

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cm_theme') || 'dark'
  })
  const [currentUser, setCurrentUser] = useState(() => getStoredUser())
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [outputTypes, setOutputTypes] = useState([])
  const [sourceText, setSourceText] = useState('')
  const [file, setFile] = useState(null)
  const [selectedOutputs, setSelectedOutputs] = useState([])
  const [parameters, setParameters] = useState({
    audience: 'General Audience',
    tone: 'Professional',
    language: 'English',
    detail_level: 'Medium',
    objective: 'Awareness',
    extra_instructions: '',
  })
  const [results, setResults] = useState(null)
  const [history, setHistory] = useState([])
  const [activeHistoryId, setActiveHistoryId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [error, setError] = useState('')
  const [isBackendReady, setIsBackendReady] = useState(false)
  const [isPresetsOpen, setIsPresetsOpen] = useState(false)

  const resultsRef = useRef(null)

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('cm_theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  // Check auth and initial output types
  useEffect(() => {
    fetchCurrentUser().then((user) => {
      if (user) {
        setCurrentUser(user)
      }
    }).catch(() => { })

    fetchOutputTypes()
      .then((data) => {
        setOutputTypes(data)
        setIsBackendReady(true)
        if (data.length > 0 && selectedOutputs.length === 0) {
          setSelectedOutputs([data[0].key, data[1]?.key, data[2]?.key].filter(Boolean))
        }
      })
      .catch(() => {
        setIsBackendReady(false)
        setError('Could not connect to the backend on http://localhost:8000. Please ensure the backend server is running.')
      })
  }, [])

  // Load history whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      fetchHistory()
        .then(setHistory)
        .catch(() => setHistory([]))
    } else {
      setHistory([])
    }
  }, [currentUser])

  // Keyboard shortcut: Ctrl/Cmd + Enter to trigger generation
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        if (!loading) {
          handleGenerate()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sourceText, file, selectedOutputs, parameters, loading, currentUser])

  // Dynamic loading steps
  useEffect(() => {
    let interval = null
    if (loading) {
      setLoadingStep(0)
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < 2 ? prev + 1 : prev))
      }, 1200)
    }
    return () => clearInterval(interval)
  }, [loading])

  async function handleGenerate() {
    setError('')

    if (!currentUser) {
      setIsAuthOpen(true)
      return
    }

    if (!sourceText.trim() && !file) {
      setError('Please provide source content: paste text or upload a document/image.')
      return
    }
    if (selectedOutputs.length === 0) {
      setError('Please select at least one deliverable output type.')
      return
    }

    const formData = new FormData()
    formData.append('output_types', selectedOutputs.join(','))
    formData.append('audience', parameters.audience)
    formData.append('tone', parameters.tone)
    formData.append('language', parameters.language)
    formData.append('detail_level', parameters.detail_level)
    formData.append('objective', parameters.objective)
    formData.append('extra_instructions', parameters.extra_instructions || '')
    if (file) {
      formData.append('file', file)
    } else {
      formData.append('source_text', sourceText)
    }

    setLoading(true)
    setActiveHistoryId(null)

    try {
      const data = await generateContent(formData)
      setResults(data.results)
      setActiveHistoryId(data.id)
      fetchHistory().then(setHistory).catch(() => { })

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 150)
    } catch (err) {
      setError(err.message || 'Generation failed. Please verify your Groq API key and settings.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSelectHistory(id) {
    setError('')
    try {
      const data = await fetchHistoryItem(id)
      setResults(data.results)
      setActiveHistoryId(id)
      if (data.parameters) setParameters((prev) => ({ ...prev, ...data.parameters }))
      if (data.output_types) setSelectedOutputs(data.output_types)

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err) {
      setError(err.message)
    }
  }

  function handleSelectPreset(preset) {
    setSourceText(preset.sourceText)
    setFile(null)
    setSelectedOutputs(preset.outputTypes)
    setParameters(preset.parameters)
    setError('')
  }

  function handleAuthSuccess(user) {
    setCurrentUser(user)
    fetchHistory().then(setHistory).catch(() => { })
  }

  function handleLogout() {
    logoutUser()
    setCurrentUser(null)
    setResults(null)
    setHistory([])
    setActiveHistoryId(null)
  }

  const loadingMessages = [
    'Analyzing context and factual hierarchy...',
    'Synthesizing deliverables with Groq LPU engine...',
    'Formatting structured JSON output artifacts...',
  ]

  return (
    <div className="app-root">
      <Navbar
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenPresets={() => setIsPresetsOpen(true)}
        isBackendReady={isBackendReady}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      <main className="app-container">
        {error && (
          <div className="error-toast">
            <div className="error-toast-content">
              <span className="error-icon">⚠️</span>
              <p>{error}</p>
            </div>
            <button className="error-dismiss-btn" onClick={() => setError('')}>
              ✕
            </button>
          </div>
        )}

        {!currentUser && (
          <div className="guest-login-banner" onClick={() => setIsAuthOpen(true)}>
            <div className="guest-banner-left">
              <span className="guest-banner-icon">👤</span>
              <div>
                <strong>Sign in to save your personal transformation history & summaries</strong>
                <p>Each user gets private isolated workspaces and past generation lookups.</p>
              </div>
            </div>
            <button type="button" className="btn-banner-signin">
              Sign In / Register →
            </button>
          </div>
        )}

        <div className="app-workspace-grid">
          {/* Left Column: Workflow Inputs */}
          <div className="workflow-column">
            <SourceInput
              sourceText={sourceText}
              setSourceText={setSourceText}
              file={file}
              setFile={setFile}
            />

            <OutputSelector
              outputTypes={outputTypes}
              selected={selectedOutputs}
              setSelected={setSelectedOutputs}
            />

            <ParametersPanel
              parameters={parameters}
              setParameters={setParameters}
            />

            {/* Glowing CTA Generate Button */}
            <div className="generate-action-bar">
              <button
                type="button"
                className={`btn-primary-generate ${loading ? 'loading' : ''}`}
                onClick={handleGenerate}
                disabled={loading}
              >
                <div className="btn-inner">
                  {loading ? (
                    <>
                      <span className="spinner-ring"></span>
                      <span className="btn-loading-text">{loadingMessages[loadingStep]}</span>
                    </>
                  ) : (
                    <>
                      <IconSparkles className="w-4 h-4 btn-sparkle-icon" />
                      <span className="btn-title">
                        {currentUser
                          ? `Transform Content (${selectedOutputs.length} Output${selectedOutputs.length === 1 ? '' : 's'})`
                          : 'Sign In & Transform Content'}
                      </span>
                      <span className="btn-shortcut-hint">Ctrl + Enter</span>
                    </>
                  )}
                </div>
                <div className="btn-glow-layer"></div>
              </button>
            </div>

            {/* Results Section */}
            {/* Results Section */}
            <div ref={resultsRef}>
              {results && (
                <ResultsPanel
                  results={results}
                  generationId={activeHistoryId}
                />
              )}
            </div>
          </div>

          {/* Right Column: User History Sidebar */}
          <aside className="sidebar-column">
            <HistoryPanel
              history={history}
              onSelect={handleSelectHistory}
              activeId={activeHistoryId}
              currentUser={currentUser}
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          </aside>
        </div>
      </main>

      <PresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onSelectPreset={handleSelectPreset}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  )
}



// import { useEffect, useState, useRef } from 'react'
// import Navbar from './components/Navbar.jsx'
// import SourceInput from './components/SourceInput.jsx'
// import OutputSelector from './components/OutputSelector.jsx'
// import ParametersPanel from './components/ParametersPanel.jsx'
// import ResultsPanel from './components/ResultsPanel.jsx'
// import HistoryPanel from './components/HistoryPanel.jsx'
// import PresetsModal from './components/PresetsModal.jsx'
// import AuthModal from './components/AuthModal.jsx'
// import { IconSparkles } from './components/Icons.jsx'
// import {
//   fetchOutputTypes,
//   generateContent,
//   fetchHistory,
//   fetchHistoryItem,
//   fetchCurrentUser,
//   getStoredUser,
//   logoutUser,
// } from './api.js'

// export default function App() {
//   const [theme, setTheme] = useState(() => {
//     return localStorage.getItem('cm_theme') || 'dark'
//   })
//   const [currentUser, setCurrentUser] = useState(() => getStoredUser())
//   const [isAuthOpen, setIsAuthOpen] = useState(false)
//   const [outputTypes, setOutputTypes] = useState([])
//   const [sourceText, setSourceText] = useState('')
//   const [file, setFile] = useState(null)
//   const [selectedOutputs, setSelectedOutputs] = useState([])
//   const [parameters, setParameters] = useState({
//     audience: 'General Audience',
//     tone: 'Professional',
//     language: 'English',
//     detail_level: 'Medium',
//     objective: 'Awareness',
//     extra_instructions: '',
//   })
//   const [results, setResults] = useState(null)
//   const [history, setHistory] = useState([])
//   const [activeHistoryId, setActiveHistoryId] = useState(null)
//   const [loading, setLoading] = useState(false)
//   const [loadingStep, setLoadingStep] = useState(0)
//   const [error, setError] = useState('')
//   const [isBackendReady, setIsBackendReady] = useState(false)
//   const [isPresetsOpen, setIsPresetsOpen] = useState(false)

//   const resultsRef = useRef(null)

//   // Sync theme
//   useEffect(() => {
//     document.documentElement.setAttribute('data-theme', theme)
//     localStorage.setItem('cm_theme', theme)
//   }, [theme])

//   function toggleTheme() {
//     setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
//   }

//   // Check auth and initial output types
//   useEffect(() => {
//     fetchCurrentUser().then((user) => {
//       if (user) {
//         setCurrentUser(user)
//       }
//     }).catch(() => {})

//     fetchOutputTypes()
//       .then((data) => {
//         setOutputTypes(data)
//         setIsBackendReady(true)
//         if (data.length > 0 && selectedOutputs.length === 0) {
//           setSelectedOutputs([data[0].key, data[1]?.key, data[2]?.key].filter(Boolean))
//         }
//       })
//       .catch(() => {
//         setIsBackendReady(false)
//         setError('Could not connect to the backend on http://localhost:8000. Please ensure the backend server is running.')
//       })
//   }, [])

//   // Load history whenever currentUser changes
//   useEffect(() => {
//     if (currentUser) {
//       fetchHistory()
//         .then(setHistory)
//         .catch(() => setHistory([]))
//     } else {
//       setHistory([])
//     }
//   }, [currentUser])

//   // Keyboard shortcut: Ctrl/Cmd + Enter to trigger generation
//   useEffect(() => {
//     function handleKeyDown(e) {
//       if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
//         e.preventDefault()
//         if (!loading) {
//           handleGenerate()
//         }
//       }
//     }
//     window.addEventListener('keydown', handleKeyDown)
//     return () => window.removeEventListener('keydown', handleKeyDown)
//   }, [sourceText, file, selectedOutputs, parameters, loading, currentUser])

//   // Dynamic loading steps
//   useEffect(() => {
//     let interval = null
//     if (loading) {
//       setLoadingStep(0)
//       interval = setInterval(() => {
//         setLoadingStep((prev) => (prev < 2 ? prev + 1 : prev))
//       }, 1200)
//     }
//     return () => clearInterval(interval)
//   }, [loading])

//   async function handleGenerate() {
//     setError('')

//     if (!currentUser) {
//       setIsAuthOpen(true)
//       return
//     }

//     if (!sourceText.trim() && !file) {
//       setError('Please provide source content: paste text or upload a document/image.')
//       return
//     }
//     if (selectedOutputs.length === 0) {
//       setError('Please select at least one deliverable output type.')
//       return
//     }

//     const formData = new FormData()
//     formData.append('output_types', selectedOutputs.join(','))
//     formData.append('audience', parameters.audience)
//     formData.append('tone', parameters.tone)
//     formData.append('language', parameters.language)
//     formData.append('detail_level', parameters.detail_level)
//     formData.append('objective', parameters.objective)
//     formData.append('extra_instructions', parameters.extra_instructions || '')
//     if (file) {
//       formData.append('file', file)
//     } else {
//       formData.append('source_text', sourceText)
//     }

//     setLoading(true)
//     setActiveHistoryId(null)

//     try {
//       const data = await generateContent(formData)
//       setResults(data.results)
//       setActiveHistoryId(data.id)
//       fetchHistory().then(setHistory).catch(() => {})

//       setTimeout(() => {
//         resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
//       }, 150)
//     } catch (err) {
//       setError(err.message || 'Generation failed. Please verify your Groq API key and settings.')
//     } finally {
//       setLoading(false)
//     }
//   }

//   async function handleSelectHistory(id) {
//     setError('')
//     try {
//       const data = await fetchHistoryItem(id)
//       setResults(data.results)
//       setActiveHistoryId(id)
//       if (data.parameters) setParameters((prev) => ({ ...prev, ...data.parameters }))
//       if (data.output_types) setSelectedOutputs(data.output_types)

//       setTimeout(() => {
//         resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
//       }, 100)
//     } catch (err) {
//       setError(err.message)
//     }
//   }

//   function handleSelectPreset(preset) {
//     setSourceText(preset.sourceText)
//     setFile(null)
//     setSelectedOutputs(preset.outputTypes)
//     setParameters(preset.parameters)
//     setError('')
//   }

//   function handleAuthSuccess(user) {
//     setCurrentUser(user)
//     fetchHistory().then(setHistory).catch(() => {})
//   }

//   function handleLogout() {
//     logoutUser()
//     setCurrentUser(null)
//     setResults(null)
//     setHistory([])
//     setActiveHistoryId(null)
//   }

//   const loadingMessages = [
//     'Analyzing context and factual hierarchy...',
//     'Synthesizing deliverables with Groq LPU engine...',
//     'Formatting structured JSON output artifacts...',
//   ]

//   return (
//     <div className="app-root">
//       <Navbar
//         theme={theme}
//         toggleTheme={toggleTheme}
//         onOpenPresets={() => setIsPresetsOpen(true)}
//         isBackendReady={isBackendReady}
//         currentUser={currentUser}
//         onOpenAuth={() => setIsAuthOpen(true)}
//         onLogout={handleLogout}
//       />

//       <main className="app-container">
//         {error && (
//           <div className="error-toast">
//             <div className="error-toast-content">
//               <span className="error-icon">⚠️</span>
//               <p>{error}</p>
//             </div>
//             <button className="error-dismiss-btn" onClick={() => setError('')}>
//               ✕
//             </button>
//           </div>
//         )}

//         {!currentUser && (
//           <div className="guest-login-banner" onClick={() => setIsAuthOpen(true)}>
//             <div className="guest-banner-left">
//               <span className="guest-banner-icon">👤</span>
//               <div>
//                 <strong>Sign in to save your personal transformation history & summaries</strong>
//                 <p>Each user gets private isolated workspaces and past generation lookups.</p>
//               </div>
//             </div>
//             <button type="button" className="btn-banner-signin">
//               Sign In / Register →
//             </button>
//           </div>
//         )}

//         <div className="app-workspace-grid">
//           {/* Left Column: Workflow Inputs */}
//           <div className="workflow-column">
//             <SourceInput
//               sourceText={sourceText}
//               setSourceText={setSourceText}
//               file={file}
//               setFile={setFile}
//             />

//             <OutputSelector
//               outputTypes={outputTypes}
//               selected={selectedOutputs}
//               setSelected={setSelectedOutputs}
//             />

//             <ParametersPanel
//               parameters={parameters}
//               setParameters={setParameters}
//             />

//             {/* Glowing CTA Generate Button */}
//             <div className="generate-action-bar">
//               <button
//                 type="button"
//                 className={`btn-primary-generate ${loading ? 'loading' : ''}`}
//                 onClick={handleGenerate}
//                 disabled={loading}
//               >
//                 <div className="btn-inner">
//                   {loading ? (
//                     <>
//                       <span className="spinner-ring"></span>
//                       <span className="btn-loading-text">{loadingMessages[loadingStep]}</span>
//                     </>
//                   ) : (
//                     <>
//                       <IconSparkles className="w-5 h-5 btn-sparkle-icon" />
//                       <span className="btn-title">
//                         {currentUser
//                           ? `Transform Content (${selectedOutputs.length} Output${selectedOutputs.length === 1 ? '' : 's'})`
//                           : 'Sign In & Transform Content'}
//                       </span>
//                       <span className="btn-shortcut-hint">Ctrl + Enter</span>
//                     </>
//                   )}
//                 </div>
//                 <div className="btn-glow-layer"></div>
//               </button>
//             </div>

//             {/* Results Section */}
//             <div ref={resultsRef}>
//               {results && <ResultsPanel results={results} />}
//             </div>
//           </div>

//           {/* Right Column: User History Sidebar */}
//           <aside className="sidebar-column">
//             <HistoryPanel
//               history={history}
//               onSelect={handleSelectHistory}
//               activeId={activeHistoryId}
//               currentUser={currentUser}
//               onOpenAuth={() => setIsAuthOpen(true)}
//             />
//           </aside>
//         </div>
//       </main>

//       <PresetsModal
//         isOpen={isPresetsOpen}
//         onClose={() => setIsPresetsOpen(false)}
//         onSelectPreset={handleSelectPreset}
//       />

//       <AuthModal
//         isOpen={isAuthOpen}
//         onClose={() => setIsAuthOpen(false)}
//         onAuthSuccess={handleAuthSuccess}
//       />
//     </div>
//   )
// }