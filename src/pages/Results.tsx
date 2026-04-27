import { useState } from 'react'
import type { AnalysisResult, MetricKey } from '../lib/types'

const LABELS: Record<MetricKey, string> = {
  fluency: 'Fluency',
  clarity: 'Clarity',
  coherence: 'Coherence',
  conciseness: 'Conciseness',
  language_use: 'Language use',
  empathy: 'Empathy',
}

const scoreColor = (s: number) => s >= 75 ? '#639922' : s >= 50 ? '#BA7517' : '#E24B4A'

interface MetricCardProps {
  name: MetricKey
  score: number
  onClick: (name: MetricKey) => void
}

function MetricCard({ name, score, onClick }: MetricCardProps) {
  return (
    <div
      onClick={() => onClick(name)}
      style={{ background: '#f7f7f5', borderRadius: 8, padding: '10px 12px', cursor: 'pointer' }}
    >
      <p style={{ fontSize: 11, color: '#aaa', margin: '0 0 4px' }}>{LABELS[name]}</p>
      <p style={{ fontSize: 20, fontWeight: 500, color: '#111', margin: '0 0 6px' }}>
        {score}<span style={{ fontSize: 12, fontWeight: 400, color: '#aaa' }}>/100</span>
      </p>
      <div style={{ height: 3, background: '#e0e0e0', borderRadius: 2 }}>
        <div style={{ width: `${score}%`, height: '100%', background: scoreColor(score), borderRadius: 2 }} />
      </div>
    </div>
  )
}

interface ResultsProps {
  result: AnalysisResult
  onBack: () => void
}

export default function Results({ result, onBack }: ResultsProps) {
  const [selected, setSelected] = useState<MetricKey | null>(null)
  const { metrics, filler_words, pitch_assessment, biggest_issue, whats_working, pitchSummary, duration } = result

  if (selected) {
    const d = metrics[selected]
    return (
      <div style={{ maxWidth: 400, margin: '0 auto', padding: '2rem 1rem' }}>
        <button
          onClick={() => setSelected(null)}
          style={{ background: 'none', border: 'none', fontSize: 13, color: '#888', cursor: 'pointer', padding: 0, marginBottom: '1.5rem' }}
        >
          ← Back
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 500, margin: '0 0 1.5rem' }}>{LABELS[selected]}</h2>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: '1.5rem' }}>
          <span style={{ fontSize: 48, fontWeight: 500, color: scoreColor(d.score) }}>{d.score}</span>
          <span style={{ fontSize: 16, color: '#aaa' }}>/100</span>
        </div>
        <div style={{ background: '#f7f7f5', borderRadius: 8, padding: 12, marginBottom: 10 }}>
          <p style={{ fontSize: 11, color: '#aaa', margin: '0 0 6px' }}>Evidence</p>
          <p style={{ fontSize: 13, color: '#333', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>&#34;{d.evidence}&#34;</p>
        </div>
        <div style={{ background: '#EEEDFE', borderRadius: 8, padding: 12 }}>
          <p style={{ fontSize: 11, color: '#534AB7', margin: '0 0 6px' }}>Fix</p>
          <p style={{ fontSize: 13, color: '#3C3489', margin: 0, lineHeight: 1.6 }}>{d.fix}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>Session</h1>
        <span style={{ fontSize: 12, color: '#aaa' }}>{Math.floor(duration / 60)}m {duration % 60}s</span>
      </div>

      {pitchSummary && (
        <div style={{ background: '#f7f7f5', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
          <p style={{ fontSize: 11, color: '#aaa', margin: '0 0 6px' }}>Pitch · A₄ = 440 Hz reference</p>
          <div style={{ display: 'flex', gap: 16 }}>
            {(['avg', 'variance', 'min', 'max'] as const).map(k => (
              <div key={k}>
                <p style={{ fontSize: 11, color: '#aaa', margin: '0 0 2px' }}>{k === 'variance' ? 'range' : k}</p>
                <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>
                  {pitchSummary[k]}{k === 'avg' || k === 'variance' ? ' Hz' : ''}
                </p>
              </div>
            ))}
          </div>
          {pitch_assessment && (
            <p style={{ fontSize: 12, color: '#666', margin: '8px 0 0', lineHeight: 1.5 }}>{pitch_assessment}</p>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginBottom: 12 }}>
        {(Object.keys(metrics) as MetricKey[]).map(k => (
          <MetricCard key={k} name={k} score={metrics[k].score} onClick={setSelected} />
        ))}
      </div>

      {filler_words?.detected?.length > 0 && (
        <div style={{ background: '#f7f7f5', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
          <p style={{ fontSize: 11, color: '#aaa', margin: '0 0 6px' }}>Filler words</p>
          <p style={{ fontSize: 13, color: '#333', margin: 0 }}>
            {filler_words.detected.map(w => `"${w}" ×${filler_words.counts[w]}`).join(' · ')}
          </p>
        </div>
      )}

      <div style={{ background: '#FCEBEB', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 500, color: '#A32D2D', margin: '0 0 3px' }}>Biggest issue</p>
        <p style={{ fontSize: 13, color: '#791F1F', margin: 0, lineHeight: 1.5 }}>{biggest_issue}</p>
      </div>

      <div style={{ background: '#EAF3DE', borderRadius: 8, padding: '10px 12px', marginBottom: '1.5rem' }}>
        <p style={{ fontSize: 11, fontWeight: 500, color: '#3B6D11', margin: '0 0 3px' }}>What&#39;s working</p>
        <p style={{ fontSize: 12, color: '#27500A', margin: 0, lineHeight: 1.5 }}>{whats_working}</p>
      </div>

      <button
        onClick={onBack}
        style={{ width: '100%', padding: 10, fontSize: 13, background: 'transparent', border: '0.5px solid #ccc', borderRadius: 8, cursor: 'pointer' }}
      >
        New session
      </button>
    </div>
  )
}
