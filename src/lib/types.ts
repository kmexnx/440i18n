export interface MetricScore {
  score: number
  evidence: string
  fix: string
}

export interface FillerWords {
  detected: string[]
  counts: Record<string, number>
  worst_offender: string
}

export interface PitchSummary {
  avg: number
  min: number
  max: number
  variance: number
  samples: number
}

export interface PitchReading {
  hz: number
  t: number
}

export interface NoteReading {
  note: string
  octave: number
  hz: number
}

export interface AnalysisResult {
  metrics: {
    fluency: MetricScore
    clarity: MetricScore
    coherence: MetricScore
    conciseness: MetricScore
    language_use: MetricScore
    empathy: MetricScore
  }
  filler_words: FillerWords
  pronunciation_flags: string[]
  native_language_detected: string
  non_native_patterns: string[]
  pitch_assessment: string
  biggest_issue: string
  whats_working: string
  transcript: string
  pitchSummary: PitchSummary | null
  duration: number
}

export interface LLMCallParams {
  prompt: string
  system: string
  model?: string
  apiKey?: string
}

export type MetricKey = keyof AnalysisResult['metrics']
