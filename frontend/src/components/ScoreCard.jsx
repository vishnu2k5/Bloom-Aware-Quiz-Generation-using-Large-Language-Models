import axios from 'axios'

const BLOOM_COLORS = {
  1: '#94a3b8', 2: '#60a5fa', 3: '#34d399',
  4: '#fbbf24', 5: '#f97316', 6: '#c084fc',
}
const BLOOM_NAMES = {
  1:'Remember', 2:'Understand', 3:'Apply', 4:'Analyze', 5:'Evaluate', 6:'Create'
}

export default function ScoreCard({ sessionId, scores, onDismiss }) {
  if (!scores || scores.length === 0) return null

  const total   = scores.length
  const correct = scores.filter(s => s.is_correct).length
  const pct     = Math.round((correct / total) * 100)

  // Group by bloom level
  const byLevel = {}
  scores.forEach(s => {
    const lvl = s.bloom_level || 1
    if (!byLevel[lvl]) byLevel[lvl] = { total: 0, correct: 0 }
    byLevel[lvl].total++
    if (s.is_correct) byLevel[lvl].correct++
  })

  const grade = pct >= 90 ? 'Excellent' : pct >= 75 ? 'Good' : pct >= 60 ? 'Satisfactory' : 'Needs work'
  const gradeColor = pct >= 90 ? '#4ade80' : pct >= 75 ? 'var(--gold)' : pct >= 60 ? '#60a5fa' : '#f87171'

  const saveScores = async () => {
    if (!sessionId) return
    try {
      await axios.post('/api/scores', {
        session_id: sessionId,
        scores: scores.map(s => ({
          question_id:    s.questionId || 0,
          question_text:  s.questionText || '',
          bloom_level:    s.bloom_level || 1,
          selected_ans:   s.selectedAns || null,
          correct_ans:    s.correctAns || '',
          is_correct:     s.is_correct,
          time_taken_sec: s.timeTaken || null,
        })),
      })
    } catch {}
  }

  // Auto-save when rendered
  if (sessionId) saveScores()

  return (
    <div style={{
      background: 'var(--bg-1)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '28px 28px 24px',
      marginBottom: 24,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem',
            fontWeight: 300, color: 'var(--cream)', marginBottom: 4 }}>
            Quiz complete
          </div>
          <div style={{ fontSize: 12, color: 'var(--cream-faint)' }}>
            {correct} of {total} correct
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem',
            fontWeight: 300, color: gradeColor, lineHeight: 1 }}>
            {pct}%
          </div>
          <div style={{ fontSize: 12, color: gradeColor, marginTop: 4, fontWeight: 600 }}>
            {grade}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background: 'var(--bg-3)', borderRadius: 4, height: 6, marginBottom: 20 }}>
        <div style={{
          width: `${pct}%`, background: gradeColor,
          borderRadius: 4, height: '100%',
          transition: 'width 0.8s ease',
        }} />
      </div>

      {/* Bloom breakdown */}
      {Object.keys(byLevel).length > 1 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--cream-faint)', marginBottom: 10 }}>
            Breakdown by level
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(byLevel).map(([lvl, data]) => {
              const lpct = Math.round((data.correct / data.total) * 100)
              return (
                <div key={lvl} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 70, fontSize: 11, color: BLOOM_COLORS[lvl],
                    fontWeight: 600, flexShrink: 0 }}>
                    L{lvl} {BLOOM_NAMES[lvl]}
                  </div>
                  <div style={{ flex: 1, background: 'var(--bg-3)', borderRadius: 3, height: 14 }}>
                    <div style={{
                      width: `${lpct}%`, background: BLOOM_COLORS[lvl],
                      borderRadius: 3, height: '100%', opacity: 0.75, minWidth: data.correct > 0 ? 4 : 0,
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--cream-dim)', width: 50, textAlign: 'right' }}>
                    {data.correct}/{data.total} ({lpct}%)
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            marginTop: 16, background: 'transparent',
            border: '1px solid var(--border)', borderRadius: 8,
            color: 'var(--cream-faint)', fontFamily: 'var(--font-ui)',
            fontSize: 12, padding: '8px 18px', cursor: 'pointer',
          }}
        >
          Close
        </button>
      )}
    </div>
  )
}
