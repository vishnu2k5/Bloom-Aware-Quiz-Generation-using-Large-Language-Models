const PROVIDER_META = {
  groq:   { label: '⚡ Groq',   cls: 'tag-groq',   hint: 'Cloud · 30 req/min · Fastest' },
  gemini: { label: '✦ Gemini', cls: 'tag-gemini', hint: 'Cloud · 15 req/min · Best free quality' },
  ollama: { label: '◈ Local',  cls: 'tag-ollama', hint: 'Offline · Unlimited · Your GPU' },
}

export default function ModelSelector({ models, selectedModel, setSelectedModel }) {
  const current = models.find(m => m.label === selectedModel)
  const meta     = current ? PROVIDER_META[current.provider] : null

  return (
    <div>
      <select
        className="model-select"
        value={selectedModel}
        onChange={e => setSelectedModel(e.target.value)}
      >
        {models.map(m => (
          <option key={m.label} value={m.label}>
            {m.label}
          </option>
        ))}
      </select>
      {meta && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <span className={`provider-tag ${meta.cls}`}>{meta.label}</span>
          <span style={{ fontSize: 11, color: 'var(--cream-faint)' }}>{meta.hint}</span>
        </div>
      )}
    </div>
  )
}
