import { useEffect, useState } from 'react'
import axios from 'axios'

const BLOOM_COLORS = {
  1: '#94a3b8', 2: '#60a5fa', 3: '#34d399',
  4: '#fbbf24', 5: '#f97316', 6: '#c084fc',
}
const BLOOM_NAMES = {
  1:'Remember', 2:'Understand', 3:'Apply', 4:'Analyze', 5:'Evaluate', 6:'Create'
}

function StatCard({ label, value, sub }) {
  return (
    <div style={{
      background: 'var(--bg-2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '16px 20px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 11, color: 'var(--cream-faint)', letterSpacing: '0.1em',
        textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem',
        fontWeight: 300, color: 'var(--cream)' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--cream-faint)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function HeatmapCell({ value, max }) {
  const pct     = max > 0 ? value / max : 0
  const opacity = 0.15 + pct * 0.75
  return (
    <td style={{
      background: `rgba(212, 168, 67, ${opacity})`,
      color: pct > 0.5 ? '#0c0900' : 'var(--cream)',
      textAlign: 'center', padding: '10px 14px',
      fontSize: 13, fontWeight: 500,
      border: '1px solid var(--border)',
    }}>
      {value > 0 ? `${(value * 100).toFixed(0)}%` : '—'}
    </td>
  )
}

export default function Analytics() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [driveStatus, setDriveStatus] = useState(null)
  const [exporting, setExporting]     = useState(false)
  const [exportMsg, setExportMsg]     = useState('')

  useEffect(() => {
    Promise.all([
      axios.get('/api/analytics'),
      axios.get('/api/drive/status'),
    ]).then(([a, d]) => {
      setData(a.data)
      setDriveStatus(d.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const exportToDrive = async () => {
    setExporting(true)
    setExportMsg('')
    try {
      const { data: res } = await axios.post('/api/drive/export-all')
      if (res.saved) {
        setExportMsg(`Saved ${res.total} sessions to Google Drive!`)
      } else {
        setExportMsg(res.error || 'Export failed')
      }
    } catch {
      setExportMsg('Export failed — check Drive configuration')
    } finally {
      setExporting(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
      <div style={{ width: 36, height: 36, border: '2px solid var(--border)',
        borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (!data) return (
    <p style={{ color: 'var(--cream-faint)', textAlign: 'center', padding: 40 }}>
      No data yet — generate some quizzes first.
    </p>
  )

  const { summary, evaluation_table } = data
  const evalModels = [...new Set(evaluation_table.map(r => r.model))]

  return (
    <div style={{ padding: '0 0 40px' }}>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 28 }}>
        <StatCard label="Total sessions"   value={summary.total_sessions}   />
        <StatCard label="Total questions"  value={summary.total_questions}  />
        <StatCard label="Overall accuracy" value={`${summary.overall_accuracy}%`} />
        <StatCard label="Correct answers"  value={summary.total_correct}    />
      </div>

      {/* ── Drive status + export ── */}
      <div style={{
        background: 'var(--bg-2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '18px 22px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 28,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cream)', marginBottom: 4 }}>
            Google Drive
          </div>
          <div style={{ fontSize: 12, color: driveStatus?.configured ? '#4ade80' : '#f87171' }}>
            {driveStatus?.configured
              ? `Connected · ${driveStatus.files?.length || 0} files saved`
              : 'Not configured — add service_account.json to backend/'}
          </div>
          {exportMsg && (
            <div style={{ fontSize: 12, color: '#60a5fa', marginTop: 4 }}>{exportMsg}</div>
          )}
        </div>
        <button
          onClick={exportToDrive}
          disabled={!driveStatus?.configured || exporting}
          style={{
            background: driveStatus?.configured ? 'var(--gold)' : 'var(--bg-3)',
            color: driveStatus?.configured ? '#0c0900' : 'var(--cream-faint)',
            border: 'none', borderRadius: 'var(--radius)', padding: '10px 20px',
            fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 700,
            cursor: driveStatus?.configured ? 'pointer' : 'not-allowed',
            letterSpacing: '0.05em', textTransform: 'uppercase',
          }}
        >
          {exporting ? 'Saving…' : 'Export All to Drive'}
        </button>
      </div>

      {/* ── Accuracy by Bloom level ── */}
      {summary.accuracy_by_level?.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--cream-faint)', marginBottom: 12 }}>
            Student accuracy by Bloom level
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 120 }}>
            {[1,2,3,4,5,6].map(lvl => {
              const row = summary.accuracy_by_level?.find(r => r.bloom_level === lvl)
              const pct  = row ? row.accuracy_pct : 0
              return (
                <div key={lvl} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 11, color: BLOOM_COLORS[lvl], fontWeight: 700 }}>
                    {pct > 0 ? `${pct}%` : '—'}
                  </div>
                  <div style={{
                    width: '100%', background: BLOOM_COLORS[lvl],
                    height: pct > 0 ? `${pct}%` : 4,
                    borderRadius: '4px 4px 0 0', opacity: 0.85,
                    minHeight: 4,
                  }} />
                  <div style={{ fontSize: 10, color: 'var(--cream-faint)' }}>L{lvl}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── LLM × Bloom evaluation heatmap ── */}
      {evaluation_table?.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--cream-faint)', marginBottom: 12 }}>
            LLM × Bloom level — classifier accuracy heatmap
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px 14px', textAlign: 'left',
                    color: 'var(--cream-faint)', fontWeight: 600,
                    border: '1px solid var(--border)', background: 'var(--bg-2)' }}>
                    Model
                  </th>
                  {[1,2,3,4,5,6].map(l => (
                    <th key={l} style={{ padding: '10px 14px', textAlign: 'center',
                      color: BLOOM_COLORS[l], fontWeight: 700, fontSize: 12,
                      border: '1px solid var(--border)', background: 'var(--bg-2)' }}>
                      L{l}<br />
                      <span style={{ fontWeight: 400, color: 'var(--cream-faint)' }}>
                        {BLOOM_NAMES[l]}
                      </span>
                    </th>
                  ))}
                  <th style={{ padding: '10px 14px', textAlign: 'center',
                    color: 'var(--cream-dim)', fontWeight: 600,
                    border: '1px solid var(--border)', background: 'var(--bg-2)' }}>
                    Avg Latency
                  </th>
                </tr>
              </thead>
              <tbody>
                {evalModels.map(model => {
                  const rowData = {}
                  evaluation_table.filter(r => r.model === model).forEach(r => {
                    rowData[r.bloom_level] = r
                  })
                  const latencies = Object.values(rowData).map(r => r.avg_latency).filter(Boolean)
                  const avgLat = latencies.length
                    ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1)
                    : '—'
                  return (
                    <tr key={model}>
                      <td style={{ padding: '10px 14px', color: 'var(--cream)',
                        fontWeight: 500, border: '1px solid var(--border)',
                        background: 'var(--bg-1)', fontSize: 12 }}>
                        {model}
                      </td>
                      {[1,2,3,4,5,6].map(lvl => (
                        <HeatmapCell
                          key={lvl}
                          value={rowData[lvl]?.avg_classifier_acc || 0}
                          max={1}
                        />
                      ))}
                      <td style={{ padding: '10px 14px', textAlign: 'center',
                        color: 'var(--cream-dim)', border: '1px solid var(--border)',
                        background: 'var(--bg-1)', fontSize: 12 }}>
                        {avgLat}s
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 11, color: 'var(--cream-faint)', marginTop: 8 }}>
            Cell color = classifier accuracy (darker = LLM stayed on-level). Run more quizzes to populate this table.
          </p>
        </div>
      )}

      {/* ── Questions per level bar ── */}
      {summary.by_level?.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--cream-faint)', marginBottom: 12 }}>
            Sessions per Bloom level
          </div>
          {summary.by_level.map(row => {
            const maxCount = Math.max(...summary.by_level.map(r => r.count))
            const pct = maxCount > 0 ? (row.count / maxCount) * 100 : 0
            return (
              <div key={row.bloom_level} style={{ display: 'flex', alignItems: 'center',
                gap: 12, marginBottom: 8 }}>
                <div style={{ width: 80, fontSize: 12, color: BLOOM_COLORS[row.bloom_level],
                  fontWeight: 600, flexShrink: 0 }}>
                  L{row.bloom_level} {BLOOM_NAMES[row.bloom_level]}
                </div>
                <div style={{ flex: 1, background: 'var(--bg-3)', borderRadius: 4, height: 20 }}>
                  <div style={{
                    width: `${pct}%`, background: BLOOM_COLORS[row.bloom_level],
                    borderRadius: 4, height: '100%', opacity: 0.7,
                    transition: 'width 0.6s ease', minWidth: row.count > 0 ? 4 : 0,
                  }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--cream-dim)', width: 30 }}>
                  {row.count}
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
