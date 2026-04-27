import { callAnthropic } from './providers/anthropic'
import { callOpenAI } from './providers/openai'
import { callGemini } from './providers/gemini'
import { callOllama } from './providers/ollama'
import type { LLMCallParams, AnalysisResult, PitchSummary } from './types'

type Provider = (params: LLMCallParams) => Promise<string>

const PROVIDERS: Record<string, Provider> = {
  anthropic: callAnthropic,
  openai: callOpenAI,
  gemini: callGemini,
  ollama: callOllama,
}

const SYSTEM_PROMPT = `You are a brutally honest speech coach. No sugarcoating, no generic advice, no consolation prizes.

Analyze the transcript and return ONLY valid JSON — no markdown, no backticks, no preamble.

{
  "metrics": {
    "fluency": { "score": 0, "evidence": "direct quote", "fix": "actionable fix, max 2 sentences" },
    "clarity": { "score": 0, "evidence": "", "fix": "" },
    "coherence": { "score": 0, "evidence": "", "fix": "" },
    "conciseness": { "score": 0, "evidence": "", "fix": "" },
    "language_use": { "score": 0, "evidence": "", "fix": "" },
    "empathy": { "score": 0, "evidence": "", "fix": "" }
  },
  "filler_words": { "detected": [], "counts": {}, "worst_offender": "" },
  "pronunciation_flags": [],
  "native_language_detected": "",
  "non_native_patterns": [],
  "pitch_assessment": "",
  "biggest_issue": "one sentence, brutal and specific",
  "whats_working": "one sentence, genuine"
}

Rules: evidence = direct quote. fixes = actionable in 5 minutes. never say consider or try to. if under 30 words return { "error": "too_short" }.`

interface AnalyzeParams {
  transcript: string
  pitchData: PitchSummary | null
  language?: string
}

export async function analyzeSession({ transcript, pitchData, language = 'en' }: AnalyzeParams): Promise<Omit<AnalysisResult, 'transcript' | 'pitchSummary' | 'duration'>> {
  if (!transcript || transcript.trim().split(' ').length < 15) {
    throw new Error('too_short')
  }

  const provider = (import.meta.env.VITE_LLM_PROVIDER as string) ?? 'anthropic'
  const call = PROVIDERS[provider]
  if (!call) throw new Error(`Unknown provider: ${provider}`)

  const prompt = `Language: ${language}\nTranscript: "${transcript}"\nPitch data: ${JSON.stringify(pitchData)}`

  const raw = await call({
    prompt,
    system: SYSTEM_PROMPT,
    model: import.meta.env.VITE_LLM_MODEL as string | undefined,
    apiKey: import.meta.env.VITE_LLM_API_KEY as string | undefined,
  })

  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch {
    throw new Error('parse_error')
  }
}
