import { useState } from 'react'

const BLOOM_COLORS = {
  1: '#94a3b8', 2: '#60a5fa', 3: '#34d399',
  4: '#fbbf24', 5: '#f97316', 6: '#c084fc',
}
const BLOOM_NAMES = {
  1:'Remember', 2:'Understand', 3:'Apply', 4:'Analyze', 5:'Evaluate', 6:'Create'
}
const DIFFICULTIES = ['easy', 'medium', 'hard']

export default function MultiLevelBuilder({ levels, onBuild }) {
  const [counts, setCounts] = useState({ 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 })
  const [diff,   setDiff]   = useState('medium')

  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  const update = (lvl, val) => {
    const v = Math.max(0, Math.min(5, parseInt(val) || 0))
    setCounts(c => ({ ...c, [lvl]: v }))
  }

  const handleBuild = () => {
    const specs = Object.entries(counts)
      .filter(([, c]) => c > 0)
      .map(([lvl, count]) => ({ level: parseInt(lvl), count, difficulty: diff }))
    onBuild(specs)
  }

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'var(--cream-faint)', marginBottom: 12 }}>
        Questions per level
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {[1,2,3,4,5,6].map(lvl => (
          <div key={lvl} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 6,
              background: `${BLOOM_COLORS[lvl]}22`,
              border: `1px solid ${BLOOM_COLORS[lvl]}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: BLOOM_COLORS[lvl], flexShrink: 0,
            }}>
              {lvl}
            </div>
            <div style={{ flex: 1, fontSize: 12, color: counts[lvl] > 0 ? 'var(--cream)' : 'var(--cream-faint)' }}>
              {BLOOM_NAMES[lvl]}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => update(lvl, counts[lvl] - 1)}
                style={{
                  width: 24, height: 24, background: 'var(--bg-3)',
                  border: '1px solid var(--border)', borderRadius: 6,
                  color: 'var(--cream-dim)', cursor: 'pointer', fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >−</button>
              <span style={{
                width: 24, textAlign: 'center', fontSize: 14,
                fontFamily: 'var(--font-display)', fontWeight: 300,
                color: counts[lvl] > 0 ? BLOOM_COLORS[lvl] : 'var(--cream-faint)',
              }}>
                {counts[lvl]}
              </span>
              <button
                onClick={() => update(lvl, counts[lvl] + 1)}
                style={{
                  width: 24, height: 24, background: 'var(--bg-3)',
                  border: '1px solid var(--border)', borderRadius: 6,
                  color: 'var(--cream-dim)', cursor: 'pointer', fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >+</button>
            </div>
          </div>
        ))}
      </div>

      {/* Difficulty */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--cream-faint)', marginBottom: 8 }}>
          Difficulty
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {DIFFICULTIES.map(d => (
            <button
              key={d}
              onClick={() => setDiff(d)}
              style={{
                flex: 1, padding: '8px 0',
                background: diff === d ? 'var(--gold-glow)' : 'var(--bg)',
                border: diff === d ? '1.5px solid var(--gold)' : '1px solid var(--border)',
                borderRadius: 8, color: diff === d ? 'var(--gold)' : 'var(--cream-faint)',
                fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', textTransform: 'capitalize',
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Total + build */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', background: 'var(--bg-2)', borderRadius: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--cream-faint)' }}>Total questions</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem',
          fontWeight: 300, color: total > 0 ? 'var(--gold)' : 'var(--cream-faint)' }}>
          {total}
        </span>
      </div>

      <button
        className="btn-generate"
        disabled={total === 0}
        onClick={handleBuild}
        style={{ fontSize: 13 }}
      >
        Build Multi-Level Quiz
      </button>
    </div>
  )
}
