export default function CompareView({ comparison }) {
  if (!comparison) return null

  const { topic, bloom_level, bloom_name, results } = comparison
  const models = Object.keys(results)

  const BLOOM_COLORS = {
    1: '#94a3b8', 2: '#60a5fa', 3: '#34d399',
    4: '#fbbf24', 5: '#f97316', 6: '#c084fc',
  }
  const color = BLOOM_COLORS[bloom_level] || 'var(--gold)'

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12,
        marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem',
          fontWeight: 300, color: 'var(--cream)', flex: 1 }}>
          Comparing <em>{topic}</em>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '4px 12px',
          borderRadius: 20, background: `${color}18`,
          color, border: `1px solid ${color}44`,
        }}>
          L{bloom_level} — {bloom_name}
        </span>
      </div>

      {/* Column grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${models.length}, 1fr)`,
        gap: 14,
      }}>
        {models.map(model => {
          const r = results[model]
          if (r?.error) return (
            <div key={model} style={{
              background: '#1f0a0a', border: '1px solid #401a1a',
              borderRadius: 'var(--radius-lg)', padding: 20,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fca5a5', marginBottom: 8 }}>{model}</div>
              <div style={{ fontSize: 12, color: '#f87171' }}>Error: {r.error}</div>
            </div>
          )

          const ev     = r?.evaluation || {}
          const qs     = r?.questions  || []
          const accPct = ev.classifier_accuracy != null
            ? Math.round(ev.classifier_accuracy * 100)
            : null

          return (
            <div key={model} style={{
              background: 'var(--bg-1)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: 18, display: 'flex',
              flexDirection: 'column', gap: 14,
            }}>
              {/* Model header */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cream)', marginBottom: 4 }}>
                  {model}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: 'var(--cream-faint)' }}>
                    {r?.latency_sec}s
                  </span>
                  {accPct != null && (
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: accPct >= 80 ? '#4ade80' : accPct >= 60 ? 'var(--gold)' : '#f87171',
                    }}>
                      {accPct}% on-level
                    </span>
                  )}
                  {ev.avg_question_quality != null && (
                    <span style={{ fontSize: 11, color: '#60a5fa' }}>
                      quality {(ev.avg_question_quality * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Questions */}
              {qs.map((q, i) => (
                <div key={i} style={{
                  background: 'var(--bg-2)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: '12px 14px',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color, marginBottom: 8 }}>
                    Q{i + 1}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem',
                    color: 'var(--cream)', lineHeight: 1.5, marginBottom: 12 }}>
                    {q.question}
                  </div>
                  {Object.entries(q.options || {}).map(([k, v]) => (
                    <div key={k} style={{
                      display: 'flex', gap: 8, padding: '6px 10px',
                      marginBottom: 4, borderRadius: 6,
                      background: k === q.correct_answer ? '#0d1f19' : 'transparent',
                      border: k === q.correct_answer ? '1px solid #1d9e7544' : '1px solid transparent',
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color,
                        minWidth: 16, flexShrink: 0 }}>{k}</span>
                      <span style={{ fontSize: 12, color: k === q.correct_answer ? '#6ee7b7' : 'var(--cream-faint)' }}>
                        {v}
                      </span>
                    </div>
                  ))}
                  {q.bloom_justification && (
                    <div style={{ marginTop: 10, fontSize: 11, color: '#c4b5fd',
                      background: '#1a1320', border: '1px solid #3a2a50',
                      borderRadius: 6, padding: '8px 10px', lineHeight: 1.5 }}>
                      {q.bloom_justification}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {comparison.drive_link && (
        <p style={{ fontSize: 12, color: '#4ade80', marginTop: 14 }}>
          Saved to Google Drive{' '}
          <a href={comparison.drive_link} target="_blank" rel="noreferrer"
            style={{ color: '#60a5fa' }}>View file</a>
        </p>
      )}
    </div>
  )
}
