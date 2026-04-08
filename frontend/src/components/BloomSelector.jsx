export default function BloomSelector({ levels, selected, setSelected }) {
  return (
    <div className="bloom-grid">
      {levels.map(lvl => {
        const active = selected === lvl.level
        return (
          <button
            key={lvl.level}
            className={`bloom-btn${active ? ' active' : ''}`}
            style={{ color: lvl.color, borderColor: active ? lvl.color : undefined }}
            onClick={() => setSelected(lvl.level)}
          >
            <div className="bloom-level-num">L{lvl.level}</div>
            <div className="bloom-level-name">{lvl.name}</div>
            <div className="bloom-verb">{lvl.verbs.slice(0, 2).join(', ')}</div>
          </button>
        )
      })}
    </div>
  )
}
