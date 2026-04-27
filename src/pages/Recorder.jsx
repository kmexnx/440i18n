import { useState, useEffect, useRef } from 'react'
import { usePitchDetector } from '../hooks/usePitchDetector'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { analyzeSession } from '../lib/analyze'
import { supabase } from '../lib/supabase'

const LANGS = [
  { code: 'en-US', label: 'EN' }, { code: 'es-MX', label: 'ES' },
  { code: 'fr-FR', label: 'FR' }, { code: 'de-DE', label: 'DE' }, { code: 'pt-BR', label: 'PT' },
]

export default function Recorder({ onResult }) {
  const [lang, setLang] = useState('en-US')
  const [recording, setRecording] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [timer, setTimer] = useState(0)
  const [error, setError] = useState(null)
  const timerRef = useRef(null)
  const pitch = usePitchDetector()
  const speech = useSpeechRecognition({ language: lang })

  useEffect(() => {
    if (recording) timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    else clearInterval(timerRef.current)
    return () => clearInterval(timerRef.current)
  }, [recording])

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  async function start() {
    setError(null); speech.reset(); setTimer(0)
    try { await pitch.start(); speech.start(); setRecording(true) }
    catch { setError('Microphone access denied.') }
  }

  async function stop() {
    pitch.stop(); speech.stop(); setRecording(false)
    if (!speech.transcript || speech.transcript.trim().length < 30) {
      setError('Too short. Speak for at least 15 seconds.'); return
    }
    setAnalyzing(true)
    try {
      const pitchSummary = pitch.getSummary()
      const result = await analyzeSession({ transcript: speech.transcript, pitchData: pitchSummary, language: lang.split('-')[0] })
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await supabase.from('sessions').insert({
        user_id: user.id, transcript: speech.transcript, language: lang.split('-')[0],
        duration_seconds: timer, scores: result.metrics, pitch_data: pitchSummary,
        filler_words: result.filler_words, pronunciation_flags: result.pronunciation_flags,
        biggest_issue: result.biggest_issue, whats_working: result.whats_working,
      })
      onResult({ ...result, transcript: speech.transcript, pitchSummary, duration: timer })
    } catch { setError('Analysis failed. Check your API key.') }
    setAnalyzing(false)
  }

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>440i18n</h1>
        <div style={{ display: 'flex', gap: 4 }}>
          {LANGS.map(l => (
            <button key={l.code} onClick={() => !recording && setLang(l.code)} style={{
              fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 20,
              border: lang === l.code ? 'none' : '0.5px solid #ccc',
              background: lang === l.code ? '#EEEDFE' : 'transparent',
              color: lang === l.code ? '#3C3489' : '#888', cursor: recording ? 'default' : 'pointer',
            }}>{l.label}</button>
          ))}
        </div>
      </div>
      <div style={{ textAlign: 'center', padding: '2rem 0' }}>
        <button onClick={recording ? stop : start} disabled={analyzing} style={{
          width: 80, height: 80, borderRadius: '50%', border: 'none',
          background: recording ? '#FCEBEB' : '#EEEDFE',
          cursor: analyzing ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
        }}>
          {analyzing ? <div style={{ width: 20, height: 20, border: '2px solid #ccc', borderTopColor: '#666', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          : recording ? <div style={{ width: 20, height: 20, background: '#A32D2D', borderRadius: 3 }} />
          : <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3C3489" strokeWidth="1.5" strokeLinecap="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
            </svg>}
        </button>
        <p style={{ fontSize: 22, fontWeight: 500, margin: '1rem 0 0', color: recording ? '#A32D2D' : '#111' }}>
          {analyzing ? 'Analyzing...' : fmt(timer)}
        </p>
        {recording && pitch.currentPitch && (
          <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>
            {pitch.currentPitch.note}{pitch.currentPitch.octave} · {pitch.currentPitch.hz} Hz
          </p>
        )}
        <p style={{ fontSize: 12, color: '#aaa', margin: '8px 0 0' }}>
          {analyzing ? 'Running analysis...' : recording ? 'Tap to stop' : 'Tap to record'}
        </p>
      </div>
      {speech.transcript && (
        <div style={{ background: '#f7f7f5', borderRadius: 8, padding: '10px 12px', marginBottom: '1rem' }}>
          <p style={{ fontSize: 11, color: '#aaa', margin: '0 0 4px' }}>Transcript</p>
          <p style={{ fontSize: 13, margin: 0, lineHeight: 1.6, color: '#333' }}>{speech.transcript.slice(-200)}{speech.transcript.length > 200 ? '...' : ''}</p>
        </div>
      )}
      {error && <div style={{ background: '#FCEBEB', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#A32D2D' }}>{error}</div>}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
