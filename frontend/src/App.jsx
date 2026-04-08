import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { Brain, BarChart2, GitCompare, Layers, Clock, CloudUpload } from 'lucide-react'
import PDFUpload        from './components/PDFUpload'
import ModelSelector    from './components/ModelSelector'
import BloomSelector    from './components/BloomSelector'
import QuestionCard     from './components/QuestionCard'
import MultiLevelBuilder from './components/MultiLevelBuilder'
import CompareView      from './components/CompareView'
import ScoreCard        from './components/ScoreCard'
import Analytics        from './pages/Analytics'

const TABS = [
  { id: 'generate',  label: 'Generate',  icon: Brain },
  { id: 'compare',   label: 'Compare',   icon: GitCompare },
  { id: 'results',   label: 'Results',   icon: Layers },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'history',   label: 'History',   icon: Clock },
]

const BLOOM_COLORS = {
  1: '#94a3b8', 2: '#60a5fa', 3: '#34d399',
  4: '#fbbf24', 5: '#f97316', 6: '#c084fc',
}

export default function App() {
  const [status,      setStatus]      = useState({})
  const [models,      setModels]      = useState([])
  const [bloomLevels, setBloomLevels] = useState([])
  const [activeTab,   setActiveTab]   = useState('generate')

  // Config
  const [pdfData,    setPdfData]    = useState(null)
  const [topic,      setTopic]      = useState('')
  const [model,      setModel]      = useState('')
  const [bloomLevel, setBloomLevel] = useState(3)
  const [count,      setCount]      = useState(3)
  const [difficulty, setDifficulty] = useState('medium')
  const [mode,       setMode]       = useState('single') // 'single' | 'multi'

  // Compare
  const [compareModels,  setCompareModels]  = useState([])
  const [compareResult,  setCompareResult]  = useState(null)
  const [compareLoading, setCompareLoading] = useState(false)

  // Results
  const [loading,    setLoading]    = useState(false)
  const [result,     setResult]     = useState(null)
  const [error,      setError]      = useState('')
  const [scores,     setScores]     = useState([])
  const [quizDone,   setQuizDone]   = useState(false)

  // History
  const [history,    setHistory]    = useState([])

  const startTime = useRef({})

  useEffect(() => {
    axios.get('/api/status').then(r => setStatus(r.data)).catch(() => {})
    axios.get('/api/models').then(r => {
      setModels(r.data.models)
      if (r.data.models.length) setModel(r.data.models[0].label)
    }).catch(() => {})
    axios.get('/api/bloom-levels').then(r => setBloomLevels(r.data.levels)).catch(() => {})
  }, [])

  const loadHistory = () => {
    axios.get('/api/history').then(r => setHistory(r.data.sessions)).catch(() => {})
  }

  useEffect(() => { if (activeTab === 'history') loadHistory() }, [activeTab])

  const currentLevel = bloomLevels.find(l => l.level === bloomLevel)
  const resolvedTopic = (topic || '').trim() || (pdfData?.filename || '').replace(/\.pdf$/i, '')

  // ── Generate single ──────────────────────────────────────
  const handleGenerate = async () => {
    if (!resolvedTopic) return
    setLoading(true); setError(''); setResult(null)
    setScores([]); setQuizDone(false)
    try {
      const { data } = await axios.post('/api/generate', {
        model, topic: resolvedTopic, bloom_level: bloomLevel,
        num_questions: count, difficulty, context: pdfData?.text || '',
      })
      setResult(data)
      setActiveTab('results')
    } catch (e) {
      setError(e?.response?.data?.detail || 'Generation failed.')
    } finally { setLoading(false) }
  }

  // ── Generate multi-level ──────────────────────────────────
  const handleMultiLevel = async (specs) => {
    if (!resolvedTopic) return
    setLoading(true); setError(''); setResult(null)
    setScores([]); setQuizDone(false)
    try {
      const { data } = await axios.post('/api/generate/multi-level', {
        model, topic: resolvedTopic, context: pdfData?.text || '', levels: specs,
      })
      setResult(data)
      setActiveTab('results')
    } catch (e) {
      setError(e?.response?.data?.detail || 'Multi-level generation failed.')
    } finally { setLoading(false) }
  }

  // ── Compare ───────────────────────────────────────────────
  const handleCompare = async () => {
    if (!resolvedTopic || compareModels.length < 2) return
    setCompareLoading(true); setCompareResult(null)
    try {
      const { data } = await axios.post('/api/generate/compare', {
        models: compareModels, topic: resolvedTopic,
        bloom_level: bloomLevel, num_questions: 2,
        difficulty, context: pdfData?.text || '',
      })
      setCompareResult(data)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Comparison failed.')
    } finally { setCompareLoading(false) }
  }

  // ── Score tracking ────────────────────────────────────────
  const handleAnswer = (qid, questionText, lvl, selectedAns, correctAns, isCorrect) => {
    const timeTaken = startTime.current[qid]
      ? (Date.now() - startTime.current[qid]) / 1000 : null

    setScores(prev => {
      const filtered = prev.filter(s => s.questionId !== qid)
      return [...filtered, {
        questionId: qid, questionText, bloom_level: lvl,
        selectedAns, correctAns, is_correct: isCorrect, timeTaken,
      }]
    })
  }

  const handleFinishQuiz = () => setQuizDone(true)

  const allQuestions  = result?.questions || []
  const answeredCount = scores.length
  const canFinish     = answeredCount > 0 && !quizDone

  // ── Model toggle for compare ──────────────────────────────
  const toggleCompareModel = (m) => {
    setCompareModels(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    )
  }

  return (
    <div className="app-shell">

      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-brand">
          <h1>Bloom <em>Quiz</em></h1>
          <span className="header-tagline">AI-Powered Research Platform</span>
        </div>
        <div className="header-status">
          {[
            ['Groq',   status.groq],
            ['Gemini', status.gemini],
            ['Ollama', status.ollama],
            ['Drive',  status.drive],
          ].map(([name, ok]) => (
            <span key={name} className={`status-dot ${ok ? 'ok' : 'fail'}`}>{name}</span>
          ))}
        </div>
      </header>

      {/* ── Left panel ── */}
      <aside className="left-panel">

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
          {TABS.map(t => {
            const Icon   = t.icon
            const active = activeTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                  background: active ? 'var(--gold-glow)' : 'transparent',
                  border: active ? '1px solid var(--gold-dim)' : '1px solid transparent',
                  color: active ? 'var(--gold)' : 'var(--cream-faint)',
                  fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600,
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={12} />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* PDF + Topic always visible */}
        <div>
          <div className="section-label">Document</div>
          <PDFUpload pdfData={pdfData} setPdfData={setPdfData} />
        </div>

        <div>
          <div className="section-label">Topic</div>
          <input
            className="topic-input"
            placeholder="e.g. Photosynthesis · Recursion · French Revolution"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && resolvedTopic && handleGenerate()}
          />
        </div>

        {/* ── Generate tab controls ── */}
        {(activeTab === 'generate') && (
          <>
            <div>
              <div className="section-label">LLM</div>
              <ModelSelector models={models} selectedModel={model} setSelectedModel={setModel} />
            </div>

            {/* Mode toggle */}
            <div>
              <div className="section-label">Mode</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['single', 'multi'].map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    style={{
                      flex: 1, padding: '8px 0',
                      background: mode === m ? 'var(--gold-glow)' : 'var(--bg)',
                      border: mode === m ? '1.5px solid var(--gold)' : '1px solid var(--border)',
                      borderRadius: 8, color: mode === m ? 'var(--gold)' : 'var(--cream-faint)',
                      fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {m === 'single' ? 'Single Level' : 'Multi Level'}
                  </button>
                ))}
              </div>
            </div>

            {mode === 'single' ? (
              <>
                <div>
                  <div className="section-label">Bloom's Level</div>
                  <BloomSelector levels={bloomLevels} selected={bloomLevel} setSelected={setBloomLevel} />
                  {currentLevel && (
                    <p style={{ fontSize: 11, color: 'var(--cream-faint)', marginTop: 8, lineHeight: 1.5 }}>
                      {currentLevel.description}
                    </p>
                  )}
                </div>

                {/* Difficulty */}
                <div>
                  <div className="section-label">Difficulty</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['easy','medium','hard'].map(d => (
                      <button key={d} onClick={() => setDifficulty(d)} style={{
                        flex: 1, padding: '7px 0', borderRadius: 8,
                        background: difficulty === d ? 'var(--gold-glow)' : 'var(--bg)',
                        border: difficulty === d ? '1.5px solid var(--gold)' : '1px solid var(--border)',
                        color: difficulty === d ? 'var(--gold)' : 'var(--cream-faint)',
                        fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600,
                        cursor: 'pointer', textTransform: 'capitalize',
                      }}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="section-label">Count</div>
                  <div className="count-row">
                    <button className="count-btn" onClick={() => setCount(c => Math.max(1, c - 1))}>−</button>
                    <div>
                      <div className="count-display">{count}</div>
                      <div className="count-label">questions</div>
                    </div>
                    <button className="count-btn" onClick={() => setCount(c => Math.min(10, c + 1))}>+</button>
                  </div>
                </div>

                <button className="btn-generate" disabled={!resolvedTopic || !model || loading} onClick={handleGenerate}>
                  {loading ? 'Generating…' : 'Generate Quiz'}
                </button>
              </>
            ) : (
              <MultiLevelBuilder levels={bloomLevels} onBuild={handleMultiLevel} />
            )}
          </>
        )}

        {/* ── Compare tab controls ── */}
        {activeTab === 'compare' && (
          <>
            <div>
              <div className="section-label">Select LLMs to compare</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {models.map(m => (
                  <button
                    key={m.label}
                    onClick={() => toggleCompareModel(m.label)}
                    style={{
                      padding: '9px 12px', textAlign: 'left', borderRadius: 8, cursor: 'pointer',
                      background: compareModels.includes(m.label) ? 'var(--gold-glow)' : 'var(--bg)',
                      border: compareModels.includes(m.label) ? '1.5px solid var(--gold)' : '1px solid var(--border)',
                      color: compareModels.includes(m.label) ? 'var(--gold)' : 'var(--cream-dim)',
                      fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 500,
                    }}
                  >
                    {compareModels.includes(m.label) ? '✓ ' : '○ '}{m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="section-label">Bloom's Level</div>
              <BloomSelector levels={bloomLevels} selected={bloomLevel} setSelected={setBloomLevel} />
            </div>

            <div>
              <div className="section-label">Difficulty</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['easy','medium','hard'].map(d => (
                  <button key={d} onClick={() => setDifficulty(d)} style={{
                    flex: 1, padding: '7px 0', borderRadius: 8,
                    background: difficulty === d ? 'var(--gold-glow)' : 'var(--bg)',
                    border: difficulty === d ? '1.5px solid var(--gold)' : '1px solid var(--border)',
                    color: difficulty === d ? 'var(--gold)' : 'var(--cream-faint)',
                    fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', textTransform: 'capitalize',
                  }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="btn-generate"
              disabled={compareModels.length < 2 || !resolvedTopic || compareLoading}
              onClick={handleCompare}
            >
              {compareLoading ? 'Comparing…' : `Compare ${compareModels.length} LLMs`}
            </button>
          </>
        )}

      </aside>

      {/* ── Right panel ── */}
      <main className="right-panel">

        {error && (
          <div className="error-box"><strong>Error:</strong> {error}</div>
        )}

        {/* ── Generate / Results tab ── */}
        {(activeTab === 'generate' || activeTab === 'results') && (
          <>
            {(loading || compareLoading) && (
              <div className="loading-state">
                <div className="loading-spinner" />
                <div>
                  <div className="loading-text">Generating questions…</div>
                  <div className="loading-sub" style={{ textAlign: 'center', marginTop: 6 }}>
                    {model} is thinking
                  </div>
                </div>
              </div>
            )}

            {!loading && !result && (
              <div className="empty-state">
                <div className="empty-icon"><Brain size={28} /></div>
                <p>Configure and generate your quiz</p>
              </div>
            )}

            {!loading && result && (
              <div>
                {/* Meta bar */}
                <div className="quiz-meta">
                  <div className="quiz-meta-title">
                    <em>{result.topic}</em>
                  </div>
                  {result.bloom_level > 0 && currentLevel && (
                    <span className="meta-chip" style={{
                      background: `${currentLevel.color}18`, color: currentLevel.color,
                      border: `1px solid ${currentLevel.color}44`,
                    }}>
                      L{result.bloom_level} — {result.bloom_level_name}
                    </span>
                  )}
                  {result.type === 'multi_level' && (
                    <span className="meta-chip" style={{
                      background: 'var(--gold-glow)', color: 'var(--gold)',
                      border: '1px solid var(--gold-dim)',
                    }}>
                      Multi-level · {result.total_questions}Q
                    </span>
                  )}
                  <span className="meta-chip" style={{
                    background: 'var(--bg-2)', color: 'var(--cream-faint)',
                    border: '1px solid var(--border)',
                  }}>
                    {result.model}
                  </span>
                  <span className="meta-time">{result.total_latency ?? result.latency_sec}s</span>
                  {result.drive_link && (
                    <a href={result.drive_link} target="_blank" rel="noreferrer"
                      style={{ fontSize: 11, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CloudUpload size={12} /> Saved to Drive
                    </a>
                  )}
                  {result.evaluation && (
                    <span style={{ fontSize: 11, color: '#60a5fa' }}>
                      classifier acc: {Math.round(result.evaluation.classifier_accuracy * 100)}%
                    </span>
                  )}
                </div>

                {/* Score card (after finishing) */}
                {quizDone && (
                  <ScoreCard
                    sessionId={result.session_id}
                    scores={scores}
                    onDismiss={() => setQuizDone(false)}
                  />
                )}

                {/* Questions */}
                {allQuestions.map((q, i) => (
                  <QuestionCard
                    key={q.id ?? i}
                    q={q}
                    index={i}
                    levelColor={BLOOM_COLORS[q.bloom_level ?? bloomLevel] || 'var(--gold)'}
                    levelName={q.bloom_name ?? currentLevel?.name ?? ''}
                    onAnswer={(selectedAns, correctAns, isCorrect) =>
                      handleAnswer(
                        q.id ?? i, q.question,
                        q.bloom_level ?? bloomLevel,
                        selectedAns, correctAns, isCorrect,
                      )
                    }
                  />
                ))}

                {/* Finish quiz button */}
                {allQuestions.length > 0 && !quizDone && (
                  <button
                    onClick={handleFinishQuiz}
                    disabled={!canFinish}
                    style={{
                      marginTop: 8, width: '100%', padding: '14px',
                      background: canFinish ? 'var(--bg-2)' : 'transparent',
                      border: `1px solid ${canFinish ? 'var(--border-hi)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)', color: canFinish ? 'var(--cream-dim)' : 'var(--cream-faint)',
                      fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600,
                      cursor: canFinish ? 'pointer' : 'not-allowed',
                      letterSpacing: '0.05em', textTransform: 'uppercase',
                    }}
                  >
                    Finish Quiz ({answeredCount}/{allQuestions.length} answered)
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Compare tab ── */}
        {activeTab === 'compare' && (
          <>
            {compareLoading && (
              <div className="loading-state">
                <div className="loading-spinner" />
                <div className="loading-text">Running {compareModels.length} LLMs in parallel…</div>
              </div>
            )}
            {!compareLoading && !compareResult && (
              <div className="empty-state">
                <div className="empty-icon"><GitCompare size={28} /></div>
                <p>Select 2+ LLMs and a topic to compare</p>
              </div>
            )}
            {!compareLoading && compareResult && (
              <CompareView comparison={compareResult} />
            )}
          </>
        )}

        {/* ── Analytics tab ── */}
        {activeTab === 'analytics' && <Analytics />}

        {/* ── History tab ── */}
        {activeTab === 'history' && (
          <div>
            {history.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Clock size={28} /></div>
                <p>No sessions yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {history.map(s => {
                  const lvl = s.bloom_level
                  const col = BLOOM_COLORS[lvl] || 'var(--cream-faint)'
                  const acc = s.answered > 0
                    ? `${Math.round((s.correct / s.answered) * 100)}% accuracy`
                    : null
                  return (
                    <div key={s.id} style={{
                      background: 'var(--bg-1)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)', padding: '14px 18px',
                      display: 'flex', alignItems: 'center', gap: 14,
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                        background: `${col}18`, border: `1px solid ${col}44`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: col,
                      }}>
                        {lvl > 0 ? `L${lvl}` : 'ML'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cream)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {s.topic}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--cream-faint)', marginTop: 2 }}>
                          {s.model} · {s.num_questions}Q
                          {acc ? ` · ${acc}` : ''}
                          {s.drive_link ? ' · ☁ Drive' : ''}
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--cream-faint)', flexShrink: 0 }}>
                        {new Date(s.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  )
}
