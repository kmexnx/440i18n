import { useRef, useState, useCallback } from 'react'
import type { PitchReading, NoteReading, PitchSummary } from '../lib/types'

const A4 = 440
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

function hzToNote(hz: number): NoteReading | null {
  if (!hz || hz < 50) return null
  const semi = Math.round(12 * Math.log2(hz / A4))
  return {
    note: NOTES[((semi % 12) + 12) % 12],
    octave: Math.floor(semi / 12) + 4,
    hz: Math.round(hz),
  }
}

function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length
  let rms = 0
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i]
  rms = Math.sqrt(rms / SIZE)
  if (rms < 0.01) return -1

  let r1 = 0, r2 = SIZE - 1
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < 0.2) { r1 = i; break }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < 0.2) { r2 = SIZE - i; break }
  }

  const b = buf.slice(r1, r2)
  const c = new Float32Array(b.length * 2)
  for (let i = 0; i < b.length; i++) {
    for (let j = 0; j < b.length; j++) c[i + j] += b[i] * b[j]
  }

  const d = c.slice(b.length)
  let pd = 0
  while (pd < d.length && d[pd] > d[pd + 1]) pd++
  let maxval = -1, maxpos = -1
  for (let i = pd; i < d.length; i++) {
    if (d[i] > maxval) { maxval = d[i]; maxpos = i }
  }

  let T0 = maxpos
  const a = (d[T0 - 1] + d[T0 + 1] - 2 * d[T0]) / 2
  const b2 = (d[T0 + 1] - d[T0 - 1]) / 2
  if (a) T0 = T0 - b2 / (2 * a)
  return sampleRate / T0
}

interface AudioRefs {
  ctx?: AudioContext
  analyser?: AnalyserNode
  stream?: MediaStream
  raf?: number
}

export function usePitchDetector() {
  const [pitchHistory, setPitchHistory] = useState<PitchReading[]>([])
  const [currentPitch, setCurrentPitch] = useState<NoteReading | null>(null)
  const refs = useRef<AudioRefs>({})

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const ctx = new AudioContext()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 2048
    ctx.createMediaStreamSource(stream).connect(analyser)
    refs.current = { ctx, analyser, stream }

    const buf = new Float32Array(analyser.fftSize)
    const detect = () => {
      analyser.getFloatTimeDomainData(buf)
      const hz = autoCorrelate(buf, ctx.sampleRate)
      if (hz > 50 && hz < 1000) {
        const note = hzToNote(hz)
        if (note) setCurrentPitch(note)
        setPitchHistory(p => [...p.slice(-200), { hz: Math.round(hz), t: Date.now() }])
      }
      refs.current.raf = requestAnimationFrame(detect)
    }
    detect()
  }, [])

  const stop = useCallback(() => {
    const { ctx, analyser, stream, raf } = refs.current
    if (raf) cancelAnimationFrame(raf)
    if (analyser) analyser.disconnect()
    if (ctx) void ctx.close()
    if (stream) stream.getTracks().forEach(t => t.stop())
    setCurrentPitch(null)
  }, [])

  const getSummary = useCallback((): PitchSummary | null => {
    if (!pitchHistory.length) return null
    const v = pitchHistory.map(p => p.hz)
    const avg = Math.round(v.reduce((a, b) => a + b, 0) / v.length)
    const min = Math.min(...v)
    const max = Math.max(...v)
    return { avg, min, max, variance: Math.round(max - min), samples: v.length }
  }, [pitchHistory])

  return { currentPitch, pitchHistory, start, stop, getSummary }
}
