import { useState } from 'react'

export default function QuestionCard({ q, index, levelColor, levelName, onAnswer }) {
  const [selected,  setSelected]  = useState(null)
  const [checked,   setChecked]   = useState(false)
  const [revealed,  setRevealed]  = useState(false)

  const options = Object.entries(q.options || {})
  const correct = q.correct_answer

  const handleCheck = () => {
    if (!selected) return
    setChecked(true)
    const isCorrect = selected === correct
    if (onAnswer) onAnswer(selected, correct, isCorrect)
  }

  const handleReveal = () => {
    setRevealed(true)
    if (!checked && onAnswer) {
      onAnswer(selected || null, correct, selected === correct)
    }
  }

  const getOptClass = (key) => {
    if (!checked && !revealed) return selected === key ? 'q-option selected' : 'q-option'
    if (key === correct)                           return 'q-option correct'
    if (key === selected && key !== correct)       return 'q-option incorrect'
    return 'q-option'
  }

  return (
    <div
      className="q-card fade-up"
      style={{ animationDelay: `${index * 0.06}s`, opacity: 0 }}
    >
      <div className="q-header">
        <span
          className="q-num"
          style={{ background: `${levelColor}18`, color: levelColor, border: `1px solid ${levelColor}44` }}
        >
          Q{q.id ?? index + 1}
        </span>
        <p className="q-text">{q.question}</p>
      </div>

      <div className="q-options">
        {options.map(([key, val]) => (
          <button
            key={key}
            className={getOptClass(key)}
            disabled={checked || revealed}
            onClick={() => !checked && !revealed && setSelected(key)}
          >
            <span className="opt-key">{key}</span>
            <span className="opt-text">{val}</span>
          </button>
        ))}
      </div>

      <div className="q-actions">
        {!checked && !revealed && (
          <>
            <button
              className="btn-check primary"
              disabled={!selected}
              onClick={handleCheck}
            >
              Check Answer
            </button>
            <button className="btn-check" onClick={handleReveal}>
              Reveal
            </button>
          </>
        )}
        {checked && !revealed && (
          <button className="btn-check" onClick={() => setRevealed(true)}>
            Show Explanation
          </button>
        )}
      </div>

      {revealed && (
        <div className="q-reveal">
          <div className="reveal-row">
            <div className="reveal-label">Explanation</div>
            <div className="reveal-text">{q.explanation}</div>
          </div>
          <div className="reveal-row">
            <div className="reveal-label">Bloom Justification</div>
            <div className="reveal-bloom" style={{ color: levelColor, fontSize: 13, lineHeight: 1.6 }}>
              {q.bloom_justification}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
